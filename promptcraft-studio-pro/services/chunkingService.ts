// Document Chunking Service
// Splits large documents into smaller chunks for embedding and retrieval

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Configuration
const DEFAULT_CHUNK_SIZE = 1000; // Characters per chunk
const DEFAULT_CHUNK_OVERLAP = 200; // Overlap between consecutive chunks
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""]; // Priority order for splitting

/**
 * Create a text splitter with custom configuration
 * @param chunkSize - Size of each chunk in characters
 * @param chunkOverlap - Number of overlapping characters between chunks
 * @returns Configured text splitter
 */
export function createTextSplitter(
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  chunkOverlap: number = DEFAULT_CHUNK_OVERLAP
): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: SEPARATORS,
  });
}

/**
 * Split a single document into chunks
 * @param text - Document text to split
 * @param chunkSize - Optional custom chunk size
 * @param chunkOverlap - Optional custom overlap
 * @returns Array of text chunks
 */
export async function chunkDocument(
  text: string,
  chunkSize?: number,
  chunkOverlap?: number
): Promise<string[]> {
  try {
    const splitter = createTextSplitter(chunkSize, chunkOverlap);
    const chunks = await splitter.splitText(text);
    return chunks;
  } catch (error) {
    console.error("Error chunking document:", error);
    throw new Error(`Document chunking failed: ${error.message}`);
  }
}

/**
 * Split a transcript into semantic chunks
 * Uses paragraph breaks and sentence boundaries for better semantic coherence
 * @param transcript - Video transcript or long text
 * @returns Array of semantic chunks with metadata
 */
export async function chunkTranscript(transcript: string): Promise<ChunkWithMetadata[]> {
  try {
    const splitter = createTextSplitter(1000, 200);
    const chunks = await splitter.splitText(transcript);

    // Add metadata to each chunk
    return chunks.map((chunk, index) => ({
      text: chunk,
      index,
      startPos: transcript.indexOf(chunk),
      length: chunk.length,
      wordCount: chunk.split(/\s+/).length,
    }));
  } catch (error) {
    console.error("Error chunking transcript:", error);
    throw new Error(`Transcript chunking failed: ${error.message}`);
  }
}

/**
 * Chunk a debate argument into logical components
 * Attempts to preserve argumentative structure (claims, evidence, reasoning)
 * @param argument - Full argument text
 * @returns Structured chunks
 */
export async function chunkArgument(argument: string): Promise<ArgumentChunk[]> {
  try {
    // Use smaller chunks for arguments to preserve logical flow
    const splitter = createTextSplitter(500, 100);
    const chunks = await splitter.splitText(argument);

    return chunks.map((chunk, index) => ({
      text: chunk,
      index,
      type: detectChunkType(chunk),
      length: chunk.length,
    }));
  } catch (error) {
    console.error("Error chunking argument:", error);
    throw new Error(`Argument chunking failed: ${error.message}`);
  }
}

/**
 * Detect the type of argument component in a chunk
 * @param chunk - Text chunk
 * @returns Argument type (claim, evidence, reasoning, or general)
 */
function detectChunkType(chunk: string): ArgumentType {
  const lowerChunk = chunk.toLowerCase();

  // Claim indicators
  if (
    lowerChunk.includes("claim") ||
    lowerChunk.includes("therefore") ||
    lowerChunk.includes("thus") ||
    lowerChunk.includes("consequently")
  ) {
    return "claim";
  }

  // Evidence indicators
  if (
    lowerChunk.includes("study") ||
    lowerChunk.includes("research") ||
    lowerChunk.includes("data") ||
    lowerChunk.includes("according to") ||
    lowerChunk.includes("evidence")
  ) {
    return "evidence";
  }

  // Reasoning indicators
  if (
    lowerChunk.includes("because") ||
    lowerChunk.includes("since") ||
    lowerChunk.includes("reason") ||
    lowerChunk.includes("explains")
  ) {
    return "reasoning";
  }

  return "general";
}

/**
 * Chunk multiple documents in batch
 * @param documents - Array of documents to chunk
 * @returns Array of chunked documents with source tracking
 */
export async function chunkDocuments(documents: Document[]): Promise<ChunkedDocument[]> {
  try {
    const splitter = createTextSplitter();
    const results: ChunkedDocument[] = [];

    for (const doc of documents) {
      const chunks = await splitter.splitText(doc.content);
      results.push({
        sourceId: doc.id,
        sourceUrl: doc.url,
        sourceTitle: doc.title,
        chunks: chunks.map((chunk, index) => ({
          text: chunk,
          index,
          sourceId: doc.id,
          length: chunk.length,
        })),
      });
    }

    return results;
  } catch (error) {
    console.error("Error chunking documents:", error);
    throw new Error(`Batch document chunking failed: ${error.message}`);
  }
}

/**
 * Clean HTML from text before chunking
 * @param html - HTML content
 * @returns Plain text
 */
export function cleanHtmlForChunking(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');

  // Remove excessive whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Get chunk statistics
 * @param chunks - Array of text chunks
 * @returns Statistics object
 */
export function getChunkStats(chunks: string[]): ChunkStats {
  const lengths = chunks.map((c) => c.length);
  const wordCounts = chunks.map((c) => c.split(/\s+/).length);

  return {
    totalChunks: chunks.length,
    avgChunkLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    minChunkLength: Math.min(...lengths),
    maxChunkLength: Math.max(...lengths),
    totalCharacters: lengths.reduce((a, b) => a + b, 0),
    avgWordCount: wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length,
  };
}

// Types
export interface ChunkWithMetadata {
  text: string;
  index: number;
  startPos: number;
  length: number;
  wordCount: number;
}

export interface ArgumentChunk {
  text: string;
  index: number;
  type: ArgumentType;
  length: number;
}

export type ArgumentType = "claim" | "evidence" | "reasoning" | "general";

export interface Document {
  id: string;
  url?: string;
  title?: string;
  content: string;
}

export interface ChunkedDocument {
  sourceId: string;
  sourceUrl?: string;
  sourceTitle?: string;
  chunks: {
    text: string;
    index: number;
    sourceId: string;
    length: number;
  }[];
}

export interface ChunkStats {
  totalChunks: number;
  avgChunkLength: number;
  minChunkLength: number;
  maxChunkLength: number;
  totalCharacters: number;
  avgWordCount: number;
}
