import stripe
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SubscriptionPlan, Subscription, UsageTracking, PaymentHistory
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer,
    UsageTrackingSerializer, PaymentHistorySerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """List available subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """Manage user subscriptions"""
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_checkout_session(self, request):
        """Create Stripe checkout session (or simulate in dev mode)"""
        plan_id = request.data.get('plan_id')
        
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
            
            # DEV MODE: If using test placeholder price IDs, bypass Stripe
            if settings.STRIPE_TEST_MODE and plan.stripe_price_id.startswith('price_test_'):
                # Get or create subscription
                subscription, created = Subscription.objects.update_or_create(
                    user=request.user,
                    defaults={
                        'plan': plan,
                        'status': 'active',
                        'current_period_start': timezone.now(),
                        'current_period_end': timezone.now() + timedelta(days=30),
                        'stripe_customer_id': f'cus_test_{request.user.id}',
                        'stripe_subscription_id': f'sub_test_{request.user.id}_{timezone.now().timestamp()}'
                    }
                )
                
                # Initialize usage tracking for this period if not exists
                period_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                period_end = (period_start + timedelta(days=32)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                
                UsageTracking.objects.get_or_create(
                    user=request.user,
                    period_start__gte=period_start,
                    defaults={
                        'analyses_used': 0,
                        'ai_tokens_used': 0,
                        'video_minutes_processed': 0,
                        'period_start': period_start,
                        'period_end': period_end
                    }
                )
                
                return Response({
                    'dev_mode': True,
                    'message': f'Successfully upgraded to {plan.name}',
                    'subscription': SubscriptionSerializer(subscription).data
                })
            
            # PRODUCTION MODE: Use real Stripe checkout
            # Create or get Stripe customer
            customer_id = request.user.stripe_customer_id
            if not customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    metadata={'user_id': str(request.user.id)}
                )
                customer_id = customer.id
                request.user.stripe_customer_id = customer_id
                request.user.save()
            
            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': plan.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=settings.FRONTEND_URL + '/subscription/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=settings.FRONTEND_URL + '/subscription/cancel',
                metadata={
                    'user_id': str(request.user.id),
                    'plan_id': str(plan.id)
                }
            )
            
            return Response({
                'session_id': checkout_session.id,
                'session_url': checkout_session.url
            })
        
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def cancel_subscription(self, request):
        """Cancel user subscription"""
        try:
            subscription = Subscription.objects.get(user=request.user)
            
            # Cancel at period end in Stripe
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            subscription.cancel_at_period_end = True
            subscription.save()
            
            return Response({
                'message': 'Subscription will be canceled at period end',
                'period_end': subscription.current_period_end
            })
        
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def reactivate_subscription(self, request):
        """Reactivate a canceled subscription"""
        try:
            subscription = Subscription.objects.get(user=request.user)
            
            if not subscription.cancel_at_period_end:
                return Response(
                    {'error': 'Subscription is not canceled'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Reactivate in Stripe
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            subscription.cancel_at_period_end = False
            subscription.save()
            
            return Response({'message': 'Subscription reactivated successfully'})
        
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class UsageTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    """View user usage statistics"""
    serializer_class = UsageTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UsageTracking.objects.filter(user=self.request.user)


class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """View payment history"""
    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PaymentHistory.objects.filter(user=self.request.user)
