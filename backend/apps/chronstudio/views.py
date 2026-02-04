from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, BooleanFilter
from django.db.models import Count, Q, Sum
from .models import ChronStudioProject, ChronStudioCharacter, ChronStudioScene, ChronStudioAsset, SocialMediaUpload
from .serializers import (
    ChronStudioProjectSerializer, ChronStudioCharacterSerializer,
    ChronStudioSceneSerializer, ChronStudioAssetSerializer, SocialMediaUploadSerializer
)
from .services import NewsService, SportsService, LearningService, MusicService


class ProjectFilterSet(FilterSet):
    """Custom filter for projects"""
    search = CharFilter(method='filter_search')
    
    class Meta:
        model = ChronStudioProject
        fields = {
            'category': ['exact'],
            'status': ['exact'],
            'is_favorite': ['exact'],
            'folder': ['exact', 'icontains'],
            'created_at': ['gte', 'lte'],
            'updated_at': ['gte', 'lte'],
        }
    
    def filter_search(self, queryset, name, value):
        """Search in title and tags"""
        return queryset.filter(
            Q(title__icontains=value) | Q(tags__icontains=value)
        )


class ChronStudioProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ChronStudioProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ProjectFilterSet
    ordering_fields = ['created_at', 'updated_at', 'title', 'completion_percentage']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        queryset = ChronStudioProject.objects.filter(user=self.request.user)
        
        # Exclude archived by default unless explicitly requested
        if self.request.query_params.get('status') != 'archived':
            queryset = queryset.exclude(status='archived')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Create a copy of the project
        POST /api/v1/chronstudio/projects/{id}/duplicate/
        Body: { "title": "New Title" } (optional)
        """
        original = self.get_object()
        
        # Create copy
        project_copy = ChronStudioProject.objects.create(
            user=request.user,
            title=request.data.get('title', f"{original.title} (Copy)"),
            category=original.category,
            mode=original.mode,
            segment=original.segment,
            content=original.content,
            context_note=original.context_note,
            summary=original.summary,
            setting_year=original.setting_year,
            setting_region=original.setting_region,
            setting_landscape=original.setting_landscape,
            style=original.style,
            workflow_config=original.workflow_config,
            folder=original.folder,
            tags=original.tags,
            status='draft',
        )
        
        # Copy characters
        for char in original.characters.all():
            ChronStudioCharacter.objects.create(
                project=project_copy,
                user=request.user,
                name=char.name,
                role=char.role,
                visual_description=char.visual_description,
                voice_description=char.voice_description,
                reference_image_url=char.reference_image_url,
                reference_image_prompt=char.reference_image_prompt,
            )
        
        # Copy scenes (without video URLs - fresh generation needed)
        for scene in original.scenes.all():
            ChronStudioScene.objects.create(
                project=project_copy,
                user=request.user,
                scene_number=scene.scene_number,
                duration_seconds=scene.duration_seconds,
                narrative_text=scene.narrative_text,
                visual_prompt=scene.visual_prompt,
                character_ids=scene.character_ids,
                status='pending',
            )
        
        serializer = self.get_serializer(project_copy)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive project (soft delete)
        POST /api/v1/chronstudio/projects/{id}/archive/
        """
        project = self.get_object()
        project.status = 'archived'
        project.save()
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore archived project
        POST /api/v1/chronstudio/projects/{id}/restore/
        """
        project = self.get_object()
        if project.status == 'archived':
            project.status = 'draft'
            project.save()
        return Response({'status': project.status})
    
    @action(detail=True, methods=['post'])
    def render(self, request, pk=None):
        """
        Convenience endpoint to create a render job for this project
        
        POST /api/v1/chronstudio/projects/{id}/render/
        {
            "scene_ids": ["uuid1", "uuid2", ...],  // Optional, defaults to all completed scenes
            "include_transitions": true,
            "include_title_cards": false,
            "title_card_style": "minimal"
        }
        """
        project = self.get_object()
        
        # Get scene IDs from request or default to all completed scenes
        scene_ids = request.data.get('scene_ids')
        if not scene_ids:
            # Auto-select all completed scenes
            completed_scenes = ChronStudioScene.objects.filter(
                project=project,
                status='completed',
                video_url__isnull=False
            ).values_list('id', flat=True)
            scene_ids = [str(sid) for sid in completed_scenes]
        
        if not scene_ids:
            return Response(
                {'error': 'No completed scenes found to render'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate scenes belong to this project
        valid_scenes = ChronStudioScene.objects.filter(
            id__in=scene_ids,
            project=project
        ).count()
        
        if valid_scenes != len(scene_ids):
            return Response(
                {'error': 'Some scene IDs are invalid or don\'t belong to this project'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create render job
        from apps.video_production.models import RenderJob
        from apps.video_production.serializers import RenderJobSerializer
        from apps.video_production.tasks import render_video_sequence
        
        render_job = RenderJob.objects.create(
            user=request.user,
            project=project,
            scene_ids=scene_ids,
            include_transitions=request.data.get('include_transitions', True),
            include_title_cards=request.data.get('include_title_cards', False),
            title_card_style=request.data.get('title_card_style', 'minimal'),
        )
        
        # Start Celery task
        task = render_video_sequence.delay(str(render_job.id))
        render_job.celery_task_id = task.id
        render_job.save()
        
        serializer = RenderJobSerializer(render_job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChronStudioCharacterViewSet(viewsets.ModelViewSet):
    serializer_class = ChronStudioCharacterSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChronStudioCharacter.objects.filter(project__user=self.request.user)


class ChronStudioSceneViewSet(viewsets.ModelViewSet):
    serializer_class = ChronStudioSceneSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChronStudioScene.objects.filter(project__user=self.request.user)


class AssetFilterSet(FilterSet):
    """Custom filter for assets"""
    class Meta:
        model = ChronStudioAsset
        fields = {
            'project': ['exact'],
            'asset_type': ['exact'],
            'created_at': ['gte', 'lte'],
        }


class ChronStudioAssetViewSet(viewsets.ModelViewSet):
    """ViewSet for asset management"""
    serializer_class = ChronStudioAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AssetFilterSet
    ordering_fields = ['created_at', 'file_size_mb']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return ChronStudioAsset.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SocialMediaUploadFilterSet(FilterSet):
    """Custom filter for social uploads"""
    class Meta:
        model = SocialMediaUpload
        fields = {
            'project': ['exact'],
            'platform': ['exact'],
            'status': ['exact'],
            'created_at': ['gte', 'lte'],
        }


class SocialMediaUploadViewSet(viewsets.ModelViewSet):
    """ViewSet for social media uploads"""
    serializer_class = SocialMediaUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = SocialMediaUploadFilterSet
    ordering_fields = ['created_at', 'published_at']
    ordering = ['-created_at']
    http_method_names = ['get', 'post', 'patch', 'delete']  # No PUT
    
    def get_queryset(self):
        return SocialMediaUpload.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Create upload and trigger Celery task"""
        upload = serializer.save(user=self.request.user)
        
        # Trigger async upload task for YouTube
        if upload.platform == 'youtube':
            from .tasks import upload_video_to_youtube
            task = upload_video_to_youtube.delay(str(upload.id))
            upload.celery_task_id = task.id
            upload.save()
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel pending upload
        POST /api/v1/chronstudio/social-uploads/{id}/cancel/
        """
        from celery import current_app
        
        upload = self.get_object()
        
        if upload.status in ['pending', 'uploading']:
            # Revoke Celery task if exists
            if upload.celery_task_id:
                current_app.control.revoke(upload.celery_task_id, terminate=True)
            
            upload.status = 'failed'
            upload.error_message = 'Cancelled by user'
            upload.save()
            return Response({'status': 'cancelled'})
        
        return Response(
            {'error': f'Cannot cancel upload with status: {upload.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """
        Retry failed upload
        POST /api/v1/chronstudio/social-uploads/{id}/retry/
        """
        upload = self.get_object()
        
        if upload.status != 'failed':
            return Response(
                {'error': 'Can only retry failed uploads'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status and retry
        upload.status = 'pending'
        upload.progress = 0
        upload.error_message = ''
        upload.save()
        
        # Trigger upload task
        if upload.platform == 'youtube':
            from .tasks import upload_video_to_youtube
            task = upload_video_to_youtube.delay(str(upload.id))
            upload.celery_task_id = task.id
            upload.save()
        
        return Response({'status': 'retrying'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Dashboard statistics
    GET /api/v1/chronstudio/dashboard/stats/
    
    Returns:
    {
        "total_projects": 15,
        "by_category": {"NEWS": 5, "SPORTS": 3, ...},
        "by_status": {"draft": 2, "completed": 10, ...},
        "total_assets": 45,
        "total_storage_mb": 1234.5,
        "completed_projects": 10,
        "in_progress_projects": 3
    }
    """
    user = request.user
    
    # Project counts
    projects = ChronStudioProject.objects.filter(user=user).exclude(status='archived')
    total_projects = projects.count()
    
    # By category
    by_category = {}
    for item in projects.values('category').annotate(count=Count('id')):
        by_category[item['category']] = item['count']
    
    # By status
    by_status = {}
    for item in projects.values('status').annotate(count=Count('id')):
        by_status[item['status']] = item['count']
    
    # Assets
    assets = ChronStudioAsset.objects.filter(user=user)
    total_assets = assets.count()
    total_storage = assets.aggregate(total=Sum('file_size_mb'))['total'] or 0.0
    
    # Quick stats
    completed_projects = projects.filter(status='completed').count()
    in_progress_projects = projects.filter(status='in_progress').count()
    
    return Response({
        'total_projects': total_projects,
        'by_category': by_category,
        'by_status': by_status,
        'total_assets': total_assets,
        'total_storage_mb': round(total_storage, 2),
        'completed_projects': completed_projects,
        'in_progress_projects': in_progress_projects,
    })


# Workflow Fetch Endpoints

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fetch_news_workflow(request):
    """
    Fetch news articles and generate scene suggestions
    POST /api/v1/chronstudio/workflows/news/fetch/
    
    Body: NewsConfig
    {
        "keywords": ["election", "politics"],
        "countries": ["us"],
        "languages": ["en"],
        "sortBy": "publishedAt"
    }
    
    Returns:
    {
        "articles": [...],
        "suggested_scenes": [...],
        "source": "tavily|newsapi|gnews|mock"
    }
    """
    config = request.data
    service = NewsService()
    
    # Fetch news articles
    news_data = service.fetch_news(config)
    
    # Generate scene suggestions
    suggested_scenes = service.generate_scenes_from_news(news_data.get('articles', []))
    
    return Response({
        **news_data,
        'suggested_scenes': suggested_scenes,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fetch_sports_workflow(request):
    """
    Fetch sports data and generate scene suggestions
    POST /api/v1/chronstudio/workflows/sports/fetch/
    
    Body: SportsConfig
    {
        "sport": "soccer",
        "league": "Premier League",
        "eventType": "recap"
    }
    
    Returns:
    {
        "events": [...],
        "teams": [...],
        "suggested_scenes": [...],
        "source": "sportsdb|api-football|mock"
    }
    """
    config = request.data
    service = SportsService()
    
    # Fetch sports data
    sports_data = service.fetch_sports(config)
    
    # Generate scene suggestions
    suggested_scenes = service.generate_scenes_from_sports(sports_data)
    
    return Response({
        **sports_data,
        'suggested_scenes': suggested_scenes,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fetch_learning_workflow(request):
    """
    Fetch educational content and generate scene suggestions
    POST /api/v1/chronstudio/workflows/learning/fetch/
    
    Body: LearningConfig
    {
        "subject": "science",
        "topic": "Photosynthesis",
        "difficulty": "intermediate",
        "visualStyle": "animated"
    }
    
    Returns:
    {
        "content": {...},
        "references": [...],
        "suggested_scenes": [...],
        "source": "wikipedia|mock"
    }
    """
    config = request.data
    service = LearningService()
    
    # Fetch learning content
    learning_data = service.fetch_learning_content(config)
    
    # Generate scene suggestions
    suggested_scenes = service.generate_scenes_from_learning({**learning_data, **config})
    
    return Response({
        **learning_data,
        'suggested_scenes': suggested_scenes,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fetch_music_workflow(request):
    """
    Fetch music data and generate scene suggestions
    POST /api/v1/chronstudio/workflows/music/fetch/
    
    Body: MusicConfig
    {
        "artistName": "Artist",
        "songTitle": "Song",
        "videoType": "lyric"
    }
    
    Returns:
    {
        "track": {...},
        "lyrics": [...],
        "suggested_scenes": [...],
        "source": "spotify|genius|mock"
    }
    """
    config = request.data
    service = MusicService()
    
    # Fetch music data
    music_data = service.fetch_music_data(config)
    
    # Generate scene suggestions
    suggested_scenes = service.generate_scenes_from_music(music_data, config)
    
    return Response({
        **music_data,
        'suggested_scenes': suggested_scenes,
    })
