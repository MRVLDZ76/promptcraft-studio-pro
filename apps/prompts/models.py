"""
Prompt Studio Models - Prompt Generation System
"""
from django.db import models
from apps.accounts.models import User
import uuid


class PromptProject(models.Model):
    """Prompt generation project"""
    MODE_CHOICES = [('image', 'Image'), ('video', 'Video'), ('sequence', 'Sequence'), ('audio', 'Audio')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prompt_projects')
    name = models.CharField(max_length=255)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='image')
    prompt_state = models.JSONField()  # Current prompt state
    final_prompt = models.TextField(blank=True)
    prompt_history = models.JSONField(default=list, blank=True)
    is_favorite = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prompt_projects'
        ordering = ['-updated_at']


class SequenceSegment(models.Model):
    """Video sequence storyboard segment"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PromptProject, on_delete=models.CASCADE, related_name='segments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    segment_number = models.IntegerField()
    duration_seconds = models.IntegerField(default=5)
    action_description = models.TextField()
    camera_movement = models.CharField(max_length=255)
    visual_style = models.CharField(max_length=255)
    generation_prompt = models.TextField()
    sort_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sequence_segments'
        ordering = ['sort_order']
