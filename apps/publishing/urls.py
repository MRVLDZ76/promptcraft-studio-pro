"""
Publishing Studio URL Configuration
=====================================
API endpoints for book project management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.publishing.views import (
    BookProjectViewSet,
    ChapterViewSet,
    ContentBlockViewSet,
    MediaAssetViewSet,
    CustomTemplateViewSet
)

app_name = 'publishing'

router = DefaultRouter()
router.register(r'books', BookProjectViewSet, basename='book')
router.register(r'chapters', ChapterViewSet, basename='chapter')
router.register(r'blocks', ContentBlockViewSet, basename='block')
router.register(r'media', MediaAssetViewSet, basename='media')
router.register(r'custom-templates', CustomTemplateViewSet, basename='custom-template')

urlpatterns = [
    path('', include(router.urls)),
]
