// Enhanced Data Access Layer for History & Caching
// Handles transcriptions, analysis results, and asset management
// Date: January 26, 2026

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface AssetUpload {
  id?: string;
  created_at?: string;
  user_id?: string;
  filename: string;
  asset_type: 'video' | 'audio' | 'document' | 'image' | 'transcript';
  source_type?: 'youtube_url' | 'file_upload' | 'api_import';
  file_size_bytes?: number;
  duration_seconds?: number;
  mime_type?: string;
  s3_path?: string;
  source_url?: string;
  content_hash?: string;
  has_transcript?: boolean;
  transcript_id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: any;
  status?: 'pending' | 'processing' | 'ready' | 'failed' | 'archived';
  error_message?: string;
  analysis_count?: number;
  last_used_at?: string;
  is_favorite?: boolean;
  retention_days?: number;
}

export interface TranscriptionHistory {
  id?: string;
  created_at?: string;
  user_id?: string;
  asset_id?: string;
  video_transcript_id?: string;
  language_detected?: string;
  language_requested?: string;
  source_api?: 'youtube_native' | 'transcript_api' | 'gemini' | 'whisper' | 'manual';
  transcription_text: string;
  segments?: any[];
  confidence_score?: number;
  processing_time_ms?: number;
  word_count?: number;
  estimated_accuracy?: string;
  speaker_diarization_enabled?: boolean;
  detected_speakers?: string[];
  has_music?: boolean;
  has_background_noise?: boolean;
  is_cached?: boolean;
  cache_hit_count?: number;
  api_cost_usd?: number;
  tokens_used?: number;
  notes?: string;
  is_verified?: boolean;
}

export interface AnalysisHistoryRecord {
  id?: string;
  created_at?: string;
  user_id?: string;
  asset_id?: string;
  transcription_id?: string;
  analysis_id?: string;
  analysis_name?: string;
  description?: string;
  mode: 'arena' | 'solo';
  participant_a_name: string;
  participant_a_handle?: string;
  participant_b_name?: string;
  participant_b_handle?: string;
  wsdc_content_weight?: number;
  wsdc_style_weight?: number;
  wsdc_strategy_weight?: number;
  calibration_settings?: any;
  input_transcript_text?: string;
  prompt_used?: string;
  score_participant_a?: number;
  score_participant_b?: number;
  winner?: string;
  confidence_score?: number;
  claims_count?: number;
  fallacies_count_a?: number;
  fallacies_count_b?: number;
  strongest_argument?: string;
  weakest_argument?: string;
  full_result_json?: any;
  chain_of_thought?: string;
  processing_time_ms?: number;
  tokens_used?: number;
  api_cost_usd?: number;
  tags?: string[];
  notes?: string;
  is_favorite?: boolean;
  is_public?: boolean;
  view_count?: number;
  is_variant?: boolean;
  variant_of_analysis_id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'archived';
  error_message?: string;
}

export interface AnalysisResultCache {
  id?: string;
  created_at?: string;
  cache_key: string;
  transcription_id?: string;
  result_json: any;
  score_a?: number;
  score_b?: number;
  winner?: string;
  hit_count?: number;
  last_accessed_at?: string;
  expires_at?: string;
  config_hash?: string;
}

// ============================================
// ASSET UPLOAD FUNCTIONS
// ============================================

/**
 * Save a new asset upload
 */
export async function saveAssetUpload(asset: Omit<AssetUpload, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('asset_uploads')
    .insert([asset])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all user assets (with pagination)
 */
export async function getUserAssets(options?: {
  userId?: string;
  assetType?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'analysis_count' | 'last_used_at';
}) {
  const { userId, assetType, limit = 50, offset = 0, sortBy = 'created_at' } = options || {};
  
  let query = supabase
    .from('asset_uploads')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) query = query.eq('user_id', userId);
  if (assetType) query = query.eq('asset_type', assetType);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return { assets: data, total: count };
}

/**
 * Get favorite assets
 */
export async function getFavoriteAssets(userId?: string) {
  let query = supabase
    .from('asset_uploads')
    .select('*')
    .eq('is_favorite', true)
    .order('last_used_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
}

/**
 * Search assets by name/tags
 */
export async function searchAssets(searchTerm: string, userId?: string) {
  let query = supabase
    .from('asset_uploads')
    .select('*')
    .or(`filename.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
}

/**
 * Find asset by content hash (detect duplicates)
 */
export async function findAssetByContentHash(contentHash: string) {
  const { data, error } = await supabase
    .from('asset_uploads')
    .select('*')
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update asset metadata
 */
export async function updateAsset(id: string, updates: Partial<AssetUpload>) {
  const { data, error } = await supabase
    .from('asset_uploads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle asset favorite status
 */
export async function toggleAssetFavorite(id: string, isFavorite: boolean) {
  return updateAsset(id, { is_favorite: isFavorite });
}

// ============================================
// TRANSCRIPTION HISTORY FUNCTIONS
// ============================================

/**
 * Save transcription to history
 */
export async function saveTranscriptionHistory(transcript: Omit<TranscriptionHistory, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('transcription_history')
    .insert([transcript])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get transcription history for asset
 */
export async function getAssetTranscriptionHistory(assetId: string) {
  const { data, error } = await supabase
    .from('transcription_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all user transcriptions
 */
export async function getUserTranscriptions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('transcription_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get cached transcriptions (for reuse)
 */
export async function getCachedTranscriptions(limit = 20) {
  const { data, error } = await supabase
    .from('transcription_history')
    .select('*')
    .eq('is_cached', true)
    .order('cache_hit_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Increment transcription cache hit
 */
export async function incrementTranscriptionCacheHit(id: string) {
  const { data, error } = await supabase.rpc('increment_transcription_cache_hit', {
    transcript_id: id
  });

  if (error) throw error;
  return data;
}

// ============================================
// ANALYSIS HISTORY FUNCTIONS
// ============================================

/**
 * Save analysis to history
 */
export async function saveAnalysisHistory(analysis: Omit<AnalysisHistoryRecord, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('analysis_history')
    .insert([analysis])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get analysis history for asset
 */
export async function getAssetAnalysisHistory(assetId: string) {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all user analyses (with optional filters)
 */
export async function getUserAnalysisHistory(options?: {
  userId?: string;
  mode?: 'arena' | 'solo';
  limit?: number;
  offset?: number;
}) {
  const { userId, mode, limit = 50, offset = 0 } = options || {};
  
  let query = supabase
    .from('analysis_history')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) query = query.eq('user_id', userId);
  if (mode) query = query.eq('mode', mode);

  const { data, error, count } = await query;
  if (error) throw error;
  
  return { analyses: data, total: count };
}

/**
 * Search analysis history
 */
export async function searchAnalysisHistory(options?: {
  searchQuery?: string;
  mode?: 'arena' | 'solo';
  dateFrom?: string;
  dateTo?: string;
  onlyFavorites?: boolean;
  userId?: string;
}) {
  const { searchQuery, mode, dateFrom, dateTo, onlyFavorites = false, userId } = options || {};
  
  let query = supabase
    .from('analysis_history')
    .select('*');

  if (searchQuery) {
    query = query.or(
      `participant_a_name.ilike.%${searchQuery}%,` +
      `participant_b_name.ilike.%${searchQuery}%,` +
      `analysis_name.ilike.%${searchQuery}%`
    );
  }

  if (mode) query = query.eq('mode', mode);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);
  if (onlyFavorites) query = query.eq('is_favorite', true);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('is_favorite', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  
  return data;
}

/**
 * Get favorite analyses
 */
export async function getFavoriteAnalyses(userId?: string) {
  let query = supabase
    .from('analysis_history')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
}

/**
 * Update analysis record
 */
export async function updateAnalysisHistory(id: string, updates: Partial<AnalysisHistoryRecord>) {
  const { data, error } = await supabase
    .from('analysis_history')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle analysis favorite status
 */
export async function toggleAnalysisFavorite(id: string, isFavorite: boolean) {
  return updateAnalysisHistory(id, { is_favorite: isFavorite });
}

/**
 * Get analysis statistics summary
 */
export async function getAnalysisStatistics(userId?: string) {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('mode, winner, score_participant_a, score_participant_b')
    .eq(userId ? 'user_id' : 'user_id', userId || null);

  if (error) throw error;

  const analyses = data || [];
  const arenaCount = analyses.filter(a => a.mode === 'arena').length;
  const soloCount = analyses.filter(a => a.mode === 'solo').length;
  const wins_a = analyses.filter(a => a.winner === 'A').length;
  const wins_b = analyses.filter(a => a.winner === 'B').length;
  const ties = analyses.filter(a => a.winner === 'tie').length;
  const avgScore_a = analyses.reduce((sum, a) => sum + (a.score_participant_a || 0), 0) / Math.max(analyses.length, 1);
  const avgScore_b = analyses.reduce((sum, a) => sum + (a.score_participant_b || 0), 0) / Math.max(analyses.length, 1);

  return {
    total: analyses.length,
    arenaCount,
    soloCount,
    wins: { a: wins_a, b: wins_b, ties },
    avgScores: { a: avgScore_a, b: avgScore_b }
  };
}

// ============================================
// RESULT CACHE FUNCTIONS
// ============================================

/**
 * Generate cache key from analysis parameters
 */
export function generateCacheKey(transcriptId: string, promptHash: string, configHash: string): string {
  return `${transcriptId}:${promptHash}:${configHash}`;
}

/**
 * Save cached result
 */
export async function saveCachedResult(cache: Omit<AnalysisResultCache, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('analysis_result_cache')
    .upsert([cache], {
      onConflict: 'cache_key'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get cached result if exists and not expired
 */
export async function getCachedResult(cacheKey: string) {
  const { data, error } = await supabase
    .from('analysis_result_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  
  if (data) {
    // Increment hit count
    await supabase
      .from('analysis_result_cache')
      .update({ hit_count: (data.hit_count || 1) + 1, last_accessed_at: new Date().toISOString() })
      .eq('cache_key', cacheKey);
  }

  return data;
}

/**
 * Clear old cache entries
 */
export async function clearExpiredCache() {
  const { error } = await supabase
    .from('analysis_result_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) throw error;
}

// ============================================
// COMBINED HISTORY VIEW
// ============================================

/**
 * Get complete analysis with asset and transcription context
 */
export async function getCompleteAnalysisContext(analysisId: string) {
  const { data: analysis, error: analysisError } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (analysisError) throw analysisError;

  let asset = null;
  let transcription = null;

  if (analysis.asset_id) {
    const { data: assetData } = await supabase
      .from('asset_uploads')
      .select('*')
      .eq('id', analysis.asset_id)
      .single();
    asset = assetData;
  }

  if (analysis.transcription_id) {
    const { data: transcData } = await supabase
      .from('transcription_history')
      .select('*')
      .eq('id', analysis.transcription_id)
      .single();
    transcription = transcData;
  }

  return { analysis, asset, transcription };
}

/**
 * Get dashboard summary (recent items across all types)
 */
export async function getDashboardSummary(userId?: string, limit = 10) {
  const [recentAssets, recentAnalyses, favoriteAnalyses] = await Promise.all([
    supabase
      .from('asset_uploads')
      .select('*')
      .eq(userId ? 'user_id' : 'user_id', userId || null)
      .order('last_used_at', { ascending: false })
      .limit(limit),
    supabase
      .from('analysis_history')
      .select('*')
      .eq(userId ? 'user_id' : 'user_id', userId || null)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('analysis_history')
      .select('*')
      .eq('is_favorite', true)
      .eq(userId ? 'user_id' : 'user_id', userId || null)
      .limit(5)
  ]);

  return {
    recentAssets: recentAssets.data || [],
    recentAnalyses: recentAnalyses.data || [],
    favoriteAnalyses: favoriteAnalyses.data || []
  };
}
