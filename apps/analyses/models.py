"""
Analysis & Debate Models - PromptCraft Studio Pro
Complete implementation based on Supabase schemas
"""
from django.db import models
from apps.accounts.models import User
import uuid


class CreatorProfile(models.Model):
    """YouTube/Instagram/TikTok creator cache"""
    PLATFORM_CHOICES = [('youtube', 'YouTube'), ('instagram', 'Instagram'), ('tiktok', 'TikTok'), ('twitter', 'Twitter')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    username = models.CharField(max_length=255)
    handle = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    thumbnail = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True)
    followers_count = models.BigIntegerField(default=0)
    followers_text = models.CharField(max_length=100, blank=True)
    verified = models.BooleanField(default=False)
    raw_data = models.JSONField(default=dict)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'creator_profiles'
        unique_together = [['platform', 'username']]


class VideoTranscript(models.Model):
    """Video transcript cache"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video_id = models.CharField(max_length=255, unique=True)
    video_url = models.URLField()
    title = models.CharField(max_length=500, blank=True)
    channel_name = models.CharField(max_length=255, blank=True)
    transcript_text = models.TextField()
    transcript_snippets = models.JSONField(default=list)
    language_code = models.CharField(max_length=10, default='en')
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'video_transcripts'


class Debate(models.Model):
    """Analysis Studio - Debate/Analysis"""
    MODE_CHOICES = [('arena', 'Arena'), ('monologue', 'Solo')]
    STATUS_CHOICES = [('draft', 'Draft'), ('analyzing', 'Analyzing'), ('completed', 'Completed'), ('failed', 'Failed')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debates')
    title = models.CharField(max_length=500)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='arena')
    video_url = models.URLField(blank=True, null=True)
    transcript_text = models.TextField(blank=True)
    analysis_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    tags = models.JSONField(default=list, blank=True)  # Using JSONField for SQLite
    final_verdict = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'debates'
        ordering = ['-updated_at']


class DebateParticipant(models.Model):
    """Debate participants"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    debate = models.ForeignKey(Debate, on_delete=models.CASCADE, related_name='participants')
    name = models.CharField(max_length=255)
    participant_label = models.CharField(max_length=10)  # 'A' or 'B'
    social_url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'debate_participants'


class ArgumentNode(models.Model):
    """Argument/claim in debate"""
    TOULMIN_CHOICES = [('CLAIM', 'Claim'), ('GROUNDS', 'Grounds'), ('WARRANT', 'Warrant')]
    LOGIC_CHOICES = [('VALID', 'Valid'), ('FALLACY', 'Fallacy'), ('WEAK_EVIDENCE', 'Weak')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    debate = models.ForeignKey(Debate, on_delete=models.CASCADE, related_name='argument_nodes')
    participant = models.ForeignKey(DebateParticipant, on_delete=models.CASCADE)
    timestamp_in = models.DecimalField(max_digits=10, decimal_places=3)
    timestamp_out = models.DecimalField(max_digits=10, decimal_places=3)
    claim_text_short = models.CharField(max_length=500)
    claim_text_full = models.TextField()
    toulmin_component = models.CharField(max_length=20, choices=TOULMIN_CHOICES)
    logic_status = models.CharField(max_length=20, choices=LOGIC_CHOICES)
    score_impact = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'argument_nodes'
        ordering = ['timestamp_in']


class TemporalScore(models.Model):
    """Time-based scoring"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    debate = models.ForeignKey(Debate, on_delete=models.CASCADE, related_name='temporal_scores')
    timestamp = models.DecimalField(max_digits=10, decimal_places=3)
    participant_a_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    participant_b_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'temporal_scores'


class Analysis(models.Model):
    """Legacy analysis (compatibility)"""
    MODE_CHOICES = [('arena', 'Arena'), ('solo', 'Solo')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    participant_a_name = models.CharField(max_length=255)
    participant_b_name = models.CharField(max_length=255, blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    transcript_text = models.TextField(blank=True)
    prompt = models.TextField()
    result_text = models.TextField(blank=True)
    result_json = models.JSONField(default=dict)
    score_a = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    score_b = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)  # Using JSONField for SQLite
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analyses'
        ordering = ['-created_at']
