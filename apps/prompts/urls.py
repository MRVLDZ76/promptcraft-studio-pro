from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PromptProjectViewSet, SequenceSegmentViewSet

router = DefaultRouter()
router.register(r'projects', PromptProjectViewSet, basename='prompt-project')
router.register(r'segments', SequenceSegmentViewSet, basename='sequence-segment')

urlpatterns = [
    path('', include(router.urls)),
]
