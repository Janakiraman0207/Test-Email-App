from asgiref.sync import sync_to_async
from django_backend.models import Notification
from django_backend.tasks import send_email_notification_task


@sync_to_async
def create_notification(recipient, message, type_choice="system", related_obj=None):
    data = {
        "recipient": recipient,
        "message": message,
        "notification_type": type_choice,
    }

    if related_obj:
        data["content_object"] = related_obj
        data["related_id"] = related_obj.id

    return Notification.objects.create(**data)


async def push_notification(manager, user_id, notif, message, room_id=None):
    await manager.send_personal_message(
       user_id,
      {
        "type": "NEW_NOTIFICATION",
        "notification_id": notif.id,
        "message": message,
        "room_id": room_id,
        "chat_message_id": notif.related_id,
      }
)


async def notify_user(manager, recipient, message, related_obj=None, type_choice="chat", room_id=None):
    notif = await create_notification(
        recipient=recipient,
        message=message,
        type_choice=type_choice,
        related_obj=related_obj
    )

    await push_notification(manager, recipient.id, notif, message, room_id)

    return notif


async def handle_message_notifications(manager, message, sender, room, participants):

    mentioned_user_ids = set(
        await sync_to_async(lambda: list(message.mentions.values_list("id", flat=True)))()
    )

    for user in participants:
        if user.id == sender.id:
            continue

        if user.id in manager.active_room_users.get(room.id, set()):
            continue

        try:
            settings = await sync_to_async(lambda: getattr(user, "general_settings", None))()
        except Exception:
            settings = None

        push_enabled = not settings or settings.desktop_notifications_enabled
        sound_enabled = not settings or settings.sound_notifications_enabled
        email_enabled = not settings or settings.email_notifications_enabled

        if user.id in mentioned_user_ids:
            text = f"You were mentioned by {sender.email}"
        else:
            text = f"{sender.email}: {message.content[:50]}"

        notif = await create_notification(
            recipient=user,
            message=text,
            type_choice="chat",
            related_obj=message
        )

        if push_enabled:
            await manager.send_personal_message(
                user.id,
                {
                    "type": "NEW_NOTIFICATION",
                    "notification_id": notif.id,
                    "message": text,
                    "room_id": room.id,
                    "chat_message_id": notif.related_id,
                }
            )

        if sound_enabled:
            await manager.send_personal_message(
                user.id,
                {"type": "play_sound"}
            )

        if email_enabled:
            send_email_notification_task.delay(
                to_email=user.email,
                subject=f"New message from {sender.email}",
                body=message.content
            )