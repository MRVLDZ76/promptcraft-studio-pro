/**
 * Supabase Edge Function: api-transcribe
 * 
 * Transcription endpoint for audio/video files using Gemini Multimodal
 * Converted from Vercel serverless to Deno/Supabase Edge Function format
 * 
 * Endpoint: POST /functions/v1/api-transcribe
 */

// @ts-ignore - Deno types are available in Supabase Edge Functions runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

// CORS headers for all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400',
};

// Helper to create JSON response
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

// Helper to create error response
const errorResponse = (message: string, status = 500, details?: string) => {
  return jsonResponse({
    success: false,
    error: message,
    details: details || undefined,
  }, status);
};

/**
 * Build the transcription prompt based on options
 */
function buildTranscriptionPrompt(mediaType: string, options: any): string {
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
function parseTranscriptionResponse(responseText: string): any {
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
      console.warn('JSON parse failed, using fallback');
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
    metadata: { fallbackMode: true }
  };
}

/**
 * Call Gemini API for transcription
 */
async function callGeminiForTranscription(
  prompt: string,
  mediaData: string,
  mimeType: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: mediaData,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!responseText) {
    throw new Error('No response text from Gemini API');
  }

  return responseText;
}

/**
 * Call Gemini API for YouTube URL transcription
 * Uses Gemini's ability to analyze YouTube videos directly
 */
async function callGeminiForYouTubeTranscription(
  youtubeUrl: string,
  options: any
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are a professional transcription service. Watch this YouTube video and transcribe ALL spoken content.

VIDEO URL: ${youtubeUrl}

TRANSCRIPTION REQUIREMENTS:
- Transcribe ALL spoken words verbatim from the video
- Include approximate timestamps for major sections
- Identify different speakers if multiple (label as "A", "B", etc.)
- Preserve filler words (um, uh, like) for authenticity
- Note any non-speech sounds in [brackets] like [laughter], [applause]

REQUIRED OUTPUT FORMAT (JSON):
Return ONLY valid JSON with this structure:
{
  "transcript": "The complete transcription as a single string",
  "segments": [
    {"text": "Speaker text here", "start": 0.0, "end": 10.0, "speaker": "A"}
  ],
  "title": "Video title if visible",
  "duration": 0,
  "language": "detected language code",
  "confidence": 0.9,
  "speakers": ["A", "B"],
  "wordCount": 500
}

Begin transcription:`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'text/plain',
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!responseText) {
    throw new Error('No response text from Gemini API');
  }

  return responseText;
}

// @ts-ignore - Deno.serve is available in Supabase Edge Functions runtime
Deno.serve(async (req: Request) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST.', 405);
  }

  try {
    const body = await req.json();
    const { audio, video, youtubeUrl, mimeType, options = {} } = body;

    // Handle YouTube URL transcription
    if (youtubeUrl) {
      console.log(`🎬 Transcribing YouTube video: ${youtubeUrl}`);
      
      if (!GEMINI_API_KEY) {
        return errorResponse('GEMINI_API_KEY not configured', 500);
      }

      const responseText = await callGeminiForYouTubeTranscription(youtubeUrl, options);
      console.log('📝 YouTube transcription response received');
      
      const transcriptionResult = parseTranscriptionResponse(responseText);
      
      return jsonResponse({
        success: true,
        source: 'youtube',
        ...transcriptionResult
      });
    }

    // Handle audio/video file transcription
    if (!audio && !video) {
      return errorResponse('No audio, video, or youtubeUrl provided', 400);
    }

    if (!mimeType) {
      return errorResponse('mimeType is required for file transcription', 400);
    }

    if (!GEMINI_API_KEY) {
      return errorResponse('GEMINI_API_KEY not configured', 500);
    }

    const mediaType = video ? 'video' : 'audio';
    const mediaData = video || audio;

    console.log(`🎙️ Transcribing ${mediaType} (${mimeType})...`);

    // Build prompt and call Gemini
    const prompt = buildTranscriptionPrompt(mediaType, options);
    const responseText = await callGeminiForTranscription(prompt, mediaData, mimeType);

    console.log('📝 Transcription response received');

    // Parse the response
    const transcriptionResult = parseTranscriptionResponse(responseText);

    return jsonResponse({
      success: true,
      source: 'file',
      ...transcriptionResult
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);

    // Handle specific errors
    if (error.message?.includes('SAFETY')) {
      return errorResponse('Content blocked by safety filters', 400, error.message);
    }
    
    if (error.message?.includes('quota')) {
      return errorResponse('API quota exceeded', 429, error.message);
    }

    return errorResponse(
      'Transcription failed',
      500,
      error.message || String(error)
    );
  }
});
