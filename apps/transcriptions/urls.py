from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TranscriptionViewSet

router = DefaultRouter()
router.register(r'transcriptions', TranscriptionViewSet, basename='transcription')

urlpatterns = [
    path('', include(router.urls)),
]
