from rest_framework import serializers
from .models import PromptProject, SequenceSegment


class SequenceSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SequenceSegment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PromptProjectSerializer(serializers.ModelSerializer):
    segments = SequenceSegmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = PromptProject
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
