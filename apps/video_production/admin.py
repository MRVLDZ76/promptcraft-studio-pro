from django.contrib import admin
from .models import RenderJob, VideoSequence


@admin.register(RenderJob)
class RenderJobAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'project', 'status', 'progress_percentage',
        'output_duration_seconds', 'created_at'
    ]
    list_filter = ['status', 'style', 'created_at']
    search_fields = ['id', 'user__email', 'project__title']
    readonly_fields = [
        'id', 'celery_task_id', 'output_video_url', 'output_duration_seconds',
        'file_size_mb', 'rendering_started_at', 'rendering_completed_at',
        'total_render_time_seconds', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'user', 'project', 'status', 'progress_percentage', 'current_step')
        }),
        ('Configuration', {
            'fields': ('scene_ids', 'style', 'target_duration', 'include_title_cards', 
                      'include_transitions', 'render_settings')
        }),
        ('LLM Director', {
            'fields': ('edit_decision_list', 'director_reasoning'),
            'classes': ('collapse',)
        }),
        ('Output', {
            'fields': ('output_video_url', 'output_duration_seconds', 'file_size_mb')
        }),
        ('Performance', {
            'fields': ('celery_task_id', 'rendering_started_at', 'rendering_completed_at',
                      'total_render_time_seconds'),
            'classes': ('collapse',)
        }),
        ('Error Handling', {
            'fields': ('error_message', 'retry_count'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VideoSequence)
class VideoSequenceAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_public', 'uses_count', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description', 'user__email']
    readonly_fields = ['uses_count', 'created_at', 'updated_at']
