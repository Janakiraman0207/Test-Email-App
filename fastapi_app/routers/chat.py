from django.db.models import Prefetch, Count, Q, Exists, OuterRef, Max, Value, BooleanField, Subquery, IntegerField
from django.db.models.functions import Coalesce
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Query, status,WebSocketException, Form
from django.db.models import Prefetch, Count, Q
from jose import JWTError, jwt
from fastapi_app.core.config import settings
from pydantic import BaseModel
import json
import os
import re
import logging
from django.db import transaction
import secrets
import mimetypes
from django.core.files.base import ContentFile
from django.utils import timezone
from typing import List, Optional
from datetime import datetime, timezone as dt_timezone
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django_backend.models import ChatRoom, ChatMessage, Email, MessageReaction, Notification, Call, UserChatSettings, ChatMute
from django.core.exceptions import ObjectDoesNotExist
from fastapi_app.schemas.chat_schemas import (ChatRoomCreate,ChatRoomRead, MessageRead, ChatMemberUpdate,
    MessageUpdate, ForwardRequest, TextMessageCreate, UserActivityRead, UserStatusResponse, ChatRoomDetailsResponse, ChatSettingsUpdate,
    OfflineUser, ChatMessageResponse,RenameGroupRequest, RenameGroupResponse)
from fastapi_app.utils.sanitizer import process_mentions
from fastapi_app.core.socket_manager import manager
from fastapi_app.dependencies.permissions import get_current_user
from fastapi_app.utils.link_utils import extract_link, fetch_link_preview
from fastapi_app.utils.sanitizer import sanitize_rich_text
from fastapi_app.utils.notifications import handle_message_notifications
from fastapi_app.schemas.notification_schemas import MuteChatRequest

from fastapi_app.routers.notifications import create_notification

logger = logging.getLogger(__name__)
router = APIRouter()
User = get_user_model()
def get_user_display(user):
    profile = getattr(user, "profile", None)
    avatar = getattr(profile, "avatar", None)

    profile_image = None
    if avatar:
        try:
            profile_image = avatar.url
        except Exception:
            pass

    initials = (
        (user.first_name[:1] if user.first_name else '') +
        (user.last_name[:1] if user.last_name else '')
    ).upper()

    return {
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_image": profile_image,
        "initials": initials
    }

async def get_current_user_ws(token: str = Query(...)):
    
    auth_error = status.WS_1008_POLICY_VIOLATION
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise WebSocketException(code=auth_error, reason="Invalid token payload")
    except JWTError:
        raise WebSocketException(code=auth_error, reason="Token expired or invalid")
    
    try:
        user = await sync_to_async(User.objects.get)(email=email)
        
        if not user.is_active:
            raise WebSocketException(code=auth_error, reason="User account is disabled")
        
        return user
    except User.DoesNotExist:
        raise WebSocketException(code=auth_error, reason="User not found")
    
def format_room_response(room, current_user=None):
    unread_count = getattr(room, 'annotated_unread_count', None)
    if unread_count is None:
        if current_user:
            unread_count = room.messages.filter(is_deleted=False).exclude(
                read_by=current_user
            ).exclude(sender=current_user).count()
        else:
            unread_count = 0
    
    last_msg_qs = room.messages.filter(is_deleted=False).select_related(
        'sender', 'sender__profile', 'parent', 'parent__sender'
    ).prefetch_related(
        'reactions', 'reactions__user'
    ).annotate(
        annotated_read_count=Count('read_by', distinct=True)
    )

    if current_user:
        last_msg_qs = last_msg_qs.annotate(
            user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),
            user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
        )
        
    last_msg_obj = last_msg_qs.order_by("-timestamp").first()    

    last_msg = None
    if last_msg_obj:
        url = None
        try:
            if last_msg_obj.attachment:
                url = last_msg_obj.attachment.url
        except (ValueError, AttributeError):
            url = None
        
        reaction_map = {}
        for r in last_msg_obj.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        last_msg = {
            "id": last_msg_obj.id,
            "sender_email": last_msg_obj.sender.email,
            "sender_first_name": last_msg_obj.sender.first_name,
            "sender_last_name": last_msg_obj.sender.last_name,
            "content": last_msg_obj.content,
            "attachment_url": url,
            "timestamp": last_msg_obj.timestamp,
            "read_count": last_msg_obj.annotated_read_count,
            "is_starred": getattr(last_msg_obj, 'user_starred', False),
            "is_saved": getattr(last_msg_obj, 'user_saved', False),
            "is_pinned": getattr(last_msg_obj, 'is_pinned', False),
            "message_link": f"/chat/rooms/{room.id}?message_id={last_msg_obj.id}",
            "parent_id": last_msg_obj.parent.id if last_msg_obj.parent else None,
            "parent_content": last_msg_obj.parent.content if last_msg_obj.parent else None,
            "parent_sender": last_msg_obj.parent.sender.email if last_msg_obj.parent else None,
            "reactions": [
                {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                for k, v in reaction_map.items()
            ],
            "is_forwarded": last_msg_obj.is_forwarded
        }
        
    formatted_participants = []
    for u in room.participants.select_related('profile', 'chat_settings').all():
        show_last_seen = True
        if hasattr(u, 'chat_settings'):
            show_last_seen = u.chat_settings.show_last_seen

        formatted_participants.append({
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}".strip() or u.email.split('@')[0],
            "email": u.email,
            "profile_image": u.profile.avatar.url if hasattr(u, 'profile') and u.profile.avatar else None,
            "is_online": getattr(u.profile, 'is_online', False) if hasattr(u, 'profile') else False,
            "last_seen": (u.profile.last_seen if show_last_seen and hasattr(u, 'profile') else None)
        })    

    return {
        "id": room.id,
        "name": room.name,
        "is_group": room.is_group,
        "unread_count": unread_count,
        "description": getattr(room, 'description', ""),
        "participants": formatted_participants,
        "last_message": last_msg
    }    
    
@router.get("/rooms", response_model=List[ChatRoomRead])
async def list_rooms(current_user: User = Depends(get_current_user)):
    
    @sync_to_async
    def get_formatted_rooms():
    
        unread_subquery = ChatMessage.objects.filter(
            ChatMessage.get_unread_filter(current_user),
            room=OuterRef('pk'),
        ).values('room').annotate(cnt=Count('id')).values('cnt')

        last_msg_subquery = ChatMessage.objects.filter(
            room=OuterRef('pk'), 
            is_deleted=False
        ).order_by('-timestamp').values('id')[:1]

        rooms = current_user.chat_rooms.annotate(
            sort_date=Coalesce(
                Max('messages__timestamp', filter=Q(messages__is_deleted=False)), 
                'created_at'
            ),
            annotated_unread_count=Coalesce(
                Subquery(unread_subquery, output_field=IntegerField()), 
                0
            ),
            last_msg_id=Subquery(last_msg_subquery)
        ).prefetch_related(
            Prefetch("participants", queryset=User.objects.select_related("profile"))
        ).order_by('-sort_date')

        return [format_room_response(room, current_user) for room in rooms]

    return await get_formatted_rooms()
    
@router.post("/rooms", response_model=ChatRoomRead)

async def create_room(data: ChatRoomCreate, current_user: User = Depends(get_current_user)):

    @sync_to_async
    def process_room_creation():
        try:
            with transaction.atomic():
                if data.email_id:
                    existing_email_room = ChatRoom.objects.filter(
                        related_email_id=data.email_id
                    ).first()

                    if existing_email_room:
                        return format_room_response(existing_email_room, current_user), None
 
                participant_emails = set(data.participant_emails or [])
                related_email_obj = None
 
                if data.email_id:
                    try:
                        related_email_obj = Email.objects.select_related('sender').get(id=data.email_id)
                        if related_email_obj.sender:
                            participant_emails.add(related_email_obj.sender.email)
                    except Email.DoesNotExist:
                        return None, "Linked email not found"
 
                participant_emails.add(current_user.email)

                users_to_add = list(User.objects.filter(email__in=participant_emails))
                if len(users_to_add) < 2 and not data.is_group:
                    return None, "At least one other valid participant is required for a 1-on-1 chat"
 
                if not data.is_group:
                    existing_rooms = ChatRoom.objects.filter(is_group=False).annotate(
                        num_participants=Count('participants')
                    ).filter(num_participants=len(users_to_add))
 
                    for u in users_to_add:
                        existing_rooms = existing_rooms.filter(participants=u)
                    existing_room = existing_rooms.first()
                    if existing_room:
                        return format_room_response(existing_room, current_user), None
 
                room_name = data.name or (f"Group Chat ({len(users_to_add)})" if data.is_group else "")

                room = ChatRoom.objects.create(
                    name=room_name,
                    is_group=data.is_group,
                    related_email=related_email_obj
                )

                room.participants.add(*users_to_add)
 
                if data.is_group:
                    ChatMessage.objects.create(
                        room=room,
                        sender=current_user,
                        content=f"{current_user.first_name} created the group '{room_name}'",
                        message_type='SYSTEM'
                    )

                return format_room_response(room, current_user), None
 
        except Exception as e:
            return None, str(e)
 
    response_data, error_message = await process_room_creation()
 
    if error_message:
        status_code = 404 if "not found" in error_message else 400
        raise HTTPException(status_code=status_code, detail=error_message)
 
    for participant in response_data.get('participants', []):
        if participant['id'] == current_user.id:
            continue

        try:
            await manager.broadcast_to_user(participant['id'], {
                "type": "ROOM_CREATED",
                "room": response_data
            })

        except Exception:
            pass
 
    return response_data

@router.get("/search", response_model=List[MessageRead])
async def search_messages(
    q: str = Query(..., min_length=1, description="Search term"),
    msg_type: Optional[str] = Query(None, description="Filter by message type"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)

):
    @sync_to_async
    def process_search():
        user_room_ids = current_user.chat_rooms.values_list('id', flat=True)
        
        msgs = ChatMessage.objects.filter(
            room__id__in=user_room_ids,   
            is_deleted=False,             
        ).filter(
            Q(content__icontains=q) | Q(attachment__icontains=q)            
        )
        
        if msg_type:
            msgs = msgs.filter(message_type=msg_type.upper())

        msgs = msgs.select_related(
            'sender', 'parent', 'parent__sender', 'room'
        ).prefetch_related(
            'reactions', 'reactions__user', 'read_by', 'starred_by'
        ).annotate(
            annotated_read_count=Count('read_by', distinct=True),
            user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),
            user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
        ).order_by("-timestamp")
        
        paginated_msgs = list(msgs[offset : offset + limit])
        
        results = []
        for m in paginated_msgs:
            url = None
            try:
                if m.attachment:
                    url = m.attachment.url
            except (ValueError, AttributeError):
                url = None
                
            reaction_map = {}
            for r in m.reactions.all():
                if r.emoji not in reaction_map:
                    reaction_map[r.emoji] = {"count": 0, "emails": []}
                reaction_map[r.emoji]["count"] += 1
                reaction_map[r.emoji]["emails"].append(r.user.email)

            results.append({
                "id": m.id,
                "room_id": m.room_id,
                "sender_email": m.sender.email,
                "sender_first_name": m.sender.first_name,
                "sender_last_name": m.sender.last_name,
                "content": m.content,
                "attachment_url": url,
                "timestamp": m.timestamp,
                "read_count": m.annotated_read_count,
                "is_starred": getattr(m, 'user_starred', False),
                "is_saved": getattr(m, 'user_saved', False),
                "is_pinned": m.is_pinned,
                "message_link": f"/chat/rooms/{m.room_id}?message_id={m.id}",
                "parent_id": m.parent.id if m.parent else None,
                "parent_content": m.parent.content if m.parent else None,
                "parent_sender": m.parent.sender.email if m.parent else None,
                "reactions": [
                    {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                    for k, v in reaction_map.items()
                ],
                "is_forwarded": m.is_forwarded,
                "is_deleted": m.is_deleted
            })

        return results
    
    return await process_search()

@router.get("/online", response_model=List[UserActivityRead]) 
async def get_online_users(
    limit: int = Query(20, description="Max number of online users", le=100),
    current_user: User = Depends(get_current_user)
):
    active_user_ids = list(manager.user_connection_counts.keys())
    
    if not active_user_ids or (len(active_user_ids) == 1 and current_user.id in active_user_ids):
        return []
    
    @sync_to_async
    def fetch_active_profiles_from_db():
        users = User.objects.select_related('profile').filter(
            id__in=active_user_ids,
            is_active=True 
        ).exclude(id=current_user.id)[:limit]
    
        result = []
        for u in users:
            full_name = f"{u.first_name} {u.last_name}".strip() or u.email.split('@')[0]
                
            profile_img = None
            last_seen_val = None
            db_is_online = False

            if hasattr(u, 'profile') and u.profile:
                last_seen_val = u.profile.last_seen
                db_is_online = u.profile.is_online
                if u.profile.avatar:
                    try:
                        profile_img = u.profile.avatar.url
                    except (ValueError, AttributeError):
                        profile_img = None

            result.append({
                "id": u.id,
                "name": full_name,
                "email": u.email,
                "profile_image": profile_img,
                "last_seen": last_seen_val,
                "is_online": db_is_online,
                "status": "online" 
            })

        return result
    
    return await fetch_active_profiles_from_db()

@router.post("/messages/{message_id}/share")
async def generate_share_link(
    message_id: int, 
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def create_token():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id, is_deleted=False)
            
            if not msg.room.participants.filter(id=current_user.id).exists():
                return None, "Not authorized to share this message"

            if not msg.share_token:
                msg.share_token = secrets.token_urlsafe(16)
                msg.save(update_fields=['share_token'])
            
            return {
                "share_token": msg.share_token,
                "share_path": f"/share/{msg.share_token}" 
            }, None
        except ChatMessage.DoesNotExist:
            return None, "Message not found"
        except Exception as e:
            return None, str(e)

    result, error = await create_token() 
    
    if error:
        status_code = 403 if "authorized" in error else 404
        raise HTTPException(status_code=status_code, detail=error)
        
    return result 

@router.get("/public/share/{token}")
async def view_shared_message(token: str):
    @sync_to_async
    def fetch_by_token():
        return ChatMessage.objects.select_related('sender').filter(
            share_token=token, 
            is_deleted=False
        ).first()

    msg = await fetch_by_token()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Shared link is invalid or has been expired")

    attachment_url = None
    if msg.attachment:
        try:
            attachment_url = msg.attachment.url
        except (ValueError, AttributeError):
            attachment_url = None

    return {
        "id": msg.id,
        "sender": f"{msg.sender.first_name} {msg.sender.last_name}".strip() or "User",
        "content": msg.content,
        "timestamp": msg.timestamp,
        "attachment_url": attachment_url,
        "is_public": True
    }
    
@router.get("/rooms/{room_id}/messages", response_model=List[MessageRead])
async def get_messages(
    room_id: int, 
    q: Optional[str] = Query(None, description="Search within this room"), 
    limit: int = Query(50, ge=1, le=100), 
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def fetch_and_format():
        room_exists = ChatRoom.objects.filter(id=room_id, participants=current_user).exists()
        if not room_exists:
            if not ChatRoom.objects.filter(id=room_id).exists():
                return "NOT_FOUND"
            return "FORBIDDEN"

        msgs_queryset = ChatMessage.objects.filter(
            room_id=room_id, 
            is_deleted=False
            ).select_related(
            'sender', 'parent', 'parent__sender'
        ).prefetch_related(
            'reactions', 'reactions__user', 'read_by', 'starred_by'
        ).annotate(
            annotated_read_count=Count('read_by', distinct=True),
            user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),
            user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
        ).order_by("-timestamp")

        if q:
            msgs_queryset = msgs_queryset.filter(content__icontains=q)
            
        paginated_msgs = list(msgs_queryset[offset : offset + limit])
            
        results = []
        for msg_obj in paginated_msgs:
            attachment_url = None
            if msg_obj.attachment:
                try:
                    attachment_url = msg_obj.attachment.url
                except (ValueError, AttributeError):
                    pass
            
            reaction_map = {}
            for r in msg_obj.reactions.all():
                if r.emoji not in reaction_map:
                    reaction_map[r.emoji] = {"count": 0, "emails": []}
                reaction_map[r.emoji]["count"] += 1
                reaction_map[r.emoji]["emails"].append(r.user.email)
                                
            results.append({
                "id": msg_obj.id,
                "room_id": room_id,
                "sender_email": msg_obj.sender.email,
                "sender_first_name": msg_obj.sender.first_name,
                "sender_last_name": msg_obj.sender.last_name,
                "content": msg_obj.content,
                "attachment_url": attachment_url,
                "timestamp": msg_obj.timestamp,
                "read_count": msg_obj.annotated_read_count,
                "is_starred": getattr(msg_obj, 'user_starred', False),
                "is_saved": getattr(msg_obj, 'user_saved', False),     
                "is_pinned": msg_obj.is_pinned,
                "message_link": f"/chat/rooms/{room_id}?message_id={msg_obj.id}",
                "parent_id": msg_obj.parent.id if msg_obj.parent else None,
                "parent_content": msg_obj.parent.content if msg_obj.parent else None,
                "parent_sender": msg_obj.parent.sender.email if msg_obj.parent else None,
                "reactions": [
                    {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                    for k, v in reaction_map.items()
                ],
                "is_forwarded": msg_obj.is_forwarded    
            })
                                
        results.reverse()
        return results   
        
    data = await fetch_and_format()

    if data == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    if data == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Room not found")
    
    return data

@router.patch("/messages/{message_id}", response_model=MessageRead)

async def edit_message(

    message_id: int,

    data: MessageUpdate,

    current_user: User = Depends(get_current_user)

):

    if data. Content is not None and not data.content.strip():

        raise HTTPException(status_code=400, detail="Content cannot be empty")
 
    @sync_to_async

    def process_edit():

        try:

            msg = ChatMessage.objects.select_related(

                'sender', 'parent', 'parent__sender', 'room'

            ).prefetch_related(

                'reactions', 'reactions__user', 'read_by', 'starred_by'

            ).annotate(

                annotated_read_count=Count('read_by', distinct=True),

                user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),

                user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))

            ).get(id=message_id)

        except ChatMessage.DoesNotExist:

            return None, "Message not found"


        if not msg.room.participants.filter(id=current_user.id).exists():

            return None, "Not authorized"
 
        if msg.sender_id != current_user.id:

            return None, "You can only edit your own messages"


        if data.file_name and msg.attachment:

            new_filename = data.file_name.strip()

            if new_filename:

                if msg.content.startswith('Sent a file:'):

                    msg.content = f"Sent a file: {new_filename}"

                elif msg.content.startswith('📎'):

                    msg.content = f"📎 {new_filename}"

        elif data.content is not None:

            msg.content = sanitize_rich_text(data.content)

        msg.save()
 

        reaction_map = {}

        for r in msg.reactions.all():

            if r.emoji not in reaction_map:

                reaction_map[r.emoji] = {"count": 0, "emails": []}

            reaction_map[r.emoji]["count"] += 1

            reaction_map[r.emoji]["emails"].append(r.user.email)
 
        reactions_list = [

            {"emoji": k, "count": v["count"], "user_emails": v["emails"]}

            for k, v in reaction_map.items()

        ]
 
        attachment_url = None

        if msg.attachment:

            try:

                attachment_url = msg.attachment.url

            except (ValueError, AttributeError):

                attachment_url = None
 
        response_data = {

            "id": msg.id,

            "room_id": msg.room_id,

            "sender_email": msg.sender.email,

            "sender_first_name": msg.sender.first_name,

            "sender_last_name": msg.sender.last_name,

            "content": msg.content,

            "attachment_url": attachment_url,

            "timestamp": msg.timestamp,

            "read_count": msg.annotated_read_count,

            "is_starred": getattr(msg, 'user_starred', False),

            "is_saved": getattr(msg, 'user_saved', False),

            "is_pinned": msg.is_pinned,

            "is_deleted": msg.is_deleted,

            "message_link": f"/chat/rooms/{msg.room_id}?message_id={msg.id}",

            "parent_id": msg.parent.id if msg.parent else None,

            "parent_content": msg.parent.content if msg.parent else None,

            "parent_sender": msg.parent.sender.email if msg.parent else None,

            "reactions": reactions_list,

            "is_forwarded": msg.is_forwarded

        }
 
        return response_data, None


    response_data, error_msg = await process_edit()
 
    if error_msg:

        status_code = 404 if "not found" in error_msg else 403

        raise HTTPException(status_code=status_code, detail=error_msg)


    await manager.broadcast({

        "type": "MESSAGE_UPDATE",

        "id": response_data["id"],

        "room_id": response_data["room_id"],

        "content": response_data["content"],

        "attachment_url": response_data.get("attachment_url"),

        "timestamp": str(response_data["timestamp"]),

        "is_deleted": response_data["is_deleted"]

    }, response_data["room_id"])
 
    return response_data

@router.post("/rooms/{room_id}/read")
async def mark_room_as_read(
    room_id: int, 
    current_user: User = Depends(get_current_user)
):
    settings, _ = await sync_to_async(UserChatSettings.objects.get_or_create)(
        user=current_user
    )

    if not settings.read_receipts:
        return {
            "message": "Read receipts are disabled in your settings. Unread count was not updated.",
            "updated_count": 0
        }
    
    @sync_to_async
    def process_read_receipts():
        try:
            room = ChatRoom.objects.filter(id=room_id).first()
            if not room:
                return "NOT_FOUND", None
            if not room.participants.filter(id=current_user.id).exists():
                return "FORBIDDEN", None
            
            unread_qs = ChatMessage.objects.filter(
                ChatMessage.get_unread_filter(current_user),
                room_id=room_id,
            ).order_by('-timestamp')[:100] 

            unread_msg_ids = list(unread_qs.values_list('id', flat=True))
            count = len(unread_msg_ids)
            
            if count > 0:
                ReadByModel = ChatMessage.read_by.through
                bulk_objs = [
                    ReadByModel(chatmessage_id=m_id, user_id=current_user.id)
                    for m_id in unread_msg_ids
                ]
                ReadByModel.objects.bulk_create(bulk_objs, ignore_conflicts=True)
                
            return count, unread_msg_ids
            
        except Exception as e:
            return 0, []
        
    result, msg_ids = await process_read_receipts()

    if result == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="You are not a participant of this room")
    if result == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Room not found")
    
    if isinstance(result, int) and result > 0:
        await manager.broadcast({
            "type": "MESSAGES_READ",
            "room_id": room_id,
            "reader_email": current_user.email,
            "message_ids": msg_ids,
            "count": result,
            "timestamp": timezone.now().isoformat()
        }, room_id)

    return {"message": "Messages marked as read", "updated_count": result if isinstance(result, int) else 0}

@router.delete("/messages/{message_id}")
async def delete_message(message_id: int, current_user = Depends(get_current_user)):
    
    @sync_to_async
    def process_soft_delete():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, "NOT_FOUND"

        if msg.sender_id != current_user.id:
            return None, "FORBIDDEN"

        msg.is_deleted = True
        msg.save(update_fields=['is_deleted'])
        
        room = msg.room
        if getattr(room, 'last_message_id', None) == msg.id:
            previous_msg = ChatMessage.objects.filter(
                room_id=room.id, 
                is_deleted=False
            ).order_by('-timestamp').only('id').first() 
            
            room.last_message = previous_msg
            room.save(update_fields=['last_message'])

        return room.id, None

    room_id, error_type = await process_soft_delete()
    
    if error_type == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Message not found")
    if error_type == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    await manager.broadcast({
        "type": "MESSAGE_DELETE",
        "message_id": message_id,
        "room_id": room_id,
        "mode": "soft", 
        "sender_id": current_user.id
    }, room_id)

    return {"status": "success", "message": "Message deleted", "id": message_id}

@router.post("/messages/{message_id}/restore")
async def restore_message(message_id: int, current_user: User = Depends(get_current_user)):
    
    @sync_to_async
    def process_restore():
        try:
            msg = ChatMessage.objects.select_related('room', 'sender').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return None, "NOT_FOUND"

        if msg.sender_id != current_user.id:
            return None, "FORBIDDEN"

        if not msg.is_deleted:
            return None, "ALREADY_ACTIVE"

        msg.is_deleted = False
        msg.save(update_fields=['is_deleted'])
        
        room = msg.room
        current_last_msg = room.last_message

        if not current_last_msg or msg.timestamp > current_last_msg.timestamp:
            room.last_message = msg
            room.save(update_fields=['last_message'])
        
        return msg, None

    msg_obj, error_type = await process_restore()

    if error_type == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Message not found")
    if error_type == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="Permission denied")
    if error_type == "ALREADY_ACTIVE":
        return {"status": "info", "message": "Message is already active"}

    await manager.broadcast({
        "type": "MESSAGE_RESTORE",
        "id": msg_obj.id,
        "room_id": msg_obj.room_id,
        "content": msg_obj.content, 
        "timestamp": msg_obj.timestamp.isoformat(),
        "sender_email": msg_obj.sender.email,
        "sender_name": f"{msg_obj.sender.first_name} {msg_obj.sender.last_name}".strip(),
        "sender_id": current_user.id
    }, msg_obj.room_id)

    return {"status": "success", "message": "Message restored", "id": msg_obj.id}

@router.post("/messages/{message_id}/star")
async def star_message(message_id: int, current_user=Depends(get_current_user)):

    @sync_to_async
    def process_star():
        try:
            msg = ChatMessage.objects.filter(
                id=message_id,
                room__participants=current_user 
            ).first()
            
            if not msg:
                return None, "Message not found or access denied"

            if msg.starred_by.filter(id=current_user.id).exists():
                msg.starred_by.remove(current_user)
                return False, None
            else:
                msg.starred_by.add(current_user)
                return True, None
                
        except Exception as e:
            return None, str(e)

    is_starred, error = await process_star()

    if error:
        status_code = 404 if "not found" in error else 400
        raise HTTPException(status_code=status_code, detail=error)

    return {
        "status": "success",
        "message": "Message star toggled",
        "is_starred": is_starred
    }
       
@router.post("/messages/{message_id}/unread")
async def mark_as_unread(
    message_id: int, 
    current_user: User = Depends(get_current_user)

):
    @sync_to_async
    def process_unread():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id, is_deleted=False)
            
            if not msg.room.participants.filter(id=current_user.id).exists():
                return "FORBIDDEN", None

            if current_user in msg.read_by.all():
                msg.read_by.remove(current_user)
            
            return "SUCCESS", msg.room_id
            
        except ChatMessage.DoesNotExist:
            return "NOT_FOUND", None
        
    result, room_id = await process_unread()

    if result == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Message not found")
    if result == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="You are not a participant in this chat")
    
    await manager.broadcast_to_user(current_user.id, {
        "type": "ROOM_UNREAD_UPDATE",
        "message_id": message_id,
        "room_id": room_id,
        "action": "marked_unread"
    })
    
    return {
        "status": "success", 
        "message": "Message marked as unread"
    }    

@router.patch("/messages/{message_id}/pin", response_model=MessageRead)
async def pin_message(
    message_id: int,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def process_pin():
        try:
            msg = ChatMessage.objects.select_related(
                "room", "sender", "sender__profile", "parent", "parent__sender"
            ).prefetch_related(
                "reactions", "reactions__user", "read_by", "starred_by"
            ).annotate(
                annotated_read_count=Count('read_by', distinct=True),
                user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),
                user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
            ).get(id=message_id, is_deleted=False)
        except ChatMessage.DoesNotExist:
            return None, "Message not found"

        if not msg.room.participants.filter(id=current_user.id).exists():
            return None, "Not authorized"

        msg.is_pinned = not msg.is_pinned
        msg.save(update_fields=["is_pinned"])

        reaction_map = {}
        for r in msg.reactions.all():
            if r.emoji not in reaction_map:
                reaction_map[r.emoji] = {"count": 0, "emails": []}
            reaction_map[r.emoji]["count"] += 1
            reaction_map[r.emoji]["emails"].append(r.user.email)

        url = None
        if msg.attachment:
            try:
                url = msg.attachment.url
            except (ValueError, AttributeError):
                url = None

        response_payload = {
            "id": msg.id,
            "room_id": msg.room_id,
            "sender_email": msg.sender.email,
            "sender_first_name": msg.sender.first_name,
            "sender_last_name": msg.sender.last_name,
            "content": msg.content,
            "attachment_url": url,
            "timestamp": msg.timestamp,
            "read_count": msg.annotated_read_count,
            "is_starred": getattr(msg, 'user_starred', False),
            "is_saved": getattr(msg, 'user_saved', False),
            "is_pinned": msg.is_pinned,
            "message_link": f"/chat/rooms/{msg.room_id}?message_id={msg.id}",
            "parent_id": msg.parent.id if msg.parent else None,
            "parent_content": msg.parent.content if msg.parent else None,
            "parent_sender": msg.parent.sender.email if msg.parent else None,
            "reactions": [
                {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                for k, v in reaction_map.items()
            ],
            "is_forwarded": msg.is_forwarded,
           
            "event_type": "MESSAGE_PINNED" if msg.is_pinned else "MESSAGE_UNPINNED"
        }

        return response_payload, None

    response_data, error_msg = await process_pin()

    if error_msg:
        status_code = 404 if "not found" in error_msg else 403
        raise HTTPException(status_code=status_code, detail=error_msg)

    await manager.broadcast({
        "type": response_data["event_type"],
        "message_id": response_data["id"],
        "room_id": response_data["room_id"],
        "is_pinned": response_data["is_pinned"],
        "message_data": response_data  
    }, response_data["room_id"])

    return response_data

@router.get("/rooms/{room_id}/pinned", response_model=List[MessageRead])
async def get_pinned_messages(
    room_id: int,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def fetch_and_format_pinned():
        # 1. Check if room exists
        if not ChatRoom.objects.filter(id=room_id).exists():
            return "NOT_FOUND", None
        
        if not ChatRoom.objects.filter(id=room_id, participants=current_user).exists():
            return "FORBIDDEN", None
 
        msgs = ChatMessage.objects.filter(
            room_id=room_id,
            is_deleted=False,
            is_pinned=True
        ).select_related(
            "sender", "sender__profile", "parent", "parent__sender"
        ).prefetch_related(
            "reactions", "reactions__user", "read_by", "starred_by"
        ).annotate(
            annotated_read_count=Count('read_by', distinct=True),
            user_starred=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), starred_by=current_user)),
            user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
        ).order_by("-timestamp")
 
        results = []
        for m in msgs:
            url = None
            try:
                if m.attachment:
                    url = m.attachment.url
            except (ValueError, AttributeError):
                url = None
 
            reaction_map = {}
            for r in m.reactions.all():
                if r.emoji not in reaction_map:
                    reaction_map[r.emoji] = {"count": 0, "emails": []}
                reaction_map[r.emoji]["count"] += 1
                reaction_map[r.emoji]["emails"].append(r.user.email)
 
            results.append({
                "id": m.id,
                "room_id": room_id,
                "sender_email": m.sender.email,
                "sender_first_name": m.sender.first_name,
                "sender_last_name": m.sender.last_name,
                "sender_profile_image": m.sender.profile.avatar.url if hasattr(m.sender, 'profile') and m.sender.profile.avatar else None,
                "content": m.content,
                "attachment_url": url,
                "timestamp": m.timestamp,
                "read_count": m.annotated_read_count,
                "is_starred": m.user_starred,
                "is_saved": m.user_saved,
                "is_pinned": True,
                "is_deleted": False, # Added for schema consistency
                "is_forwarded": m.is_forwarded,
                "message_link": f"/chat/rooms/{room_id}?message_id={m.id}",
                "parent_id": m.parent.id if m.parent else None,
                "parent_content": m.parent.content if m.parent else None,
                "parent_sender": m.parent.sender.email if m.parent else None,
                "reactions": [
                    {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                    for k, v in reaction_map.items()
                ]
            })
 
        return "SUCCESS", results
 
    status, data = await fetch_and_format_pinned()
 
    if status == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Room not found")
    if status == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="Not authorized to view this room")
 
    return data
 
@router.post("/messages/{message_id}/share")
async def share_message(
    message_id: int,
    request: ForwardRequest,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def process_share():
        try:
            original_msg = ChatMessage.objects.select_related("room", "attachment").get(
                id=message_id,
                is_deleted=False
            )
        except ChatMessage.DoesNotExist:
            return None, "Original message not found"
 
        if not original_msg.room.participants.filter(id=current_user.id).exists():
            return None, "Not authorized to share this message"
 
        try:
            target_room = ChatRoom.objects.get(id=request.target_room_id)
        except ChatRoom.DoesNotExist:
            return None, "Target room not found"
 
        if not target_room.participants.filter(id=current_user.id).exists():
            return None, "You are not a member of the target room"
 
        new_msg = ChatMessage.objects.create(
            room=target_room,
            sender=current_user,
            content=original_msg.content,
            attachment=original_msg.attachment,
            is_forwarded=True
        )
 
        url = None
        filename = None
        if new_msg.attachment:
            try:
                url = new_msg.attachment.url
                filename = os.path.basename(new_msg.attachment.name)
            except (ValueError, AttributeError):
                url = None
 
        socket_payload = {
            "id": new_msg.id,
            "room_id": target_room.id,
            "sender_email": current_user.email,
            "sender_first_name": current_user.first_name,
            "sender_last_name": current_user.last_name,
            "content": new_msg.content,
            "attachment_url": url,
            "filename": filename,
            "timestamp": str(new_msg.timestamp),
            "read_count": 0,
            "is_starred": False,
            "is_saved": False,
            "is_pinned": False,
            "is_deleted": False,
            "is_forwarded": True,
            "parent_id": None,
            "parent_content": None,
            "parent_sender": None,
            "reactions": []
        }
 
        return socket_payload, None
 
    socket_message, error_msg = await process_share()
 
    if error_msg:
        status_code = 404 if "not found" in error_msg else 403
        raise HTTPException(status_code=status_code, detail=error_msg)
 
    await manager.broadcast({
        "type": "MESSAGE_NEW",
        **socket_message
    }, request.target_room_id)
 
    return socket_message
          
@router.get("/starred", response_model=List[MessageRead])
async def get_my_starred_messages(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def fetch_starred():
        msgs = ChatMessage.objects.filter(
            starred_by=current_user,
            is_deleted=False
        ).select_related(
            'sender', 'parent', 'parent__sender', 'room'
        ).prefetch_related(
            'reactions', 'reactions__user'
        ).annotate(
            total_reads=Count('read_by', distinct=True),
            user_saved=Exists(ChatMessage.objects.filter(id=OuterRef('pk'), saved_by=current_user))
        ).order_by("-timestamp")[offset : offset + limit]
        
        results = []
        for m in msgs:
            url = None
            if m.attachment:
                try:
                    url = m.attachment.url
                except (ValueError, AttributeError):
                    url = None
                       
            reaction_map = {}
            for r in m.reactions.all():
                if r.emoji not in reaction_map:
                    reaction_map[r.emoji] = {"count": 0, "emails": []}
                reaction_map[r.emoji]["count"] += 1
                reaction_map[r.emoji]["emails"].append(r.user.email)
                
            results.append({
                "id": m.id,
                "room_id": m.room_id,
                "room_name": m.room.name if m.room else "Private Chat",
                "sender_email": m.sender.email,
                "sender_first_name": m.sender.first_name,
                "sender_last_name": m.sender.last_name,
                "content": m.content,
                "attachment_url": url,
                "timestamp": m.timestamp,
                "read_count": m.total_reads,
                "is_starred": True, 
                "is_saved": m.user_saved, 
                "is_pinned": m.is_pinned,
                "message_link": f"/chat/rooms/{m.room_id}?message_id={m.id}",
                "parent_id": m.parent.id if m.parent else None,
                "parent_content": m.parent.content if m.parent else None,
                "parent_sender": m.parent.sender.email if m.parent else None,
                "reactions": [
                    {"emoji": k, "count": v["count"], "user_emails": v["emails"]}
                    for k, v in reaction_map.items()
                ],
                "is_forwarded": m.is_forwarded
            })
        return results

    return await fetch_starred() 

@router.post("/rooms/{room_id}/upload", response_model=MessageRead)
async def upload_chat_attachment(
    room_id: int,
    file: UploadFile = File(...),
    content: str = Form(""),
    current_user: User = Depends(get_current_user),
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File or filename is missing")
 
    mime_type, _ = mimetypes.guess_type(file.filename)
    is_image = mime_type and mime_type.startswith('image/')
    
    file_content = await file.read()
    filename = file.filename
 
    @sync_to_async
    def process_upload_in_db():
        try:
            with transaction.atomic():
                try:
                    room = ChatRoom.objects.get(id=room_id)
                except ChatRoom.DoesNotExist:
                    return None, "Room not found"
 
                if not room.participants.filter(id=current_user.id).exists():
                    return None, "Not a participant"
 
                typed_message = content.strip()
                if typed_message:
                    content_text = typed_message
                else:
                    content_text = f"Sent a {'photo' if is_image else 'file'}: {filename}"
 
                msg = ChatMessage.objects.create(
                    room=room,
                    sender=current_user,
                    content=content_text,
                    message_type='IMAGE' if is_image else 'FILE'
                )
 
                msg.attachment.save(filename, ContentFile(file_content), save=True)
                
                room.last_message = msg
                room.save(update_fields=['last_message'])
 
                recipients = room.participants.exclude(id=current_user.id)
                notifications = []
                for p in recipients:
                    p_settings, _ = UserChatSettings.objects.get_or_create(user=p)
                    if p_settings.chat_push_enabled:
                        notifications.append(
                            Notification(
                                recipient=p,
                                message=f"New file from {current_user.first_name or current_user.email}",
                                notification_type="chat"
                            )
                        )
                if notifications:
                    Notification.objects.bulk_create(notifications)
 
                attachment_url = msg.attachment.url if msg.attachment else None
 
                payload = {
                    "type": "MESSAGE_NEW",
                    "id": msg.id,
                    "room_id": room.id,
                    "sender_email": current_user.email,
                    "sender_first_name": current_user.first_name,
                    "sender_last_name": current_user.last_name,
                    "content": msg.content,
                    "attachment_url": attachment_url,
                    "filename": filename,
                    "timestamp": str(msg.timestamp),
                    "read_count": 0,
                    "is_starred": False,
                    "is_saved": False,
                    "is_pinned": False,
                    "is_deleted": False,
                    "is_forwarded": False,
                    "message_link": f"/chat/rooms/{room.id}?message_id={msg.id}",
                    "reactions": [],
                    "parent_id": None,
                    "parent_content": None,
                    "parent_sender": None
                }
                return payload, None
 
        except Exception as e:
            logger.exception("Upload failed for room_id=%s, filename=%s", room_id, filename)
            return None, str(e)
 
    socket_message, error_msg = await process_upload_in_db()
 
    if error_msg:
        status_code = 404 if "not found" in error_msg else 403
        if "Internal error" in error_msg: status_code = 500
        raise HTTPException(status_code=status_code, detail=error_msg)
 
    try:
        await manager.broadcast(socket_message, room_id)
    except Exception:
        logger.exception("Broadcast failed for room_id=%s", room_id)
       
    return socket_message
  
@router.post("/messages/{message_id}/react")
async def toggle_reaction(
    message_id: int,
    emoji: str,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def toggle_db_reaction():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id)
            
            if not msg.room.participants.filter(id=current_user.id).exists():
                return None, "FORBIDDEN"
        except ChatMessage.DoesNotExist:
            return None, "NOT_FOUND"
        
        with transaction.atomic():
            existing = MessageReaction.objects.filter(
                message=msg,
                user=current_user,
                emoji=emoji
            ).first()

            if existing:
                existing.delete()
                action = "removed"
            else:
                MessageReaction.objects.create(
                    message=msg,
                    user=current_user,
                    emoji=emoji
                )
                action = "added"
            
            new_count = MessageReaction.objects.filter(
                message=msg, 
                emoji=emoji
            ).count()

        return {
            "message_id": msg.id,
            "room_id": msg.room_id,
            "action": action,
            "emoji": emoji,
            "count": new_count,
            "user_email": current_user.email
        }, "SUCCESS"

    result, status = await toggle_db_reaction()

    if status == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Message not found")
    if status == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="Not authorized to react in this room")

    await manager.broadcast({
        "type": "MESSAGE_REACTION",
        **result
    }, result["room_id"])

    return result

@router.post("/messages/{message_id}/forward")
async def forward_message(
    message_id: int,
    request: ForwardRequest,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def process_forward():
        try:
            original_msg = ChatMessage.objects.select_related("room").get(
                id=message_id, 
                is_deleted=False
            )
            
            if not original_msg.room.participants.filter(id=current_user.id).exists():
                return None, "You no longer have access to the original message"
            
            target_room = ChatRoom.objects.get(id=request.target_room_id)
            if not target_room.participants.filter(id=current_user.id).exists():
                return None, "You are not a member of the target room"
                
        except ChatMessage.DoesNotExist:
            return None, "Original message not found"
        except ChatRoom.DoesNotExist:
            return None, "Target room not found"

        new_msg = ChatMessage.objects.create(
            room=target_room,
            sender=current_user,
            content=original_msg.content, 
            attachment=original_msg.attachment, 
            is_forwarded=True
        )

        target_room.last_message = new_msg
        target_room.save() 

        participants = target_room.participants.exclude(id=current_user.id)
        notifications = [
            Notification(
                recipient=p,
                message=f"Forwarded message from {current_user.first_name or current_user.email}",
                notification_type="chat"
            ) for p in participants
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)

        url = None
        if new_msg.attachment:
            try:
                url = new_msg.attachment.url
            except:
                pass

        return {
            "type": "MESSAGE_NEW",  
            "id": new_msg.id,
            "room_id": target_room.id,
            "sender_email": current_user.email,
            "sender_first_name": current_user.first_name,
            "sender_last_name": current_user.last_name,
            "content": new_msg.content,
            "attachment_url": url,
            "timestamp": str(new_msg.timestamp),
            "is_forwarded": True,
            "read_count": 0,
            "is_starred": False,
            "parent_id": None, 
            "parent_content": None,
            "parent_sender": None,
            "reactions": [],
            "is_forwarded": True,
        }    

        return socket_message, None, new_msg.id
    socket_message, error_msg, new_msg_id = await process_forward()

    if error_msg:
        status_code = 403 if "access" in error_msg or "member" in error_msg else 404
        raise HTTPException(status_code=status_code, detail=error_msg)

    await manager.broadcast(socket_message, request.target_room_id)

    return {"message": "Message shared successfully", "new_message_id": socket_message["id"]}

@router.post("/rooms/{room_id}/message", response_model=MessageRead)
async def send_text_message(
    room_id: int,
    data: TextMessageCreate,
    current_user: User = Depends(get_current_user)
):
    content = data.content.strip() if data.content else ""
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
 
    link = extract_link(content)
    title, description, image = "", "", ""
    if link and link.startswith(("http://", "https://")):
        try:
            title, description, image = await sync_to_async(fetch_link_preview)(link)
        except Exception:
            title, description, image = "", "", ""
 
    @sync_to_async
    def save_text_message():
        with transaction.atomic():
            try:
                room = ChatRoom.objects.get(id=room_id)
            except ChatRoom.DoesNotExist:
                return None, "Room not found"
 
            if not room.participants.filter(id=current_user.id).exists():
                return None, "Not a participant"
 
            parent_msg = None
            if data.parent_id:
                try:
                    parent_msg = ChatMessage.objects.select_related('sender').get(
                        id=data.parent_id, room=room
                    )
                    if parent_msg.is_deleted:
                        return None, "Cannot reply to a deleted message"
                except ChatMessage.DoesNotExist:
                    return None, "Parent message not found"
 
            msg = ChatMessage.objects.create(
                room=room,
                sender=current_user,
                content=content,  
                parent=parent_msg,
                link_url=link,
                link_title=title,
                link_description=description,
                link_image=image,
                is_forwarded=getattr(data, 'is_forwarded', False),
                message_type='TEXT'
            )
 
            if getattr(data, 'mention_ids', None):
                msg.mentions.set(data.mention_ids)
            else:
                process_mentions(msg)
 
            room.last_message = msg
            room.save(update_fields=['last_message']) 
 
            recipients = room.participants.exclude(id=current_user.id)
            notifications_to_create = []
            for p in recipients:
                p_settings, _ = UserChatSettings.objects.get_or_create(user=p)
                if p_settings.chat_push_enabled:
                    notifications_to_create.append(
                        Notification(
                            recipient=p,
                            message=f"New message from {current_user.first_name or current_user.email}",
                            notification_type="chat"
                        )
                    )
            
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)
 
            payload = {
                "id": msg.id,
                "room_id": room.id,
                "sender_email": current_user.email,
                "sender_first_name": current_user.first_name,
                "sender_last_name": current_user.last_name,
                "content": msg.content,
                "timestamp": str(msg.timestamp), 
                "parent_id": parent_msg.id if parent_msg else None,
                "parent_content": parent_msg.content if parent_msg else None,
                "parent_sender": parent_msg.sender.email if parent_msg else None,
                "read_count": 0,
                "is_starred": False,
                "is_saved": False,
                "is_pinned": False,
                "is_deleted": False,
                "message_link": f"/chat/rooms/{room_id}?message_id={msg.id}",
                "reactions": [],
                "is_forwarded": msg.is_forwarded,
                "link_url": msg.link_url,
                "link_title": msg.link_title,
                "link_description": msg.link_description,
                "link_image": msg.link_image,
                "type": "MESSAGE_NEW"
            }
            return payload, None
 
    socket_message, error = await save_text_message()
     
    if error:
        status_code = 404 if "not found" in error else 403
        raise HTTPException(status_code=status_code, detail=error)
 
    await manager.broadcast(socket_message, room_id)
 
    return socket_message
 
@router.post("/messages/{message_id}/save")
async def toggle_save_message(message_id: int, current_user: User = Depends(get_current_user)):
    @sync_to_async
    def handle_save():
        try:
            msg = ChatMessage.objects.select_related('room').get(id=message_id)
            if not msg.room.participants.filter(id=current_user.id).exists():
                return "FORBIDDEN"
            if msg.saved_by.filter(id=current_user.id).exists():
                msg.saved_by.remove(current_user)
                return False  
            else:
                msg.saved_by.add(current_user)
                return True
        except ChatMessage.DoesNotExist:
            return None
        
    result = await handle_save()
    
    if result is None:
        raise HTTPException(status_code=404, detail="Message not found")
    if result == "FORBIDDEN":
        raise HTTPException(status_code=403, detail="You cannot save messages from rooms you aren't in")    

    return {
        "status": "success", 
        "is_saved": result 
    }

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, user_id: int):
    await manager.connect(websocket, room_id, user_id)
 
    @sync_to_async
    def get_user_with_context(u_id):
        try:
            return User.objects.select_related('profile', 'chat_settings').get(id=u_id)
        except User.DoesNotExist:
            return None
    
    current_user = await get_user_with_context(user_id)
    if not current_user:
        await websocket.close(code=1008)
        return
 
    @sync_to_async
    def save_ws_message(content, parent_id=None, msg_type='TEXT'):
        with transaction.atomic():
            try:
                room = ChatRoom.objects.select_related('last_message').get(id=room_id)
                
                parent_msg = None
                if parent_id:
                    parent_msg = ChatMessage.objects.filter(id=parent_id, room=room).first()
 
                msg = ChatMessage.objects.create(
                    room=room, 
                    sender=current_user, 
                    content=content,
                    parent=parent_msg,
                    message_type=msg_type
                )
 
                if msg_type == 'TEXT': 
                    process_mentions(msg)
 
                room.last_message = msg
                room.save(update_fields=['last_message'])
 
                if msg_type == 'TEXT':
                    recipients = room.participants.exclude(id=current_user.id)
                    notifications = []
                    for p in recipients:
                        p_settings, _ = UserChatSettings.objects.get_or_create(user=p)
                        if p_settings.chat_push_enabled:
                            notifications.append(
                                Notification(
                                    recipient=p,
                                    message=f"New message from {current_user.first_name or current_user.email}",
                                    notification_type="chat"
                                )
                            )
                    if notifications:
                        Notification.objects.bulk_create(notifications)
 
                parent_info = {
                    "id": parent_msg.id,
                    "content": parent_msg.content[:50],
                    "sender": parent_msg.sender.email
                } if parent_msg else None
 
                return msg, parent_info
            except Exception as e:
                print(f"WS Save Error: {e}")
                return None, None
 
    @sync_to_async
    def update_call_logic(c_id, m_type):
        try:
            call_qs = Call.objects.filter(id=c_id)
            if m_type == "CALL_ACCEPTED":
                call_qs.update(status="ONGOING")
                return "CALL_STARTED", "Call connected."
            elif m_type == "CALL_REJECTED":
                call_qs.update(status="MISSED", ended_at=timezone.now())
                return "CALL_DECLINED", None
            else: 
                call_qs.update(status="ENDED", ended_at=timezone.now())
                return "CALL_FINISHED", None
        except Exception:
            return "CALL_ERROR", None
 
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                continue 
 
            m_type = payload.get("type")
 
            if m_type == "typing":
                settings = getattr(current_user, 'chat_settings', None)
                if settings and settings.typing_indicators:
                    await manager.broadcast({
                        "type": "typing",
                        "user_id": user_id,
                        "room_id": room_id
                    }, room_id)
                continue 
 
            if m_type == "SCREEN_SHARE_STATUS":
                is_sharing = payload.get("is_sharing")
                status_text = "started sharing screen" if is_sharing else "stopped sharing screen"
                content = f"{current_user.first_name or current_user.email} {status_text}"
 
                msg_obj, _ = await save_ws_message(content, msg_type='SYSTEM')
                if msg_obj:
                    await manager.broadcast({
                        "type": "system_alert",
                        "content": content,
                        "is_sharing": is_sharing,
                        "sharer_id": user_id,
                        "timestamp": str(msg_obj.timestamp)
                    }, room_id)
                continue
 
            if m_type in ["CALL_ACCEPTED", "CALL_REJECTED", "CALL_ENDED"]:
                call_id = payload.get("call_id")
                event_name, alert_msg = await update_call_logic(call_id, m_type)
                
                await manager.broadcast({
                    "type": event_name,
                    "call_id": call_id,
                    "message": alert_msg
                }, room_id)
                continue
 
            content = payload.get("content")
            if content:
                parent_id = payload.get("parent_id")
                msg_obj, p_info = await save_ws_message(content, parent_id)
                
                if msg_obj:
                    await manager.broadcast({
                        "type": "new_message", 
                        "id": msg_obj.id,
                        "room_id": room_id,
                        "sender_email": current_user.email,
                        "sender_first_name": current_user.first_name,
                        "sender_last_name": current_user.last_name,
                        "content": content,
                        "timestamp": str(msg_obj.timestamp),
                        "parent_id": p_info["id"] if p_info else None,
                        "parent_content": p_info["content"] if p_info else None,
                        "parent_sender": p_info["sender"] if p_info else None,
                        "read_count": 0,
                        "is_starred": False,
                        "is_forwarded": False,
                        "reactions": []
                    }, room_id)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, room_id, user_id)
        
@router.post("/rooms/{room_id}/members")
async def add_members(
    room_id: int,
    data: ChatMemberUpdate,
    current_user = Depends(get_current_user)
):
    @sync_to_async
    def perform_add():
        try:
            with transaction.atomic():
                room = ChatRoom.objects.get(id=room_id)
                
                if not room.is_group:
                    return None, "Cannot add members to a private 1-on-1 chat"

                if not room.participants.filter(id=current_user.id).exists():
                    return None, "FORBIDDEN"

                users_to_add = list(User.objects.filter(email__in=data.user_emails))
                existing_emails = set(
                    room.participants.filter(email__in=data.user_emails).values_list("email", flat=True)
                )
                new_users = [u for u in users_to_add if u.email not in existing_emails]

                if not new_users:
                    return [], None

                room.participants.add(*new_users)

                names = ", ".join([u.first_name or u.email for u in new_users])
                ChatMessage.objects.create(
                    room=room,
                    sender=current_user,
                    content=f"{current_user.first_name or current_user.email} added {names} to the group",
                    message_type='SYSTEM'
                )

                formatted_users = [
                    {
                        "id": u.id,
                        "email": u.email,
                        "first_name": u.first_name,
                        "last_name": u.last_name
                    } for u in new_users
                ]
                return formatted_users, None

        except ChatRoom.DoesNotExist:
            return None, "NOT_FOUND"
        except Exception as e:
            return None, str(e)

    added_users, error = await perform_add()
    
    if error:
        status = 404 if error == "NOT_FOUND" else 403 if error == "FORBIDDEN" else 400
        raise HTTPException(status_code=status, detail=error)

    if added_users:
        await manager.broadcast({
            "type": "MEMBER_ADDED",
            "room_id": room_id,
            "new_members": added_users
        }, room_id)

        for user in added_users:
            await manager.broadcast_to_user(user['id'], {
                "type": "ROOM_ADDED",
                "room_id": room_id
            })
    
    return {"message": "Members added successfully", "added": [u['email'] for u in added_users]}

@router.post("/rooms/{room_id}/leave")
async def leave_room(
    room_id: int,
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def perform_leave():
        try:
            with transaction.atomic():
                room = ChatRoom.objects.get(id=room_id)
               
                if not room.participants.filter(id=current_user.id).exists():
                    return False, "You are not a member of this room"
 
                room.participants.remove(current_user)
 
                remaining_count = room.participants.count()
                
                if remaining_count > 0:
                    leave_msg = ChatMessage.objects.create(
                        room=room,
                        sender=current_user,
                        content=f"{current_user.first_name or current_user.email} has left the group",
                        message_type='SYSTEM'
                    )
            
                    room.last_message = leave_msg
                    room.save(update_fields=['last_message'])
                else:
                    pass
 
                return True, None
 
        except ChatRoom.DoesNotExist:
            return False, "Room not found"
 
    success, error = await perform_leave()
    
    if not success:
        status = 404 if "not found" in error else 400
        raise HTTPException(status_code=status, detail=error)
 
    await manager.broadcast({
        "type": "MEMBER_LEFT",
        "room_id": room_id,
        "user_id": current_user.id,
        "user_email": current_user.email
    }, room_id)
    
    return {"message": "You have left the room successfully"}
 
@router.patch("/rooms/{room_id}/rename", response_model=RenameGroupResponse)
async def rename_group(
    room_id: int,
    data: RenameGroupRequest,
    current_user=Depends(get_current_user)
):
    @sync_to_async
    def perform_rename():
        try:
            room = ChatRoom.objects.get(id=room_id, is_group=True)
        except ChatRoom.DoesNotExist:
            return None, "Group not found"

        if not room.participants.filter(id=current_user.id).exists():
            return None, "Not authorized"

        room.name = data.new_name.strip()
        room.save(update_fields=["name"])

        return {
            "status": "success",
            "message": "Group renamed successfully",
            "group_id": room.id,
            "new_name": room.name
        }, None

    response_data, error = await perform_rename()

    if error == "Group not found":
        raise HTTPException(status_code=404, detail=error)

    if error == "Not authorized":
        raise HTTPException(status_code=403, detail=error)

    return response_data

def process_mentions(message_obj):

    if not message_obj.content:
        return

    potential_emails = re.findall(r'@([\w\.-]+@[\w\.-]+)', message_obj.content)

    if not potential_emails:
        return

    users_to_mention = list(User.objects.filter(email__in=potential_emails))

    if users_to_mention:
        message_obj.mentions.add(*users_to_mention)

@router.get("/mentions", response_model=List[MessageRead])
async def get_my_mentions(current_user = Depends(get_current_user)):
    
    @sync_to_async
    def fetch_optimized_mentions():
        msgs = current_user.mentioned_in_messages.filter(
            is_deleted=False
        ).select_related(
            "sender", "room"  
        ).prefetch_related(
            "starred_by"
        ).annotate(
            reads=Count('read_by', distinct=True)
        ).order_by("-timestamp")
        
        results = []
        for m in msgs:
            url = None
            if m.attachment:
                try:
                    url = m.attachment.url
                except (ValueError, AttributeError):
                    pass
 
            is_starred = m.starred_by.filter(id=current_user.id).exists()

            results.append({
                "id": m.id,
                "room_id": m.room.id,
                "sender_email": m.sender.email,
                "sender_first_name": m.sender.first_name,
                "sender_last_name": m.sender.last_name,
                "content": m.content,
                "attachment_url": url,
                "timestamp": str(m.timestamp),
                "read_count": m.reads, 
                "is_starred": is_starred,
                "is_forwarded": getattr(m, 'is_forwarded', False),
                "message_link": f"/chat/rooms/{m.room.id}?message_id={m.id}",
                "reactions": [] 
            })
            
        return results

    return await fetch_optimized_mentions()

@router.websocket("/ws/status/{user_id}")
async def status_websocket(
    websocket: WebSocket, 
    user_id: int, 
    current_user = Depends(get_current_user_ws)
):
    if current_user.id != user_id:
        print(f" SECURITY ALERT: {current_user.email} attempted to spoof status for ID {user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, room_id=0, user_id=user_id)
    print(f" PRESENCE: {current_user.email} is now online.")
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:

        await manager.disconnect(websocket, room_id=0, user_id=user_id)
        print(f" PRESENCE: {current_user.email} has disconnected.")
       
    except Exception as e:
        print(f" WS ERROR: {str(e)}")
        await manager.disconnect(websocket, room_id=0, user_id=user_id)   
                   
@router.get("/users/{target_id}/status", response_model=UserStatusResponse)
async def get_user_status(
    target_id: int,
    current_user: User = Depends(get_current_user)
):
    try:
        user = await sync_to_async(User.objects.select_related('profile').get)(id=target_id)
        is_online_live = target_id in manager.user_connection_counts
        last_seen_time = None
 
        if hasattr(user, 'profile') and user.profile is not None:
            last_seen_time = user.profile.last_seen
 
        return {
            "user_id": user.id,
            "is_online": is_online_live,
            "last_seen": last_seen_time
        }
 
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
             
@router.get("/offline", response_model=List[OfflineUser])
async def get_offline_users(
    limit: int = Query(20, description="Max number of offline users to return", le=100),
    current_user = Depends(get_current_user)
):
    active_user_ids = list(manager.user_connection_counts.keys())
    
    @sync_to_async
    def fetch_offline_users_from_db():
        users = User.objects.select_related('profile').exclude(
            id=current_user.id
        ).exclude(
            id__in=active_user_ids 
        ).order_by('-profile__last_seen')[:limit]
        
        result = []
        for u in users:
            full_name = f"{u.first_name} {u.last_name}".strip() or u.email.split('@')[0]
                
            profile_img = None
            last_seen_time = None
            
            if hasattr(u, 'profile') and u.profile:
                last_seen_time = u.profile.last_seen
                try:
                    if u.profile.avatar: 
                        profile_img = u.profile.avatar.url
                except (ObjectDoesNotExist, ValueError):
                    pass
                    
            result.append({
                "id": u.id,
                "name": full_name,
                "email": u.email,
                "profile_image": profile_img,
                "last_seen": last_seen_time,
                "is_online": False,
                "status": "offline"
            })
            
        return result

    return await fetch_offline_users_from_db()            

@router.get("/rooms/{room_id}/details", response_model=ChatRoomDetailsResponse)
async def get_room_details(
    room_id: int, 
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def fetch_details():
        try:
            room = ChatRoom.objects.prefetch_related(
                Prefetch("participants", queryset=User.objects.select_related("profile"))
            ).get(id=room_id)
            
            if not room.participants.filter(id=current_user.id).exists():
                return None, "Not a participant"

            participants_list = []
            for p in room.participants.all():
                avatar_url = None
                if hasattr(p, 'profile') and p.profile.avatar:
                    try:
                        avatar_url = p.profile.avatar.url
                    except (ValueError, AttributeError):
                        pass
                
                participants_list.append({
                    "id": p.id,
                    "name": f"{p.first_name} {p.last_name}".strip() or p.email,
                    "email": p.email,
                    "profile_image": avatar_url
                })

            files_qs = ChatMessage.objects.filter(
                room=room, 
                is_deleted=False,
                message_type__in=['FILE', 'IMAGE']
            ).exclude(attachment='').order_by("-timestamp")[:10]

            recent_files = []
            for f in files_qs:
                if f.attachment:
                    try:
                        recent_files.append({
                            "id": f.id,
                            "file_name": f.attachment.name.split('/')[-1], 
                            "file_url": f.attachment.url,
                            "timestamp": f.timestamp
                        })
                    except (ValueError, AttributeError):
                        continue

            return {
                "room_id": room.id,
                "room_name": room.name or "Private Chat",
                "is_group": room.is_group,
                "participants": participants_list,
                "recent_files": recent_files
            }, None

        except ChatRoom.DoesNotExist:
            return None, "Room not found"

    result, error = await fetch_details()
    
    if error:
        status = 404 if error == "Room not found" else 403
        raise HTTPException(status_code=status, detail=error)
    
    return result

@router.get("/settings", response_model=ChatSettingsUpdate)
async def get_chat_settings(current_user=Depends(get_current_user)):
    
    settings, created = await sync_to_async(UserChatSettings.objects.get_or_create)(
        user=current_user
    )
    return settings

@router.patch("/settings")
async def update_chat_settings(
    payload: ChatSettingsUpdate, 
    current_user=Depends(get_current_user)
):
    
    try:
        settings = await sync_to_async(UserChatSettings.objects.get)(user=current_user)
        
        update_data = payload.model_dump() 
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        await sync_to_async(settings.save)()
        return {"message": "Chat settings updated successfully", "status": "success"}
        
    except UserChatSettings.DoesNotExist:
        raise HTTPException(status_code=404, detail="Settings profile not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
  

@router.post("/chat/unmute")
def unmute_chat(chat_id: int, current_user=Depends(get_current_user)):
    ChatMute.objects.filter(
        user=current_user,
        chat_id=chat_id
    ).update(is_muted=False, muted_until=None)

    return {"message": "Chat unmuted"}
