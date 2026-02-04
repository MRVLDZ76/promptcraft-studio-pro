"""
ChronStudio Celery Tasks
"""
from celery import shared_task
from django.utils import timezone
from django.conf import settings
import os
import tempfile
import urllib.request


@shared_task(bind=True)
def upload_video_to_youtube(self, upload_id):
    """
    Upload video to YouTube using OAuth credentials
    
    Args:
        upload_id: UUID of SocialMediaUpload instance
    
    Progress updates:
        0-10%: Downloading video
        10-90%: Uploading to YouTube
        90-100%: Processing complete
    """
    from .models import SocialMediaUpload, UserOAuthToken
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
    
    try:
        upload = SocialMediaUpload.objects.get(id=upload_id)
        upload.status = 'uploading'
        upload.progress = 0
        upload.celery_task_id = self.request.id
        upload.save()
        
        # Get OAuth token
        try:
            token = UserOAuthToken.objects.get(user=upload.user, platform='youtube')
        except UserOAuthToken.DoesNotExist:
            upload.status = 'failed'
            upload.error_message = 'YouTube account not connected. Please authorize in settings.'
            upload.save()
            return {'status': 'failed', 'error': 'No OAuth token found'}
        
        # Check token expiry and refresh if needed
        if token.token_expiry and timezone.now() >= token.token_expiry:
            # Refresh token logic here
            pass
        
        # Build YouTube client
        credentials = Credentials(
            token=token.access_token,
            refresh_token=token.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET
        )
        
        youtube = build('youtube', 'v3', credentials=credentials)
        
        # Download video to temp file
        upload.progress = 5
        upload.save()
        
        video_url = upload.project.final_video_url
        if not video_url:
            upload.status = 'failed'
            upload.error_message = 'No video URL found in project'
            upload.save()
            return {'status': 'failed', 'error': 'No video URL'}
        
        # Download video
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        try:
            upload.progress = 10
            upload.save()
            
            urllib.request.urlretrieve(video_url, temp_file.name)
            
            upload.progress = 15
            upload.save()
            
            # Prepare metadata
            config = upload.upload_config
            body = {
                'snippet': {
                    'title': config.get('title', 'Untitled Video'),
                    'description': config.get('description', ''),
                    'tags': config.get('tags', []),
                    'categoryId': config.get('category', '22')  # Default: People & Blogs
                },
                'status': {
                    'privacyStatus': config.get('privacy', 'unlisted'),
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # Add optional fields
            if config.get('playlistId'):
                # Add to playlist after upload
                pass
            
            # Upload with progress tracking
            media = MediaFileUpload(
                temp_file.name,
                chunksize=1024*1024,  # 1MB chunks
                resumable=True,
                mimetype='video/mp4'
            )
            
            request = youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )
            
            response = None
            while response is None:
                status_obj, response = request.next_chunk()
                if status_obj:
                    # Progress from 15% to 85%
                    progress = 15 + int(status_obj.progress() * 70)
                    upload.progress = progress
                    upload.save()
            
            # Upload complete
            upload.progress = 90
            upload.status = 'processing'
            upload.platform_id = response['id']
            upload.platform_url = f"https://www.youtube.com/watch?v={response['id']}"
            upload.save()
            
            # YouTube will process the video, mark as published
            upload.progress = 100
            upload.status = 'published'
            upload.published_at = timezone.now()
            
            # Update project URL
            upload.project.youtube_url = upload.platform_url
            upload.project.save()
            
            upload.save()
            
            return {
                'status': 'published',
                'video_id': response['id'],
                'url': upload.platform_url
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    except HttpError as e:
        upload = SocialMediaUpload.objects.get(id=upload_id)
        upload.status = 'failed'
        upload.error_message = f'YouTube API Error: {str(e)}'
        upload.save()
        return {'status': 'failed', 'error': str(e)}
    
    except Exception as e:
        upload = SocialMediaUpload.objects.get(id=upload_id)
        upload.status = 'failed'
        upload.error_message = f'Upload Error: {str(e)}'
        upload.save()
        raise
