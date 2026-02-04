-- PromptCraft Studio Pro - Complete Database Schema
-- Version: 1.0.0
-- Date: January 12, 2026

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- TABLES
-- ============================================

-- Users table (optional - for future authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  api_usage_count INTEGER DEFAULT 0,
  api_usage_reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator profiles cache (YouTube/Instagram creators)
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok', 'twitter')),
  username TEXT NOT NULL,
  handle TEXT NOT NULL, -- @username
  display_name TEXT NOT NULL,
  thumbnail TEXT,
  description TEXT,
  followers_count BIGINT DEFAULT 0,
  followers_text TEXT, -- "1.2M subscribers"
  total_videos INTEGER,
  total_views BIGINT,
  verified BOOLEAN DEFAULT false,
  engagement_rate DECIMAL(5,2), -- percentage
  raw_data JSONB DEFAULT '{}'::jsonb, -- Store full API response
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- 7 day cache
  UNIQUE(platform, username)
);

-- Video transcripts cache
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  video_id TEXT NOT NULL UNIQUE, -- YouTube video ID
  video_url TEXT NOT NULL,
  title TEXT,
  channel_name TEXT,
  channel_id TEXT,
  duration TEXT, -- "10:25"
  transcript_text TEXT NOT NULL, -- Full transcript
  transcript_snippets JSONB DEFAULT '[]'::jsonb, -- Array of {text, start, duration}
  languages JSONB DEFAULT '[]'::jsonb, -- Available languages
  language_code TEXT DEFAULT 'en',
  word_count INTEGER,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days') -- 30 day cache
);

-- WSDC weight configurations (saved presets)
CREATE TABLE IF NOT EXISTS wsdc_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Academic Standard", "Public Debate", etc.
  description TEXT,
  content_weight INTEGER NOT NULL CHECK (content_weight >= 0 AND content_weight <= 100),
  style_weight INTEGER NOT NULL CHECK (style_weight >= 0 AND style_weight <= 100),
  strategy_weight INTEGER NOT NULL CHECK (strategy_weight >= 0 AND strategy_weight <= 100),
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Allow sharing with other users
  usage_count INTEGER DEFAULT 0,
  CONSTRAINT weights_sum_100 CHECK (content_weight + style_weight + strategy_weight = 100)
);

-- Analysis sessions (main analysis records)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Analysis metadata
  mode TEXT NOT NULL CHECK (mode IN ('arena', 'solo')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Participants
  participant_a_name TEXT NOT NULL,
  participant_a_handle TEXT,
  participant_a_platform TEXT,
  participant_a_profile_id UUID REFERENCES creator_profiles(id),
  
  participant_b_name TEXT,
  participant_b_handle TEXT,
  participant_b_platform TEXT,
  participant_b_profile_id UUID REFERENCES creator_profiles(id),
  
  -- Video/Content
  video_url TEXT,
  video_id TEXT,
  transcript_id UUID REFERENCES video_transcripts(id),
  transcript_text TEXT, -- Denormalized for quick access
  
  -- Configuration
  arbiter_preset TEXT DEFAULT 'custom',
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  
  -- Calibration settings
  region TEXT DEFAULT 'Global',
  year TEXT DEFAULT '2024',
  demography TEXT DEFAULT 'General Public',
  persona TEXT DEFAULT 'Neutral Arbiter',
  logic_style TEXT DEFAULT 'Common Sense',
  stakeholder_mode TEXT DEFAULT 'Peer-to-Peer',
  margin_of_error INTEGER DEFAULT 10,
  
  -- WSDC Weights
  wsdc_content_weight INTEGER DEFAULT 40,
  wsdc_style_weight INTEGER DEFAULT 40,
  wsdc_strategy_weight INTEGER DEFAULT 20,
  wsdc_config_id UUID REFERENCES wsdc_configurations(id),
  
  -- RAG Context
  rag_urls TEXT[], -- Array of URLs for context
  context_files TEXT[], -- Uploaded file names
  
  -- Results
  result_text TEXT, -- Full analysis text
  result_json JSONB DEFAULT '{}'::jsonb, -- Structured results
  score_a DECIMAL(5,2), -- Participant A score (0-100)
  score_b DECIMAL(5,2), -- Participant B score (0-100)
  winner TEXT, -- 'A', 'B', or 'tie'
  confidence DECIMAL(5,2), -- AI confidence (0-100)
  
  -- Performance metrics
  processing_time_ms INTEGER, -- Time taken to analyze
  tokens_used INTEGER, -- AI tokens consumed
  cost_usd DECIMAL(10,4), -- Estimated cost
  
  -- Metadata
  chain_of_thought TEXT, -- AI reasoning process
  temporal_scores JSONB DEFAULT '[]'::jsonb, -- Time-based scoring
  tags TEXT[], -- User-defined tags
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', 
      COALESCE(participant_a_name, '') || ' ' ||
      COALESCE(participant_b_name, '') || ' ' ||
      COALESCE(result_text, '')
    )
  ) STORED
);

-- Fallacy logs (extracted from analyses)
CREATE TABLE IF NOT EXISTS fallacy_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  
  timestamp TIMESTAMPTZ NOT NULL,
  fallacy_type TEXT NOT NULL, -- "Ad Hominem", "Straw Man", etc.
  speaker TEXT NOT NULL, -- 'A' or 'B' or name
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  impact_score DECIMAL(5,2), -- Impact on argument (0-100)
  quote TEXT, -- Actual text where fallacy occurred
  timestamp_in_video INTEGER, -- Seconds into video
  context TEXT -- Surrounding context
);

-- Analysis votes/reactions (for public analyses)
CREATE TABLE IF NOT EXISTS analysis_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('upvote', 'downvote', 'helpful', 'insightful', 'biased')),
  comment TEXT,
  
  UNIQUE(analysis_id, user_id, reaction_type)
);

-- Channel cache (lightweight cache for quick lookups)
CREATE TABLE IF NOT EXISTS channel_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  channel_handle TEXT UNIQUE NOT NULL,
  channel_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  api_type TEXT NOT NULL CHECK (api_type IN ('gemini', 'serpapi', 'youtube', 'instagram')),
  endpoint TEXT NOT NULL,
  request_data JSONB,
  response_status INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  error_message TEXT
);

-- ============================================
-- INDEXES
-- ============================================

-- Analyses indexes
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_mode ON analyses(mode);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_video_id ON analyses(video_id);
CREATE INDEX idx_analyses_public ON analyses(is_public) WHERE is_public = true;
CREATE INDEX idx_analyses_search ON analyses USING gin(search_vector);
CREATE INDEX idx_analyses_participants ON analyses(participant_a_name, participant_b_name);
CREATE INDEX idx_analyses_tags ON analyses USING gin(tags);

-- Creator profiles indexes
CREATE INDEX idx_creator_profiles_platform ON creator_profiles(platform);
CREATE INDEX idx_creator_profiles_username ON creator_profiles(username);
CREATE INDEX idx_creator_profiles_handle ON creator_profiles(handle);
CREATE INDEX idx_creator_profiles_expires ON creator_profiles(expires_at);

-- Video transcripts indexes
CREATE INDEX idx_video_transcripts_video_id ON video_transcripts(video_id);
CREATE INDEX idx_video_transcripts_channel_id ON video_transcripts(channel_id);
CREATE INDEX idx_video_transcripts_expires ON video_transcripts(expires_at);

-- Fallacy logs indexes
CREATE INDEX idx_fallacy_logs_analysis_id ON fallacy_logs(analysis_id);
CREATE INDEX idx_fallacy_logs_type ON fallacy_logs(fallacy_type);
CREATE INDEX idx_fallacy_logs_speaker ON fallacy_logs(speaker);
CREATE INDEX idx_fallacy_logs_severity ON fallacy_logs(severity);

-- WSDC configurations indexes
CREATE INDEX idx_wsdc_config_user_id ON wsdc_configurations(user_id);
CREATE INDEX idx_wsdc_config_public ON wsdc_configurations(is_public) WHERE is_public = true;

-- Channel cache indexes
CREATE INDEX idx_channel_cache_handle ON channel_cache(channel_handle);
CREATE INDEX idx_channel_cache_expires ON channel_cache(expires_at);

-- API usage logs indexes
CREATE INDEX idx_api_usage_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_type ON api_usage_logs(api_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Delete expired creator profiles
  DELETE FROM creator_profiles WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired video transcripts
  DELETE FROM video_transcripts WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete expired channel cache
  DELETE FROM channel_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Increment view count safely
CREATE OR REPLACE FUNCTION increment_analysis_views(analysis_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE analyses SET view_count = view_count + 1 WHERE id = analysis_uuid;
END;
$$ LANGUAGE plpgsql;

-- Calculate analysis statistics
CREATE OR REPLACE FUNCTION get_analysis_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_analyses BIGINT,
  arena_count BIGINT,
  solo_count BIGINT,
  total_fallacies BIGINT,
  avg_score_a NUMERIC,
  avg_score_b NUMERIC,
  avg_processing_time_ms NUMERIC,
  total_cost_usd NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(a.id)::BIGINT as total_analyses,
    COUNT(a.id) FILTER (WHERE a.mode = 'arena')::BIGINT as arena_count,
    COUNT(a.id) FILTER (WHERE a.mode = 'solo')::BIGINT as solo_count,
    COUNT(f.id)::BIGINT as total_fallacies,
    AVG(a.score_a) as avg_score_a,
    AVG(a.score_b) as avg_score_b,
    AVG(a.processing_time_ms) as avg_processing_time_ms,
    SUM(a.cost_usd) as total_cost_usd
  FROM analyses a
  LEFT JOIN fallacy_logs f ON f.analysis_id = a.id
  WHERE (user_uuid IS NULL OR a.user_id = user_uuid)
  GROUP BY true;
END;
$$ LANGUAGE plpgsql;

-- Increment WSDC configuration usage count
CREATE OR REPLACE FUNCTION increment_wsdc_usage(config_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE wsdc_configurations SET usage_count = usage_count + 1 WHERE id = config_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on record changes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wsdc_configurations_updated_at BEFORE UPDATE ON wsdc_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wsdc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fallacy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust for production)
CREATE POLICY "Allow public read creator_profiles" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read video_transcripts" ON video_transcripts FOR SELECT USING (true);
CREATE POLICY "Allow public read public_analyses" ON analyses FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Allow public read fallacy_logs" ON fallacy_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM analyses WHERE analyses.id = fallacy_logs.analysis_id AND (analyses.is_public = true OR analyses.user_id = auth.uid()))
);
CREATE POLICY "Allow public read channel_cache" ON channel_cache FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Allow insert creator_profiles" ON creator_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert video_transcripts" ON video_transcripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert analyses" ON analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert fallacy_logs" ON fallacy_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert channel_cache" ON channel_cache FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Allow update creator_profiles" ON creator_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow update channel_cache" ON channel_cache FOR UPDATE USING (true);
CREATE POLICY "Allow update own analyses" ON analyses FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- Delete policies
CREATE POLICY "Allow delete own analyses" ON analyses FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default WSDC configurations
INSERT INTO wsdc_configurations (name, description, content_weight, style_weight, strategy_weight, is_default, is_public)
VALUES 
  ('Academic Standard', 'Standard weights for academic debate analysis', 40, 40, 20, true, true),
  ('Content-Focused', 'Emphasizes logical content and evidence', 60, 25, 15, false, true),
  ('Rhetoric-Heavy', 'Emphasizes presentation and style', 25, 60, 15, false, true),
  ('Strategic', 'Emphasizes debate strategy and structure', 30, 30, 40, false, true),
  ('Balanced', 'Equal weight across all dimensions', 33, 34, 33, false, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE analyses IS 'Main table storing all debate and solo content analyses';
COMMENT ON TABLE creator_profiles IS 'Cached creator/channel profiles from YouTube, Instagram, etc.';
COMMENT ON TABLE video_transcripts IS 'Cached video transcripts from SerpAPI';
COMMENT ON TABLE fallacy_logs IS 'Individual fallacies extracted from analyses';
COMMENT ON TABLE wsdc_configurations IS 'WSDC adjudication weight presets';
COMMENT ON TABLE channel_cache IS 'Lightweight 24hr cache for channel lookups';
COMMENT ON TABLE api_usage_logs IS 'Track API calls for cost monitoring';

COMMENT ON COLUMN analyses.search_vector IS 'Full-text search vector generated from participant names and results';
COMMENT ON COLUMN analyses.temporal_scores IS 'Array of {time, scoreA, scoreB} for time-based analysis';
COMMENT ON COLUMN analyses.chain_of_thought IS 'AI reasoning process stored as text';

-- ============================================
-- GRANTS (adjust based on your needs)
-- ============================================

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
