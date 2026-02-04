from django.contrib import admin
from .models import Transcription

@admin.register(Transcription)
class TranscriptionAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'source_type', 'language', 'created_at']
    list_filter = ['source_type', 'language']
    search_fields = ['title', 'transcript_text']