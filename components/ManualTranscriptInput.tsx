// components/ManualTranscriptInput.tsx
// Direct text input with speaker detection and dual-mic recording
// Date: January 26, 2026

import React, { useState, useRef, useCallback } from 'react';
import {
  ManualInputMode,
  ManualInputService,
  DualMicService,
  TranscriptInputManager,
  SpeakerDetectionResult,
} from '../services/manualInputService';
import { ProcessedInput, InputType } from '../services/inputProcessor';
import { Mic2, Upload, Type, Wand2, Download, Eye, EyeOff } from 'lucide-react';

interface Props {
  onTranscriptReady: (input: ProcessedInput) => void;
  onError: (error: string) => void;
}

export const ManualTranscriptInput: React.FC<Props> = ({ onTranscriptReady, onError }) => {
  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  const [mode, setMode] = useState<ManualInputMode>(ManualInputMode.PASTE_TEXT);
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [diarizationResult, setDiarizationResult] = useState<SpeakerDetectionResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Dual Mic State
  const [recordingState, setRecordingState] = useState({
    recordingA: false,
    recordingB: false,
    transcriptA: '',
    transcriptB: '',
  });
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicA, setSelectedMicA] = useState<string>('');
  const [selectedMicB, setSelectedMicB] = useState<string>('');
  const [dualMicSupported, setDualMicSupported] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const inputManagerRef = useRef(new TranscriptInputManager());

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  React.useEffect(() => {
    const checkMicSupport = async () => {
      const supported = DualMicService.isSupported();
      setDualMicSupported(supported);
      
      if (supported) {
        try {
          const devices = await inputManagerRef.current.getAvailableMicrophones();
          setMicDevices(devices);
          if (devices.length > 0) {
            setSelectedMicA(devices[0].deviceId);
            setSelectedMicB(devices.length > 1 ? devices[1].deviceId : devices[0].deviceId);
          }
        } catch (error) {
          console.warn('Could not enumerate microphones:', error);
        }
      }
    };
    
    checkMicSupport();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PASTE/TYPE TEXT MODE
  // ═══════════════════════════════════════════════════════════════
  const handlePasteText = useCallback(async () => {
    if (!transcriptText.trim()) {
      onError('Please paste or type transcript text first');
      return;
    }

    setIsProcessing(true);
    try {
      const input = await inputManagerRef.current.processInput(
        transcriptText,
        mode
      );

      // Auto-detect speakers
      const detection = inputManagerRef.current.detectSpeakers(
        transcriptText,
        2
      );
      setDiarizationResult(detection);
      
      input.segments = detection.segments;
      input.metadata.confidence = detection.confidence;

      onTranscriptReady(input);
    } catch (error: any) {
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [transcriptText, mode, onTranscriptReady, onError]);

  // ═══════════════════════════════════════════════════════════════
  // DUAL MICROPHONE RECORDING
  // ═══════════════════════════════════════════════════════════════
  const startRecordingSpeaker = useCallback(
    async (speaker: 'A' | 'B') => {
      try {
        const deviceId = speaker === 'A' ? selectedMicA : selectedMicB;
        
        if (speaker === 'A') {
          await inputManagerRef.current.recordSpeakerA(deviceId);
          setRecordingState(prev => ({ ...prev, recordingA: true }));
        } else {
          await inputManagerRef.current.recordSpeakerB(deviceId);
          setRecordingState(prev => ({ ...prev, recordingB: true }));
        }
      } catch (error: any) {
        onError(`Failed to start recording for Speaker ${speaker}: ${error.message}`);
      }
    },
    [selectedMicA, selectedMicB, onError]
  );

  const stopRecordingSpeaker = useCallback(
    (speaker: 'A' | 'B') => {
      const blob = inputManagerRef.current.stopSpeaker(speaker);
      
      if (blob) {
        // Convert to text (would need speech-to-text API)
        // For now, just mark as ready
        if (speaker === 'A') {
          setRecordingState(prev => ({
            ...prev,
            recordingA: false,
            transcriptA: '[Audio recorded - requires transcription]'
          }));
        } else {
          setRecordingState(prev => ({
            ...prev,
            recordingB: false,
            transcriptB: '[Audio recorded - requires transcription]'
          }));
        }
      }
    },
    [onError]
  );

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SPEAKER DETECTION
  // ═══════════════════════════════════════════════════════════════
  const handleAutoDetectSpeakers = useCallback(() => {
    if (!transcriptText.trim()) {
      onError('Please paste text first');
      return;
    }

    const detection = inputManagerRef.current.detectSpeakers(transcriptText, 2);
    setDiarizationResult(detection);

    // Format with detected speakers
    const formatted = ManualInputService.addSpeakerMarkers(
      transcriptText,
      detection.segments.map(seg => ({
        text: seg.text,
        speaker: seg.speaker,
        timestamp: { start: seg.start, end: seg.end }
      })),
      'prefix'
    );

    setTranscriptText(formatted);
  }, [transcriptText, onError]);

  // ═══════════════════════════════════════════════════════════════
  // EXPORT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const handleExport = useCallback((format: 'srt' | 'vtt' | 'json') => {
    if (!diarizationResult?.segments || diarizationResult.segments.length === 0) {
      onError('No segments to export. Detect speakers first.');
      return;
    }

    const content = inputManagerRef.current.exportSegments(
      diarizationResult.segments,
      format
    );

    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diarizationResult, onError]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Type className="w-5 h-5 text-cyan-400" />
          Manual Transcript Input
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Paste pre-transcribed text, type directly, or record with dual microphones
        </p>
      </div>

      {/* Mode Selector */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex flex-wrap gap-2">
        {[
          { mode: ManualInputMode.PASTE_TEXT, label: '📋 Paste Text', icon: Upload },
          { mode: ManualInputMode.MARKED_SPEAKERS, label: '🏷️ Mark Speakers', icon: Type },
          ...(dualMicSupported ? [{ mode: ManualInputMode.DUAL_MIC, label: '🎤 Dual Mic', icon: Mic2 }] : []),
        ].map(({ mode: m, label }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        
        {/* Paste/Type Text Mode */}
        {(mode === ManualInputMode.PASTE_TEXT || mode === ManualInputMode.MARKED_SPEAKERS) && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-white">
                  {mode === ManualInputMode.MARKED_SPEAKERS 
                    ? '📝 Paste text with speaker markers (A: or [A])'
                    : '📋 Paste or type transcript'}
                </label>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                >
                  {previewMode ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" /> Preview
                    </>
                  )}
                </button>
              </div>

              {previewMode ? (
                <div className="p-3 bg-slate-800 rounded border border-slate-600 text-slate-300 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto font-mono text-xs">
                  {transcriptText || '(empty)'}
                </div>
              ) : (
                <textarea
                  ref={textAreaRef}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder={
                    mode === ManualInputMode.MARKED_SPEAKERS
                      ? 'A: Opening statement about the topic\nB: Counter argument\nA: Response to B\n...'
                      : 'Paste transcript text here or type directly...'
                  }
                  className="w-full h-48 p-3 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm font-mono focus:outline-none focus:border-cyan-500 resize-none"
                />
              )}
            </div>

            {/* Text Info */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{transcriptText.split(/\s+/).filter(w => w).length} words</span>
              <span>{transcriptText.split('\n').filter(l => l.trim()).length} lines</span>
            </div>

            {/* Speaker Detection */}
            {mode === ManualInputMode.MARKED_SPEAKERS && (
              <button
                onClick={handleAutoDetectSpeakers}
                disabled={isProcessing || !transcriptText.trim()}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm font-semibold rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                {isProcessing ? 'Detecting...' : 'Auto-Detect Speakers'}
              </button>
            )}

            {/* Process Button */}
            <button
              onClick={handlePasteText}
              disabled={isProcessing || !transcriptText.trim()}
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white text-sm font-semibold rounded transition-colors"
            >
              {isProcessing ? '⏳ Processing...' : '✅ Create Transcript'}
            </button>
          </div>
        )}

        {/* Dual Microphone Mode */}
        {mode === ManualInputMode.DUAL_MIC && dualMicSupported && (
          <div className="space-y-4">
            {/* Microphone Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white mb-1 block">
                  🎤 Microphone for Speaker A
                </label>
                <select
                  value={selectedMicA}
                  onChange={(e) => setSelectedMicA(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {micDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-white mb-1 block">
                  🎤 Microphone for Speaker B
                </label>
                <select
                  value={selectedMicB}
                  onChange={(e) => setSelectedMicB(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {micDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Mic ${device.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Speaker A Recording */}
              <div className="p-3 bg-slate-800 rounded border border-slate-600 space-y-2">
                <div className="text-sm font-semibold text-white">👤 Speaker A</div>
                {recordingState.recordingA ? (
                  <>
                    <div className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      Recording...
                    </div>
                    <button
                      onClick={() => stopRecordingSpeaker('A')}
                      className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                    >
                      ⏹️ Stop Recording
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startRecordingSpeaker('A')}
                    className="w-full px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    🎤 Start Recording
                  </button>
                )}
                <div className="text-xs text-slate-400 h-12 overflow-y-auto">
                  {recordingState.transcriptA || '(recording will appear here)'}
                </div>
              </div>

              {/* Speaker B Recording */}
              <div className="p-3 bg-slate-800 rounded border border-slate-600 space-y-2">
                <div className="text-sm font-semibold text-white">👤 Speaker B</div>
                {recordingState.recordingB ? (
                  <>
                    <div className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      Recording...
                    </div>
                    <button
                      onClick={() => stopRecordingSpeaker('B')}
                      className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                    >
                      ⏹️ Stop Recording
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startRecordingSpeaker('B')}
                    className="w-full px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    🎤 Start Recording
                  </button>
                )}
                <div className="text-xs text-slate-400 h-12 overflow-y-auto">
                  {recordingState.transcriptB || '(recording will appear here)'}
                </div>
              </div>
            </div>

            {/* Create Transcript from Dual Mic */}
            <button
              onClick={() => {
                if (!recordingState.transcriptA || !recordingState.transcriptB) {
                  onError('Please record both speakers first');
                  return;
                }
                // Would process dual mic recordings
              }}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
            >
              ✅ Create Transcript from Recordings
            </button>
          </div>
        )}

        {/* Diarization Results */}
        {diarizationResult && (
          <div className="p-3 bg-slate-800/50 rounded border border-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">
                ✨ Speaker Detection Results
              </div>
              <div className="text-xs text-slate-400">
                {(diarizationResult.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
              <div>🎙️ {diarizationResult.speakerCount} speakers detected</div>
              <div>📍 {diarizationResult.segments.length} segments</div>
              <div>🤖 {diarizationResult.diarizationModel}</div>
            </div>

            {/* Export Options */}
            <div className="flex gap-2 flex-wrap">
              {(['srt', 'vtt', 'json'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualTranscriptInput;
