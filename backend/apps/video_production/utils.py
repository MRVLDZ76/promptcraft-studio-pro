"""
Video Processing Utilities

Helper functions for downloading, uploading, and processing videos.
"""
import os
import logging
import requests
from urllib.parse import urlparse
from pathlib import Path
import hashlib
from django.core.files.storage import default_storage
from django.conf import settings

logger = logging.getLogger(__name__)


def download_video(url: str, output_dir: str, filename: str = None) -> str:
    """
    Download video from URL to local directory
    
    Args:
        url: Video URL to download
        output_dir: Directory to save video
        filename: Optional filename (will generate from URL if not provided)
        
    Returns:
        str: Path to downloaded video file
        
    Raises:
        requests.RequestException: If download fails
    """
    try:
        logger.info(f"Downloading video from: {url}")
        
        # Generate filename if not provided
        if not filename:
            # Try to get filename from URL
            parsed = urlparse(url)
            filename = os.path.basename(parsed.path)
            
            # If no filename in URL, generate from hash
            if not filename or '.' not in filename:
                url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
                filename = f"video_{url_hash}.mp4"
        
        output_path = os.path.join(output_dir, filename)
        
        # Stream download to handle large files
        response = requests.get(url, stream=True, timeout=300)  # 5 min timeout
        response.raise_for_status()
        
        # Get total size if available
        total_size = int(response.headers.get('content-length', 0))
        downloaded_size = 0
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    
                    # Log progress for large files
                    if total_size > 0 and downloaded_size % (1024 * 1024) == 0:  # Every MB
                        progress = (downloaded_size / total_size) * 100
                        logger.debug(f"Download progress: {progress:.1f}%")
        
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        logger.info(f"Downloaded video: {filename} ({file_size_mb:.2f} MB)")
        
        return output_path
        
    except requests.RequestException as e:
        logger.error(f"Failed to download video from {url}: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error downloading video: {e}")
        raise


def upload_video(local_path: str, remote_path: str = None) -> str:
    """
    Upload video to storage backend (Supabase/S3/etc)
    
    Args:
        local_path: Path to local video file
        remote_path: Optional remote path (will generate if not provided)
        
    Returns:
        str: Public URL of uploaded video
        
    Note:
        For Phase 2, this uses Django's default storage.
        In production, configure Supabase storage in settings.
    """
    try:
        logger.info(f"Uploading video: {local_path}")
        
        # Generate remote path if not provided
        if not remote_path:
            filename = os.path.basename(local_path)
            # Organize by date
            from datetime import datetime
            date_path = datetime.now().strftime('%Y/%m/%d')
            remote_path = f"rendered_videos/{date_path}/{filename}"
        
        # Upload using Django storage backend
        with open(local_path, 'rb') as f:
            stored_path = default_storage.save(remote_path, f)
        
        # Get public URL
        if hasattr(default_storage, 'url'):
            url = default_storage.url(stored_path)
        else:
            # Fallback for local storage
            url = f"{settings.MEDIA_URL}{stored_path}"
        
        file_size_mb = os.path.getsize(local_path) / (1024 * 1024)
        logger.info(f"Uploaded video: {stored_path} ({file_size_mb:.2f} MB)")
        logger.info(f"Public URL: {url}")
        
        return url
        
    except Exception as e:
        logger.error(f"Failed to upload video: {e}")
        raise


def upload_image(local_path: str, remote_path: str = None) -> str:
    """
    Upload image file to storage and return public URL.
    Used for uploading reference frames for AI video generation.
    
    Args:
        local_path: Path to local image file
        remote_path: Optional custom path in storage (auto-generated if not provided)
        
    Returns:
        str: Public URL to uploaded image
        
    Raises:
        Exception: If upload fails
    """
    try:
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Image file not found: {local_path}")
        
        # Generate remote path if not provided
        if not remote_path:
            filename = os.path.basename(local_path)
            # Organize by date
            from datetime import datetime
            date_path = datetime.now().strftime('%Y/%m/%d')
            remote_path = f"reference_frames/{date_path}/{filename}"
        
        # Upload using Django storage backend
        with open(local_path, 'rb') as f:
            stored_path = default_storage.save(remote_path, f)
        
        # Get public URL
        if hasattr(default_storage, 'url'):
            url = default_storage.url(stored_path)
        else:
            # Fallback for local storage
            url = f"{settings.MEDIA_URL}{stored_path}"
        
        file_size_kb = os.path.getsize(local_path) / 1024
        logger.info(f"Uploaded image: {stored_path} ({file_size_kb:.2f} KB)")
        logger.info(f"Public URL: {url}")
        
        return url
        
    except Exception as e:
        logger.error(f"Failed to upload image: {e}")
        raise


def get_video_info(video_path: str) -> dict:
    """
    Get video metadata (duration, resolution, etc)
    
    Args:
        video_path: Path to video file
        
    Returns:
        dict: Video metadata
    """
    try:
        from moviepy.editor import VideoFileClip
        
        clip = VideoFileClip(video_path)
        info = {
            'duration': clip.duration,
            'fps': clip.fps,
            'size': clip.size,  # (width, height)
            'width': clip.w,
            'height': clip.h,
        }
        clip.close()
        
        return info
        
    except Exception as e:
        logger.error(f"Failed to get video info: {e}")
        return {
            'duration': 0,
            'fps': 30,
            'size': (1920, 1080),
            'width': 1920,
            'height': 1080,
        }


def ensure_video_compatibility(video_paths: list) -> dict:
    """
    Check if videos are compatible for concatenation
    
    Args:
        video_paths: List of video file paths
        
    Returns:
        dict: Compatibility report
    """
    if not video_paths:
        return {'compatible': False, 'reason': 'No videos provided'}
    
    try:
        from moviepy.editor import VideoFileClip
        
        resolutions = []
        fps_values = []
        
        for path in video_paths:
            clip = VideoFileClip(path)
            resolutions.append(clip.size)
            fps_values.append(clip.fps)
            clip.close()
        
        # Check if all resolutions match
        unique_resolutions = set(resolutions)
        unique_fps = set(fps_values)
        
        compatible = len(unique_resolutions) == 1 and len(unique_fps) == 1
        
        return {
            'compatible': compatible,
            'resolutions': resolutions,
            'fps_values': fps_values,
            'needs_resize': len(unique_resolutions) > 1,
            'needs_fps_adjust': len(unique_fps) > 1,
            'target_resolution': max(resolutions, key=lambda x: x[0] * x[1]) if resolutions else (1920, 1080),
            'target_fps': max(fps_values) if fps_values else 30,
        }
        
    except Exception as e:
        logger.error(f"Error checking video compatibility: {e}")
        return {
            'compatible': False,
            'reason': str(e)
        }


def cleanup_temp_files(directory: str, pattern: str = "*.mp4"):
    """
    Clean up temporary video files
    
    Args:
        directory: Directory to clean
        pattern: File pattern to match
    """
    try:
        from pathlib import Path
        temp_dir = Path(directory)
        
        if temp_dir.exists():
            files_deleted = 0
            for file_path in temp_dir.glob(pattern):
                try:
                    file_path.unlink()
                    files_deleted += 1
                except Exception as e:
                    logger.warning(f"Failed to delete {file_path}: {e}")
            
            logger.info(f"Cleaned up {files_deleted} temporary files from {directory}")
            
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
