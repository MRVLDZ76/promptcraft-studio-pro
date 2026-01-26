# Quick Reference: Data Persistence API

## 🚀 Quick Start

### Install & Deploy
```bash
# 1. Deploy database schema
supabase db push

# 2. Services automatically available after build
```

### Import in Component
```typescript
import { useAnalysisPersistence } from '../services/useAnalysisPersistence';
import { HistoryPanel } from '../components/HistoryPanel';
```

---

## 📊 React Hook Usage

### Basic Setup
```typescript
const { saveAnalysis, tryGetCachedResult, isSaving } = useAnalysisPersistence({
  userId,
  autoSave: true,
  enableCache: true,
});
```

### Check Cache Before Analysis
```typescript
const cached = await tryGetCachedResult(
  transcriptId,
  prompt,
  wsdcWeights
);

if (cached) {
  // Use cached result
  return cached;
}
// Otherwise run analysis
```

### Save After Analysis
```typescript
await saveAnalysis({
  assetId: asset.id,
  transcriptionId: transcript.id,
  participantA: { name: 'Alice' },
  participantB: { name: 'Bob' },
  mode: 'arena',
  wsdcWeights: { content: 0.4, style: 0.3, strategy: 0.3 },
  resultJson: analysisResult,
  transcript: transcriptText,
  tags: ['debate', 'archived'],
});
```

---

## 🔍 History Service Functions

### Search & Retrieve
```typescript
import {
  getUserAnalysisHistory,
  searchAnalysisHistory,
  getFavoriteAnalyses,
  getUserAssets,
  getUserTranscriptions,
} from '../services/historyService';

// Get all user analyses
const analyses = await getUserAnalysisHistory(userId);

// Search by participant name or tag
const results = await searchAnalysisHistory(userId, 'Alice');

// Get starred items
const favorites = await getFavoriteAnalyses(userId);

// Get uploaded files
const assets = await getUserAssets(userId);

// Get transcription history
const transcripts = await getUserTranscriptions(userId);
```

### Save Data
```typescript
import {
  saveAssetUpload,
  saveAnalysisHistory,
  saveTranscriptionHistory,
} from '../services/historyService';

// Save file upload
const asset = await saveAssetUpload({
  user_id: userId,
  original_filename: 'debate.mp4',
  asset_type: 'video',
  file_size: 1024000,
});

// Save transcription
const transcript = await saveTranscriptionHistory({
  user_id: userId,
  asset_id: asset.id,
  transcription_text: 'Full transcript here...',
  source_api: 'youtube_native',
});

// Save analysis
const analysis = await saveAnalysisHistory({
  user_id: userId,
  asset_id: asset.id,
  participant_a_name: 'Alice',
  score_participant_a: 85.5,
  full_result_json: resultObj,
});
```

### Update & Delete
```typescript
// Toggle favorite
await toggleFavorite('analysis_history', analysisId, true);

// Update status
await updateAnalysisHistory(analysisId, { status: 'archived' });

// Archive instead of delete
await archiveAnalysis(analysisId);
```

---

## 🎛️ UI Component

### Full Featured
```typescript
<HistoryPanel
  userId={userId}
  onSelectAnalysis={(analysis) => console.log(analysis)}
  onReuse={(transcriptId) => reloadTranscript(transcriptId)}
/>
```

### Compact (Dashboard)
```typescript
<HistoryPanel userId={userId} compact={true} />
```

---

## 🔄 Caching Strategy

### Deterministic Cache Key
```typescript
import { generateCacheKey } from '../services/historyService';

const key = generateCacheKey(transcriptId, promptHash, configHash);
// Same transcript + prompt + config = SAME key = CACHE HIT
```

### Cache Lifecycle
```
1. Check cache: getCachedResult(key)
2. On hit: Return result + increment counter (free!)
3. On miss: Run analysis
4. Save result: saveCachedResult({ cache_key, result_json, ... })
5. Auto-expire: After 7 days
```

---

## 📈 Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Cache hit | ~50ms | Fastest - skip API |
| Search 1000 items | ~200ms | Uses GIN index |
| Save analysis | ~100ms | Async |
| Batch save 10 | ~500ms | Parallel |

---

## 🛡️ Error Handling

### Safe Patterns
```typescript
// Persistence failures don't block analysis
try {
  await saveAnalysis(data);
} catch (error) {
  console.warn('Save failed, but analysis is still displayed');
  // Continue - show result anyway
}

// Cache check fails silently
const cached = await tryGetCachedResult(...);
if (!cached) {
  // Proceed with analysis
}
```

---

## 🗂️ Database Tables

### Reference Columns

**asset_uploads**
- `id`, `user_id`, `original_filename`, `asset_type`, `analysis_count`, `content_hash`, `created_at`

**transcription_history**
- `id`, `user_id`, `asset_id`, `transcription_text`, `source_api`, `is_cached`, `confidence_score`, `word_count`

**analysis_history**
- `id`, `user_id`, `asset_id`, `participant_a_name`, `participant_b_name`, `score_participant_a`, `winner`, `full_result_json`, `tags`

**analysis_result_cache**
- `id`, `cache_key`, `result_json`, `hit_count`, `expires_at`

---

## 🔑 Key Variables to Pass

### wsdcWeights
```typescript
{
  content: 0.40,    // 40%
  style: 0.30,      // 30%
  strategy: 0.30    // 30%
}
```

### resultJson (Typical Structure)
```typescript
{
  scores: { total: { a: 85, b: 72 } },
  gamification: { winner: 'A', streak: 5 },
  fallacies: [ { speaker: 'A', type: 'ad_hominem' }, ... ],
  chain_of_thought: 'reasoning...',
  metadata: { tokens: 1200, cost: 0.05 }
}
```

---

## 🚨 Common Issues

### Cache always misses
❌ Different prompt/weights objects between calls  
✅ Ensure exact same values passed to `generateCacheKey()`

### No data saved
❌ Migration not deployed  
✅ Run `supabase db push`

### Permission denied errors
❌ User ID not set correctly  
✅ Verify `userId` matches auth context

### Missing types
❌ TypeScript errors on imported types  
✅ Import from `historyService`: `import type { AnalysisHistoryRecord } from ...`

---

## 📋 Deployment Checklist

```
☐ Run: supabase db push
☐ Verify 4 tables created
☐ Import hooks in components
☐ Add cache check before API
☐ Add auto-save after analysis
☐ Render <HistoryPanel />
☐ Test: upload → analyze → search
☐ Monitor: Supabase dashboard
```

---

## 🔗 Full Documentation

See **DATA_PERSISTENCE_INTEGRATION.md** for:
- Step-by-step integration guide
- Complete API reference
- Best practices & patterns
- Troubleshooting
- Performance tuning

---

## 💡 Pro Tips

1. **Always check cache first** - Saves cost + latency
2. **Tag your analyses** - Makes search/filtering 10x faster
3. **Use descriptive names** - "Alice vs Bob: Climate Policy Debate" > "Analysis 1"
4. **Archive old results** - Keeps searches fast
5. **Batch imports when possible** - More efficient than individual saves
6. **Monitor cache hit rate** - Dashboard shows trending metrics

---

**Last Updated**: January 26, 2026  
**Status**: Production Ready
