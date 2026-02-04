from rest_framework import viewsets, permissions
from .models import PromptProject, SequenceSegment
from .serializers import PromptProjectSerializer, SequenceSegmentSerializer


class PromptProjectViewSet(viewsets.ModelViewSet):
    serializer_class = PromptProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PromptProject.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SequenceSegmentViewSet(viewsets.ModelViewSet):
    serializer_class = SequenceSegmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SequenceSegment.objects.filter(project__user=self.request.user)
