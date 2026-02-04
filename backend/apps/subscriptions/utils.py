from datetime import datetime, timedelta
from django.utils import timezone
from .models import UsageTracking


def get_or_create_current_usage(user):
    """Get or create current month's usage tracking"""
    now = timezone.now()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate period end (first day of next month)
    if now.month == 12:
        period_end = now.replace(year=now.year + 1, month=1, day=1)
    else:
        period_end = now.replace(month=now.month + 1, day=1)
    
    usage, created = UsageTracking.objects.get_or_create(
        user=user,
        period_start__gte=period_start,
        defaults={
            'period_end': period_end
        }
    )
    
    return usage


def check_usage_limit(user, resource_type):
    """Check if user has exceeded their usage limit"""
    usage = get_or_create_current_usage(user)
    
    try:
        plan = user.subscription.plan
    except:
        return False, "No active subscription"
    
    if resource_type == 'analyses':
        if usage.analyses_used >= plan.analyses_per_month and plan.analyses_per_month > 0:
            return False, f"Monthly limit of {plan.analyses_per_month} analyses reached"
    
    elif resource_type == 'ai_tokens':
        if usage.ai_tokens_used >= plan.ai_tokens_per_month and plan.ai_tokens_per_month > 0:
            return False, f"Monthly AI token limit reached"
    
    return True, "OK"


def increment_usage(user, resource_type, amount=1):
    """Increment usage counter"""
    usage = get_or_create_current_usage(user)
    
    if resource_type == 'analyses':
        usage.analyses_used += amount
    elif resource_type == 'ai_tokens':
        usage.ai_tokens_used += amount
    elif resource_type == 'video_minutes':
        usage.video_minutes_processed += amount
    elif resource_type == 'renders':
        usage.renders_used += amount
    
    usage.save()
    return usage
