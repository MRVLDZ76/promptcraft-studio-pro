// services/speakerDiarizationService.ts
// Phase 4: Speaker Diarization Service
// Identifies and labels different speakers (A vs B) from audio/video content

import { TranscriptSegment } from './inputProcessor';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface Speaker {
  id: string;
  label: 'A' | 'B' | 'C' | 'D' | 'unknown';
  name?: string;
  color: string;
  totalSpeakingTime: number;  // seconds
  segmentCount: number;
  averageSegmentLength: number;
  characteristics?: SpeakerCharacteristics;
}

export interface SpeakerCharacteristics {
  estimatedGender?: 'male' | 'female' | 'unknown';
  pitchRange?: 'low' | 'medium' | 'high';
  speakingPace?: 'slow' | 'normal' | 'fast';
  confidence: number;
}

export interface DiarizedSegment extends TranscriptSegment {
  speakerId: string;
  speakerLabel: 'A' | 'B' | 'C' | 'D' | 'unknown';
  speakerConfidence: number;
  wordCount: number;
}

export interface DiarizationResult {
  segments: DiarizedSegment[];
  speakers: Speaker[];
  totalDuration: number;
  speakerTransitions: number;
  dominantSpeaker: 'A' | 'B' | 'balanced';
  speakingTimeRatio: { A: number; B: number };
  metadata: {
    method: 'gemini' | 'heuristic' | 'manual';
    processingTime: number;
    confidence: number;
  };
}

export interface DiarizationConfig {
  maxSpeakers: number;           // Default: 2 (for debates)
  minSegmentDuration: number;    // Minimum segment length in seconds
  mergeThreshold: number;        // Seconds between segments to merge same speaker
  enableGeminiDiarization: boolean;  // Use Gemini for speaker identification
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: DiarizationConfig = {
  maxSpeakers: 2,
  minSegmentDuration: 0.5,
  mergeThreshold: 1.0,
  enableGeminiDiarization: true
};

const SPEAKER_COLORS: Record<string, string> = {
  A: '#6366f1',  // Indigo
  B: '#ec4899',  // Pink
  C: '#10b981',  // Emerald
  D: '#f59e0b',  // Amber
  unknown: '#6b7280'  // Gray
};

// ═══════════════════════════════════════════════════════════════
// SPEAKER DIARIZATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class SpeakerDiarizationService {
  private config: DiarizationConfig;

  constructor(config: Partial<DiarizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process segments and identify speakers
   * Uses Gemini or heuristic methods based on configuration
   */
  async diarize(
    segments: TranscriptSegment[],
    options?: {
      participantNames?: { A?: string; B?: string };
      videoBase64?: string;
      audioBase64?: string;
      mimeType?: string;
    }
  ): Promise<DiarizationResult> {
    const startTime = Date.now();

    // If segments already have speaker labels, validate and enhance
    if (this.hasExistingSpeakerLabels(segments)) {
      console.log('📊 Enhancing existing speaker labels...');
      return this.enhanceExistingLabels(segments, options?.participantNames);
    }

    // Try Gemini-based diarization if media is available
    if (this.config.enableGeminiDiarization && (options?.videoBase64 || options?.audioBase64)) {
      try {
        console.log('🎤 Using Gemini for speaker diarization...');
        return await this.geminiDiarization(segments, options);
      } catch (error) {
        console.warn('⚠️ Gemini diarization failed, falling back to heuristic...', error);
      }
    }

    // Fallback to heuristic-based diarization
    console.log('🔍 Using heuristic speaker diarization...');
    return this.heuristicDiarization(segments, options?.participantNames, startTime);
  }

  /**
   * Check if segments already have speaker labels
   */
  private hasExistingSpeakerLabels(segments: TranscriptSegment[]): boolean {
    const labeledCount = segments.filter(s => s.speaker && s.speaker !== 'unknown').length;
    return labeledCount > segments.length * 0.5;  // More than 50% labeled
  }

  /**
   * Enhance existing speaker labels with statistics
   */
  private enhanceExistingLabels(
    segments: TranscriptSegment[],
    participantNames?: { A?: string; B?: string }
  ): DiarizationResult {
    const startTime = Date.now();
    
    const diarizedSegments: DiarizedSegment[] = segments.map((seg, i) => ({
      ...seg,
      speakerId: `speaker_${seg.speaker || 'unknown'}`,
      speakerLabel: (seg.speaker as 'A' | 'B') || 'unknown',
      speakerConfidence: seg.speaker ? 0.95 : 0.5,
      wordCount: seg.text.split(/\s+/).length
    }));

    const speakers = this.calculateSpeakerStats(diarizedSegments, participantNames);
    
    return this.buildResult(diarizedSegments, speakers, startTime, 'manual');
  }

  /**
   * Gemini-based speaker diarization
   * Sends audio/video to Gemini for speaker identification
   */
  private async geminiDiarization(
    segments: TranscriptSegment[],
    options: {
      participantNames?: { A?: string; B?: string };
      videoBase64?: string;
      audioBase64?: string;
      mimeType?: string;
    }
  ): Promise<DiarizationResult> {
    const startTime = Date.now();

    const response = await fetch('/api/diarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: options.audioBase64,
        video: options.videoBase64,
        mimeType: options.mimeType,
        segments: segments.map(s => ({
          text: s.text,
          start: s.start,
          end: s.end
        })),
        options: {
          maxSpeakers: this.config.maxSpeakers,
          participantNames: options.participantNames
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Diarization API failed: ${response.statusText}`);
    }

    const result = await response.json();

    const diarizedSegments: DiarizedSegment[] = result.segments.map((seg: any, i: number) => ({
      text: seg.text,
      start: seg.start,
      end: seg.end,
      speaker: seg.speaker,
      speakerId: `speaker_${seg.speaker}`,
      speakerLabel: seg.speaker as 'A' | 'B',
      speakerConfidence: seg.confidence || 0.8,
      wordCount: seg.text.split(/\s+/).length
    }));

    const speakers = this.calculateSpeakerStats(diarizedSegments, options.participantNames);

    return this.buildResult(diarizedSegments, speakers, startTime, 'gemini');
  }

  /**
   * Heuristic-based speaker diarization
   * Uses text patterns and timing to identify speaker changes
   */
  private heuristicDiarization(
    segments: TranscriptSegment[],
    participantNames?: { A?: string; B?: string },
    startTime: number = Date.now()
  ): DiarizationResult {
    const diarizedSegments: DiarizedSegment[] = [];
    let currentSpeaker: 'A' | 'B' = 'A';
    let lastEndTime = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const gap = seg.start - lastEndTime;
      
      // Detect speaker change based on various heuristics
      const shouldSwitch = this.shouldSwitchSpeaker(seg, gap, i, segments);
      
      if (shouldSwitch) {
        currentSpeaker = currentSpeaker === 'A' ? 'B' : 'A';
      }

      diarizedSegments.push({
        ...seg,
        speaker: currentSpeaker,
        speakerId: `speaker_${currentSpeaker}`,
        speakerLabel: currentSpeaker,
        speakerConfidence: 0.6,  // Lower confidence for heuristic
        wordCount: seg.text.split(/\s+/).length
      });

      lastEndTime = seg.end;
    }

    // Merge consecutive segments from same speaker
    const mergedSegments = this.mergeConsecutiveSegments(diarizedSegments);
    const speakers = this.calculateSpeakerStats(mergedSegments, participantNames);

    return this.buildResult(mergedSegments, speakers, startTime, 'heuristic');
  }

  /**
   * Determine if speaker should switch based on heuristics
   */
  private shouldSwitchSpeaker(
    segment: TranscriptSegment,
    gap: number,
    index: number,
    allSegments: TranscriptSegment[]
  ): boolean {
    const text = segment.text.toLowerCase();
    
    // Gap-based detection: significant pause suggests speaker change
    if (gap > 2.0) return true;
    
    // Question followed by answer pattern
    if (index > 0) {
      const prevText = allSegments[index - 1].text;
      if (prevText.endsWith('?') && !text.startsWith('?')) {
        return true;
      }
    }

    // Interruption patterns
    if (text.startsWith('but ') || text.startsWith('no,') || text.startsWith('actually,')) {
      return gap > 0.3;
    }

    // Addressing patterns
    if (/^(look|listen|okay so|well|right)/i.test(text) && gap > 0.5) {
      return true;
    }

    // Response starters
    if (/^(i think|i believe|my view|in my opinion)/i.test(text) && gap > 0.8) {
      return true;
    }

    return false;
  }

  /**
   * Merge consecutive segments from the same speaker
   */
  private mergeConsecutiveSegments(segments: DiarizedSegment[]): DiarizedSegment[] {
    if (segments.length === 0) return [];

    const merged: DiarizedSegment[] = [{ ...segments[0] }];

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const last = merged[merged.length - 1];

      const shouldMerge = 
        current.speakerLabel === last.speakerLabel &&
        (current.start - last.end) <= this.config.mergeThreshold;

      if (shouldMerge) {
        // Merge into previous segment
        last.text += ' ' + current.text;
        last.end = current.end;
        last.wordCount += current.wordCount;
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }

  /**
   * Calculate statistics for each speaker
   */
  private calculateSpeakerStats(
    segments: DiarizedSegment[],
    participantNames?: { A?: string; B?: string }
  ): Speaker[] {
    const speakerMap = new Map<string, {
      segments: DiarizedSegment[];
      totalTime: number;
      wordCount: number;
    }>();

    for (const seg of segments) {
      const label = seg.speakerLabel;
      if (!speakerMap.has(label)) {
        speakerMap.set(label, { segments: [], totalTime: 0, wordCount: 0 });
      }
      const data = speakerMap.get(label)!;
      data.segments.push(seg);
      data.totalTime += (seg.end - seg.start);
      data.wordCount += seg.wordCount;
    }

    const speakers: Speaker[] = [];
    
    for (const [label, data] of speakerMap) {
      const typedLabel = label as 'A' | 'B' | 'C' | 'D' | 'unknown';
      speakers.push({
        id: `speaker_${label}`,
        label: typedLabel,
        name: participantNames?.[typedLabel as 'A' | 'B'],
        color: SPEAKER_COLORS[typedLabel] || SPEAKER_COLORS.unknown,
        totalSpeakingTime: data.totalTime,
        segmentCount: data.segments.length,
        averageSegmentLength: data.totalTime / data.segments.length,
        characteristics: this.estimateCharacteristics(data.segments)
      });
    }

    return speakers.sort((a, b) => b.totalSpeakingTime - a.totalSpeakingTime);
  }

  /**
   * Estimate speaker characteristics from text patterns
   */
  private estimateCharacteristics(segments: DiarizedSegment[]): SpeakerCharacteristics {
    const allText = segments.map(s => s.text).join(' ');
    const totalTime = segments.reduce((sum, s) => sum + (s.end - s.start), 0);
    const wordCount = allText.split(/\s+/).length;
    
    // Words per minute
    const wpm = totalTime > 0 ? (wordCount / totalTime) * 60 : 120;

    return {
      estimatedGender: 'unknown',
      pitchRange: 'medium',
      speakingPace: wpm < 100 ? 'slow' : wpm > 160 ? 'fast' : 'normal',
      confidence: 0.5
    };
  }

  /**
   * Build final diarization result
   */
  private buildResult(
    segments: DiarizedSegment[],
    speakers: Speaker[],
    startTime: number,
    method: 'gemini' | 'heuristic' | 'manual'
  ): DiarizationResult {
    const totalDuration = segments.length > 0 
      ? segments[segments.length - 1].end - segments[0].start 
      : 0;

    // Count speaker transitions
    let transitions = 0;
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].speakerLabel !== segments[i - 1].speakerLabel) {
        transitions++;
      }
    }

    // Calculate speaking time ratio
    const speakerA = speakers.find(s => s.label === 'A');
    const speakerB = speakers.find(s => s.label === 'B');
    const timeA = speakerA?.totalSpeakingTime || 0;
    const timeB = speakerB?.totalSpeakingTime || 0;
    const totalTime = timeA + timeB || 1;

    const ratioA = (timeA / totalTime) * 100;
    const ratioB = (timeB / totalTime) * 100;

    return {
      segments,
      speakers,
      totalDuration,
      speakerTransitions: transitions,
      dominantSpeaker: Math.abs(ratioA - ratioB) < 10 ? 'balanced' : ratioA > ratioB ? 'A' : 'B',
      speakingTimeRatio: { A: ratioA, B: ratioB },
      metadata: {
        method,
        processingTime: Date.now() - startTime,
        confidence: method === 'gemini' ? 0.85 : method === 'manual' ? 0.95 : 0.6
      }
    };
  }

  /**
   * Manually assign speaker to a segment (for user corrections)
   */
  reassignSpeaker(
    result: DiarizationResult,
    segmentIndex: number,
    newLabel: 'A' | 'B'
  ): DiarizationResult {
    const segments = [...result.segments];
    if (segmentIndex >= 0 && segmentIndex < segments.length) {
      segments[segmentIndex] = {
        ...segments[segmentIndex],
        speaker: newLabel,
        speakerLabel: newLabel,
        speakerId: `speaker_${newLabel}`,
        speakerConfidence: 1.0  // Manual = certain
      };
    }

    const speakers = this.calculateSpeakerStats(segments);
    return this.buildResult(segments, speakers, Date.now(), 'manual');
  }

  /**
   * Get segments for a specific speaker
   */
  getSegmentsForSpeaker(result: DiarizationResult, label: 'A' | 'B'): DiarizedSegment[] {
    return result.segments.filter(s => s.speakerLabel === label);
  }

  /**
   * Get segment at a specific timestamp
   */
  getSegmentAtTime(result: DiarizationResult, timeSeconds: number): DiarizedSegment | null {
    return result.segments.find(s => s.start <= timeSeconds && s.end >= timeSeconds) || null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

let serviceInstance: SpeakerDiarizationService | null = null;

export function getSpeakerDiarizationService(config?: Partial<DiarizationConfig>): SpeakerDiarizationService {
  if (!serviceInstance || config) {
    serviceInstance = new SpeakerDiarizationService(config);
  }
  return serviceInstance;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR UI
// ═══════════════════════════════════════════════════════════════

export function formatSpeakingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function getSpeakerColor(label: 'A' | 'B' | 'C' | 'D' | 'unknown'): string {
  return SPEAKER_COLORS[label] || SPEAKER_COLORS.unknown;
}

export function formatTimeRange(start: number, end: number): string {
  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}
