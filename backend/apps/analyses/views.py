from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from .models import (
    CreatorProfile, VideoTranscript, Debate, DebateParticipant,
    ArgumentNode, TemporalScore, Analysis
)
from .serializers import (
    CreatorProfileSerializer, VideoTranscriptSerializer, DebateSerializer,
    DebateParticipantSerializer, ArgumentNodeSerializer,
    TemporalScoreSerializer, AnalysisSerializer
)


class AutoSaveThrottle(UserRateThrottle):
    """Custom throttle for auto-save endpoints - 60 requests per minute"""
    rate = '60/min'


class CreatorProfileViewSet(viewsets.ModelViewSet):
    queryset = CreatorProfile.objects.all()
    serializer_class = CreatorProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class VideoTranscriptViewSet(viewsets.ModelViewSet):
    queryset = VideoTranscript.objects.all()
    serializer_class = VideoTranscriptSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        video_id = self.request.query_params.get('video_id', None)
        if video_id:
            queryset = queryset.filter(video_id=video_id)
        return queryset


class DebateViewSet(viewsets.ModelViewSet):
    serializer_class = DebateSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AutoSaveThrottle]
    
    def get_queryset(self):
        return Debate.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DebateParticipantViewSet(viewsets.ModelViewSet):
    queryset = DebateParticipant.objects.all()
    serializer_class = DebateParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]


class ArgumentNodeViewSet(viewsets.ModelViewSet):
    queryset = ArgumentNode.objects.all()
    serializer_class = ArgumentNodeSerializer
    permission_classes = [permissions.IsAuthenticated]


class TemporalScoreViewSet(viewsets.ModelViewSet):
    queryset = TemporalScore.objects.all()
    serializer_class = TemporalScoreSerializer
    permission_classes = [permissions.IsAuthenticated]


class AnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Analysis.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
