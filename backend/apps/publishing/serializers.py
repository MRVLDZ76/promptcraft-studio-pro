"""
Publishing Studio API Serializers
===================================
REST API serializers for book projects
"""

import re
import logging
from rest_framework import serializers
from apps.publishing.models import BookProject, Chapter, ContentBlock, MediaAsset, CustomTemplate

logger = logging.getLogger(__name__)


class ContentBlockSerializer(serializers.ModelSerializer):
    """Serializer for individual content blocks"""
    
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'chapter', 'sequence_order',
            'input_text', 'processed_text',
            'processing_mode', 'mode_parameters',
            'image_url', 'image_prompt', 'audio_url', 'audio_duration',
            'status', 'error_message',
            'word_count', 'character_count',
            'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = [
            'processed_text', 'image_url', 'image_prompt',
            'audio_url', 'audio_duration', 'status', 'error_message',
            'word_count', 'character_count',
            'created_at', 'updated_at', 'processed_at'
        ]


class ContentBlockListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for block lists"""
    
    class Meta:
        model = ContentBlock
        fields = [
            'id', 'sequence_order', 'processing_mode',
            'status', 'word_count', 'has_image', 'has_audio'
        ]
    
    has_image = serializers.SerializerMethodField()
    has_audio = serializers.SerializerMethodField()
    
    def get_has_image(self, obj):
        return bool(obj.image_url)
    
    def get_has_audio(self, obj):
        return bool(obj.audio_url)


class ChapterSerializer(serializers.ModelSerializer):
    """Serializer for chapters with nested blocks"""
    
    blocks = ContentBlockSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'book', 'chapter_number',
            'title', 'subtitle', 'summary',
            'processing_mode', 'audio_url',
            'word_count', 'estimated_pages',
            'blocks',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'audio_url', 'word_count', 'estimated_pages',
            'created_at', 'updated_at'
        ]


class ChapterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for chapter lists"""
    
    block_count = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'chapter_number', 'title', 'subtitle',
            'word_count', 'estimated_pages', 'block_count',
            'completion_percentage'
        ]
    
    def get_block_count(self, obj):
        return obj.blocks.count()
    
    def get_completion_percentage(self, obj):
        total = obj.blocks.count()
        if total == 0:
            return 0
        completed = obj.blocks.filter(status='COMPLETED').count()
        return int((completed / total) * 100)


class BookProjectSerializer(serializers.ModelSerializer):
    """Full serializer for book projects with nested data"""
    
    chapters = ChapterListSerializer(many=True, read_only=True)
    
    class Meta:
        model = BookProject
        fields = [
            'id', 'user', 'title', 'subtitle', 'author_name', 'description',
            'project_type', 'default_processing_mode',
            'global_context', 'random_seed',
            'enable_images', 'enable_audio', 'image_style', 'voice_model',
            'generate_pdf', 'generate_epub', 'generate_html', 'generate_audiobook',
            'cover_image_url', 'cover_prompt', 'back_cover_text',
            'author_bio', 'dedication', 'acknowledgments',
            'isbn', 'publisher', 'copyright_year', 'edition',
            'user_prompt', 'image_style_custom', 'reference_images',
            # Marketplace & Print Specifications (NEW)
            'marketplace', 'trim_size', 'paper_type', 'include_bleed', 
            'color_interior', 'spine_width', 'cover_template_url',
            # Audiobook Marketplace Specifications (NEW)
            'audiobook_marketplace', 'audio_format', 'audio_bitrate',
            'audio_mono_stereo', 'include_chapter_markers',
            'include_opening_credits', 'include_closing_credits', 'generate_retail_sample',
            'status', 'progress_percentage',
            'pdf_url', 'epub_url', 'html_url', 'audiobook_url',
            'total_words', 'total_blocks', 'estimated_pages', 'estimated_reading_time',
            'chapters',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'user', 'random_seed', 'status', 'progress_percentage',
            'pdf_url', 'epub_url', 'html_url', 'audiobook_url',
            'total_words', 'total_blocks', 'estimated_pages', 'estimated_reading_time',
            'spine_width', 'cover_template_url',  # Auto-calculated
            'created_at', 'updated_at', 'completed_at'
        ]
    
    def validate_isbn(self, value):
        """Validate ISBN format (ISBN-10 or ISBN-13)"""
        if not value:
            return value
        
        # Remove hyphens and spaces
        cleaned = re.sub(r'[\s-]', '', value)
        
        # Check if it's a valid length (10 or 13 digits)
        if not re.match(r'^\d{10}$|^\d{13}$', cleaned):
            raise serializers.ValidationError(
                'ISBN must be 10 or 13 digits (e.g., 978-1-234567-89-0)'
            )
        
        return value
    
    def validate_copyright_year(self, value):
        """Validate copyright year is reasonable"""
        if value is not None and (value < 1900 or value > 2100):
            raise serializers.ValidationError(
                'Copyright year must be between 1900 and 2100'
            )
        return value


class BookProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for book project lists"""
    
    chapter_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BookProject
        fields = [
            'id', 'title', 'subtitle', 'author_name',
            'project_type', 'status', 'progress_percentage',
            'total_words', 'estimated_pages', 'chapter_count',
            'created_at', 'updated_at'
        ]
    
    def get_chapter_count(self, obj):
        return obj.chapters.count()


class BookProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new book projects"""
    
    user_prompt = serializers.CharField(
        write_only=True,
        required=True,
        help_text="Initial prompt describing the book to generate"
    )
    
    class Meta:
        model = BookProject
        fields = [
            'title', 'subtitle', 'author_name', 'description',
            'project_type', 'default_processing_mode',
            'global_context',
            'enable_images', 'enable_audio', 'image_style', 'voice_model',
            'generate_pdf', 'generate_epub', 'generate_html', 'generate_audiobook',
            'user_prompt'
        ]
    
    def create(self, validated_data):
        """Create book project and trigger outline generation"""
        user_prompt = validated_data.pop('user_prompt')
        # Remove 'user' from validated_data if it exists to prevent duplicate
        validated_data.pop('user', None)
        user = self.context['request'].user
        
        # Create book project with DRAFT status
        book = BookProject.objects.create(
            user=user,
            status='DRAFT',  # Start as draft
            **validated_data
        )
        
        # Try to trigger async outline generation, fall back to sync if Celery unavailable
        try:
            from apps.publishing.tasks import generate_book_outline
            generate_book_outline.delay(book.id, user_prompt)
        except Exception as e:
            # Celery broker not available - mark for manual processing
            logger.warning(f"Celery unavailable, book {book.id} created as draft: {e}")
            # Optionally: Store user_prompt for later processing
            book.description = f"Pending generation. Prompt: {user_prompt[:500]}"
            book.save()
        
        return book


class MediaAssetSerializer(serializers.ModelSerializer):
    """Serializer for user's media library"""
    
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MediaAsset
        fields = [
            'id', 'user', 'book', 'title', 'alt_text',
            'file', 'file_url', 'thumbnail', 'thumbnail_url',
            'source', 'width', 'height', 'file_size',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'width', 'height', 'file_size', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
        return None


class CustomTemplateSerializer(serializers.ModelSerializer):
    """Serializer for custom book templates"""
    
    class Meta:
        model = CustomTemplate
        fields = [
            'id', 'user', 'name', 'template_data',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_template_data(self, value):
        """Validate template data structure"""
        required_keys = ['fonts', 'colors', 'layout']
        
        for key in required_keys:
            if key not in value:
                raise serializers.ValidationError(
                    f"template_data must include '{key}' key"
                )
        
        # Validate fonts
        fonts = value.get('fonts', {})
        if not isinstance(fonts, dict):
            raise serializers.ValidationError("fonts must be a dictionary")
        
        # Validate colors
        colors = value.get('colors', {})
        if not isinstance(colors, dict):
            raise serializers.ValidationError("colors must be a dictionary")
        
        required_colors = ['primary', 'secondary', 'text', 'background']
        for color_key in required_colors:
            if color_key not in colors:
                raise serializers.ValidationError(
                    f"colors must include '{color_key}' key"
                )
        
        # Validate layout
        layout = value.get('layout', {})
        if not isinstance(layout, dict):
            raise serializers.ValidationError("layout must be a dictionary")
        
        return value
