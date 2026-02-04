from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, SubscriptionViewSet,
    UsageTrackingViewSet, PaymentHistoryViewSet
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'usage', UsageTrackingViewSet, basename='usage')
router.register(r'payments', PaymentHistoryViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
