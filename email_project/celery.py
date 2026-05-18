import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'email_project.settings')

app = Celery('email_project')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks(['django_backend', 'fastapi_app'])

app.conf.beat_schedule = {
    'midnight-trash-cleanup-and-notifications': {
        'task': 'django_backend.tasks.process_trash_retention', 
        'schedule': crontab(hour=0, minute=0), 
    },

    'process-scheduled-emails-every-30-seconds': {
        'task': 'fastapi_app.tasks.process_scheduled_emails_task',
        'schedule': 30.0, 
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


