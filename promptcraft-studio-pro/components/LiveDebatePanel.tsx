// components/LiveDebatePanel.tsx
// Live Debate Mode UI Component
// Allows users to set up and run live debates directly through the interface

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLiveDebateService,
  LiveDebateService,
  DebateSession,
  DebateFormat,
  DebaterProfile,
  DebateRound,
  LiveTranscriptEntry,
  DEBATE_FORMATS,
  formatDebateTime,
  getDebaterColors,
  getRoleDisplayName,
  SpeakerRole
} from '../services/liveDebateService';
import { inputProcessor } from '../services/inputProcessor';
import { useDebateAutoSave } from './hooks/useDebateAutoSave';
import SaveStatusIndicator from './SaveStatusIndicator';
import {
  Users,
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Clock,
  ChevronRight,
  Settings,
  AlertCircle,
  Trophy,
  MessageSquare,
  Timer,
  Volume2,
  RefreshCw,
  Save,
  Upload,
  X,
  Check,
  Edit3,
  User,
  Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface LiveDebatePanelProps {
  onSessionComplete: (session: DebateSession) => void;
  onTranscriptReady: (transcript: string) => void;
  initialParticipantA?: Partial<DebaterProfile>;
  initialParticipantB?: Partial<DebaterProfile>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const LiveDebatePanel: React.FC<LiveDebatePanelProps> = ({
  onSessionComplete,
  onTranscriptReady,
  initialParticipantA,
  initialParticipantB
}) => {
  // Service instance
  const debateService = useRef<LiveDebateService>(getLiveDebateService());
  
  // Auto-save state
  const [debateId, setDebateId] = useState<string | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  
  // Session state
  const [session, setSession] = useState<DebateSession | null>(null);
  const [currentRound, setCurrentRound] = useState<DebateRound | null>(null);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(0);
  
  // Setup form state
  const [showSetup, setShowSetup] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<DebateFormat>('open-floor');
  const [debateMode, setDebateMode] = useState<'dual' | 'solo'>('dual');
  const [topic, setTopic] = useState({ motion: '', category: '', context: '' });
  
  // Debater forms
  const [debaterA, setDebaterA] = useState({
    name: initialParticipantA?.name || '',
    role: 'pro' as SpeakerRole,
    affiliation: '',
    color: '#6366f1'
  });
  const [debaterB, setDebaterB] = useState({
    name: initialParticipantB?.name || '',
    role: 'con' as SpeakerRole,
    affiliation: '',
    color: '#ec4899'
  });
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B'>('A');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micSession, setMicSession] = useState<any>(null);
  
  // UI state
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-save data structure
  const debateData = {
    motion: topic.motion,
    category: topic.category,
    context: topic.context,
    format: selectedFormat,
    mode: debateMode,
    debaterA,
    debaterB,
    transcript: session?.transcript || []
  };

  // Auto-save hook
  const { saveStatus, lastSaved, errorMessage } = useDebateAutoSave(
    debateId,
    debateData,
    { debounceMs: 1000 }
  );

  // ═══════════════════════════════════════════════════════════════
  // DRAFT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const initializeDraft = async () => {
      // Check for unsaved draft
      const savedDraft = localStorage.getItem('analysis_studio_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setShowDraftRestore(true);
          
          // Auto-restore after 10 seconds if user doesn't decide
          setTimeout(() => {
            if (showDraftRestore) {
              restoreDraft(draft);
            }
          }, 10000);
        } catch (e) {
          localStorage.removeItem('analysis_studio_draft');
        }
      } else {
        // Create new draft
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/v1/debates/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: 'Untitled Debate',
              mode: 'arena',
              analysis_status: 'draft'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setDebateId(data.id);
          }
        } catch (err) {
          console.error('Failed to create draft:', err);
        }
      }
    };
    
    initializeDraft();
  }, []);

  const restoreDraft = (draft: any) => {
    if (draft.debateId) {
      setDebateId(draft.debateId);
    }
    if (draft.data) {
      setTopic({
        motion: draft.data.motion || '',
        category: draft.data.category || '',
        context: draft.data.context || ''
      });
      setSelectedFormat(draft.data.format || 'open-floor');
      setDebateMode(draft.data.mode || 'dual');
      if (draft.data.debaterA) setDebaterA(draft.data.debaterA);
      if (draft.data.debaterB) setDebaterB(draft.data.debaterB);
    }
    setShowDraftRestore(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('analysis_studio_draft');
    setShowDraftRestore(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // SERVICE EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const service = debateService.current;
    
    service.setOnStateChange((updatedSession) => {
      setSession(updatedSession);
      setRoundTimeRemaining(service.getRoundTimeRemaining());
    });

    service.setOnRoundChange((round) => {
      setCurrentRound(round);
    });

    service.setOnTimeWarning((speaker, seconds) => {
      setTimeWarning(`${seconds} seconds remaining for Speaker ${speaker}!`);
      setTimeout(() => setTimeWarning(null), 3000);
    });

    return () => {
      service.clearSession();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.transcript]);

  // Update round time every second
  useEffect(() => {
    if (session?.state === 'live') {
      const interval = setInterval(() => {
        setRoundTimeRemaining(debateService.current.getRoundTimeRemaining());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session?.state]);

  // ═══════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  const handleCreateSession = useCallback(() => {
    if (!debaterA.name.trim()) {
      alert('Please enter a name for Debater A');
      return;
    }
    if (debateMode === 'dual' && !debaterB.name.trim()) {
      alert('Please enter a name for Debater B');
      return;
    }
    if (!topic.motion.trim()) {
      alert('Please enter a debate topic/motion');
      return;
    }

    const newSession = debateService.current.createSession({
      format: selectedFormat,
      topic: {
        motion: topic.motion,
        category: topic.category || undefined,
        context: topic.context || undefined
      },
      debaterA: {
        name: debaterA.name,
        role: debaterA.role,
        position: 'A',
        affiliation: debaterA.affiliation || undefined,
        color: debaterA.color,
        speakingTimeAllotted: 0 // Will be calculated from format
      },
      debaterB: debateMode === 'dual' ? {
        name: debaterB.name,
        role: debaterB.role,
        position: 'B',
        affiliation: debaterB.affiliation || undefined,
        color: debaterB.color,
        speakingTimeAllotted: 0
      } : undefined
    });

    debateService.current.markReady();
    setShowSetup(false);
  }, [debaterA, debaterB, debateMode, selectedFormat, topic]);

  const handleStartSession = useCallback(() => {
    debateService.current.startSession();
  }, []);

  const handlePauseResume = useCallback(() => {
    if (session?.state === 'live') {
      debateService.current.pauseSession();
    } else if (session?.state === 'paused') {
      debateService.current.resumeSession();
    }
  }, [session?.state]);

  const handleEndSession = useCallback(() => {
    debateService.current.endSession();
    
    const finalSession = debateService.current.getSession();
    if (finalSession) {
      onSessionComplete(finalSession);
      onTranscriptReady(debateService.current.getFullTranscriptText());
    }
  }, [onSessionComplete, onTranscriptReady]);

  const handleNextRound = useCallback(() => {
    debateService.current.nextRound();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // MICROPHONE RECORDING
  // ═══════════════════════════════════════════════════════════════

  const handleStartRecording = useCallback(async () => {
    if (!session || session.state !== 'live') return;

    try {
      const micHandle = inputProcessor.startMicrophoneCapture({
        onInterimTranscript: (text) => {
          setInterimTranscript(text);
        },
        onFinalTranscript: (text) => {
          if (text.trim()) {
            const speakerName = currentSpeaker === 'A' 
              ? session.debaters.A.name 
              : session.debaters.B?.name || 'Speaker B';
            
            debateService.current.addTranscriptEntry({
              speaker: currentSpeaker,
              speakerName,
              text: text.trim(),
              isFinal: true
            });
          }
          setInterimTranscript('');
        },
        onError: (error) => {
          console.error('Microphone error:', error);
          setIsRecording(false);
        }
      });

      setMicSession(micHandle);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [session, currentSpeaker]);

  const handleStopRecording = useCallback(() => {
    if (micSession) {
      micSession.stop();
      setMicSession(null);
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, [micSession]);

  const handleSwitchSpeaker = useCallback((speaker: 'A' | 'B') => {
    setCurrentSpeaker(speaker);
    debateService.current.switchSpeaker(speaker);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SETUP SCREEN
  // ═══════════════════════════════════════════════════════════════

  if (showSetup) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-700 dark:bg-neutral-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Live Debate Setup
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setDebateMode('dual')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                debateMode === 'dual'
                  ? 'bg-neutral-500 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Dual Debate
            </button>
            <button
              onClick={() => setDebateMode('solo')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                debateMode === 'solo'
                  ? 'bg-neutral-500 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Solo Analysis
            </button>
          </div>
        </div>

        {/* Debate Format Selection */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase mb-2">
            Debate Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(DEBATE_FORMATS)
              .filter(([_, config]) => debateMode === 'solo' ? config.minParticipants === 1 : true)
              .map(([id, config]) => (
                <button
                  key={id}
                  onClick={() => setSelectedFormat(id as DebateFormat)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedFormat === id
                      ? 'bg-neutral-500 text-white ring-2 ring-neutral-300'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-500/10'
                  }`}
                >
                  <div className="text-sm font-bold">{config.name}</div>
                  <div className={`text-[10px] ${selectedFormat === id ? 'text-neutral-100' : 'text-neutral-500'}`}>
                    {formatDebateTime(config.totalTime)}
                  </div>
                </button>
              ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {DEBATE_FORMATS[selectedFormat].description}
          </p>
        </div>

        {/* Topic/Motion */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase mb-2">
            Debate Topic / Motion
          </label>
          <input
            type="text"
            value={topic.motion}
            onChange={(e) => setTopic(prev => ({ ...prev, motion: e.target.value }))}
            placeholder="e.g., 'This House believes AI will create more jobs than it destroys'"
            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-4 mt-2">
            <input
              type="text"
              value={topic.category}
              onChange={(e) => setTopic(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Category (optional): Technology, Politics, etc."
              className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white placeholder-neutral-400"
            />
            <input
              type="text"
              value={topic.context}
              onChange={(e) => setTopic(prev => ({ ...prev, context: e.target.value }))}
              placeholder="Context (optional)"
              className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Debater Registration */}
        <div className="grid grid-cols-2 gap-6">
          {/* Debater A */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-neutral-200 dark:border-neutral-500/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white font-bold">A</div>
              <span className="font-bold text-neutral-700 dark:text-white">
                {debateMode === 'dual' ? 'Debater A (Pro/Proposition)' : 'Speaker'}
              </span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={debaterA.name}
                onChange={(e) => setDebaterA(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name *"
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-white"
              />
              <input
                type="text"
                value={debaterA.affiliation}
                onChange={(e) => setDebaterA(prev => ({ ...prev, affiliation: e.target.value }))}
                placeholder="Affiliation (optional)"
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white"
              />
              <select
                value={debaterA.role}
                onChange={(e) => setDebaterA(prev => ({ ...prev, role: e.target.value as SpeakerRole }))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white"
              >
                <option value="pro">Pro</option>
                <option value="proposition">Proposition</option>
                <option value="affirmative">Affirmative</option>
                <option value="speaker">Speaker</option>
              </select>
            </div>
          </div>

          {/* Debater B */}
          {debateMode === 'dual' && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border-2 border-neutral-200 dark:border-neutral-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center text-white font-bold">B</div>
                <span className="font-bold text-neutral-700 dark:text-white">Debater B (Con/Opposition)</span>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={debaterB.name}
                  onChange={(e) => setDebaterB(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Name *"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-white"
                />
                <input
                  type="text"
                  value={debaterB.affiliation}
                  onChange={(e) => setDebaterB(prev => ({ ...prev, affiliation: e.target.value }))}
                  placeholder="Affiliation (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white"
                />
                <select
                  value={debaterB.role}
                  onChange={(e) => setDebaterB(prev => ({ ...prev, role: e.target.value as SpeakerRole }))}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-white"
                >
                  <option value="con">Con</option>
                  <option value="opposition">Opposition</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Format Details */}
        <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-neutral-600 dark:text-neutral-400 mb-3">
            Round Structure: {DEBATE_FORMATS[selectedFormat].name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {DEBATE_FORMATS[selectedFormat].rounds.map((round, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-700 rounded text-[10px]">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${
                  round.speakerPosition === 'A' ? 'bg-neutral-500' :
                  round.speakerPosition === 'B' ? 'bg-neutral-600' : 'bg-neutral-400'
                }`}>
                  {round.speakerPosition === 'both' ? '⟷' : round.speakerPosition}
                </span>
                <span className="text-neutral-600 dark:text-neutral-300">{round.name}</span>
                <span className="text-neutral-400">({formatDebateTime(round.durationSeconds)})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleCreateSession}
          className="w-full py-4 rounded-xl bg-neutral-700 dark:bg-neutral-600 text-white font-bold text-lg hover:bg-neutral-800 dark:hover:bg-neutral-500 transition-all shadow-lg hover:shadow-neutral-500/25 flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6" />
          Create Debate Session
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LIVE SESSION
  // ═══════════════════════════════════════════════════════════════

  if (!session) return null;

  const currentRoundData = session.rounds[session.currentRoundIndex];
  const formatConfig = DEBATE_FORMATS[session.format];

  return (
    <div className="bg-neutral-900 rounded-2xl overflow-hidden">
      {/* Draft Restore Banner */}
      {showDraftRestore && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              You have unsaved changes. Restore them?
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const draft = JSON.parse(localStorage.getItem('analysis_studio_draft') || '{}');
                restoreDraft(draft);
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Restore
            </button>
            <button
              onClick={discardDraft}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Discard
            </button>
          </div>
        </div>
      )}
      
      {/* Header Bar */}
      <div className="bg-black/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
            session.state === 'live' ? 'bg-green-500 text-white animate-pulse' :
            session.state === 'paused' ? 'bg-yellow-500 text-black' :
            session.state === 'ended' ? 'bg-neutral-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${session.state === 'live' ? 'bg-white' : 'bg-current'}`} />
            {session.state}
          </div>
          
          {/* Topic */}
          <div className="text-white">
            <div className="text-xs text-neutral-300 uppercase">Motion</div>
            <div className="text-sm font-medium truncate max-w-md">{session.topic.motion}</div>
          </div>
        </div>

        {/* Timer & Save Status */}
        <div className="flex items-center gap-6">
          <SaveStatusIndicator
            status={saveStatus}
            lastSaved={lastSaved}
            errorMessage={errorMessage}
          />
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white">
              {formatDebateTime(session.totalDuration)}
            </div>
            <div className="text-xs text-neutral-300">
              Total Time
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Left: Debater A */}
        <div className={`bg-neutral-500/10 rounded-xl p-4 border-2 transition-all ${
          session.currentSpeaker === 'A' ? 'border-neutral-500 ring-4 ring-neutral-500/30' : 'border-neutral-500/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-500 flex items-center justify-center text-2xl font-bold text-white">
                A
              </div>
              <div>
                <div className="text-white font-bold">{session.debaters.A.name}</div>
                <div className="text-neutral-300 text-xs">{getRoleDisplayName(session.debaters.A.role)}</div>
              </div>
            </div>
            {session.currentSpeaker === 'A' && isRecording && (
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-2xl font-bold text-white">{session.debaters.A.currentScore}</div>
              <div className="text-[10px] text-neutral-300 uppercase">Score</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-2xl font-bold text-white">{formatDebateTime(session.debaters.A.speakingTimeUsed)}</div>
              <div className="text-[10px] text-neutral-300 uppercase">Speaking Time</div>
            </div>
          </div>

          {session.state === 'live' && debateMode === 'dual' && (
            <button
              onClick={() => handleSwitchSpeaker('A')}
              className={`mt-4 w-full py-2 rounded-lg text-sm font-bold transition-all ${
                currentSpeaker === 'A'
                  ? 'bg-neutral-500 text-white'
                  : 'bg-neutral-500/20 text-neutral-300 hover:bg-neutral-500/40'
              }`}
            >
              {currentSpeaker === 'A' ? 'Currently Speaking' : 'Switch to A'}
            </button>
          )}
        </div>

        {/* Center: Controls & Transcript */}
        <div className="space-y-4">
          {/* Current Round */}
          {currentRoundData && (
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-xs text-neutral-300 uppercase mb-1">Current Round</div>
              <div className="text-lg font-bold text-white mb-2">{currentRoundData.name}</div>
              <div className="text-3xl font-mono font-bold text-white mb-2">
                {formatDebateTime(roundTimeRemaining)}
              </div>
              <div className="w-full bg-black/30 rounded-full h-2">
                <div 
                  className="bg-neutral-600 h-2 rounded-full transition-all"
                  style={{ width: `${(1 - roundTimeRemaining / currentRoundData.durationSeconds) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center">
            {session.state === 'ready' && (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all"
              >
                <Play className="w-5 h-5" />
                Start Debate
              </button>
            )}
            
            {(session.state === 'live' || session.state === 'paused') && (
              <>
                <button
                  onClick={handlePauseResume}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    session.state === 'paused'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  }`}
                >
                  {session.state === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {session.state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={session.state === 'paused'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-neutral-500 hover:bg-neutral-600 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? 'Stop Mic' : 'Start Mic'}
                </button>

                <button
                  onClick={handleNextRound}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-bold transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  Next Round
                </button>

                <button
                  onClick={handleEndSession}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all"
                >
                  <Square className="w-4 h-4" />
                  End
                </button>
              </>
            )}
          </div>

          {/* Time Warning */}
          {timeWarning && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
              <AlertCircle className="w-5 h-5 text-red-400 inline mr-2" />
              <span className="text-red-300 font-bold">{timeWarning}</span>
            </div>
          )}

          {/* Interim Transcript */}
          {interimTranscript && (
            <div className="bg-neutral-500/10 rounded-lg p-3 border border-neutral-500/30">
              <div className="text-xs text-neutral-300 mb-1">
                <Mic className="w-3 h-3 inline mr-1" />
                {currentSpeaker === 'A' ? session.debaters.A.name : session.debaters.B?.name || 'Speaker B'} speaking...
              </div>
              <div className="text-white italic">{interimTranscript}</div>
            </div>
          )}
        </div>

        {/* Right: Debater B (if dual mode) */}
        {session.debaters.B ? (
          <div className={`bg-neutral-600/10 rounded-xl p-4 border-2 transition-all ${
            session.currentSpeaker === 'B' ? 'border-neutral-500 ring-4 ring-neutral-500/30' : 'border-neutral-500/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center text-2xl font-bold text-white">
                  B
                </div>
                <div>
                  <div className="text-white font-bold">{session.debaters.B.name}</div>
                  <div className="text-neutral-300 text-xs">{getRoleDisplayName(session.debaters.B.role)}</div>
                </div>
              </div>
              {session.currentSpeaker === 'B' && isRecording && (
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-2xl font-bold text-white">{session.debaters.B.currentScore}</div>
                <div className="text-[10px] text-neutral-300 uppercase">Score</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-2xl font-bold text-white">{formatDebateTime(session.debaters.B.speakingTimeUsed)}</div>
                <div className="text-[10px] text-neutral-300 uppercase">Speaking Time</div>
              </div>
            </div>

            {session.state === 'live' && (
              <button
                onClick={() => handleSwitchSpeaker('B')}
                className={`mt-4 w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  currentSpeaker === 'B'
                    ? 'bg-neutral-600 text-white'
                    : 'bg-neutral-600/20 text-neutral-300 hover:bg-neutral-600/40'
                }`}
              >
                {currentSpeaker === 'B' ? 'Currently Speaking' : 'Switch to B'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center text-neutral-500">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-2 opacity-20" />
              <div className="text-sm">Solo Mode</div>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      <div className="px-6 pb-6">
        <div className="bg-black/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-300 uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Live Transcript
            </h3>
            <span className="text-xs text-neutral-500">{session.transcript.length} entries</span>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 text-sm">
            {session.transcript.length === 0 ? (
              <div className="text-neutral-500 italic text-center py-4">
                Transcript will appear here as participants speak...
              </div>
            ) : (
              session.transcript.map((entry) => (
                <div key={entry.id} className="flex gap-3">
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    entry.speaker === 'A' ? 'bg-neutral-500' : 'bg-neutral-600'
                  }`}>
                    {entry.speaker}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${entry.speaker === 'A' ? 'text-neutral-300' : 'text-neutral-300'}`}>
                        {entry.speakerName}
                      </span>
                      <span className="text-[10px] text-neutral-500">{formatDebateTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-white">{entry.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Session Ended: Show Analysis Prompts */}
      {session.state === 'ended' && (
        <div className="px-6 pb-6">
          <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30 text-center">
            <Trophy className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Debate Complete!</h3>
            <p className="text-green-300 mb-4">
              Duration: {formatDebateTime(session.totalDuration)} | 
              {session.transcript.length} transcript entries
            </p>
            <p className="text-sm text-neutral-400">
              The transcript has been prepared for analysis. Click "Run Analysis" to evaluate the debate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDebatePanel;
