"""
ChronStudio Models - Video Story Production
"""
from django.db import models
from apps.accounts.models import User
import uuid


class ChronStudioProject(models.Model):
    """Video story project"""
    CATEGORY_CHOICES = [
        ('BIBLICAL', 'Biblical'),
        ('HISTORICAL', 'Historical'),
        ('CUSTOM', 'Custom'),
        ('NEWS', 'News'),
        ('SPORTS', 'Sports'),
        ('LEARNING', 'Learning'),
        ('MUSIC', 'Music'),
        ('VIDEO_ADS', 'Video Ads'),
    ]
    STYLE_CHOICES = [
        ('DOCUMENTARY', 'Documentary'),
        ('CINEMATIC_DRAMA', 'Cinematic Drama'),
        ('ANIMATED_STYLIZED', 'Animated Stylized'),
        ('GRITTY_REALISM', 'Gritty Realism'),
    ]
    MODE_CHOICES = [('INTEGRATED', 'Integrated'), ('EXTERNAL', 'External')]
    STEP_CHOICES = [('TEMPLATE', 'Template'), ('INPUT', 'Input'), ('CHARACTERS', 'Characters'), ('STORYBOARD', 'Storyboard'), ('PRODUCTION', 'Production')]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('pending_render', 'Pending Render'),
        ('rendering', 'Rendering'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chronstudio_projects')
    title = models.CharField(max_length=500)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='INTEGRATED')
    current_step = models.CharField(max_length=20, choices=STEP_CHOICES, default='TEMPLATE')
    
    # NEW: Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    completion_percentage = models.IntegerField(default=0)  # 0-100
    
    segment = models.CharField(max_length=255, blank=True)  # "Genesis 1:1-3"
    content = models.TextField(blank=True)
    context_note = models.TextField(blank=True)
    summary = models.TextField(blank=True)  # AI-generated
    
    # NEW: Workflow-specific config (stores NewsConfig, SportsConfig, etc.)
    workflow_config = models.JSONField(default=dict, blank=True)
    
    setting_year = models.CharField(max_length=100, blank=True)
    setting_region = models.CharField(max_length=255, blank=True)
    setting_landscape = models.CharField(max_length=255, blank=True)
    style = models.CharField(max_length=30, choices=STYLE_CHOICES, default='DOCUMENTARY')
    
    # NEW: Asset tracking
    thumbnail_url = models.URLField(blank=True, null=True)
    final_video_url = models.URLField(blank=True, null=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # NEW: Social media uploads
    youtube_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    facebook_url = models.URLField(blank=True, null=True)
    
    # NEW: Organization
    folder = models.CharField(max_length=255, blank=True)
    is_favorite = models.BooleanField(default=False)
    
    is_archived = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chronstudio_projects'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'is_favorite']),
        ]


class ChronStudioCharacter(models.Model):
    """Character for video story"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='characters')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)  # "Protagonist", "Narrator"
    visual_description = models.TextField()
    voice_description = models.TextField()
    reference_image_url = models.URLField(blank=True, null=True)
    reference_image_prompt = models.TextField(blank=True)
    
    is_in_library = models.BooleanField(default=False)
    library_category = models.CharField(max_length=100, blank=True)
    sort_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chronstudio_characters'
        ordering = ['sort_order']


class ChronStudioScene(models.Model):
    """Scene/storyboard segment"""
    STATUS_CHOICES = [('pending', 'Pending'), ('generating', 'Generating'), ('completed', 'Completed'), ('failed', 'Failed')]
    GENERATION_METHOD_CHOICES = [
        ('single', 'Single Generation'),
        ('remix', 'Remix Extension'),
        ('daisy_chain', 'Daisy Chain Segments'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='scenes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    scene_number = models.IntegerField()
    duration_seconds = models.IntegerField(default=5)
    narrative_text = models.TextField()  # Story beat
    visual_prompt = models.TextField()  # Full Veo prompt
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    video_url = models.URLField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    
    character_ids = models.JSONField(default=list, blank=True)
    generation_params = models.JSONField(default=dict)
    
    # NEW: Intelligent generation tracking
    generation_method = models.CharField(
        max_length=20,
        choices=GENERATION_METHOD_CHOICES,
        default='single',
        help_text='Method used to generate this scene video'
    )
    segment_count = models.IntegerField(
        default=1,
        help_text='Number of segments if scene was split (daisy chain)'
    )
    segment_metadata = models.JSONField(
        null=True,
        blank=True,
        help_text='Stores segment boundaries, URLs, and generation details'
    )
    provider = models.CharField(
        max_length=20,
        blank=True,
        help_text='Video provider used: veo, sora, sora-pro'
    )
    video_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Provider-specific video ID (for remix capability)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chronstudio_scenes'
        ordering = ['scene_number']


class ChronStudioAsset(models.Model):
    """Track all generated assets"""
    ASSET_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('thumbnail', 'Thumbnail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='assets')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES)
    file_url = models.URLField()
    file_size_mb = models.FloatField()
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    
    # Metadata
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chronstudio_assets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'asset_type']),
            models.Index(fields=['project', 'asset_type']),
        ]


class UserOAuthToken(models.Model):
    """Store OAuth tokens for social media platforms"""
    PLATFORM_CHOICES = [
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='oauth_tokens')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    
    # Platform-specific data
    platform_user_id = models.CharField(max_length=255, blank=True)  # YouTube channel ID, etc.
    platform_username = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chronstudio_oauth_tokens'
        unique_together = [('user', 'platform')]
        ordering = ['-created_at']


class SocialMediaUpload(models.Model):
    """Track social media uploads"""
    PLATFORM_CHOICES = [
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('published', 'Published'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='social_uploads')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Platform-specific config
    # YouTube: title, description, tags, privacy, category
    # Instagram: caption, location
    # Facebook: message, privacy
    upload_config = models.JSONField(default=dict)
    
    # Progress tracking (0-100)
    progress = models.IntegerField(default=0)
    
    # Results
    platform_id = models.CharField(max_length=255, blank=True)  # Video ID on platform
    platform_url = models.URLField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Task tracking
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'chronstudio_social_uploads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'platform']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['project']),
        ]
