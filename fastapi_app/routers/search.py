from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from django.db.models import Q
from fastapi_app.routers.auth import get_current_user
from django_backend.models import User, EmailState, ChatMessage, DriveFile, Event, Meeting

router = APIRouter()

@router.get("/")
def global_search(
    q: str = Query(..., min_length=1, description="The search query text"),
    module: Optional[str] = Query("all", description="Module to search: 'mail', 'drive', 'chats', etc."),
    current_user: User = Depends(get_current_user)
):
    results = {
        "query": q,
        "module": module,
        "data": {}
    }

    module_lower = module.lower()

    if module_lower in ["mail", "all"]:
        
        mail_qs = EmailState.objects.select_related('email', 'email__sender').filter(
            user=current_user,
            is_deleted=False
        ).filter(
            Q(email__subject__icontains=q) | 
            Q(email__body__icontains=q) | 
            Q(email__sender__email__icontains=q)
        ).order_by("-email__created_at")[:10]  

        formatted_mail = [
            {
                "id": state.email.id,
                "type": "mail",
                "subject": state.email.subject,
                "snippet": state.email.body[:50] + "..." if len(state.email.body) > 50 else state.email.body,
                "sender": state.email.sender.email,
                "date": state.email.created_at,
                "is_read": state.is_read
            }
            for state in mail_qs
        ]
        results["data"]["mail"] = formatted_mail
    
    if module_lower in ["drive", "all"]:
        drive_qs = DriveFile.objects.select_related('owner').filter(
            Q(owner=current_user) | Q(shared_with=current_user),
            is_trashed=False
        ).filter(
            Q(original_name__icontains=q) | 
            Q(content_type__icontains=q)  
        ).distinct().order_by("-uploaded_at")[:10]

        formatted_drive = [
            {
                "id": f.id,
                "type": "drive",
                "filename": f.original_name,
                "snippet": f"Type: {f.content_type.split('/')[-1].upper()} • Size: {round(f.size / 1024, 1)} KB",
                "owner": f.owner.email,
                "date": f.uploaded_at,
            }
            for f in drive_qs
        ]
        results["data"]["drive"] = formatted_drive

    if module_lower in ["chats", "all"]:
        chat_qs = ChatMessage.objects.select_related('room', 'sender').filter(
            room__participants=current_user,
            is_deleted=False,
            message_type='TEXT' 
        ).filter(
            Q(content__icontains=q) | 
            Q(room__name__icontains=q) | 
            Q(sender__email__icontains=q)
        ).distinct().order_by("-timestamp")[:10]

        formatted_chats = [
            {
                "id": msg.id,
                "type": "chat",
                "room_name": msg.room.name if msg.room.name else "Direct Message",
                "snippet": msg.content[:50] + "..." if msg.content and len(msg.content) > 50 else msg.content,
                "sender": msg.sender.email,
                "date": msg.timestamp,
            }
            for msg in chat_qs
        ]
        results["data"]["chats"] = formatted_chats
        
    if module_lower in ["calendar", "all"]:
        calendar_qs = Event.objects.select_related('created_by').filter(
            Q(created_by=current_user) | 
            Q(participants=current_user) | 
            Q(attendees__user=current_user)
        ).filter(
            Q(title__icontains=q) | 
            Q(description__icontains=q) | 
            Q(location__icontains=q)
        ).distinct().order_by("-start_datetime")[:10]

        formatted_events = [
            {
                "id": event.id,
                "type": "calendar",
                "title": event.title,
                "snippet": f"Starts: {event.start_datetime.strftime('%b %d, %Y %H:%M')} • Loc: {event.location or 'TBD'}",
                "owner": event.created_by.email,
                "date": event.start_datetime,
            }
            for event in calendar_qs
        ]
        results["data"]["calendar"] = formatted_events
        
    if module_lower in ["meetings", "all"]:
    
        meeting_qs = Meeting.objects.select_related('host').filter(
            Q(host=current_user) | 
            Q(chat_room__participants=current_user)
        ).filter(
            Q(title__icontains=q) | 
            Q(meeting_code__icontains=q)
        ).distinct().order_by("-created_at")[:10]

        formatted_meetings = [
            {
                "id": m.id,
                "type": "meeting",
                "title": m.title,
                "snippet": f"Code: {m.meeting_code} • Type: {m.call_type.title()} Call",
                "owner": m.host.email,
                "date": m.created_at,
            }
            for m in meeting_qs
        ]
        results["data"]["meetings"] = formatted_meetings  
        
    return results      