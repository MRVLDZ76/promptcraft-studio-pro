import uuid
from django.db import models
from django.conf import settings


class SubscriptionPlan(models.Model):
    """Subscription plan tiers"""
    TIER_FREE = 'free'
    TIER_PRO = 'pro'
    TIER_ENTERPRISE = 'enterprise'
    
    TIER_CHOICES = [
        (TIER_FREE, 'Free'),
        (TIER_PRO, 'Pro'),
        (TIER_ENTERPRISE, 'Enterprise'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    stripe_price_id = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    interval = models.CharField(max_length=20, default='month')  # month, year
    
    # Feature limits
    analyses_per_month = models.IntegerField(default=0)
    chronstudio_projects = models.IntegerField(default=0)
    ai_tokens_per_month = models.IntegerField(default=0)
    max_video_length = models.IntegerField(default=0)  # minutes
    max_renders_per_month = models.IntegerField(default=0)  # NEW: video render limit
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - ${self.price}/{self.interval}"


class Subscription(models.Model):
    """User subscription tracking"""
    STATUS_ACTIVE = 'active'
    STATUS_CANCELED = 'canceled'
    STATUS_PAST_DUE = 'past_due'
    STATUS_UNPAID = 'unpaid'
    STATUS_TRIALING = 'trialing'
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CANCELED, 'Canceled'),
        (STATUS_PAST_DUE, 'Past Due'),
        (STATUS_UNPAID, 'Unpaid'),
        (STATUS_TRIALING, 'Trialing'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    
    stripe_customer_id = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"
    
    @property
    def is_active(self):
        return self.status in [self.STATUS_ACTIVE, self.STATUS_TRIALING]


class UsageTracking(models.Model):
    """Track user usage against limits"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='usage_tracking')
    
    # Current month usage
    analyses_used = models.IntegerField(default=0)
    ai_tokens_used = models.IntegerField(default=0)
    video_minutes_processed = models.IntegerField(default=0)
    renders_used = models.IntegerField(default=0)  # NEW: video renders count
    
    # Period tracking
    period_start = models.DateTimeField(auto_now_add=True)
    period_end = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'usage_tracking'
        ordering = ['-period_start']
    
    def __str__(self):
        return f"{self.user.email} - {self.period_start.strftime('%Y-%m')}"


class PaymentHistory(models.Model):
    """Payment transaction history"""
    STATUS_SUCCEEDED = 'succeeded'
    STATUS_PENDING = 'pending'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    
    STATUS_CHOICES = [
        (STATUS_SUCCEEDED, 'Succeeded'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    
    stripe_payment_intent_id = models.CharField(max_length=100, unique=True)
    stripe_invoice_id = models.CharField(max_length=100, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    
    payment_method = models.CharField(max_length=50, blank=True)
    receipt_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - ${self.amount} - {self.status}"
