from __future__ import annotations
from typing import TYPE_CHECKING, List, Optional, Any, Dict, Tuple
from datetime import datetime, date, timedelta
import secrets
from collections import defaultdict
from django.conf import settings
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from asgiref.sync import sync_to_async
from django.db import transaction
from django.db.models import Q, Prefetch
from django.contrib.auth import get_user_model
from fastapi_app.routers.auth import get_current_user
from enum import Enum
User = get_user_model()
from django_backend.models import Event, EventAttendee, EventReminder, Meeting, ChatRoom 
from fastapi_app.tasks import process_event_invites
from fastapi_app.schemas.calendar_schemas import EventCreate, EventRead, EventUpdate, AvailabilityRequest,AvailabilityResponse, AttendeeInput, UserSearchResponse, EventParticipant
from django.utils import timezone

if TYPE_CHECKING:
    from fastapi_app.schemas.calendar_schemas import CalendarCreate

User = get_user_model()
router = APIRouter( tags=["Calendar"])

def _serialize_event(event: Event) -> Dict[str, Any]:
    participants_out: List[Dict[str, Any]] = []
   
    prefetched = getattr(event, "prefetched_event_attendees", None)
    rows = prefetched if prefetched is not None else event.attendees.all()
 
    for row in rows:
        u = row.user
       
        full_name = f"{u.first_name} {u.last_name}".strip() or u.email.split('@')[0]  
       
        profile_img = None
        if hasattr(u, 'profile') and u.profile and u.profile.avatar:
            try:
                profile_img = u.profile.avatar.url
            except (ValueError, AttributeError):
                profile_img = None
             
        participants_out.append({
            "id": u.id,  
            "name": full_name,  
            "email": u.email,
            "profile_image": profile_img,
            "role": row.role,
            "status": row.status,
            "attendance_type": getattr(row, 'attendance_type', 'required'),
        })
     
    meeting_data = None
    chat_id = None
    if hasattr(event, 'meeting') and event.meeting:
        meeting_data = {
            "id": event.meeting.id,
            "title": event.meeting.title,
            "meeting_code": event.meeting.meeting_code,
            "call_type": event.meeting.call_type,
        }
        if event.meeting.chat_room_id:
            chat_id = event.meeting.chat_room_id  
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description or "",
        "start_datetime": event.start_datetime,
        "end_datetime": event.end_datetime,
       
        "is_all_day": getattr(event, "is_all_day", False),
        "timezone": getattr(event, "timezone", "UTC"),
       
        "location": event.location or "",
        "url": getattr(event, "url", ""),
        "color": getattr(event, "color", "blue"),
        "repeat_rule": getattr(event, "repeat_rule", ""),
        "category_name": getattr(event, "category_name", None),
        "created_by_id": event.created_by_id,
       
        "can_modify_event": getattr(event, "can_modify_event", False),
        "can_invite_others": getattr(event, "can_invite_others", False),
        "can_see_guest_list": getattr(event, "can_see_guest_list", False),
       
        "participants": participants_out,
        "meeting": meeting_data,        
        "chat_room_id": chat_id,
    }

@router.get("/events/day", response_model=List[EventRead])
async def list_events_for_day(
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user)
):
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        
        target_date = timezone.now().date()    
 
    def _sync():
        final_qs = Event.objects.filter(
            Q(created_by=current_user) | Q(attendees__user=current_user),
            start_datetime__date=target_date
        ).select_related("created_by", "meeting") \
         .prefetch_related(_prefetch_attendees()) \
         .distinct() \
         .order_by("start_datetime")
 
        return [_serialize_event(e) for e in final_qs]
 
    return await sync_to_async(_sync)()

@router.get("/events/week", response_model=List[EventRead])
async def list_events_for_week(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
):
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        from django.utils import timezone
        sd = timezone.now().date()
 
    week_start = _start_of_week(sd)
    week_end = _end_of_week(sd)
 
    start_dt = datetime.combine(week_start, datetime.min.time())
    end_dt = datetime.combine(week_end, datetime.max.time())
 
    def _sync():
        qs = Event.objects.filter(
            Q(created_by=current_user) | Q(attendees__user=current_user),
            start_datetime__lte=end_dt, 
            end_datetime__gte=start_dt
        ).select_related("created_by", "meeting") \
         .prefetch_related(_prefetch_attendees()) \
         .distinct() \
         .order_by("start_datetime")
        
        return [_serialize_event(e) for e in qs]
 
    return await sync_to_async(_sync)()

@router.get("/events/month", response_model=List[EventRead])
async def list_events_for_month(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
):
    today = timezone.now().date()
    year = year or today.year
    month = month or today.month
 
    try:
        month_start = date(year, month, 1)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid year/month")
 
    if month == 12:
        next_month_start = date(year + 1, 1, 1)
    else:
        next_month_start = date(year, month + 1, 1)
 
    start_dt = datetime.combine(month_start, datetime.min.time())
    end_dt = datetime.combine(next_month_start - timedelta(days=1), datetime.max.time())
 
    def _sync():
        qs = Event.objects.filter(            
            Q(created_by=current_user) | Q(attendees__user=current_user),            
            start_datetime__lte=end_dt,            
            end_datetime__gte=start_dt        
        ).distinct()
 
        qs = (
            qs.select_related("created_by", "meeting")
            .prefetch_related(_prefetch_attendees())
            .order_by("start_datetime")
        )
        
        return [_serialize_event(e) for e in qs]
 
    return await sync_to_async(_sync)()


@router.post("/events/check-availability")
async def check_availability(payload: AvailabilityRequest):

    @sync_to_async
    def get_busy_blocks():
        events = Event.objects.filter(
            Q(created_by_id__in=payload.user_ids) | 
            Q(attendees__user_id__in=payload.user_ids, attendees__status__in=["accepted", "pending", "maybe"]),
            start_datetime__date=payload.date
        ).prefetch_related('attendees').distinct()

        result = {str(uid): [] for uid in payload.user_ids}
        user_event_tracker = {str(uid): set() for uid in payload.user_ids}

        for event in events:
            time_block = {
                "start": event.start_datetime.strftime("%H:%M"),
                "end": event.end_datetime.strftime("%H:%M"),
                "title": event.title  
            }
            
            event_id = event.id
            
            def add_block(uid_str):
                if uid_str in result and event_id not in user_event_tracker[uid_str]:
                    result[uid_str].append(time_block)
                    user_event_tracker[uid_str].add(event_id)
 
            add_block(str(event.created_by_id))
 
            for attendee in event.attendees.all():
                if attendee.status in ["accepted", "pending", "maybe"]:
                    add_block(str(attendee.user_id))
                        
        return result                
 
    return await get_busy_blocks()

def _start_of_week(d: date) -> date:
    return d - timedelta(days=d.weekday())


def _end_of_week(d: date) -> date:
    return _start_of_week(d) + timedelta(days=6)


def _full_name(user) -> str:
    first = (getattr(user, "first_name", "") or "").strip()
    last = (getattr(user, "last_name", "") or "").strip()
    name = f"{first} {last}".strip()
    if name:
        return name

    email = (getattr(user, "email", "") or "").strip()
    if "@" in email:
        return email.split("@", 1)[0]
  
    return email or "Unknown User"


def _user_profile_picture(user) -> Optional[str]:
    prof = getattr(user, "profile", None)
    if prof:
        for field in ("profile_picture", "avatar", "image"):
            pic = getattr(prof, field, None)
            if pic:
                try:
                    return pic.url
                except Exception:
                    return str(pic)

    for k in ("profile_picture", "avatar", "image", "photo"):
        v = getattr(user, k, None)
        if v:
            try:
                return v.url
            except Exception:
                return str(v)
    return None

def _prefetch_attendees():
    
    ea_qs = EventAttendee.objects.select_related("user", "user__profile")
    return Prefetch(
        "attendees",
        queryset=ea_qs,
        to_attr="prefetched_event_attendees",
    )

async def _get_event_or_404(event_id: int) -> Event:
    ev = await sync_to_async(
        Event.objects.filter(id=event_id)
        .select_related("created_by")
        .prefetch_related(_prefetch_attendees())
        .first
    )()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev

def _normalize_attendees(payload_attendees: Any) -> List[Tuple[int, str, Dict[str, Any]]]:
    out: List[Tuple[int, str, Dict[str, Any]]] = []
    
    if not payload_attendees:
        return out
 
    for a in payload_attendees:
        
        if isinstance(a, int):
            out.append((a, "required", {}))
            continue
 
        is_dict = isinstance(a, dict)
        
        uid = None
        for key in ["user", "user_id", "id"]:
            uid = a.get(key) if is_dict else getattr(a, key, None)
            if uid is not None:
                break
        
        if uid is None:
            continue
 
        atype = a.get("attendance_type") if is_dict else getattr(a, "attendance_type", None)
        if atype not in ["required", "optional"]:
            atype = "required"
 
        perms = a.get("permissions") if is_dict else getattr(a, "permissions", None)
        if not isinstance(perms, dict):
            perms = {}
 
        out.append((int(uid), str(atype), perms))
 
    return out
 
@router.get("/events", response_model=List[EventRead])
async def list_events(
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
):
    def _sync():
        qs = Event.objects.filter(
            Q(created_by=current_user) |
            Q(attendees__user=current_user)
        ).select_related("created_by", "meeting").prefetch_related(_prefetch_attendees())

        if start and end:
            if end <= start:
                raise HTTPException(status_code=400, detail="end must be greater than start")

            qs = qs.filter(
                start_datetime__lt=end,
                end_datetime__gt=start
            )

        qs = qs.distinct().order_by("start_datetime")

        return [_serialize_event(e) for e in qs]

    return await sync_to_async(_sync)()

@router.get("/search", response_model=List[UserSearchResponse])
async def search_users_for_calendar(
    q: str = Query(..., min_length=1, description="Search by name or email"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    
    @sync_to_async
    def perform_search():
        users = User.objects.select_related('profile').filter(
            Q(first_name__icontains=q) | 
            Q(last_name__icontains=q) | 
            Q(email__icontains=q),
            is_active=True
        ).exclude(id=current_user.id)[:limit]

        results = []
        for u in users:
            results.append({
                "id": u.id,
                "name": _full_name(u),
                "email": u.email, 
                "profile_image": _user_profile_picture(u)
            }) 
        return results

    return await perform_search()

@router.post("/events", response_model=EventRead, status_code=201)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    create_meeting_link: bool = Query(False),
):
    overlapping_event = await sync_to_async(
        lambda: Event.objects.filter(
            created_by=current_user,
            start_datetime__lt=payload.end_datetime,
            end_datetime__gt=payload.start_datetime
        ).exists()
    )()

    if overlapping_event:
        raise HTTPException(
            status_code=400,
            detail="You have another event that overlaps with this time range"
        )

    @sync_to_async
    @transaction.atomic
    def _do_sync_create():

        event = Event.objects.create(
            title=payload.title,
            description=payload.description or "",
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            is_all_day=getattr(payload, "is_all_day", False),
            location=payload.location or "",
            url=payload.url,
            created_by=current_user,
            color=payload.color or "blue",
            repeat_rule=getattr(payload, "repeat_rule", ""),
            timezone=payload.timezone or "UTC",
            can_modify_event=getattr(payload, "can_modify_event", False),
            can_invite_others=getattr(payload, "can_invite_others", False),
            can_see_guest_list=getattr(payload, "can_see_guest_list", False),
            category_name=getattr(payload, "category_name", None),
        )

        EventAttendee.objects.create(
            event=event,
            user=current_user,
            status="accepted",
            attendance_type="required",
            role="owner",
            permissions={}
        )
        event.participants.add(current_user)

        chat_participants = [current_user]

        required_attendees = getattr(payload, "required_attendees", [])

        for uid in required_attendees:

            if uid == current_user.id:
                continue

            user_obj = User.objects.filter(id=uid).first()

            if not user_obj:
                continue

            already_exists = EventAttendee.objects.filter(
                event=event,
                user=user_obj
            ).exists()

            if already_exists:
                continue

            EventAttendee.objects.create(
                event=event,
                user=user_obj,
                status="pending",
                attendance_type="required",
                role="guest",
                permissions={}
            )
            event.participants.add(user_obj)

            chat_participants.append(user_obj)

        optional_attendees = getattr(payload, "optional_attendees", [])

        for uid in optional_attendees:

            if uid == current_user.id:
                continue

            user_obj = User.objects.filter(id=uid).first()

            if not user_obj:
                continue

            already_exists = EventAttendee.objects.filter(
                event=event,
                user=user_obj
            ).exists()

            if already_exists:
                continue

            EventAttendee.objects.create(
                event=event,
                user=user_obj,
                status="pending",
                attendance_type="optional",
                role="guest",
                permissions={}
            )
            event.participants.add(user_obj)

            chat_participants.append(user_obj)

        if create_meeting_link:

            chat_room = ChatRoom.objects.create(
                name=f"Chat: {payload.title}",
                is_group=True
            )

            chat_room.participants.add(*chat_participants)

            meeting_code = secrets.token_urlsafe(8)

            meeting = Meeting.objects.create(
                host=current_user,
                title=payload.title,
                meeting_code=meeting_code,
                call_type="video",
                chat_room=chat_room
            )

            event.meeting = meeting
            event.url = f"https://meet.jit.si/Stackly-Meeting-{meeting_code}"

            event.save(update_fields=["meeting", "url"])

        return (
            Event.objects.filter(id=event.id)
            .select_related("created_by")
            .prefetch_related(_prefetch_attendees())
            .first()
        )

    created_event = await _do_sync_create()

    try:
        process_event_invites.delay(created_event.id, current_user.id)
    except Exception as e:
        print(f"Celery Task Error: {e}")

    return _serialize_event(created_event)

@router.get("/events/{event_id}/attendees", response_model=List[EventParticipant])
async def get_event_attendees(event_id: int, current_user: User = Depends(get_current_user)):
    event = await _get_event_or_404(event_id)

    @sync_to_async
    def _extract_participants():

        prefetched = getattr(event, "prefetched_event_attendees", None)
        rows = prefetched if prefetched is not None else event.attendees.all()

        participants = []
        for row in rows:
            u = row.user
            participants.append({
                "id": u.id,
                "name": _full_name(u),
                "email": u.email,
                "profile_image": _user_profile_picture(u),
                "role": row.role,
                "status": row.status,
                "attendance_type": getattr(row, 'attendance_type', 'required'),
            })
        return participants
    return await _extract_participants()
 
@router.post("/events/meeting", response_model=EventRead, status_code=201, name="calendar_create_meeting")
async def create_meeting(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
):
   
    @sync_to_async
    @transaction.atomic
    def _do_database_work():
        event = Event.objects.create(
            title=payload.title,
            description=payload.description or "",
            start_datetime=payload.start_datetime,
            end_datetime=payload.end_datetime,
            created_by=current_user,
            color=getattr(payload, "color", "blue"),
            timezone=getattr(payload, "timezone", "UTC"),
        )
 
        EventAttendee.objects.update_or_create(
            event=event,
            user=current_user,
            defaults={
                "status": "accepted",
                "attendance_type": "required",
                "role": "owner",
                "permissions": {},
            },
        )
 
        chat_participants = [current_user]
 
        attendees_data = getattr(payload, "attendees", None)
        for uid, atype, perms in _normalize_attendees(attendees_data):
            if uid == current_user.id:
                continue
 
            u = User.objects.filter(id=uid).first()
            if not u:
                continue
 
            EventAttendee.objects.update_or_create(
                event=event,
                user=u,
                defaults={
                    "status": "pending",
                    "attendance_type": atype if atype in ["required", "optional"] else "optional",
                    "role": "guest",
                    "permissions": perms or {},
                },
            )
            chat_participants.append(u)
 
        chat_room = ChatRoom.objects.create(
            name=f"Chat: {payload.title}",
            is_group=True
        )
        chat_room.participants.add(*chat_participants)
 
        meeting_code = secrets.token_urlsafe(8)
        meeting = Meeting.objects.create(
            host=current_user,
            title=payload.title,
            meeting_code=meeting_code,
            call_type="video",
            chat_room=chat_room
        )
        meeting.participants.set(chat_participants)
 
        event.meeting = meeting
        event.url = f"https://meet.jit.si/Stackly-Meeting-{meeting_code}"
        event.save()
 
        reminders = getattr(payload, "reminders", None)
        if reminders:
            for mins in reminders:
                EventReminder.objects.get_or_create(
                    event=event,
                    minutes_before=int(mins),
                )
 
        final_event = Event.objects.filter(id=event.id)\
            .select_related("created_by", "meeting", "meeting__chat_room")\
            .prefetch_related(_prefetch_attendees())\
            .first()
 
        return _serialize_event(final_event)
 
    serialized_event = await _do_database_work()
 
    try:
        process_event_invites.delay(serialized_event["id"], current_user.id)
    except Exception as e:
        print(f"Invite Task Error: {e}")
 
    return serialized_event

@router.patch("/events/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(get_current_user)
):

    event = await sync_to_async(
        lambda: Event.objects.filter(id=event_id).first()
    )()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if event.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the creator can edit this event"
        )

    @sync_to_async
    @transaction.atomic
    def _do_update():

        fields = (
            "title",
            "description",
            "start_datetime",
            "end_datetime",
            "is_all_day",
            "location",
            "url",
            "color",
            "repeat_rule",
            "timezone",
            "can_modify_event",
            "can_invite_others",
            "can_see_guest_list",
            "category_name",
        )

        for field in fields:

            if hasattr(payload, field):

                value = getattr(payload, field)

                if value is not None:
                    setattr(event, field, value)

        if event.end_datetime <= event.start_datetime:
            raise ValueError(
                "end_datetime must be after start_datetime"
            )

        event.save()

        required_attendees = getattr(
            payload,
            "required_attendees",
            None
        )

        optional_attendees = getattr(
            payload,
            "optional_attendees",
            None
        )

        if (
            required_attendees is not None
            or optional_attendees is not None
        ):

            EventAttendee.objects.filter(
                event=event
            ).exclude(
                role="owner"
            ).delete()

            event.participants.clear()

            owner_attendee = EventAttendee.objects.filter(
                event=event,
                role="owner"
            ).first()

            if owner_attendee:
                event.participants.add(owner_attendee.user)

            if required_attendees:

                for uid in required_attendees:

                    if uid == current_user.id:
                        continue

                    user_obj = User.objects.filter(
                        id=uid
                    ).first()

                    if not user_obj:
                        continue

                    EventAttendee.objects.create(
                        event=event,
                        user=user_obj,
                        status="pending",
                        attendance_type="required",
                        role="guest",
                        permissions={}
                    )

                    event.participants.add(user_obj)

            if optional_attendees:

                for uid in optional_attendees:

                    if uid == current_user.id:
                        continue

                    user_obj = User.objects.filter(
                        id=uid
                    ).first()

                    if not user_obj:
                        continue

                    EventAttendee.objects.create(
                        event=event,
                        user=user_obj,
                        status="pending",
                        attendance_type="optional",
                        role="guest",
                        permissions={}
                    )

                    event.participants.add(user_obj)

        return (
            Event.objects.filter(id=event.id)
            .select_related("created_by", "meeting")
            .prefetch_related(_prefetch_attendees())
            .first()
        )

    try:

        updated_event = await _do_update()

        return _serialize_event(updated_event)

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
@router.delete("/events/{event_id:int}", status_code=204)

async def delete_event(

    event_id: int, 

    current_user: User = Depends(get_current_user)

):


    event = await sync_to_async(

        Event.objects.filter(id=event_id).select_related("meeting").first

    )()

    if not event:

        raise HTTPException(status_code=404, detail="Event not found")


    if event.created_by_id != current_user.id:

        raise HTTPException(status_code=403, detail="Only the creator can delete the event")
 
    @sync_to_async

    @transaction.atomic

    def _do_delete():


        if hasattr(event, 'meeting') and event.meeting:

            meeting = event.meeting

            if meeting.chat_room:

                meeting.chat_room.delete()

            meeting.delete()


        event.delete()
 
    await _do_delete()

    return None
 

@router.post("/events/{event_id:int}/attendee", response_model=EventRead, status_code=201)
async def add_or_update_attendee(
    event_id: int,
    attendee: AttendeeInput = Body(...),
    current_user: User = Depends(get_current_user),
):
    event = await _get_event_or_404(event_id)
 
    if event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can add attendees")
 
    uid = attendee.user_id
    atype = getattr(attendee, "attendance_type", "required")
    perms = getattr(attendee, "permissions", {})
 
    @sync_to_async
    @transaction.atomic
    def _do_sync_work():
        u = User.objects.filter(id=int(uid)).first()
        if not u:
            raise ValueError("User not found")
 
        EventAttendee.objects.update_or_create(
            event=event,
            user=u,
            defaults={
                "status": "pending", 
                "attendance_type": str(atype),
                "permissions": perms if isinstance(perms, dict) else {},
                "role": "guest"
            },
        )
 
        if hasattr(event, 'meeting') and event.meeting:
            meeting = event.meeting
            meeting.participants.add(u)
            
            if meeting.chat_room:
                meeting.chat_room.participants.add(u)
 
        return Event.objects.filter(id=event.id)\
            .select_related("created_by", "meeting")\
            .prefetch_related(_prefetch_attendees())\
            .first()
 
    try:
        fresh_event = await _do_sync_work()
        
        try:
            process_event_invites.delay(fresh_event.id, current_user.id)
        except Exception:
            pass
 
        return _serialize_event(fresh_event)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/events/{event_id}/respond", response_model=EventRead)
async def respond_event(
    event_id: int,
    status: str = Query(..., description="accepted|declined|maybe"),
    current_user: User = Depends(get_current_user)
):

    allowed_statuses = {"accepted", "declined", "maybe"}

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    @sync_to_async
    @transaction.atomic
    def _do_respond():

        attendee_record = EventAttendee.objects.filter(
            event_id=event_id,
            user=current_user
        ).select_related("event").first()

        if not attendee_record:

            event_exists = Event.objects.filter(
                id=event_id
            ).exists()

            if not event_exists:
                return "NOT_FOUND"

            return "FORBIDDEN"

        attendee_record.status = status

        attendee_record.save(update_fields=["status"])

        return (
            Event.objects.filter(id=event_id)
            .select_related("created_by", "meeting")
            .prefetch_related(_prefetch_attendees())
            .first()
        )

    result = await _do_respond()

    if result == "NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if result == "FORBIDDEN":
        raise HTTPException(
            status_code=403,
            detail="You are not invited to this event"
        )

    return _serialize_event(result)
   
@router.get("/events/{event_id}", response_model=EventRead)
async def get_event(
    event_id: int, 
    current_user: User = Depends(get_current_user)

):
    event = await _get_event_or_404(event_id)
 
    @sync_to_async
    def _verify_and_serialize():
        is_creator = event.created_by_id == current_user.id

        prefetched = getattr(event, "prefetched_event_attendees", None)
        if prefetched is not None:
            is_attendee = any(row.user_id == current_user.id for row in prefetched)
        else:
            is_attendee = EventAttendee.objects.filter(event=event, user=current_user).exists()

        if not (is_creator or is_attendee):
            raise HTTPException(
                status_code=403, 
                detail="Not authorized to view this event"
            )

        return _serialize_event(event)
    
    return await _verify_and_serialize()
 
  





@router.post("/events/{event_id}/attendees", response_model=EventRead, status_code=201)
async def add_attendees(
    event_id: int,
    user_ids: List[int],
    current_user: User = Depends(get_current_user)
):
    event = await _get_event_or_404(event_id)
 
    if event.created_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the creator can add attendees"
        )
 
    @sync_to_async
    @transaction.atomic
    def _do_sync_work():
        valid_uids = [uid for uid in user_ids if uid != current_user.id]
        users = list(User.objects.filter(id__in=valid_uids))
        
        if not users:
            return event
 
        new_guests = []
        for u in users:
            EventAttendee.objects.update_or_create(
                event=event,
                user=u,
                defaults={
                    "status": "pending",
                    "role": "guest",
                    "attendance_type": "required"
                },
            )
            new_guests.append(u)
 
        if hasattr(event, 'meeting') and event.meeting:
            meeting = event.meeting
            meeting.participants.add(*new_guests)
            
            if meeting.chat_room:
                meeting.chat_room.participants.add(*new_guests)
 
        return Event.objects.filter(id=event.id) \
            .select_related("created_by", "meeting") \
            .prefetch_related(_prefetch_attendees()) \
            .first()
 
    refreshed_event = await _do_sync_work()
    
    try:
        process_event_invites.delay(refreshed_event.id, current_user.id)
    except Exception:
        pass
 
    return _serialize_event(refreshed_event)


