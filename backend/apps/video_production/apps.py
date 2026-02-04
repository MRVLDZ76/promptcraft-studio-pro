from django.apps import AppConfig


class VideoProductionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.video_production'
    verbose_name = 'Video Production'
    
    def ready(self):
        """Import signal handlers"""
        pass
