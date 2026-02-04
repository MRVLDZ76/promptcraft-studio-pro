from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RenderJobViewSet, VideoSequenceViewSet

router = DefaultRouter()
router.register(r'render-jobs', RenderJobViewSet, basename='render-job')
router.register(r'sequences', VideoSequenceViewSet, basename='video-sequence')

urlpatterns = [
    path('', include(router.urls)),
]
