"""
Publishing Studio API Views
=============================
REST API endpoints for book project management
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from django.shortcuts import get_object_or_404

from apps.publishing.models import BookProject, Chapter, ContentBlock, MediaAsset, CustomTemplate
from apps.publishing.serializers import (
    BookProjectSerializer,
    BookProjectListSerializer,
    BookProjectCreateSerializer,
    ChapterSerializer,
    ChapterListSerializer,
    ContentBlockSerializer,
    ContentBlockListSerializer,
    MediaAssetSerializer,
    CustomTemplateSerializer
)
from apps.publishing.tasks import (
    generate_book_outline,
    process_single_block,
    compile_book_outputs
)

logger = logging.getLogger(__name__)


class AutoSaveThrottle(UserRateThrottle):
    """Custom throttle for auto-save endpoints - 60 requests per minute"""
    rate = '60/min'


class BookProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing book projects
    
    list: Get all user's book projects
    retrieve: Get specific book project with chapters
    create: Create new book project and trigger generation
    update: Update book project settings
    partial_update: Partially update book project
    destroy: Delete book project
    
    Custom actions:
    - regenerate: Re-run generation pipeline
    - export: Download specific format (PDF/EPUB/HTML)
    """
    
    permission_classes = [IsAuthenticated]
    throttle_classes = [AutoSaveThrottle]
    
    def get_queryset(self):
        """Filter projects by current user"""
        return BookProject.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return BookProjectListSerializer
        elif self.action == 'create':
            return BookProjectCreateSerializer
        return BookProjectSerializer
    
    def perform_create(self, serializer):
        """Create book project with current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """
        Regenerate book content
        Useful for applying new settings or fixing errors
        """
        book = self.get_object()
        
        if book.status == 'GENERATING':
            return Response(
                {'error': 'Book is already being generated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset status
        book.status = 'GENERATING'
        book.progress_percentage = 0
        book.save()
        
        # Clear existing outputs
        book.pdf_url = ''
        book.epub_url = ''
        book.html_url = ''
        book.audiobook_url = ''
        book.save()
        
        # Reset all blocks to pending
        ContentBlock.objects.filter(chapter__book=book).update(
            status='PENDING',
            processed_text='',
            error_message=''
        )
        
        # Trigger regeneration
        from apps.publishing.tasks import process_all_blocks
        process_all_blocks.delay(book.id)
        
        return Response({
            'message': 'Regeneration started',
            'book_id': book.id
        })
    

    
    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        """
        Start export task for specific format
        Body: { format: 'pdf' | 'epub' | 'html', include_cover: true, include_toc: true }
        """
        book = self.get_object()
        export_format = request.data.get('format', 'pdf')
        include_cover = request.data.get('include_cover', True)
        include_toc = request.data.get('include_toc', True)
        
        if export_format not in ['pdf', 'epub', 'html']:
            return Response(
                {'error': 'Invalid format. Choose pdf, epub, or html'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import export task
        from apps.publishing.tasks import export_book_task
        
        # Start celery task
        task = export_book_task.delay(
            book_id=book.id,
            format=export_format,
            include_cover=include_cover,
            include_toc=include_toc
        )
        
        logger.info(f"Started export task {task.id} for book {book.id} in {export_format} format")
        
        return Response({
            'task_id': task.id,
            'format': export_format,
            'message': f'Export started for {export_format}'
        })
    
    @action(detail=False, methods=['get'], url_path='export-status/(?P<task_id>[^/.]+)')
    def export_status(self, request, task_id=None):
        """
        Check status of export task
        """
        from celery.result import AsyncResult
        
        task = AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'status': 'pending',
                'progress': 0
            }
        elif task.state == 'PROGRESS':
            response = {
                'status': 'processing',
                'progress': task.info.get('current', 0)
            }
        elif task.state == 'SUCCESS':
            response = {
                'status': 'completed',
                'download_url': task.result.get('download_url'),
                'progress': 100
            }
        elif task.state == 'FAILURE':
            response = {
                'status': 'failed',
                'error': str(task.info),
                'progress': 0
            }
        else:
            response = {
                'status': task.state.lower(),
                'progress': 50
            }
        
        return Response(response)
    
    @action(detail=True, methods=['post'])
    def export_audiobook(self, request, pk=None):
        """
        Generate audiobook export with ACX/Audible specifications
        
        Body: {
            include_opening_credits: true,
            include_closing_credits: true,
            generate_retail_sample: true,
            include_chapter_markers: true
        }
        
        Returns:
            task_id for async processing
        """
        book = self.get_object()
        
        # Get options from request
        include_opening_credits = request.data.get('include_opening_credits', book.include_opening_credits)
        include_closing_credits = request.data.get('include_closing_credits', book.include_closing_credits)
        generate_retail_sample = request.data.get('generate_retail_sample', book.generate_retail_sample)
        include_chapter_markers = request.data.get('include_chapter_markers', book.include_chapter_markers)
        
        # Start audiobook generation
        # In production, this would be a Celery task for async processing
        # For now, call the service directly
        try:
            from apps.publishing.services.audio_export import AudioExportService
            
            service = AudioExportService()
            result = service.generate_audiobook(
                book_id=book.id,
                include_opening_credits=include_opening_credits,
                include_closing_credits=include_closing_credits,
                generate_retail_sample=generate_retail_sample,
                include_chapter_markers=include_chapter_markers,
            )
            
            logger.info(f"Generated audiobook for book {book.id}: {result['total_files']} files")
            
            return Response({
                'status': 'success',
                'message': 'Audiobook generated successfully',
                'output_path': result['output_path'],
                'files': result['files'],
                'total_files': result['total_files'],
                'total_duration_hours': result['total_duration_hours'],
                'chapter_count': result['chapter_count'],
                'marketplace_specs': result['marketplace_specs'],
            })
            
        except Exception as e:
            logger.error(f"Error generating audiobook for book {book.id}: {e}")
            return Response(
                {'error': f'Failed to generate audiobook: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        Get detailed generation status
        Returns progress, block completion, etc.
        """
        book = self.get_object()
        
        # Calculate detailed progress
        total_blocks = ContentBlock.objects.filter(chapter__book=book).count()
        completed_blocks = ContentBlock.objects.filter(
            chapter__book=book,
            status='COMPLETED'
        ).count()
        failed_blocks = ContentBlock.objects.filter(
            chapter__book=book,
            status='FAILED'
        ).count()
        
        return Response({
            'status': book.status,
            'progress_percentage': book.progress_percentage,
            'total_blocks': total_blocks,
            'completed_blocks': completed_blocks,
            'failed_blocks': failed_blocks,
            'total_words': book.total_words,
            'estimated_pages': book.estimated_pages,
            'formats_ready': {
                'pdf': bool(book.pdf_url),
                'epub': bool(book.epub_url),
                'html': bool(book.html_url),
                'audiobook': bool(book.audiobook_url)
            }
        })


class ChapterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chapters
    
    Chapters are created automatically during outline generation,
    but can be manually edited or reordered
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter chapters by book and user"""
        book_id = self.request.query_params.get('book')
        queryset = Chapter.objects.filter(book__user=self.request.user)
        
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return ChapterListSerializer
        return ChapterSerializer
    
    @action(detail=True, methods=['post'])
    def regenerate_blocks(self, request, pk=None):
        """
        Regenerate all blocks in this chapter
        """
        chapter = self.get_object()
        
        # Reset blocks to pending
        blocks = chapter.blocks.all()
        blocks.update(
            status='PENDING',
            processed_text='',
            error_message=''
        )
        
        # Trigger processing
        from celery import group
        from apps.publishing.tasks import process_single_block
        
        task_group = group(
            process_single_block.s(block.id) for block in blocks
        )
        task_group.apply_async()
        
        return Response({
            'message': f'Regenerating {blocks.count()} blocks',
            'chapter_id': chapter.id
        })


class ContentBlockViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual content blocks
    
    Allows fine-grained editing and regeneration
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter blocks by chapter/book and user"""
        chapter_id = self.request.query_params.get('chapter')
        book_id = self.request.query_params.get('book')
        
        queryset = ContentBlock.objects.filter(chapter__book__user=self.request.user)
        
        if chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id)
        elif book_id:
            queryset = queryset.filter(chapter__book_id=book_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return ContentBlockListSerializer
        return ContentBlockSerializer
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """
        Regenerate this specific block
        Optionally change processing mode or parameters
        """
        block = self.get_object()
        
        # Update mode/params if provided
        if 'processing_mode' in request.data:
            block.processing_mode = request.data['processing_mode']
        
        if 'mode_parameters' in request.data:
            block.mode_parameters = request.data['mode_parameters']
        
        block.status = 'PENDING'
        block.processed_text = ''
        block.error_message = ''
        block.save()
        
        # Trigger regeneration
        process_single_block.delay(block.id)
        
        return Response({
            'message': 'Block regeneration started',
            'block_id': block.id
        })
    
    @action(detail=True, methods=['post'])
    def estimate_cost(self, request, pk=None):
        """
        Estimate credit cost for processing this block
        """
        block = self.get_object()
        book = block.chapter.book
        
        from apps.publishing.services.transformation_service import ContentTransformationService
        service = ContentTransformationService()
        
        cost = service.estimate_cost(
            text=block.input_text,
            mode=block.processing_mode,
            include_images=book.enable_images,
            include_audio=book.enable_audio
        )
        
        return Response(cost)
    
    @action(detail=False, methods=['patch'], url_path='bulk_update')
    def bulk_update(self, request):
        """
        Bulk update block sequence_order for drag-and-drop reordering
        
        Body: {
            "updates": [
                {"id": 1, "sequence_order": 0},
                {"id": 2, "sequence_order": 1},
                {"id": 3, "sequence_order": 2}
            ]
        }
        """
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'error': 'No updates provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user owns all blocks
        block_ids = [update['id'] for update in updates]
        user_blocks = ContentBlock.objects.filter(
            id__in=block_ids,
            chapter__book__user=request.user
        )
        
        if user_blocks.count() != len(block_ids):
            return Response(
                {'error': 'Some blocks not found or unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update sequence_order for each block
        updated_count = 0
        for update in updates:
            ContentBlock.objects.filter(id=update['id']).update(
                sequence_order=update.get('sequence_order', 0)
            )
            updated_count += 1
        
        logger.info(f"Bulk updated {updated_count} blocks for user {request.user.id}")
        
        return Response({
            'status': 'success',
            'updated_count': updated_count
        })


class MediaAssetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user's media library
    
    list: Get all user's media assets
    retrieve: Get specific media asset
    create: Upload new media asset
    update: Update media asset metadata
    destroy: Delete media asset
    """
    
    serializer_class = MediaAssetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter assets by current user"""
        queryset = MediaAsset.objects.filter(user=self.request.user)
        
        # Optional filter by book
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Save uploaded image with metadata"""
        from PIL import Image
        import io
        
        file = self.request.FILES.get('file')
        if file:
            # Get image dimensions
            image = Image.open(file)
            width, height = image.size
            
            # Get file size
            file.seek(0, io.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            serializer.save(
                user=self.request.user,
                width=width,
                height=height,
                file_size=file_size
            )
        else:
            serializer.save(user=self.request.user)


class CustomTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user's custom book templates
    
    list: Get all user's custom templates
    retrieve: Get specific template
    create: Create new custom template
    update: Update existing template
    destroy: Delete template
    """
    
    serializer_class = CustomTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates by current user or public templates"""
        # User's own templates plus public templates from others
        from django.db.models import Q
        return CustomTemplate.objects.filter(
            Q(user=self.request.user) | Q(is_public=True)
        )
    
    def perform_create(self, serializer):
        """Save template with current user"""
        serializer.save(user=self.request.user)
