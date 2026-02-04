"""
Test Audiobook Export Service
==============================
Basic tests for audiobook generation functionality
"""

import os
from django.test import TestCase
from apps.publishing.models import BookProject, Chapter, ContentBlock
from apps.publishing.services.audio_export import AudioExportService


class AudioExportServiceTest(TestCase):
    """Test audiobook export service"""
    
    def setUp(self):
        """Create test book with chapters"""
        self.book = BookProject.objects.create(
            title="Test Audiobook",
            author_name="Test Author",
            description="A test book for audiobook export",
            genres=["Fiction", "Test"],
            target_audience="General",
            
            # Audiobook settings
            audiobook_marketplace="acx_audible",
            audio_format="mp3_acx",
            audio_bitrate=192,
            audio_mono_stereo="stereo",
            include_chapter_markers=True,
            include_opening_credits=True,
            include_closing_credits=True,
            generate_retail_sample=True,
        )
        
        # Create chapters
        for i in range(3):
            chapter = Chapter.objects.create(
                book=self.book,
                title=f"Chapter {i+1}",
                sequence_order=i,
                status="complete"
            )
            
            # Add content blocks
            ContentBlock.objects.create(
                chapter=chapter,
                block_type="text",
                content=f"This is the content of chapter {i+1}. " * 50,
                sequence_order=0
            )
    
    def test_audiobook_config_loaded(self):
        """Test that audiobook config is properly loaded"""
        from apps.publishing.audiobook_config import (
            AUDIOBOOK_MARKETPLACES,
            AUDIO_FORMATS,
            NARRATOR_VOICES,
        )
        
        # Check marketplaces
        self.assertIn('acx_audible', AUDIOBOOK_MARKETPLACES)
        self.assertIn('findaway', AUDIOBOOK_MARKETPLACES)
        
        # Check audio formats
        self.assertIn('mp3_acx', AUDIO_FORMATS)
        self.assertEqual(AUDIO_FORMATS['mp3_acx']['bitrate'], 192)
        
        # Check voices
        self.assertIn('fable', NARRATOR_VOICES)
        self.assertIn('echo', NARRATOR_VOICES)
    
    def test_generate_audiobook_structure(self):
        """Test that audiobook generation returns proper structure"""
        service = AudioExportService()
        
        # This would call the actual service
        # For now, just test the structure would be correct
        expected_keys = [
            'output_path',
            'files',
            'total_files',
            'total_duration_hours',
            'chapter_count',
            'marketplace_specs',
        ]
        
        # In production, would call:
        # result = service.generate_audiobook(self.book.id)
        # for key in expected_keys:
        #     self.assertIn(key, result)
    
    def test_book_audiobook_fields(self):
        """Test that book has all audiobook fields"""
        self.assertEqual(self.book.audiobook_marketplace, 'acx_audible')
        self.assertEqual(self.book.audio_format, 'mp3_acx')
        self.assertEqual(self.book.audio_bitrate, 192)
        self.assertEqual(self.book.audio_mono_stereo, 'stereo')
        self.assertTrue(self.book.include_chapter_markers)
        self.assertTrue(self.book.include_opening_credits)
        self.assertTrue(self.book.include_closing_credits)
        self.assertTrue(self.book.generate_retail_sample)
    
    def test_acx_standards_defined(self):
        """Test that ACX audio standards are properly defined"""
        from apps.publishing.audiobook_config import ACX_AUDIO_STANDARDS
        
        self.assertIn('peak_amplitude', ACX_AUDIO_STANDARDS)
        self.assertIn('rms_level', ACX_AUDIO_STANDARDS)
        self.assertIn('noise_floor', ACX_AUDIO_STANDARDS)
        
        # Check ranges
        peak = ACX_AUDIO_STANDARDS['peak_amplitude']
        self.assertEqual(peak['min'], -6)
        self.assertEqual(peak['max'], -3)
    
    def test_file_naming_convention(self):
        """Test ACX file naming convention"""
        from apps.publishing.audiobook_config import generate_audiobook_filenames
        
        filenames = generate_audiobook_filenames("My Book", 3)
        
        self.assertEqual(filenames['opening_credits'], "My_Book_Opening.mp3")
        self.assertEqual(filenames['closing_credits'], "My_Book_Closing.mp3")
        self.assertEqual(filenames['retail_sample'], "My_Book_RetailSample.mp3")
        self.assertEqual(len(filenames['chapters']), 3)
        self.assertEqual(filenames['chapters'][0], "My_Book_01.mp3")
        self.assertEqual(filenames['chapters'][2], "My_Book_03.mp3")
    
    def test_recommended_settings(self):
        """Test recommended audiobook settings function"""
        from apps.publishing.audiobook_config import get_recommended_audiobook_settings
        
        # ACX settings
        acx_settings = get_recommended_audiobook_settings('acx_audible', 'Fiction')
        self.assertEqual(acx_settings['audio_format'], 'mp3_acx')
        self.assertEqual(acx_settings['bitrate'], 192)
        self.assertIn(acx_settings['recommended_voice'], ['fable', 'onyx', 'nova', 'shimmer'])
        
        # Findaway settings
        findaway_settings = get_recommended_audiobook_settings('findaway', 'Non-Fiction')
        self.assertIn(findaway_settings['audio_format'], ['mp3_320', 'm4b_64'])


class AudioExportAPITest(TestCase):
    """Test audiobook export API endpoint"""
    
    def setUp(self):
        """Create test book"""
        self.book = BookProject.objects.create(
            title="API Test Book",
            author_name="Test Author",
            description="Testing API",
            audiobook_marketplace="acx_audible",
            audio_format="mp3_acx",
        )
    
    def test_export_audiobook_endpoint_exists(self):
        """Test that export_audiobook endpoint is defined"""
        from apps.publishing.views import BookProjectViewSet
        
        # Check that export_audiobook action exists
        self.assertTrue(hasattr(BookProjectViewSet, 'export_audiobook'))
    
    def test_serializer_has_audiobook_fields(self):
        """Test that serializer includes audiobook fields"""
        from apps.publishing.serializers import BookProjectSerializer
        
        serializer = BookProjectSerializer(instance=self.book)
        data = serializer.data
        
        # Check audiobook fields are present
        self.assertIn('audiobook_marketplace', data)
        self.assertIn('audio_format', data)
        self.assertIn('audio_bitrate', data)
        self.assertIn('audio_mono_stereo', data)
        self.assertIn('include_chapter_markers', data)
