// services/factVerificationService.ts
// Phase 3: Enhanced Fact Verification Service
// Comprehensive claim verification with parallel processing and source aggregation

import { searchWeb, findAuthoritativeSources, AuthoritativeSource } from './tavilyService';
import { factCheckClaim, extractClaims, FactCheckResult } from './langchainService';
import { VerifiedClaim, ClaimCategory, VerificationStatus } from './scoringEngine';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface VerificationSource {
  title: string;
  url: string;
  excerpt: string;
  authority: number;        // 0-100 trust score
  relevance: number;        // 0-1 semantic match
  domain: string;           // e.g., "reuters.com"
  sourceType: 'academic' | 'government' | 'news' | 'factcheck' | 'other';
}

export interface EnhancedFactCheckResult {
  claim: string;
  claimId: string;
  speaker: 'A' | 'B';
  category: ClaimCategory;
  
  // Verification status
  verdict: 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'MISLEADING' | 'UNVERIFIED' | 'OPINION' | 'PREDICTION';
  confidence: number;       // 0-1
  
  // Evidence
  sources: VerificationSource[];
  explanation: string;
  reasoning: string[];      // Step-by-step verification logic
  
  // Context
  timestamp?: number;       // From transcript
  quote?: string;           // Original claim text from transcript
  
  // Metrics
  verificationTime: number; // ms to verify
  searchQueries: string[];  // Queries used to find sources
}

export interface FactVerificationReport {
  claims: EnhancedFactCheckResult[];
  summary: {
    totalClaims: number;
    verified: number;
    false: number;
    partiallyTrue: number;
    misleading: number;
    unverified: number;
    opinions: number;
    predictions: number;
    truthDensity: number;   // % of factual claims verified true
    averageConfidence: number;
    totalSources: number;
    uniqueSources: number;
  };
  metadata: {
    startTime: Date;
    endTime: Date;
    totalDuration: number;  // ms
    claimsPerSecond: number;
    parallelBatches: number;
  };
  participantBreakdown: {
    A: ParticipantVerificationStats;
    B?: ParticipantVerificationStats;
  };
}

export interface ParticipantVerificationStats {
  name: string;
  totalClaims: number;
  verified: number;
  false: number;
  partiallyTrue: number;
  unverified: number;
  truthDensity: number;
  averageConfidence: number;
  topSources: VerificationSource[];
}

export interface VerificationConfig {
  maxConcurrentVerifications: number;   // Default: 3
  maxSourcesPerClaim: number;           // Default: 5
  minConfidenceThreshold: number;       // Default: 0.5
  includeOpinions: boolean;             // Default: true
  includePredictions: boolean;          // Default: true
  timeoutPerClaim: number;              // Default: 15000ms
  retryFailedClaims: boolean;           // Default: true
  maxRetries: number;                   // Default: 2
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: VerificationConfig = {
  maxConcurrentVerifications: 3,
  maxSourcesPerClaim: 5,
  minConfidenceThreshold: 0.5,
  includeOpinions: true,
  includePredictions: true,
  timeoutPerClaim: 15000,
  retryFailedClaims: true,
  maxRetries: 2
};

// ═══════════════════════════════════════════════════════════════
// FACT VERIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════

export class FactVerificationService {
  private config: VerificationConfig;
  private verificationCache: Map<string, EnhancedFactCheckResult>;
  private onProgressCallback?: (progress: number, currentClaim: string) => void;

  constructor(config: Partial<VerificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.verificationCache = new Map();
  }

  /**
   * Set progress callback for UI updates
   */
  setProgressCallback(callback: (progress: number, currentClaim: string) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * Verify all claims from Gemini's structured output
   * Primary entry point for Phase 3 verification
   */
  async verifyAllClaims(
    claims: Array<{
      text: string;
      speaker: 'A' | 'B';
      category?: string;
      timestamp?: number;
    }>,
    participantNames: { A: string; B?: string }
  ): Promise<FactVerificationReport> {
    const startTime = new Date();
    console.log(`🔍 Starting fact verification for ${claims.length} claims...`);

    // Filter and prepare claims
    const processableClaims = claims.filter(c => {
      const category = this.categorizeClaimType(c.text, c.category);
      if (category === 'opinion' && !this.config.includeOpinions) return false;
      if (category === 'prediction' && !this.config.includePredictions) return false;
      return true;
    });

    // Process claims in parallel batches
    const results: EnhancedFactCheckResult[] = [];
    const batchSize = this.config.maxConcurrentVerifications;
    let parallelBatches = 0;

    for (let i = 0; i < processableClaims.length; i += batchSize) {
      const batch = processableClaims.slice(i, i + batchSize);
      parallelBatches++;
      
      // Report progress
      const progress = Math.round((i / processableClaims.length) * 100);
      this.onProgressCallback?.(progress, batch[0]?.text.substring(0, 50) + '...');
      
      console.log(`📊 Processing batch ${parallelBatches} (${batch.length} claims)...`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((claim, idx) => 
          this.verifySingleClaim(claim, `claim_${i + idx}`)
        )
      );
      
      results.push(...batchResults);
    }

    this.onProgressCallback?.(100, 'Complete');

    // Generate report
    const endTime = new Date();
    const report = this.generateReport(results, participantNames, {
      startTime,
      endTime,
      totalDuration: endTime.getTime() - startTime.getTime(),
      claimsPerSecond: results.length / ((endTime.getTime() - startTime.getTime()) / 1000),
      parallelBatches
    });

    console.log(`✅ Fact verification complete:`, {
      claims: report.summary.totalClaims,
      verified: report.summary.verified,
      false: report.summary.false,
      truthDensity: `${report.summary.truthDensity.toFixed(1)}%`,
      sources: report.summary.totalSources,
      duration: `${report.metadata.totalDuration}ms`
    });

    return report;
  }

  /**
   * Verify a single claim with retries
   */
  private async verifySingleClaim(
    claim: { text: string; speaker: 'A' | 'B'; category?: string; timestamp?: number },
    claimId: string
  ): Promise<EnhancedFactCheckResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(claim.text);
    const cached = this.verificationCache.get(cacheKey);
    if (cached) {
      console.log(`📋 Cache hit for claim: ${claim.text.substring(0, 30)}...`);
      return { ...cached, claimId, speaker: claim.speaker };
    }

    const startTime = Date.now();
    const category = this.categorizeClaimType(claim.text, claim.category);
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.config.maxRetries) {
      attempts++;
      
      try {
        // For opinions and predictions, skip web verification
        if (category === 'opinion' || category === 'prediction') {
          return this.createOpinionResult(claim, claimId, category, startTime);
        }

        // Step 1: Generate search queries
        const searchQueries = this.generateSearchQueries(claim.text, category);
        
        // Step 2: Search for sources
        const sources = await this.searchForSources(searchQueries);
        
        // Step 3: Get fact-check verdict from LLM
        const factCheck = await this.withTimeout(
          factCheckClaim(claim.text),
          this.config.timeoutPerClaim
        );
        
        // Step 4: Map verdict to our format
        const verdict = this.mapVerdict(factCheck.verdict, factCheck.confidence);
        
        // Step 5: Build result
        const result: EnhancedFactCheckResult = {
          claim: claim.text,
          claimId,
          speaker: claim.speaker,
          category,
          verdict,
          confidence: factCheck.confidence,
          sources: sources.slice(0, this.config.maxSourcesPerClaim),
          explanation: factCheck.explanation,
          reasoning: this.extractReasoning(factCheck.explanation),
          timestamp: claim.timestamp,
          quote: claim.text,
          verificationTime: Date.now() - startTime,
          searchQueries
        };
        
        // Cache result
        this.verificationCache.set(cacheKey, result);
        
        return result;

      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempts} failed for claim: ${claim.text.substring(0, 30)}...`, error.message);
        
        if (!this.config.retryFailedClaims || attempts >= this.config.maxRetries) {
          break;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempts) * 500);
      }
    }

    // Return unverified result on failure
    return {
      claim: claim.text,
      claimId,
      speaker: claim.speaker,
      category,
      verdict: 'UNVERIFIED',
      confidence: 0,
      sources: [],
      explanation: lastError?.message || 'Verification failed after multiple attempts',
      reasoning: ['Failed to verify claim due to service errors'],
      timestamp: claim.timestamp,
      quote: claim.text,
      verificationTime: Date.now() - startTime,
      searchQueries: []
    };
  }

  /**
   * Categorize claim type for appropriate verification strategy
   */
  private categorizeClaimType(text: string, providedCategory?: string): ClaimCategory {
    if (providedCategory) {
      const category = providedCategory.toLowerCase();
      if (['factual', 'statistical', 'historical', 'citation'].includes(category)) {
        return category as ClaimCategory;
      }
    }

    const lowerText = text.toLowerCase();
    
    // Statistical claims
    if (/\d+%|\d+ percent|statistics|data shows|studies show|research indicates/i.test(lowerText)) {
      return 'statistical';
    }
    
    // Historical claims
    if (/in \d{4}|during the|historically|in the past|years ago|century|decade/i.test(lowerText)) {
      return 'historical';
    }
    
    // Citations
    if (/according to|said|stated|reported|published|study by|research by/i.test(lowerText)) {
      return 'citation';
    }
    
    // Predictions
    if (/will be|will have|is going to|expect|forecast|predict|by \d{4}/i.test(lowerText)) {
      return 'prediction';
    }
    
    // Opinion markers
    if (/i think|i believe|in my opinion|i feel|should be|ought to|better than/i.test(lowerText)) {
      return 'opinion';
    }
    
    // Default to factual
    return 'factual';
  }

  /**
   * Generate search queries for a claim
   */
  private generateSearchQueries(claim: string, category: ClaimCategory): string[] {
    const queries: string[] = [claim];
    
    // Add category-specific queries
    switch (category) {
      case 'statistical':
        queries.push(`statistics ${claim}`);
        queries.push(`data ${claim} source`);
        break;
      case 'historical':
        queries.push(`history ${claim}`);
        queries.push(`${claim} facts timeline`);
        break;
      case 'citation':
        // Extract the quoted source if present
        const sourceMatch = claim.match(/according to ([^,]+)/i);
        if (sourceMatch) {
          queries.push(`${sourceMatch[1]} ${claim.replace(sourceMatch[0], '').trim()}`);
        }
        break;
      case 'factual':
      default:
        queries.push(`fact check ${claim}`);
        queries.push(`is it true ${claim}`);
        break;
    }
    
    return queries.slice(0, 3); // Limit to 3 queries per claim
  }

  /**
   * Search for verification sources using multiple queries
   */
  private async searchForSources(queries: string[]): Promise<VerificationSource[]> {
    const allSources: VerificationSource[] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      try {
        const sources = await findAuthoritativeSources(query);
        
        for (const source of sources) {
          if (!seenUrls.has(source.url)) {
            seenUrls.add(source.url);
            allSources.push({
              title: source.title,
              url: source.url,
              excerpt: source.content.substring(0, 300),
              authority: source.authority,
              relevance: source.score || 0.5,
              domain: this.extractDomain(source.url),
              sourceType: this.classifySource(source.url, source.authority)
            });
          }
        }
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }

    // Sort by authority and relevance
    return allSources.sort((a, b) => 
      (b.authority * 0.6 + b.relevance * 100 * 0.4) - 
      (a.authority * 0.6 + a.relevance * 100 * 0.4)
    );
  }

  /**
   * Create result for opinion/prediction claims (no verification needed)
   */
  private createOpinionResult(
    claim: { text: string; speaker: 'A' | 'B'; timestamp?: number },
    claimId: string,
    category: ClaimCategory,
    startTime: number
  ): EnhancedFactCheckResult {
    const isOpinion = category === 'opinion';
    
    return {
      claim: claim.text,
      claimId,
      speaker: claim.speaker,
      category,
      verdict: isOpinion ? 'OPINION' : 'PREDICTION',
      confidence: 1.0, // Opinions are definitionally what they are
      sources: [],
      explanation: isOpinion 
        ? 'This is an opinion statement and cannot be fact-checked.'
        : 'This is a prediction about future events and cannot be verified yet.',
      reasoning: isOpinion
        ? ['Statement contains opinion markers', 'Represents subjective viewpoint']
        : ['Statement makes predictions about future events', 'Cannot be verified until occurrence'],
      timestamp: claim.timestamp,
      quote: claim.text,
      verificationTime: Date.now() - startTime,
      searchQueries: []
    };
  }

  /**
   * Map LangChain verdict to our verdict type
   */
  private mapVerdict(
    verdict: string, 
    confidence: number
  ): EnhancedFactCheckResult['verdict'] {
    const v = verdict.toUpperCase();
    
    if (v === 'TRUE' && confidence >= this.config.minConfidenceThreshold) {
      return 'TRUE';
    }
    if (v === 'FALSE') {
      return 'FALSE';
    }
    if (v === 'MISLEADING') {
      return 'MISLEADING';
    }
    if (v === 'PARTIALLY_TRUE' || v === 'PARTIAL') {
      return 'PARTIALLY_TRUE';
    }
    
    // Low confidence = unverified
    if (confidence < this.config.minConfidenceThreshold) {
      return 'UNVERIFIED';
    }
    
    return 'UNVERIFIED';
  }

  /**
   * Extract reasoning steps from explanation
   */
  private extractReasoning(explanation: string): string[] {
    // Split on common delimiters
    const parts = explanation
      .split(/[.;]|(\d+\))/)
      .map(s => s?.trim())
      .filter(s => s && s.length > 10);
    
    return parts.length > 0 ? parts.slice(0, 5) : [explanation];
  }

  /**
   * Generate report from verification results
   */
  private generateReport(
    results: EnhancedFactCheckResult[],
    participantNames: { A: string; B?: string },
    metadata: FactVerificationReport['metadata']
  ): FactVerificationReport {
    // Count verdicts
    const verdictCounts = {
      verified: results.filter(r => r.verdict === 'TRUE').length,
      false: results.filter(r => r.verdict === 'FALSE').length,
      partiallyTrue: results.filter(r => r.verdict === 'PARTIALLY_TRUE').length,
      misleading: results.filter(r => r.verdict === 'MISLEADING').length,
      unverified: results.filter(r => r.verdict === 'UNVERIFIED').length,
      opinions: results.filter(r => r.verdict === 'OPINION').length,
      predictions: results.filter(r => r.verdict === 'PREDICTION').length
    };

    // Calculate truth density (excluding opinions and predictions)
    const factualClaims = results.filter(r => 
      r.verdict !== 'OPINION' && r.verdict !== 'PREDICTION'
    );
    const truthDensity = factualClaims.length > 0
      ? (verdictCounts.verified / factualClaims.length) * 100
      : 0;

    // Collect all sources
    const allSources = results.flatMap(r => r.sources);
    const uniqueUrls = new Set(allSources.map(s => s.url));

    // Calculate per-participant stats
    const participantBreakdown = this.calculateParticipantBreakdown(
      results, 
      participantNames
    );

    return {
      claims: results,
      summary: {
        totalClaims: results.length,
        verified: verdictCounts.verified,
        false: verdictCounts.false,
        partiallyTrue: verdictCounts.partiallyTrue,
        misleading: verdictCounts.misleading,
        unverified: verdictCounts.unverified,
        opinions: verdictCounts.opinions,
        predictions: verdictCounts.predictions,
        truthDensity,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        totalSources: allSources.length,
        uniqueSources: uniqueUrls.size
      },
      metadata,
      participantBreakdown
    };
  }

  /**
   * Calculate per-participant verification stats
   */
  private calculateParticipantBreakdown(
    results: EnhancedFactCheckResult[],
    participantNames: { A: string; B?: string }
  ): FactVerificationReport['participantBreakdown'] {
    const statsA = this.calculateParticipantStats(
      results.filter(r => r.speaker === 'A'),
      participantNames.A
    );

    const statsB = participantNames.B 
      ? this.calculateParticipantStats(
          results.filter(r => r.speaker === 'B'),
          participantNames.B
        )
      : undefined;

    return { A: statsA, B: statsB };
  }

  /**
   * Calculate stats for a single participant
   */
  private calculateParticipantStats(
    results: EnhancedFactCheckResult[],
    name: string
  ): ParticipantVerificationStats {
    const verified = results.filter(r => r.verdict === 'TRUE').length;
    const falseClaims = results.filter(r => r.verdict === 'FALSE').length;
    const partiallyTrue = results.filter(r => r.verdict === 'PARTIALLY_TRUE').length;
    const unverified = results.filter(r => r.verdict === 'UNVERIFIED').length;
    
    const factualClaims = results.filter(r => 
      r.verdict !== 'OPINION' && r.verdict !== 'PREDICTION'
    );
    const truthDensity = factualClaims.length > 0 
      ? (verified / factualClaims.length) * 100 
      : 0;

    // Get top sources by authority
    const allSources = results.flatMap(r => r.sources);
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );
    const topSources = uniqueSources
      .sort((a, b) => b.authority - a.authority)
      .slice(0, 5);

    return {
      name,
      totalClaims: results.length,
      verified,
      false: falseClaims,
      partiallyTrue,
      unverified,
      truthDensity,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length || 0,
      topSources
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private classifySource(url: string, authority: number): VerificationSource['sourceType'] {
    const domain = url.toLowerCase();
    
    if (domain.includes('.edu') || domain.includes('scholar.google')) {
      return 'academic';
    }
    if (domain.includes('.gov')) {
      return 'government';
    }
    if (['snopes.com', 'factcheck.org', 'politifact.com'].some(fc => domain.includes(fc))) {
      return 'factcheck';
    }
    if (authority >= 60) {
      return 'news';
    }
    return 'other';
  }

  private generateCacheKey(claim: string): string {
    // Simple hash for cache key
    return claim.toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 200);
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), timeoutMs)
      )
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear the verification cache
   */
  clearCache(): void {
    this.verificationCache.clear();
    console.log('🗑️ Fact verification cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; claims: string[] } {
    return {
      size: this.verificationCache.size,
      claims: Array.from(this.verificationCache.keys()).slice(0, 10)
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE & FACTORY
// ═══════════════════════════════════════════════════════════════

let serviceInstance: FactVerificationService | null = null;

export function getFactVerificationService(config?: Partial<VerificationConfig>): FactVerificationService {
  if (!serviceInstance || config) {
    serviceInstance = new FactVerificationService(config);
  }
  return serviceInstance;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR UI
// ═══════════════════════════════════════════════════════════════

export function getVerdictColorClass(verdict: EnhancedFactCheckResult['verdict']): string {
  switch (verdict) {
    case 'TRUE': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    case 'FALSE': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
    case 'PARTIALLY_TRUE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
    case 'MISLEADING': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
    case 'UNVERIFIED': return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
    case 'OPINION': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
    case 'PREDICTION': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
  }
}

export function getVerdictIcon(verdict: EnhancedFactCheckResult['verdict']): string {
  switch (verdict) {
    case 'TRUE': return '✓';
    case 'FALSE': return '✗';
    case 'PARTIALLY_TRUE': return '◐';
    case 'MISLEADING': return '⚠';
    case 'UNVERIFIED': return '?';
    case 'OPINION': return '💭';
    case 'PREDICTION': return '🔮';
    default: return '?';
  }
}

export function getSourceTypeIcon(type: VerificationSource['sourceType']): string {
  switch (type) {
    case 'academic': return '🎓';
    case 'government': return '🏛️';
    case 'news': return '📰';
    case 'factcheck': return '✓';
    case 'other': return '🔗';
    default: return '🔗';
  }
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}

export function formatVerificationDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
