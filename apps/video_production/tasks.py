"""
Celery Tasks for Video Rendering

This module contains async tasks for video sequencing and rendering.
Tasks are executed by Celery workers in the background.
"""
from celery import shared_task, current_task
from django.utils import timezone
from django.core.files.storage import default_storage
import tempfile
import os
import logging
from typing import List

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def render_video_sequence(self, render_job_id: str):
    """
    Main Celery task for video rendering
    
    Args:
        render_job_id: UUID of the RenderJob
        
    Returns:
        dict: Job completion status
    """
    from .models import RenderJob
    from apps.chronstudio.models import ChronStudioScene
    from .renderer import VideoRenderer
    from .utils import download_video, upload_video, get_video_info, cleanup_temp_files
    
    job = None
    tmpdir = None
    
    try:
        # Get render job
        job = RenderJob.objects.get(id=render_job_id)
        job.status = 'analyzing'
        job.current_step = 'Initializing render job...'
        job.rendering_started_at = timezone.now()
        job.save()
        
        logger.info(f"Starting render job {render_job_id} for project {job.project.title}")
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 5, 'step': 'Loading scenes'}
        )
        
        # 1. Load scenes
        scenes = ChronStudioScene.objects.filter(
            id__in=job.scene_ids,
            project=job.project
        ).order_by('scene_number')
        
        if not scenes.exists():
            raise ValueError("No valid scenes found for rendering")
        
        # Check all scenes have videos
        scenes_without_video = [s for s in scenes if not s.video_url]
        if scenes_without_video:
            raise ValueError(
                f"{len(scenes_without_video)} scene(s) don't have generated videos yet. "
                f"Generate videos for all scenes before rendering."
            )
        
        logger.info(f"Found {scenes.count()} scenes to render")
        
        # 2. Download scene videos
        job.status = 'downloading'
        job.current_step = 'Downloading scene videos...'
        job.progress_percentage = 10
        job.save()
        
        # Create temp directory for processing
        tmpdir = tempfile.mkdtemp(prefix='video_render_')
        logger.info(f"Using temp directory: {tmpdir}")
        
        scene_paths = []
        for i, scene in enumerate(scenes):
            progress = 10 + int((i / scenes.count()) * 40)  # 10-50%
            self.update_state(
                state='PROGRESS',
                meta={'progress': progress, 'step': f'Downloading scene {i+1}/{scenes.count()}'}
            )
            
            job.progress_percentage = progress
            job.current_step = f'Downloading scene {i+1}/{scenes.count()}: {scene.narrative_text[:50]}...'
            job.save()
            
            try:
                filename = f"scene_{scene.scene_number:03d}.mp4"
                local_path = download_video(scene.video_url, tmpdir, filename)
                scene_paths.append(local_path)
                logger.info(f"Downloaded scene {i+1}: {filename}")
            except Exception as e:
                logger.error(f"Failed to download scene {scene.scene_number}: {e}")
                raise ValueError(f"Failed to download scene {scene.scene_number}: {str(e)}")
        
        if not scene_paths:
            raise ValueError("No videos were successfully downloaded")
        
        # 3. Render video
        job.status = 'rendering'
        job.current_step = 'Rendering final video...'
        job.progress_percentage = 50
        job.save()
        
        self.update_state(
            state='PROGRESS',
            meta={'progress': 50, 'step': 'Rendering video'}
        )
        
        renderer = VideoRenderer()
        output_filename = f"render_{job.id}.mp4"
        output_path = os.path.join(tmpdir, output_filename)
        
        # Progress callback for rendering
        def render_progress(progress: float):
            # Map 0-1 to 50-85%
            overall_progress = 50 + int(progress * 35)
            self.update_state(
                state='PROGRESS',
                meta={'progress': overall_progress, 'step': 'Rendering video'}
            )
            job.progress_percentage = overall_progress
            job.save()
        
        # Concatenate with options from job settings
        use_transitions = job.include_transitions
        
        # Add title cards if requested
        clips_to_render = scene_paths
        if job.include_title_cards:
            logger.info("Title card support coming in Phase 3 (LLM Director)")
        
        logger.info(f"Rendering {len(clips_to_render)} clips...")
        renderer.concatenate_videos(
            video_paths=clips_to_render,
            output_path=output_path,
            transitions=use_transitions,
            normalize=True,
            progress_callback=render_progress
        )
        
        # Get video info
        video_info = get_video_info(output_path)
        job.output_duration_seconds = video_info['duration']
        job.file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        job.save()
        
        logger.info(
            f"Rendering complete: {video_info['duration']:.1f}s, "
            f"{job.file_size_mb:.2f} MB"
        )
        
        # 4. Upload to storage
        job.status = 'uploading'
        job.current_step = 'Uploading final video...'
        job.progress_percentage = 90
        job.save()
        
        self.update_state(
            state='PROGRESS',
            meta={'progress': 90, 'step': 'Uploading video'}
        )
        
        final_url = upload_video(output_path, remote_path=None)
        
        # 5. Complete job
        job.status = 'completed'
        job.current_step = 'Render complete!'
        job.progress_percentage = 100
        job.output_video_url = final_url
        job.rendering_completed_at = timezone.now()
        
        if job.rendering_started_at:
            time_delta = job.rendering_completed_at - job.rendering_started_at
            job.total_render_time_seconds = int(time_delta.total_seconds())
        
        job.save()
        
        logger.info(
            f"Render job {render_job_id} completed successfully in "
            f"{job.total_render_time_seconds}s"
        )
        
        # 6. Track usage
        try:
            from apps.subscriptions.utils import track_usage
            track_usage(
                user=job.user,
                resource_type='video_minutes',
                amount=float(job.output_duration_seconds) / 60
            )
            track_usage(
                user=job.user,
                resource_type='renders',
                amount=1
            )
            logger.info("Usage tracked successfully")
        except Exception as e:
            logger.warning(f"Failed to track usage: {e}")
        
        # 7. Cleanup temp files
        try:
            cleanup_temp_files(tmpdir, "*.mp4")
            os.rmdir(tmpdir)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp directory: {e}")
        
        return {
            'status': 'completed',
            'job_id': str(job.id),
            'output_url': final_url,
            'duration': float(job.output_duration_seconds),
            'file_size_mb': float(job.file_size_mb),
            'render_time_seconds': job.total_render_time_seconds
        }
        
    except RenderJob.DoesNotExist:
        logger.error(f"Render job {render_job_id} not found")
        raise
        
    except Exception as e:
        logger.error(f"Render job {render_job_id} failed: {str(e)}", exc_info=True)
        
        # Update job with error
        if job:
            try:
                job.status = 'failed'
                job.error_message = str(e)
                job.rendering_completed_at = timezone.now()
                if job.rendering_started_at:
                    time_delta = job.rendering_completed_at - job.rendering_started_at
                    job.total_render_time_seconds = int(time_delta.total_seconds())
                job.save()
            except Exception as save_error:
                logger.error(f"Failed to update job with error: {save_error}")
        
        # Cleanup on error
        if tmpdir and os.path.exists(tmpdir):
            try:
                cleanup_temp_files(tmpdir, "*")
                os.rmdir(tmpdir)
            except:
                pass
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
        else:
            # Max retries reached, don't retry
            raise


@shared_task
def cleanup_old_render_jobs():
    """
    Periodic task to clean up old completed/failed render jobs
    
    Runs daily to remove jobs older than 30 days
    """
    from datetime import timedelta
    from .models import RenderJob
    
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # Delete old completed jobs
    deleted_count = RenderJob.objects.filter(
        status__in=['completed', 'failed', 'cancelled'],
        created_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old render jobs")
    return {'deleted_count': deleted_count}

@shared_task(bind=True, max_retries=2)
def generate_complex_scene_task(
    self,
    scene_id: str,
    prompt_text: str,
    requested_duration: int,
    provider: str,
    reference_image_url: str = None,
    config: dict = None
):
    """
    Generate scenes exceeding provider limits using intelligent segmentation.
    
    Implements the "daisy chain" method:
    1. Split scene into segments within provider limits
    2. Generate first segment normally
    3. Extract last frame from previous segment
    4. Use frame as reference for next segment
    5. Merge all segments seamlessly
    
    Args:
        scene_id: ChronStudioScene UUID
        prompt_text: Scene visual prompt
        requested_duration: Total desired duration in seconds
        provider: 'veo', 'sora', or 'sora-pro'
        reference_image_url: Optional character reference image
        config: Provider-specific configuration
        
    Returns:
        dict: Scene generation results
    """
    from apps.chronstudio.models import ChronStudioScene
    from .renderer import VideoRenderer
    from .utils import download_video, upload_video, upload_image
    import math
    
    tmpdir = None
    scene = None
    
    try:
        # Get scene object
        scene = ChronStudioScene.objects.get(id=scene_id)
        scene.status = 'generating'
        scene.save()
        
        logger.info(
            f"Starting complex scene generation: {scene_id} "
            f"({requested_duration}s with {provider})"
        )
        
        # Create temp directory
        tmpdir = tempfile.mkdtemp(prefix='complex_scene_')
        renderer = VideoRenderer()
        
        # Determine provider limits
        provider_limits = {
            'veo': 15,
            'sora': 12,
            'sora-pro': 12
        }
        max_duration = provider_limits.get(provider, 8)
        
        # Calculate segment plan
        segments = []
        remaining = float(requested_duration)
        
        while remaining > 0:
            dur = min(max_duration, remaining)
            segments.append(dur)
            remaining -= dur
        
        logger.info(f"Segment plan: {segments} (total: {len(segments)} segments)")
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={
                'current': 0,
                'total': len(segments),
                'status': 'Planning complete',
                'segments': segments
            }
        )
        
        segment_files = []
        segment_metadata = []
        last_video_path = None
        
        # Generate each segment
        for i, duration in enumerate(segments):
            logger.info(f"Processing segment {i+1}/{len(segments)} ({duration}s)")
            
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i,
                    'total': len(segments),
                    'status': f'Generating segment {i+1}/{len(segments)}',
                    'segment_duration': duration
                }
            )
            
            current_prompt = prompt_text
            image_reference = reference_image_url
            
            # DAISY CHAIN LOGIC: Use last frame from previous segment
            if i > 0 and last_video_path:
                logger.info(f"Extracting reference frame from segment {i}")
                
                # Extract last frame locally
                frame_filename = f"ref_frame_{i}.jpg"
                local_frame_path = os.path.join(tmpdir, frame_filename)
                
                try:
                    renderer.extract_last_frame(last_video_path, local_frame_path)
                    
                    # Upload frame to storage for AI API access
                    image_reference = upload_image(local_frame_path)
                    
                    # Enhance prompt for continuity
                    current_prompt = (
                        f"Continue the exact action seamlessly from the reference image. "
                        f"{prompt_text}"
                    )
                    
                    logger.info(f"Frame extracted and uploaded: {image_reference}")
                except Exception as e:
                    logger.warning(f"Frame extraction failed: {e}, continuing without reference")
            
            # Call AI video generation API
            # This would integrate with your existing video generation service
            # For now, we'll create a placeholder that needs to be connected
            try:
                # TODO: Replace with actual API call to multiProviderVideoService
                # video_url = video_generation_service.generate_video(
                #     prompt=current_prompt,
                #     duration=duration,
                #     provider=provider,
                #     reference_image=image_reference,
                #     config=config
                # )
                
                # Placeholder for testing
                raise NotImplementedError(
                    "AI video generation API not yet connected. "
                    "Need to integrate with multiProviderVideoService from frontend."
                )
                
            except Exception as e:
                logger.error(f"Segment {i+1} generation failed: {e}")
                scene.status = 'failed'
                scene.error_message = str(e)
                scene.save()
                raise
            
            # Download segment to temp directory
            segment_filename = f"segment_{i}.mp4"
            local_seg_path = os.path.join(tmpdir, segment_filename)
            
            # download_video(video_url, local_seg_path)
            
            segment_files.append(local_seg_path)
            segment_metadata.append({
                'index': i,
                'duration': duration,
                'video_url': None,  # video_url would go here
                'has_reference': i > 0
            })
            
            last_video_path = local_seg_path
        
        # MERGE SEGMENTS
        self.update_state(
            state='PROGRESS',
            meta={
                'current': len(segments),
                'total': len(segments),
                'status': 'Merging segments seamlessly'
            }
        )
        
        if len(segment_files) > 1:
            logger.info(f"Merging {len(segment_files)} segments...")
            
            final_scene_filename = f"scene_{scene_id}_full.mp4"
            final_scene_path = os.path.join(tmpdir, final_scene_filename)
            
            # Use seamless merge (hard cuts, no transitions)
            renderer.merge_scene_segments(segment_files, final_scene_path)
            final_upload_path = final_scene_path
        else:
            # Single segment, no merge needed
            final_upload_path = segment_files[0]
        
        # Upload final merged scene
        logger.info("Uploading final scene...")
        final_url = upload_video(final_upload_path)
        
        # Update scene in database
        scene.video_url = final_url
        scene.duration = requested_duration
        scene.generation_method = 'daisy_chain' if len(segments) > 1 else 'single'
        scene.segment_count = len(segments)
        scene.segment_metadata = segment_metadata
        scene.status = 'completed'
        scene.save()
        
        logger.info(
            f"Complex scene generation complete: {scene_id} "
            f"({len(segments)} segments, {requested_duration}s)"
        )
        
        return {
            'scene_id': str(scene_id),
            'video_url': final_url,
            'duration': requested_duration,
            'segments': len(segments),
            'method': 'daisy_chain' if len(segments) > 1 else 'single',
            'status': 'completed'
        }
        
    except Exception as e:
        logger.error(f"Complex scene generation failed: {e}", exc_info=True)
        
        if scene:
            scene.status = 'failed'
            scene.error_message = str(e)
            scene.save()
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=120 * (2 ** self.request.retries))
        else:
            raise
            
    finally:
        # Cleanup temp directory
        if tmpdir and os.path.exists(tmpdir):
            import shutil
            try:
                shutil.rmtree(tmpdir)
                logger.info(f"Cleaned up temp directory: {tmpdir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {e}")