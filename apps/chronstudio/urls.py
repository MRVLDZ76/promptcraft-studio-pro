from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChronStudioProjectViewSet, ChronStudioCharacterViewSet,
    ChronStudioSceneViewSet, ChronStudioAssetViewSet,
    SocialMediaUploadViewSet, dashboard_stats,
    fetch_news_workflow, fetch_sports_workflow,
    fetch_learning_workflow, fetch_music_workflow
)
from .oauth_views import (
    youtube_oauth_initiate, youtube_oauth_callback,
    youtube_oauth_status, youtube_oauth_disconnect
)

router = DefaultRouter()
router.register(r'projects', ChronStudioProjectViewSet, basename='chronstudio-project')
router.register(r'characters', ChronStudioCharacterViewSet, basename='chronstudio-character')
router.register(r'scenes', ChronStudioSceneViewSet, basename='chronstudio-scene')
router.register(r'assets', ChronStudioAssetViewSet, basename='chronstudio-asset')
router.register(r'social-uploads', SocialMediaUploadViewSet, basename='chronstudio-social-upload')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    # Workflow endpoints
    path('workflows/news/fetch/', fetch_news_workflow, name='workflow-news-fetch'),
    path('workflows/sports/fetch/', fetch_sports_workflow, name='workflow-sports-fetch'),
    path('workflows/learning/fetch/', fetch_learning_workflow, name='workflow-learning-fetch'),
    path('workflows/music/fetch/', fetch_music_workflow, name='workflow-music-fetch'),
    # OAuth endpoints
    path('oauth/youtube/initiate/', youtube_oauth_initiate, name='youtube-oauth-initiate'),
    path('oauth/youtube/callback/', youtube_oauth_callback, name='youtube-oauth-callback'),
    path('oauth/youtube/status/', youtube_oauth_status, name='youtube-oauth-status'),
    path('oauth/youtube/disconnect/', youtube_oauth_disconnect, name='youtube-oauth-disconnect'),
]
