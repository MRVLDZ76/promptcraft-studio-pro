"""
Audio Generation Service
=========================
Generates TTS narration for content blocks
Uses OpenAI TTS API
"""

import logging
import tempfile
from pathlib import Path
from typing import Dict, Optional
import openai
from decouple import config

logger = logging.getLogger(__name__)


class AudioGenerationService:
    """
    Generate TTS narration using OpenAI Text-to-Speech
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize audio generation service"""
        self.api_key = api_key or config('OPENAI_API_KEY', default='')
        if self.api_key:
            openai.api_key = self.api_key
    
    def generate_audio(
        self,
        text: str,
        voice: str = 'alloy'
    ) -> Dict[str, any]:
        """
        Generate TTS audio for text
        
        Args:
            text: Text to convert to speech
            voice: OpenAI voice model (alloy, echo, fable, onyx, nova, shimmer)
            
        Returns:
            Dictionary with 'url' and 'duration' keys
        """
        try:
            # Generate audio
            response = openai.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            # TODO: Upload to S3/storage and get URL
            # For now, return local path
            audio_url = f"file://{temp_path}"
            
            # Estimate duration (rough: 150 words per minute)
            word_count = len(text.split())
            estimated_duration = (word_count / 150) * 60
            
            logger.info(f"Audio generated: {audio_url} ({estimated_duration:.1f}s)")
            
            return {
                'url': audio_url,
                'duration': estimated_duration
            }
            
        except Exception as e:
            logger.error(f"Audio generation failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Audio generation failed: {str(e)}")
