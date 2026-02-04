from django.apps import AppConfig


class PublishingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.publishing'
    verbose_name = 'Publishing Studio'
    
    def ready(self):
        """Import signals when app is ready"""
        pass
