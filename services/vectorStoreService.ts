// Vector Store Service (Browser-Compatible)
// Manages vector embeddings storage and similarity search in Supabase
// Uses direct Supabase calls instead of LangChain vector store (browser-compatible)

import { supabase } from "./supabaseClient";
import { generateEmbedding } from "./embeddingService";

// Table names
const DOCUMENT_EMBEDDINGS_TABLE = "document_embeddings";
const ANALYSIS_EMBEDDINGS_TABLE = "analysis_embeddings";

/**
 * Store document chunks with embeddings
 */
export async function storeDocuments(
  documents: DocumentToStore[],
  metadata?: Record<string, any>
): Promise<string[]> {
  try {
    const ids: string[] = [];

    for (const doc of documents) {
      const embedding = await generateEmbedding(doc.content);

      const { data, error } = await supabase
        .from(DOCUMENT_EMBEDDINGS_TABLE)
        .insert({
          content: doc.content,
          embedding,
          source: doc.source,
          source_url: doc.url,
          title: doc.title,
          metadata: {
            ...doc.metadata,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        })
        .select('id')
        .single();

      if (error) throw error;
      if (data) ids.push(data.id);
    }

    console.log(`Stored ${ids.length} document chunks with embeddings`);
    return ids;
  } catch (error: any) {
    console.error("Error storing documents:", error);
    throw new Error(`Document storage failed: ${error.message}`);
  }
}

/**
 * Store analysis result with embedding
 */
export async function storeAnalysis(analysis: AnalysisToStore): Promise<string> {
  try {
    const searchableText = createSearchableAnalysisText(analysis);
    const embedding = await generateEmbedding(searchableText);

    const { data, error } = await supabase
      .from(ANALYSIS_EMBEDDINGS_TABLE)
      .insert({
        content: searchableText,
        embedding,
        analysis_id: analysis.id,
        video_id: analysis.videoId,
        creator_name: analysis.creatorName,
        scores: analysis.scores,
        fallacy_count: analysis.fallacies?.length || 0,
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log(`Stored analysis ${analysis.id} with embedding`);
    return data?.id || '';
  } catch (error: any) {
    console.error("Error storing analysis:", error);
    throw new Error(`Analysis storage failed: ${error.message}`);
  }
}

/**
 * Search for similar documents
 */
export async function searchSimilarDocuments(
  query: string,
  limit: number = 5,
  filter?: Record<string, any>
): Promise<SimilarDocument[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      filter: filter || {},
    });

    if (error) throw error;

    return (data || []).map((result: any) => ({
      content: result.content,
      metadata: result.metadata,
      similarityScore: result.similarity,
    }));
  } catch (error: any) {
    console.error("Error searching documents:", error);
    return [];
  }
}

/**
 * Search for similar past analyses
 */
export async function searchSimilarAnalyses(
  query: string,
  limit: number = 5
): Promise<SimilarAnalysis[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_analyses', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    if (error) throw error;

    return (data || []).map((result: any) => ({
      analysisId: result.analysis_id,
      videoId: result.video_id,
      creatorName: result.creator_name,
      timestamp: result.created_at,
      scores: result.scores,
      fallacyCount: result.fallacy_count,
      similarityScore: result.similarity,
      excerpt: result.content.substring(0, 200),
    }));
  } catch (error: any) {
    console.error("Error searching analyses:", error);
    return [];
  }
}

/**
 * Find documents relevant to specific claims
 */
export async function findRelevantSources(
  claims: string[],
  limit: number = 3
): Promise<Map<string, SimilarDocument[]>> {
  try {
    const results = new Map<string, SimilarDocument[]>();

    for (const claim of claims) {
      const docs = await searchSimilarDocuments(claim, limit);
      results.set(claim, docs);
    }

    return results;
  } catch (error: any) {
    console.error("Error finding relevant sources:", error);
    throw new Error(`Source finding failed: ${error.message}`);
  }
}

/**
 * Delete documents by source URL
 */
export async function deleteDocumentsBySource(sourceUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(DOCUMENT_EMBEDDINGS_TABLE)
      .delete()
      .eq("source_url", sourceUrl);

    if (error) throw error;

    console.log(`Deleted documents from source: ${sourceUrl}`);
    return true;
  } catch (error: any) {
    console.error("Error deleting documents:", error);
    throw new Error(`Document deletion failed: ${error.message}`);
  }
}

/**
 * Get vector store statistics
 */
export async function getVectorStoreStats(): Promise<VectorStoreStats> {
  try {
    const [docStats, analysisStats] = await Promise.all([
      supabase.from('document_embedding_stats').select('*').single(),
      supabase.from('analysis_embedding_stats').select('*').single(),
    ]);

    return {
      documentCount: docStats.data?.total_documents || 0,
      analysisCount: analysisStats.data?.total_analyses || 0,
      totalVectors: (docStats.data?.total_documents || 0) + (analysisStats.data?.total_analyses || 0),
    };
  } catch (error) {
    console.error("Error getting vector store stats:", error);
    return { documentCount: 0, analysisCount: 0, totalVectors: 0 };
  }
}

/**
 * Create searchable text from analysis
 */
function createSearchableAnalysisText(analysis: AnalysisToStore): string {
  const parts = [
    `Creator: ${analysis.creatorName}`,
    `Argument Summary: ${analysis.argumentSummary || ""}`,
    `Main Claims: ${analysis.claims?.join(", ") || ""}`,
    `Detected Fallacies: ${analysis.fallacies?.map((f: any) => f.type).join(", ") || "none"}`,
    `Overall Score: ${analysis.scores?.overall || 0}`,
    `Reasoning: ${analysis.reasoning || ""}`,
  ];

  return parts.filter((p) => p.split(": ")[1]).join("\n");
}

// Types
export interface DocumentToStore {
  content: string;
  source: string;
  url?: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface AnalysisToStore {
  id: string;
  videoId: string;
  creatorName: string;
  timestamp: string;
  scores?: any;
  fallacies?: any[];
  argumentSummary?: string;
  claims?: string[];
  reasoning?: string;
}

export interface SimilarDocument {
  content: string;
  metadata: Record<string, any>;
  similarityScore: number;
}

export interface SimilarAnalysis {
  analysisId: string;
  videoId: string;
  creatorName: string;
  timestamp: string;
  scores: any;
  fallacyCount: number;
  similarityScore: number;
  excerpt: string;
}

export interface VectorStoreStats {
  documentCount: number;
  analysisCount: number;
  totalVectors: number;
}
