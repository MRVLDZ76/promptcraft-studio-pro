"""
Custom User model with subscription support
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Extended user model for SaaS platform
    """
    SUBSCRIPTION_TIERS = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]
    
    SUBSCRIPTION_STATUS = [
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('past_due', 'Past Due'),
        ('trialing', 'Trialing'),
        ('incomplete', 'Incomplete'),
    ]
    
    # Profile fields
    full_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    
    # Subscription info
    subscription_tier = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_TIERS,
        default='free'
    )
    subscription_status = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_STATUS,
        default='active'
    )
    subscription_starts_at = models.DateTimeField(null=True, blank=True)
    subscription_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Stripe integration
    stripe_customer_id = models.CharField(max_length=100, blank=True, db_index=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True, db_index=True)
    
    # Usage tracking
    api_usage_count = models.IntegerField(default=0)
    api_usage_reset_at = models.DateTimeField(default=timezone.now)
    monthly_analysis_count = models.IntegerField(default=0)
    monthly_analysis_limit = models.IntegerField(default=10)  # Free tier default
    monthly_transcription_count = models.IntegerField(default=0)
    monthly_transcription_limit = models.IntegerField(default=5)
    
    # Preferences (JSON field)
    preferences = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['subscription_tier', 'subscription_status']),
            models.Index(fields=['stripe_customer_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.email
    
    def can_perform_analysis(self):
        """Check if user can perform analysis based on subscription"""
        if self.subscription_tier == 'enterprise':
            return True
        return self.monthly_analysis_count < self.monthly_analysis_limit
    
    def increment_analysis_count(self):
        """Increment monthly analysis counter"""
        self.monthly_analysis_count += 1
        self.save(update_fields=['monthly_analysis_count'])
    
    def reset_monthly_usage(self):
        """Reset monthly usage counters"""
        self.monthly_analysis_count = 0
        self.monthly_transcription_count = 0
        self.api_usage_reset_at = timezone.now()
        self.save(update_fields=[
            'monthly_analysis_count',
            'monthly_transcription_count',
            'api_usage_reset_at'
        ])
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at'])
