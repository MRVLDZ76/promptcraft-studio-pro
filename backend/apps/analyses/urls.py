from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreatorProfileViewSet, VideoTranscriptViewSet, DebateViewSet,
    DebateParticipantViewSet, ArgumentNodeViewSet,
    TemporalScoreViewSet, AnalysisViewSet
)

router = DefaultRouter()
router.register(r'creator-profiles', CreatorProfileViewSet, basename='creator-profile')
router.register(r'video-transcripts', VideoTranscriptViewSet, basename='video-transcript')
router.register(r'debates', DebateViewSet, basename='debate')
router.register(r'debate-participants', DebateParticipantViewSet, basename='debate-participant')
router.register(r'argument-nodes', ArgumentNodeViewSet, basename='argument-node')
router.register(r'temporal-scores', TemporalScoreViewSet, basename='temporal-score')
router.register(r'legacy-analyses', AnalysisViewSet, basename='legacy-analysis')

urlpatterns = [
    path('', include(router.urls)),
]
