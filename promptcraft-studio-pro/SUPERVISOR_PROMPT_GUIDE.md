# Supervisor Prompt - RAG Intelligence Director

## Overview
The **Supervisor Intelligence Directive** is the main orchestration layer for the Knowledge Ingestion system. It dynamically configures calibration parameters and directs how the RAG (Retrieval-Augmented Generation) system integrates with the analysis.

## Location
**Knowledge Ingestion** section → First prominent field (blue gradient background)

## Purpose

The Supervisor Prompt acts as the **meta-intelligence** that:

1. **Directs RAG Integration** - Controls how reference URLs and uploaded files are processed
2. **Configures Calibration** - Dynamically influences region, year, demography, persona, and logic style
3. **Synthesizes Context** - Merges knowledge sources with calibration parameters
4. **Adapts Analysis** - Adjusts analytical approach based on available knowledge

## How It Works

### Data Flow

```
Supervisor Prompt
      ↓
   Merges with
      ↓
System Instruction + Calibration Context
      ↓
Enhanced System Instruction = 
    Supervisor Directive + 
    System Instruction + 
    "Calibration Context: Region=X, Year=Y, Demography=Z..."
      ↓
Sent to Gemini API with RAG URLs and Files
      ↓
Generates Contextually-Aware Analysis
```

### Code Implementation

```typescript
// Enhanced system instruction merges three components
const enhancedSystemInstruction = `
  ${supervisorPrompt}
  
  ${systemPrompt}
  
  Calibration Context: Region=${country}, Year=${year}, 
                       Demography=${demography}, Persona=${persona}, 
                       Logic Style=${logicStyle}
`;
```

## Example Use Cases

### 1. Scientific Rigor (Default)
```
Analyze the debate through the lens of scientific rigor and empirical evidence. 
Cross-reference claims against provided knowledge sources. 
Calibrate judgment based on regional epistemic standards and temporal context.
```

**Effect:**
- Prioritizes empirical evidence from RAG sources
- Adjusts for regional scientific standards
- Considers temporal evolution of knowledge

### 2. Legal Framework Analysis
```
Evaluate arguments using legal precedent and statutory interpretation. 
Cross-reference claims with case law and legislation from provided URLs. 
Adapt reasoning to the jurisdiction's legal tradition (common law vs. civil law). 
Weight authority of sources by judicial hierarchy.
```

**Effect:**
- RAG system prioritizes legal documents
- Calibration adapts to regional legal systems (USA, EU, etc.)
- Evidence weighting follows judicial hierarchy

### 3. Cultural Contextualization
```
Analyze debate considering cultural norms and historical context of the specified region. 
Use provided knowledge sources to understand local perspectives and values. 
Adjust rhetorical standards based on target demography and communication styles 
prevalent in the specified year.
```

**Effect:**
- RAG sources provide cultural context
- Region and year calibration becomes primary
- Demography influences interpretation style

### 4. Technical/Engineering Focus
```
Evaluate technical claims using engineering standards and peer-reviewed research. 
Cross-reference specifications against industry standards from provided documentation. 
Apply margin of error analysis from calibration settings to quantitative claims. 
Prioritize reproducibility and empirical verification.
```

**Effect:**
- RAG sources must be technical specifications
- Margin of error slider directly affects judgment
- Logic style should be "Elite Peer Review"

### 5. Economic Impact Analysis
```
Assess arguments through economic theory and empirical market data. 
Integrate GDP, inflation, and economic indicators from provided URLs. 
Calibrate for regional economic systems (capitalist, mixed, planned). 
Consider stakeholder perspectives based on demographic wealth distribution.
```

**Effect:**
- RAG URLs should include economic databases
- Region influences economic model assumptions
- Stakeholder mode becomes critical calibration

## Dynamic Calibration

The supervisor prompt can **reference and modify** calibration parameters:

### Direct References
```
Given the target demography is ${demography}, adjust technical jargon levels accordingly.
In the context of ${country} legal frameworks from ${year}, evaluate precedent validity.
Apply ${logicStyle} standards when assessing argument structure.
```

### Adaptive Logic
```
If region is "EU", prioritize precautionary principle in risk assessment.
If year >= 2023, account for post-pandemic economic shifts.
If demography includes "Gen Z", consider social media evidence validity.
```

### Weight Redistribution
```
For scientific peer review persona, increase evidence weight to 60% at expense of rhetoric.
For general public demography, balance logic/evidence/rhetoric equally.
```

## Integration with RAG System

### Reference URLs
The supervisor prompt determines **how** URLs are used:

```
Treat URLs as authoritative sources. Extract key statistics and quotes.
Weight claims proportional to source credibility ranking.
```

vs.

```
Use URLs for background context only. Prioritize video content analysis.
Cross-reference URL data for fact-checking but don't over-weight external sources.
```

### Context Files
The supervisor prompt defines file processing strategy:

```
Transcripts (.vtt): Extract dialogue for direct quote verification.
PDFs: Index as reference knowledge base, prioritize sections matching argument topics.
Text files: Treat as supplementary context, don't override video analysis.
```

## Best Practices

### 1. Be Specific About RAG Usage
❌ **Vague:** "Use the provided sources to help with analysis."
✅ **Specific:** "Cross-reference every factual claim against provided URLs. Flag unsupported claims. Quote source URLs in the output."

### 2. Reference Calibration Parameters
❌ **Static:** "Analyze using scientific methods."
✅ **Dynamic:** "Apply scientific rigor calibrated for ${country}'s research standards in ${year}. Adjust for ${demography} literacy level."

### 3. Define Knowledge Hierarchy
❌ **Unclear:** "Consider all sources equally."
✅ **Structured:** "Priority order: 1) Peer-reviewed sources from URLs, 2) Video content claims, 3) Uploaded transcripts as supporting context."

### 4. Specify Output Formatting
❌ **Generic:** "Provide analysis."
✅ **Directed:** "Output should cite source URLs inline [URL:1], highlight contradictions, and provide confidence scores adjusted by margin of error setting (${marginOfError}%)."

## Advanced Patterns

### Conditional Logic
```
IF region is "China" OR region is "EU":
  Apply stricter data privacy standards when evaluating surveillance arguments.
ELSE IF region is "USA":
  Reference First Amendment considerations for speech-related debates.
```

### Temporal Adaptation
```
For years 2020-2022: Account for COVID-19 pandemic context in health/economic arguments.
For years 2023+: Consider AI advancement impact on technology and employment claims.
For year 2030+: Apply predictive/speculative analysis mode with higher uncertainty.
```

### Demographic Tuning
```
Experts/Peer Reviewers: Expect technical terminology, accept domain-specific jargon.
General Public: Require plain language explanations, flag unexplained technical terms.
Gen Z/Social Media: Accept internet culture references, weight virality in rhetoric scoring.
```

## Example Complete Configuration

**Scenario:** Analyzing a climate science debate for EU policymakers in 2025

### Supervisor Prompt
```
Evaluate climate arguments using IPCC standards and EU Green Deal policy framework.
Cross-reference all emission statistics against provided IPCC URLs and EU databases.
Calibrate evidence standards for scientific peer review (target: policy makers).
Apply precautionary principle per EU regulation when assessing climate risks.
Weight scientific consensus heavily over individual contrarian claims.
Flag methodological issues in studies cited by debaters.
Output confidence levels adjusted by margin of error (±10%).
Format policy recommendations for EU parliamentary briefing.
```

### Calibration Settings
- **Region:** EU
- **Year:** 2025
- **Demography:** Policy Makers
- **Persona:** Scientific Peer Reviewer
- **Logic Style:** Elite Peer Review
- **Margin of Error:** 10%

### RAG URLs
```
https://www.ipcc.ch/report/ar6/wg1/
https://ec.europa.eu/clima/eu-action/european-green-deal_en
https://www.eea.europa.eu/data-and-maps
```

### Result
Analysis will:
- Cite IPCC reports with [URL:1] notation
- Apply EU regulatory context
- Use scientific rigor for evidence evaluation
- Format output for policy audience
- Include ±10% confidence ranges

## Troubleshooting

### Issue: Calibration parameters ignored
**Solution:** Explicitly reference them in supervisor prompt:
```
Use ${country} standards, ${year} context, for ${demography} audience.
```

### Issue: RAG sources not influencing output
**Solution:** Make RAG usage mandatory:
```
CRITICAL: Every factual claim must cite a provided URL. Reject unsupported claims.
```

### Issue: Output too technical/too simple
**Solution:** Calibrate explicitly:
```
Target: ${demography}. Adjust vocabulary complexity accordingly.
```

### Issue: Biased analysis
**Solution:** Add neutrality directives:
```
Maintain ${persona} objectivity. Equally scrutinize both participants.
```

## UI Behavior

- **Blue gradient background** indicates supervisor level control
- **AlertCircle icon** explains its meta-intelligence role  
- **Multi-line textarea** allows complex directive composition
- **Auto-merged** with system instruction at analysis time
- **Persists** across sessions (until page reload)

## API Integration

The supervisor prompt is sent to Gemini API as part of the system instruction:

```javascript
{
  systemInstruction: enhancedSystemInstruction, // Includes supervisor prompt
  contents: [
    { role: 'user', parts: [{ text: userPrompt }] }
  ]
}
```

This ensures it has **maximum authority** over the AI's analytical approach.

---

## Summary

The Supervisor Intelligence Directive is the **command center** for knowledge-driven analysis:

- 🎯 **Controls** how RAG sources are integrated
- ⚙️ **Calibrates** analysis parameters dynamically  
- 🧠 **Orchestrates** synthesis of multiple knowledge streams
- 📊 **Adapts** output format and rigor to context
- 🔗 **Bridges** external knowledge with internal calibration

It's the most powerful tool for customizing how your AI analyzes debates and arguments with contextual intelligence.
