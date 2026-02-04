from django.contrib import admin
from .models import PromptProject, SequenceSegment

@admin.register(PromptProject)
class PromptProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'mode', 'is_favorite', 'created_at']
    list_filter = ['mode', 'is_favorite']
    search_fields = ['name', 'user__username']

@admin.register(SequenceSegment)
class SequenceSegmentAdmin(admin.ModelAdmin):
    list_display = ['project', 'segment_number', 'duration_seconds']