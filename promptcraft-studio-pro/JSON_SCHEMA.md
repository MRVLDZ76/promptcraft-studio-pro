# Structured JSON Output Schema

## Overview

The AI Arbiter MUST return structured JSON for guaranteed parsing and database persistence. This document defines the exact schema and validation rules.

---

## JSON Response Schema

```typescript
interface DebateAnalysisResponse {
  gamification: {
    winner: "A" | "B" | "TIE";
    points_a: number;        // 0-100 scale
    points_b: number;        // 0-100 scale
    truth_pot: string;       // e.g., "$5000"
    followers_a: string;     // e.g., "+1500"
    followers_b: string;     // e.g., "+800"
    award: string;           // e.g., "Master of Warrants"
  };
  
  scores: {
    content: {
      a: number;             // 0 to wsdcWeights.content
      b: number;             // 0 to wsdcWeights.content
    };
    style: {
      a: number;             // 0 to wsdcWeights.style
      b: number;             // 0 to wsdcWeights.style
    };
    strategy: {
      a: number;             // 0 to wsdcWeights.strategy
      b: number;             // 0 to wsdcWeights.strategy
    };
    total: {
      a: number;             // Sum of content.a + style.a + strategy.a
      b: number;             // Sum of content.b + style.b + strategy.b
    };
  };
  
  argument_nodes: ArgumentNode[];
  temporal_scores: TemporalScore[];
  final_verdict: FinalVerdict;
  chain_of_thought?: string;  // Optional reasoning trace
}

interface ArgumentNode {
  id: string;                         // e.g., "arg_001"
  timestamp_in: number;               // Start time in seconds
  timestamp_out: number;              // End time in seconds
  speaker_id: "A" | "B";              // Which participant
  claim_text_short: string;           // Max 7 words
  claim_text_full: string;            // Complete argument
  toulmin_component: ToulminComponent;
  logic_status: LogicStatus;
  fallacy_type: FallacyType | null;
  score_impact: number;               // Points added/deducted
}

enum ToulminComponent {
  CLAIM = "CLAIM",
  GROUNDS = "GROUNDS",
  WARRANT = "WARRANT",
  BACKING = "BACKING",
  QUALIFIER = "QUALIFIER",
  REBUTTAL = "REBUTTAL"
}

enum LogicStatus {
  VALID = "VALID",
  FALLACY = "FALLACY",
  WEAK_EVIDENCE = "WEAK_EVIDENCE",
  CONTRADICTION = "CONTRADICTION"
}

enum FallacyType {
  AD_HOMINEM = "Ad Hominem",
  STRAWMAN = "Strawman",
  SLIPPERY_SLOPE = "Slippery Slope",
  FALSE_DILEMMA = "False Dilemma",
  APPEAL_TO_AUTHORITY = "Appeal to Authority",
  HASTY_GENERALIZATION = "Hasty Generalization",
  POST_HOC = "Post Hoc",
  RED_HERRING = "Red Herring",
  CIRCULAR_REASONING = "Circular Reasoning",
  APPEAL_TO_EMOTION = "Appeal to Emotion",
  BANDWAGON = "Bandwagon",
  NO_TRUE_SCOTSMAN = "No True Scotsman"
}

interface TemporalScore {
  timestamp: number;               // Seconds from start
  participant_a_score: number;     // Running total
  participant_b_score: number;     // Running total
  momentum: "GAINING" | "LOSING" | "STABLE";
}

interface FinalVerdict {
  summary: string;
  key_fallacies: string[];
  strongest_argument: string;
  weakest_argument: string;
}
```

---

## Validation Rules

### 1. WSDC Score Constraints
```typescript
// Given wsdcWeights = { content: 40, style: 40, strategy: 20 }

// Each participant's scores MUST NOT exceed weight limits:
scores.content.a <= wsdcWeights.content    // e.g., a ≤ 40
scores.content.b <= wsdcWeights.content    // e.g., b ≤ 40
scores.style.a <= wsdcWeights.style        // e.g., a ≤ 40
scores.style.b <= wsdcWeights.style        // e.g., b ≤ 40
scores.strategy.a <= wsdcWeights.strategy  // e.g., a ≤ 20
scores.strategy.b <= wsdcWeights.strategy  // e.g., b ≤ 20

// Totals MUST equal sum of components:
scores.total.a === scores.content.a + scores.style.a + scores.strategy.a
scores.total.b === scores.content.b + scores.style.b + scores.strategy.b

// Winner determined by total scores:
if (scores.total.a > scores.total.b) gamification.winner = "A"
else if (scores.total.b > scores.total.a) gamification.winner = "B"
else gamification.winner = "TIE"
```

### 2. Argument Node Constraints
```typescript
// Timestamps must be sequential:
argument_nodes[i].timestamp_in < argument_nodes[i].timestamp_out
argument_nodes[i].timestamp_out <= argument_nodes[i+1].timestamp_in

// Claim text constraints:
claim_text_short.split(' ').length <= 7
claim_text_full.length >= 20

// Fallacy type only present when logic_status = "FALLACY":
if (logic_status === "FALLACY") fallacy_type !== null
else fallacy_type === null
```

### 3. Temporal Score Constraints
```typescript
// Timestamps ascending:
temporal_scores[i].timestamp < temporal_scores[i+1].timestamp

// Scores non-negative:
participant_a_score >= 0
participant_b_score >= 0

// Momentum calculated from previous score:
const delta = current_score - previous_score
if (delta > 2) momentum = "GAINING"
else if (delta < -2) momentum = "LOSING"
else momentum = "STABLE"
```

---

## Example Valid Response

```json
{
  "gamification": {
    "winner": "A",
    "points_a": 85,
    "points_b": 72,
    "truth_pot": "$5000",
    "followers_a": "+1500",
    "followers_b": "+800",
    "award": "Master of Warrants"
  },
  "scores": {
    "content": { "a": 35, "b": 30 },
    "style": { "a": 32, "b": 28 },
    "strategy": { "a": 18, "b": 14 },
    "total": { "a": 85, "b": 72 }
  },
  "argument_nodes": [
    {
      "id": "arg_001",
      "timestamp_in": 0.0,
      "timestamp_out": 15.5,
      "speaker_id": "A",
      "claim_text_short": "AI will eliminate jobs",
      "claim_text_full": "Artificial intelligence will inevitably lead to widespread unemployment across multiple sectors, particularly in manufacturing and service industries.",
      "toulmin_component": "CLAIM",
      "logic_status": "VALID",
      "fallacy_type": null,
      "score_impact": 5
    },
    {
      "id": "arg_002",
      "timestamp_in": 15.5,
      "timestamp_out": 30.2,
      "speaker_id": "B",
      "claim_text_short": "AI creates new opportunities",
      "claim_text_full": "While AI may displace some jobs, history shows technology creates more jobs than it destroys, as seen with the internet revolution.",
      "toulmin_component": "REBUTTAL",
      "logic_status": "VALID",
      "fallacy_type": null,
      "score_impact": 4
    },
    {
      "id": "arg_003",
      "timestamp_in": 30.2,
      "timestamp_out": 45.8,
      "speaker_id": "A",
      "claim_text_short": "Opponent is a tech optimist",
      "claim_text_full": "My opponent is clearly a naive tech optimist who ignores the suffering of displaced workers.",
      "toulmin_component": "REBUTTAL",
      "logic_status": "FALLACY",
      "fallacy_type": "Ad Hominem",
      "score_impact": -3
    }
  ],
  "temporal_scores": [
    {
      "timestamp": 15,
      "participant_a_score": 5,
      "participant_b_score": 0,
      "momentum": "GAINING"
    },
    {
      "timestamp": 30,
      "participant_a_score": 5,
      "participant_b_score": 4,
      "momentum": "GAINING"
    },
    {
      "timestamp": 45,
      "participant_a_score": 2,
      "participant_b_score": 4,
      "momentum": "LOSING"
    }
  ],
  "final_verdict": {
    "summary": "Participant A won with stronger evidence-based arguments and superior strategic framing, despite one ad hominem fallacy. Participant B had solid rebuttals but weaker factual grounding.",
    "key_fallacies": ["Ad Hominem by Participant A at 30s"],
    "strongest_argument": "AI job displacement statistics (Participant A)",
    "weakest_argument": "Tech optimism without data (Participant B)"
  },
  "chain_of_thought": "Initial impression: A has stronger opening claim with specific examples. B counters with historical analogy but lacks concrete data. A's ad hominem at 30s is a major deduction (-3 points) but recovers with evidence. Final calculation: A (35+32+18=85) vs B (30+28+14=72). Winner: A."
}
```

---

## Implementation in Gemini API

### Method 1: Structured Output (Recommended)

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        gamification: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING, enum: ["A", "B", "TIE"] },
            points_a: { type: Type.NUMBER },
            points_b: { type: Type.NUMBER },
            truth_pot: { type: Type.STRING },
            followers_a: { type: Type.STRING },
            followers_b: { type: Type.STRING },
            award: { type: Type.STRING }
          },
          required: ["winner", "points_a", "points_b"]
        },
        scores: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.OBJECT,
              properties: {
                a: { type: Type.NUMBER },
                b: { type: Type.NUMBER }
              }
            },
            style: {
              type: Type.OBJECT,
              properties: {
                a: { type: Type.NUMBER },
                b: { type: Type.NUMBER }
              }
            },
            strategy: {
              type: Type.OBJECT,
              properties: {
                a: { type: Type.NUMBER },
                b: { type: Type.NUMBER }
              }
            },
            total: {
              type: Type.OBJECT,
              properties: {
                a: { type: Type.NUMBER },
                b: { type: Type.NUMBER }
              }
            }
          },
          required: ["content", "style", "strategy", "total"]
        },
        argument_nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              timestamp_in: { type: Type.NUMBER },
              timestamp_out: { type: Type.NUMBER },
              speaker_id: { type: Type.STRING, enum: ["A", "B"] },
              claim_text_short: { type: Type.STRING },
              claim_text_full: { type: Type.STRING },
              toulmin_component: { 
                type: Type.STRING, 
                enum: ["CLAIM", "GROUNDS", "WARRANT", "BACKING", "QUALIFIER", "REBUTTAL"] 
              },
              logic_status: { 
                type: Type.STRING, 
                enum: ["VALID", "FALLACY", "WEAK_EVIDENCE", "CONTRADICTION"] 
              },
              fallacy_type: { 
                type: Type.STRING,
                nullable: true
              },
              score_impact: { type: Type.NUMBER }
            }
          }
        },
        temporal_scores: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: { type: Type.NUMBER },
              participant_a_score: { type: Type.NUMBER },
              participant_b_score: { type: Type.NUMBER },
              momentum: { type: Type.STRING, enum: ["GAINING", "LOSING", "STABLE"] }
            }
          }
        },
        final_verdict: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            key_fallacies: { type: Type.ARRAY, items: { type: Type.STRING } },
            strongest_argument: { type: Type.STRING },
            weakest_argument: { type: Type.STRING }
          }
        },
        chain_of_thought: { type: Type.STRING }
      },
      required: ["gamification", "scores", "argument_nodes", "temporal_scores", "final_verdict"]
    }
  }
});
```

### Method 2: JSON Mode with Markers (Fallback)

```javascript
const prompt = `
... your prompt ...

CRITICAL: Wrap your response in markers:
JSON_OUTPUT_START
{your JSON here}
JSON_OUTPUT_END

No text outside these markers.
`;

// Parse response:
const match = responseText.match(/JSON_OUTPUT_START\s*([\s\S]*?)\s*JSON_OUTPUT_END/);
if (match) {
  const jsonResponse = JSON.parse(match[1]);
}
```

---

## Error Handling

### Frontend Parsing

```typescript
function parseAnalysisResponse(rawText: string): DebateAnalysisResponse {
  try {
    // Try direct JSON parse
    return JSON.parse(rawText);
  } catch (e1) {
    try {
      // Try extracting from markdown
      const match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch (e2) {
      try {
        // Try extracting from markers
        const match = rawText.match(/JSON_OUTPUT_START\s*([\s\S]*?)\s*JSON_OUTPUT_END/);
        if (match) {
          return JSON.parse(match[1]);
        }
      } catch (e3) {
        throw new Error('Failed to parse JSON response from LLM');
      }
    }
  }
  
  throw new Error('Invalid response format');
}
```

### Backend Validation

```javascript
function validateResponse(data: any): { valid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!data.gamification) errors.push('Missing gamification object');
  if (!data.scores) errors.push('Missing scores object');
  if (!data.argument_nodes) errors.push('Missing argument_nodes array');
  
  // Validate WSDC constraints
  const { content, style, strategy } = data.scores;
  if (content.a + style.a + strategy.a !== data.scores.total.a) {
    errors.push(`Total score A mismatch: ${content.a}+${style.a}+${strategy.a} ≠ ${data.scores.total.a}`);
  }
  
  // Validate winner determination
  const expectedWinner = 
    data.scores.total.a > data.scores.total.b ? 'A' :
    data.scores.total.b > data.scores.total.a ? 'B' : 'TIE';
  if (data.gamification.winner !== expectedWinner) {
    errors.push(`Winner should be ${expectedWinner} based on scores`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('JSON Schema Validation', () => {
  it('should validate correct response', () => {
    const response = {
      gamification: { winner: 'A', points_a: 85, points_b: 72, truth_pot: '$5000', followers_a: '+1500', followers_b: '+800', award: 'Master' },
      scores: { 
        content: { a: 35, b: 30 }, 
        style: { a: 32, b: 28 }, 
        strategy: { a: 18, b: 14 }, 
        total: { a: 85, b: 72 } 
      },
      argument_nodes: [],
      temporal_scores: [],
      final_verdict: { summary: 'A won', key_fallacies: [], strongest_argument: 'X', weakest_argument: 'Y' }
    };
    
    const result = validateResponse(response);
    expect(result.valid).toBe(true);
  });
  
  it('should reject mismatched total scores', () => {
    const response = {
      gamification: { winner: 'A', points_a: 85, points_b: 72, truth_pot: '$5000', followers_a: '+1500', followers_b: '+800', award: 'Master' },
      scores: { 
        content: { a: 35, b: 30 }, 
        style: { a: 32, b: 28 }, 
        strategy: { a: 18, b: 14 }, 
        total: { a: 90, b: 72 }  // WRONG: 35+32+18=85, not 90
      },
      argument_nodes: [],
      temporal_scores: [],
      final_verdict: { summary: 'A won', key_fallacies: [], strongest_argument: 'X', weakest_argument: 'Y' }
    };
    
    const result = validateResponse(response);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Total score A mismatch');
  });
});
```

---

## Next Steps

1. **Integrate responseSchema** into `geminiService.ts`
2. **Add validation function** to frontend and backend
3. **Test with 10+ sample debates** to ensure consistency
4. **Log malformed responses** for debugging
5. **Implement retry logic** if JSON parsing fails

---

**Last Updated:** 2026-01-19  
**Version:** 1.0  
**Status:** Ready for Production
