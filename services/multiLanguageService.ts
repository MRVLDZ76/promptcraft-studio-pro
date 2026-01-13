// services/multiLanguageService.ts
// Phase 4: Multi-Language Transcription Support
// Language detection, translation, and multi-language transcription

import { TranscriptSegment } from './inputProcessor';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface SupportedLanguage {
  code: string;         // ISO 639-1 code
  name: string;         // Display name
  nativeName: string;   // Name in native language
  flag: string;         // Emoji flag
  webSpeechCode: string; // Web Speech API language code
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  alternativeLanguages: Array<{ code: string; confidence: number }>;
  isMultilingual: boolean;
  segments?: Array<{
    text: string;
    language: string;
    startTime: number;
    endTime: number;
  }>;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface MultiLanguageTranscriptSegment extends TranscriptSegment {
  language: string;
  translation?: {
    text: string;
    targetLanguage: string;
  };
}

export interface TranscriptionConfig {
  sourceLanguage: string | 'auto';
  targetLanguage?: string;  // For translation
  enableTranslation: boolean;
  enableCodeSwitching: boolean; // Handle multiple languages in same content
}

// ═══════════════════════════════════════════════════════════════
// SUPPORTED LANGUAGES
// ═══════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', webSpeechCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', webSpeechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', webSpeechCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', webSpeechCode: 'de-DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', webSpeechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', webSpeechCode: 'pt-PT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', webSpeechCode: 'ru-RU' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', webSpeechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', webSpeechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', webSpeechCode: 'ko-KR' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', webSpeechCode: 'ar-SA' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', webSpeechCode: 'hi-IN' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', webSpeechCode: 'nl-NL' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', webSpeechCode: 'pl-PL' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', webSpeechCode: 'tr-TR' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', webSpeechCode: 'vi-VN' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', webSpeechCode: 'th-TH' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', webSpeechCode: 'uk-UA' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', webSpeechCode: 'he-IL' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', webSpeechCode: 'id-ID' }
];

// Language detection patterns (common words/characters)
const LANGUAGE_PATTERNS: Record<string, { chars: RegExp; words: string[] }> = {
  en: { chars: /[a-zA-Z]/, words: ['the', 'and', 'is', 'to', 'of', 'that', 'in', 'it'] },
  es: { chars: /[áéíóúüñ¿¡]/, words: ['que', 'de', 'no', 'es', 'la', 'el', 'en', 'los'] },
  fr: { chars: /[àâçéèêëîïôùûü]/, words: ['le', 'la', 'de', 'et', 'est', 'en', 'que', 'les'] },
  de: { chars: /[äöüß]/, words: ['der', 'die', 'und', 'ist', 'von', 'zu', 'das', 'mit'] },
  it: { chars: /[àèéìíîòóùú]/, words: ['che', 'di', 'il', 'la', 'non', 'un', 'per', 'sono'] },
  pt: { chars: /[àáâãçéêíóôõú]/, words: ['que', 'de', 'não', 'uma', 'para', 'com', 'os', 'como'] },
  ru: { chars: /[\u0400-\u04FF]/, words: ['и', 'в', 'не', 'на', 'я', 'что', 'он', 'с'] },
  zh: { chars: /[\u4e00-\u9fff]/, words: [] },
  ja: { chars: /[\u3040-\u309f\u30a0-\u30ff]/, words: [] },
  ko: { chars: /[\uac00-\ud7af]/, words: [] },
  ar: { chars: /[\u0600-\u06FF]/, words: [] },
  hi: { chars: /[\u0900-\u097F]/, words: [] }
};

// ═══════════════════════════════════════════════════════════════
// MULTI-LANGUAGE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class MultiLanguageService {
  private apiKey: string | null;
  private defaultLanguage: string = 'en';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // LANGUAGE DETECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detect the primary language of a text
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const scores: Record<string, number> = {};
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);

    // Score each language
    for (const [langCode, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      let score = 0;

      // Character pattern matching
      const charMatches = (text.match(patterns.chars) || []).length;
      score += charMatches * 2;

      // Word matching
      for (const word of patterns.words) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = (textLower.match(wordRegex) || []).length;
        score += matches * 10;
      }

      scores[langCode] = score;
    }

    // Sort by score
    const sortedLangs = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0);

    if (sortedLangs.length === 0) {
      return {
        detectedLanguage: this.defaultLanguage,
        confidence: 0.5,
        alternativeLanguages: [],
        isMultilingual: false
      };
    }

    const totalScore = sortedLangs.reduce((sum, [_, score]) => sum + score, 0);
    const topScore = sortedLangs[0][1];
    const confidence = Math.min(topScore / Math.max(totalScore, 1), 1);

    // Check if multilingual (second language has significant score)
    const isMultilingual = sortedLangs.length > 1 && 
      sortedLangs[1][1] > topScore * 0.3;

    return {
      detectedLanguage: sortedLangs[0][0],
      confidence,
      alternativeLanguages: sortedLangs.slice(1, 4).map(([code, score]) => ({
        code,
        confidence: score / totalScore
      })),
      isMultilingual
    };
  }

  /**
   * AI-powered language detection using Gemini
   */
  async detectLanguageWithAI(text: string): Promise<LanguageDetectionResult> {
    if (!this.apiKey) {
      console.warn('[MultiLanguage] No API key, using heuristic detection');
      return this.detectLanguage(text);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze the following text and detect its language(s). 
                
Return ONLY a JSON object with this structure:
{
  "primaryLanguage": "ISO 639-1 code",
  "confidence": 0.0-1.0,
  "alternativeLanguages": [{"code": "xx", "confidence": 0.0-1.0}],
  "isMultilingual": boolean
}

Text to analyze:
"${text.substring(0, 1000)}"`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          detectedLanguage: parsed.primaryLanguage || 'en',
          confidence: parsed.confidence || 0.8,
          alternativeLanguages: parsed.alternativeLanguages || [],
          isMultilingual: parsed.isMultilingual || false
        };
      }

      return this.detectLanguage(text);
    } catch (error) {
      console.error('[MultiLanguage] AI detection failed:', error);
      return this.detectLanguage(text);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSLATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Translate text using Gemini
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    if (!this.apiKey) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage || 'unknown',
        targetLanguage,
        confidence: 0
      };
    }

    const sourceLang = sourceLanguage 
      ? this.getLanguageName(sourceLanguage)
      : 'auto-detected';
    const targetLang = this.getLanguageName(targetLanguage);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Translate the following text to ${targetLang}.
${sourceLang !== 'auto-detected' ? `Source language: ${sourceLang}` : ''}

Important:
- Maintain the original meaning and tone
- Preserve any technical terms if appropriate
- Return ONLY the translation, no explanations

Text to translate:
"${text}"`
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

      // Remove quotes if present
      const cleanTranslation = translatedText.replace(/^["']|["']$/g, '');

      return {
        originalText: text,
        translatedText: cleanTranslation,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        confidence: 0.9
      };
    } catch (error) {
      console.error('[MultiLanguage] Translation failed:', error);
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage || 'unknown',
        targetLanguage,
        confidence: 0
      };
    }
  }

  /**
   * Translate transcript segments
   */
  async translateSegments(
    segments: TranscriptSegment[],
    targetLanguage: string,
    onProgress?: (progress: number) => void
  ): Promise<MultiLanguageTranscriptSegment[]> {
    const results: MultiLanguageTranscriptSegment[] = [];
    const total = segments.length;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Detect source language if not known
      const detection = this.detectLanguage(segment.text);
      
      // Skip translation if already in target language
      if (detection.detectedLanguage === targetLanguage) {
        results.push({
          ...segment,
          language: detection.detectedLanguage
        });
      } else {
        // Translate
        const translation = await this.translate(
          segment.text,
          targetLanguage,
          detection.detectedLanguage
        );

        results.push({
          ...segment,
          language: detection.detectedLanguage,
          translation: {
            text: translation.translatedText,
            targetLanguage
          }
        });
      }

      onProgress?.((i + 1) / total * 100);

      // Rate limiting
      if (i < segments.length - 1) {
        await this.delay(100);
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════
  // WEB SPEECH API INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get Web Speech API language code
   */
  getWebSpeechLanguage(languageCode: string): string {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    return lang?.webSpeechCode || 'en-US';
  }

  /**
   * Check if Web Speech API supports a language
   */
  isWebSpeechSupported(languageCode: string): boolean {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }
    return SUPPORTED_LANGUAGES.some(l => l.code === languageCode);
  }

  /**
   * Get available Web Speech API languages
   */
  getAvailableWebSpeechLanguages(): SupportedLanguage[] {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return [];
    }
    return SUPPORTED_LANGUAGES;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get language name from code
   */
  getLanguageName(code: string): string {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang?.name || code;
  }

  /**
   * Get language info
   */
  getLanguageInfo(code: string): SupportedLanguage | undefined {
    return SUPPORTED_LANGUAGES.find(l => l.code === code);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Format language for display
   */
  formatLanguageDisplay(code: string): string {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (!lang) return code;
    return `${lang.flag} ${lang.name}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

let serviceInstance: MultiLanguageService | null = null;

export function getMultiLanguageService(): MultiLanguageService {
  if (!serviceInstance) {
    serviceInstance = new MultiLanguageService();
  }
  return serviceInstance;
}

// ═══════════════════════════════════════════════════════════════
// REACT COMPONENT FOR LANGUAGE SELECTOR
// ═══════════════════════════════════════════════════════════════

export interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  showNativeName?: boolean;
  disabled?: boolean;
}

// Helper function to create language selector options
export function getLanguageSelectorOptions(showNativeName: boolean = false) {
  return SUPPORTED_LANGUAGES.map(lang => ({
    value: lang.code,
    label: showNativeName 
      ? `${lang.flag} ${lang.nativeName} (${lang.name})`
      : `${lang.flag} ${lang.name}`,
    flag: lang.flag
  }));
}
