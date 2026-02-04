/**
 * Serverless Function: /api/analyze
 * 
 * Handles debate analysis with RAG, LangChain.js, and Gemini API
 * Deploy to: Vercel, Netlify, or any Node.js serverless platform
 * 
 * Dependencies (add to package.json):
 * - @google/genai
 * - langchain
 * - @langchain/google-genai
 */

import { GoogleGenerativeAI } from '@google/genai';

// CORS helper for browser access
const setCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * Main handler for debate analysis
 * @param {Request} req - HTTP request with debate data
 * @param {Response} res - HTTP response
 */
export default async function handler(req, res) {
  setCORS(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const startTime = Date.now();
    
    // Extract request data
    const { 
      video, 
      videoMime = 'video/mp4',
      prompt, 
      ragUrls = [], 
      wsdcWeights = { content: 40, style: 40, strategy: 20 },
      calibration = {},
      participantA = { name: 'Participant A' },
      participantB = { name: 'Participant B' },
      mode = 'arena',
      supervisorPrompt = '',
      systemPrompt = ''
    } = req.body;

    // Validate WSDC weights sum to 100
    const totalWeight = wsdcWeights.content + wsdcWeights.style + wsdcWeights.strategy;
    if (totalWeight !== 100) {
      return res.status(400).json({
        success: false,
        error: `WSDC weights must sum to 100. Current total: ${totalWeight}`
      });
    }

    console.log('Analysis request:', {
      mode,
      ragUrls: ragUrls.length,
      wsdcWeights,
      calibration
    });

    // === RAG PIPELINE (Simple URL Fetching) ===
    let ragContext = '';
    if (ragUrls.length > 0) {
      console.log('Fetching RAG sources...');
      
      const ragPromises = ragUrls.map(async (url) => {
        try {
          const response = await fetch(url, { 
            headers: { 'User-Agent': 'AI-Arbiter/1.0' },
            timeout: 10000 
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
          console.error(`Failed to fetch ${url}:`, error.message);
          return { url, content: '', success: false, error: error.message };
        }
      });

      const ragResults = await Promise.all(ragPromises);
      const successfulResults = ragResults.filter(r => r.success);
      
      if (successfulResults.length > 0) {
        ragContext = successfulResults.map(r => 
          `SOURCE: ${r.url}\n${r.content}`
        ).join('\n\n---\n\n');
        
        console.log(`RAG context: ${successfulResults.length}/${ragUrls.length} sources fetched successfully`);
      }
    }

    // === BUILD ENHANCED PROMPT ===
    const enhancedSystemInstruction = `
${supervisorPrompt}

${systemPrompt}

Calibration Context: Region=${calibration.country || 'Global'}, Year=${calibration.year || '2026'}, Demography=${calibration.demography || 'Universal'}, Persona=${calibration.persona || 'Neutral Arbiter'}, Logic Style=${calibration.logicStyle || 'Common Sense'}
`;

    const fullPrompt = `
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
${mode === 'arena' ? `- Participant B: ${participantB.name} (${participantB.followers || '0'} followers, Level ${participantB.level || 1})` : ''}

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

    // === CALL GEMINI WITH STRUCTURED OUTPUT ===
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Build contents array
    const contents = [];
    
    // Add video if present
    if (video && videoMime) {
      const base64Data = video.split(',')[1] || video;
      contents.push({
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType: videoMime } },
          { text: fullPrompt }
        ]
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: fullPrompt }]
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    console.log('Calling Gemini API...');
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();
    
    console.log('Response length:', responseText.length);
    
    // Parse JSON response
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON response from LLM');
      }
    }

    // Validate required fields
    if (!jsonResponse.gamification || !jsonResponse.scores) {
      throw new Error('Invalid response structure: missing gamification or scores');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return structured result
    return res.status(200).json({
      success: true,
      data: jsonResponse,
      metadata: {
        processingTimeMs: processingTime,
        ragSourcesUsed: ragUrls.length,
        ragSourcesFetched: ragContext ? 'yes' : 'no',
        wsdcWeights,
        calibration,
        mode,
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-pro'
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
