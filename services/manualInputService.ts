// services/manualInputService.ts
// Handle direct text input, dual-mic recording, and speaker diarization
// Date: January 26, 2026

import { TranscriptSegment, ProcessedInput, InputType } from './inputProcessor';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export enum ManualInputMode {
  PASTE_TEXT = 'paste_text',           // Paste pre-transcribed text
  MANUAL_TRANSCRIPT = 'manual_transcript', // Type/format transcript
  DUAL_MIC = 'dual_mic',               // Record A & B separately
  MARKED_SPEAKERS = 'marked_speakers'  // Mark speakers in pasted text
}

export interface SpeakerMarkedSegment {
  text: string;
  speaker: 'A' | 'B';
  timestamp?: { start: number; end: number };
}

export interface DualMicSession {
  recordingA: boolean;
  recordingB: boolean;
  audioA: Blob | null;
  audioB: Blob | null;
  transcriptA: string;
  transcriptB: string;
  startTime: number;
  endTime?: number;
}

export interface SpeakerDetectionResult {
  segments: TranscriptSegment[];
  confidence: number;
  speakerCount: number;
  diarizationModel: string;
}

// ═══════════════════════════════════════════════════════════════
// 1. MANUAL TEXT INPUT SERVICE
// ═══════════════════════════════════════════════════════════════

export class ManualInputService {
  /**
   * Process manually pasted or typed text transcript
   */
  static processManualText(
    text: string,
    mode: ManualInputMode = ManualInputMode.PASTE_TEXT
  ): ProcessedInput {
    if (!text || text.trim().length === 0) {
      throw new Error('Please provide transcript text');
    }

    const trimmedText = text.trim();
    const segments = this.parseTextForSpeakers(trimmedText);

    return {
      type: InputType.MANUAL_TEXT,
      transcript: trimmedText,
      segments: segments,
      metadata: {
        source: 'manual_input',
        language: 'en',
        confidence: 0.9, // User-provided text is trusted
        wordCount: trimmedText.split(/\s+/).length,
        speakerCount: new Set(segments.map(s => s.speaker)).size,
      }
    };
  }

  /**
   * Parse text to detect speaker markers (A:, B:, etc)
   * Supports formats:
   * - "A: text here" / "B: text here"
   * - "[A] text here" / "[B] text here"
   * - "Participant A: text" / "Participant B: text"
   */
  static parseTextForSpeakers(text: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    
    // Pattern 1: "A: " or "B: " at start of line
    const pattern1 = /^(A|B):\s+(.+)$/gm;
    
    // Pattern 2: "[A]" or "[B]" at start
    const pattern2 = /^\[(A|B)\]\s+(.+)$/gm;
    
    // Pattern 3: "Participant A:" or "Speaker A:"
    const pattern3 = /^(?:Participant|Speaker)\s+(A|B):\s+(.+)$/gm;
    
    let match;
    let time = 0;

    // Try all patterns
    const tryPattern = (pattern: RegExp) => {
      let found = false;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(text)) !== null) {
        found = true;
        const speaker = match[1] as 'A' | 'B';
        const content = match[2];
        
        const duration = (content.split(/\s+/).length / 150) * 60; // ~150 wpm estimate
        segments.push({
          text: content,
          start: time,
          end: time + duration,
          speaker
        });
        time += duration;
      }
      return found;
    };

    // Try patterns in order
    if (!tryPattern(pattern1)) {
      if (!tryPattern(pattern2)) {
        tryPattern(pattern3);
      }
    }

    // If no patterns matched, treat as continuous
    if (segments.length === 0) {
      segments.push({
        text: text,
        start: 0,
        end: (text.split(/\s+/).length / 150) * 60,
        speaker: 'A' // Default to A if no markers
      });
    }

    return segments;
  }

  /**
   * Format text with speaker markers
   */
  static addSpeakerMarkers(
    text: string,
    speakerSegments: SpeakerMarkedSegment[],
    format: 'prefix' | 'bracket' | 'full' = 'prefix'
  ): string {
    const lines = text.split('\n');
    let lineIndex = 0;
    const result: string[] = [];

    for (const segment of speakerSegments) {
      const segmentLines = segment.text.split('\n');
      const prefix = this.getSpeakerPrefix(segment.speaker, format);

      for (const line of segmentLines) {
        if (lineIndex < lines.length) {
          result.push(`${prefix}${line}`);
          lineIndex++;
        }
      }
    }

    return result.join('\n');
  }

  private static getSpeakerPrefix(speaker: 'A' | 'B', format: string): string {
    switch (format) {
      case 'bracket':
        return `[${speaker}] `;
      case 'full':
        return `Participant ${speaker}: `;
      case 'prefix':
      default:
        return `${speaker}: `;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. DUAL MICROPHONE RECORDING SERVICE
// ═══════════════════════════════════════════════════════════════

export class DualMicService {
  private mediaRecorders: Map<string, MediaRecorder> = new Map();
  private audioStreams: Map<string, MediaStream> = new Map();
  private recordedChunks: Map<string, Blob[]> = new Map();

  /**
   * Start recording from specific microphone for speaker A or B
   */
  async startRecording(
    speaker: 'A' | 'B',
    deviceId?: string
  ): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId 
          ? { deviceId: { exact: deviceId } }
          : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioStreams.set(speaker, stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recordedChunks.set(speaker, []);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const chunks = this.recordedChunks.get(speaker) || [];
          chunks.push(event.data);
          this.recordedChunks.set(speaker, chunks);
        }
      };

      mediaRecorder.start(1000); // Capture every 1 second
      this.mediaRecorders.set(speaker, mediaRecorder);

      console.log(`🎤 Recording started for Speaker ${speaker}`);
    } catch (error) {
      throw new Error(`Failed to access microphone for Speaker ${speaker}: ${error}`);
    }
  }

  /**
   * Stop recording and get audio blob
   */
  stopRecording(speaker: 'A' | 'B'): Blob | null {
    const recorder = this.mediaRecorders.get(speaker);
    if (!recorder) return null;

    recorder.stop();

    // Stop audio stream
    const stream = this.audioStreams.get(speaker);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Create blob from chunks
    const chunks = this.recordedChunks.get(speaker) || [];
    const blob = new Blob(chunks, { type: 'audio/webm' });

    // Cleanup
    this.mediaRecorders.delete(speaker);
    this.audioStreams.delete(speaker);
    this.recordedChunks.delete(speaker);

    console.log(`✅ Recording stopped for Speaker ${speaker} (${blob.size} bytes)`);
    return blob;
  }

  /**
   * List available audio input devices
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  /**
   * Check if browser supports dual mic recording
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. SPEAKER DIARIZATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class SpeakerDiarizationService {
  /**
   * Detect speakers in transcript using heuristics
   * Note: Browser doesn't have ML, so we use text patterns
   */
  static detectSpeakersFromTranscript(
    transcript: string,
    numSpeakers: number = 2
  ): SpeakerDetectionResult {
    const segments = this.segmentBySpeakers(transcript, numSpeakers);
    
    return {
      segments,
      confidence: this.calculateConfidence(transcript, segments),
      speakerCount: numSpeakers,
      diarizationModel: 'heuristic-pattern-matching'
    };
  }

  /**
   * Segment transcript by speakers using alternating pattern
   * Splits into roughly equal parts and alternates A/B
   */
  private static segmentBySpeakers(
    transcript: string,
    numSpeakers: number
  ): TranscriptSegment[] {
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
    const segments: TranscriptSegment[] = [];
    let time = 0;
    let speakerIndex = 0;

    const speakers: ('A' | 'B')[] = ['A', 'B'];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const wordCount = sentence.split(/\s+/).length;
      const duration = (wordCount / 150) * 60; // ~150 wpm

      segments.push({
        text: sentence,
        start: time,
        end: time + duration,
        speaker: speakers[speakerIndex % numSpeakers] as 'A' | 'B'
      });

      time += duration;
      speakerIndex++;
    }

    return segments;
  }

  /**
   * Calculate confidence score for speaker detection
   * 0.9-1.0 = very confident (explicit markers found)
   * 0.6-0.8 = moderately confident (pattern detected)
   * 0.3-0.6 = low confidence (guessing from structure)
   */
  private static calculateConfidence(
    transcript: string,
    segments: TranscriptSegment[]
  ): number {
    let score = 0.5; // Base score

    // Check for explicit markers
    if (/^(A|B):\s/m.test(transcript)) score = 0.95;
    else if (/^\[(A|B)\]\s/m.test(transcript)) score = 0.95;
    else if (/^(?:Participant|Speaker)\s+(A|B):/m.test(transcript)) score = 0.95;

    // Check for quotation patterns
    else if (/".*?".*?".*?"/m.test(transcript)) score = 0.75; // Multiple quotes = alternating speakers
    else if (/".*?"/m.test(transcript)) score = 0.7;

    // Check for dialogue markers like "said", "replied"
    else if (/\b(said|replied|responded|asked|stated|argued|claimed)\b/im.test(transcript)) {
      score = 0.65;
    }

    // Check segment balance
    const segmentCounts = segments.reduce((acc, seg) => {
      acc[seg.speaker] = (acc[seg.speaker] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const counts = Object.values(segmentCounts);
    const balance = Math.min(...counts) / Math.max(...counts);
    if (balance > 0.7) score += 0.1; // Good balance = more confident

    return Math.min(score, 1.0);
  }

  /**
   * Merge consecutive segments from same speaker
   */
  static mergeConsecutiveSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
    if (segments.length === 0) return segments;

    const merged: TranscriptSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];

      if (segment.speaker === current.speaker) {
        // Same speaker - merge text
        current.text += ' ' + segment.text;
        current.end = segment.end;
      } else {
        // Different speaker - save current and start new
        merged.push(current);
        current = { ...segment };
      }
    }

    merged.push(current);
    return merged;
  }

  /**
   * Export segments to SRT format with speaker labels
   */
  static toSRTFormat(segments: TranscriptSegment[]): string {
    return segments
      .map((seg, i) => {
        const startTime = this.secondsToSRTTime(seg.start);
        const endTime = this.secondsToSRTTime(seg.end);
        return `${i + 1}\n${startTime} --> ${endTime}\n[${seg.speaker}] ${seg.text}\n`;
      })
      .join('\n');
  }

  /**
   * Export segments to VTT format
   */
  static toVTTFormat(segments: TranscriptSegment[]): string {
    let vtt = 'WEBVTT\n\n';
    vtt += segments
      .map(seg => {
        const startTime = this.secondsToVTTTime(seg.start);
        const endTime = this.secondsToVTTTime(seg.end);
        return `${startTime} --> ${endTime}\n[${seg.speaker}] ${seg.text}`;
      })
      .join('\n\n');
    return vtt;
  }

  private static secondsToSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private static secondsToVTTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. COMBINED SERVICE FOR UI INTEGRATION
// ═══════════════════════════════════════════════════════════════

export class TranscriptInputManager {
  private manualService = ManualInputService;
  private dualMicService: DualMicService;
  private diarizationService = SpeakerDiarizationService;

  constructor() {
    this.dualMicService = new DualMicService();
  }

  /**
   * Process input based on mode
   */
  async processInput(
    input: string | Blob,
    mode: ManualInputMode
  ): Promise<ProcessedInput> {
    switch (mode) {
      case ManualInputMode.PASTE_TEXT:
        return this.manualService.processManualText(input as string, mode);

      case ManualInputMode.MARKED_SPEAKERS:
        // Parse text with speaker markers and auto-detect speakers
        const processed = this.manualService.processManualText(input as string, mode);
        return processed;

      case ManualInputMode.DUAL_MIC:
        // This would be called after recording both speakers
        return this.processDualMicInput(input as any);

      default:
        throw new Error(`Unknown input mode: ${mode}`);
    }
  }

  private async processDualMicInput(session: DualMicSession): Promise<ProcessedInput> {
    // Combine transcripts from both mics
    const fullTranscript = `A: ${session.transcriptA}\n\nB: ${session.transcriptB}`;
    
    return {
      type: InputType.MICROPHONE_LIVE,
      transcript: fullTranscript,
      segments: this.manualService.parseTextForSpeakers(fullTranscript),
      metadata: {
        source: 'dual_microphone',
        language: 'en',
        confidence: 0.85,
        speakerCount: 2,
        wordCount: fullTranscript.split(/\s+/).length,
      }
    };
  }

  /**
   * Get available microphones for dual recording
   */
  async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    return this.dualMicService.getAudioDevices();
  }

  /**
   * Check if dual mic is supported
   */
  isDualMicSupported(): boolean {
    return DualMicService.isSupported();
  }

  /**
   * Start speaker A recording
   */
  async recordSpeakerA(deviceId?: string): Promise<void> {
    return this.dualMicService.startRecording('A', deviceId);
  }

  /**
   * Start speaker B recording
   */
  async recordSpeakerB(deviceId?: string): Promise<void> {
    return this.dualMicService.startRecording('B', deviceId);
  }

  /**
   * Stop recording for speaker
   */
  stopSpeaker(speaker: 'A' | 'B'): Blob | null {
    return this.dualMicService.stopRecording(speaker);
  }

  /**
   * Detect speakers in transcript
   */
  detectSpeakers(transcript: string, count: number = 2): SpeakerDetectionResult {
    return this.diarizationService.detectSpeakersFromTranscript(transcript, count);
  }

  /**
   * Export segments to various formats
   */
  exportSegments(
    segments: TranscriptSegment[],
    format: 'srt' | 'vtt' | 'json'
  ): string {
    switch (format) {
      case 'srt':
        return this.diarizationService.toSRTFormat(segments);
      case 'vtt':
        return this.diarizationService.toVTTFormat(segments);
      case 'json':
        return JSON.stringify(segments, null, 2);
      default:
        return JSON.stringify(segments);
    }
  }
}
