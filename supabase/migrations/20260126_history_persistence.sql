-- PromptCraft Studio Pro - Enhanced Persistence & History
-- Version: 2.0
-- Date: January 26, 2026
-- Purpose: Add comprehensive history tracking for uploads, transcriptions, and analyses

-- ============================================
-- ASSET LIBRARY TABLE (Uploaded Resources)
-- ============================================
CREATE TABLE IF NOT EXISTS asset_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Asset metadata
  user_id UUID,
  filename TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'audio', 'document', 'image', 'transcript')),
  source_type TEXT CHECK (source_type IN ('youtube_url', 'file_upload', 'api_import')), -- How it was added
  
  -- File/URL information
  file_size_bytes BIGINT, -- For uploads
  duration_seconds FLOAT, -- For video/audio
  mime_type TEXT,
  s3_path TEXT, -- If stored in S3
  source_url TEXT, -- If from URL (YouTube, etc)
  
  -- Content tracking
  content_hash TEXT UNIQUE, -- MD5/SHA256 to detect duplicates
  has_transcript BOOLEAN DEFAULT false,
  transcript_id UUID REFERENCES video_transcripts(id) ON DELETE SET NULL,
  
  -- Metadata
  title TEXT,
  description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb, -- Channel info, duration, etc
  
  -- Status
  status TEXT DEFAULT 'ready' CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'archived')),
  error_message TEXT,
  
  -- Usage tracking
  analysis_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_favorite BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 30, -- Auto-delete after N days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================
-- TRANSCRIPTION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transcription_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Association
  user_id UUID,
  asset_id UUID REFERENCES asset_uploads(id) ON DELETE CASCADE,
  video_transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
  
  -- Transcription details
  language_detected TEXT,
  language_requested TEXT,
  source_api TEXT CHECK (source_api IN ('youtube_native', 'transcript_api', 'gemini', 'whisper', 'manual')),
  transcription_text TEXT NOT NULL,
  
  -- Segments/Timestamps
  segments JSONB DEFAULT '[]'::jsonb, -- [{text, start, end, speaker}, ...]
  
  -- Quality metrics
  confidence_score DECIMAL(5,2), -- 0-100
  processing_time_ms INTEGER,
  word_count INTEGER,
  estimated_accuracy TEXT DEFAULT 'high', -- low, medium, high
  
  -- Metadata
  speaker_diarization_enabled BOOLEAN DEFAULT false,
  detected_speakers TEXT[],
  has_music BOOLEAN DEFAULT false,
  has_background_noise BOOLEAN DEFAULT false,
  
  -- Caching
  is_cached BOOLEAN DEFAULT false, -- True if from cache
  cache_hit_count INTEGER DEFAULT 0,
  
  -- Cost/Performance
  api_cost_usd DECIMAL(10,4),
  tokens_used INTEGER,
  
  -- Notes
  notes TEXT,
  is_verified BOOLEAN DEFAULT false -- User verified accuracy
);

-- ============================================
-- ANALYSIS HISTORY TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  user_id UUID,
  asset_id UUID REFERENCES asset_uploads(id) ON DELETE SET NULL,
  transcription_id UUID REFERENCES transcription_history(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE, -- Link to main analyses table
  
  -- Analysis configuration (snapshot)
  analysis_name TEXT,
  description TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('arena', 'solo')),
  
  participant_a_name TEXT NOT NULL,
  participant_a_handle TEXT,
  participant_b_name TEXT,
  participant_b_handle TEXT,
  
  -- Settings snapshot
  wsdc_content_weight INTEGER,
  wsdc_style_weight INTEGER,
  wsdc_strategy_weight INTEGER,
  calibration_settings JSONB,
  
  -- Input data
  input_transcript_text TEXT, -- Truncated for quick view
  prompt_used TEXT,
  
  -- Results (Denormalized for quick access)
  score_participant_a DECIMAL(5,2),
  score_participant_b DECIMAL(5,2),
  winner TEXT, -- 'A', 'B', or 'tie'
  confidence_score DECIMAL(5,2),
  
  -- Parsed results
  claims_count INTEGER,
  fallacies_count_a INTEGER,
  fallacies_count_b INTEGER,
  strongest_argument TEXT,
  weakest_argument TEXT,
  
  -- Full results
  full_result_json JSONB, -- Complete analysis result
  chain_of_thought TEXT, -- AI reasoning
  
  -- Performance
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  api_cost_usd DECIMAL(10,4),
  
  -- Metadata
  tags TEXT[],
  notes TEXT, -- User's notes/observations
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  -- Comparison tracking (for A/B testing different configs)
  is_variant BOOLEAN DEFAULT false,
  variant_of_analysis_id UUID REFERENCES analysis_history(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'archived')),
  error_message TEXT
);

-- ============================================
-- RESULT CACHE TABLE (For rapid reruns)
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_result_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Cache key: hash of (transcript + prompt + weights)
  cache_key TEXT UNIQUE NOT NULL,
  transcription_id UUID REFERENCES transcription_history(id) ON DELETE CASCADE,
  
  -- Cached result
  result_json JSONB NOT NULL,
  score_a DECIMAL(5,2),
  score_b DECIMAL(5,2),
  winner TEXT,
  
  -- Metadata
  hit_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- For cache invalidation
  config_hash TEXT -- Hash of WSDC weights + calibration
);

-- ============================================
-- ASSET LIBRARY TABLE INDEXES
-- ============================================
CREATE INDEX idx_asset_uploads_user_id ON asset_uploads(user_id);
CREATE INDEX idx_asset_uploads_asset_type ON asset_uploads(asset_type);
CREATE INDEX idx_asset_uploads_source_type ON asset_uploads(source_type);
CREATE INDEX idx_asset_uploads_created_at ON asset_uploads(created_at DESC);
CREATE INDEX idx_asset_uploads_favorite ON asset_uploads(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_asset_uploads_status ON asset_uploads(status);
CREATE INDEX idx_asset_uploads_content_hash ON asset_uploads(content_hash);
CREATE INDEX idx_asset_uploads_expires_at ON asset_uploads(expires_at);
CREATE INDEX idx_asset_uploads_transcript_id ON asset_uploads(transcript_id);

-- ============================================
-- TRANSCRIPTION HISTORY INDEXES
-- ============================================
CREATE INDEX idx_transcription_history_user_id ON transcription_history(user_id);
CREATE INDEX idx_transcription_history_asset_id ON transcription_history(asset_id);
CREATE INDEX idx_transcription_history_created_at ON transcription_history(created_at DESC);
CREATE INDEX idx_transcription_history_source_api ON transcription_history(source_api);
CREATE INDEX idx_transcription_history_language ON transcription_history(language_detected);
CREATE INDEX idx_transcription_history_is_cached ON transcription_history(is_cached);

-- ============================================
-- ANALYSIS HISTORY INDEXES
-- ============================================
CREATE INDEX idx_analysis_history_user_id ON analysis_history(user_id);
CREATE INDEX idx_analysis_history_asset_id ON analysis_history(asset_id);
CREATE INDEX idx_analysis_history_transcription_id ON analysis_history(transcription_id);
CREATE INDEX idx_analysis_history_analysis_id ON analysis_history(analysis_id);
CREATE INDEX idx_analysis_history_created_at ON analysis_history(created_at DESC);
CREATE INDEX idx_analysis_history_mode ON analysis_history(mode);
CREATE INDEX idx_analysis_history_winner ON analysis_history(winner);
CREATE INDEX idx_analysis_history_status ON analysis_history(status);
CREATE INDEX idx_analysis_history_favorite ON analysis_history(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_analysis_history_public ON analysis_history(is_public) WHERE is_public = true;
CREATE INDEX idx_analysis_history_variant ON analysis_history(is_variant, variant_of_analysis_id);
CREATE INDEX idx_analysis_history_tags ON analysis_history USING gin(tags);

-- ============================================
-- RESULT CACHE INDEXES
-- ============================================
CREATE INDEX idx_result_cache_key ON analysis_result_cache(cache_key);
CREATE INDEX idx_result_cache_transcription_id ON analysis_result_cache(transcription_id);
CREATE INDEX idx_result_cache_expires_at ON analysis_result_cache(expires_at);
CREATE INDEX idx_result_cache_hit_count ON analysis_result_cache(hit_count DESC);

-- ============================================
-- TRIGGERS FOR NEW TABLES
-- ============================================

-- Update updated_at for asset_uploads
CREATE TRIGGER update_asset_uploads_updated_at BEFORE UPDATE ON asset_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for analysis_history
CREATE TRIGGER update_analysis_history_updated_at BEFORE UPDATE ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment analysis_count when used in analysis
CREATE OR REPLACE FUNCTION increment_asset_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE asset_uploads 
  SET analysis_count = analysis_count + 1, 
      last_used_at = NOW()
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_asset_count_on_analysis
AFTER INSERT ON analysis_history
FOR EACH ROW WHEN (NEW.asset_id IS NOT NULL)
EXECUTE FUNCTION increment_asset_analysis_count();

-- Auto-cleanup expired caches
CREATE OR REPLACE FUNCTION cleanup_expired_caches()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete expired result caches
  DELETE FROM analysis_result_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired assets
  DELETE FROM asset_uploads WHERE expires_at < NOW() AND status != 'favorite';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Get analysis summary for display in history list
 */
CREATE OR REPLACE FUNCTION get_analysis_summary(analysis_uuid UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  participant_a TEXT,
  participant_b TEXT,
  score_a NUMERIC,
  score_b NUMERIC,
  winner TEXT,
  fallacy_count INTEGER,
  processing_time_ms INTEGER,
  is_favorite BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ah.id,
    ah.created_at,
    ah.participant_a_name,
    ah.participant_b_name,
    ah.score_participant_a,
    ah.score_participant_b,
    ah.winner,
    (ah.fallacies_count_a + ah.fallacies_count_b)::INTEGER as fallacy_count,
    ah.processing_time_ms,
    ah.is_favorite
  FROM analysis_history ah
  WHERE ah.id = analysis_uuid;
END;
$$ LANGUAGE plpgsql;

/**
 * Search history by various criteria
 */
CREATE OR REPLACE FUNCTION search_analysis_history(
  search_query TEXT DEFAULT NULL,
  mode_filter TEXT DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  only_favorites BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  participant_a TEXT,
  participant_b TEXT,
  score_a NUMERIC,
  score_b NUMERIC,
  winner TEXT,
  is_favorite BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ah.id,
    ah.created_at,
    ah.participant_a_name,
    ah.participant_b_name,
    ah.score_participant_a,
    ah.score_participant_b,
    ah.winner,
    ah.is_favorite
  FROM analysis_history ah
  WHERE 
    (search_query IS NULL OR 
     ah.participant_a_name ILIKE '%' || search_query || '%' OR
     ah.participant_b_name ILIKE '%' || search_query || '%' OR
     ah.analysis_name ILIKE '%' || search_query || '%')
    AND (mode_filter IS NULL OR ah.mode = mode_filter)
    AND (date_from IS NULL OR ah.created_at >= date_from)
    AND (date_to IS NULL OR ah.created_at <= date_to)
    AND (NOT only_favorites OR ah.is_favorite = true)
  ORDER BY 
    CASE WHEN ah.is_favorite THEN 0 ELSE 1 END,
    ah.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================

ALTER TABLE asset_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_result_cache ENABLE ROW LEVEL SECURITY;

-- Public read for shared assets
CREATE POLICY "Allow public read asset_uploads" ON asset_uploads FOR SELECT USING (is_favorite = true OR user_id IS NULL);
CREATE POLICY "Allow insert asset_uploads" ON asset_uploads FOR INSERT WITH CHECK (true);

-- Public read for shared transcriptions
CREATE POLICY "Allow public read transcription_history" ON transcription_history FOR SELECT USING (true);
CREATE POLICY "Allow insert transcription_history" ON transcription_history FOR INSERT WITH CHECK (true);

-- Public read for shared analyses
CREATE POLICY "Allow public read analysis_history" ON analysis_history FOR SELECT USING (is_public = true);
CREATE POLICY "Allow insert analysis_history" ON analysis_history FOR INSERT WITH CHECK (true);

-- Cache is internal only
CREATE POLICY "Allow public read analysis_result_cache" ON analysis_result_cache FOR SELECT USING (true);
CREATE POLICY "Allow insert analysis_result_cache" ON analysis_result_cache FOR INSERT WITH CHECK (true);
