from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.subscriptions.models import SubscriptionPlan, Subscription, UsageTracking

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup subscription and usage tracking for a user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='User email to setup subscription for',
            default='admin@example.com'
        )

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found'))
            return
        
        # Get Free plan
        try:
            free_plan = SubscriptionPlan.objects.get(tier='free')
        except SubscriptionPlan.DoesNotExist:
            self.stdout.write(self.style.ERROR('Free plan not found. Run seed_plans first.'))
            return
        
        # Create or update subscription
        subscription, created = Subscription.objects.get_or_create(
            user=user,
            defaults={
                'plan': free_plan,
                'status': 'active',
                'current_period_start': timezone.now(),
                'current_period_end': timezone.now() + timedelta(days=30)
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created subscription for {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'! Subscription already exists for {email}'))
            self.stdout.write(f'  Current plan: {subscription.plan.name}')
        
        # Create or update usage tracking
        usage, created = UsageTracking.objects.get_or_create(
            user=user,
            period_start__gte=timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0),
            defaults={
                'analyses_used': 0,
                'ai_tokens_used': 0,
                'video_minutes_processed': 0,
                'period_start': timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0),
                'period_end': (timezone.now() + timedelta(days=30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created usage tracking for {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'! Usage tracking already exists for {email}'))
        
        # Display summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('Setup Complete!'))
        self.stdout.write('='*50)
        self.stdout.write(f'\nUser: {user.email}')
        self.stdout.write(f'Plan: {subscription.plan.name} ({subscription.plan.tier})')
        self.stdout.write(f'Status: {subscription.status}')
        self.stdout.write(f'Period: {subscription.current_period_start} to {subscription.current_period_end}')
        self.stdout.write(f'\nUsage:')
        self.stdout.write(f'  Analyses: {usage.analyses_used} / {free_plan.analyses_per_month}')
        self.stdout.write(f'  Video minutes: {usage.video_minutes_processed} / {free_plan.max_video_length}')
        self.stdout.write(f'  AI tokens: {usage.ai_tokens_used} / {free_plan.ai_tokens_per_month}')
        self.stdout.write('\n')
