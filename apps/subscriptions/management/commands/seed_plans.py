"""
Management command to seed subscription plans
"""
from django.core.management.base import BaseCommand
from apps.subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Create subscription plans for development'

    def handle(self, *args, **options):
        plans_data = [
            {
                'name': 'Free',
                'tier': SubscriptionPlan.TIER_FREE,
                'price': 0.00,
                'currency': 'USD',
                'interval': 'month',
                'stripe_price_id': '',  # No Stripe for free tier
                'analyses_per_month': 10,
                'chronstudio_projects': 3,
                'ai_tokens_per_month': 10000,
                'max_video_length': 5,  # 5 minutes
                'max_renders_per_month': 3,  # 3 video renders
            },
            {
                'name': 'Pro',
                'tier': SubscriptionPlan.TIER_PRO,
                'price': 29.99,
                'currency': 'USD',
                'interval': 'month',
                'stripe_price_id': 'price_test_pro',  # Placeholder for dev
                'analyses_per_month': 1000,
                'chronstudio_projects': 50,
                'ai_tokens_per_month': 500000,
                'max_video_length': 30,  # 30 minutes
                'max_renders_per_month': 100,  # 100 video renders
            },
            {
                'name': 'Enterprise',
                'tier': SubscriptionPlan.TIER_ENTERPRISE,
                'price': 99.99,
                'currency': 'USD',
                'interval': 'month',
                'stripe_price_id': 'price_test_enterprise',  # Placeholder for dev
                'analyses_per_month': -1,  # -1 = unlimited
                'chronstudio_projects': -1,
                'ai_tokens_per_month': -1,
                'max_video_length': -1,  # unlimited
                'max_renders_per_month': -1,  # unlimited renders
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                tier=plan_data['tier'],
                defaults=plan_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone! Created {created_count} plans, updated {updated_count} plans.'
            )
        )
