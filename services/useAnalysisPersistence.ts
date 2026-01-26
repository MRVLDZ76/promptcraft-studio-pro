// useAnalysisPersistence.ts - React Hook for seamless result saving
// Provides caching, persistence, and history tracking for UI components
// Date: January 26, 2026

import { useCallback, useState, useRef } from 'react';
import { persistAnalysisResult, checkCachedAnalysis, hashConfig, hashContent } from './resultPersistenceService';

interface UseAnalysisPersistenceOptions {
  userId?: string;
  autoSave?: boolean;
  enableCache?: boolean;
  onSaveSuccess?: (result: any) => void;
  onSaveError?: (error: any) => void;
}

export function useAnalysisPersistence(options: UseAnalysisPersistenceOptions = {}) {
  const {
    userId,
    autoSave = true,
    enableCache = true,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ═══════════════════════════════════════════════════════════
  // Persist a single analysis result
  // ═══════════════════════════════════════════════════════════
  const saveAnalysis = useCallback(
    async (analysisPayload: {
      assetId?: string;
      transcriptionId?: string;
      videoTranscriptId?: string;
      participantA: { name: string; handle?: string };
      participantB?: { name: string; handle?: string };
      mode: 'arena' | 'solo';
      wsdcWeights: any;
      calibrationSettings?: any;
      prompt?: string;
      analysisName?: string;
      transcript?: string;
      resultJson: any;
      processingTimeMs?: number;
      tokensUsed?: number;
      apiCostUsd?: number;
      tags?: string[];
    }) => {
      if (!autoSave) {
        console.log('Auto-save disabled');
        return null;
      }

      setIsSaving(true);
      try {
        const result = await persistAnalysisResult({
          ...analysisPayload,
          userId: userId,
        });

        setLastSavedId(result.savedAnalysis?.id);
        onSaveSuccess?.(result);

        return result;
      } catch (error) {
        console.error('Failed to save analysis:', error);
        onSaveError?.(error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [autoSave, userId, onSaveSuccess, onSaveError]
  );

  // ═══════════════════════════════════════════════════════════
  // Check if cached result exists
  // ═══════════════════════════════════════════════════════════
  const tryGetCachedResult = useCallback(
    async (
      transcriptId: string,
      prompt: string,
      weights: any,
      calibration?: any
    ) => {
      if (!enableCache) return null;

      try {
        const cached = await checkCachedAnalysis(transcriptId, prompt, weights, calibration);
        setCacheHit(!!cached);
        return cached;
      } catch (error) {
        console.warn('Cache retrieval failed:', error);
        return null;
      }
    },
    [enableCache]
  );

  // ═══════════════════════════════════════════════════════════
  // Batch save multiple analyses
  // ═══════════════════════════════════════════════════════════
  const saveBatch = useCallback(
    async (analyses: any[]) => {
      setIsSaving(true);
      try {
        const results = await Promise.allSettled(
          analyses.map(a => saveAnalysis(a))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Batch save: ${successful} successful, ${failed} failed`);
        return { successful, failed, total: analyses.length };
      } finally {
        setIsSaving(false);
      }
    },
    [saveAnalysis]
  );

  // ═══════════════════════════════════════════════════════════
  // Cancel in-flight save
  // ═══════════════════════════════════════════════════════════
  const cancelSave = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsSaving(false);
  }, []);

  return {
    saveAnalysis,
    tryGetCachedResult,
    saveBatch,
    cancelSave,
    isSaving,
    lastSavedId,
    cacheHit,
  };
}
