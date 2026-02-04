from django.contrib import admin
from .models import (
    CreatorProfile, VideoTranscript, Debate, DebateParticipant,
    ArgumentNode, TemporalScore, Analysis
)

@admin.register(CreatorProfile)
class CreatorProfileAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'platform', 'username', 'verified', 'created_at']
    list_filter = ['platform', 'verified']
    search_fields = ['display_name', 'username', 'handle']

@admin.register(VideoTranscript)
class VideoTranscriptAdmin(admin.ModelAdmin):
    list_display = ['title', 'video_id', 'channel_name', 'created_at']
    search_fields = ['title', 'video_id', 'channel_name']

@admin.register(Debate)
class DebateAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'mode', 'analysis_status', 'created_at']
    list_filter = ['mode', 'analysis_status']
    search_fields = ['title', 'user__username']

@admin.register(DebateParticipant)
class DebateParticipantAdmin(admin.ModelAdmin):
    list_display = ['name', 'debate', 'participant_label', 'final_score']

@admin.register(ArgumentNode)
class ArgumentNodeAdmin(admin.ModelAdmin):
    list_display = ['debate', 'participant', 'logic_status', 'score_impact']
    list_filter = ['logic_status', 'toulmin_component']

@admin.register(TemporalScore)
class TemporalScoreAdmin(admin.ModelAdmin):
    list_display = ['debate', 'timestamp', 'participant_a_score', 'participant_b_score', 'created_at']

@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ['participant_a_name', 'participant_b_name', 'mode', 'user', 'created_at']
    list_filter = ['mode']
    search_fields = ['participant_a_name', 'participant_b_name']
