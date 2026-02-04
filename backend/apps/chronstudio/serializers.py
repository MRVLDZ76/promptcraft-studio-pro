from rest_framework import serializers
from .models import ChronStudioProject, ChronStudioCharacter, ChronStudioScene, ChronStudioAsset, SocialMediaUpload


class ChronStudioCharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronStudioCharacter
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ChronStudioSceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronStudioScene
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ChronStudioAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronStudioAsset
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class SocialMediaUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaUpload
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'published_at']


class ChronStudioProjectSerializer(serializers.ModelSerializer):
    characters = ChronStudioCharacterSerializer(many=True, read_only=True)
    scenes = ChronStudioSceneSerializer(many=True, read_only=True)
    assets = ChronStudioAssetSerializer(many=True, read_only=True)
    social_uploads = SocialMediaUploadSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChronStudioProject
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'completed_at']
