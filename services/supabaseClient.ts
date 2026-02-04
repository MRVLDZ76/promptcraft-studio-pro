import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPES
// ============================================

export interface User {
  id?: string;
  created_at?: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: any;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
  api_usage_count?: number;
}

export interface CreatorProfile {
  id?: string;
  created_at?: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter';
  username: string;
  handle: string;
  display_name: string;
  thumbnail?: string;
  description?: string;
  followers_count?: number;
  followers_text?: string;
  total_videos?: number;
  total_views?: number;
  verified?: boolean;
  engagement_rate?: number;
  raw_data?: any;
}

export interface VideoTranscript {
  id?: string;
  created_at?: string;
  video_id: string;
  video_url: string;
  title?: string;
  channel_name?: string;
  channel_id?: string;
  duration?: string;
  transcript_text: string;
  transcript_snippets?: any[];
  languages?: any[];
  language_code?: string;
  word_count?: number;
}

export interface WSDCConfiguration {
  id?: string;
  created_at?: string;
  user_id?: string;
  name: string;
  description?: string;
  content_weight: number;
  style_weight: number;
  strategy_weight: number;
  is_default?: boolean;
  is_public?: boolean;
  usage_count?: number;
}

export interface Analysis {
  id?: string;
  created_at?: string;
  user_id?: string;
  mode: 'arena' | 'solo';
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Participants
  participant_a_name: string;
  participant_a_handle?: string;
  participant_a_platform?: string;
  participant_a_profile_id?: string;
  participant_b_name?: string;
  participant_b_handle?: string;
  participant_b_platform?: string;
  participant_b_profile_id?: string;
  
  // Video/Content
  video_url?: string;
  video_id?: string;
  transcript_id?: string;
  transcript_text?: string;
  
  // Configuration
  arbiter_preset?: string;
  prompt: string;
  system_prompt?: string;
  region?: string;
  year?: string;
  demography?: string;
  persona?: string;
  logic_style?: string;
  stakeholder_mode?: string;
  margin_of_error?: number;
  
  // WSDC Weights
  wsdc_content_weight?: number;
  wsdc_style_weight?: number;
  wsdc_strategy_weight?: number;
  wsdc_config_id?: string;
  
  // RAG Context
  rag_urls?: string[];
  context_files?: string[];
  
  // Results
  result_text?: string;
  result_json?: any;
  score_a?: number;
  score_b?: number;
  winner?: string;
  confidence?: number;
  
  // Performance
  processing_time_ms?: number;
  tokens_used?: number;
  cost_usd?: number;
  
  // Metadata
  chain_of_thought?: string;
  temporal_scores?: any[];
  tags?: string[];
  is_public?: boolean;
  view_count?: number;
}

export interface FallacyLog {
  id?: string;
  created_at?: string;
  analysis_id: string;
  timestamp: string;
  fallacy_type: string;
  speaker: string;
  description: string;
  severity?: 'minor' | 'moderate' | 'severe' | 'critical';
  impact_score?: number;
  quote?: string;
  timestamp_in_video?: number;
  context?: string;
}

export interface ChannelCache {
  id?: string;
  created_at?: string;
  channel_handle: string;
  channel_data: any;
  expires_at: string;
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Save a complete analysis to the database
 */
export async function saveAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('analyses')
    .insert([analysis])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get recent analyses with optional filters
 */
export async function getRecentAnalyses(options?: {
  limit?: number;
  mode?: 'arena' | 'solo';
  userId?: string;
  publicOnly?: boolean;
}) {
  const { limit = 20, mode, userId, publicOnly = false } = options || {};
  
  let query = supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mode) {
    query = query.eq('mode', mode);
  }
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (publicOnly) {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get a single analysis by ID
 */
export async function getAnalysisById(id: string) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*, fallacy_logs(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update analysis view count
 */
export async function incrementAnalysisViews(id: string) {
  const { error } = await supabase.rpc('increment_analysis_views', {
    analysis_uuid: id
  });
  
  if (error) throw error;
}

/**
 * Search analyses by text
 */
export async function searchAnalyses(searchTerm: string, limit = 20) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .textSearch('search_vector', searchTerm)
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get analysis statistics
 */
export async function getAnalysisStats(userId?: string) {
  const { data, error } = await supabase.rpc('get_analysis_stats', {
    user_uuid: userId || null
  });

  if (error) throw error;
  return data;
}

// ============================================
// FALLACY LOG FUNCTIONS
// ============================================

/**
 * Save multiple fallacy logs for an analysis
 */
export async function saveFallacyLogs(logs: Omit<FallacyLog, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('fallacy_logs')
    .insert(logs)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get fallacy logs for an analysis
 */
export async function getFallacyLogs(analysisId: string) {
  const { data, error } = await supabase
    .from('fallacy_logs')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================
// CREATOR PROFILE FUNCTIONS
// ============================================

/**
 * Cache a creator profile
 */
export async function cacheCreatorProfile(profile: Omit<CreatorProfile, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert([profile], {
      onConflict: 'platform,username'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get cached creator profile
 */
export async function getCachedCreatorProfile(platform: string, username: string) {
  // Return null if platform or username is invalid
  if (!platform || !username) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('platform', platform)
    .eq('username', username)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

  if (error) {
    console.warn('Error fetching cached profile:', error);
    return null;
  }
  return data;
}

// ============================================
// VIDEO TRANSCRIPT FUNCTIONS
// ============================================

/**
 * Cache a video transcript
 */
export async function cacheVideoTranscript(transcript: Omit<VideoTranscript, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('video_transcripts')
    .upsert([transcript], {
      onConflict: 'video_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get cached video transcript
 */
export async function getCachedVideoTranscript(videoId: string) {
  const { data, error } = await supabase
    .from('video_transcripts')
    .select('*')
    .eq('video_id', videoId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

  if (error) {
    console.warn('Error fetching cached transcript:', error);
    return null;
  }
  return data;
}

// ============================================
// WSDC CONFIGURATION FUNCTIONS
// ============================================

/**
 * Get all public WSDC configurations
 */
export async function getPublicWSDCConfigs() {
  const { data, error } = await supabase
    .from('wsdc_configurations')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Save a WSDC configuration
 */
export async function saveWSDCConfig(config: Omit<WSDCConfiguration, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('wsdc_configurations')
    .insert([config])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Increment WSDC config usage
 */
export async function incrementWSDCUsage(configId: string) {
  const { data, error } = await supabase.rpc('increment_wsdc_usage', { config_uuid: configId });
  if (error) throw error;
  return data;
}

// ============================================
// CHANNEL CACHE FUNCTIONS (Lightweight)
// ============================================

/**
 * Cache channel data (24hr lightweight cache)
 */
export async function cacheChannelData(handle: string, data: any) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data: cached, error } = await supabase
    .from('channel_cache')
    .upsert([{
      channel_handle: handle,
      channel_data: data,
      expires_at: expiresAt.toISOString()
    }], {
      onConflict: 'channel_handle'
    })
    .select()
    .single();

  if (error) throw error;
  return cached;
}

/**
 * Get cached channel data
 */
export async function getCachedChannelData(handle: string) {
  const { data, error } = await supabase
    .from('channel_cache')
    .select('*')
    .eq('channel_handle', handle)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

  if (error) {
    console.warn('Error fetching cached channel:', error);
    return null;
  }
  return data;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Cleanup expired cache entries
 */
export async function cleanupExpiredCache() {
  const { data, error } = await supabase.rpc('cleanup_expired_cache');
  if (error) throw error;
  return data;
}

/**
 * Log API usage
 */
export async function logAPIUsage(usage: {
  user_id?: string;
  api_type: 'gemini' | 'serpapi' | 'youtube' | 'instagram';
  endpoint: string;
  request_data?: any;
  response_status?: number;
  tokens_used?: number;
  cost_usd?: number;
  error_message?: string;
}) {
  const { error } = await supabase
    .from('api_usage_logs')
    .insert([usage]);

  if (error) console.error('Failed to log API usage:', error);
}

// ============================================
// VECTOR SEARCH FUNCTIONS (RAG PIPELINE)
// ============================================

/**
 * Store document with embedding
 */
export async function storeDocumentEmbedding(doc: {
  content: string;
  embedding: number[];
  metadata?: any;
  source?: string;
  source_url?: string;
  title?: string;
  chunk_index?: number;
}) {
  const { data, error } = await supabase
    .from('document_embeddings')
    .insert([doc])
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Store analysis with embedding
 */
export async function storeAnalysisEmbedding(analysis: {
  content: string;
  embedding: number[];
  analysis_id: string;
  video_id?: string;
  creator_name?: string;
  scores?: any;
  fallacy_count?: number;
}) {
  const { data, error } = await supabase
    .from('analysis_embeddings')
    .insert([analysis])
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Search for similar documents using vector similarity
 */
export async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5,
  filter: any = {}
) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter: filter,
  });

  if (error) throw error;
  return data;
}

/**
 * Search for similar analyses using vector similarity
 */
export async function searchSimilarAnalysesDB(
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
) {
  const { data, error } = await supabase.rpc('match_analyses', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw error;
  return data;
}

/**
 * Delete document embeddings by source URL
 */
export async function deleteDocumentEmbeddingsBySource(sourceUrl: string) {
  const { data, error } = await supabase
    .from('document_embeddings')
    .delete()
    .eq('source_url', sourceUrl);

  if (error) throw error;
  return data;
}

/**
 * Get vector store statistics
 */
export async function getVectorStoreStats() {
  const [docStats, analysisStats] = await Promise.all([
    supabase.from('document_embedding_stats').select('*').single(),
    supabase.from('analysis_embedding_stats').select('*').single(),
  ]);

  return {
    documents: docStats.data || {},
    analyses: analysisStats.data || {},
  };
}
