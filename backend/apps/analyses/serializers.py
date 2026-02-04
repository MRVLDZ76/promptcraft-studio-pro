from rest_framework import serializers
from .models import (
    CreatorProfile, VideoTranscript, Debate, DebateParticipant,
    ArgumentNode, TemporalScore, Analysis
)

class CreatorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreatorProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class VideoTranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoTranscript
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DebateParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebateParticipant
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ArgumentNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArgumentNode
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class TemporalScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporalScore
        fields = '__all__'
        read_only_fields = ['created_at']


class DebateSerializer(serializers.ModelSerializer):
    participants = DebateParticipantSerializer(many=True, read_only=True)
    argument_nodes = ArgumentNodeSerializer(many=True, read_only=True)
    temporal_scores = TemporalScoreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Debate
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'completed_at']
