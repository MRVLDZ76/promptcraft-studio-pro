# Supabase Schema Guide - PromptCraft Studio Pro

**Version:** 2.0  
**Date:** January 16, 2026  
**Migration File:** `supabase/migrations/20260116_chronstudio_schema.sql`

---

## Overview

This document provides a comprehensive guide to the Supabase database schema for PromptCraft Studio Pro, covering all newly added components including **ChronStudio (Video Stories)**, **Analysis Studio (Debate Analysis)**, and the core **Prompt Builder** features.

---

## 📋 Table of Contents

1. [ChronStudio Schema](#chronstudio-schema)
2. [Analysis Studio Schema](#analysis-studio-schema)
3. [Prompt Builder Schema](#prompt-builder-schema)
4. [Shared Utilities](#shared-utilities)
5. [Schema Relationships](#schema-relationships)
6. [Migration Instructions](#migration-instructions)
7. [TypeScript Integration](#typescript-integration)

---

## ChronStudio Schema

### Purpose
ChronStudio enables narrative video production with AI-powered character generation, storyboarding, and Veo 3.1 video generation.

### Tables

#### 1. `chronstudio_projects`

**Purpose:** Core project metadata for narrative video production

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `title` | TEXT | Project name |
| `category` | ENUM | BIBLICAL, HISTORICAL, CUSTOM |
| `mode` | ENUM | INTEGRATED (in-app) or EXTERNAL (prompt export) |
| `current_step` | ENUM | TEMPLATE, INPUT, CHARACTERS, STORYBOARD, PRODUCTION |
| `segment` | TEXT | Source reference (e.g., "Genesis 1:1-3") |
| `content` | TEXT | Full text content |
| `context_note` | TEXT | User notes or research context |
| `summary` | TEXT | AI-generated narrative summary |
| `setting_year` | TEXT | Historical/biblical time period |
| `setting_region` | TEXT | Geographic setting |
| `setting_landscape` | TEXT | Environmental description |
| `style` | ENUM | Visual style (11 options) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `last_accessed_at` | TIMESTAMPTZ | Last opened |
| `is_template` | BOOLEAN | Template for reuse |
| `is_archived` | BOOLEAN | Archived status |
| `tags` | TEXT[] | User-defined tags |

**Indexes:**
- `idx_chronstudio_projects_user_id` - User queries
- `idx_chronstudio_projects_category` - Filter by category
- `idx_chronstudio_projects_updated_at` - Sort by recent

**RLS:** User can only access their own projects

---

#### 2. `chronstudio_characters`

**Purpose:** Character library with AI-generated portraits

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Foreign key to chronstudio_projects |
| `user_id` | UUID | Foreign key to auth.users |
| `name` | TEXT | Character name |
| `role` | TEXT | Narrative role (e.g., "Protagonist") |
| `visual_description` | TEXT | Physical appearance details |
| `voice_description` | TEXT | Voice characteristics |
| `reference_image_url` | TEXT | Gemini-generated portrait URL |
| `reference_image_prompt` | TEXT | Prompt used for image generation |
| `is_in_library` | BOOLEAN | Saved for reuse across projects |
| `library_category` | TEXT | Library organization |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `sort_order` | INTEGER | Display order |

**Indexes:**
- `idx_chronstudio_characters_project_id` - Project characters
- `idx_chronstudio_characters_user_id` - User library
- `idx_chronstudio_characters_library` - Reusable characters

**RLS:** User can only access their own characters

---

#### 3. `chronstudio_scenes`

**Purpose:** Storyboard scenes with Veo generation prompts

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Foreign key to chronstudio_projects |
| `user_id` | UUID | Foreign key to auth.users |
| `scene_number` | INTEGER | Sequential scene number |
| `duration_seconds` | INTEGER | Target video duration (default 5s) |
| `narrative_text` | TEXT | Story beat description |
| `visual_prompt` | TEXT | Full Veo generation prompt |
| `status` | ENUM | pending, generating, completed, failed |
| `video_url` | TEXT | Generated video URL (INTEGRATED mode) |
| `error_message` | TEXT | Failure details |
| `character_ids` | UUID[] | Characters in scene |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `generated_at` | TIMESTAMPTZ | Video generation completion |
| `prompt_copied` | BOOLEAN | User copied for external use |
| `generation_params` | JSONB | Veo parameters (resolution, etc.) |

**Indexes:**
- `idx_chronstudio_scenes_project_id` - Project scenes
- `idx_chronstudio_scenes_user_id` - User scenes
- `idx_chronstudio_scenes_status` - Filter by status
- `idx_chronstudio_scenes_scene_number` - Sort order

**RLS:** User can only access their own scenes

---

### Enums

```sql
CREATE TYPE project_category AS ENUM ('BIBLICAL', 'HISTORICAL', 'CUSTOM');

CREATE TYPE story_style AS ENUM (
  'DOCUMENTARY',
  'CINEMATIC_DRAMA',
  'ANIMATED_STYLIZED',
  'RETRO_FUTURISM',
  'GRITTY_REALISM',
  'FAIRYTALE',
  'LOW_POLY_3D',
  'VINTAGE_KODACHROME',
  'SURREAL_DREAMSCAPE',
  'PENCIL_SKETCH',
  'NEO_NOIR'
);

CREATE TYPE production_mode AS ENUM ('INTEGRATED', 'EXTERNAL');
CREATE TYPE scene_status AS ENUM ('pending', 'generating', 'completed', 'failed');
CREATE TYPE workflow_step AS ENUM ('TEMPLATE', 'INPUT', 'CHARACTERS', 'STORYBOARD', 'PRODUCTION');
```

---

## Analysis Studio Schema

### Purpose
Analyze debates with Toulmin logic modeling, fallacy detection, and temporal scoring.

### Tables

#### 1. `debates`

**Purpose:** Main debate analysis sessions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `title` | TEXT | Debate title |
| `mode` | ENUM | arena (2+ participants) or monologue (1 speaker) |
| `total_duration` | INTEGER | Duration in seconds |
| `video_url` | TEXT | Source video URL |
| `video_platform` | TEXT | 'youtube', 'local', etc. |
| `transcript_text` | TEXT | Full transcript |
| `transcript_source` | TEXT | Origin of transcript |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `analyzed_at` | TIMESTAMPTZ | Analysis completion |
| `analysis_status` | TEXT | draft, analyzing, completed, failed |
| `is_archived` | BOOLEAN | Archived status |
| `tags` | TEXT[] | User-defined tags |
| `topic` | TEXT | Debate topic |
| `final_verdict` | JSONB | Winner and scores |

**Indexes:**
- `idx_debates_user_id` - User debates
- `idx_debates_updated_at` - Sort by recent
- `idx_debates_mode` - Filter by mode

**RLS:** User can only access their own debates

---

#### 2. `debate_participants`

**Purpose:** Participants/speakers in debates

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `debate_id` | UUID | Foreign key to debates |
| `name` | TEXT | Participant name |
| `participant_label` | TEXT | 'A', 'B', or speaker ID |
| `social_url` | TEXT | Social media profile |
| `followers` | TEXT | Follower count |
| `thumbnail_url` | TEXT | Profile image |
| `level` | INTEGER | Skill level indicator |
| `final_score` | DECIMAL | Final debate score |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_debate_participants_debate_id` - Debate participants

**RLS:** User can access participants of their debates

---

#### 3. `argument_nodes`

**Purpose:** Individual argument claims with Toulmin analysis

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `debate_id` | UUID | Foreign key to debates |
| `participant_id` | UUID | Foreign key to debate_participants |
| `timestamp_in` | DECIMAL | Start time (seconds) |
| `timestamp_out` | DECIMAL | End time (seconds) |
| `claim_text_short` | TEXT | Brief claim summary |
| `claim_text_full` | TEXT | Full argument text |
| `toulmin_component` | ENUM | CLAIM, GROUNDS, WARRANT, BACKING, QUALIFIER, REBUTTAL |
| `logic_status` | ENUM | VALID, FALLACY, WEAK_EVIDENCE, CONTRADICTION |
| `fallacy_type` | ENUM | Type of logical fallacy (12 options) |
| `score_impact` | DECIMAL | Impact on participant score |
| `confidence` | DECIMAL | AI confidence (0-1) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_argument_nodes_debate_id` - Debate arguments
- `idx_argument_nodes_participant_id` - Participant arguments
- `idx_argument_nodes_timestamp` - Time-based queries
- `idx_argument_nodes_logic_status` - Filter by validity

**RLS:** User can access argument nodes of their debates

---

#### 4. `temporal_scores`

**Purpose:** Time-series scoring data for live debate tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `debate_id` | UUID | Foreign key to debates |
| `timestamp` | DECIMAL | Time point (seconds) |
| `participant_a_score` | DECIMAL | Participant A score |
| `participant_b_score` | DECIMAL | Participant B score (NULL for monologue) |
| `momentum` | ENUM | GAINING, LOSING, STABLE |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_temporal_scores_debate_id` - Debate scores
- `idx_temporal_scores_timestamp` - Chronological queries

**RLS:** User can access temporal scores of their debates

---

### Enums

```sql
CREATE TYPE analysis_mode AS ENUM ('arena', 'monologue');

CREATE TYPE logic_status AS ENUM ('VALID', 'FALLACY', 'WEAK_EVIDENCE', 'CONTRADICTION');

CREATE TYPE toulmin_component AS ENUM (
  'CLAIM', 'GROUNDS', 'WARRANT', 'BACKING', 'QUALIFIER', 'REBUTTAL'
);

CREATE TYPE fallacy_type AS ENUM (
  'AD_HOMINEM', 'STRAWMAN', 'SLIPPERY_SLOPE', 'FALSE_DILEMMA',
  'APPEAL_TO_AUTHORITY', 'HASTY_GENERALIZATION', 'POST_HOC',
  'RED_HERRING', 'CIRCULAR_REASONING', 'APPEAL_TO_EMOTION',
  'BANDWAGON', 'NO_TRUE_SCOTSMAN'
);

CREATE TYPE momentum_type AS ENUM ('GAINING', 'LOSING', 'STABLE');
```

---

## Prompt Builder Schema

### Purpose
Core prompt engineering for images, videos, and storyboards.

### Tables

#### 1. `prompt_projects`

**Purpose:** Prompt builder projects with version history

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `name` | TEXT | Project name |
| `mode` | ENUM | image, video, sequence, audio |
| `prompt_state` | JSONB | Complete PromptState object |
| `final_prompt` | TEXT | Generated prompt text |
| `prompt_history` | TEXT[] | Version history |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `is_favorite` | BOOLEAN | Favorited by user |
| `tags` | TEXT[] | User-defined tags |

**Indexes:**
- `idx_prompt_projects_user_id` - User projects
- `idx_prompt_projects_mode` - Filter by mode
- `idx_prompt_projects_updated_at` - Sort by recent

**RLS:** User can only access their own projects

---

#### 2. `sequence_segments`

**Purpose:** Multi-clip storyboard sequences

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Foreign key to prompt_projects |
| `user_id` | UUID | Foreign key to auth.users |
| `segment_number` | INTEGER | Sequence position |
| `duration_seconds` | INTEGER | Clip duration |
| `action_description` | TEXT | Scene action |
| `camera_movement` | TEXT | Camera motion description |
| `visual_style` | TEXT | Visual style preference |
| `generation_prompt` | TEXT | Full generation prompt |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `sort_order` | INTEGER | Display order |

**Indexes:**
- `idx_sequence_segments_project_id` - Project segments
- `idx_sequence_segments_user_id` - User segments
- `idx_sequence_segments_order` - Sort order

**RLS:** User can only access their own segments

---

#### 3. `transcriptions`

**Purpose:** Audio/video transcriptions with AI analysis

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `source_type` | TEXT | recording, upload, youtube |
| `source_url` | TEXT | Source URL if applicable |
| `audio_duration` | INTEGER | Duration in seconds |
| `transcript_text` | TEXT | Transcription result |
| `language` | TEXT | Language code (default 'en') |
| `diarization_data` | JSONB | Speaker separation data |
| `summary` | TEXT | AI-generated summary |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification |
| `title` | TEXT | User-defined title |
| `tags` | TEXT[] | User-defined tags |

**Indexes:**
- `idx_transcriptions_user_id` - User transcriptions
- `idx_transcriptions_created_at` - Sort by recent

**RLS:** User can only access their own transcriptions

---

### Enums

```sql
CREATE TYPE prompt_mode AS ENUM ('image', 'video', 'sequence', 'audio');
CREATE TYPE image_size AS ENUM ('1K', '2K', '4K');
CREATE TYPE video_resolution AS ENUM ('720p', '1080p');
```

---

## Shared Utilities

### Auto-Update Trigger

Automatically updates `updated_at` timestamp on row modifications:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to all tables with `updated_at` column.

---

## Schema Relationships

### ChronStudio Data Flow
```
chronstudio_projects (1) ──┬──> (N) chronstudio_characters
                            │
                            └──> (N) chronstudio_scenes
                                      │
                                      └──> character_ids[] references chronstudio_characters
```

### Analysis Studio Data Flow
```
debates (1) ──┬──> (N) debate_participants
              │
              ├──> (N) argument_nodes ──> (1) debate_participants
              │
              └──> (N) temporal_scores
```

### Prompt Builder Data Flow
```
prompt_projects (1) ──> (N) sequence_segments
```

---

## Migration Instructions

### 1. Apply Migration

```bash
# Navigate to project directory
cd promptcraft-studio-pro

# Apply migration using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of supabase/migrations/20260116_chronstudio_schema.sql
# 3. Execute
```

### 2. Verify Tables

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'chronstudio_%' 
  OR table_name IN ('debates', 'debate_participants', 'argument_nodes', 'temporal_scores');
```

### 3. Verify RLS Policies

```sql
-- Check Row Level Security policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 4. Test CRUD Operations

```typescript
// Example: Create a ChronStudio project
const { data, error } = await supabase
  .from('chronstudio_projects')
  .insert({
    title: 'Genesis Creation Story',
    category: 'BIBLICAL',
    mode: 'INTEGRATED',
    segment: 'Genesis 1:1-31',
    style: 'CINEMATIC_DRAMA'
  })
  .select()
  .single();
```

---

## TypeScript Integration

### 1. Generate Types

```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > supabase/types.ts
```

### 2. Import Types

```typescript
import { Database } from './supabase/types';

type ChronStudioProject = Database['public']['Tables']['chronstudio_projects']['Row'];
type Debate = Database['public']['Tables']['debates']['Row'];
type ArgumentNode = Database['public']['Tables']['argument_nodes']['Row'];
```

### 3. Type-Safe Queries

```typescript
// ChronStudio project query with full type safety
const { data: projects } = await supabase
  .from('chronstudio_projects')
  .select(`
    *,
    characters:chronstudio_characters(*),
    scenes:chronstudio_scenes(*)
  `)
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });

// Debate analysis query
const { data: debate } = await supabase
  .from('debates')
  .select(`
    *,
    participants:debate_participants(*),
    arguments:argument_nodes(*),
    scores:temporal_scores(*)
  `)
  .eq('id', debateId)
  .single();
```

---

## Storage Buckets

### Required Buckets

Create these storage buckets in Supabase Dashboard:

1. **`chronstudio-videos`**
   - **Purpose:** Veo-generated video clips
   - **Public:** Yes
   - **File Size Limit:** 100MB
   - **Allowed MIME Types:** `video/mp4`

2. **`chronstudio-images`**
   - **Purpose:** Character reference images
   - **Public:** Yes
   - **File Size Limit:** 10MB
   - **Allowed MIME Types:** `image/png`, `image/jpeg`, `image/webp`

3. **`transcription-audio`**
   - **Purpose:** Uploaded audio files
   - **Public:** No (private)
   - **File Size Limit:** 50MB
   - **Allowed MIME Types:** `audio/mpeg`, `audio/wav`, `audio/webm`

### RLS Policies for Storage

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chronstudio-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chronstudio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Performance Optimization

### Recommended Indexes

Already created in migration, but monitor these for performance:

```sql
-- ChronStudio composite indexes
CREATE INDEX idx_chronstudio_scenes_project_status 
ON chronstudio_scenes(project_id, status);

-- Analysis Studio composite indexes
CREATE INDEX idx_argument_nodes_debate_timestamp 
ON argument_nodes(debate_id, timestamp_in);

-- Full-text search on transcripts
CREATE INDEX idx_debates_transcript_fts 
ON debates USING gin(to_tsvector('english', transcript_text));
```

### Materialized Views (Optional)

For heavy analytical queries:

```sql
-- Project statistics view
CREATE MATERIALIZED VIEW chronstudio_project_stats AS
SELECT 
  p.id,
  p.title,
  COUNT(DISTINCT c.id) as character_count,
  COUNT(DISTINCT s.id) as scene_count,
  SUM(s.duration_seconds) as total_duration,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_scenes
FROM chronstudio_projects p
LEFT JOIN chronstudio_characters c ON c.project_id = p.id
LEFT JOIN chronstudio_scenes s ON s.project_id = p.id
GROUP BY p.id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW chronstudio_project_stats;
```

---

## Data Validation

### Check Constraints

Add application-level validation:

```sql
-- Scene duration must be positive
ALTER TABLE chronstudio_scenes 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_seconds > 0 AND duration_seconds <= 120);

-- Timestamps must be valid
ALTER TABLE argument_nodes 
ADD CONSTRAINT check_timestamp_order 
CHECK (timestamp_out > timestamp_in);

-- Scores must be in valid range
ALTER TABLE temporal_scores 
ADD CONSTRAINT check_score_range 
CHECK (participant_a_score >= 0 AND participant_a_score <= 100);
```

---

## Backup Strategy

### Automated Backups

Supabase provides automated daily backups. For critical data:

```bash
# Manual backup via CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Restore from backup
supabase db reset --db-url "postgresql://..."
```

### Export User Data

```typescript
// Export user's complete ChronStudio data
const exportUserData = async (userId: string) => {
  const { data: projects } = await supabase
    .from('chronstudio_projects')
    .select(`
      *,
      characters:chronstudio_characters(*),
      scenes:chronstudio_scenes(*)
    `)
    .eq('user_id', userId);
    
  return JSON.stringify(projects, null, 2);
};
```

---

## Security Considerations

### RLS Best Practices

1. **Always filter by user_id:**
   ```sql
   WHERE auth.uid() = user_id
   ```

2. **Use foreign key policies for related tables:**
   ```sql
   WHERE EXISTS (
     SELECT 1 FROM chronstudio_projects
     WHERE id = project_id AND user_id = auth.uid()
   )
   ```

3. **Test policies with different roles:**
   ```sql
   SET ROLE authenticated;
   -- Test queries here
   RESET ROLE;
   ```

### API Key Management

Store Gemini API keys securely:

```typescript
// NEVER store API keys in database
// Use environment variables or secure vaults
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

---

## Troubleshooting

### Common Issues

1. **RLS blocking queries:**
   ```sql
   -- Temporarily disable RLS for debugging (dev only!)
   ALTER TABLE chronstudio_projects DISABLE ROW LEVEL SECURITY;
   ```

2. **Foreign key violations:**
   ```sql
   -- Check orphaned records
   SELECT * FROM chronstudio_scenes 
   WHERE project_id NOT IN (SELECT id FROM chronstudio_projects);
   ```

3. **Type mismatches:**
   ```sql
   -- Verify enum values match TypeScript
   SELECT enum_range(NULL::project_category);
   ```

---

## Next Steps

1. **Apply the migration:** Run `20260116_chronstudio_schema.sql`
2. **Create storage buckets:** Set up file storage for media
3. **Generate types:** Update TypeScript definitions
4. **Update services:** Migrate from localStorage to Supabase
5. **Test authentication:** Verify RLS policies work correctly

---

## Support

**Migration File:** [supabase/migrations/20260116_chronstudio_schema.sql](../supabase/migrations/20260116_chronstudio_schema.sql)  
**Last Updated:** January 16, 2026  
**Schema Version:** 2.0
