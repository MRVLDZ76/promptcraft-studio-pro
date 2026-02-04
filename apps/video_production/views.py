from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from .models import RenderJob, VideoSequence
from .serializers import (
    RenderJobSerializer, RenderJobCreateSerializer,
    VideoSequenceSerializer
)


class RenderJobViewSet(viewsets.ModelViewSet):
    """Manage video render jobs"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return user's render jobs"""
        return RenderJob.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializer for creation"""
        if self.action == 'create':
            return RenderJobCreateSerializer
        return RenderJobSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new render job and start Celery task"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        render_job = serializer.save()
        
        # Import here to avoid circular dependency
        from .tasks import render_video_sequence
        
        # Start Celery task
        task = render_video_sequence.delay(str(render_job.id))
        
        # Update job with task ID
        render_job.celery_task_id = task.id
        render_job.save()
        
        # Return full serialized job
        output_serializer = RenderJobSerializer(render_job)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running render job"""
        job = self.get_object()
        
        if job.is_terminal_state:
            return Response(
                {'error': 'Job is already in a terminal state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Revoke Celery task
        if job.celery_task_id:
            from celery import current_app
            current_app.control.revoke(job.celery_task_id, terminate=True)
        
        # Update job status
        job.status = 'cancelled'
        job.save()
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry a failed render job"""
        job = self.get_object()
        
        if job.status != 'failed':
            return Response(
                {'error': 'Can only retry failed jobs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset job status
        job.status = 'queued'
        job.progress_percentage = 0
        job.current_step = ''
        job.error_message = ''
        job.retry_count += 1
        job.save()
        
        # Start new Celery task
        from .tasks import render_video_sequence
        task = render_video_sequence.delay(str(job.id))
        
        job.celery_task_id = task.id
        job.save()
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active (non-terminal) render jobs"""
        active_jobs = self.get_queryset().exclude(
            status__in=['completed', 'failed', 'cancelled']
        )
        serializer = self.get_serializer(active_jobs, many=True)
        return Response(serializer.data)


class VideoSequenceViewSet(viewsets.ModelViewSet):
    """Manage video sequences/templates"""
    serializer_class = VideoSequenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return user's sequences + public ones"""
        return VideoSequence.objects.filter(
            models.Q(user=self.request.user) | models.Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        """Set user on creation"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        """Mark sequence as used (increment counter)"""
        sequence = self.get_object()
        sequence.uses_count += 1
        sequence.save()
        
        serializer = self.get_serializer(sequence)
        return Response(serializer.data)
