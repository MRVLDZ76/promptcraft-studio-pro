from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, UsageTracking, PaymentHistory


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    billing_period = serializers.CharField(source='interval', read_only=True)
    features = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'tier', 'price', 'currency', 'billing_period',
            'stripe_price_id', 'is_active', 'features', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_features(self, obj):
        """Return features in the format expected by frontend"""
        return {
            'max_transcription_minutes': None if obj.max_video_length == -1 else obj.max_video_length,
            'max_analysis_queries': None if obj.analyses_per_month == -1 else obj.analyses_per_month,
            'max_projects': None if obj.chronstudio_projects == -1 else obj.chronstudio_projects,
            'ai_tokens_per_month': None if obj.ai_tokens_per_month == -1 else obj.ai_tokens_per_month,
        }


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = [
            'user', 'stripe_customer_id', 'stripe_subscription_id',
            'status', 'current_period_start', 'current_period_end',
            'created_at', 'updated_at'
        ]


class UsageTrackingSerializer(serializers.ModelSerializer):
    transcription_minutes = serializers.IntegerField(source='video_minutes_processed', read_only=True)
    analysis_queries = serializers.IntegerField(source='analyses_used', read_only=True)
    limits = serializers.SerializerMethodField()
    
    class Meta:
        model = UsageTracking
        fields = [
            'id', 'transcription_minutes', 'analysis_queries', 'ai_tokens_used',
            'limits', 'period_start', 'period_end', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_limits(self, obj):
        """Return limits from user's subscription plan"""
        try:
            subscription = obj.user.subscription
            plan = subscription.plan
            return {
                'max_transcription_minutes': None if plan.max_video_length == -1 else plan.max_video_length,
                'max_analysis_queries': None if plan.analyses_per_month == -1 else plan.analyses_per_month,
                'ai_tokens_per_month': None if plan.ai_tokens_per_month == -1 else plan.ai_tokens_per_month,
            }
        except (AttributeError, Subscription.DoesNotExist):
            return {
                'max_transcription_minutes': 0,
                'max_analysis_queries': 0,
                'ai_tokens_per_month': 0,
            }


class PaymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentHistory
        fields = '__all__'
        read_only_fields = '__all__'
