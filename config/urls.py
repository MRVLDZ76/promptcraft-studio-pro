"""
URL Configuration for PromptCraft Studio Pro
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation (commented until drf-spectacular installed)
    # path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/analyses/', include('apps.analyses.urls')),
    path('api/v1/chronstudio/', include('apps.chronstudio.urls')),
    path('api/v1/publishing/', include('apps.publishing.urls')),
    path('api/v1/prompts/', include('apps.prompts.urls')),
    path('api/v1/transcriptions/', include('apps.transcriptions.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/video-production/', include('apps.video_production.urls')),
    
    # Webhooks
    path('api/webhooks/', include('apps.subscriptions.webhook_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
