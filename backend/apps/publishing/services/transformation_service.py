"""
Content Transformation Service
================================
Core text transformation engine for Publishing Studio.

Implements the 5 processing modes with global context injection
to prevent "Narrative Amnesia" across blocks.

Modes:
- PRESERVE: No AI modification (instant return)
- POLISH: Grammar and structure fixes
- ENHANCE: Add contextual details
- CREATIVE: Full creative interpretation  
- REIMAGINE: Complete style transfer with parameters
"""

import logging
import time
from typing import Dict, Any, Optional
from decouple import config

logger = logging.getLogger(__name__)


class ContentTransformationService:
    """
    Transforms content blocks based on processing mode
    Integrates with Gemini AI for text processing
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize transformation service
        
        Args:
            api_key: Google AI API key (defaults to environment variable)
        """
        self.api_key = api_key or config('GOOGLE_AI_API_KEY', default='')
        if not self.api_key:
            raise ValueError("GOOGLE_AI_API_KEY is required for AI transformations")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.genai = genai
        except ImportError:
            raise ImportError(
                "google-generativeai package is required. "
                "Install with: pip install google-generativeai"
            )
    
    def transform_block(
        self,
        text: str,
        mode: str,
        params: Optional[Dict[str, Any]] = None,
        global_context: str = ""
    ) -> str:
        """
        Transform a content block based on processing mode
        
        Args:
            text: Raw input text
            mode: Processing mode (PRESERVE, POLISH, ENHANCE, CREATIVE, REIMAGINE)
            params: Additional parameters (used for REIMAGINE mode)
            global_context: Project-wide context to maintain consistency
            
        Returns:
            Transformed text
            
        Raises:
            ValueError: If mode is invalid
        """
        mode = mode.upper()
        params = params or {}
        
        # PRESERVE: No AI call - instant return (0 cost)
        if mode == 'PRESERVE':
            logger.info("PRESERVE mode - returning text unchanged")
            return text
        
        # Build context injection (CRITICAL FIX #1)
        context_injection = self._build_context_injection(global_context)
        
        # Route to appropriate transformation method
        if mode == 'POLISH':
            return self._polish_text(text, context_injection)
        elif mode == 'ENHANCE':
            return self._enhance_text(text, context_injection)
        elif mode == 'CREATIVE':
            return self._creative_rewrite(text, context_injection)
        elif mode == 'REIMAGINE':
            return self._reimagine_text(text, context_injection, params)
        else:
            raise ValueError(f"Invalid processing mode: {mode}")
    
    def _build_context_injection(self, global_context: str) -> str:
        """
        Build context injection string for consistent narrative
        
        This is CRITICAL FIX #1: Prevents "Narrative Amnesia"
        """
        if not global_context:
            return ""
        
        return f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL CONTEXT (MAINTAIN CONSISTENCY):
{global_context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: The above context MUST remain consistent throughout.
- Character names, descriptions, and traits are fixed
- Setting details and world rules are immutable
- Tone and style should match the established pattern
"""
    
    def _polish_text(self, text: str, context: str) -> str:
        """
        POLISH mode: Fix grammar, spelling, improve flow
        Temperature: 0.2 (minimal creativity)
        """
        prompt = f"""
{context}

TASK: Polish the following text.

RULES:
- Fix ALL grammar, spelling, and punctuation errors
- Improve sentence flow and readability
- Remove redundancy and awkward phrasing
- DO NOT change the meaning or add new content
- DO NOT alter facts, numbers, or proper nouns
- Preserve the original tone and voice

TEXT TO POLISH:
{text}

OUTPUT: Return ONLY the polished text, no explanations.
"""
        
        return self._call_gemini(prompt, temperature=0.2, mode_name="POLISH")
    
    def _enhance_text(self, text: str, context: str) -> str:
        """
        ENHANCE mode: Add contextual details while preserving core
        Temperature: 0.5 (balanced)
        """
        prompt = f"""
{context}

TASK: Enhance the following text with contextual details.

RULES:
- PRESERVE the core narrative and key facts
- ADD sensory details (sight, sound, smell, touch, taste)
- ADD contextual background that enriches understanding
- ADD relevant emotional cues or character insights
- DO NOT contradict the original meaning
- Expand by 20-40% maximum
- Maintain the original structure

TEXT TO ENHANCE:
{text}

OUTPUT: Return ONLY the enhanced text, no explanations.
"""
        
        return self._call_gemini(prompt, temperature=0.5, mode_name="ENHANCE")
    
    def _creative_rewrite(self, text: str, context: str) -> str:
        """
        CREATIVE mode: Full creative interpretation
        Temperature: 0.7 (high creativity)
        """
        prompt = f"""
{context}

TASK: Rewrite the following text with creative flair.

RULES:
- INTERPRET the content with creative freedom
- ADD dramatic tension, vivid descriptions, emotional depth
- USE metaphors, similes, and literary devices
- ADD dialogue or internal monologue where appropriate
- MAINTAIN the core story beats and plot points
- The rewrite can be 50-100% longer
- Show, don't tell

TEXT TO REWRITE:
{text}

OUTPUT: Return ONLY the creative rewrite, no explanations.
"""
        
        return self._call_gemini(prompt, temperature=0.7, mode_name="CREATIVE")
    
    def _reimagine_text(
        self,
        text: str,
        context: str,
        params: Dict[str, Any]
    ) -> str:
        """
        REIMAGINE mode: Complete style transfer with parameters
        Temperature: 0.9 (maximum creativity)
        """
        tone = params.get('tone', 'Original')
        perspective = params.get('perspective', 'Original')
        target_audience = params.get('targetAudience', 'General')
        emphasis = params.get('emphasis', 'Balanced')
        add_elements = params.get('addElements', '')
        target_length = params.get('targetLength', 'medium')
        
        # Length guidance
        length_instructions = {
            'short': 'Keep it concise (50-75% of original length)',
            'medium': 'Maintain similar length (80-120% of original)',
            'long': 'Expand significantly (150-200% of original length)'
        }
        length_guide = length_instructions.get(target_length, length_instructions['medium'])
        
        prompt = f"""
{context}

TASK: Reimagine the following text with a completely fresh interpretation.

TRANSFORMATION PARAMETERS:
- Tone: {tone}
- Perspective: {perspective}
- Target Audience: {target_audience}
- Emphasis: {emphasis}
- Additional Elements: {add_elements if add_elements else 'None'}
- Length: {length_guide}

RULES:
- Use the source text as INSPIRATION, not a template
- CREATE a fresh interpretation that serves the target audience
- APPLY the specified tone and perspective consistently
- EMPHASIZE the requested aspects
- INCORPORATE the additional elements naturally
- The final output can be radically different in structure and style
- Maintain core factual accuracy (dates, names from global context)

SOURCE TEXT:
{text}

OUTPUT: Return ONLY the reimagined text, no explanations.
"""
        
        return self._call_gemini(prompt, temperature=0.9, mode_name="REIMAGINE")
    
    def _call_gemini(
        self,
        prompt: str,
        temperature: float,
        mode_name: str
    ) -> str:
        """
        Make API call to Gemini
        
        Args:
            prompt: Complete prompt
            temperature: Creativity level (0.0-1.0)
            mode_name: Mode name for logging
            
        Returns:
            Generated text
        """
        start_time = time.time()
        
        try:
            # Use Gemini 1.5 Flash for cost efficiency
            model = self.genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                generation_config={
                    'temperature': temperature,
                    'top_p': 0.95,
                    'top_k': 40,
                    'max_output_tokens': 8192,
                }
            )
            
            logger.info(f"Starting {mode_name} transformation (temp={temperature})")
            
            response = model.generate_content(prompt)
            result = response.text.strip()
            
            processing_time = time.time() - start_time
            logger.info(
                f"{mode_name} transformation completed in {processing_time:.2f}s "
                f"({len(result)} chars)"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Gemini API error in {mode_name} mode: {str(e)}", exc_info=True)
            raise RuntimeError(f"Text transformation failed: {str(e)}")
    
    def estimate_cost(
        self,
        text: str,
        mode: str,
        include_images: bool = False,
        include_audio: bool = False
    ) -> Dict[str, float]:
        """
        Estimate credit cost for processing a block
        
        Args:
            text: Input text
            mode: Processing mode
            include_images: Whether image generation is enabled
            include_audio: Whether audio generation is enabled
            
        Returns:
            Cost breakdown dictionary
        """
        # Credit costs
        MODE_COSTS = {
            'PRESERVE': 0,  # Free - no API call
            'POLISH': 1,     # Cheapest - simple task
            'ENHANCE': 2,    # Medium cost
            'CREATIVE': 3,   # Higher cost
            'REIMAGINE': 5,  # Most expensive
        }
        
        text_cost = MODE_COSTS.get(mode.upper(), 0)
        image_cost = 10 if include_images else 0
        audio_cost = 5 if include_audio else 0
        
        total_cost = text_cost + image_cost + audio_cost
        
        return {
            'text_processing': text_cost,
            'image_generation': image_cost,
            'audio_generation': audio_cost,
            'total': total_cost
        }
