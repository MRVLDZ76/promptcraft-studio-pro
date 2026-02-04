import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from apps.accounts.models import User
from .models import Subscription, SubscriptionPlan, PaymentHistory
from datetime import datetime
import json

stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])
    elif event['type'] == 'customer.subscription.updated':
        handle_subscription_updated(event['data']['object'])
    elif event['type'] == 'customer.subscription.deleted':
        handle_subscription_deleted(event['data']['object'])
    elif event['type'] == 'invoice.payment_succeeded':
        handle_payment_succeeded(event['data']['object'])
    elif event['type'] == 'invoice.payment_failed':
        handle_payment_failed(event['data']['object'])
    
    return HttpResponse(status=200)


def handle_checkout_completed(session):
    """Handle successful checkout"""
    user_id = session['metadata']['user_id']
    plan_id = session['metadata']['plan_id']
    
    try:
        user = User.objects.get(id=user_id)
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        # Get or create subscription
        stripe_subscription = stripe.Subscription.retrieve(session['subscription'])
        
        subscription, created = Subscription.objects.get_or_create(
            user=user,
            defaults={
                'plan': plan,
                'stripe_customer_id': session['customer'],
                'stripe_subscription_id': session['subscription'],
                'status': stripe_subscription['status'],
                'current_period_start': datetime.fromtimestamp(stripe_subscription['current_period_start']),
                'current_period_end': datetime.fromtimestamp(stripe_subscription['current_period_end']),
            }
        )
        
        if not created:
            # Update existing subscription
            subscription.plan = plan
            subscription.stripe_subscription_id = session['subscription']
            subscription.status = stripe_subscription['status']
            subscription.current_period_start = datetime.fromtimestamp(stripe_subscription['current_period_start'])
            subscription.current_period_end = datetime.fromtimestamp(stripe_subscription['current_period_end'])
            subscription.save()
        
        # Update user
        user.subscription_tier = plan.tier
        user.subscription_status = stripe_subscription['status']
        user.save()
        
    except (User.DoesNotExist, SubscriptionPlan.DoesNotExist):
        pass


def handle_subscription_updated(subscription_data):
    """Handle subscription updates"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=subscription_data['id']
        )
        
        subscription.status = subscription_data['status']
        subscription.current_period_start = datetime.fromtimestamp(subscription_data['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(subscription_data['current_period_end'])
        subscription.cancel_at_period_end = subscription_data.get('cancel_at_period_end', False)
        subscription.save()
        
        # Update user
        subscription.user.subscription_status = subscription_data['status']
        subscription.user.save()
        
    except Subscription.DoesNotExist:
        pass


def handle_subscription_deleted(subscription_data):
    """Handle subscription cancellation"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=subscription_data['id']
        )
        
        subscription.status = 'canceled'
        subscription.save()
        
        # Downgrade user to free tier
        free_plan = SubscriptionPlan.objects.get(tier='free')
        subscription.plan = free_plan
        subscription.save()
        
        subscription.user.subscription_tier = 'free'
        subscription.user.subscription_status = 'canceled'
        subscription.user.save()
        
    except Subscription.DoesNotExist:
        pass


def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=invoice['subscription']
        )
        
        # Create payment record
        PaymentHistory.objects.create(
            user=subscription.user,
            subscription=subscription,
            stripe_payment_intent_id=invoice['payment_intent'],
            stripe_invoice_id=invoice['id'],
            amount=invoice['amount_paid'] / 100,  # Convert from cents
            currency=invoice['currency'].upper(),
            status='succeeded',
            receipt_url=invoice.get('hosted_invoice_url', '')
        )
        
    except Subscription.DoesNotExist:
        pass


def handle_payment_failed(invoice):
    """Handle failed payment"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=invoice['subscription']
        )
        
        # Update subscription status
        subscription.status = 'past_due'
        subscription.save()
        
        subscription.user.subscription_status = 'past_due'
        subscription.user.save()
        
        # Create payment record
        PaymentHistory.objects.create(
            user=subscription.user,
            subscription=subscription,
            stripe_payment_intent_id=invoice.get('payment_intent', ''),
            stripe_invoice_id=invoice['id'],
            amount=invoice['amount_due'] / 100,
            currency=invoice['currency'].upper(),
            status='failed'
        )
        
    except Subscription.DoesNotExist:
        pass
