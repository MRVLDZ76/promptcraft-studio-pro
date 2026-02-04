from rest_framework import serializers
from .models import RenderJob, VideoSequence
from apps.chronstudio.models import ChronStudioScene


class RenderJobSerializer(serializers.ModelSerializer):
    duration_display = serializers.CharField(read_only=True)
    is_terminal_state = serializers.BooleanField(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    scene_count = serializers.SerializerMethodField()
    
    class Meta:
        model = RenderJob
        fields = [
            'id', 'user', 'project', 'project_title', 'status', 'progress_percentage',
            'current_step', 'scene_ids', 'scene_count', 'style', 'target_duration',
            'include_title_cards', 'include_transitions', 'render_settings',
            'edit_decision_list', 'director_reasoning', 'output_video_url',
            'output_duration_seconds', 'duration_display', 'file_size_mb',
            'celery_task_id', 'rendering_started_at', 'rendering_completed_at',
            'total_render_time_seconds', 'error_message', 'retry_count',
            'is_terminal_state', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'status', 'progress_percentage', 'current_step',
            'edit_decision_list', 'director_reasoning', 'output_video_url',
            'output_duration_seconds', 'file_size_mb', 'celery_task_id',
            'rendering_started_at', 'rendering_completed_at',
            'total_render_time_seconds', 'error_message', 'retry_count',
            'created_at', 'updated_at'
        ]
    
    def get_scene_count(self, obj):
        """Return count of scenes in this job"""
        return len(obj.scene_ids) if obj.scene_ids else 0
    
    def validate_scene_ids(self, value):
        """Ensure all scene IDs exist and belong to the project"""
        if not value:
            raise serializers.ValidationError("At least one scene is required")
        
        # Validate scenes exist
        scenes = ChronStudioScene.objects.filter(id__in=value)
        if scenes.count() != len(value):
            raise serializers.ValidationError("Some scene IDs are invalid")
        
        return value


class RenderJobCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating render jobs"""
    
    class Meta:
        model = RenderJob
        fields = [
            'project', 'scene_ids', 'style', 'target_duration',
            'include_title_cards', 'include_transitions', 'render_settings'
        ]
    
    def validate(self, data):
        """Validate project and scenes match"""
        project = data.get('project')
        scene_ids = data.get('scene_ids', [])
        
        if not scene_ids:
            raise serializers.ValidationError({"scene_ids": "At least one scene is required"})
        
        # Verify scenes belong to project
        scenes = ChronStudioScene.objects.filter(
            id__in=scene_ids,
            project=project
        )
        
        if scenes.count() != len(scene_ids):
            raise serializers.ValidationError({
                "scene_ids": "All scenes must belong to the specified project"
            })
        
        # Verify scenes have video URLs
        scenes_without_video = scenes.filter(video_url__isnull=True).count()
        if scenes_without_video > 0:
            raise serializers.ValidationError({
                "scene_ids": f"{scenes_without_video} scene(s) don't have generated videos yet"
            })
        
        return data
    
    def create(self, validated_data):
        """Create render job with user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class VideoSequenceSerializer(serializers.ModelSerializer):
    scene_count = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoSequence
        fields = [
            'id', 'user', 'name', 'description', 'scene_order',
            'edit_template', 'is_public', 'uses_count', 'tags',
            'scene_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'uses_count', 'created_at', 'updated_at']
    
    def get_scene_count(self, obj):
        """Return count of scenes in sequence"""
        return len(obj.scene_order) if obj.scene_order else 0
