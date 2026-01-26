// LangChain Service Wrapper
// Provides structured LLM chains for debate analysis with RAG integration

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { searchWeb, findAuthoritativeSources } from "./tavilyService.ts";
import { searchSimilarDocuments, searchSimilarAnalyses } from "./vectorStoreService";
import { chunkDocument } from "./chunkingService";

// Configuration
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
// Use a model compatible with v1beta generateContent to avoid 404
const MODEL_NAME = "gemini-2.0-flash";
const TEMPERATURE = 0.7;
const MAX_OUTPUT_TOKENS = 8192;

/**
 * Initialize the Gemini LLM with LangChain
 * @returns Configured ChatGoogleGenerativeAI instance
 */
export function initLLM(): ChatGoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not found");
  }

  return new ChatGoogleGenerativeAI({
    model: MODEL_NAME,
    apiKey: GEMINI_API_KEY,
    temperature: TEMPERATURE,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
}

/**
 * Create a debate analysis chain with RAG
 * @param enableRAG - Whether to enable RAG retrieval
 * @returns Configured analysis chain
 */
export function createAnalysisChain(enableRAG: boolean = true) {
  const llm = initLLM();

  const promptTemplate = PromptTemplate.fromTemplate(`
You are THE AI ARBITER - an advanced debate analysis system.

{ragContext}

TRANSCRIPT TO ANALYZE:
{transcript}

SUPERVISOR INTELLIGENCE DIRECTIVE:
{supervisorPrompt}

CALIBRATION SETTINGS:
{calibration}

Analyze this argument using:
1. Toulmin Model (CLAIM, GROUNDS, WARRANT, BACKING, QUALIFIER, REBUTTAL)
2. WSDC Scoring Rubric
3. Fallacy Detection (12 types)
4. Temporal Evolution Analysis

{schema}

Output valid JSON only.
`);

  return RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);
}

/**
 * Perform RAG-enhanced analysis of video content
 * @param params - Analysis parameters
 * @returns Structured analysis result
 */
export async function analyzeWithRAG(params: AnalysisParams): Promise<any> {
  try {
    const {
      transcript,
      supervisorPrompt,
      calibration,
      schema,
      autoSearch = true,
      ragUrls = [],
    } = params;

    // Step 1: Extract claims for RAG
    const claims = await extractClaims(transcript);

    // Step 2: Build RAG context
    let ragContext = "";
    let searchResults: any[] = [];

    if (autoSearch && claims.length > 0) {
      // Auto-search for claims using Tavily
      console.log(`Auto-searching for ${claims.length} claims...`);
      const searchResults = await searchWeb(claims.join(" OR "), 5);
      
      ragContext += "\n## AUTOMATED FACT-CHECK SOURCES:\n";
      for (const result of searchResults) {
        ragContext += `\n### ${result.title}\n`;
        ragContext += `URL: ${result.url}\n`;
        ragContext += `${result.content.substring(0, 500)}...\n`;
      }
    }

    // Include manual URLs if provided
    if (ragUrls.length > 0) {
      ragContext += "\n## ADDITIONAL SOURCES:\n";
      for (const url of ragUrls) {
        ragContext += `- ${url}\n`;
      }
    }

    // Step 3: Search for similar past analyses
    const similarAnalyses = await searchSimilarAnalyses(transcript, 3);
    if (similarAnalyses.length > 0) {
      ragContext += "\n## SIMILAR PAST ANALYSES:\n";
      for (const analysis of similarAnalyses) {
        ragContext += `- Creator: ${analysis.creatorName}, Score: ${analysis.scores?.overall || "N/A"}, Fallacies: ${analysis.fallacyCount}\n`;
      }
    }

    // Step 4: Execute analysis chain
    const chain = createAnalysisChain(true);

    const result = await chain.invoke({
      transcript,
      supervisorPrompt,
      calibration: JSON.stringify(calibration),
      schema,
      ragContext: ragContext || "No external sources available.",
    });

    // Parse JSON response
    const parsed = JSON.parse(result);

    return {
      ...parsed,
      ragMetadata: {
        claimsExtracted: claims.length,
        sourcesUsed: searchResults?.length || 0,
        similarAnalyses: similarAnalyses.length,
        autoSearchEnabled: autoSearch,
      },
    };
  } catch (error) {
    console.error("RAG analysis error:", error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Extract key claims from argument text
 * Uses LLM to identify verifiable claims
 * @param text - Argument text
 * @returns Array of claim strings
 */
export async function extractClaims(text: string): Promise<string[]> {
  try {
    const llm = initLLM();

    const prompt = PromptTemplate.fromTemplate(`
Extract 3-5 key factual claims from this argument that can be fact-checked.
Return ONLY a JSON array of claim strings, nothing else.

ARGUMENT:
{text}

OUTPUT FORMAT: ["claim 1", "claim 2", "claim 3"]
`);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ text });

    // Strip markdown code blocks if present (```json ... ```)
    let cleanResult = result.trim();
    if (cleanResult.startsWith('```')) {
      cleanResult = cleanResult.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Parse JSON array
    const claims = JSON.parse(cleanResult);
    return Array.isArray(claims) ? claims : [];
  } catch (error) {
    console.error("Claim extraction error:", error);
    return []; // Return empty array on error
  }
}

/**
 * Generate counterarguments using RAG
 * @param argument - Original argument text
 * @returns Array of counterarguments with sources
 */
export async function generateCounterarguments(
  argument: string
): Promise<Counterargument[]> {
  try {
    // Search for opposing viewpoints
    const searchResults = await searchWeb(`arguments against ${argument}`, 5);

    const llm = initLLM();
    const prompt = PromptTemplate.fromTemplate(`
Based on these sources, generate 3 strong counterarguments to the following position:

POSITION: {argument}

SOURCES:
{sources}

Return JSON array: [{{ "counterargument": "text", "source": "url" }}]
`);

    const sourcesText = searchResults
      .map((r) => `${r.title}: ${r.content}`)
      .join("\n\n");

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      argument,
      sources: sourcesText,
    });

    return JSON.parse(result);
  } catch (error) {
    console.error("Counterargument generation error:", error);
    return [];
  }
}

/**
 * Fact-check a specific claim
 * @param claim - Claim to verify
 * @returns Fact-check result
 */
export async function factCheckClaim(claim: string): Promise<FactCheckResult> {
  try {
    // Search authoritative sources
    const sources = await findAuthoritativeSources(claim);

    if (sources.length === 0) {
      return {
        claim,
        verdict: "UNVERIFIED",
        confidence: 0,
        sources: [],
        explanation: "No authoritative sources found",
      };
    }

    const llm = initLLM();
    const prompt = PromptTemplate.fromTemplate(`
Fact-check this claim using the provided sources:

CLAIM: {claim}

SOURCES:
{sources}

Return JSON:
{{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation"
}}
`);

    const sourcesText = sources
      .map((s) => `[${s.authority}/100] ${s.title}: ${s.content}`)
      .join("\n\n");

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      claim,
      sources: sourcesText,
    });

    const parsed = JSON.parse(result);

    return {
      claim,
      verdict: parsed.verdict,
      confidence: parsed.confidence,
      sources: sources.map((s) => ({ title: s.title, url: s.url })),
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error("Fact-check error:", error);
    return {
      claim,
      verdict: "UNVERIFIED",
      confidence: 0,
      sources: [],
      explanation: `Error: ${error.message}`,
    };
  }
}

/**
 * Enhanced fallacy detection with RAG
 * @param argument - Argument text
 * @returns Detected fallacies with examples
 */
export async function detectFallaciesWithRAG(
  argument: string
): Promise<FallacyDetection[]> {
  try {
    // Search for known fallacy patterns
    const similarAnalyses = await searchSimilarAnalyses(argument, 5);

    const llm = initLLM();
    const prompt = PromptTemplate.fromTemplate(`
Detect logical fallacies in this argument. Use similar past analyses as reference.

ARGUMENT: {argument}

SIMILAR PAST ANALYSES:
{similarAnalyses}

FALLACY TAXONOMY:
- Ad Hominem
- Strawman
- Slippery Slope
- False Dilemma
- Appeal to Authority
- Hasty Generalization
- Post Hoc
- Red Herring
- Circular Reasoning
- Appeal to Emotion
- Bandwagon
- No True Scotsman

Return JSON array: [{{ "type": "fallacy type", "excerpt": "quote", "explanation": "why" }}]
`);

    const analysesText = similarAnalyses
      .map((a) => `${a.creatorName}: ${a.fallacyCount} fallacies detected`)
      .join("\n");

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      argument,
      similarAnalyses: analysesText,
    });

    return JSON.parse(result);
  } catch (error) {
    console.error("Fallacy detection error:", error);
    return [];
  }
}

// Types
export interface AnalysisParams {
  transcript: string;
  supervisorPrompt: string;
  calibration: any;
  schema: string;
  autoSearch?: boolean;
  ragUrls?: string[];
}

export interface Counterargument {
  counterargument: string;
  source: string;
}

export interface FactCheckResult {
  claim: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED";
  confidence: number;
  sources: { title: string; url: string }[];
  explanation: string;
}

export interface FallacyDetection {
  type: string;
  excerpt: string;
  explanation: string;
}
