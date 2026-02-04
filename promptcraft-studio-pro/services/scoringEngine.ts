// services/scoringEngine.ts
// Explicit Scoring Engine - Auditable TypeScript logic for debate scoring
// Phase 2 Implementation - January 12, 2026

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type FallacyType =
  | 'ad_hominem'
  | 'strawman'
  | 'slippery_slope'
  | 'false_dilemma'
  | 'appeal_to_authority'
  | 'hasty_generalization'
  | 'post_hoc'
  | 'red_herring'
  | 'circular_reasoning'
  | 'appeal_to_emotion'
  | 'bandwagon'
  | 'no_true_scotsman'
  | 'tu_quoque'
  | 'whataboutism'
  | 'false_equivalence'
  | 'loaded_question'
  | 'begging_the_question'
  | 'appeal_to_nature'
  | 'genetic_fallacy'
  | 'moving_goalposts';

export type ClaimCategory = 'factual' | 'opinion' | 'prediction' | 'citation' | 'statistical' | 'historical';
export type VerificationStatus = 'verified' | 'disputed' | 'unverifiable' | 'false' | 'partially_true';

export interface VerifiedClaim {
  id: string;
  text: string;
  speaker: 'A' | 'B';
  timestamp?: number;
  category: ClaimCategory;
  verificationStatus: VerificationStatus;
  confidence: number;        // 0-1 from fact-checking
  sources: string[];         // URLs or citations
  pointValue: number;        // Calculated points for this claim
  reasoning?: string;        // Why this verification status
}

export interface DetectedFallacy {
  id: string;
  type: FallacyType;
  speaker: 'A' | 'B';
  timestamp?: number;
  quote: string;             // Exact text from transcript
  explanation: string;       // Why this is a fallacy
  severity: number;          // 1-10 scale
  withinMarginOfError: boolean;  // True = penalty waived
  penalty: number;           // Calculated point deduction
}

export interface WSDCWeights {
  content: number;   // Logic, evidence, consistency (0-100)
  style: number;     // Rhetoric, clarity, delivery (0-100)
  strategy: number;  // Structure, refutation, time management (0-100)
}

export interface WSDCScores {
  content: number;   // 0-100 score
  style: number;     // 0-100 score
  strategy: number;  // 0-100 score
}

export interface PointValues {
  verifiedFact: number;      // Points for verified factual claim
  strongEvidence: number;    // Bonus for sourced evidence
  highConfidence: number;    // Bonus for high-confidence claims
  unverifiedClaim: number;   // Penalty for unverified factual claims
  falseClaim: number;        // Penalty for false claims
  contradiction: number;     // Penalty for self-contradiction
  fallacyMultiplier: number; // Multiplier per severity level
}

export interface ScoringConfig {
  marginOfError: number;     // 0-100 percent tolerance
  wsdcWeights: WSDCWeights;
  pointValues: PointValues;
  minScoreFloor: number;     // Minimum possible score (default: 0)
  tieThreshold: number;      // Point difference to declare tie (default: 5)
}

export interface ScoreBreakdown {
  positive: {
    verifiedFacts: { count: number; points: number; details: string[] };
    strongEvidence: { count: number; points: number; details: string[] };
    highConfidence: { count: number; points: number; details: string[] };
    subtotal: number;
  };
  negative: {
    fallacies: { count: number; points: number; details: DetectedFallacy[] };
    unverified: { count: number; points: number; details: string[] };
    falseClaims: { count: number; points: number; details: string[] };
    contradictions: { count: number; points: number; details: string[] };
    subtotal: number;
  };
  wsdcAdjusted: WSDCScores;
  wsdcBonus: number;
}

export interface ParticipantScore {
  participantId: 'A' | 'B';
  name: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  netScore: number;          // positive.subtotal - negative.subtotal
  marginOfErrorApplied: number;  // How many penalties were waived
  claimCount: number;
  fallacyCount: number;
  truthDensity: number;      // % of claims verified
}

export interface AnalysisResult {
  participantA: ParticipantScore;
  participantB?: ParticipantScore;  // Undefined for solo mode
  winner: 'A' | 'B' | 'TIE';
  winMargin: number;
  overallTruthDensity: number;  // % of all claims verified
  claims: VerifiedClaim[];
  fallacies: DetectedFallacy[];
  auditLog: AuditEntry[];
  timestamp: Date;
  config: ScoringConfig;
}

export interface AuditEntry {
  timestamp: string;
  category: 'claim' | 'fallacy' | 'score' | 'decision' | 'margin' | 'wsdc';
  message: string;
  data?: any;
}

export interface GeminiStructuredOutput {
  claims?: Array<{
    text: string;
    speaker: 'A' | 'B';
    verified?: boolean;
    confidence?: number;
    sources?: string[];
    category?: string;
    reasoning?: string;
  }>;
  fallacies?: Array<{
    type: string;
    speaker: 'A' | 'B';
    severity?: number;
    quote: string;
    explanation: string;
    timestamp?: number;
  }>;
  wsdcScores?: {
    A: { content: number; style: number; strategy: number };
    B?: { content: number; style: number; strategy: number };
  };
  gamification?: {
    winner?: 'A' | 'B' | 'TIE';
    points_a?: number;
    points_b?: number;
    truth_pot?: string;
    award?: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_POINT_VALUES: PointValues = {
  verifiedFact: 10,
  strongEvidence: 7,
  highConfidence: 5,
  unverifiedClaim: -8,
  falseClaim: -15,
  contradiction: -20,
  fallacyMultiplier: -5
};

export const DEFAULT_WSDC_WEIGHTS: WSDCWeights = {
  content: 40,
  style: 40,
  strategy: 20
};

export const DEFAULT_CONFIG: ScoringConfig = {
  marginOfError: 10,
  wsdcWeights: DEFAULT_WSDC_WEIGHTS,
  pointValues: DEFAULT_POINT_VALUES,
  minScoreFloor: 0,
  tieThreshold: 5
};

// ═══════════════════════════════════════════════════════════════
// FALLACY SEVERITY DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const FALLACY_BASE_SEVERITY: Record<FallacyType, number> = {
  ad_hominem: 7,
  strawman: 8,
  slippery_slope: 5,
  false_dilemma: 6,
  appeal_to_authority: 4,
  hasty_generalization: 6,
  post_hoc: 5,
  red_herring: 6,
  circular_reasoning: 7,
  appeal_to_emotion: 5,
  bandwagon: 4,
  no_true_scotsman: 6,
  tu_quoque: 5,
  whataboutism: 6,
  false_equivalence: 7,
  loaded_question: 5,
  begging_the_question: 7,
  appeal_to_nature: 4,
  genetic_fallacy: 5,
  moving_goalposts: 6
};

export const FALLACY_DISPLAY_NAMES: Record<FallacyType, string> = {
  ad_hominem: 'Ad Hominem',
  strawman: 'Strawman',
  slippery_slope: 'Slippery Slope',
  false_dilemma: 'False Dilemma',
  appeal_to_authority: 'Appeal to Authority',
  hasty_generalization: 'Hasty Generalization',
  post_hoc: 'Post Hoc',
  red_herring: 'Red Herring',
  circular_reasoning: 'Circular Reasoning',
  appeal_to_emotion: 'Appeal to Emotion',
  bandwagon: 'Bandwagon',
  no_true_scotsman: 'No True Scotsman',
  tu_quoque: 'Tu Quoque',
  whataboutism: 'Whataboutism',
  false_equivalence: 'False Equivalence',
  loaded_question: 'Loaded Question',
  begging_the_question: 'Begging the Question',
  appeal_to_nature: 'Appeal to Nature',
  genetic_fallacy: 'Genetic Fallacy',
  moving_goalposts: 'Moving the Goalposts'
};

// ═══════════════════════════════════════════════════════════════
// SCORING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

export class ScoringEngine {
  private config: ScoringConfig;
  private auditLog: AuditEntry[] = [];

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      wsdcWeights: { ...DEFAULT_WSDC_WEIGHTS, ...config.wsdcWeights },
      pointValues: { ...DEFAULT_POINT_VALUES, ...config.pointValues }
    };

    // Validate WSDC weights sum to 100
    const total = this.config.wsdcWeights.content + 
                  this.config.wsdcWeights.style + 
                  this.config.wsdcWeights.strategy;
    if (total !== 100) {
      console.warn(`WSDC weights sum to ${total}%, normalizing to 100%`);
      const factor = 100 / total;
      this.config.wsdcWeights.content *= factor;
      this.config.wsdcWeights.style *= factor;
      this.config.wsdcWeights.strategy *= factor;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SCORING FUNCTION
  // ═══════════════════════════════════════════════════════════════

  calculateScores(
    geminiOutput: GeminiStructuredOutput,
    participantNames: { A: string; B?: string }
  ): AnalysisResult {
    this.auditLog = [];
    this.log('score', 'Starting scoring calculation...');
    this.log('score', `Config: margin=${this.config.marginOfError}%, WSDC=${JSON.stringify(this.config.wsdcWeights)}`);

    // Process claims
    const claims = this.processClaims(geminiOutput.claims || []);
    this.log('claim', `Processed ${claims.length} claims`);

    // Process fallacies with margin-of-error logic
    const fallacies = this.processFallacies(geminiOutput.fallacies || []);
    const marginApplied = fallacies.filter(f => f.withinMarginOfError).length;
    this.log('fallacy', `Processed ${fallacies.length} fallacies (${marginApplied} within margin of error)`);

    // Calculate per-participant scores
    const scoreA = this.scoreParticipant(
      'A',
      participantNames.A,
      claims,
      fallacies,
      geminiOutput.wsdcScores?.A
    );

    const scoreB = participantNames.B
      ? this.scoreParticipant(
          'B',
          participantNames.B,
          claims,
          fallacies,
          geminiOutput.wsdcScores?.B
        )
      : undefined;

    // Determine winner
    const { winner, margin } = this.determineWinner(scoreA, scoreB);

    // Calculate overall truth density
    const verifiedCount = claims.filter(c => 
      c.verificationStatus === 'verified' || c.verificationStatus === 'partially_true'
    ).length;
    const overallTruthDensity = claims.length > 0 
      ? (verifiedCount / claims.length) * 100 
      : 0;

    this.log('decision', `Final result: ${winner} wins by ${margin.toFixed(1)} points`);
    this.log('score', `Overall truth density: ${overallTruthDensity.toFixed(1)}%`);

    return {
      participantA: scoreA,
      participantB: scoreB,
      winner,
      winMargin: margin,
      overallTruthDensity,
      claims,
      fallacies,
      auditLog: this.auditLog,
      timestamp: new Date(),
      config: this.config
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CLAIM PROCESSING
  // ═══════════════════════════════════════════════════════════════

  private processClaims(rawClaims: GeminiStructuredOutput['claims']): VerifiedClaim[] {
    if (!rawClaims) return [];

    return rawClaims.map((c, i) => {
      // Determine verification status from confidence and verified flag
      let status: VerificationStatus;
      if (c.verified === true) {
        status = c.confidence && c.confidence > 0.9 ? 'verified' : 'partially_true';
      } else if (c.verified === false) {
        status = c.confidence && c.confidence < 0.3 ? 'false' : 'disputed';
      } else {
        status = 'unverifiable';
      }

      // Calculate point value based on status
      let points = 0;
      const category = (c.category as ClaimCategory) || 'factual';

      if (status === 'verified') {
        points += this.config.pointValues.verifiedFact;
        if (c.sources && c.sources.length > 0) {
          points += this.config.pointValues.strongEvidence;
        }
        if (c.confidence && c.confidence > 0.9) {
          points += this.config.pointValues.highConfidence;
        }
      } else if (status === 'partially_true') {
        points += Math.floor(this.config.pointValues.verifiedFact * 0.6);
      } else if (status === 'false') {
        points = this.config.pointValues.falseClaim;
      } else if (status === 'unverifiable' && category === 'factual') {
        points = this.config.pointValues.unverifiedClaim;
      } else if (status === 'disputed') {
        points = Math.floor(this.config.pointValues.unverifiedClaim * 0.5);
      }

      const claim: VerifiedClaim = {
        id: `claim-${i + 1}`,
        text: c.text,
        speaker: c.speaker,
        category,
        verificationStatus: status,
        confidence: c.confidence || 0.5,
        sources: c.sources || [],
        pointValue: points,
        reasoning: c.reasoning
      };

      this.log('claim', `[${claim.speaker}] "${claim.text.substring(0, 50)}..." → ${status} (${points > 0 ? '+' : ''}${points} pts)`);

      return claim;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FALLACY PROCESSING
  // ═══════════════════════════════════════════════════════════════

  private processFallacies(rawFallacies: GeminiStructuredOutput['fallacies']): DetectedFallacy[] {
    if (!rawFallacies) return [];

    return rawFallacies.map((f, i) => {
      // Normalize fallacy type
      const type = this.normalizeFallacyType(f.type);
      
      // Get severity (use provided or default based on type)
      const baseSeverity = FALLACY_BASE_SEVERITY[type] || 5;
      const severity = Math.min(10, Math.max(1, f.severity || baseSeverity));

      // Check if within margin of error (lower severity fallacies can be forgiven)
      const withinMargin = severity <= (this.config.marginOfError / 10);

      // Calculate penalty
      const penalty = withinMargin
        ? 0
        : severity * Math.abs(this.config.pointValues.fallacyMultiplier);

      if (withinMargin) {
        this.log('margin', `Fallacy "${FALLACY_DISPLAY_NAMES[type]}" (severity ${severity}) forgiven - within ${this.config.marginOfError}% margin`);
      }

      const fallacy: DetectedFallacy = {
        id: `fallacy-${i + 1}`,
        type,
        speaker: f.speaker,
        timestamp: f.timestamp,
        quote: f.quote,
        explanation: f.explanation,
        severity,
        withinMarginOfError: withinMargin,
        penalty
      };

      this.log('fallacy', `[${fallacy.speaker}] ${FALLACY_DISPLAY_NAMES[type]} (sev ${severity}) → ${withinMargin ? 'WAIVED' : `-${penalty} pts`}`);

      return fallacy;
    });
  }

  private normalizeFallacyType(type: string): FallacyType {
    // Convert to snake_case and match against known types
    const normalized = type.toLowerCase().replace(/[\s-]+/g, '_');
    
    if (normalized in FALLACY_BASE_SEVERITY) {
      return normalized as FallacyType;
    }

    // Try to match partial names
    const typeMap: Record<string, FallacyType> = {
      'ad_hom': 'ad_hominem',
      'straw': 'strawman',
      'slippery': 'slippery_slope',
      'false_dichotomy': 'false_dilemma',
      'black_white': 'false_dilemma',
      'authority': 'appeal_to_authority',
      'hasty': 'hasty_generalization',
      'generalization': 'hasty_generalization',
      'post': 'post_hoc',
      'after_therefore': 'post_hoc',
      'red': 'red_herring',
      'herring': 'red_herring',
      'circular': 'circular_reasoning',
      'emotion': 'appeal_to_emotion',
      'emotional': 'appeal_to_emotion',
      'bandwagon': 'bandwagon',
      'popularity': 'bandwagon',
      'scotsman': 'no_true_scotsman',
      'tu': 'tu_quoque',
      'you_too': 'tu_quoque',
      'whatabout': 'whataboutism',
      'equivalence': 'false_equivalence',
      'loaded': 'loaded_question',
      'begging': 'begging_the_question',
      'nature': 'appeal_to_nature',
      'natural': 'appeal_to_nature',
      'genetic': 'genetic_fallacy',
      'goalpost': 'moving_goalposts',
      'goalposts': 'moving_goalposts'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    // Default to ad_hominem if unknown
    console.warn(`Unknown fallacy type: ${type}, defaulting to ad_hominem`);
    return 'ad_hominem';
  }

  // ═══════════════════════════════════════════════════════════════
  // PARTICIPANT SCORING
  // ═══════════════════════════════════════════════════════════════

  private scoreParticipant(
    id: 'A' | 'B',
    name: string,
    claims: VerifiedClaim[],
    fallacies: DetectedFallacy[],
    wsdcScores?: WSDCScores
  ): ParticipantScore {
    const myClaims = claims.filter(c => c.speaker === id);
    const myFallacies = fallacies.filter(f => f.speaker === id);

    // ═══════════════════════════════════════════════════════════════
    // POSITIVE SCORING
    // ═══════════════════════════════════════════════════════════════

    const verifiedClaims = myClaims.filter(c => 
      c.verificationStatus === 'verified' || c.verificationStatus === 'partially_true'
    );
    const verifiedPoints = verifiedClaims.reduce((sum, c) => sum + Math.max(0, c.pointValue), 0);
    const verifiedDetails = verifiedClaims.map(c => `"${c.text.substring(0, 40)}..." (+${c.pointValue})`);

    const evidencedClaims = myClaims.filter(c => c.sources.length > 0 && c.verificationStatus === 'verified');
    const evidencePoints = evidencedClaims.length * this.config.pointValues.strongEvidence;
    const evidenceDetails = evidencedClaims.map(c => `"${c.text.substring(0, 40)}..." (${c.sources.length} sources)`);

    const highConfClaims = myClaims.filter(c => c.confidence > 0.9 && c.verificationStatus === 'verified');
    const confPoints = highConfClaims.length * this.config.pointValues.highConfidence;
    const confDetails = highConfClaims.map(c => `"${c.text.substring(0, 40)}..." (${(c.confidence * 100).toFixed(0)}%)`);

    const positiveSubtotal = verifiedPoints + evidencePoints + confPoints;

    // ═══════════════════════════════════════════════════════════════
    // NEGATIVE SCORING
    // ═══════════════════════════════════════════════════════════════

    const fallacyPenalty = myFallacies.reduce((sum, f) => sum + f.penalty, 0);

    const unverifiedClaims = myClaims.filter(c => 
      c.verificationStatus === 'unverifiable' && c.category === 'factual'
    );
    const unverifiedPenalty = unverifiedClaims.reduce((sum, c) => sum + Math.abs(c.pointValue), 0);
    const unverifiedDetails = unverifiedClaims.map(c => `"${c.text.substring(0, 40)}..."`);

    const falseClaims = myClaims.filter(c => c.verificationStatus === 'false');
    const falsePenalty = falseClaims.reduce((sum, c) => sum + Math.abs(c.pointValue), 0);
    const falseDetails = falseClaims.map(c => `"${c.text.substring(0, 40)}..." (FALSE)`);

    const negativeSubtotal = fallacyPenalty + unverifiedPenalty + falsePenalty;

    // ═══════════════════════════════════════════════════════════════
    // WSDC ADJUSTMENT
    // ═══════════════════════════════════════════════════════════════

    const wsdcAdjusted: WSDCScores = wsdcScores || { content: 50, style: 50, strategy: 50 };
    
    // Calculate weighted WSDC bonus (normalized to 0-10 range)
    const wsdcBonus = (
      (wsdcAdjusted.content * this.config.wsdcWeights.content / 100) +
      (wsdcAdjusted.style * this.config.wsdcWeights.style / 100) +
      (wsdcAdjusted.strategy * this.config.wsdcWeights.strategy / 100)
    ) / 10;

    this.log('wsdc', `${name} WSDC: C=${wsdcAdjusted.content} S=${wsdcAdjusted.style} St=${wsdcAdjusted.strategy} → +${wsdcBonus.toFixed(1)} bonus`);

    // ═══════════════════════════════════════════════════════════════
    // FINAL CALCULATION
    // ═══════════════════════════════════════════════════════════════

    const netScore = positiveSubtotal - negativeSubtotal;
    const totalScore = Math.max(this.config.minScoreFloor, netScore + wsdcBonus);

    // Calculate truth density for this participant
    const truthDensity = myClaims.length > 0
      ? (verifiedClaims.length / myClaims.length) * 100
      : 0;

    const marginApplied = myFallacies.filter(f => f.withinMarginOfError).length;

    this.log('score', `${name} (${id}): +${positiveSubtotal} -${negativeSubtotal} +${wsdcBonus.toFixed(1)} WSDC = ${totalScore.toFixed(1)}`);

    return {
      participantId: id,
      name,
      totalScore,
      breakdown: {
        positive: {
          verifiedFacts: { count: verifiedClaims.length, points: verifiedPoints, details: verifiedDetails },
          strongEvidence: { count: evidencedClaims.length, points: evidencePoints, details: evidenceDetails },
          highConfidence: { count: highConfClaims.length, points: confPoints, details: confDetails },
          subtotal: positiveSubtotal
        },
        negative: {
          fallacies: { count: myFallacies.length, points: fallacyPenalty, details: myFallacies },
          unverified: { count: unverifiedClaims.length, points: unverifiedPenalty, details: unverifiedDetails },
          falseClaims: { count: falseClaims.length, points: falsePenalty, details: falseDetails },
          contradictions: { count: 0, points: 0, details: [] },  // TODO: Implement contradiction detection
          subtotal: negativeSubtotal
        },
        wsdcAdjusted,
        wsdcBonus
      },
      netScore,
      marginOfErrorApplied: marginApplied,
      claimCount: myClaims.length,
      fallacyCount: myFallacies.length,
      truthDensity
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // WINNER DETERMINATION
  // ═══════════════════════════════════════════════════════════════

  private determineWinner(
    scoreA: ParticipantScore,
    scoreB?: ParticipantScore
  ): { winner: 'A' | 'B' | 'TIE'; margin: number } {
    if (!scoreB) {
      this.log('decision', `Solo mode - ${scoreA.name} scored ${scoreA.totalScore.toFixed(1)} points`);
      return { winner: 'A', margin: scoreA.totalScore };
    }

    const diff = scoreA.totalScore - scoreB.totalScore;

    if (Math.abs(diff) < this.config.tieThreshold) {
      this.log('decision', `Scores within ${this.config.tieThreshold} points - declaring TIE (${scoreA.totalScore.toFixed(1)} vs ${scoreB.totalScore.toFixed(1)})`);
      return { winner: 'TIE', margin: Math.abs(diff) };
    }

    const winner = diff > 0 ? 'A' : 'B';
    this.log('decision', `${winner === 'A' ? scoreA.name : scoreB.name} wins by ${Math.abs(diff).toFixed(1)} points`);

    return {
      winner,
      margin: Math.abs(diff)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check if a numerical claim is within margin of error
   */
  isWithinMargin(claimed: number, actual: number): boolean {
    if (actual === 0) return claimed === 0;
    const percentDiff = Math.abs((claimed - actual) / actual) * 100;
    const result = percentDiff <= this.config.marginOfError;
    
    if (result) {
      this.log('margin', `Value ${claimed} within ${this.config.marginOfError}% of ${actual} (diff: ${percentDiff.toFixed(1)}%)`);
    }
    
    return result;
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      wsdcWeights: { ...this.config.wsdcWeights, ...newConfig.wsdcWeights },
      pointValues: { ...this.config.pointValues, ...newConfig.pointValues }
    };
    this.log('score', `Config updated: ${JSON.stringify(newConfig)}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  private log(category: AuditEntry['category'], message: string, data?: any): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    this.auditLog.push({ timestamp, category, message, data });
    console.log(`[${timestamp}] [${category.toUpperCase()}] ${message}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATIC FACTORY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a scoring engine with preset configurations
   */
  static create(preset: 'strict' | 'balanced' | 'lenient' = 'balanced'): ScoringEngine {
    const presets: Record<string, Partial<ScoringConfig>> = {
      strict: {
        marginOfError: 5,
        tieThreshold: 3,
        pointValues: {
          ...DEFAULT_POINT_VALUES,
          unverifiedClaim: -12,
          falseClaim: -25,
          fallacyMultiplier: -8
        }
      },
      balanced: {
        marginOfError: 10,
        tieThreshold: 5,
        pointValues: DEFAULT_POINT_VALUES
      },
      lenient: {
        marginOfError: 20,
        tieThreshold: 10,
        pointValues: {
          ...DEFAULT_POINT_VALUES,
          unverifiedClaim: -4,
          falseClaim: -10,
          fallacyMultiplier: -3
        }
      }
    };

    return new ScoringEngine(presets[preset]);
  }

  /**
   * Create from user settings (e.g., from AnalysisStudio state)
   */
  static fromUserSettings(settings: {
    marginOfError: number;
    wsdcWeights: WSDCWeights;
  }): ScoringEngine {
    return new ScoringEngine({
      marginOfError: settings.marginOfError,
      wsdcWeights: settings.wsdcWeights
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
}

/**
 * Format audit log for display
 */
export function formatAuditLog(log: AuditEntry[]): string {
  return log.map(entry => `[${entry.timestamp}] ${entry.message}`).join('\n');
}

/**
 * Get color class for score
 */
export function getScoreColorClass(score: number): string {
  if (score >= 50) return 'text-green-600 dark:text-green-400';
  if (score >= 25) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 0) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get severity color class for fallacies
 */
export function getSeverityColorClass(severity: number): string {
  if (severity <= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (severity <= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

export const scoringEngine = new ScoringEngine();
