// api/transcribe.js
// Transcription endpoint for audio/video files using Gemini Multimodal
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: { 
    bodyParser: { 
      sizeLimit: '50mb' 
    }
  },
  // Increase timeout for large files
  maxDuration: 60
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audio, video, mimeType, options = {} } = req.body;

    if (!audio && !video) {
      return res.status(400).json({ error: 'No audio or video data provided' });
    }

    if (!mimeType) {
      return res.status(400).json({ error: 'mimeType is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.0 Flash for multimodal (supports audio/video)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    const mediaType = video ? 'video' : 'audio';
    const mediaData = video || audio;

    // Build transcription prompt
    const prompt = buildTranscriptionPrompt(mediaType, options);

    console.log(`🎙️ Transcribing ${mediaType} (${mimeType})...`);

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: mediaData
        }
      }
    ]);

    const responseText = result.response.text();
    console.log('📝 Transcription response received');

    // Parse JSON from response
    const transcriptionResult = parseTranscriptionResponse(responseText);

    return res.status(200).json({
      success: true,
      ...transcriptionResult
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    
    // Handle specific Gemini errors
    if (error.message?.includes('SAFETY')) {
      return res.status(400).json({ 
        error: 'Content blocked by safety filters',
        details: error.message 
      });
    }
    
    if (error.message?.includes('quota')) {
      return res.status(429).json({ 
        error: 'API quota exceeded',
        details: error.message 
      });
    }

    return res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message 
    });
  }
}

/**
 * Build the transcription prompt based on options
 */
function buildTranscriptionPrompt(mediaType, options) {
  const {
    includeTimestamps = true,
    enableDiarization = true,
    language = 'auto',
    maxSpeakers = 2
  } = options;

  return `You are a professional transcription service. Transcribe this ${mediaType} content accurately.

TRANSCRIPTION REQUIREMENTS:
- Transcribe ALL spoken words verbatim
- ${includeTimestamps ? 'Include approximate timestamps for each segment (every 5-10 seconds of speech)' : 'Do not include timestamps'}
- ${enableDiarization ? `Identify different speakers (up to ${maxSpeakers} speakers). Label them as "A", "B", etc.` : 'Do not identify speakers'}
- ${language !== 'auto' ? `The content is in ${language}` : 'Detect the language automatically'}
- Preserve filler words (um, uh, like) for authenticity
- Note any non-speech sounds in [brackets] like [laughter], [applause], [music]

REQUIRED OUTPUT FORMAT (JSON):
Return ONLY valid JSON with this exact structure:

{
  "transcript": "The complete transcription as a single string with speaker labels if diarization enabled",
  "segments": [
    {
      "text": "What the speaker said in this segment",
      "start": 0.0,
      "end": 5.5,
      "speaker": "A"
    }
  ],
  "duration": 123.45,
  "language": "en",
  "confidence": 0.95,
  "speakers": ["A", "B"],
  "wordCount": 500,
  "metadata": {
    "hasMusic": false,
    "hasMultipleSpeakers": true,
    "audioQuality": "good"
  }
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks
- All string values must use double quotes
- Timestamps are in seconds (floating point)
- Confidence is 0.0 to 1.0
- If you cannot transcribe, return: {"error": "reason", "transcript": "", "segments": []}

Begin transcription:`;
}

/**
 * Parse the transcription response from Gemini
 */
function parseTranscriptionResponse(responseText) {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Try to find JSON object in the response
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      return {
        transcript: parsed.transcript || '',
        segments: Array.isArray(parsed.segments) ? parsed.segments : [],
        duration: typeof parsed.duration === 'number' ? parsed.duration : 0,
        language: parsed.language || 'unknown',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        speakers: Array.isArray(parsed.speakers) ? parsed.speakers : [],
        wordCount: parsed.wordCount || parsed.transcript?.split(/\s+/).length || 0,
        metadata: parsed.metadata || {}
      };
    } catch (parseError) {
      console.warn('JSON parse failed, using fallback:', parseError.message);
    }
  }

  // Fallback: treat entire response as transcript
  return {
    transcript: responseText,
    segments: [{
      text: responseText,
      start: 0,
      end: 0,
      speaker: 'A'
    }],
    duration: 0,
    language: 'unknown',
    confidence: 0.7,
    speakers: ['A'],
    wordCount: responseText.split(/\s+/).length,
    metadata: {
      fallbackMode: true
    }
  };
}
