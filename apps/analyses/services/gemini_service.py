"""
Gemini AI Service - Port of geminiService.ts to Python
Handles video content analysis using Google's Gemini API
"""
import json
import time
import logging
from typing import Dict, Any, Optional, List
from decouple import config

logger = logging.getLogger(__name__)


class GeminiAnalyzer:
    """
    Video content analyzer using Google Gemini AI API
    Ports the functionality from geminiService.ts
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini analyzer
        
        Args:
            api_key: Google AI API key (defaults to environment variable)
        """
        self.api_key = api_key or config('GOOGLE_AI_API_KEY', default='')
        if not self.api_key:
            raise ValueError("GOOGLE_AI_API_KEY is required")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.genai = genai
        except ImportError:
            raise ImportError(
                "google-generativeai package is required. "
                "Install with: pip install google-generativeai"
            )
    
    def analyze_video_content(
        self,
        user_prompt: str,
        config_data: Dict[str, Any],
        base64_video: Optional[str] = None,
        mime_type: str = 'video/mp4'
    ) -> str:
        """
        Analyze video content using Gemini AI
        
        Args:
            user_prompt: User's analysis prompt
            config_data: Analysis configuration
            base64_video: Base64 encoded video (optional if transcript provided)
            mime_type: Video MIME type
            
        Returns:
            Analysis result as formatted JSON string
        """
        start_time = time.time()
        
        try:
            # Build the complete prompt
            final_prompt = self._build_analysis_prompt(user_prompt, config_data)
            
            # Prepare content parts
            contents = []
            
            # Use transcript if available (cheaper and faster)
            transcript = config_data.get('transcript')
            if transcript:
                transcript_context = f"""
VIDEO TRANSCRIPT (YouTube Auto-Generated):
{transcript}

Note: This is the full transcript of the video. Analyze the arguments based on the text content.
"""
                contents.append(transcript_context)
            elif base64_video:
                # Fallback to video processing (more expensive)
                logger.warning("Using video processing - transcript recommended for cost efficiency")
                # Note: Video processing requires special handling in genai library
                # For now, we'll use transcript-only mode
                pass
            
            # Add the main prompt
            contents.append(final_prompt)
            
            # Select model based on mode
            model_name = 'gemini-1.5-pro' if config_data.get('mode') == 'debate' else 'gemini-1.5-flash'
            model = self.genai.GenerativeModel(
                model_name=model_name,
                system_instruction=config_data.get('system_instruction', self._get_default_system_instruction())
            )
            
            # Generate content
            logger.info(f"Starting Gemini analysis with model: {model_name}")
            response = model.generate_content('\n\n'.join(contents))
            
            result_text = response.text.strip()
            processing_time = time.time() - start_time
            
            logger.info(f"Analysis completed in {processing_time:.2f} seconds")
            
            # Try to parse JSON from response
            result_data = self._extract_json_from_response(result_text)
            
            return json.dumps({
                'success': True,
                'data': result_data,
                'text': result_text,
                'processing_time': processing_time
            }, indent=2)
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {str(e)}", exc_info=True)
            return json.dumps({
                'success': False,
                'error': str(e)
            })
    
    def _build_analysis_prompt(self, user_prompt: str, config_data: Dict[str, Any]) -> str:
        """
        Build comprehensive analysis prompt from configuration
        """
        mode = config_data.get('mode', 'monologue')
        participant_a = config_data.get('participantA', {})
        participant_b = config_data.get('participantB')
        wsdc_weights = config_data.get('wsdcWeights', {'content': 40, 'style': 30, 'strategy': 30})
        calibration = config_data.get('calibration', {})
        supervisor_prompt = config_data.get('supervisorPrompt', '')
        
        # === TOULMIN MODEL INSTRUCTIONS ===
        toulmin_instructions = """
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
"""
        
        # === FALLACY TAXONOMY ===
        fallacy_taxonomy = """
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
- Tu Quoque: "You too" - dismissing criticism by pointing to hypocrisy
- Whataboutism: Deflecting by bringing up unrelated issues
"""
        
        # === MODE CONTEXT ===
        mode_context = f"""
ANALYSIS PROTOCOL: {"SOLO AUDIT (The Crystal Box)" if mode == "monologue" else "ARENA DEBATE (1v1)"}.
{"Subject: " + participant_a.get("name", "Speaker A") + " [Authority Level: " + participant_a.get("level", "Unknown") + "]." if mode == "monologue" else "Contest: " + participant_a.get("name", "Participant A") + " vs " + (participant_b.get("name", "Participant B") if participant_b else "Participant B") + "."}
Objective: {"Measure subject claims against the GLOBAL FACTUAL MATRIX (Truth Matrix). Result: If Truth Density > Subject Reliability, declare Factual Bankruptcy." if mode == "monologue" else "Determine who controls the Mind Palace of logic and evidence."}
"""
        
        # === ARBITER IDENTITY ===
        arbiter_identity = f"""
IDENTITY: You are "THE AI ARBITER". 
TONE: Analytical, surgical, neutral but firm. Use "Sherlock-style" deduction logic.
CALIBRATION TARGETS:
- REGION: {calibration.get('country', 'Global')}
- TEMPORAL FRAME: {calibration.get('year', '2025')}
- DEMOGRAPHY: {calibration.get('demography', 'General Public')}
- JUDGE PERSONA: {calibration.get('persona', 'Academic Expert')}
- INTENT: {calibration.get('intent', 'Truth-seeking')}
- RIGOUR: {calibration.get('logicStyle', 'Strict Logical')}
- STAKEHOLDER MODE: {calibration.get('stakeholderMode', 'Neutral Observer')}
"""
        
        # === SCORING RUBRIC ===
        margin_of_error = calibration.get('marginOfError', 5)
        scoring_rubric = f"""
WSDC ADJUDICATION STANDARD (World Schools Debating Championship Rubric):
EDITABLE WEIGHTS - Current Configuration:

CONTENT ({wsdc_weights.get('content', 40)}% Weight):
- Logical quality of arguments and Toulmin structure validity
- Soundness of evidence cited and relevance to motion
- Internal consistency (penalize contradictions heavily)
- Fallacy count (each fallacy deducts points)

STYLE ({wsdc_weights.get('style', 30)}% Weight):
- Rhetorical effectiveness and persuasion techniques
- Clarity and accessibility of language
- Tone, pacing, and delivery (from transcript analysis)
- Audience engagement and narrative structure

STRATEGY ({wsdc_weights.get('strategy', 30)}% Weight):
- Case structure and time management
- Effectiveness of refutations (attacking strongest points vs. strawmen)
- Response to opponent's core arguments
- Defensive vs. offensive balance

CRITICAL: Scores must be calculated based on these exact weights.
Content max = {wsdc_weights.get('content', 40)}, Style max = {wsdc_weights.get('style', 30)}, Strategy max = {wsdc_weights.get('strategy', 30)}
Total max = 100 points

Margin of Error: ±{margin_of_error}%
"""
        
        # === JSON SCHEMA REQUEST ===
        json_schema = """
CRITICAL: Output must include a structured JSON section for graph visualization AND scoring engine:

JSON_OUTPUT_START
{
  "debate_title": "string",
  "total_duration": number_in_seconds,
  
  "claims": [
    {
      "text": "The exact claim made by the speaker",
      "speaker": "A" | "B",
      "category": "factual" | "opinion" | "prediction" | "citation",
      "verified": true | false,
      "confidence": 0.0 to 1.0,
      "sources": ["URL or citation if verifiable"],
      "timestamp": 0.0
    }
  ],
  
  "fallacies": [
    {
      "type": "ad_hominem" | "strawman" | "slippery_slope" | "false_dilemma" | "appeal_to_authority" | "hasty_generalization" | "post_hoc" | "red_herring" | "circular_reasoning" | "appeal_to_emotion" | "bandwagon" | "no_true_scotsman" | "tu_quoque" | "whataboutism",
      "speaker": "A" | "B",
      "severity": 1 to 10,
      "quote": "Exact words from transcript",
      "explanation": "Why this is a fallacy",
      "timestamp": 0.0
    }
  ],
  
  "scores": {
    "participant_a": {
      "content": 0-40,
      "style": 0-30,
      "strategy": 0-30,
      "total": 0-100
    },
    "participant_b": {
      "content": 0-40,
      "style": 0-30,
      "strategy": 0-30,
      "total": 0-100
    }
  },
  
  "verdict": {
    "winner": "A" | "B" | "tie",
    "margin": number,
    "reasoning": "string"
  },
  
  "toulmin_breakdown": [
    {
      "claim": "string",
      "grounds": "string",
      "warrant": "string",
      "backing": "string",
      "qualifier": "string",
      "rebuttal": "string",
      "strength": 1-10
    }
  ]
}
JSON_OUTPUT_END
"""
        
        # === ASSEMBLE FINAL PROMPT ===
        final_prompt = f"""
{arbiter_identity}

{mode_context}

{toulmin_instructions}

{fallacy_taxonomy}

{scoring_rubric}

{json_schema}

{'SUPERVISOR OVERRIDE PROMPT: ' + supervisor_prompt if supervisor_prompt else ''}

USER ANALYSIS REQUEST:
{user_prompt}

Execute comprehensive Toulmin-based analysis now. Include both the structured JSON and detailed textual analysis.
"""
        
        return final_prompt
    
    def _get_default_system_instruction(self) -> str:
        """Get default system instruction for Gemini"""
        return (
            "You are 'The AI Arbiter'. You perform high-rigour logical analysis "
            "using the Toulmin model. You are immune to rhetoric and focused solely "
            "on factual density and structural validity. Always output both structured "
            "JSON data and detailed textual analysis."
        )
    
    def _extract_json_from_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        Extract JSON data from Gemini response
        Looks for JSON_OUTPUT_START/END markers or attempts to parse JSON blocks
        """
        try:
            # Try to find JSON between markers
            if 'JSON_OUTPUT_START' in response_text and 'JSON_OUTPUT_END' in response_text:
                start_idx = response_text.index('JSON_OUTPUT_START') + len('JSON_OUTPUT_START')
                end_idx = response_text.index('JSON_OUTPUT_END')
                json_str = response_text[start_idx:end_idx].strip()
                return json.loads(json_str)
            
            # Try to find JSON in code blocks
            if '```json' in response_text:
                start_idx = response_text.index('```json') + 7
                end_idx = response_text.index('```', start_idx)
                json_str = response_text[start_idx:end_idx].strip()
                return json.loads(json_str)
            
            # Try to parse the entire response as JSON
            return json.loads(response_text)
            
        except (ValueError, json.JSONDecodeError) as e:
            logger.warning(f"Could not extract JSON from response: {e}")
            # Return a basic structure
            return {
                'debate_title': 'Analysis Result',
                'claims': [],
                'fallacies': [],
                'scores': {},
                'raw_text': response_text
            }
