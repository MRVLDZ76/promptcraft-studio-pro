// services/inputProcessor.ts
// Unified Input Processor - Handles all input sources with consistent interface
// Phase 1 Implementation - January 12, 2026

import { getVideoTranscriptWithFallback, extractYouTubeVideoId } from './serpApiService';
import { getCachedVideoTranscript, cacheVideoTranscript } from './supabaseClient';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export enum InputType {
  YOUTUBE_URL = 'youtube_url',
  FILE_VIDEO = 'file_video',
  FILE_AUDIO = 'file_audio',
  FILE_TRANSCRIPT = 'file_transcript',  // SRT, VTT, TXT
  MICROPHONE_LIVE = 'microphone_live',
  MANUAL_TEXT = 'manual_text'
}

export interface TranscriptSegment {
  text: string;
  start: number;  // seconds
  end: number;    // seconds
  speaker?: 'A' | 'B' | 'unknown';
}

export interface ProcessedInput {
  type: InputType;
  transcript: string;
  segments: TranscriptSegment[];
  metadata: {
    source: string;
    sourceId?: string;      // video_id for YouTube
    duration?: number;      // total seconds
    language: string;
    confidence: number;     // 0-1 transcription confidence
    speakerCount?: number;  // detected speakers for diarization
    wordCount?: number;
  };
  raw?: any;  // original API response
}

export interface MicrophoneSession {
  stop: () => ProcessedInput;
  isActive: () => boolean;
}

export interface MicrophoneCallbacks {
  onInterimTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (error: string) => void;
  onVolumeChange?: (volume: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// INPUT PROCESSOR CLASS
// ═══════════════════════════════════════════════════════════════

export class InputProcessor {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '') {
    this.apiBaseUrl = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '';
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. YOUTUBE URL PROCESSING (Uses existing SerpAPI integration)
  // ═══════════════════════════════════════════════════════════════
  async processYouTubeUrl(url: string): Promise<ProcessedInput> {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }

    console.log(`🎬 Processing YouTube video: ${videoId}`);

    // Check cache first
    try {
      const cached = await getCachedVideoTranscript(videoId);
      if (cached && cached.transcript_text) {
        console.log('✅ Using cached transcript');
        return {
          type: InputType.YOUTUBE_URL,
          transcript: cached.transcript_text,
          segments: [],  // Cache doesn't store segments
          metadata: {
            source: url,
            sourceId: videoId,
            language: cached.language_code || 'en',
            confidence: 1.0,  // Cached = verified
            wordCount: cached.transcript_text.split(/\s+/).length
          }
        };
      }
    } catch (cacheError) {
      console.warn('Cache lookup failed, fetching fresh:', cacheError);
    }

    // Fetch via SerpAPI
    const data = await getVideoTranscriptWithFallback(videoId);

    // Extract language code from the first language entry
    const langEntry = data.languages?.[0];
    const languageCode = typeof langEntry === 'string' ? langEntry : langEntry?.language_code || 'en';

    // Cache for future use
    try {
      await cacheVideoTranscript({
        video_id: videoId,
        video_url: url,
        title: '',
        channel_name: '',
        transcript_text: data.full_transcript,
        language_code: languageCode,
        duration: '0'
      });
      console.log('✅ Transcript cached');
    } catch (cacheError) {
      console.warn('Failed to cache transcript:', cacheError);
    }

    const segments: TranscriptSegment[] = (data.transcript || []).map((t: any) => ({
      text: t.text,
      start: parseFloat(t.start) || 0,
      end: (parseFloat(t.start) || 0) + (parseFloat(t.duration) || 0)
    }));

    return {
      type: InputType.YOUTUBE_URL,
      transcript: data.full_transcript,
      segments,
      metadata: {
        source: url,
        sourceId: videoId,
        language: languageCode,
        confidence: 0.95,
        wordCount: data.full_transcript.split(/\s+/).length
      },
      raw: data
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. FILE PROCESSING (Unified handler for all file types)
  // ═══════════════════════════════════════════════════════════════
  async processFile(file: File): Promise<ProcessedInput> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    console.log(`📁 Processing file: ${file.name} (${mimeType || ext})`);

    // TRANSCRIPT FILES: Direct parse (no API needed)
    if (['srt', 'vtt', 'txt'].includes(ext)) {
      return this.parseTranscriptFile(file, ext);
    }

    // AUDIO FILES: Send to transcription API
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext)) {
      return this.transcribeAudioFile(file);
    }

    // VIDEO FILES: Send to transcription API
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext)) {
      return this.transcribeVideoFile(file);
    }

    throw new Error(`Unsupported file type: ${ext || mimeType}. Supported: mp4, webm, mp3, wav, srt, vtt, txt`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2a. TRANSCRIPT FILE PARSING (SRT/VTT/TXT)
  // ═══════════════════════════════════════════════════════════════
  private async parseTranscriptFile(file: File, ext: string): Promise<ProcessedInput> {
    const content = await file.text();

    let segments: TranscriptSegment[] = [];
    let fullText = '';

    if (ext === 'srt') {
      segments = this.parseSRT(content);
      fullText = segments.map(s => s.text).join(' ');
    } else if (ext === 'vtt') {
      segments = this.parseVTT(content);
      fullText = segments.map(s => s.text).join(' ');
    } else {
      // Plain text - no timestamps
      fullText = content.trim();
      segments = [{ text: fullText, start: 0, end: 0 }];
    }

    const duration = segments.length > 0 ? Math.max(...segments.map(s => s.end)) : 0;

    console.log(`✅ Parsed ${ext.toUpperCase()}: ${segments.length} segments, ${fullText.split(/\s+/).length} words`);

    return {
      type: InputType.FILE_TRANSCRIPT,
      transcript: fullText,
      segments,
      metadata: {
        source: file.name,
        duration,
        language: 'unknown',  // Could add language detection
        confidence: 1.0,       // User-provided = trusted
        wordCount: fullText.split(/\s+/).length
      }
    };
  }

  /**
   * Parse SRT subtitle format
   * Format:
   * 1
   * 00:00:01,500 --> 00:00:04,000
   * First subtitle text
   */
  private parseSRT(content: string): TranscriptSegment[] {
    const blocks = content.trim().split(/\n\n+/);
    const segments: TranscriptSegment[] = [];

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 2) continue;

      // Find the timestamp line (might be line 1 or 2)
      let timeLineIndex = lines.findIndex(line => line.includes('-->'));
      if (timeLineIndex === -1) continue;

      const timeLine = lines[timeLineIndex];
      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );

      if (!timeMatch) continue;

      const text = lines.slice(timeLineIndex + 1).join(' ').trim();
      if (!text) continue;

      const start = this.parseTimestamp(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
      const end = this.parseTimestamp(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

      segments.push({ text, start, end });
    }

    return segments;
  }

  /**
   * Parse WebVTT subtitle format
   * Format:
   * WEBVTT
   *
   * 00:00:01.500 --> 00:00:04.000
   * First subtitle text
   */
  private parseVTT(content: string): TranscriptSegment[] {
    // Remove WEBVTT header and any metadata
    let cleanContent = content.replace(/^WEBVTT[\s\S]*?\n\n/, '');
    // Remove cue identifiers and style blocks
    cleanContent = cleanContent.replace(/^[^\n]*::[^\n]*\n/gm, '');
    // VTT format is similar to SRT after cleaning
    return this.parseSRT(cleanContent);
  }

  private parseTimestamp(h: string, m: string, s: string, ms: string): number {
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
  }

  // ═══════════════════════════════════════════════════════════════
  // 2b. AUDIO TRANSCRIPTION (via /api/transcribe endpoint)
  // ═══════════════════════════════════════════════════════════════
  private async transcribeAudioFile(file: File): Promise<ProcessedInput> {
    console.log(`🎙️ Transcribing audio: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const base64 = await this.fileToBase64(file);

    const response = await fetch(`${this.apiBaseUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64,
        mimeType: file.type || 'audio/mpeg',
        options: {
          includeTimestamps: true,
          enableDiarization: true,
          language: 'auto'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Transcription failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    console.log(`✅ Audio transcribed: ${result.wordCount || 'unknown'} words, ${result.confidence ? (result.confidence * 100).toFixed(0) + '%' : 'unknown'} confidence`);

    return {
      type: InputType.FILE_AUDIO,
      transcript: result.transcript || '',
      segments: (result.segments || []).map((s: any) => ({
        text: s.text,
        start: s.start || 0,
        end: s.end || 0,
        speaker: s.speaker
      })),
      metadata: {
        source: file.name,
        duration: result.duration || 0,
        language: result.language || 'en',
        confidence: result.confidence || 0.85,
        speakerCount: result.speakers?.length || 1,
        wordCount: result.wordCount || result.transcript?.split(/\s+/).length || 0
      },
      raw: result
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 2c. VIDEO TRANSCRIPTION (via /api/transcribe endpoint)
  // ═══════════════════════════════════════════════════════════════
  private async transcribeVideoFile(file: File): Promise<ProcessedInput> {
    console.log(`🎬 Transcribing video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Check file size - warn if large
    if (file.size > 25 * 1024 * 1024) {
      console.warn('⚠️ Large video file. Transcription may take a while...');
    }

    const base64 = await this.fileToBase64(file);

    const response = await fetch(`${this.apiBaseUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video: base64,
        mimeType: file.type || 'video/mp4',
        options: {
          includeTimestamps: true,
          enableDiarization: true,
          language: 'auto'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Video transcription failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success && result.error) {
      throw new Error(result.error);
    }

    console.log(`✅ Video transcribed: ${result.wordCount || 'unknown'} words`);

    return {
      type: InputType.FILE_VIDEO,
      transcript: result.transcript || '',
      segments: (result.segments || []).map((s: any) => ({
        text: s.text,
        start: s.start || 0,
        end: s.end || 0,
        speaker: s.speaker
      })),
      metadata: {
        source: file.name,
        duration: result.duration || 0,
        language: result.language || 'en',
        confidence: result.confidence || 0.80,
        speakerCount: result.speakers?.length || 1,
        wordCount: result.wordCount || result.transcript?.split(/\s+/).length || 0
      },
      raw: result
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. MICROPHONE CAPTURE (Web Speech API)
  // ═══════════════════════════════════════════════════════════════
  startMicrophoneCapture(callbacks: MicrophoneCallbacks): MicrophoneSession {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      callbacks.onError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return this.createInactiveSession();
    }

    console.log('🎤 Starting microphone capture...');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';  // TODO: Make configurable
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    const segments: TranscriptSegment[] = [];
    const startTime = Date.now();
    let isActive = true;

    recognition.onstart = () => {
      console.log('🎤 Microphone active');
    };

    recognition.onresult = (event: any) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          segments.push({
            text: transcript.trim(),
            start: (Date.now() - startTime) / 1000 - 2,  // Approximate
            end: (Date.now() - startTime) / 1000
          });
          callbacks.onFinalTranscript(finalTranscript.trim());
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        callbacks.onInterimTranscript(finalTranscript + interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please speak into your microphone.',
        'audio-capture': 'Microphone not found or not accessible.',
        'not-allowed': 'Microphone access denied. Please allow microphone access and try again.',
        'network': 'Network error during speech recognition.',
        'aborted': 'Speech recognition was aborted.'
      };

      callbacks.onError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('🎤 Microphone stopped');
      isActive = false;
    };

    // Start recognition
    try {
      recognition.start();
    } catch (err) {
      callbacks.onError('Failed to start microphone. Please check permissions.');
      return this.createInactiveSession();
    }

    return {
      stop: (): ProcessedInput => {
        try {
          recognition.stop();
        } catch (e) {
          // Already stopped
        }
        isActive = false;

        const duration = (Date.now() - startTime) / 1000;
        console.log(`🎤 Recording stopped: ${duration.toFixed(1)}s, ${finalTranscript.split(/\s+/).length} words`);

        return {
          type: InputType.MICROPHONE_LIVE,
          transcript: finalTranscript.trim(),
          segments,
          metadata: {
            source: 'microphone',
            duration,
            language: recognition.lang,
            confidence: 0.85,  // Web Speech API typical accuracy
            wordCount: finalTranscript.trim().split(/\s+/).filter(w => w).length
          }
        };
      },
      isActive: () => isActive
    };
  }

  private createInactiveSession(): MicrophoneSession {
    return {
      stop: () => this.createEmptyInput(),
      isActive: () => false
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. MANUAL TEXT INPUT
  // ═══════════════════════════════════════════════════════════════
  processManualText(text: string): ProcessedInput {
    const cleanText = text.trim();

    return {
      type: InputType.MANUAL_TEXT,
      transcript: cleanText,
      segments: [{ text: cleanText, start: 0, end: 0 }],
      metadata: {
        source: 'manual_entry',
        language: 'unknown',
        confidence: 1.0,  // User-provided = trusted
        wordCount: cleanText.split(/\s+/).filter(w => w).length
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. SMART INPUT DETECTION (Auto-detect input type)
  // ═══════════════════════════════════════════════════════════════
  async processAuto(input: string | File): Promise<ProcessedInput> {
    // File input
    if (input instanceof File) {
      return this.processFile(input);
    }

    // String input - detect type
    const str = input.trim();

    // YouTube URL detection
    if (this.isYouTubeUrl(str)) {
      return this.processYouTubeUrl(str);
    }

    // Treat as manual text
    return this.processManualText(str);
  }

  private isYouTubeUrl(str: string): boolean {
    return /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)/i.test(str);
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get raw base64
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private createEmptyInput(): ProcessedInput {
    return {
      type: InputType.MANUAL_TEXT,
      transcript: '',
      segments: [],
      metadata: {
        source: 'empty',
        language: 'unknown',
        confidence: 0,
        wordCount: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════
  validateInput(input: ProcessedInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.transcript || input.transcript.trim().length === 0) {
      errors.push('Transcript is empty');
    }

    if (input.transcript.length < 50) {
      errors.push('Transcript is too short (minimum 50 characters)');
    }

    if (input.metadata.confidence < 0.5) {
      errors.push(`Low transcription confidence (${(input.metadata.confidence * 100).toFixed(0)}%)`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SUPPORTED FORMATS
  // ═══════════════════════════════════════════════════════════════
  static getSupportedFormats(): { category: string; extensions: string[] }[] {
    return [
      { category: 'Video', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] },
      { category: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
      { category: 'Transcript', extensions: ['srt', 'vtt', 'txt'] },
      { category: 'URL', extensions: ['YouTube links'] }
    ];
  }

  static getAcceptString(): string {
    return 'video/*,audio/*,.srt,.vtt,.txt';
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════
export const inputProcessor = new InputProcessor();
