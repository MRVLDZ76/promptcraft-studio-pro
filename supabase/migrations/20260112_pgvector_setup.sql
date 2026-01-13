-- pgvector Extension Setup for RAG Pipeline
-- Adds vector search capabilities to Supabase for semantic similarity

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document Embeddings Table
-- Stores chunked documents with vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small (or 768 for Google)
  metadata JSONB,
  source TEXT,
  source_url TEXT,
  title TEXT,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis Embeddings Table
-- Stores past analysis results with embeddings for similarity search
CREATE TABLE IF NOT EXISTS analysis_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  video_id TEXT,
  creator_name TEXT,
  scores JSONB,
  fallacy_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector similarity search (IVFFlat)
-- Using cosine distance for semantic similarity
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
  ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS analysis_embeddings_embedding_idx 
  ON analysis_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Regular indexes for metadata filtering
CREATE INDEX IF NOT EXISTS document_embeddings_source_idx ON document_embeddings(source);
CREATE INDEX IF NOT EXISTS document_embeddings_source_url_idx ON document_embeddings(source_url);
CREATE INDEX IF NOT EXISTS document_embeddings_created_at_idx ON document_embeddings(created_at);
CREATE INDEX IF NOT EXISTS analysis_embeddings_analysis_id_idx ON analysis_embeddings(analysis_id);
CREATE INDEX IF NOT EXISTS analysis_embeddings_video_id_idx ON analysis_embeddings(video_id);
CREATE INDEX IF NOT EXISTS analysis_embeddings_creator_name_idx ON analysis_embeddings(creator_name);

-- Function to match similar documents using cosine similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.metadata,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE 
    (filter = '{}' OR document_embeddings.metadata @> filter)
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match similar analyses
CREATE OR REPLACE FUNCTION match_analyses(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  analysis_id UUID,
  video_id TEXT,
  creator_name TEXT,
  scores JSONB,
  fallacy_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    analysis_embeddings.id,
    analysis_embeddings.content,
    analysis_embeddings.analysis_id,
    analysis_embeddings.video_id,
    analysis_embeddings.creator_name,
    analysis_embeddings.scores,
    analysis_embeddings.fallacy_count,
    1 - (analysis_embeddings.embedding <=> query_embedding) AS similarity
  FROM analysis_embeddings
  WHERE 1 - (analysis_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY analysis_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document_embeddings
CREATE TRIGGER update_document_embeddings_updated_at
  BEFORE UPDATE ON document_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access for now
-- Adjust these based on your authentication requirements
CREATE POLICY "Enable read access for all users" ON document_embeddings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON document_embeddings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON analysis_embeddings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON analysis_embeddings
  FOR INSERT WITH CHECK (true);

-- Cleanup function to remove old embeddings (optional)
CREATE OR REPLACE FUNCTION cleanup_old_embeddings(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM document_embeddings
  WHERE created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant permissions (adjust based on your user setup)
GRANT ALL ON document_embeddings TO authenticated;
GRANT ALL ON analysis_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_analyses TO authenticated;

-- Create a view for document statistics
CREATE OR REPLACE VIEW document_embedding_stats AS
SELECT
  COUNT(*) as total_documents,
  COUNT(DISTINCT source) as unique_sources,
  MAX(created_at) as last_updated,
  pg_size_pretty(pg_total_relation_size('document_embeddings')) as table_size
FROM document_embeddings;

-- Create a view for analysis statistics
CREATE OR REPLACE VIEW analysis_embedding_stats AS
SELECT
  COUNT(*) as total_analyses,
  COUNT(DISTINCT creator_name) as unique_creators,
  AVG(fallacy_count) as avg_fallacy_count,
  MAX(created_at) as last_updated
FROM analysis_embeddings;

-- Comments for documentation
COMMENT ON TABLE document_embeddings IS 'Stores document chunks with vector embeddings for RAG retrieval';
COMMENT ON TABLE analysis_embeddings IS 'Stores analysis results with embeddings for similarity search';
COMMENT ON FUNCTION match_documents IS 'Finds similar documents using cosine similarity';
COMMENT ON FUNCTION match_analyses IS 'Finds similar past analyses using cosine similarity';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'pgvector setup complete! Vector search is now enabled.';
  RAISE NOTICE 'Tables created: document_embeddings, analysis_embeddings';
  RAISE NOTICE 'Functions created: match_documents, match_analyses';
END $$;
