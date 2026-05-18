from celery import shared_task
from django.core.mail import EmailMessage
from django.utils import timezone
from datetime import timedelta
from .models import EmailState, Email
from django_backend.models import Email, Recipient
from fastapi_app.utils.email_utils import smtp_send
from django.core.mail import send_mail


@shared_task
def send_email_notification_task(to_email, subject, body):
    send_mail(
        subject=subject,
        message=body,
        from_email="no-reply@thestackly.com",
        recipient_list=[to_email],
        fail_silently=True
    )


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=10,
    retry_kwargs={"max_retries": 3},
)
def send_auto_reply_task(self, recipient_email: str, subject: str, body: str):
    email = EmailMessage(
        subject=subject,
        body=body,
        to=[recipient_email],
    )

    email.extra_headers = {
        "Auto-Submitted": "auto-replied"
    }

    email.send(fail_silently=False)
    
@shared_task
def process_trash_retention():
    
    now = timezone.now()
    
    delete_threshold = now - timedelta(days=30)
    notify_3_days = now - timedelta(days=27)
    notify_2_days = now - timedelta(days=28)
    notify_1_day = now - timedelta(days=29)

    expired_states = EmailState.objects.filter(
        is_deleted=True, 
        trashed_at__lte=delete_threshold
    )
    expired_states.delete()
    
    Email.objects.filter(states__isnull=True).delete()

    def dispatch_warnings(target_date, days_left):
        warning_states = EmailState.objects.filter(
            is_deleted=True, 
            trashed_at__date=target_date.date()
        ).select_related('email', 'user')

        for state in warning_states:
            message = f"Warning: '{state.email.subject}' will be permanently deleted from your Trash in {days_left} day{'s' if days_left > 1 else ''}."
            
            create_notification(
                recipient=state.user, 
                message=message, 
                type_choice="general" # You can change this to "system" or "alert" if your model supports it!
            )
            
            print(f"Notification sent to {state.user.email}: {message}")


@shared_task
def process_scheduled_emails_task():
 
    now = timezone.now()

    scheduled_emails = Email.objects.filter(
        status="SCHEDULED",
        scheduled_at__lte=now
    ).prefetch_related("recipients", "recipients__user")

    for email in scheduled_emails:
        try:
            # Move to OUTBOX (optional step)
            email.status = "OUTBOX"
            email.save(update_fields=["status"])

            # Send email
            smtp_send(email)

            # Mark as SENT
            email.status = "SENT"
            email.save(update_fields=["status"])

            # Send notification to recipients
            for r in email.recipients.all():
                create_notification(
                    recipient=r.user,
                    message=f"New email from {email.sender.email}: {email.subject}",
                    type_choice="email"
                )

        except Exception as e:
            email.status = "FAILED"
            email.save(update_fields=["status"])
            print(f"Scheduled Email Failed {email.id}: {e}")


@shared_task
def send_email_notification_task(to_email, subject, body):
    send_mail(
        subject=subject,
        message=body,
        from_email="no-reply@thestackly.com",
        recipient_list=[to_email],
        fail_silently=True
    )