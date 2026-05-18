import os
import json
import redis
import logging
import django
from django.utils import timezone


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "email_project.settings")
django.setup()

from celery import shared_task
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django_backend.models import Event, Notification, EventAttendee, Email
from django.core.mail import send_mail


logger = logging.getLogger(__name__)
User = get_user_model()

BLOCK_VALUES = {"bulk", "list", "auto-replied", "auto-generated"}

def get_user_by_email(email: str):
    if not email:
        return None
    return User.objects.filter(email__iexact=email).first()


def get_redis_client():
    """
    Works in Docker & Local.
    Defaults to 'redis' service name.
    """
    redis_host = os.environ.get("REDIS_HOST", "redis")
    return redis.Redis(host=redis_host, port=6379, db=0)


def is_vacation_active(user, now):
    if not user.vacation_mode_enabled:
        return False

    if user.vacation_start_date and now < user.vacation_start_date:
        return False

    if user.vacation_end_date and now > user.vacation_end_date:
        return False

    return True


def should_send_vacation_reply(user_id, sender_email):
    """
    Allow only 1 auto-reply per sender per 24 hours
    """
    r = get_redis_client()
    key = f"vacation_reply:{user_id}:{sender_email.lower()}"

    if r.exists(key):
        return False

    r.setex(key, 86400, "1")
    return True



@shared_task
def reset_user_status(user_id: int):
    try:
        user = User.objects.get(id=user_id)

        if user.current_status == "OFFLINE":
            logger.info(f"{user.email} is OFFLINE. Skipping reset.")
            return

        user.current_status = "AVAILABLE"
        user.status_message = None
        user.status_expiry = None
        user.is_manually_set = False
        user.save()

        try:
            r = get_redis_client()
            message = {
                "type": "USER_STATUS_UPDATE",
                "user_id": user.id,
                "status": "AVAILABLE",
                "message": None,
            }
            r.publish("status_updates", json.dumps(message))
        except Exception as e:
            logger.error(f"Redis publish failed: {e}")

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found during reset.")


@shared_task(bind=True, max_retries=3)
def process_event_invites(self, event_id, creator_id):
    try:
        event = Event.objects.get(id=event_id)
        creator = User.objects.get(id=creator_id)

        attendees = (
            EventAttendee.objects
            .filter(event=event)
            .exclude(user_id=creator_id)
        )

        event_content_type = ContentType.objects.get_for_model(Event)

        for record in attendees:
            user = record.user
            meeting_link = event.url or "Link pending or location provided."

            body = (
                f"Hello {user.first_name},\n\n"
                f"You have been invited to '{event.title}'.\n"
                f"Time: {event.start_datetime}\n"
                f"Join here: {meeting_link}\n\n"
                f"See you there!"
            )

            Notification.objects.create(
                recipient=user,
                message=f"You are invited to {event.title}!",
                notification_type="meet",
                content_type=event_content_type,
                object_id=event.id,
            )

            Email.objects.create(
                sender=creator,
                receiver=user,
                subject=f"Invitation: {event.title}",
                body=body,
                status="SENT",
            )

            if user.email:
                send_mail(
                    subject=f"Invitation: {event.title}",
                    message=body,
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

        logger.info(f"Invites sent for Event {event_id}")

    except Exception as e:
        logger.error(f"Event invite error: {e}")
        self.retry(exc=e, countdown=60)


def send_event_reminder(event_id: int):
    print(f"[Reminder] Event {event_id} at {timezone.now()}")    

@shared_task(bind=True, max_retries=3)
def send_email_task(self, email_id):
    email = Email.objects.get(id=email_id)

    try:
        smtp_send(email)  

        email.status = "SENT"
        email.save()

    except Exception as exc:
        email.retry_count += 1
        email.status = "OUTBOX"
        email.save()
        raise self.retry(exc=exc, countdown=60)


@shared_task
def send_scheduled_email(email_id):
    email = Email.objects.get(id=email_id)

    email.status = "OUTBOX"
    email.save()

    send_email_task.delay(email.id)        



def process_incoming_email(incoming_email):
    recipient_user = get_user_by_email(incoming_email.to)
    if not recipient_user:
        return

    sender_user = get_user_by_email(incoming_email.from_email)

    Email.objects.create(
        sender=sender_user,
        receiver=recipient_user,
        subject=incoming_email.subject,
        body=incoming_email.body,
        status="SENT",
    )

    check_and_trigger_auto_reply(
      recipient_user=recipient_user,
      incoming_email_headers=incoming_email.headers or {},
      sender_email=incoming_email.from_email,
      incoming_email_subject=incoming_email.subject,
)

def is_safe_for_auto_reply(headers: dict) -> bool:
    """
    RFC 3834 loop prevention
    """
    for key, value in headers.items():
        key = key.lower()
        value = str(value).lower()

        if key in ["precedence", "auto-submitted", "x-auto-response-suppress"]:
            if any(b in value for b in BLOCK_VALUES):
                return False
    return True

def check_and_trigger_auto_reply(
    recipient_user,
    incoming_email_headers: dict,
    sender_email: str,
    incoming_email_subject: str
):
    
    if not recipient_user.vacation_mode_enabled:
        return

    now = timezone.now()
    start = recipient_user.vacation_start_date
    end = recipient_user.vacation_end_date

    
    if start and now < start:
        return
    if end and now > end:
        return

   
    if sender_email.lower() == recipient_user.email.lower():
        return

    
    headers = {k.lower(): v.lower() for k, v in incoming_email_headers.items()}

   
    if (
        headers.get("auto-submitted", "no") != "no"
        or headers.get("precedence") in ["bulk", "list", "junk"]
        or "list-id" in headers
        or headers.get("x-auto-response-suppress")
    ):
        return

    logger.info(
        "[INFO] Vacation mode active. Triggering auto-reply for %s",
        recipient_user.email
    )

   
    send_auto_reply_task.delay(
        recipient_email=sender_email,
        subject=f"Automatic Reply: {incoming_email_subject}",
        body=recipient_user.vacation_message
    )

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=30, retry_kwargs={"max_retries": 3})
def send_auto_reply_task(self, recipient_email, subject, body):
    from django.core.mail import EmailMessage

    email = EmailMessage(
        subject=subject,
        body=body,
        to=[recipient_email],
        headers={
            "Auto-Submitted": "auto-replied",  # RFC 3834
        },
    )

    email.send(fail_silently=False)

@shared_task
def send_event_reminder(event_id: int):
    try:
        event = Event.objects.get(id=event_id)

        # 🔔 Here you can send email / notification
        print(f"Reminder sent for event: {event.title}")

        event.reminder_sent = True
        event.save()

    except Event.DoesNotExist:
        print("Event not found for reminder")
        
from django.utils import timezone
from django_backend.models import Email, EmailState
from fastapi_app.utils.email_utils import smtp_send


def deliver_to_internal_recipients(email_obj):
    for recipient in email_obj.recipients.select_related("user").all():
        EmailState.objects.get_or_create(
            user=recipient.user,
            email=email_obj,
            defaults={
                'is_read': False,
                'is_favorite': False,
                'is_archived': False,
                'is_spam': False,
                'is_deleted': False
            }
        )


def process_scheduled_emails():

    now = timezone.now()

    print("CURRENT TIME:", now)

    all_scheduled = Email.objects.filter(
        status="SCHEDULED"
    )

    for item in all_scheduled:

        print(
            "MAIL:",
            item.id,
            item.subject,
            item.scheduled_at,
            item.status
        )

    scheduled_emails = all_scheduled.filter(
        scheduled_at__lte=now
    )

    for email_obj in scheduled_emails:

        try:

            claimed = Email.objects.filter(
                id=email_obj.id,
                status="SCHEDULED"
            ).update(status="OUTBOX")

            if not claimed:
                continue

            print("SENDING MAIL:", email_obj.id)

            deliver_to_internal_recipients(email_obj)

            email_obj.status = "SENT"

            email_obj.save(update_fields=["status"])

            try:
                smtp_send(email_obj)
                print("SMTP SENT SUCCESSFULLY")
            except Exception as smtp_error:
                print("SMTP failed, but mail was delivered internally:", smtp_error)

            print("MAIL DELIVERED INTERNALLY")

        except Exception as e:

            email_obj.status = "FAILED"

            email_obj.save(update_fields=["status"])

            print("Scheduled mail failed:", e)


@shared_task(name="fastapi_app.tasks.process_scheduled_emails_task")
def process_scheduled_emails_task():
    return process_scheduled_emails()
