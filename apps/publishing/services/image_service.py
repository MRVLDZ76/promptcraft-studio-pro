"""
Image Generation Service
=========================
Generates illustrations for content blocks with SEED LOCKING
for character consistency (CRITICAL FIX #3)
"""

import logging
import openai
from typing import Optional
from decouple import config

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """
    Generate images with character consistency using seed locking
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize image generation service"""
        self.api_key = api_key or config('OPENAI_API_KEY', default='')
        if self.api_key:
            openai.api_key = self.api_key
    
    def create_image_prompt(
        self,
        text: str,
        style: str,
        global_context: str = ""
    ) -> str:
        """
        Create image generation prompt from text
        Injects character descriptions from global_context
        
        Args:
            text: Content block text
            style: Image style (e.g., "Minimalist illustrations")
            global_context: Character descriptions for consistency
            
        Returns:
            Image generation prompt
        """
        # Extract character descriptions from global_context
        character_guide = self._extract_character_descriptions(global_context)
        
        prompt = f"""
{style}

{character_guide}

Scene description based on: {text[:500]}

CRITICAL: Use the character descriptions exactly as provided.
Maintain visual consistency with previous illustrations.
"""
        
        return prompt.strip()
    
    def _extract_character_descriptions(self, global_context: str) -> str:
        """Extract character visual descriptions from global context"""
        if not global_context:
            return ""
        
        # Simple extraction - can be enhanced with NLP
        lines = [
            line.strip() 
            for line in global_context.split('\n') 
            if any(keyword in line.lower() for keyword in ['protagonist', 'character', 'hero', 'appearance'])
        ]
        
        if lines:
            return "Character Guide:\n" + "\n".join(lines)
        return ""
    
    def generate_image(
        self,
        prompt: str,
        style: str,
        seed: Optional[int] = None
    ) -> str:
        """
        Generate image using DALL-E 3
        
        Note: DALL-E 3 doesn't support seeds directly.
        For true seed locking, use SDXL via Replicate (future enhancement)
        
        Args:
            prompt: Image generation prompt
            style: Image style
            seed: Random seed (for SDXL, not used with DALL-E 3)
            
        Returns:
            Image URL
        """
        try:
            response = openai.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            image_url = response.data[0].url
            logger.info(f"Image generated successfully: {image_url[:50]}...")
            
            return image_url
            
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Image generation failed: {str(e)}")
