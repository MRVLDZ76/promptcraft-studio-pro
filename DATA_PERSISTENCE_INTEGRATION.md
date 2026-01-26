# Data Persistence & History Integration Guide

**Date**: January 26, 2026  
**Status**: Ready for Integration  
**Version**: 1.0

## Overview

This guide explains how to integrate the new data persistence layer into PromptCraft Studio Pro. The system automatically saves transcriptions, analyses, assets, and results to Supabase for later review and reuse.

---

## Architecture

### Database Schema
Four new tables created via migration `20260126_history_persistence.sql`:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `asset_uploads` | Track uploaded videos/audio/documents | `user_id`, `asset_type`, `content_hash`, `analysis_count` |
| `transcription_history` | Store transcription text with metadata | `transcription_text`, `source_api`, `confidence_score`, `is_cached` |
| `analysis_history` | Store full analysis results snapshot | `score_participant_a`, `score_participant_b`, `winner`, `full_result_json` |
| `analysis_result_cache` | Keyed cache for rapid retrieval | `cache_key`, `result_json`, `hit_count`, `expires_at` |

### Service Layer
- **`historyService.ts`**: 35+ CRUD functions for all operations
- **`resultPersistenceService.ts`**: High-level persistence middleware with auto-caching
- **`useAnalysisPersistence.ts`**: React hook for UI integration
- **`HistoryPanel.tsx`**: UI component for browsing history

---

## Step 1: Deploy Database Migration

### Option A: Using Supabase CLI
```bash
cd c:\Users\Elena\promptStudio\promptcraft-studio-pro
supabase migration list
supabase db push
```

### Option B: Manual Deployment
1. Log into Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/20260126_history_persistence.sql`
4. Paste and execute in SQL Editor
5. Verify 4 new tables created: `asset_uploads`, `transcription_history`, `analysis_history`, `analysis_result_cache`

### Validation Query
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('asset_uploads', 'transcription_history', 'analysis_history', 'analysis_result_cache');
```

Expected: 4 rows returned

---

## Step 2: Import Services in Components

### Example: AnalysisStudio.tsx

```typescript
import { persistAnalysisResult, checkCachedAnalysis } from '../services/resultPersistenceService';
import { useAnalysisPersistence } from '../services/useAnalysisPersistence';

export function AnalysisStudio() {
  const userId = useAuth().user?.id; // Get from your auth context
  const { saveAnalysis, tryGetCachedResult, isSaving } = useAnalysisPersistence({
    userId,
    autoSave: true,
    enableCache: true,
    onSaveSuccess: (result) => console.log('Saved:', result),
  });

  // ... rest of component
}
```

---

## Step 3: Add Cache-Check Before Analysis

### Before Analysis (Check Cache)

```typescript
async function handleAnalyze(params: AnalysisParams) {
  const { transcript, prompt, wsdcWeights, transcriptId } = params;

  // ✨ Check cache FIRST
  const cachedResult = await tryGetCachedResult(
    transcriptId,
    prompt,
    wsdcWeights
  );

  if (cachedResult) {
    console.log('🚀 Using cached result - skipping API call');
    setAnalysisResult(cachedResult);
    setCacheHit(true);
    return;
  }

  // If no cache hit, proceed with analysis
  setLoading(true);
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    // ... continue with result display
  } finally {
    setLoading(false);
  }
}
```

---

## Step 4: Save Results After Analysis

### After Analysis Completes

```typescript
async function handleAnalysisComplete(analysisResult: any) {
  // Auto-save with all metadata
  const saved = await saveAnalysis({
    assetId: currentAsset?.id,
    transcriptionId: transcript?.id,
    videoTranscriptId: videoTranscript?.id,
    
    participantA: { 
      name: participantA.name, 
      handle: participantA.handle 
    },
    participantB: participantB ? { 
      name: participantB.name, 
      handle: participantB.handle 
    } : undefined,
    
    mode: analysisMode, // 'arena' or 'solo'
    wsdcWeights: {
      content: weights.content,
      style: weights.style,
      strategy: weights.strategy,
    },
    
    calibrationSettings: currentCalibration,
    prompt: customPrompt || defaultPrompt,
    analysisName: analysisName || `${participantA.name} Analysis`,
    transcript: transcript?.text,
    resultJson: analysisResult,
    
    processingTimeMs: Date.now() - startTime,
    tokensUsed: analysisResult.metadata?.tokens,
    apiCostUsd: analysisResult.metadata?.cost,
    tags: selectedTags,
  });

  console.log('✅ Analysis saved:', saved.savedAnalysis.id);
  
  // Show success toast
  showNotification('Analysis saved to history!');
}
```

---

## Step 5: Add History Panel to UI

### In Your Layout Component

```typescript
import { HistoryPanel } from '../components/HistoryPanel';

export function MainLayout() {
  const userId = useAuth().user?.id;
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen">
      {/* Main workbench */}
      <div className="lg:col-span-3">
        <AnalysisStudio />
      </div>

      {/* History sidebar */}
      <div className="lg:col-span-1 min-h-0">
        <HistoryPanel
          userId={userId}
          onSelectAnalysis={(analysis) => {
            setSelectedAnalysis(analysis);
            // Load analysis into editor for review/reuse
          }}
          onReuse={(transcriptId) => {
            // Reload transcription for new analysis
          }}
          compact={false}
        />
      </div>
    </div>
  );
}
```

### For Compact Dashboard View

```typescript
<HistoryPanel
  userId={userId}
  compact={true}  // Shows only stats card
/>
```

---

## Step 6: Handle Asset Uploads

### When User Uploads a File

```typescript
import { saveAssetUpload } from '../services/historyService';
import { hashContent } from '../services/resultPersistenceService';

async function handleFileUpload(file: File) {
  setUploading(true);
  
  try {
    // Read file for hashing
    const buffer = await file.arrayBuffer();
    const contentHash = hashContent(new TextDecoder().decode(buffer));

    // Save asset metadata
    const asset = await saveAssetUpload({
      user_id: userId,
      original_filename: file.name,
      asset_type: file.type.startsWith('video') ? 'video' : 'audio',
      file_size: file.size,
      content_hash: contentHash,
      mime_type: file.type,
      upload_source: 'web-ui',
      tags: ['recent', 'user-upload'],
    });

    console.log('✅ Asset saved:', asset.id);
    setCurrentAsset(asset);

    // Proceed with transcription
    await transcribeAsset(file, asset.id);
  } finally {
    setUploading(false);
  }
}
```

---

## Step 7: Reuse Transcriptions from Cache

### Load Previously Saved Transcription

```typescript
import { getUserTranscriptions } from '../services/historyService';

async function loadSavedTranscriptions() {
  const transcriptions = await getUserTranscriptions(userId);
  
  // Filter for the asset
  const assetTranscripts = transcriptions.filter(
    t => t.asset_id === currentAsset.id
  );

  if (assetTranscripts.length > 0) {
    const latest = assetTranscripts[0];
    setTranscription({
      text: latest.transcription_text,
      source: latest.source_api,
      confidence: latest.confidence_score,
      savedAt: latest.created_at,
    });
  }
}
```

---

## Step 8: Search & Filter History

### Advanced Search

```typescript
import { searchAnalysisHistory } from '../services/historyService';

async function searchAnalyses(query: string) {
  const results = await searchAnalysisHistory(userId, query);
  
  // Results include participant names, tags, dates, scores
  setSearchResults(results);
}

// Example: Find all analyses with specific participant
const analyses = await searchAnalysisHistory(userId, 'Participant Name');
```

### Get Statistics

```typescript
import { getCompleteAnalysisContext } from '../services/historyService';

async function loadDashboard() {
  const context = await getCompleteAnalysisContext(userId, assetId);
  
  console.log('Total analyses:', context.total_analyses);
  console.log('Average score:', context.average_score);
  console.log('Trending tags:', context.trending_tags);
}
```

---

## Step 9: Implement Batch Operations

### Import Multiple Analyses

```typescript
import { bulkSaveAssets } from '../services/resultPersistenceService';

async function importBatchAnalyses(analyses: any[]) {
  const result = await bulkSaveAssets(
    analyses.map(a => ({
      user_id: userId,
      original_filename: a.title,
      asset_type: 'analysis-export',
      tags: a.tags || [],
    }))
  );

  console.log(`✅ Imported ${result.successful}/${result.total}`);
}
```

---

## API Reference

### Key Functions

#### `persistAnalysisResult(payload)`
Saves analysis result to cache and history in one call.

**Parameters:**
```typescript
{
  assetId?: string;
  transcriptionId?: string;
  participantA: { name: string; handle?: string };
  participantB?: { name: string; handle?: string };
  mode: 'arena' | 'solo';
  wsdcWeights: { content: number; style: number; strategy: number };
  prompt?: string;
  transcript?: string;
  resultJson: any; // Full analysis result object
  processingTimeMs?: number;
  tokensUsed?: number;
  apiCostUsd?: number;
  tags?: string[];
}
```

**Returns:**
```typescript
{
  success: boolean;
  savedAnalysis: { id: string; ... };
  cacheKey: string;
}
```

#### `checkCachedAnalysis(transcriptId, prompt, weights, calibration)`
Returns cached result if exists and is fresh, otherwise null.

#### `useAnalysisPersistence(options)`
React hook for seamless persistence.

**Options:**
```typescript
{
  userId?: string;
  autoSave?: boolean;           // default: true
  enableCache?: boolean;        // default: true
  onSaveSuccess?: (result) => void;
  onSaveError?: (error) => void;
}
```

**Returns:**
```typescript
{
  saveAnalysis(payload): Promise<any>;
  tryGetCachedResult(...): Promise<any | null>;
  saveBatch(analyses): Promise<{ successful, failed, total }>;
  cancelSave(): void;
  isSaving: boolean;
  lastSavedId: string | null;
  cacheHit: boolean;
}
```

#### `getUserAnalysisHistory(userId, options)`
Get paginated history of user's analyses.

#### `searchAnalysisHistory(userId, query)`
Full-text search across participant names, tags, dates.

#### `getFavoriteAnalyses(userId)`
Get user's starred/favorited analyses.

#### `getUserAssets(userId)`
Get all user's uploaded assets with usage stats.

---

## Best Practices

### ✅ DO

- Call `checkCachedAnalysis()` BEFORE making API calls
- Include `tags` when saving for better searchability
- Set `analysisName` to something descriptive
- Save `processingTimeMs` for performance tracking
- Use `updateAnalysisHistory()` to mark as reviewed/favorite

### ❌ DON'T

- Bypass the persistence layer (always use `persistAnalysisResult` or hook)
- Save null/undefined values in core fields
- Ignore cache hits (respects user's time + credits)
- Leave analyses without tags or names
- Delete from history without archiving first

---

## Troubleshooting

### Q: "Table doesn't exist" error
**A:** Run `supabase db push` to deploy migration. Verify with SQL query above.

### Q: Cache always misses
**A:** Ensure you're passing exact same `prompt`, `weights`, and `calibration` objects. Even whitespace differences cause cache miss.

### Q: Saved analyses not showing up
**A:** Check browser console for save errors. Verify `user_id` is correctly set. Check Supabase RLS policies.

### Q: Performance is slow
**A:** Add indexes via migration (already included). Check for N+1 query patterns. Use `limit` parameter in queries.

---

## Deployment Checklist

- [ ] Deploy migration to Supabase
- [ ] Verify 4 new tables exist
- [ ] Import `resultPersistenceService.ts` into AnalysisStudio
- [ ] Add cache-check logic before API calls
- [ ] Add auto-save after analysis completes
- [ ] Integrate HistoryPanel into layout
- [ ] Test full workflow: upload → transcribe → analyze → save → search
- [ ] Monitor Supabase storage and query performance
- [ ] Update user documentation

---

## Performance Considerations

- **Cache TTL**: 7 days (configurable in migration)
- **Query optimization**: 28 indexes on high-cardinality columns
- **Row limits**: Use `limit` parameter to paginate results
- **Cleanup**: Expired cache entries auto-deleted via trigger

---

## Future Enhancements

- [ ] Export analyses as PDF/JSON
- [ ] Batch analysis comparison
- [ ] Custom cache invalidation rules
- [ ] Analysis versioning (branch/compare results)
- [ ] Collaborative analysis sharing
- [ ] Real-time collaboration on same analysis

---

**Questions?** Check `historyService.ts` for full function signatures and JSDoc comments.
