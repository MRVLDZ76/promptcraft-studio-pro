// RAG-Enhanced Gemini Service Wrapper
// Adds intelligent source discovery and fact-checking to debate analysis
// Phase 3: Enhanced Fact Verification - January 12, 2026

import { analyzeVideoContent as originalAnalyzeVideoContent } from './geminiService.ts';
import { analyzeWithRAG, extractClaims, factCheckClaim, FactCheckResult } from './langchainService.ts';
import { searchWeb, findAuthoritativeSources } from './tavilyService.ts';
import { searchSimilarAnalyses, storeAnalysis } from './vectorStoreService'; 
import { AnalysisMode, Participant } from '../types';
import { 
  FactVerificationService, 
  getFactVerificationService, 
  FactVerificationReport,
  EnhancedFactCheckResult 
} from './factVerificationService';

// RAG configuration
const RAG_ENABLED = import.meta.env.VITE_RAG_ENABLED !== 'false'; // Default: enabled
const AUTO_SEARCH = import.meta.env.AUTO_SEARCH_ENABLED !== 'false';

// Phase 3: Enhanced verification configuration
const VERIFY_ALL_CLAIMS = import.meta.env.VITE_VERIFY_ALL_CLAIMS !== 'false'; // Default: enabled
const MAX_CLAIMS_TO_VERIFY = parseInt(import.meta.env.VITE_MAX_CLAIMS_TO_VERIFY || '20', 10);

/**
 * Enhanced analysis with RAG pipeline
 * Adds automatic source discovery, fact-checking, and semantic search
 */
export const analyzeVideoContentWithRAG = async (
  base64Video: string | null,
  mimeType: string,
  userPrompt: string,
  config: {
    mode: AnalysisMode;
    participantA: Participant;
    participantB?: Participant;
    systemInstruction?: string;
    wsdcWeights: { content: number; style: number; strategy: number };
    domain?: string;
    contextFiles?: string[];
    youtubeUrl?: string;
    transcript?: string;
    ragUrls?: string[];
    supervisorPrompt?: string;
    calibration: {
      country?: string;
      year?: string;
      demography?: string;
      persona?: string;
      intent?: string;
      logicStyle?: string;
      stakeholderMode?: string;
      marginOfError?: number;
    };
    enableRAG?: boolean; // Manual override
  }
): Promise<string> => {
  const useRAG = config.enableRAG !== undefined ? config.enableRAG : RAG_ENABLED;

  // If RAG disabled, use original service
  if (!useRAG) {
    console.log('📊 RAG disabled - using standard analysis');
    return originalAnalyzeVideoContent(base64Video, mimeType, userPrompt, config);
  }

  console.log('🧠 RAG ENABLED - Enhanced analysis with intelligent source discovery');

  try {
    const transcript = config.transcript || '';
    let enhancedRagUrls = [...(config.ragUrls || [])];
    let ragContext = '';
    let factVerificationReport: FactVerificationReport | null = null;
    let ragMetadata: any = {
      mode: 'enhanced',
      autoSearchEnabled: AUTO_SEARCH,
      verifyAllClaims: VERIFY_ALL_CLAIMS,
      claimsExtracted: 0,
      sourcesDiscovered: 0,
      factChecksPerformed: 0,
      similarAnalysesFound: 0,
      factVerificationReport: null,
    };

    // Step 1: Extract claims for fact-checking
    if (AUTO_SEARCH && transcript) {
      console.log('🔍 Extracting claims from transcript...');
      try {
        const claims = await extractClaims(transcript.substring(0, 8000)); // Increased for Phase 3
        ragMetadata.claimsExtracted = claims.length;

        // ═══════════════════════════════════════════════════════════════
        // PHASE 3: Enhanced Fact Verification - Verify ALL claims
        // ═══════════════════════════════════════════════════════════════
        if (VERIFY_ALL_CLAIMS && claims.length > 0) {
          console.log(`🔬 PHASE 3: Verifying ALL ${Math.min(claims.length, MAX_CLAIMS_TO_VERIFY)} claims...`);
          
          const verificationService = getFactVerificationService({
            maxConcurrentVerifications: 3,
            maxSourcesPerClaim: 5,
            timeoutPerClaim: 15000,
            retryFailedClaims: true
          });
          
          // Convert extracted claims to the format expected by verification service
          const claimsToVerify = claims.slice(0, MAX_CLAIMS_TO_VERIFY).map((claim, i) => ({
            text: claim,
            speaker: 'A' as const, // Default to A, will be corrected by Gemini output parsing
            category: undefined,
            timestamp: undefined
          }));
          
          try {
            factVerificationReport = await verificationService.verifyAllClaims(
              claimsToVerify,
              { A: config.participantA.name, B: config.participantB?.name }
            );
            
            ragMetadata.factChecksPerformed = factVerificationReport.summary.totalClaims;
            ragMetadata.factVerificationReport = factVerificationReport;
            
            // Add verified claims to RAG context
            ragContext += `\n## COMPREHENSIVE FACT-CHECK RESULTS (Phase 3)\n`;
            ragContext += `Total Claims Analyzed: ${factVerificationReport.summary.totalClaims}\n`;
            ragContext += `✓ Verified True: ${factVerificationReport.summary.verified}\n`;
            ragContext += `✗ Verified False: ${factVerificationReport.summary.false}\n`;
            ragContext += `◐ Partially True: ${factVerificationReport.summary.partiallyTrue}\n`;
            ragContext += `⚠ Misleading: ${factVerificationReport.summary.misleading}\n`;
            ragContext += `? Unverified: ${factVerificationReport.summary.unverified}\n`;
            ragContext += `Truth Density: ${factVerificationReport.summary.truthDensity.toFixed(1)}%\n\n`;
            
            // Add individual claim verifications (limit to 10 for context length)
            const claimsForContext = factVerificationReport.claims.slice(0, 10);
            ragContext += `### Claim-by-Claim Verification:\n`;
            for (const claim of claimsForContext) {
              ragContext += `\n**[${claim.verdict}]** "${claim.claim.substring(0, 100)}..."\n`;
              ragContext += `Confidence: ${(claim.confidence * 100).toFixed(0)}% | Category: ${claim.category}\n`;
              if (claim.sources.length > 0) {
                ragContext += `Sources: ${claim.sources.slice(0, 2).map(s => s.domain).join(', ')}\n`;
              }
              ragContext += `Explanation: ${claim.explanation.substring(0, 200)}...\n`;
            }
            
            // Collect all unique sources
            const allSources = factVerificationReport.claims.flatMap(c => c.sources);
            const uniqueSources = Array.from(new Map(allSources.map(s => [s.url, s])).values());
            ragMetadata.sourcesDiscovered = uniqueSources.length;
            
            // Add top sources to RAG URLs
            for (const source of uniqueSources.slice(0, 15)) {
              if (!enhancedRagUrls.includes(source.url)) {
                enhancedRagUrls.push(source.url);
              }
            }
            
            console.log(`✅ Phase 3 verification complete:`, {
              totalClaims: factVerificationReport.summary.totalClaims,
              verified: factVerificationReport.summary.verified,
              false: factVerificationReport.summary.false,
              truthDensity: `${factVerificationReport.summary.truthDensity.toFixed(1)}%`,
              sources: uniqueSources.length
            });
            
          } catch (verificationError) {
            console.warn('⚠️ Phase 3 enhanced verification failed, falling back to basic...', verificationError);
            // Fall through to basic verification below
          }
        }
        
        // Fallback: Basic verification for top 3 claims (if Phase 3 didn't run)
        if (!factVerificationReport && claims.length > 0) {
          console.log(`🌐 Basic search for ${Math.min(3, claims.length)} claims...`);
          const topClaims = claims.slice(0, 3);
          
          for (const claim of topClaims) {
            try {
              const searchResults = await searchWeb(claim, 2);
              ragMetadata.sourcesDiscovered += searchResults.length;

              for (const result of searchResults) {
                ragContext += `\n### ${result.title}\n`;
                ragContext += `URL: ${result.url}\n`;
                ragContext += `Relevance: ${(result.score * 100).toFixed(0)}%\n`;
                ragContext += `${result.content.substring(0, 400)}...\n\n`;
                
                if (!enhancedRagUrls.includes(result.url)) {
                  enhancedRagUrls.push(result.url);
                }
              }
            } catch (error) {
              console.warn(`Search failed for claim: ${claim}`, error);
            }
          }

          // Basic fact-check for first claim
          if (topClaims.length > 0) {
            console.log('✓ Fact-checking primary claim...');
            try {
              const factCheck = await factCheckClaim(topClaims[0]);
              ragMetadata.factChecksPerformed = 1;
              
              ragContext += `\n## FACT-CHECK RESULT\n`;
              ragContext += `Claim: "${factCheck.claim}"\n`;
              ragContext += `Verdict: ${factCheck.verdict}\n`;
              ragContext += `Confidence: ${(factCheck.confidence * 100).toFixed(0)}%\n`;
              ragContext += `Explanation: ${factCheck.explanation}\n\n`;
            } catch (error) {
              console.warn('Fact-check failed:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Claim extraction failed:', error);
      }
    }

    // Step 4: Search for similar past analyses
    if (transcript) {
      console.log('📚 Searching for similar past analyses...');
      try {
        const similarAnalyses = await searchSimilarAnalyses(transcript.substring(0, 3000), 3);
        ragMetadata.similarAnalysesFound = similarAnalyses.length;

        if (similarAnalyses.length > 0) {
          ragContext += `\n## SIMILAR PAST ANALYSES\n`;
          ragContext += `Found ${similarAnalyses.length} similar debates:\n`;
          for (const analysis of similarAnalyses) {
            ragContext += `- ${analysis.creatorName}: Score ${analysis.scores?.overall || 'N/A'}, `;
            ragContext += `${analysis.fallacyCount} fallacies, `;
            ragContext += `Similarity: ${(analysis.similarityScore * 100).toFixed(0)}%\n`;
          }
          ragContext += '\n';
        }
      } catch (error) {
        console.warn('Similar analysis search failed:', error);
      }
    }

    // Step 5: Add manual RAG URLs to context
    if (config.ragUrls && config.ragUrls.length > 0) {
      ragContext += `\n## USER-PROVIDED SOURCES\n`;
      ragContext += `${config.ragUrls.length} additional sources provided:\n`;
      config.ragUrls.forEach((url) => {
        ragContext += `- ${url}\n`;
      });
      ragContext += '\n';
    }

    // Step 6: Call original analysis with enhanced RAG context
    console.log('🎯 Executing enhanced analysis...');
    const enhancedConfig = {
      ...config,
      ragUrls: enhancedRagUrls,
      supervisorPrompt: (config.supervisorPrompt || '') + `\n\n## RAG CONTEXT\n${ragContext}`,
    };

    const result = await originalAnalyzeVideoContent(
      base64Video,
      mimeType,
      userPrompt,
      enhancedConfig
    );

    // Parse result and add RAG metadata
    try {
      const parsed = JSON.parse(result);
      parsed.ragMetadata = ragMetadata;
      
      // Store analysis with embedding for future similarity search
      if (transcript && parsed.id) {
        try {
          await storeAnalysis({
            id: parsed.id,
            videoId: config.youtubeUrl || 'unknown',
            creatorName: config.participantA.name,
            timestamp: new Date().toISOString(),
            scores: parsed.scores,
            fallacies: parsed.fallacies,
            argumentSummary: transcript.substring(0, 500),
            claims: ragMetadata.claimsExtracted > 0 ? ['extracted'] : [],
            reasoning: parsed.reasoning,
          });
        } catch (error) {
          console.warn('Failed to store analysis embedding:', error);
        }
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      // If parsing fails, return as-is
      return result;
    }
  } catch (error: any) {
    console.error('❌ RAG-enhanced analysis failed:', error);
    
    // Fallback to standard analysis
    console.log('🔄 Falling back to standard analysis...');
    return originalAnalyzeVideoContent(base64Video, mimeType, userPrompt, config);
  }
};

/**
 * Backward-compatible export
 * Uses RAG-enhanced version by default
 */
export const analyzeVideoContent = analyzeVideoContentWithRAG;

// Re-export other utilities
export * from './geminiService';
