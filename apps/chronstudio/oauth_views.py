"""
ChronStudio OAuth Views
YouTube OAuth 2.0 flow for video uploads
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from .models import UserOAuthToken
from datetime import timedelta


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def youtube_oauth_initiate(request):
    """
    Step 1: Initiate YouTube OAuth flow
    GET /api/v1/chronstudio/oauth/youtube/initiate/
    
    Returns authorization URL for user to visit
    """
    try:
        from google_auth_oauthlib.flow import Flow
        
        # Create flow
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.YOUTUBE_CLIENT_ID,
                    "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.YOUTUBE_REDIRECT_URI]
                }
            },
            scopes=[
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube',
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        )
        
        flow.redirect_uri = settings.YOUTUBE_REDIRECT_URI
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force consent to get refresh token
        )
        
        # Store state in session for CSRF protection
        request.session['oauth_state'] = state
        request.session['oauth_user_id'] = str(request.user.id)
        
        return Response({
            'authorization_url': authorization_url,
            'state': state
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to initiate OAuth: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def youtube_oauth_callback(request):
    """
    Step 2: OAuth callback handler
    GET /api/v1/chronstudio/oauth/youtube/callback/?code=...&state=...
    
    Exchanges authorization code for access token and stores it
    """
    try:
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build
        from apps.accounts.models import User
        
        # Verify state (CSRF protection)
        state = request.GET.get('state')
        stored_state = request.session.get('oauth_state')
        
        if not state or state != stored_state:
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user from session
        user_id = request.session.get('oauth_user_id')
        if not user_id:
            return Response(
                {'error': 'User session not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.get(id=user_id)
        
        # Get authorization code
        code = request.GET.get('code')
        if not code:
            error = request.GET.get('error', 'Unknown error')
            return Response(
                {'error': f'Authorization failed: {error}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exchange code for tokens
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.YOUTUBE_CLIENT_ID,
                    "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.YOUTUBE_REDIRECT_URI]
                }
            },
            scopes=[
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube',
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        )
        
        flow.redirect_uri = settings.YOUTUBE_REDIRECT_URI
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Get YouTube channel info
        youtube = build('youtube', 'v3', credentials=credentials)
        channels_response = youtube.channels().list(
            part='snippet',
            mine=True
        ).execute()
        
        channel_id = ''
        channel_title = ''
        if channels_response.get('items'):
            channel = channels_response['items'][0]
            channel_id = channel['id']
            channel_title = channel['snippet']['title']
        
        # Calculate token expiry (typically 1 hour)
        token_expiry = timezone.now() + timedelta(seconds=3600)
        
        # Store or update token
        oauth_token, created = UserOAuthToken.objects.update_or_create(
            user=user,
            platform='youtube',
            defaults={
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token or '',
                'token_expiry': token_expiry,
                'platform_user_id': channel_id,
                'platform_username': channel_title,
            }
        )
        
        # Clean up session
        del request.session['oauth_state']
        del request.session['oauth_user_id']
        
        # Redirect to frontend success page
        frontend_url = settings.FRONTEND_URL
        return redirect(f'{frontend_url}/?youtube_auth=success&channel={channel_title}')
    
    except Exception as e:
        return Response(
            {'error': f'OAuth callback failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def youtube_oauth_status(request):
    """
    Check YouTube OAuth connection status
    GET /api/v1/chronstudio/oauth/youtube/status/
    
    Returns:
    {
        "connected": true,
        "channel_name": "My Channel",
        "channel_id": "UCxxxxx",
        "expires_at": "2026-02-03T12:00:00Z"
    }
    """
    try:
        token = UserOAuthToken.objects.get(user=request.user, platform='youtube')
        
        return Response({
            'connected': True,
            'channel_name': token.platform_username,
            'channel_id': token.platform_user_id,
            'expires_at': token.token_expiry.isoformat() if token.token_expiry else None
        })
    
    except UserOAuthToken.DoesNotExist:
        return Response({
            'connected': False,
            'channel_name': None,
            'channel_id': None,
            'expires_at': None
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def youtube_oauth_disconnect(request):
    """
    Disconnect YouTube account
    POST /api/v1/chronstudio/oauth/youtube/disconnect/
    """
    try:
        token = UserOAuthToken.objects.get(user=request.user, platform='youtube')
        token.delete()
        
        return Response({'status': 'disconnected'})
    
    except UserOAuthToken.DoesNotExist:
        return Response(
            {'error': 'No YouTube connection found'},
            status=status.HTTP_404_NOT_FOUND
        )
