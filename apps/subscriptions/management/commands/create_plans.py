from django.core.management.base import BaseCommand
from apps.subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create initial subscription plans'

    def handle(self, *args, **kwargs):
        plans = [
            {
                'name': 'Free Plan',
                'tier': 'free',
                'price': 0.00,
                'analyses_per_month': 5,
                'chronstudio_projects': 1,
                'ai_tokens_per_month': 10000,
                'max_video_length': 10,
            },
            {
                'name': 'Pro Plan',
                'tier': 'pro',
                'stripe_price_id': 'price_pro_monthly',  # Replace with actual Stripe price ID
                'price': 29.99,
                'analyses_per_month': 100,
                'chronstudio_projects': 10,
                'ai_tokens_per_month': 500000,
                'max_video_length': 60,
            },
            {
                'name': 'Enterprise Plan',
                'tier': 'enterprise',
                'stripe_price_id': 'price_enterprise_monthly',  # Replace with actual Stripe price ID
                'price': 99.99,
                'analyses_per_month': -1,  # Unlimited
                'chronstudio_projects': -1,  # Unlimited
                'ai_tokens_per_month': -1,  # Unlimited
                'max_video_length': 180,
            },
        ]
        
        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                tier=plan_data['tier'],
                defaults=plan_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created plan: {plan.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Plan already exists: {plan.name}')
                )
