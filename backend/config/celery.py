"""
Celery configuration for async tasks
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('promptcraft')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    'reset-monthly-usage': {
        'task': 'apps.subscriptions.tasks.reset_monthly_usage',
        'schedule': crontab(day_of_month='1', hour='0', minute='0'),
    },
    'check-expired-subscriptions': {
        'task': 'apps.subscriptions.tasks.check_expired_subscriptions',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'cleanup-old-render-jobs': {
        'task': 'apps.video_production.tasks.cleanup_old_render_jobs',
        'schedule': crontab(hour='2', minute='0'),  # Daily at 2 AM
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
