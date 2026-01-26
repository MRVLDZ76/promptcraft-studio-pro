// Embedding Service for RAG Pipeline
// Generates vector embeddings for semantic search and similarity matching

import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Configuration
let EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || import.meta.env?.VITE_EMBEDDING_PROVIDER || "openai"; // "openai" or "google"
// Auto-select provider: if OpenAI key missing, use Google when Gemini key exists
const OPENAI_KEY = process.env.OPENAI_API_KEY || import.meta.env?.VITE_OPENAI_API_KEY;
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
const HAS_OPENAI = !!OPENAI_KEY;
const HAS_GEMINI = !!GEMINI_KEY;

// IMPORTANT: Database uses 1536-dimension vectors (OpenAI)
// If switching to Google (768 dims), you MUST migrate the database vectors
if (!HAS_OPENAI && HAS_GEMINI) {
  console.warn('⚠️ OpenAI key missing. Using Google embeddings (768-dim) but database expects OpenAI (1536-dim). Vector search will fail!');
  console.warn('⚠️ Either: 1) Add OPENAI_API_KEY/VITE_OPENAI_API_KEY, or 2) Run migration to change vector dimensions to 768');
  // Force OpenAI requirement for now to prevent dimension mismatch
  // EMBEDDING_PROVIDER = "google";
}

const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks

/**
 * Initialize the embedding model based on configured provider
 */
export function initEmbeddingModel() {
  if (EMBEDDING_PROVIDER === "google") {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: GEMINI_KEY,
      modelName: "text-embedding-004", // 768 dimensions
    });
  } else {
    if (!OPENAI_KEY) {
      throw new Error("Missing credentials. Provide OPENAI_API_KEY/VITE_OPENAI_API_KEY or set EMBEDDING_PROVIDER=google with GEMINI_API_KEY.");
    }
    return new OpenAIEmbeddings({
      apiKey: OPENAI_KEY,
      modelName: "text-embedding-3-small", // 1536 dimensions, $0.00002/1K tokens
    });
  }
}

/**
 * Generate embedding for a single text
 * @param text - Text to embed
 * @returns Vector embedding (array of numbers)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddings = initEmbeddingModel();
    const result = await embeddings.embedQuery(text);
    return result;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 * @param texts - Array of texts to embed
 * @returns Array of vector embeddings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const embeddings = initEmbeddingModel();
    const results = await embeddings.embedDocuments(texts);
    return results;
  } catch (error) {
    console.error("Error generating batch embeddings:", error);
    throw new Error(`Batch embedding generation failed: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 (opposite) and 1 (identical)
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Similarity score
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Prepare text for embedding by cleaning and truncating
 * @param text - Raw text
 * @param maxLength - Maximum length (default 8000 chars)
 * @returns Cleaned text
 */
export function prepareTextForEmbedding(text: string, maxLength = 8000): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, " ").trim();

  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Get embedding dimension based on provider
 */
export function getEmbeddingDimension(): number {
  if (EMBEDDING_PROVIDER === "google") {
    return 768; // text-embedding-004
  } else {
    return 1536; // text-embedding-3-small
  }
}

/**
 * Estimate cost for embedding generation
 * @param textLength - Length of text in characters
 * @returns Estimated cost in USD
 */
export function estimateEmbeddingCost(textLength: number): number {
  const tokens = Math.ceil(textLength / 4); // Rough estimate: 1 token ≈ 4 chars

  if (EMBEDDING_PROVIDER === "google") {
    return (tokens / 1000) * 0.000001; // $0.000001 per 1K tokens
  } else {
    return (tokens / 1000) * 0.00002; // $0.00002 per 1K tokens
  }
}

// Export types
export interface EmbeddingResult {
  text: string;
  embedding: number[];
  dimension: number;
  provider: string;
}

export interface BatchEmbeddingResult {
  texts: string[];
  embeddings: number[][];
  dimension: number;
  provider: string;
  totalCost: number;
}
