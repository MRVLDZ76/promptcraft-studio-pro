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

  // Build calibration context with logic style guidance
  const logicStyleGuidance: Record<string, string> = {
    'Elite Peer Review': 'Apply rigorous academic peer review standards. Demand empirical evidence, proper citations, and methodological transparency. Flag unsupported claims.',
    'Common Sense': 'Use everyday reasoning standards accessible to general audiences. Accept reasonable assumptions but flag obvious logical leaps.',
    'Formal Logic': 'Apply strict formal logic rules. Evaluate syllogistic validity, truth tables, and propositional calculus. Penalize any invalid inference.',
    'Scientific Method': 'Demand hypothesis-evidence-conclusion structure. Check for falsifiability, reproducibility claims, and statistical validity.',
    'Legal Standard': 'Apply legal reasoning standards (preponderance of evidence, beyond reasonable doubt for strong claims). Evaluate precedent and analogical reasoning.',
    'Dialectical': 'Use thesis-antithesis-synthesis framework. Evaluate how well arguments engage with opposing viewpoints.',
  };

  const stakeholderGuidance: Record<string, string> = {
    'Expert-to-Expert': 'Assume technical audience. Allow jargon, expect domain expertise, penalize oversimplification.',
    'Expert-to-Public': 'Evaluate ability to translate complex ideas. Reward clarity, penalize unnecessary complexity.',
    'Public-to-Public': 'Apply accessible reasoning standards. Focus on common-sense validity over technical precision.',
    'Academic-to-Policy': 'Evaluate policy implications. Check evidence-to-recommendation logic and feasibility claims.',
  };

  const calibrationBlock = `
CALIBRATION PARAMETERS (APPLY THROUGHOUT ANALYSIS):
═══════════════════════════════════════════════════
• Region Context: ${calibration.country || 'Global'} (adjust cultural/regulatory references accordingly)
• Temporal Context: ${calibration.year || '2026'} (evaluate claims against this timeframe)
• Target Audience: ${calibration.demography || 'Universal'}
• Arbiter Persona: ${calibration.persona || 'Neutral Arbiter'}
• Logic Standard: ${calibration.logicStyle || 'Common Sense'}
  → ${logicStyleGuidance[calibration.logicStyle] || logicStyleGuidance['Common Sense']}
• Stakeholder Mode: ${calibration.stakeholderMode || 'Expert-to-Public'}
  → ${stakeholderGuidance[calibration.stakeholderMode] || stakeholderGuidance['Expert-to-Public']}
• Margin of Error: ${calibration.marginOfError || 10}% (tolerance for scoring edge cases)
═══════════════════════════════════════════════════
`;

  const enhancedSystemInstruction = `
${supervisorPrompt}

${systemPrompt}

${calibrationBlock}
`;

  return `
SYSTEM INSTRUCTION:
${enhancedSystemInstruction}

IDENTITY: You are "THE AI ARBITER". 
TONE: Analytical, surgical, neutral but firm. Use "Sherlock-style" deduction logic.
PERSONA: ${calibration.persona || 'Neutral Arbiter'}

${ragContext ? `RAG KNOWLEDGE CONTEXT:\n${ragContext}\n` : ''}

WSDC ADJUDICATION STANDARD (EDITABLE WEIGHTS):
CRITICAL: Scores MUST be calculated based on these EXACT weights:

CONTENT (${wsdcWeights.content}% Weight - MAX ${wsdcWeights.content} points):
- Logical quality of arguments and Toulmin structure validity
- Soundness of evidence cited and relevance to motion
- Internal consistency (penalize contradictions heavily)
- Fallacy count (each fallacy deducts ${Math.round(wsdcWeights.content / 10)} points per fallacy)

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

FALLACY DETECTION PROTOCOL:
You MUST identify and log ALL logical fallacies from these 12 categories:
1. AD_HOMINEM - Attacking the person instead of the argument
2. STRAWMAN - Misrepresenting opponent's position to attack a weaker version
3. SLIPPERY_SLOPE - Claiming one event will lead to extreme consequences without justification
4. FALSE_DILEMMA - Presenting only two options when more exist
5. APPEAL_TO_AUTHORITY - Using authority figure as evidence without valid expertise
6. HASTY_GENERALIZATION - Drawing broad conclusions from insufficient evidence
7. POST_HOC - Assuming causation from correlation (post hoc ergo propter hoc)
8. RED_HERRING - Introducing irrelevant information to distract from the issue
9. CIRCULAR_REASONING - Using the conclusion as a premise (begging the question)
10. APPEAL_TO_EMOTION - Manipulating emotions instead of using logic
11. BANDWAGON - Arguing something is true because many people believe it
12. NO_TRUE_SCOTSMAN - Dismissing counterexamples by redefining criteria

For each fallacy detected, you MUST specify:
- Exact timestamp (seconds)
- Speaker (A or B)
- Verbatim quote containing the fallacy
- Fallacy type from the 12 categories above
- Severity score (1-10, where 10 is most severe)
- Impact on argument validity (-1 to -10 points)

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
      "fallacy_type": "<one of 12 fallacy types or null>",
      "score_impact": <number positive for valid, negative for fallacy>
    }
  ],
  "fallacies": [
    {
      "id": "fal_001",
      "timestamp": <seconds>,
      "speaker": "A" | "B",
      "type": "AD_HOMINEM" | "STRAWMAN" | "SLIPPERY_SLOPE" | "FALSE_DILEMMA" | "APPEAL_TO_AUTHORITY" | "HASTY_GENERALIZATION" | "POST_HOC" | "RED_HERRING" | "CIRCULAR_REASONING" | "APPEAL_TO_EMOTION" | "BANDWAGON" | "NO_TRUE_SCOTSMAN",
      "quote": "<exact verbatim quote containing the fallacy>",
      "explanation": "<why this is a fallacy>",
      "severity": <1-10>,
      "score_deduction": <negative number>
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
    "summary": "<string - comprehensive analysis summary>",
    "key_fallacies": ["<list of most impactful fallacies>"],
    "fallacy_count": {
      "a": <number of fallacies by participant A>,
      "b": <number of fallacies by participant B>
    },
    "total_fallacy_deduction": {
      "a": <total points deducted from A>,
      "b": <total points deducted from B>
    },
    "strongest_argument": "<string - best argument made>",
    "weakest_argument": "<string - worst argument made>",
    "logic_quality": {
      "a": "SOUND" | "WEAK" | "FALLACIOUS",
      "b": "SOUND" | "WEAK" | "FALLACIOUS"
    }
  },
  "chain_of_thought": "<string - your reasoning process>"
}

VALIDATION RULES:
1. content.a and content.b must NOT exceed ${wsdcWeights.content} each
2. style.a and style.b must NOT exceed ${wsdcWeights.style} each
3. strategy.a and strategy.b must NOT exceed ${wsdcWeights.strategy} each
4. total.a = content.a + style.a + strategy.a (must equal sum)
5. total.b = content.b + style.b + strategy.b (must equal sum)
6. winner must be determined by comparing total.a vs total.b
7. gamification.points_a and points_b are 0-100 scale (different from WSDC scores)
8. fallacies array MUST contain ALL detected fallacies with full metadata
9. Each fallacy MUST have a severity score (1-10) and score_deduction (negative)
10. final_verdict.fallacy_count must match length of fallacies array per speaker

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
