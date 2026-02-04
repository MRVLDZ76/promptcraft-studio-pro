from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    
    list_display = [
        'email',
        'username',
        'full_name',
        'subscription_tier',
        'subscription_status',
        'monthly_analysis_count',
        'monthly_analysis_limit',
        'created_at',
    ]
    
    list_filter = [
        'subscription_tier',
        'subscription_status',
        'is_active',
        'is_staff',
        'created_at',
    ]
    
    search_fields = ['email', 'username', 'full_name', 'stripe_customer_id']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {
            'fields': ('full_name', 'avatar_url', 'bio')
        }),
        ('Subscription', {
            'fields': (
                'subscription_tier',
                'subscription_status',
                'subscription_starts_at',
                'subscription_ends_at',
                'stripe_customer_id',
                'stripe_subscription_id',
            )
        }),
        ('Usage & Limits', {
            'fields': (
                'api_usage_count',
                'api_usage_reset_at',
                'monthly_analysis_count',
                'monthly_analysis_limit',
                'monthly_transcription_count',
                'monthly_transcription_limit',
            )
        }),
        ('Preferences', {
            'fields': ('preferences',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_login_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login_at']
    
    ordering = ['-created_at']
