"""
Video Production Models - Render Jobs and Video Sequences
"""
from django.db import models
from apps.accounts.models import User
from apps.chronstudio.models import ChronStudioProject, ChronStudioScene
import uuid


class RenderJob(models.Model):
    """Track video rendering jobs"""
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('analyzing', 'Analyzing Content'),    # LLM Director phase
        ('downloading', 'Downloading Scenes'),
        ('rendering', 'Rendering Video'),      # FFmpeg/MoviePy phase
        ('uploading', 'Uploading'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled')
    ]
    
    STYLE_CHOICES = [
        ('dynamic', 'Dynamic'),
        ('contemplative', 'Contemplative'),
        ('action_packed', 'Action Packed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='render_jobs')
    project = models.ForeignKey(ChronStudioProject, on_delete=models.CASCADE, related_name='render_jobs')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='queued')
    progress_percentage = models.IntegerField(default=0)
    current_step = models.CharField(max_length=255, blank=True)  # Human-readable status
    
    # Input configuration
    scene_ids = models.JSONField(default=list)  # List of ChronStudioScene UUIDs
    style = models.CharField(max_length=20, choices=STYLE_CHOICES, default='dynamic')
    target_duration = models.IntegerField(null=True, blank=True)  # seconds, None = use all
    include_title_cards = models.BooleanField(default=True)
    include_transitions = models.BooleanField(default=True)
    render_settings = models.JSONField(default=dict)  # Additional user preferences
    
    # LLM Director output
    edit_decision_list = models.JSONField(null=True, blank=True)  # EDL from LLM
    director_reasoning = models.TextField(blank=True)  # LLM explanation
    
    # Output
    output_video_url = models.URLField(blank=True)
    output_duration_seconds = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    file_size_mb = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Performance metrics
    celery_task_id = models.CharField(max_length=255, blank=True)
    rendering_started_at = models.DateTimeField(null=True, blank=True)
    rendering_completed_at = models.DateTimeField(null=True, blank=True)
    total_render_time_seconds = models.IntegerField(default=0)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'render_jobs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['celery_task_id']),
        ]
    
    def __str__(self):
        return f"Render Job {self.id} - {self.project.title} ({self.status})"
    
    @property
    def duration_display(self):
        """Human-readable duration"""
        if self.output_duration_seconds:
            minutes = int(self.output_duration_seconds // 60)
            seconds = int(self.output_duration_seconds % 60)
            return f"{minutes}m {seconds}s"
        return "N/A"
    
    @property
    def is_terminal_state(self):
        """Check if job is in a final state"""
        return self.status in ['completed', 'failed', 'cancelled']


class VideoSequence(models.Model):
    """Reusable video sequences/templates"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_sequences')
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Sequence definition
    scene_order = models.JSONField(default=list)  # Ordered list of scene IDs
    edit_template = models.JSONField(default=dict)  # Reusable EDL template
    
    # Metadata
    is_public = models.BooleanField(default=False)
    uses_count = models.IntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'video_sequences'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} by {self.user.email}"
