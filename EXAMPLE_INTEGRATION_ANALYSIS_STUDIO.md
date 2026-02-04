// EXAMPLE INTEGRATION - Analysis Studio with Persistence
// This shows how to integrate the data persistence layer into your component
// Date: January 26, 2026

import React, { useState, useCallback, useRef } from 'react';
import { useAnalysisPersistence } from '../services/useAnalysisPersistence';
import { HistoryPanel } from '../components/HistoryPanel';
import { getUserTranscriptions } from '../services/historyService';

interface AnalysisStudioExampleProps {
  userId: string;
}

/**
 * EXAMPLE IMPLEMENTATION
 * Shows best practices for integrating data persistence
 */
export function AnalysisStudioExample({ userId }: AnalysisStudioExampleProps) {
  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcriptId, setTranscriptId] = useState('');
  const [participantA, setParticipantA] = useState({ name: '', handle: '' });
  const [participantB, setParticipantB] = useState({ name: '', handle: '' });
  const [analysisMode, setAnalysisMode] = useState<'arena' | 'solo'>('arena');
  const [wsdcWeights, setWsdcWeights] = useState({
    content: 0.4,
    style: 0.3,
    strategy: 0.3,
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'checking' | 'hit' | 'miss' | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const analysisStartTimeRef = useRef<number>(0);

  // ═══════════════════════════════════════════════════════════
  // USE HOOKS
  // ═══════════════════════════════════════════════════════════
  const { saveAnalysis, tryGetCachedResult, isSaving } = useAnalysisPersistence({
    userId,
    autoSave: true,
    enableCache: true,
    onSaveSuccess: (result) => {
      showNotification(`✅ Analysis saved (ID: ${result.savedAnalysis.id})`);
    },
    onSaveError: (error) => {
      showNotification(`⚠️ Save failed: ${error.message}`, 'error');
    },
  });

  // ═══════════════════════════════════════════════════════════
  // TRANSCRIPTION LOADING
  // ═══════════════════════════════════════════════════════════
  const loadTranscription = useCallback(async (videoId: string) => {
    try {
      // Step 1: Check if we already transcribed this video
      const existingTranscripts = await getUserTranscriptions(userId);
      const cached = existingTranscripts.find(t => 
        t.video_transcript_id === videoId && t.is_cached
      );

      if (cached) {
        console.log('📝 Using saved transcription');
        setTranscript(cached.transcription_text);
        setTranscriptId(cached.id);
        setCacheStatus('hit');
        return;
      }

      // Step 2: No saved transcription - fetch from API
      console.log('🔄 Fetching transcription from API...');
      const response = await fetch(`/api/transcribe?videoId=${videoId}`);
      const data = await response.json();

      setTranscript(data.transcript);
      setTranscriptId(data.transcriptId);
      setCacheStatus('miss');
      
      showNotification('📝 Transcription complete');
    } catch (error) {
      console.error('Failed to load transcription:', error);
      showNotification('Failed to load transcription', 'error');
    }
  }, [userId]);

  // ═══════════════════════════════════════════════════════════
  // ANALYSIS WITH CACHE CHECK
  // ═══════════════════════════════════════════════════════════
  const handleAnalyze = useCallback(async () => {
    if (!transcript || !participantA.name) {
      showNotification('Please select video and enter participants', 'error');
      return;
    }

    setIsAnalyzing(true);
    analysisStartTimeRef.current = Date.now();

    try {
      const customPrompt = `Analyze this debate between ${participantA.name} and ${
        participantB.name || 'self'
      } using WSDC criteria.`;

      // ✨ STEP 1: CHECK CACHE FIRST (most important!)
      // ═══════════════════════════════════════════════════════════
      console.log('🔍 Checking cache...');
      setCacheStatus('checking');

      const cachedResult = await tryGetCachedResult(
        transcriptId,
        customPrompt,
        wsdcWeights
      );

      if (cachedResult) {
        console.log('🚀 CACHE HIT! Returning immediately');
        setAnalysisResult(cachedResult);
        setCacheStatus('hit');
        
        showNotification(
          '⚡ Retrieved from cache (saved API cost & time!)',
          'success'
        );
        setIsAnalyzing(false);
        return; // Exit early - no API call needed!
      }

      // Cache miss - proceed with analysis
      setCacheStatus('miss');

      // ✨ STEP 2: CALL ANALYSIS API
      // ═══════════════════════════════════════════════════════════
      console.log('🔄 Running new analysis...');
      showNotification('🔄 Analyzing... (this may take 30-60 seconds)');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          participants: {
            a: participantA,
            b: participantB,
          },
          mode: analysisMode,
          wsdcWeights,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);

      console.log('✅ Analysis complete');

      // ✨ STEP 3: SAVE RESULT AUTOMATICALLY
      // ═══════════════════════════════════════════════════════════
      const processingTime = Date.now() - analysisStartTimeRef.current;
      console.log(`📊 Auto-saving result (${processingTime}ms)...`);

      // The saveAnalysis call happens automatically via the hook
      // (because autoSave: true), but you can also call it manually:
      await saveAnalysis({
        assetId: undefined, // Set if you have an asset ID
        transcriptionId: transcriptId,
        
        // Participants
        participantA,
        participantB: analysisMode === 'arena' ? participantB : undefined,
        
        // Configuration
        mode: analysisMode,
        wsdcWeights,
        prompt: customPrompt,
        analysisName: `${participantA.name} Analysis ${new Date().toLocaleDateString()}`,
        
        // Input & Results
        transcript,
        resultJson: result,
        
        // Metadata
        processingTimeMs: processingTime,
        tokensUsed: result.metadata?.tokens,
        apiCostUsd: result.metadata?.cost,
        tags: ['fresh-analysis', analysisMode],
      });

      showNotification('✅ Analysis saved to history!', 'success');
    } catch (error) {
      console.error('Analysis failed:', error);
      showNotification(`Error: ${error.message}`, 'error');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    transcript,
    transcriptId,
    participantA,
    participantB,
    analysisMode,
    wsdcWeights,
    tryGetCachedResult,
    saveAnalysis,
  ]);

  // ═══════════════════════════════════════════════════════════
  // HISTORY INTEGRATION
  // ═══════════════════════════════════════════════════════════
  const handleHistorySelect = useCallback((analysis: any) => {
    console.log('📚 Loading from history:', analysis);
    
    // Populate form with historical analysis
    setParticipantA({
      name: analysis.participant_a_name,
      handle: analysis.participant_a_handle,
    });
    if (analysis.participant_b_name) {
      setParticipantB({
        name: analysis.participant_b_name,
        handle: analysis.participant_b_handle,
      });
    }
    
    setAnalysisMode(analysis.mode);
    setWsdcWeights({
      content: analysis.wsdc_content_weight,
      style: analysis.wsdc_style_weight,
      strategy: analysis.wsdc_strategy_weight,
    });
    
    // Load result for review
    setAnalysisResult(analysis.full_result_json);
    setSelectedHistoryItem(analysis);
    
    showNotification('📚 Loaded from history');
  }, []);

  const handleHistoryReuse = useCallback((transcriptId: string) => {
    console.log('♻️ Reusing transcript:', transcriptId);
    setTranscriptId(transcriptId);
    // Load the transcript text from the transcription_history table
    // Implementation would fetch the transcript text for this ID
  }, []);

  // ═══════════════════════════════════════════════════════════
  // UTILITY: NOTIFICATION
  // ═══════════════════════════════════════════════════════════
  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    // Implement your notification system here
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen bg-slate-950 p-4">
      {/* Main Workspace */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Input Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-bold text-white">🎯 Analysis Studio</h2>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Video URL
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() => videoUrl && loadTranscription(videoUrl)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
          </div>

          {/* Transcription Status */}
          {transcript && (
            <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
              ✅ Transcription loaded ({transcript.split(/\s+/).length} words)
              {cacheStatus === 'hit' && ' • 🚀 From cache'}
              {cacheStatus === 'miss' && ' • 🆕 Fresh fetch'}
            </div>
          )}

          {/* Participants */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Participant A
              </label>
              <input
                type="text"
                value={participantA.name}
                onChange={(e) => setParticipantA({ ...participantA, name: e.target.value })}
                placeholder="Name"
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Participant B
              </label>
              <input
                type="text"
                value={participantB.name}
                onChange={(e) => setParticipantB({ ...participantB, name: e.target.value })}
                placeholder="Name or Solo"
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* WSDC Weights */}
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(wsdcWeights).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={value}
                  onChange={(e) =>
                    setWsdcWeights({
                      ...wsdcWeights,
                      [key]: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-xs text-slate-400">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcript}
            className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
          >
            {isAnalyzing ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Analyzing...
              </>
            ) : (
              <>🔬 Analyze {cacheStatus === 'checking' ? '(checking cache...)' : ''}</>
            )}
          </button>
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex-1 overflow-auto">
            <h3 className="text-lg font-bold text-white mb-3">📊 Analysis Results</h3>
            <div className="bg-slate-800 p-3 rounded text-sm text-slate-300 whitespace-pre-wrap overflow-auto max-h-80">
              {JSON.stringify(analysisResult, null, 2)}
            </div>
            {selectedHistoryItem && (
              <div className="mt-3 text-xs text-slate-500">
                From history • {new Date(selectedHistoryItem.created_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="lg:col-span-1 min-h-0">
        <HistoryPanel
          userId={userId}
          onSelectAnalysis={handleHistorySelect}
          onReuse={handleHistoryReuse}
        />
      </div>
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST FOR YOUR PROJECT:
 * 
 * ✅ Create AnalysisStudio.tsx component
 * ✅ Import useAnalysisPersistence hook
 * ✅ Import HistoryPanel component
 * ✅ Add cache check before API call (tryGetCachedResult)
 * ✅ Auto-save results (saveAnalysis is called via hook)
 * ✅ Wire up history callbacks
 * ✅ Deploy database migration (supabase db push)
 * ✅ Test: upload → transcribe → analyze → cache hit
 * ✅ Monitor Supabase storage
 * 
 * See DATA_PERSISTENCE_INTEGRATION.md for complete guide
 */
