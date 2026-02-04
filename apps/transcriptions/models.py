"""
Transcription Models - Audio/Video Transcription
"""
from django.db import models  # pyright: ignore[reportMissingModuleSource]
from apps.accounts.models import User
import uuid


class Transcription(models.Model):
    """Transcription record"""
    SOURCE_CHOICES = [('recording', 'Recording'), ('upload', 'Upload'), ('youtube', 'YouTube')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transcriptions')
    
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    source_url = models.URLField(blank=True, null=True)
    audio_duration = models.IntegerField(null=True, blank=True)  # seconds
    
    transcript_text = models.TextField()
    language = models.CharField(max_length=10, default='en')
    diarization_data = models.JSONField(null=True, blank=True)  # Speaker data
    summary = models.TextField(blank=True)
    
    title = models.CharField(max_length=500, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'transcriptions'
        ordering = ['-created_at']
