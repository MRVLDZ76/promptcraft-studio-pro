// services/liveDebateService.ts
// Live Debate Session Management
// Handles direct debates through the interface without pre-recorded content

import { TranscriptSegment } from './inputProcessor';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type DebateFormat = 
  | 'lincoln-douglas'      // 1v1, structured rounds
  | 'parliamentary'        // British Parliamentary style
  | 'wsdc'                 // World Schools Debate Championship
  | 'oxford'               // Oxford-style (audience voting)
  | 'cross-examination'    // Policy debate with cross-ex
  | 'open-floor'           // Free-form discussion
  | 'solo-analysis'        // Single speaker evaluation
  | 'custom';              // User-defined format

export type SessionState = 
  | 'setup'       // Configuring debate parameters
  | 'ready'       // All participants registered, ready to start
  | 'live'        // Debate in progress
  | 'paused'      // Temporarily paused
  | 'ended'       // Debate concluded
  | 'analyzing';  // Post-debate analysis in progress

export type SpeakerRole = 
  | 'proposition' | 'opposition'    // Parliamentary
  | 'affirmative' | 'negative'      // LD/Policy
  | 'pro' | 'con'                   // General
  | 'speaker';                      // Solo mode

export interface DebaterProfile {
  id: string;
  name: string;
  role: SpeakerRole;
  position: 'A' | 'B';
  affiliation?: string;           // School, organization, etc.
  avatar?: string;                // Base64 or URL
  color: string;                  // Theme color for UI
  speakingTimeUsed: number;       // Seconds
  speakingTimeAllotted: number;   // Seconds
  claimCount: number;
  fallacyCount: number;
  currentScore: number;
}

export interface DebateRound {
  id: string;
  name: string;                   // "Opening Statement", "Rebuttal", etc.
  speakerPosition: 'A' | 'B' | 'both';
  durationSeconds: number;
  allowCrossExam: boolean;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface DebateTopic {
  motion: string;                 // "This House Believes That..."
  category?: string;              // Politics, Technology, Ethics, etc.
  context?: string;               // Additional context/background
}

export interface LiveTranscriptEntry {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  text: string;
  timestamp: number;              // Seconds from session start
  isFinal: boolean;               // False if still being transcribed
  roundId?: string;
}

export interface DebateSession {
  id: string;
  format: DebateFormat;
  state: SessionState;
  topic: DebateTopic;
  debaters: {
    A: DebaterProfile;
    B?: DebaterProfile;           // Optional for solo mode
  };
  rounds: DebateRound[];
  currentRoundIndex: number;
  currentSpeaker: 'A' | 'B' | null;
  transcript: LiveTranscriptEntry[];
  startTime?: Date;
  endTime?: Date;
  totalDuration: number;          // Seconds
  isPaused: boolean;
  pausedAt?: number;              // Timestamp when paused
  
  // Analysis results (populated after session ends)
  analysisComplete: boolean;
  scoringResult?: any;            // ScoringResult from scoringEngine
  factVerification?: any;         // FactVerificationReport
}

export interface DebateFormatConfig {
  id: DebateFormat;
  name: string;
  description: string;
  minParticipants: 1 | 2;
  rounds: Omit<DebateRound, 'id' | 'completed' | 'startTime' | 'endTime'>[];
  totalTime: number;              // Total debate time in seconds
  crossExamAllowed: boolean;
  audienceVoting: boolean;
}

// ═══════════════════════════════════════════════════════════════
// DEBATE FORMAT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const DEBATE_FORMATS: Record<DebateFormat, DebateFormatConfig> = {
  'lincoln-douglas': {
    id: 'lincoln-douglas',
    name: 'Lincoln-Douglas',
    description: 'Traditional 1v1 value debate format',
    minParticipants: 2,
    totalTime: 38 * 60, // 38 minutes
    crossExamAllowed: true,
    audienceVoting: false,
    rounds: [
      { name: 'Affirmative Constructive', speakerPosition: 'A', durationSeconds: 6 * 60, allowCrossExam: false },
      { name: 'Cross-Examination (B asks A)', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: 'Negative Constructive', speakerPosition: 'B', durationSeconds: 7 * 60, allowCrossExam: false },
      { name: 'Cross-Examination (A asks B)', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: 'First Affirmative Rebuttal', speakerPosition: 'A', durationSeconds: 4 * 60, allowCrossExam: false },
      { name: 'Negative Rebuttal', speakerPosition: 'B', durationSeconds: 6 * 60, allowCrossExam: false },
      { name: 'Second Affirmative Rebuttal', speakerPosition: 'A', durationSeconds: 3 * 60, allowCrossExam: false }
    ]
  },
  'parliamentary': {
    id: 'parliamentary',
    name: 'British Parliamentary',
    description: 'Formal parliamentary debate style',
    minParticipants: 2,
    totalTime: 30 * 60,
    crossExamAllowed: false,
    audienceVoting: false,
    rounds: [
      { name: 'Prime Minister (Opening)', speakerPosition: 'A', durationSeconds: 7 * 60, allowCrossExam: false },
      { name: 'Leader of Opposition', speakerPosition: 'B', durationSeconds: 7 * 60, allowCrossExam: false },
      { name: 'Deputy Prime Minister', speakerPosition: 'A', durationSeconds: 7 * 60, allowCrossExam: false },
      { name: 'Deputy Leader of Opposition', speakerPosition: 'B', durationSeconds: 7 * 60, allowCrossExam: false },
      { name: 'Opposition Whip', speakerPosition: 'B', durationSeconds: 5 * 60, allowCrossExam: false },
      { name: 'Government Whip (Summary)', speakerPosition: 'A', durationSeconds: 5 * 60, allowCrossExam: false }
    ]
  },
  'wsdc': {
    id: 'wsdc',
    name: 'World Schools (WSDC)',
    description: 'International schools debate format',
    minParticipants: 2,
    totalTime: 48 * 60,
    crossExamAllowed: true,
    audienceVoting: false,
    rounds: [
      { name: 'First Proposition', speakerPosition: 'A', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'First Opposition', speakerPosition: 'B', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Second Proposition', speakerPosition: 'A', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Second Opposition', speakerPosition: 'B', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Opposition Reply', speakerPosition: 'B', durationSeconds: 4 * 60, allowCrossExam: false },
      { name: 'Proposition Reply', speakerPosition: 'A', durationSeconds: 4 * 60, allowCrossExam: false }
    ]
  },
  'oxford': {
    id: 'oxford',
    name: 'Oxford Union',
    description: 'Classic debate with audience voting',
    minParticipants: 2,
    totalTime: 40 * 60,
    crossExamAllowed: false,
    audienceVoting: true,
    rounds: [
      { name: 'Proposition Opening', speakerPosition: 'A', durationSeconds: 10 * 60, allowCrossExam: false },
      { name: 'Opposition Opening', speakerPosition: 'B', durationSeconds: 10 * 60, allowCrossExam: false },
      { name: 'Floor Questions', speakerPosition: 'both', durationSeconds: 10 * 60, allowCrossExam: true },
      { name: 'Opposition Closing', speakerPosition: 'B', durationSeconds: 5 * 60, allowCrossExam: false },
      { name: 'Proposition Closing', speakerPosition: 'A', durationSeconds: 5 * 60, allowCrossExam: false }
    ]
  },
  'cross-examination': {
    id: 'cross-examination',
    name: 'Policy/Cross-Ex',
    description: 'Evidence-heavy policy debate',
    minParticipants: 2,
    totalTime: 60 * 60,
    crossExamAllowed: true,
    audienceVoting: false,
    rounds: [
      { name: '1AC (First Affirmative Constructive)', speakerPosition: 'A', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Cross-Ex of 1AC', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: '1NC (First Negative Constructive)', speakerPosition: 'B', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Cross-Ex of 1NC', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: '2AC (Second Affirmative Constructive)', speakerPosition: 'A', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Cross-Ex of 2AC', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: '2NC (Second Negative Constructive)', speakerPosition: 'B', durationSeconds: 8 * 60, allowCrossExam: false },
      { name: 'Cross-Ex of 2NC', speakerPosition: 'both', durationSeconds: 3 * 60, allowCrossExam: true },
      { name: '1NR (First Negative Rebuttal)', speakerPosition: 'B', durationSeconds: 5 * 60, allowCrossExam: false },
      { name: '1AR (First Affirmative Rebuttal)', speakerPosition: 'A', durationSeconds: 5 * 60, allowCrossExam: false },
      { name: '2NR (Second Negative Rebuttal)', speakerPosition: 'B', durationSeconds: 5 * 60, allowCrossExam: false },
      { name: '2AR (Second Affirmative Rebuttal)', speakerPosition: 'A', durationSeconds: 5 * 60, allowCrossExam: false }
    ]
  },
  'open-floor': {
    id: 'open-floor',
    name: 'Open Floor',
    description: 'Free-form discussion with no time limits per speaker',
    minParticipants: 2,
    totalTime: 30 * 60,
    crossExamAllowed: true,
    audienceVoting: false,
    rounds: [
      { name: 'Open Discussion', speakerPosition: 'both', durationSeconds: 30 * 60, allowCrossExam: true }
    ]
  },
  'solo-analysis': {
    id: 'solo-analysis',
    name: 'Solo Analysis',
    description: 'Single speaker evaluation (speech, presentation)',
    minParticipants: 1,
    totalTime: 15 * 60,
    crossExamAllowed: false,
    audienceVoting: false,
    rounds: [
      { name: 'Presentation', speakerPosition: 'A', durationSeconds: 15 * 60, allowCrossExam: false }
    ]
  },
  'custom': {
    id: 'custom',
    name: 'Custom Format',
    description: 'Define your own debate structure',
    minParticipants: 1,
    totalTime: 30 * 60,
    crossExamAllowed: true,
    audienceVoting: false,
    rounds: [
      { name: 'Custom Round', speakerPosition: 'both', durationSeconds: 30 * 60, allowCrossExam: true }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════
// LIVE DEBATE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class LiveDebateService {
  private session: DebateSession | null = null;
  private sessionStartTimestamp: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateChange?: (session: DebateSession) => void;
  private onTranscriptUpdate?: (entry: LiveTranscriptEntry) => void;
  private onRoundChange?: (round: DebateRound) => void;
  private onTimeWarning?: (speaker: 'A' | 'B', secondsRemaining: number) => void;

  // ═══════════════════════════════════════════════════════════════
  // SESSION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a new debate session
   */
  createSession(config: {
    format: DebateFormat;
    topic: DebateTopic;
    debaterA: Omit<DebaterProfile, 'id' | 'speakingTimeUsed' | 'claimCount' | 'fallacyCount' | 'currentScore'>;
    debaterB?: Omit<DebaterProfile, 'id' | 'speakingTimeUsed' | 'claimCount' | 'fallacyCount' | 'currentScore'>;
    customRounds?: DebateRound[];
  }): DebateSession {
    const formatConfig = DEBATE_FORMATS[config.format];
    
    // Build rounds from format template or custom
    const rounds: DebateRound[] = (config.customRounds || formatConfig.rounds).map((r, idx) => ({
      ...r,
      id: `round-${idx}`,
      completed: false
    }));

    // Calculate total time per speaker
    const timeA = rounds
      .filter(r => r.speakerPosition === 'A' || r.speakerPosition === 'both')
      .reduce((sum, r) => sum + r.durationSeconds, 0);
    const timeB = rounds
      .filter(r => r.speakerPosition === 'B' || r.speakerPosition === 'both')
      .reduce((sum, r) => sum + r.durationSeconds, 0);

    this.session = {
      id: `session-${Date.now()}`,
      format: config.format,
      state: 'setup',
      topic: config.topic,
      debaters: {
        A: {
          ...config.debaterA,
          id: `debater-a-${Date.now()}`,
          speakingTimeUsed: 0,
          speakingTimeAllotted: timeA,
          claimCount: 0,
          fallacyCount: 0,
          currentScore: 0
        },
        B: config.debaterB ? {
          ...config.debaterB,
          id: `debater-b-${Date.now()}`,
          speakingTimeUsed: 0,
          speakingTimeAllotted: timeB,
          claimCount: 0,
          fallacyCount: 0,
          currentScore: 0
        } : undefined
      },
      rounds,
      currentRoundIndex: 0,
      currentSpeaker: null,
      transcript: [],
      totalDuration: 0,
      isPaused: false,
      analysisComplete: false
    };

    this.notifyStateChange();
    return this.session;
  }

  /**
   * Mark session as ready to start
   */
  markReady(): void {
    if (this.session && this.session.state === 'setup') {
      this.session.state = 'ready';
      this.notifyStateChange();
    }
  }

  /**
   * Start the live debate session
   */
  startSession(): void {
    if (!this.session || this.session.state !== 'ready') {
      throw new Error('Session not ready to start');
    }

    this.session.state = 'live';
    this.session.startTime = new Date();
    this.sessionStartTimestamp = Date.now();
    
    // Start first round
    this.startRound(0);
    
    // Start the timer
    this.startTimer();
    
    this.notifyStateChange();
  }

  /**
   * Pause the session
   */
  pauseSession(): void {
    if (this.session && this.session.state === 'live') {
      this.session.state = 'paused';
      this.session.isPaused = true;
      this.session.pausedAt = Date.now();
      this.stopTimer();
      this.notifyStateChange();
    }
  }

  /**
   * Resume the session
   */
  resumeSession(): void {
    if (this.session && this.session.state === 'paused') {
      // Adjust start timestamp to account for pause duration
      const pauseDuration = Date.now() - (this.session.pausedAt || Date.now());
      this.sessionStartTimestamp += pauseDuration;
      
      this.session.state = 'live';
      this.session.isPaused = false;
      this.session.pausedAt = undefined;
      this.startTimer();
      this.notifyStateChange();
    }
  }

  /**
   * End the session
   */
  endSession(): void {
    if (this.session && (this.session.state === 'live' || this.session.state === 'paused')) {
      this.session.state = 'ended';
      this.session.endTime = new Date();
      this.stopTimer();
      this.notifyStateChange();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ROUND MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  private startRound(index: number): void {
    if (!this.session || index >= this.session.rounds.length) return;

    const round = this.session.rounds[index];
    round.startTime = new Date();
    this.session.currentRoundIndex = index;
    
    // Set current speaker based on round
    if (round.speakerPosition === 'A' || round.speakerPosition === 'B') {
      this.session.currentSpeaker = round.speakerPosition;
    } else {
      // For 'both', start with A or let it be dynamic
      this.session.currentSpeaker = 'A';
    }

    this.onRoundChange?.(round);
  }

  /**
   * Move to next round
   */
  nextRound(): void {
    if (!this.session) return;

    const currentRound = this.session.rounds[this.session.currentRoundIndex];
    currentRound.completed = true;
    currentRound.endTime = new Date();

    const nextIndex = this.session.currentRoundIndex + 1;
    if (nextIndex < this.session.rounds.length) {
      this.startRound(nextIndex);
    } else {
      // All rounds complete
      this.endSession();
    }

    this.notifyStateChange();
  }

  /**
   * Switch current speaker (for open discussion rounds)
   */
  switchSpeaker(to: 'A' | 'B'): void {
    if (this.session && this.session.state === 'live') {
      this.session.currentSpeaker = to;
      this.notifyStateChange();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSCRIPTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Add a transcript entry
   */
  addTranscriptEntry(entry: Omit<LiveTranscriptEntry, 'id' | 'timestamp'>): void {
    if (!this.session) return;

    const fullEntry: LiveTranscriptEntry = {
      ...entry,
      id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (Date.now() - this.sessionStartTimestamp) / 1000,
      roundId: this.session.rounds[this.session.currentRoundIndex]?.id
    };

    this.session.transcript.push(fullEntry);
    
    // Update speaker's speaking time
    if (this.session.debaters[entry.speaker]) {
      // Estimate speaking time from text length (rough approximation)
      const wordsPerSecond = 2.5;
      const wordCount = entry.text.split(/\s+/).length;
      const estimatedSeconds = wordCount / wordsPerSecond;
      this.session.debaters[entry.speaker]!.speakingTimeUsed += estimatedSeconds;
    }

    this.onTranscriptUpdate?.(fullEntry);
    this.notifyStateChange();
  }

  /**
   * Update an existing transcript entry (for interim → final)
   */
  updateTranscriptEntry(id: string, updates: Partial<LiveTranscriptEntry>): void {
    if (!this.session) return;

    const entry = this.session.transcript.find(t => t.id === id);
    if (entry) {
      Object.assign(entry, updates);
      this.onTranscriptUpdate?.(entry);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TIMER
  // ═══════════════════════════════════════════════════════════════

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (!this.session || this.session.isPaused) return;

      this.session.totalDuration = (Date.now() - this.sessionStartTimestamp) / 1000;

      // Check round time
      const currentRound = this.session.rounds[this.session.currentRoundIndex];
      if (currentRound?.startTime) {
        const roundElapsed = (Date.now() - currentRound.startTime.getTime()) / 1000;
        const remaining = currentRound.durationSeconds - roundElapsed;

        // Time warnings
        if (remaining <= 60 && remaining > 59 && this.session.currentSpeaker) {
          this.onTimeWarning?.(this.session.currentSpeaker, 60);
        } else if (remaining <= 30 && remaining > 29 && this.session.currentSpeaker) {
          this.onTimeWarning?.(this.session.currentSpeaker, 30);
        } else if (remaining <= 0) {
          // Auto-advance to next round
          this.nextRound();
        }
      }

      this.notifyStateChange();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  setOnStateChange(handler: (session: DebateSession) => void): void {
    this.onStateChange = handler;
  }

  setOnTranscriptUpdate(handler: (entry: LiveTranscriptEntry) => void): void {
    this.onTranscriptUpdate = handler;
  }

  setOnRoundChange(handler: (round: DebateRound) => void): void {
    this.onRoundChange = handler;
  }

  setOnTimeWarning(handler: (speaker: 'A' | 'B', secondsRemaining: number) => void): void {
    this.onTimeWarning = handler;
  }

  private notifyStateChange(): void {
    if (this.session && this.onStateChange) {
      this.onStateChange({ ...this.session });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  getSession(): DebateSession | null {
    return this.session ? { ...this.session } : null;
  }

  getCurrentRound(): DebateRound | null {
    if (!this.session) return null;
    return this.session.rounds[this.session.currentRoundIndex] || null;
  }

  getTranscript(): LiveTranscriptEntry[] {
    return this.session?.transcript || [];
  }

  getFullTranscriptText(): string {
    if (!this.session) return '';
    return this.session.transcript
      .filter(t => t.isFinal)
      .map(t => `[${t.speakerName}]: ${t.text}`)
      .join('\n\n');
  }

  getTranscriptForSpeaker(speaker: 'A' | 'B'): string {
    if (!this.session) return '';
    return this.session.transcript
      .filter(t => t.speaker === speaker && t.isFinal)
      .map(t => t.text)
      .join(' ');
  }

  getRoundTimeRemaining(): number {
    if (!this.session) return 0;
    const round = this.session.rounds[this.session.currentRoundIndex];
    if (!round?.startTime) return round?.durationSeconds || 0;
    const elapsed = (Date.now() - round.startTime.getTime()) / 1000;
    return Math.max(0, round.durationSeconds - elapsed);
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYSIS PREPARATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Prepare transcript segments for analysis
   */
  prepareForAnalysis(): TranscriptSegment[] {
    if (!this.session) return [];

    return this.session.transcript
      .filter(t => t.isFinal)
      .map(t => ({
        text: t.text,
        start: t.timestamp,
        end: t.timestamp + 10, // Approximate
        speaker: t.speaker
      }));
  }

  /**
   * Mark analysis as complete
   */
  setAnalysisResult(scoringResult: any, factVerification?: any): void {
    if (!this.session) return;
    
    this.session.analysisComplete = true;
    this.session.scoringResult = scoringResult;
    this.session.factVerification = factVerification;
    
    // Update debater scores from result
    if (scoringResult?.participants) {
      if (this.session.debaters.A) {
        this.session.debaters.A.currentScore = scoringResult.participants.A?.totalScore || 0;
        this.session.debaters.A.claimCount = scoringResult.participants.A?.claimCount || 0;
        this.session.debaters.A.fallacyCount = scoringResult.participants.A?.fallacyCount || 0;
      }
      if (this.session.debaters.B) {
        this.session.debaters.B.currentScore = scoringResult.participants.B?.totalScore || 0;
        this.session.debaters.B.claimCount = scoringResult.participants.B?.claimCount || 0;
        this.session.debaters.B.fallacyCount = scoringResult.participants.B?.fallacyCount || 0;
      }
    }

    this.notifyStateChange();
  }

  /**
   * Export session data for storage/replay
   */
  exportSession(): string {
    if (!this.session) return '';
    return JSON.stringify(this.session, null, 2);
  }

  /**
   * Import a previously saved session
   */
  importSession(jsonData: string): DebateSession | null {
    try {
      const session = JSON.parse(jsonData) as DebateSession;
      this.session = session;
      this.notifyStateChange();
      return session;
    } catch (error) {
      console.error('Failed to import session:', error);
      return null;
    }
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.stopTimer();
    this.session = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

let serviceInstance: LiveDebateService | null = null;

export function getLiveDebateService(): LiveDebateService {
  if (!serviceInstance) {
    serviceInstance = new LiveDebateService();
  }
  return serviceInstance;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function formatDebateTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getDebaterColors(): { A: string; B: string } {
  return {
    A: '#6366f1', // Indigo
    B: '#ec4899'  // Pink
  };
}

export function getRoleDisplayName(role: SpeakerRole): string {
  const names: Record<SpeakerRole, string> = {
    'proposition': 'Proposition',
    'opposition': 'Opposition',
    'affirmative': 'Affirmative',
    'negative': 'Negative',
    'pro': 'Pro',
    'con': 'Con',
    'speaker': 'Speaker'
  };
  return names[role] || role;
}
