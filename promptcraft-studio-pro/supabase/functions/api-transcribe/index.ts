/**
 * Supabase Edge Function: api-transcribe
 * 
 * Transcription endpoint for audio/video files using multiple services:
 * 
 * YOUTUBE TRANSCRIPTION HIERARCHY:
 * 1. TranscriptAPI (Primary) - Fast, reliable, specialized YouTube transcript service
 *    - Endpoint: https://transcriptapi.com/api/v2/youtube/transcript
 *    - Provides accurate timestamped segments from YouTube's native transcripts
 *    - Fallback only on errors: 404 (no transcript), 429 (rate limit), 500 (server error)
 * 
 * 2. Gemini Multimodal (Fallback) - AI-powered video analysis
 *    - Used when TranscriptAPI fails or transcript unavailable
 *    - Can transcribe video content directly
 * 
 * AUDIO/VIDEO FILE TRANSCRIPTION:
 * - Gemini Multimodal - Processes uploaded audio/video files
 * 
 * Converted from Vercel serverless to Deno/Supabase Edge Function format
 * 
 * Endpoint: POST /functions/v1/api-transcribe
 * 
 * Request Body:
 * {
 *   youtubeUrl?: string,  // YouTube URL or video ID
 *   audio?: string,       // Base64 encoded audio
 *   video?: string,       // Base64 encoded video
 *   mimeType?: string,    // Required for audio/video files
 *   options?: {
 *     includeTimestamps?: boolean,
 *     enableDiarization?: boolean,
 *     language?: string,
 *     maxSpeakers?: number
 *   }
 * }
 */

// @ts-ignore - Deno types are available in Supabase Edge Functions runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const TRANSCRIPT_API_KEY = 'sk_jTWTUT6575TVwybz0JgeH5MV4QwNo5flcilvL-52nhw';

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
 * Extract YouTube video ID from URL or return as-is if already an ID
 */
function extractYoutubeVideoId(urlOrId: string): string {
  // If it's already just an ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  
  // Return original if no pattern matched (might be a valid ID)
  return urlOrId;
}

/**
 * Call TranscriptAPI.com for YouTube transcription (Primary fallback service)
 * This is a specialized, reliable service for YouTube transcripts
 */
async function callTranscriptAPI(videoUrlOrId: string): Promise<any> {
  const url = 'https://transcriptapi.com/api/v2/youtube/transcript';
  const params = new URLSearchParams({
    video_url: videoUrlOrId,
    format: 'json'
  });

  console.log(`🔄 Calling TranscriptAPI for video: ${extractYoutubeVideoId(videoUrlOrId)}`);

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TRANSCRIPT_API_KEY}`
    },
    signal: AbortSignal.timeout(30000) // 30 second timeout
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorDetail = errorBody;
    
    try {
      const errorJson = JSON.parse(errorBody);
      errorDetail = errorJson.detail || errorBody;
    } catch {
      // Keep errorBody as is
    }

    // Return structured error info
    throw {
      status: response.status,
      detail: errorDetail,
      isTranscriptAPIError: true
    };
  }

  const data = await response.json();
  console.log(`✅ TranscriptAPI success: ${data.transcript?.length || 0} segments`);
  
  // Convert TranscriptAPI format to our standard format
  return convertTranscriptAPIResponse(data);
}

/**
 * Convert TranscriptAPI response to our standard format
 */
function convertTranscriptAPIResponse(apiResponse: any): any {
  const segments = apiResponse.transcript || [];
  
  // Build full transcript text
  const transcriptText = segments.map((seg: any) => seg.text).join(' ');
  
  // Convert segments to our format (add 'end' timestamp)
  const convertedSegments = segments.map((seg: any, idx: number) => ({
    text: seg.text,
    start: seg.start,
    end: seg.start + seg.duration,
    speaker: 'A' // TranscriptAPI doesn't provide speaker diarization
  }));

  const totalDuration = segments.length > 0 
    ? segments[segments.length - 1].start + segments[segments.length - 1].duration 
    : 0;

  return {
    transcript: transcriptText,
    segments: convertedSegments,
    duration: totalDuration,
    language: apiResponse.language || 'unknown',
    confidence: 0.95, // TranscriptAPI is highly reliable
    speakers: ['A'],
    wordCount: transcriptText.split(/\s+/).filter(Boolean).length,
    metadata: {
      title: apiResponse.metadata?.title || '',
      source: 'TranscriptAPI',
      videoId: apiResponse.video_id || ''
    }
  };
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
      
      // Try TranscriptAPI first (faster, more reliable, specialized for YouTube)
      try {
        const transcriptionResult = await callTranscriptAPI(youtubeUrl);
        
        return jsonResponse({
          success: true,
          source: 'TranscriptAPI',
          ...transcriptionResult
        });
      } catch (error: any) {
        // Log TranscriptAPI failure
        if (error.isTranscriptAPIError) {
          console.warn(`⚠️ TranscriptAPI failed (${error.status}): ${error.detail}`);
          
          // Don't fallback to Gemini for certain errors
          if (error.status === 401) {
            return errorResponse('TranscriptAPI: Invalid or missing API key', 500);
          }
          if (error.status === 402) {
            return errorResponse('TranscriptAPI: Payment required or credits exhausted', 500);
          }
          if (error.status === 422) {
            return errorResponse('Invalid YouTube video URL', 400, error.detail);
          }
          
          // For 404 (transcript unavailable) or other errors, fallback to Gemini
          console.log('🔄 Falling back to Gemini for YouTube transcription...');
        } else {
          console.warn(`⚠️ TranscriptAPI error: ${error.message || error}`);
        }
      }
      
      // Fallback to Gemini if TranscriptAPI fails or is unavailable
      if (!GEMINI_API_KEY) {
        return errorResponse('Both TranscriptAPI and Gemini failed. No transcription service available.', 500);
      }

      try {
        const responseText = await callGeminiForYouTubeTranscription(youtubeUrl, options);
        console.log('📝 YouTube transcription response received from Gemini');
        
        const transcriptionResult = parseTranscriptionResponse(responseText);
        
        return jsonResponse({
          success: true,
          source: 'Gemini (fallback)',
          ...transcriptionResult
        });
      } catch (geminiError: any) {
        console.error('❌ Gemini fallback also failed:', geminiError);
        return errorResponse(
          'YouTube transcription failed on both services',
          500,
          geminiError.message || String(geminiError)
        );
      }
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
