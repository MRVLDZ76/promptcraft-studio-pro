/**
 * Supabase Edge Function: api-analyze
 * 
 * Handles debate analysis with RAG and Gemini API
 * Converted from Vercel serverless to Deno/Supabase Edge Function format
 * 
 * Endpoint: POST /functions/v1/api-analyze
 */

// @ts-ignore - Deno types are available in Supabase Edge Functions runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

// CORS headers for all origins including localhost and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Max-Age': '86400', // 24 hours cache for preflight
};

// Helper to create JSON response with CORS
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
    timestamp: new Date().toISOString(),
  }, status);
};

/**
 * Fetch and clean RAG sources
 */
async function fetchRagSources(urls: string[]): Promise<{ url: string; content: string; success: boolean }[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'AI-Arbiter/1.0' },
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        // Extract text content (basic HTML stripping)
        const cleanText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to 5000 chars per source

        return { url, content: cleanText, success: true };
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return { url, content: '', success: false };
      }
    })
  );

  return results;
}

/**
 * Build the analysis prompt with WSDC scoring matrix
 */
function buildAnalysisPrompt(config: {
  prompt: string;
  ragContext: string;
  wsdcWeights: { content: number; style: number; strategy: number };
  calibration: any;
  participantA: { name: string; followers?: string; level?: number };
  participantB?: { name: string; followers?: string; level?: number };
  mode: string;
  supervisorPrompt?: string;
  systemPrompt?: string;
}): string {
  const {
    prompt,
    ragContext,
    wsdcWeights,
    calibration,
    participantA,
    participantB,
    mode,
    supervisorPrompt = '',
    systemPrompt = '',
  } = config;

  const enhancedSystemInstruction = `
${supervisorPrompt}

${systemPrompt}

Calibration Context: Region=${calibration.country || 'Global'}, Year=${calibration.year || '2026'}, Demography=${calibration.demography || 'Universal'}, Persona=${calibration.persona || 'Neutral Arbiter'}, Logic Style=${calibration.logicStyle || 'Common Sense'}
`;

  return `
SYSTEM INSTRUCTION:
${enhancedSystemInstruction}

IDENTITY: You are "THE AI ARBITER". 
TONE: Analytical, surgical, neutral but firm. Use "Sherlock-style" deduction logic.

${ragContext ? `RAG KNOWLEDGE CONTEXT:\n${ragContext}\n` : ''}

WSDC ADJUDICATION STANDARD (EDITABLE WEIGHTS):
CRITICAL: Scores MUST be calculated based on these EXACT weights:

CONTENT (${wsdcWeights.content}% Weight - MAX ${wsdcWeights.content} points):
- Logical quality of arguments and Toulmin structure validity
- Soundness of evidence cited and relevance to motion
- Internal consistency (penalize contradictions heavily)
- Fallacy count (each fallacy deducts points)

STYLE (${wsdcWeights.style}% Weight - MAX ${wsdcWeights.style} points):
- Rhetorical effectiveness and persuasion techniques
- Clarity and accessibility of language
- Tone, pacing, and delivery (from transcript analysis)
- Audience engagement and narrative structure

STRATEGY (${wsdcWeights.strategy}% Weight - MAX ${wsdcWeights.strategy} points):
- Case structure and time management
- Effectiveness of refutations (attacking strongest points vs. strawmen)
- Response to opponent's core arguments
- Defensive vs. offensive balance

PARTICIPANTS:
- Participant A: ${participantA.name} (${participantA.followers || '0'} followers, Level ${participantA.level || 1})
${mode === 'arena' && participantB ? `- Participant B: ${participantB.name} (${participantB.followers || '0'} followers, Level ${participantB.level || 1})` : ''}

MODE: ${mode === 'arena' ? 'ARENA DEBATE (1v1)' : 'SOLO AUDIT (Monologue)'}

USER ANALYSIS REQUEST:
${prompt}

CRITICAL OUTPUT REQUIREMENTS:
You MUST respond with VALID JSON ONLY. No markdown, no code blocks, no explanations outside JSON.

Required JSON Structure:
{
  "gamification": {
    "winner": "A" | "B" | "TIE",
    "points_a": <number 0-100>,
    "points_b": <number 0-100>,
    "truth_pot": "<string like $5000>",
    "followers_a": "<string like +1500>",
    "followers_b": "<string like +800>",
    "award": "<string like Master of Warrants>"
  },
  "scores": {
    "content": {
      "a": <number 0-${wsdcWeights.content}>,
      "b": <number 0-${wsdcWeights.content}>
    },
    "style": {
      "a": <number 0-${wsdcWeights.style}>,
      "b": <number 0-${wsdcWeights.style}>
    },
    "strategy": {
      "a": <number 0-${wsdcWeights.strategy}>,
      "b": <number 0-${wsdcWeights.strategy}>
    },
    "total": {
      "a": <sum of above>,
      "b": <sum of above>
    }
  },
  "argument_nodes": [
    {
      "id": "arg_001",
      "timestamp_in": 0.0,
      "timestamp_out": 15.5,
      "speaker_id": "A" | "B",
      "claim_text_short": "<max 7 words>",
      "claim_text_full": "<complete argument>",
      "toulmin_component": "CLAIM" | "GROUNDS" | "WARRANT" | "BACKING" | "QUALIFIER" | "REBUTTAL",
      "logic_status": "VALID" | "FALLACY" | "WEAK_EVIDENCE" | "CONTRADICTION",
      "fallacy_type": "Ad Hominem" | "Strawman" | null,
      "score_impact": <number>
    }
  ],
  "temporal_scores": [
    {
      "timestamp": <seconds>,
      "participant_a_score": <number>,
      "participant_b_score": <number>,
      "momentum": "GAINING" | "LOSING" | "STABLE"
    }
  ],
  "final_verdict": {
    "summary": "<string>",
    "key_fallacies": ["<string>"],
    "strongest_argument": "<string>",
    "weakest_argument": "<string>"
  },
  "chain_of_thought": "<string - your reasoning process>"
}

VALIDATION RULES:
1. content.a + content.b must NOT exceed ${wsdcWeights.content} each
2. style.a + style.b must NOT exceed ${wsdcWeights.style} each
3. strategy.a + strategy.b must NOT exceed ${wsdcWeights.strategy} each
4. total.a = content.a + style.a + strategy.a (must equal sum)
5. total.b = content.b + style.b + strategy.b (must equal sum)
6. winner must be determined by comparing total.a vs total.b
7. gamification.points_a and points_b are 0-100 scale (different from WSDC scores)

Begin your analysis now. Output ONLY valid JSON.
`;
}

/**
 * Call Gemini API for analysis
 */
async function callGeminiAPI(
  prompt: string,
  video?: { data: string; mimeType: string }
): Promise<any> {
  // Use gemini-2.0-flash (stable and available model)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Build request body
  const parts: any[] = [];

  // Add video if present
  if (video?.data && video?.mimeType) {
    const base64Data = video.data.includes(',') ? video.data.split(',')[1] : video.data;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: video.mimeType,
      },
    });
  }

  // Add text prompt
  parts.push({ text: prompt });

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Extract text from response
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('No response text from Gemini API');
  }

  // Parse JSON response
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    // Try to extract JSON if wrapped in markdown
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Failed to parse JSON response from LLM');
  }
}

// @ts-ignore - Deno.serve is available in Supabase Edge Functions runtime
Deno.serve(async (req: Request) => {
  // Handle preflight OPTIONS request - CRITICAL for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders, 
      status: 200 
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST.', 405);
  }

  try {
    const startTime = Date.now();

    // Parse request body
    const body = await req.json();
    const {
      video,
      videoMime = 'video/mp4',
      prompt = 'Evaluate the primary arguments and identify any logical fallacies.',
      ragUrls = [],
      wsdcWeights = { content: 40, style: 40, strategy: 20 },
      calibration = {},
      participantA = { name: 'Participant A' },
      participantB = { name: 'Participant B' },
      mode = 'arena',
      supervisorPrompt = '',
      systemPrompt = '',
      transcript = '',
    } = body;

    // Validate WSDC weights sum to 100
    const totalWeight = wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy;
    if (totalWeight !== 100) {
      return errorResponse(
        `WSDC weights must sum to 100. Current total: ${totalWeight}`,
        400
      );
    }

    console.log('Analysis request:', {
      mode,
      ragUrlsCount: ragUrls.length,
      wsdcWeights,
      hasVideo: !!video,
      hasTranscript: !!transcript,
    });

    // === RAG PIPELINE ===
    let ragContext = '';
    if (ragUrls.length > 0) {
      console.log('Fetching RAG sources...');
      const ragResults = await fetchRagSources(ragUrls);
      const successfulResults = ragResults.filter((r) => r.success);

      if (successfulResults.length > 0) {
        ragContext = successfulResults
          .map((r) => `SOURCE: ${r.url}\n${r.content}`)
          .join('\n\n---\n\n');

        console.log(
          `RAG context: ${successfulResults.length}/${ragUrls.length} sources fetched`
        );
      }
    }

    // Build prompt with transcript if provided
    let enhancedPrompt = prompt;
    if (transcript) {
      enhancedPrompt = `${prompt}\n\nTRANSCRIPT:\n${transcript}`;
    }

    // Build full analysis prompt
    const fullPrompt = buildAnalysisPrompt({
      prompt: enhancedPrompt,
      ragContext,
      wsdcWeights,
      calibration,
      participantA,
      participantB,
      mode,
      supervisorPrompt,
      systemPrompt,
    });

    // Call Gemini API
    console.log('Calling Gemini API...');
    const videoData = video ? { data: video, mimeType: videoMime } : undefined;
    const jsonResponse_data = await callGeminiAPI(fullPrompt, videoData);

    // Validate required fields
    if (!jsonResponse_data.gamification || !jsonResponse_data.scores) {
      throw new Error('Invalid response structure: missing gamification or scores');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return structured result
    return jsonResponse({
      success: true,
      data: jsonResponse_data,
      metadata: {
        processingTimeMs: processingTime,
        ragSourcesUsed: ragUrls.length,
        ragSourcesFetched: ragContext ? 'yes' : 'no',
        wsdcWeights,
        calibration,
        mode,
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro',
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return errorResponse(
      error.message || 'Unknown error occurred',
      500,
      String(error)
    );
  }
});
