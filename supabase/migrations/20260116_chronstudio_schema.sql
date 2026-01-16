-- ChronStudio (Video Stories) Database Schema
-- Migration for narrative video production system
-- Created: 2026-01-16

-- ============================================
-- ENUMS
-- ============================================

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

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE chronstudio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Project metadata
  title TEXT NOT NULL,
  category project_category NOT NULL,
  mode production_mode NOT NULL DEFAULT 'INTEGRATED',
  
  -- Workflow state
  current_step workflow_step NOT NULL DEFAULT 'TEMPLATE',
  
  -- Source content
  segment TEXT, -- e.g., "Genesis 1:1-3" or "American Revolution 1776"
  content TEXT, -- Full text content
  context_note TEXT, -- Additional context or research notes
  
  -- AI Analysis results
  summary TEXT, -- AI-generated narrative summary
  setting_year TEXT,
  setting_region TEXT,
  setting_landscape TEXT,
  
  -- Visual preferences
  style story_style NOT NULL DEFAULT 'DOCUMENTARY',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Metadata
  is_template BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Index for user queries
CREATE INDEX idx_chronstudio_projects_user_id ON chronstudio_projects(user_id);
CREATE INDEX idx_chronstudio_projects_category ON chronstudio_projects(category);
CREATE INDEX idx_chronstudio_projects_updated_at ON chronstudio_projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE chronstudio_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON chronstudio_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON chronstudio_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON chronstudio_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON chronstudio_projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CHARACTERS TABLE
-- ============================================

CREATE TABLE chronstudio_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES chronstudio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Character details
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., "Protagonist", "Narrator", "Moses"
  visual_description TEXT NOT NULL,
  voice_description TEXT NOT NULL,
  
  -- Generated assets
  reference_image_url TEXT, -- Gemini-generated character portrait
  reference_image_prompt TEXT, -- Prompt used to generate image
  
  -- Library management
  is_in_library BOOLEAN DEFAULT FALSE, -- Saved to reusable library
  library_category TEXT, -- e.g., "Biblical", "Historical", "Custom"
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Order in project
  sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_chronstudio_characters_project_id ON chronstudio_characters(project_id);
CREATE INDEX idx_chronstudio_characters_user_id ON chronstudio_characters(user_id);
CREATE INDEX idx_chronstudio_characters_library ON chronstudio_characters(is_in_library) WHERE is_in_library = TRUE;

-- RLS
ALTER TABLE chronstudio_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own characters"
  ON chronstudio_characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters"
  ON chronstudio_characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
  ON chronstudio_characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters"
  ON chronstudio_characters FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SCENES (STORYBOARD) TABLE
-- ============================================

CREATE TABLE chronstudio_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES chronstudio_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scene details
  scene_number INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 5,
  narrative_text TEXT NOT NULL, -- Story beat description
  visual_prompt TEXT NOT NULL, -- Full Veo generation prompt
  
  -- Production status
  status scene_status NOT NULL DEFAULT 'pending',
  video_url TEXT, -- Generated video URL (if INTEGRATED mode)
  error_message TEXT, -- Error details if failed
  
  -- Character associations
  character_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Characters in this scene
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_at TIMESTAMPTZ, -- When video was generated
  
  -- Prompt tracking
  prompt_copied BOOLEAN DEFAULT FALSE, -- User copied prompt for external use
  generation_params JSONB -- Store Veo parameters (resolution, etc.)
);

-- Indexes
CREATE INDEX idx_chronstudio_scenes_project_id ON chronstudio_scenes(project_id);
CREATE INDEX idx_chronstudio_scenes_user_id ON chronstudio_scenes(user_id);
CREATE INDEX idx_chronstudio_scenes_status ON chronstudio_scenes(status);
CREATE INDEX idx_chronstudio_scenes_scene_number ON chronstudio_scenes(project_id, scene_number);

-- RLS
ALTER TABLE chronstudio_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scenes"
  ON chronstudio_scenes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenes"
  ON chronstudio_scenes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenes"
  ON chronstudio_scenes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenes"
  ON chronstudio_scenes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ANALYSIS STUDIO SCHEMA
-- ============================================

CREATE TYPE analysis_mode AS ENUM ('arena', 'monologue');
CREATE TYPE logic_status AS ENUM ('VALID', 'FALLACY', 'WEAK_EVIDENCE', 'CONTRADICTION');
CREATE TYPE toulmin_component AS ENUM ('CLAIM', 'GROUNDS', 'WARRANT', 'BACKING', 'QUALIFIER', 'REBUTTAL');
CREATE TYPE fallacy_type AS ENUM (
  'AD_HOMINEM',
  'STRAWMAN',
  'SLIPPERY_SLOPE',
  'FALSE_DILEMMA',
  'APPEAL_TO_AUTHORITY',
  'HASTY_GENERALIZATION',
  'POST_HOC',
  'RED_HERRING',
  'CIRCULAR_REASONING',
  'APPEAL_TO_EMOTION',
  'BANDWAGON',
  'NO_TRUE_SCOTSMAN'
);
CREATE TYPE momentum_type AS ENUM ('GAINING', 'LOSING', 'STABLE');

-- ============================================
-- DEBATES TABLE
-- ============================================

CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Debate metadata
  title TEXT NOT NULL,
  mode analysis_mode NOT NULL DEFAULT 'arena',
  total_duration INTEGER, -- in seconds
  
  -- Source information
  video_url TEXT,
  video_platform TEXT, -- 'youtube', 'local', etc.
  transcript_text TEXT,
  transcript_source TEXT, -- 'youtube', 'uploaded', 'ai_generated'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  
  -- Status
  analysis_status TEXT DEFAULT 'draft', -- 'draft', 'analyzing', 'completed', 'failed'
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Tags and categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  topic TEXT,
  
  -- Final verdict (JSONB for flexibility)
  final_verdict JSONB
);

-- Indexes
CREATE INDEX idx_debates_user_id ON debates(user_id);
CREATE INDEX idx_debates_updated_at ON debates(updated_at DESC);
CREATE INDEX idx_debates_mode ON debates(mode);

-- RLS
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debates"
  ON debates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debates"
  ON debates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debates"
  ON debates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debates"
  ON debates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DEBATE PARTICIPANTS TABLE
-- ============================================

CREATE TABLE debate_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  
  -- Participant details
  name TEXT NOT NULL,
  participant_label TEXT NOT NULL, -- 'A', 'B', or speaker ID
  
  -- Social media context
  social_url TEXT,
  followers TEXT,
  thumbnail_url TEXT,
  
  -- Scoring
  level INTEGER DEFAULT 0,
  final_score DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_debate_participants_debate_id ON debate_participants(debate_id);

-- RLS
ALTER TABLE debate_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their debates"
  ON debate_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = debate_participants.debate_id
    AND debates.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage participants of their debates"
  ON debate_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = debate_participants.debate_id
    AND debates.user_id = auth.uid()
  ));

-- ============================================
-- ARGUMENT NODES TABLE
-- ============================================

CREATE TABLE argument_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES debate_participants(id) ON DELETE CASCADE,
  
  -- Timing
  timestamp_in DECIMAL(10,3) NOT NULL, -- in seconds
  timestamp_out DECIMAL(10,3) NOT NULL,
  
  -- Argument content
  claim_text_short TEXT NOT NULL,
  claim_text_full TEXT NOT NULL,
  
  -- Toulmin analysis
  toulmin_component toulmin_component NOT NULL,
  
  -- Logic evaluation
  logic_status logic_status NOT NULL,
  fallacy_type fallacy_type,
  
  -- Scoring
  score_impact DECIMAL(5,2) NOT NULL DEFAULT 0,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-1 confidence score
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_argument_nodes_debate_id ON argument_nodes(debate_id);
CREATE INDEX idx_argument_nodes_participant_id ON argument_nodes(participant_id);
CREATE INDEX idx_argument_nodes_timestamp ON argument_nodes(debate_id, timestamp_in);
CREATE INDEX idx_argument_nodes_logic_status ON argument_nodes(logic_status);

-- RLS
ALTER TABLE argument_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view argument nodes of their debates"
  ON argument_nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = argument_nodes.debate_id
    AND debates.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage argument nodes of their debates"
  ON argument_nodes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = argument_nodes.debate_id
    AND debates.user_id = auth.uid()
  ));

-- ============================================
-- TEMPORAL SCORES TABLE
-- ============================================

CREATE TABLE temporal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  
  -- Timing
  timestamp DECIMAL(10,3) NOT NULL, -- in seconds
  
  -- Scores by participant
  participant_a_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  participant_b_score DECIMAL(5,2), -- NULL for monologue mode
  
  -- Momentum tracking
  momentum momentum_type NOT NULL DEFAULT 'STABLE',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_temporal_scores_debate_id ON temporal_scores(debate_id);
CREATE INDEX idx_temporal_scores_timestamp ON temporal_scores(debate_id, timestamp);

-- RLS
ALTER TABLE temporal_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view temporal scores of their debates"
  ON temporal_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = temporal_scores.debate_id
    AND debates.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage temporal scores of their debates"
  ON temporal_scores FOR ALL
  USING (EXISTS (
    SELECT 1 FROM debates
    WHERE debates.id = temporal_scores.debate_id
    AND debates.user_id = auth.uid()
  ));

-- ============================================
-- PROMPT STUDIO SCHEMA (for existing features)
-- ============================================

CREATE TYPE prompt_mode AS ENUM ('image', 'video', 'sequence', 'audio');
CREATE TYPE image_size AS ENUM ('1K', '2K', '4K');
CREATE TYPE video_resolution AS ENUM ('720p', '1080p');

CREATE TABLE prompt_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Project details
  name TEXT NOT NULL,
  mode prompt_mode NOT NULL DEFAULT 'image',
  
  -- Prompt state (JSONB for flexibility)
  prompt_state JSONB NOT NULL,
  
  -- Generated prompts
  final_prompt TEXT,
  
  -- History tracking
  prompt_history TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Indexes
CREATE INDEX idx_prompt_projects_user_id ON prompt_projects(user_id);
CREATE INDEX idx_prompt_projects_mode ON prompt_projects(mode);
CREATE INDEX idx_prompt_projects_updated_at ON prompt_projects(updated_at DESC);

-- RLS
ALTER TABLE prompt_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt projects"
  ON prompt_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt projects"
  ON prompt_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompt projects"
  ON prompt_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt projects"
  ON prompt_projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SEQUENCE SEGMENTS TABLE (Storyboard mode)
-- ============================================

CREATE TABLE sequence_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES prompt_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Segment details
  segment_number INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 5,
  action_description TEXT NOT NULL,
  
  -- Visual details
  camera_movement TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  
  -- Generated prompt
  generation_prompt TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_sequence_segments_project_id ON sequence_segments(project_id);
CREATE INDEX idx_sequence_segments_user_id ON sequence_segments(user_id);
CREATE INDEX idx_sequence_segments_order ON sequence_segments(project_id, sort_order);

-- RLS
ALTER TABLE sequence_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequence segments"
  ON sequence_segments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sequence segments"
  ON sequence_segments FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TRANSCRIPTIONS TABLE
-- ============================================

CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source
  source_type TEXT NOT NULL, -- 'recording', 'upload', 'youtube'
  source_url TEXT,
  audio_duration INTEGER, -- in seconds
  
  -- Transcription result
  transcript_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  
  -- AI features
  diarization_data JSONB, -- Speaker separation data
  summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  title TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Indexes
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- RLS
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transcriptions"
  ON transcriptions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_chronstudio_projects_updated_at
  BEFORE UPDATE ON chronstudio_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chronstudio_characters_updated_at
  BEFORE UPDATE ON chronstudio_characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chronstudio_scenes_updated_at
  BEFORE UPDATE ON chronstudio_scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debates_updated_at
  BEFORE UPDATE ON debates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_projects_updated_at
  BEFORE UPDATE ON prompt_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE chronstudio_projects IS 'ChronStudio narrative video projects';
COMMENT ON TABLE chronstudio_characters IS 'Character library for video stories';
COMMENT ON TABLE chronstudio_scenes IS 'Storyboard scenes with Veo generation prompts';
COMMENT ON TABLE debates IS 'Debate analysis sessions from Analysis Studio';
COMMENT ON TABLE debate_participants IS 'Participants in debate analyses';
COMMENT ON TABLE argument_nodes IS 'Individual argument claims with Toulmin analysis';
COMMENT ON TABLE temporal_scores IS 'Time-series scoring data for debates';
COMMENT ON TABLE prompt_projects IS 'Main prompt builder projects';
COMMENT ON TABLE sequence_segments IS 'Multi-clip storyboard sequences';
COMMENT ON TABLE transcriptions IS 'Audio/video transcriptions';
