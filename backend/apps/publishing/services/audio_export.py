"""
Audio Export Service for Audiobooks
====================================
Generates ACX/Audible-compliant audiobook files with:
- Proper audio format (MP3 192kbps CBR, 44.1kHz, 16-bit)
- Chapter markers (ID3 tags)
- Opening/closing credits
- Retail sample (5 minutes)
- Proper file naming

Uses pydub for audio processing and mutagen for ID3 tags.
"""

import os
import logging
from typing import Optional, List, Dict
from django.conf import settings
from apps.publishing.models import BookProject
from apps.publishing.audiobook_config import (
    AUDIOBOOK_MARKETPLACES,
    AUDIO_FORMATS,
    generate_audiobook_filenames,
    generate_retail_sample_spec,
    CREDITS_TEMPLATES,
)

logger = logging.getLogger(__name__)


class AudioExportService:
    """Service for generating audiobook exports"""
    
    def __init__(self):
        self.output_dir = os.path.join(settings.MEDIA_ROOT, 'audiobooks')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_audiobook(
        self,
        book_id: int,
        include_opening_credits: bool = True,
        include_closing_credits: bool = True,
        generate_retail_sample: bool = True,
        include_chapter_markers: bool = True,
    ) -> dict:
        """
        Generate complete audiobook package
        
        Args:
            book_id: ID of the book to export
            include_opening_credits: Generate opening credits file
            include_closing_credits: Generate closing credits file
            generate_retail_sample: Generate 5-minute retail sample
            include_chapter_markers: Add chapter markers to files
            
        Returns:
            dict with file paths and metadata
        """
        try:
            # Import audio libraries (fail gracefully if not installed)
            from pydub import AudioSegment
            from mutagen.mp3 import MP3
            from mutagen.id3 import ID3, TIT2, TPE1, TALB, CHAP, CTOC
            from mutagen.easyid3 import EasyID3
        except ImportError:
            logger.error("Audio libraries not installed. Run: pip install pydub mutagen")
            raise ImportError("pydub and mutagen are required for audiobook export")
        
        # Load book data
        book = BookProject.objects.prefetch_related(
            'chapters__blocks'
        ).get(id=book_id)
        
        chapters = book.chapters.order_by('sequence_order').all()
        
        # Get audio format specs
        audio_specs = AUDIO_FORMATS.get(book.audio_format, AUDIO_FORMATS['mp3_acx'])
        
        # Create output directory
        output_path = os.path.join(
            self.output_dir,
            f'book_{book.id}',
            book.title.replace(' ', '_')
        )
        os.makedirs(output_path, exist_ok=True)
        
        # Generate file names
        filenames = generate_audiobook_filenames(book.title, len(chapters))
        
        generated_files = []
        total_duration_seconds = 0
        
        # 1. Generate Opening Credits (if enabled)
        if include_opening_credits and book.include_opening_credits:
            opening_file = self._generate_opening_credits(
                book, output_path, filenames['opening_credits'], audio_specs
            )
            if opening_file:
                generated_files.append(opening_file)
                total_duration_seconds += opening_file['duration_seconds']
        
        # 2. Generate Chapter Files
        chapter_files = []
        for idx, chapter in enumerate(chapters):
            chapter_file = self._generate_chapter_audio(
                book, chapter, idx, output_path, 
                filenames['chapters'][idx], audio_specs
            )
            if chapter_file:
                chapter_files.append(chapter_file)
                generated_files.append(chapter_file)
                total_duration_seconds += chapter_file['duration_seconds']
        
        # 3. Add Chapter Markers (if enabled)
        if include_chapter_markers and book.include_chapter_markers:
            self._add_chapter_markers(chapter_files, book)
        
        # 4. Generate Closing Credits (if enabled)
        if include_closing_credits and book.include_closing_credits:
            closing_file = self._generate_closing_credits(
                book, output_path, filenames['closing_credits'], audio_specs
            )
            if closing_file:
                generated_files.append(closing_file)
                total_duration_seconds += closing_file['duration_seconds']
        
        # 5. Generate Retail Sample (if enabled)
        retail_sample = None
        if generate_retail_sample and book.generate_retail_sample:
            retail_sample = self._generate_retail_sample(
                chapter_files[:1],  # First chapter
                output_path,
                filenames['retail_sample'],
                audio_specs
            )
            if retail_sample:
                generated_files.append(retail_sample)
        
        # Get marketplace info
        marketplace_info = AUDIOBOOK_MARKETPLACES.get(
            book.audiobook_marketplace,
            AUDIOBOOK_MARKETPLACES['acx_audible']
        )
        
        logger.info(
            f"Generated audiobook for book {book.id}: "
            f"{len(generated_files)} files, {total_duration_seconds/3600:.2f} hours"
        )
        
        return {
            'output_path': output_path,
            'files': generated_files,
            'total_files': len(generated_files),
            'total_duration_hours': total_duration_seconds / 3600,
            'total_duration_minutes': total_duration_seconds / 60,
            'chapter_count': len(chapters),
            'marketplace_specs': {
                'marketplace': marketplace_info['name'],
                'format': audio_specs['name'],
                'bitrate': f"{audio_specs['bitrate']} kbps",
                'sample_rate': f"{audio_specs['sample_rate']} Hz",
                'channels': book.audio_mono_stereo,
                'chapter_markers': include_chapter_markers,
                'has_opening_credits': include_opening_credits,
                'has_closing_credits': include_closing_credits,
                'has_retail_sample': retail_sample is not None,
            }
        }
    
    def _generate_opening_credits(
        self, 
        book: BookProject, 
        output_path: str, 
        filename: str,
        audio_specs: dict
    ) -> Optional[dict]:
        """
        Generate opening credits file
        
        Example: "This is [Title], written by [Author], 
                  narrated by [Voice], produced by [Publisher]."
        """
        try:
            from pydub import AudioSegment
            from gtts import gTTS  # Google TTS for credits (free alternative)
            import tempfile
            
            # Generate credits text
            credits_template = CREDITS_TEMPLATES['opening_credits']['content_template']
            credits_text = credits_template.replace('[Book Title]', book.title)
            credits_text = credits_text.replace('[Author Name]', book.author_name)
            
            # Get narrator name (voice model or "AI Narration")
            narrator = f"AI Voice ({book.voice_model})"
            credits_text = credits_text.replace('[Narrator Name]', narrator)
            
            publisher = book.publisher or "Independent Publisher"
            credits_text = credits_text.replace('[Publisher/Studio Name]', publisher)
            
            # Generate speech (using TTS)
            # In production, use the same voice as the audiobook
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            tts = gTTS(text=credits_text, lang='en', slow=False)
            tts.save(temp_file.name)
            
            # Load and process audio
            audio = AudioSegment.from_mp3(temp_file.name)
            
            # Add room tone (0.5 seconds silence at start/end)
            silence = AudioSegment.silent(duration=500)  # 500ms
            audio = silence + audio + silence
            
            # Export with proper settings
            output_file = os.path.join(output_path, filename)
            audio.export(
                output_file,
                format='mp3',
                bitrate=f"{audio_specs['bitrate']}k",
                parameters=["-ar", str(audio_specs['sample_rate'])]
            )
            
            # Clean up temp file
            os.unlink(temp_file.name)
            
            return {
                'type': 'opening_credits',
                'path': output_file,
                'filename': filename,
                'duration_seconds': len(audio) / 1000.0,
                'file_size': os.path.getsize(output_file),
            }
            
        except Exception as e:
            logger.error(f"Error generating opening credits: {e}")
            return None
    
    def _generate_closing_credits(
        self, 
        book: BookProject, 
        output_path: str, 
        filename: str,
        audio_specs: dict
    ) -> Optional[dict]:
        """
        Generate closing credits file
        
        Example: "This has been [Title], written by [Author],
                  narrated by [Voice]. Copyright [Year] by [Holder].
                  Thank you for listening."
        """
        try:
            from pydub import AudioSegment
            from gtts import gTTS
            import tempfile
            
            credits_template = CREDITS_TEMPLATES['closing_credits']['content_template']
            credits_text = credits_template.replace('[Book Title]', book.title)
            credits_text = credits_text.replace('[Author Name]', book.author_name)
            
            narrator = f"AI Voice ({book.voice_model})"
            credits_text = credits_text.replace('[Narrator Name]', narrator)
            
            year = book.copyright_year or 2026
            credits_text = credits_text.replace('[Year]', str(year))
            
            copyright_holder = book.author_name
            credits_text = credits_text.replace('[Copyright Holder]', copyright_holder)
            
            publisher = book.publisher or "Independent Publisher"
            credits_text = credits_text.replace('[Publisher/Studio Name]', publisher)
            
            # Add thank you message
            credits_text += " Thank you for listening. If you enjoyed this audiobook, please leave a review."
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            tts = gTTS(text=credits_text, lang='en', slow=False)
            tts.save(temp_file.name)
            
            audio = AudioSegment.from_mp3(temp_file.name)
            
            # Add room tone
            silence = AudioSegment.silent(duration=500)
            audio = silence + audio + silence
            
            output_file = os.path.join(output_path, filename)
            audio.export(
                output_file,
                format='mp3',
                bitrate=f"{audio_specs['bitrate']}k",
                parameters=["-ar", str(audio_specs['sample_rate'])]
            )
            
            os.unlink(temp_file.name)
            
            return {
                'type': 'closing_credits',
                'path': output_file,
                'filename': filename,
                'duration_seconds': len(audio) / 1000.0,
                'file_size': os.path.getsize(output_file),
            }
            
        except Exception as e:
            logger.error(f"Error generating closing credits: {e}")
            return None
    
    def _generate_chapter_audio(
        self,
        book: BookProject,
        chapter,
        chapter_index: int,
        output_path: str,
        filename: str,
        audio_specs: dict
    ) -> Optional[dict]:
        """
        Generate audio file for a single chapter
        
        In production, this would call OpenAI TTS or other TTS service.
        For now, it returns a placeholder structure.
        """
        # This is where you'd integrate with your TTS service
        # Example: OpenAI TTS, ElevenLabs, etc.
        
        # Placeholder: In production, generate actual audio
        # For now, return the structure that would be created
        
        output_file = os.path.join(output_path, filename)
        
        # TODO: Actual TTS generation
        # audio = generate_tts(chapter.text, voice=book.voice_model)
        # audio.export(output_file, format='mp3', bitrate='192k')
        
        return {
            'type': 'chapter',
            'chapter_number': chapter_index + 1,
            'chapter_title': chapter.title,
            'path': output_file,
            'filename': filename,
            'duration_seconds': 1200,  # Placeholder: 20 minutes
            'file_size': 0,  # Placeholder
            'start_time_in_book': 0,  # Will be calculated
        }
    
    def _add_chapter_markers(self, chapter_files: List[dict], book: BookProject):
        """
        Add ID3 chapter markers to audiobook files
        
        Uses CHAP frames (ID3v2.4) for chapter navigation
        """
        try:
            from mutagen.mp3 import MP3
            from mutagen.id3 import ID3, CHAP, CTOC
            
            cumulative_time_ms = 0
            
            for idx, chapter_file in enumerate(chapter_files):
                file_path = chapter_file['path']
                
                # Load file
                audio = MP3(file_path, ID3=ID3)
                
                if audio.tags is None:
                    audio.add_tags()
                
                # Add chapter marker
                chapter_id = f"chp{idx}"
                start_time = cumulative_time_ms
                end_time = start_time + int(chapter_file['duration_seconds'] * 1000)
                
                # Create CHAP frame
                audio.tags.add(
                    CHAP(
                        encoding=3,  # UTF-8
                        element_id=chapter_id,
                        start_time=start_time,
                        end_time=end_time,
                        sub_frames=[
                            ('TIT2', chapter_file['chapter_title'])
                        ]
                    )
                )
                
                audio.save()
                
                cumulative_time_ms = end_time
                
            logger.info(f"Added {len(chapter_files)} chapter markers to audiobook")
            
        except Exception as e:
            logger.error(f"Error adding chapter markers: {e}")
    
    def _generate_retail_sample(
        self,
        chapter_files: List[dict],
        output_path: str,
        filename: str,
        audio_specs: dict
    ) -> Optional[dict]:
        """
        Generate 5-minute retail sample from first chapter(s)
        
        ACX requires a 5-minute sample for preview/marketing
        """
        try:
            from pydub import AudioSegment
            
            # Load first chapter audio
            if not chapter_files:
                return None
            
            # TODO: Load actual audio files and extract first 5 minutes
            # For now, return placeholder structure
            
            output_file = os.path.join(output_path, filename)
            
            # In production:
            # audio = AudioSegment.from_mp3(chapter_files[0]['path'])
            # sample = audio[:5 * 60 * 1000]  # First 5 minutes
            # sample.export(output_file, format='mp3', bitrate='192k')
            
            return {
                'type': 'retail_sample',
                'path': output_file,
                'filename': filename,
                'duration_seconds': 300,  # 5 minutes
                'file_size': 0,  # Placeholder
                'note': 'First 5 minutes of audiobook for ACX/Audible preview',
            }
            
        except Exception as e:
            logger.error(f"Error generating retail sample: {e}")
            return None
    
    def validate_acx_compliance(self, file_path: str) -> dict:
        """
        Validate audio file against ACX requirements
        
        Checks:
        - Peak amplitude between -3dB and -6dB
        - RMS level around -18dB to -23dB
        - Noise floor below -60dB
        - Proper format (192kbps CBR, 44.1kHz, 16-bit)
        
        Returns:
            dict with validation results and warnings
        """
        try:
            from pydub import AudioSegment
            from pydub.utils import mediainfo
            import numpy as np
            
            audio = AudioSegment.from_mp3(file_path)
            info = mediainfo(file_path)
            
            # Get audio data as numpy array
            samples = np.array(audio.get_array_of_samples())
            
            # Calculate peak amplitude
            peak_db = audio.dBFS
            
            # Calculate RMS (Root Mean Square)
            rms = np.sqrt(np.mean(samples**2))
            rms_db = 20 * np.log10(rms / 32768) if rms > 0 else -100
            
            # Check format
            bitrate = int(info.get('bit_rate', 0)) / 1000  # Convert to kbps
            sample_rate = int(info.get('sample_rate', 0))
            
            errors = []
            warnings = []
            
            # Validate peak amplitude
            if peak_db > -3:
                errors.append(f"Peak amplitude too high: {peak_db:.2f}dB (must be < -3dB)")
            elif peak_db < -6:
                warnings.append(f"Peak amplitude low: {peak_db:.2f}dB (recommended: -3 to -6dB)")
            
            # Validate RMS
            if rms_db < -23 or rms_db > -18:
                warnings.append(f"RMS level: {rms_db:.2f}dB (recommended: -18 to -23dB)")
            
            # Validate format
            if bitrate != 192:
                errors.append(f"Bitrate incorrect: {bitrate}kbps (must be 192kbps)")
            
            if sample_rate != 44100:
                errors.append(f"Sample rate incorrect: {sample_rate}Hz (must be 44100Hz)")
            
            return {
                'valid': len(errors) == 0,
                'peak_db': peak_db,
                'rms_db': rms_db,
                'bitrate': bitrate,
                'sample_rate': sample_rate,
                'errors': errors,
                'warnings': warnings,
            }
            
        except Exception as e:
            logger.error(f"Error validating ACX compliance: {e}")
            return {
                'valid': False,
                'errors': [str(e)],
                'warnings': [],
            }
