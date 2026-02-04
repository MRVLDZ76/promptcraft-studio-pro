from rest_framework import serializers
from .models import Transcription


class TranscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transcription
        fields = '__all__'
        read_only_fields = ['user', 'status', 'transcript_text', 'diarization_data', 'summary', 'error_message', 'processing_time', 'created_at', 'updated_at', 'completed_at']
