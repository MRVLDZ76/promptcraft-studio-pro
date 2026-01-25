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

  /**
   * Get the correct transcription endpoint URL
   * Handles both Supabase Edge Functions and Vercel API routes
   */
  private getTranscribeEndpoint(): string {
    const baseUrl = this.apiBaseUrl;
    // Supabase Edge Functions use function name directly (not /api/ prefix)
    if (baseUrl.includes('supabase.co/functions/v1')) {
      return `${baseUrl}/api-transcribe`;
    }
    // Vercel/Netlify fallback
    return `${baseUrl}/api/transcribe`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 2b. AUDIO TRANSCRIPTION (via transcribe endpoint)
  // ═══════════════════════════════════════════════════════════════
  private async transcribeAudioFile(file: File): Promise<ProcessedInput> {
    console.log(`🎙️ Transcribing audio: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const base64 = await this.fileToBase64(file);
    const endpoint = this.getTranscribeEndpoint();

    console.log(`📡 Using transcription endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
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
  // 2c. VIDEO TRANSCRIPTION (via transcribe endpoint)
  // ═══════════════════════════════════════════════════════════════
  private async transcribeVideoFile(file: File): Promise<ProcessedInput> {
    console.log(`🎬 Transcribing video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Check file size - warn if large
    if (file.size > 25 * 1024 * 1024) {
      console.warn('⚠️ Large video file. Transcription may take a while...');
    }

    const base64 = await this.fileToBase64(file);
    const endpoint = this.getTranscribeEndpoint();

    console.log(`📡 Using transcription endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
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
  // 3. MICROPHONE CAPTURE (Web Speech API with enhanced fallback)
  // ═══════════════════════════════════════════════════════════════
  startMicrophoneCapture(callbacks: MicrophoneCallbacks): MicrophoneSession {
    // Check browser support for Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('⚠️ Web Speech API not supported, attempting MediaRecorder fallback...');
      return this.startMediaRecorderCapture(callbacks);
    }

    console.log('🎤 Starting microphone capture via Web Speech API...');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';  // Use browser language
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    const segments: TranscriptSegment[] = [];
    const startTime = Date.now();
    let isActive = true;
    let restartAttempts = 0;
    const MAX_RESTARTS = 3;

    recognition.onstart = () => {
      console.log('🎤 Microphone active - Web Speech API');
      restartAttempts = 0; // Reset on successful start
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
        'no-speech': 'No speech detected. Listening...',
        'audio-capture': 'Microphone not found or not accessible. Please check your microphone.',
        'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
        'network': 'Network error during speech recognition. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
        'service-not-allowed': 'Speech recognition service not allowed. Try using Chrome browser.'
      };

      const errorMsg = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      
      // For 'no-speech' errors, don't stop - just notify and continue
      if (event.error === 'no-speech') {
        console.log('🎤 No speech detected, continuing to listen...');
        // Auto-restart if still active
        if (isActive && restartAttempts < MAX_RESTARTS) {
          restartAttempts++;
          try {
            recognition.start();
            console.log(`🎤 Auto-restarted recognition (attempt ${restartAttempts})`);
          } catch (e) {
            // Already running or stopped
          }
        }
        return;
      }
      
      callbacks.onError(errorMsg);
      isActive = false;
    };

    recognition.onend = () => {
      console.log('🎤 Recognition ended, isActive:', isActive);
      // Auto-restart if still supposed to be active (continuous mode)
      if (isActive && restartAttempts < MAX_RESTARTS) {
        restartAttempts++;
        try {
          recognition.start();
          console.log(`🎤 Auto-restarted recognition after end (attempt ${restartAttempts})`);
        } catch (e) {
          console.log('🎤 Could not restart, stopping');
          isActive = false;
        }
      } else {
        isActive = false;
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (err) {
      callbacks.onError('Failed to start microphone. Please check permissions and try again.');
      return this.createInactiveSession();
    }

    return {
      stop: (): ProcessedInput => {
        isActive = false; // Set first to prevent auto-restart
        try {
          recognition.stop();
        } catch (e) {
          // Already stopped
        }

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

  // ═══════════════════════════════════════════════════════════════
  // 3b. MEDIARECORDER FALLBACK (for browsers without Web Speech API)
  // ═══════════════════════════════════════════════════════════════
  private startMediaRecorderCapture(callbacks: MicrophoneCallbacks): MicrophoneSession {
    // Check for MediaRecorder support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      callbacks.onError('Microphone access not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return this.createInactiveSession();
    }

    console.log('🎤 Starting MediaRecorder fallback capture...');

    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isActive = true;
    const startTime = Date.now();

    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          console.log('🎤 MediaRecorder started');
          callbacks.onInterimTranscript('[Recording... Speech will be transcribed when stopped]');
        };

        mediaRecorder.onstop = async () => {
          console.log('🎤 MediaRecorder stopped, transcribing...');
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length === 0) {
            callbacks.onError('No audio recorded');
            return;
          }

          // Create audio blob and transcribe
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          callbacks.onInterimTranscript('[Transcribing audio...]');

          try {
            const result = await this.transcribeRecordedAudio(audioBlob);
            callbacks.onFinalTranscript(result.transcript);
          } catch (error: any) {
            callbacks.onError(`Transcription failed: ${error.message}`);
          }
        };

        mediaRecorder.start(1000); // Collect data every second
      })
      .catch((err) => {
        console.error('🎤 MediaRecorder error:', err);
        callbacks.onError(`Microphone access failed: ${err.message}`);
        isActive = false;
      });

    return {
      stop: (): ProcessedInput => {
        isActive = false;
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }

        const duration = (Date.now() - startTime) / 1000;
        
        return {
          type: InputType.MICROPHONE_LIVE,
          transcript: '[Transcription pending...]',
          segments: [],
          metadata: {
            source: 'microphone-mediarecorder',
            duration,
            language: 'auto',
            confidence: 0.8,
            wordCount: 0
          }
        };
      },
      isActive: () => isActive
    };
  }

  /**
   * Transcribe recorded audio blob via API
   */
  private async transcribeRecordedAudio(audioBlob: Blob): Promise<{ transcript: string }> {
    const base64 = await this.blobToBase64(audioBlob);
    const endpoint = this.getTranscribeEndpoint();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64,
        mimeType: 'audio/webm',
        options: {
          includeTimestamps: true,
          enableDiarization: false,
          language: 'auto'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const result = await response.json();
    return { transcript: result.transcript || '' };
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
