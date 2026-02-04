"""
Publishing Studio Models
=======================
Multi-modal content creation platform for books, audiobooks, and courses.

Architecture:
- BookProject: Main container (one book/course)
- Chapter: Logical subdivision
- ContentBlock: Atomic unit (one paragraph)

Critical Features:
- global_context: Prevents "Narrative Amnesia" (maintains consistency)
- random_seed: Ensures character visual consistency across images
- processing_mode: Controls AI transformation level (PRESERVE → REIMAGINE)
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import random

User = get_user_model()


class BookProject(models.Model):
    """
    Main container for a book/course project
    Supports: Novels, Courses, Guides, Memoirs, Custom content
    """
    
    # Ownership
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='book_projects'
    )
    
    # Basic Info
    title = models.CharField(
        max_length=500,
        help_text="Book or course title"
    )
    subtitle = models.CharField(
        max_length=500, 
        blank=True,
        help_text="Optional subtitle"
    )
    author_name = models.CharField(
        max_length=200,
        help_text="Author/creator name"
    )
    description = models.TextField(
        blank=True,
        help_text="Book description or synopsis"
    )
    
    # Project Type
    PROJECT_TYPES = [
        ('NOVEL', 'Novel/Fiction'),
        ('COURSE', 'Educational Course'),
        ('GUIDE', 'How-To Guide'),
        ('MEMOIR', 'Memoir/Biography'),
        ('CHILDREN', 'Children\'s Book'),
        ('TECHNICAL', 'Technical Manual'),
        ('CUSTOM', 'Custom Project'),
    ]
    project_type = models.CharField(
        max_length=20,
        choices=PROJECT_TYPES,
        default='CUSTOM'
    )
    
    # Processing Mode (5 levels)
    PROCESSING_MODES = [
        ('PRESERVE', 'Preserve - No AI modification'),
        ('POLISH', 'Polish - Grammar and flow only'),
        ('ENHANCE', 'Enhance - Add contextual details'),
        ('CREATIVE', 'Creative - Full creative interpretation'),
        ('REIMAGINE', 'Reimagine - Complete style transfer'),
    ]
    default_processing_mode = models.CharField(
        max_length=20,
        choices=PROCESSING_MODES,
        default='CREATIVE',
        help_text="Default AI processing mode for all blocks"
    )
    
    # CRITICAL FIX #1: Narrative Consistency
    global_context = models.TextField(
        blank=True,
        help_text=(
            "Persistent context injected into EVERY block's AI prompt. "
            "Example: 'Protagonist: Captain Kael (male, 35, cybernetic eye), "
            "Setting: Mars colony 2157, Tone: Dark suspenseful, "
            "Supporting cast: Dr. Sarah Chen (scientist, 28)'. "
            "Prevents 'Narrative Amnesia' where later chapters forget earlier details."
        )
    )
    
    # CRITICAL FIX #3: Character Visual Consistency
    random_seed = models.IntegerField(
        default=None,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(2147483647)],
        help_text=(
            "Fixed seed for image generation. "
            "Ensures protagonist looks identical in all illustrations. "
            "Auto-generated on project creation."
        )
    )
    
    # Generation Configuration
    enable_images = models.BooleanField(
        default=True,
        help_text="Generate illustrations for content blocks"
    )
    enable_audio = models.BooleanField(
        default=False,
        help_text="Generate TTS narration for content blocks"
    )
    image_style = models.CharField(
        max_length=200,
        default='Minimalist illustrations, clean lines, muted colors',
        help_text="Art style for image generation"
    )
    image_style_custom = models.TextField(
        blank=True,
        help_text="Custom image style description"
    )
    reference_images = models.JSONField(
        default=list,
        blank=True,
        help_text="Reference images for visual consistency (base64 or URLs)"
    )
    voice_model = models.CharField(
        max_length=50,
        default='alloy',
        help_text="OpenAI TTS voice model (alloy, echo, fable, onyx, nova, shimmer)"
    )
    
    # Cover & Publishing Details (NEW)
    cover_image_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="Generated or uploaded cover image"
    )
    cover_prompt = models.TextField(
        blank=True,
        help_text="AI prompt for cover generation"
    )
    back_cover_text = models.TextField(
        blank=True,
        help_text="Back cover blurb/synopsis"
    )
    author_bio = models.TextField(
        blank=True,
        help_text="Author biography for back cover and book pages"
    )
    dedication = models.TextField(
        blank=True,
        help_text="Dedication page text"
    )
    acknowledgments = models.TextField(
        blank=True,
        help_text="Acknowledgments section"
    )
    isbn = models.CharField(
        max_length=20,
        blank=True,
        help_text="ISBN number (optional)"
    )
    publisher = models.CharField(
        max_length=200,
        blank=True,
        help_text="Publisher name"
    )
    copyright_year = models.IntegerField(
        null=True,
        blank=True,
        help_text="Copyright year"
    )
    edition = models.CharField(
        max_length=50,
        blank=True,
        default='1st Edition',
        help_text="Edition information"
    )
    
    # User Prompt (Generation Instructions)
    user_prompt = models.TextField(
        blank=True,
        help_text="User's instructions for book generation"
    )
    
    # Output Formats
    generate_pdf = models.BooleanField(
        default=True,
        help_text="Generate PDF version"
    )
    generate_epub = models.BooleanField(
        default=True,
        help_text="Generate EPUB version (e-reader compatible)"
    )
    generate_html = models.BooleanField(
        default=True,
        help_text="Generate responsive HTML version"
    )
    generate_audiobook = models.BooleanField(
        default=False,
        help_text="Generate full audiobook (stitched MP3)"
    )
    
    # ========== MARKETPLACE & PRINT SPECIFICATIONS (NEW) ==========
    # For professional print-on-demand publishing (Amazon KDP, IngramSpark, etc.)
    
    marketplace = models.CharField(
        max_length=50,
        default='universal',
        help_text="Target marketplace: amazon_kdp, ingram_spark, barnes_noble, lulu, universal"
    )
    trim_size = models.CharField(
        max_length=50,
        default='kdp_6x9',
        help_text="Book dimensions: kdp_6x9, kdp_5x8, kdp_8.5x11, etc. (see marketplace_config.py)"
    )
    paper_type = models.CharField(
        max_length=50,
        default='kdp_white',
        help_text="Paper type: kdp_white, kdp_cream, ingram_50lb, ingram_70lb"
    )
    include_bleed = models.BooleanField(
        default=True,
        help_text="Add 0.125 inch bleed for color printing (required for KDP color books)"
    )
    color_interior = models.BooleanField(
        default=False,
        help_text="Full-color interior (affects printing cost and bleed requirements)"
    )
    spine_width = models.FloatField(
        default=0.0,
        help_text="Calculated spine width in inches (auto-calculated based on page count)"
    )
    cover_template_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="Generated full-wrap cover template (front + spine + back)"
    )
    
    # ========== AUDIOBOOK MARKETPLACE SPECIFICATIONS (NEW) ==========
    # For ACX/Audible, Findaway Voices, and other audiobook platforms
    
    audiobook_marketplace = models.CharField(
        max_length=50,
        default='acx_audible',
        help_text="Audiobook platform: acx_audible, findaway_voices, authors_republic, google_play"
    )
    audio_format = models.CharField(
        max_length=50,
        default='mp3_acx',
        help_text="Audio format: mp3_acx (192kbps), mp3_standard (128kbps), m4b, wav_master"
    )
    audio_bitrate = models.IntegerField(
        default=192,
        help_text="Audio bitrate in kbps (192 for ACX, 128 standard, 320 high quality)"
    )
    audio_mono_stereo = models.CharField(
        max_length=10,
        default='stereo',
        help_text="Channel configuration: mono or stereo"
    )
    include_chapter_markers = models.BooleanField(
        default=True,
        help_text="Include chapter markers in audiobook files (recommended)"
    )
    include_opening_credits = models.BooleanField(
        default=True,
        help_text="Generate opening credits file"
    )
    include_closing_credits = models.BooleanField(
        default=True,
        help_text="Generate closing credits file"
    )
    generate_retail_sample = models.BooleanField(
        default=True,
        help_text="Generate 5-minute retail sample (required for ACX/Audible)"
    )
    
    # Status Tracking
    STATUS_CHOICES = [
        ('DRAFT', 'Draft - Planning phase'),
        ('GENERATING', 'Generating - AI processing in progress'),
        ('COMPLETED', 'Completed - All formats ready'),
        ('FAILED', 'Failed - Generation error'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    progress_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Generation progress (0-100)"
    )
    
    # Generated Assets (URLs)
    pdf_url = models.URLField(blank=True, max_length=500)
    epub_url = models.URLField(blank=True, max_length=500)
    html_url = models.URLField(blank=True, max_length=500)
    audiobook_url = models.URLField(blank=True, max_length=500)
    
    # Metadata
    total_words = models.IntegerField(
        default=0,
        help_text="Total word count across all blocks"
    )
    total_blocks = models.IntegerField(
        default=0,
        help_text="Total number of content blocks"
    )
    estimated_pages = models.IntegerField(
        default=0,
        help_text="Estimated page count (based on word count)"
    )
    estimated_reading_time = models.IntegerField(
        default=0,
        help_text="Estimated reading time in minutes"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Book Project'
        verbose_name_plural = 'Book Projects'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.author_name}"
    
    def save(self, *args, **kwargs):
        """Auto-generate random_seed if not set"""
        if self.random_seed is None:
            self.random_seed = random.randint(0, 2147483647)
        super().save(*args, **kwargs)
    
    def calculate_estimated_pages(self):
        """Calculate estimated pages (250 words per page)"""
        self.estimated_pages = max(1, self.total_words // 250)
    
    def calculate_reading_time(self):
        """Calculate estimated reading time (200 words per minute)"""
        self.estimated_reading_time = max(1, self.total_words // 200)
    
    def update_statistics(self):
        """Recalculate all project statistics"""
        blocks = ContentBlock.objects.filter(chapter__book=self)
        self.total_blocks = blocks.count()
        self.total_words = sum(block.word_count for block in blocks)
        self.calculate_estimated_pages()
        self.calculate_reading_time()
        self.save()


class Chapter(models.Model):
    """
    Logical subdivision of a book
    Contains multiple ContentBlocks
    """
    
    book = models.ForeignKey(
        BookProject,
        on_delete=models.CASCADE,
        related_name='chapters'
    )
    
    chapter_number = models.IntegerField(
        help_text="Sequential chapter number (1, 2, 3...)"
    )
    
    title = models.CharField(
        max_length=500,
        help_text="Chapter title"
    )
    
    subtitle = models.CharField(
        max_length=500,
        blank=True,
        help_text="Optional chapter subtitle"
    )
    
    summary = models.TextField(
        blank=True,
        help_text="Chapter summary or description"
    )
    
    # Override book's default processing mode for this chapter
    processing_mode = models.CharField(
        max_length=20,
        blank=True,
        help_text="Override book's default processing mode (leave blank to use book default)"
    )
    
    # Chapter-level assets
    audio_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="Stitched audio for entire chapter"
    )
    
    # Metadata
    word_count = models.IntegerField(
        default=0,
        help_text="Total words in this chapter"
    )
    estimated_pages = models.IntegerField(
        default=0,
        help_text="Estimated pages for this chapter"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['book', 'chapter_number']
        unique_together = ['book', 'chapter_number']
        verbose_name = 'Chapter'
        verbose_name_plural = 'Chapters'
        indexes = [
            models.Index(fields=['book', 'chapter_number']),
        ]
    
    def __str__(self):
        return f"Chapter {self.chapter_number}: {self.title}"
    
    def update_statistics(self):
        """Recalculate chapter statistics"""
        blocks = self.blocks.all()
        self.word_count = sum(block.word_count for block in blocks)
        self.estimated_pages = max(1, self.word_count // 250)
        self.save()


class ContentBlock(models.Model):
    """
    Atomic unit - one paragraph or section
    The smallest independently-processable unit
    """
    
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='blocks'
    )
    
    sequence_order = models.IntegerField(
        help_text="Order within chapter (1, 2, 3...)"
    )
    
    # Content
    input_text = models.TextField(
        help_text="Raw user input (original text)"
    )
    
    processed_text = models.TextField(
        blank=True,
        help_text="AI-transformed output (final text)"
    )
    
    # Processing Configuration
    PROCESSING_MODES = [
        ('PRESERVE', 'Preserve'),
        ('POLISH', 'Polish'),
        ('ENHANCE', 'Enhance'),
        ('CREATIVE', 'Creative'),
        ('REIMAGINE', 'Reimagine'),
    ]
    processing_mode = models.CharField(
        max_length=20,
        choices=PROCESSING_MODES,
        help_text="AI processing mode for this specific block"
    )
    
    mode_parameters = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Additional parameters for processing mode. "
            "Example for REIMAGINE: {\"tone\": \"Suspenseful\", "
            "\"perspective\": \"First-person\", \"targetAudience\": \"Young Adult\"}"
        )
    )
    
    # Generated Assets
    image_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="Generated illustration URL"
    )
    
    image_prompt = models.TextField(
        blank=True,
        help_text="Generated image prompt (for debugging)"
    )
    
    audio_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="Generated TTS narration URL"
    )
    
    audio_duration = models.FloatField(
        default=0,
        help_text="Audio duration in seconds"
    )
    
    # Status Tracking
    STATUS_CHOICES = [
        ('PENDING', 'Pending - Not yet processed'),
        ('PROCESSING', 'Processing - AI transformation in progress'),
        ('COMPLETED', 'Completed - All tasks done'),
        ('FAILED', 'Failed - Error occurred'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    
    error_message = models.TextField(
        blank=True,
        help_text="Error details if status is FAILED"
    )
    
    # Metadata
    word_count = models.IntegerField(
        default=0,
        help_text="Word count of processed_text"
    )
    
    character_count = models.IntegerField(
        default=0,
        help_text="Character count of processed_text"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When AI processing completed"
    )
    
    class Meta:
        ordering = ['chapter', 'sequence_order']
        unique_together = ['chapter', 'sequence_order']
        verbose_name = 'Content Block'
        verbose_name_plural = 'Content Blocks'
        indexes = [
            models.Index(fields=['chapter', 'sequence_order']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Block {self.sequence_order} in {self.chapter}"
    
    def calculate_word_count(self):
        """Calculate word count from processed_text"""
        if self.processed_text:
            self.word_count = len(self.processed_text.split())
            self.character_count = len(self.processed_text)
        else:
            self.word_count = 0
            self.character_count = 0


class MediaAsset(models.Model):
    """
    User's personal media library for book images
    Stores uploaded, AI-generated, and Unsplash images
    """
    
    SOURCE_CHOICES = [
        ('upload', 'Upload'),
        ('generated', 'AI Generated'),
        ('unsplash', 'Unsplash'),
    ]
    
    # Ownership
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='media_assets'
    )
    book = models.ForeignKey(
        BookProject,
        on_delete=models.CASCADE,
        related_name='media_assets',
        null=True,
        blank=True,
        help_text="Optional: associate with specific book"
    )
    
    # File Info
    title = models.CharField(max_length=200)
    alt_text = models.CharField(max_length=500, blank=True)
    file = models.ImageField(upload_to='media_library/')
    thumbnail = models.ImageField(upload_to='media_library/thumbs/', blank=True)
    
    # Metadata
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='upload')
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)
    file_size = models.IntegerField(default=0, help_text="Size in bytes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Media Asset'
        verbose_name_plural = 'Media Assets'
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.source})"


class CustomTemplate(models.Model):
    """
    User-created custom book templates
    Stores template configuration (fonts, colors, layout) as JSON
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_templates'
    )
    name = models.CharField(
        max_length=100,
        help_text="Template name (e.g., 'My Professional Theme')"
    )
    template_data = models.JSONField(
        help_text="Template configuration (fonts, colors, layout)"
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Allow other users to use this template"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Custom Template'
        verbose_name_plural = 'Custom Templates'
        unique_together = [['user', 'name']]
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} by {self.user.username}"
