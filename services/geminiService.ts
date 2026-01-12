import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PromptState, SequenceSegment, AnalysisMode, Participant } from '../types';

// DEPLOYMENT MODE: Toggle between client-side (dev) and server-side (prod)
const USE_API_ENDPOINT = import.meta.env.VITE_USE_API_ENDPOINT === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://promptcraft-studio-pro.vercel.app';

export const analyzeVideoContent = async (
  base64Video: string | null, 
  mimeType: string, 
  userPrompt: string,
  config: {
    mode: AnalysisMode,
    participantA: Participant,
    participantB?: Participant,
    systemInstruction?: string,
    wsdcWeights: { content: number, style: number, strategy: number },
    domain?: string,
    contextFiles?: string[],
    youtubeUrl?: string,
    transcript?: string,
    ragUrls?: string[],
    supervisorPrompt?: string,
    calibration: {
      country?: string,
      year?: string,
      demography?: string,
      persona?: string,
      intent?: string,
      logicStyle?: string,
      stakeholderMode?: string,
      marginOfError?: number
    }
  }
): Promise<string> => {
  
  // === PRODUCTION MODE: Use Backend API ===
  if (USE_API_ENDPOINT) {
    console.log('🚀 Using production API endpoint:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video: base64Video,
          videoMime: mimeType,
          transcript: config.transcript,
          prompt: userPrompt,
          ragUrls: config.ragUrls || [],
          wsdcWeights: config.wsdcWeights,
          calibration: config.calibration,
          participantA: config.participantA,
          participantB: config.participantB,
          mode: config.mode,
          supervisorPrompt: config.supervisorPrompt || '',
          systemPrompt: config.systemInstruction || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Return formatted JSON string for parsing
      return JSON.stringify(result.data, null, 2);
      
    } catch (error: any) {
      console.error('❌ API endpoint error:', error);
      throw new Error(`Backend analysis failed: ${error.message}`);
    }
  }
  
  // === DEVELOPMENT MODE: Direct Gemini API (Client-Side) ===
  console.log('🔧 Using development mode (client-side Gemini API)');
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // THE COGNITIVE MOTOR: TOULMIN MODEL & ARGUMENTATIVE DECONSTRUCTION
  const toulminInstructions = `
    DECONSTRUCTION PROTOCOL: Execute analysis via the Toulmin Argumentation Model:
    - CLAIM: Identify the central thesis or conclusion.
    - GROUNDS: Audit the factual data or evidence supporting the claim.
    - WARRANT: Evaluate the logical bridge connecting grounds to claim.
    - BACKING: Verify the authority or theoretical support for the warrant.
    - MODAL QUALIFIER: Assess the degree of certainty/force (e.g., 'always' vs 'presumably').
    - REBUTTAL: Identify counter-arguments or conditions of exception.
    
    COUNTERARGUMENT AUGMENTATION (Critical for Fallacy Detection):
    Before classifying any argument, generate THREE possible valid counterarguments.
    If the original argument cannot withstand these counterarguments due to structural defects, 
    identify the specific fallacy.
  `;

  const fallacyTaxonomy = `
    FALLACY TAXONOMY (Comprehensive Detection Matrix):
    - Ad Hominem: Attacking the person instead of the argument
    - Strawman: Misrepresenting opponent's position to attack it easier
    - Slippery Slope: Claiming one event will lead to extreme consequences without evidence
    - False Dilemma: Presenting only two options when more exist
    - Appeal to Authority: Using authority as evidence without logical backing
    - Hasty Generalization: Drawing broad conclusions from insufficient data
    - Post Hoc: Assuming causation from correlation
    - Red Herring: Introducing irrelevant information to distract
    - Circular Reasoning: Using conclusion as premise
    - Appeal to Emotion: Manipulating emotions instead of using logic
    - Bandwagon: Arguing something is true because many believe it
    - No True Scotsman: Dismissing counterexamples by redefining terms
  `;

  const modeContext = config.mode === AnalysisMode.MONOLOGUE 
    ? `ANALYSIS PROTOCOL: SOLO AUDIT (The Crystal Box).
       Subject: ${config.participantA.name} [Authority Level: ${config.participantA.level}].
       Objective: Measure subject claims against the "GLOBAL FACTUAL MATRIX" (Truth Matrix).
       Result: If Truth Density > Subject Reliability, declare Factual Bankruptcy.`
    : `ANALYSIS PROTOCOL: ARENA DEBATE (1v1).
       Contest: Participant A vs Participant B.
       Objective: Determine who controls the "Mind Palace" of logic and evidence.`;

  const arbiterIdentity = `
    IDENTITY: You are "THE AI ARBITER". 
    TONE: Analytical, surgical, neutral but firm. Use "Sherlock-style" deduction logic.
    CALIBRATION TARGETS:
    - REGION: ${config.calibration.country}
    - TEMPORAL FRAME: ${config.calibration.year}
    - DEMOGRAPHY: ${config.calibration.demography}
    - JUDGE PERSONA: ${config.calibration.persona}
    - RIGOUR: ${config.calibration.logicStyle}
  `;

  const scoringRubric = `
    WSDC ADJUDICATION STANDARD (World Schools Debating Championship Rubric):
    EDITABLE WEIGHTS - Current Configuration:
    
    CONTENT (${config.wsdcWeights.content}% Weight):
    - Logical quality of arguments and Toulmin structure validity
    - Soundness of evidence cited and relevance to motion
    - Internal consistency (penalize contradictions heavily)
    - Fallacy count (each fallacy deducts points)
    
    STYLE (${config.wsdcWeights.style}% Weight):
    - Rhetorical effectiveness and persuasion techniques
    - Clarity and accessibility of language
    - Tone, pacing, and delivery (from transcript analysis)
    - Audience engagement and narrative structure
    
    STRATEGY (${config.wsdcWeights.strategy}% Weight):
    - Case structure and time management
    - Effectiveness of refutations (attacking strongest points vs. strawmen)
    - Response to opponent's core arguments
    - Defensive vs. offensive balance
    
    CRITICAL: Scores must be calculated based on these exact weights.
    Content max = ${config.wsdcWeights.content}, Style max = ${config.wsdcWeights.style}, Strategy max = ${config.wsdcWeights.strategy}
    Total max = 100 points
    
    Margin of Error: ±${config.calibration.marginOfError}%
  `;

  const jsonSchemaRequest = `
    CRITICAL: Output must include a structured JSON section for graph visualization:
    
    JSON_OUTPUT_START
    {
      "debate_title": "string",
      "total_duration": number_in_seconds,
      "argument_nodes": [
        {
          "id": "arg_001",
          "timestamp_in": 0.0,
          "timestamp_out": 15.5,
          "speaker_id": "A" or "B",
          "claim_text_short": "max 7 words",
          "claim_text_full": "complete argument",
          "toulmin_component": "CLAIM" | "GROUNDS" | "WARRANT" | "BACKING" | "QUALIFIER" | "REBUTTAL",
          "logic_status": "VALID" | "FALLACY" | "WEAK_EVIDENCE" | "CONTRADICTION",
          "fallacy_type": "Ad Hominem" | "Strawman" | null,
          "score_impact": -5 to +10,
          "confidence": 0.0 to 1.0
        }
      ],
      "temporal_scores": [
        {"timestamp": 60, "participant_a_score": 75, "participant_b_score": 68}
      ],
      "final_verdict": {
        "winner": "A" | "B" | "TIE",
        "scores": {
          "content": {"a": 38, "b": 35},
          "style": {"a": 36, "b": 39},
          "strategy": {"a": 18, "b": 16},
          "total": {"a": 92, "b": 90}
        },
        "key_fallacies": ["Speaker A: Strawman at 2:15"],
        "strongest_argument": "description",
        "weakest_argument": "description"
      }
    }
    JSON_OUTPUT_END
  `;

  const finalPrompt = `
    ${arbiterIdentity}
    ${modeContext}
    ${toulminInstructions}
    ${fallacyTaxonomy}
    ${scoringRubric}
    ${jsonSchemaRequest}
    
    RAG BINDING: [Files: ${config.contextFiles?.join(', ') || 'None'}, Verified URLs: ${config.ragUrls?.join(', ') || 'None'}]
    
    TASK: Execute Adjudication with Chain of Thought (CoT) Transparency.
    Show your reasoning process as you analyze each claim.
    
    GAMIFICATION DATA (REQUIRED FIRST LINES):
    POINTS_A: [0-100]
    POINTS_B: [0-100]
    TRUTH_POT: $[0-10000]
    FOLLOWERS_A: +[Number]
    FOLLOWERS_B: +[Number]
    AWARD: [Title like "Master of Warrants" or "Fallacy Destroyer"]
    
    DETAILED OUTPUT:
    1. CHAIN OF THOUGHT (Show your deductive reasoning)
    2. ARBITER VERDICT (Final judgment based on calibration)
    3. TOULMIN MATRIX (Claim-by-claim breakdown with timestamps)
    4. FALLACY DETECTION (Comprehensive taxonomy with examples)
    5. CONTENT/STYLE/STRATEGY BREAKDOWN (40/40/20 scoring)
    6. TEMPORAL EVOLUTION (Minute-by-minute score progression)
    7. COUNTERARGUMENTS ANALYSIS
    8. JSON_OUTPUT (For visualization - required)
    
    USER QUERY: ${userPrompt}
  `;

  const contents: any = { parts: [] };
  
  // Use transcript if available (much cheaper than video processing)
  if (config.transcript) {
    const transcriptContext = `
      VIDEO TRANSCRIPT (YouTube Auto-Generated):
      ${config.transcript}
      
      Note: This is the full transcript of the video. Analyze the arguments based on the text content.
    `;
    contents.parts.push({ text: transcriptContext });
  } else if (base64Video) {
    // Fallback to video if no transcript
    contents.parts.push({ inlineData: { data: base64Video, mimeType: mimeType } });
  }
  
  contents.parts.push({ text: finalPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: contents,
    config: {
      systemInstruction: "You are 'The AI Arbiter'. You perform high-rigour logical analysis using the Toulmin model. You are immune to rhetoric and focused solely on factual density and structural validity.",
    }
  });

  return response.text?.trim() || "Simulation failure: No logic processed.";
};

export const polishPrompt = async (state: PromptState, currentPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Improve this prompt for visual quality: ${currentPrompt}`,
  });
  return response.text?.trim() || currentPrompt;
};

export const generateSequence = async (n: string, t: number, c: number, s: string = '', m: string = ''): Promise<SequenceSegment[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Plan ${Math.ceil(t/c)} clips for: ${n}`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{"segments": []}').segments;
};

export const editImageWithGemini = async (i: string, p: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data: i.split(',')[1], mimeType: 'image/png' } }, { text: p }] },
  });
  return `data:image/png;base64,${response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data}`;
};

export const generateImagePro = async (p: string, s: '1K' | '2K' | '4K', a: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: p }] },
    config: { imageConfig: { aspectRatio: a as any, imageSize: s } }
  });
  return `data:image/png;base64,${response.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data}`;
};

export const generateVideoVeo = async (p: string, i?: string, a: string = '16:9', r: '720p' | '1080p' = '720p'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let op = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: p,
    ...(i ? { image: { imageBytes: i.split(',')[1], mimeType: 'image/png' } } : {}),
    config: { numberOfVideos: 1, resolution: r, aspectRatio: a as any }
  });
  while (!op.done) {
    await new Promise(r => setTimeout(r, 10000));
    op = await ai.operations.getVideosOperation({ operation: op });
  }
  const link = op.response?.generatedVideos?.[0]?.video?.uri;
  const res = await fetch(`${link}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const generateSpeech = async (t: string, v: string = 'Zephyr'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: t }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v } } } },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const transcribeAudio = async (b: string, m: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { data: b, mimeType: m } }, { text: "Transcribe exactly." }] },
  });
  return res.text?.trim() || "";
};
