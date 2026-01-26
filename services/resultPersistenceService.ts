// Result Persistence & Caching Middleware
// Automatically saves analysis results and manages cache
// Date: January 26, 2026

import { saveAnalysisHistory, saveCachedResult, getCachedResult, generateCacheKey, saveAssetUpload, saveTranscriptionHistory } from './historyService';
import { cacheVideoTranscript } from './supabaseClient';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface AnalysisResultPayload {
  // Identifiers
  assetId?: string;
  transcriptionId?: string;
  videoTranscriptId?: string;
  
  // Participants
  participantA: { name: string; handle?: string };
  participantB?: { name: string; handle?: string };
  
  // Configuration
  mode: 'arena' | 'solo';
  wsdcWeights: { content: number; style: number; strategy: number };
  calibrationSettings?: any;
  prompt?: string;
  analysisName?: string;
  
  // Input
  transcript?: string;
  
  // Results
  resultJson: any;
  
  // Metadata
  processingTimeMs?: number;
  tokensUsed?: number;
  apiCostUsd?: number;
  userId?: string;
  tags?: string[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create MD5 hash for content deduplication
 */
export function hashContent(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Create config hash from WSDC weights and calibration
 */
export function hashConfig(weights: any, calibration?: any): string {
  const configStr = JSON.stringify({ weights, calibration });
  return crypto.createHash('md5').update(configStr).digest('hex');
}

/**
 * Extract key data from analysis result
 */
function extractResultMetrics(resultJson: any) {
  const fallacies = resultJson.fallacies || [];
  const claims = resultJson.claims || [];
  
  return {
    claimsCount: claims.length,
    fallaciesCountA: fallacies.filter((f: any) => f.speaker === 'A').length,
    fallaciesCountB: fallacies.filter((f: any) => f.speaker === 'B').length,
    strongestArgument: resultJson.strongest_argument || '',
    weakestArgument: resultJson.weakest_argument || '',
  };
}

// ============================================
// MAIN PERSISTENCE FUNCTION
// ============================================

/**
 * Save analysis result with automatic caching and history tracking
 * Call this after analysis completes successfully
 */
export async function persistAnalysisResult(payload: AnalysisResultPayload): Promise<any> {
  try {
    const {
      assetId,
      transcriptionId,
      videoTranscriptId,
      participantA,
      participantB,
      mode,
      wsdcWeights,
      calibrationSettings,
      prompt,
      analysisName,
      transcript,
      resultJson,
      processingTimeMs,
      tokensUsed,
      apiCostUsd,
      userId,
      tags,
    } = payload;

    // Extract key metrics from result
    const metrics = extractResultMetrics(resultJson);

    // ═══════════════════════════════════════════════════════════
    // Step 1: Save to cache for rapid retrieval
    // ═══════════════════════════════════════════════════════════
    if (transcriptionId) {
      const configHash = hashConfig(wsdcWeights, calibrationSettings);
      const promptHash = hashContent(prompt || 'default');
      const cacheKey = generateCacheKey(transcriptionId, promptHash, configHash);

      try {
        await saveCachedResult({
          cache_key: cacheKey,
          transcription_id: transcriptionId,
          result_json: resultJson,
          score_a: resultJson.scores?.total?.a,
          score_b: resultJson.scores?.total?.b,
          winner: resultJson.gamification?.winner,
          config_hash: configHash,
        });
        console.log('✅ Cached analysis result');
      } catch (cacheError) {
        console.warn('⚠️ Cache save failed:', cacheError);
        // Continue - cache failure shouldn't block analysis
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Step 2: Save to analysis history for later review
    // ═══════════════════════════════════════════════════════════
    const analysisHistoryRecord = {
      user_id: userId,
      asset_id: assetId,
      transcription_id: transcriptionId,
      analysis_name: analysisName || `${participantA.name} vs ${participantB?.name || 'Self'}`,
      mode,
      participant_a_name: participantA.name,
      participant_a_handle: participantA.handle,
      participant_b_name: participantB?.name,
      participant_b_handle: participantB?.handle,
      wsdc_content_weight: wsdcWeights.content,
      wsdc_style_weight: wsdcWeights.style,
      wsdc_strategy_weight: wsdcWeights.strategy,
      calibration_settings: calibrationSettings,
      input_transcript_text: transcript?.substring(0, 500), // Truncate for quick view
      prompt_used: prompt,
      score_participant_a: resultJson.scores?.total?.a,
      score_participant_b: resultJson.scores?.total?.b,
      winner: resultJson.gamification?.winner,
      confidence_score: resultJson.final_verdict?.confidence || 0.8,
      claims_count: metrics.claimsCount,
      fallacies_count_a: metrics.fallaciesCountA,
      fallacies_count_b: metrics.fallaciesCountB,
      strongest_argument: metrics.strongestArgument,
      weakest_argument: metrics.weakestArgument,
      full_result_json: resultJson,
      chain_of_thought: resultJson.chain_of_thought,
      processing_time_ms: processingTimeMs,
      tokens_used: tokensUsed,
      api_cost_usd: apiCostUsd,
      tags: tags || [],
    };

    const savedAnalysis = await saveAnalysisHistory(analysisHistoryRecord);
    console.log('✅ Saved analysis to history:', savedAnalysis.id);

    // ═══════════════════════════════════════════════════════════
    // Step 3: Save transcript to history if provided
    // ═══════════════════════════════════════════════════════════
    if (transcript && transcriptionId) {
      try {
        await saveTranscriptionHistory({
          user_id: userId,
          asset_id: assetId,
          video_transcript_id: videoTranscriptId,
          transcription_text: transcript,
          source_api: 'gemini', // or whatever source
          confidence_score: 95,
          word_count: transcript.split(/\s+/).length,
        });
        console.log('✅ Saved transcription to history');
      } catch (transcriptError) {
        console.warn('⚠️ Transcription history save failed:', transcriptError);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Step 4: Update asset usage count
    // ═══════════════════════════════════════════════════════════
    if (assetId) {
      try {
        // Asset count is auto-incremented via trigger on analysis insert
        console.log('✅ Asset usage tracked via trigger');
      } catch (assetError) {
        console.warn('⚠️ Asset tracking failed:', assetError);
      }
    }

    return {
      success: true,
      savedAnalysis,
      cacheKey: generateCacheKey(transcriptionId || '', hashContent(prompt || 'default'), hashConfig(wsdcWeights)),
    };
  } catch (error) {
    console.error('❌ Result persistence failed:', error);
    throw error;
  }
}

// ============================================
// CACHE CHECK & RETRIEVAL
// ============================================

/**
 * Check if analysis result exists in cache before running analysis
 * Returns cached result if found and valid
 */
export async function checkCachedAnalysis(
  transcriptId: string,
  prompt: string,
  weights: any,
  calibration?: any
): Promise<any | null> {
  try {
    if (!transcriptId) return null;

    const configHash = hashConfig(weights, calibration);
    const promptHash = hashContent(prompt);
    const cacheKey = generateCacheKey(transcriptId, promptHash, configHash);

    console.log(`🔍 Checking cache for key: ${cacheKey.substring(0, 20)}...`);

    const cachedResult = await getCachedResult(cacheKey);

    if (cachedResult) {
      console.log(`✅ Cache HIT! (${cachedResult.hit_count} previous uses)`);
      return cachedResult.result_json;
    }

    console.log('❌ Cache miss - will run analysis');
    return null;
  } catch (error) {
    console.warn('Cache check failed:', error);
    return null; // Fail gracefully - proceed with analysis
  }
}

// ============================================
// INTEGRATION HELPERS
// ============================================

/**
 * Middleware to wrap analysis functions with persistence
 */
export function withResultPersistence(
  analyzeFunction: Function,
  options?: {
    autoSave?: boolean;
    cacheCheck?: boolean;
  }
) {
  const { autoSave = true, cacheCheck = true } = options || {};

  return async function wrappedAnalyze(payload: AnalysisResultPayload & { transcript?: string }) {
    // Check cache first
    if (cacheCheck && payload.transcriptionId && payload.prompt) {
      const cachedResult = await checkCachedAnalysis(
        payload.transcriptionId,
        payload.prompt,
        payload.wsdcWeights,
        payload.calibrationSettings
      );

      if (cachedResult) {
        console.log('🚀 Returning cached result - skipped API call');
        return {
          ...cachedResult,
          fromCache: true,
          cacheHit: true,
        };
      }
    }

    // Run analysis
    console.log('🔄 Running new analysis...');
    const result = await analyzeFunction(payload);

    // Auto-save result
    if (autoSave) {
      try {
        const saveResult = await persistAnalysisResult({
          ...payload,
          resultJson: result,
        });
        console.log('📊 Result saved automatically');
        return {
          ...result,
          savedAnalysis: saveResult,
        };
      } catch (saveError) {
        console.error('⚠️ Auto-save failed:', saveError);
        return result; // Return result anyway
      }
    }

    return result;
  };
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Bulk save multiple asset uploads (for batch imports)
 */
export async function bulkSaveAssets(assets: any[]) {
  try {
    const saved = await Promise.allSettled(
      assets.map(asset => saveAssetUpload(asset))
    );

    const successful = saved.filter(s => s.status === 'fulfilled').length;
    const failed = saved.filter(s => s.status === 'rejected').length;

    console.log(`📦 Bulk import: ${successful} saved, ${failed} failed`);

    return {
      total: assets.length,
      successful,
      failed,
      results: saved,
    };
  } catch (error) {
    console.error('Bulk save failed:', error);
    throw error;
  }
}

/**
 * Generate migration report of unsaved results
 */
export async function generateMigrationReport() {
  // This would query for analyses that exist but don't have history records
  // Useful for one-time data migration
  console.log('📋 Generating migration report...');
  return {
    timestamp: new Date().toISOString(),
    note: 'Implement this when migrating existing analyses to history table',
  };
}
