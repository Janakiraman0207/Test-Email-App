from datetime import timedelta
from django.utils import timezone
from django_backend.models import UserProfile
from fastapi_app.tasks import reset_user_status
from fastapi_app.core.status_manager import StatusManager
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Body, Query
from django.contrib.auth import get_user_model
from ..schemas.user_schemas import (
    UserCreate,
    UserRead,
    UserUpdate,
    ChatSearchResponse,
    AccountMeResponse,
    PresenceStatus
)
from ..dependencies.permissions import get_current_active_user, is_admin, get_current_user
from ..core.security import get_password_hash
from asgiref.sync import sync_to_async
from ..schemas.user_schemas import AccountMeResponse
from django.db.models import Q
from fastapi_app.schemas.user_schemas import UserSearchResult
from fastapi_app.routers.email import send_welcome_email
import re

User = get_user_model()
router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate):

    if not user_in.email.lower().endswith("@thestackly.com"):
        raise HTTPException(
            status_code=400,
            detail="Only thestackly.com domain email is allowed"
        )

    if User.objects.filter(email=user_in.email).exists():
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    if not user_in.mobile_number:
        raise HTTPException(
            status_code=400,
            detail="Mobile number is required"
        )

    user = User(
        email=user_in.email,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        dob=user_in.dob,
        mobile_number=user_in.mobile_number,
        gender=user_in.gender,
        is_active=True
    )
    user.current_status = "offline"
    user.set_password(user_in.password)
    user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"language": "en"})
    send_welcome_email(user)

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "mobile_number": user.mobile_number,
        "gender": user.gender,
        "is_active": user.is_active,
        "current_status": user.current_status.lower() if user.current_status else "offline",
        "language": profile.language,
        "vacation_mode_enabled": getattr(user, "vacation_mode_enabled", False),
        "vacation_start_date": getattr(user, "vacation_start_date", None),
        "vacation_end_date": getattr(user, "vacation_end_date", None),
        "vacation_message": getattr(user, "vacation_message", None)
    }

@router.get("/me", response_model=AccountMeResponse)
async def read_users_me(current_user=Depends(get_current_active_user)):

    def _get_profile():
        profile, _ = UserProfile.objects.get_or_create(user=current_user)
        return profile

    profile = await sync_to_async(_get_profile, thread_sensitive=True)()

    first_name = (current_user.first_name or "").strip()
    last_name = (current_user.last_name or "").strip()

    if not first_name and not last_name:
        email_name = (current_user.email or "").split("@")[0]  

        parts = re.split(r"[._-]+", email_name)
        parts = [p for p in parts if p]

        if len(parts) >= 2:
            first_name = parts[0].capitalize()
            last_name = parts[1].capitalize()
        else:
            mid = len(email_name) // 2
            first_name = email_name[:mid].capitalize()
            last_name = email_name[mid:].capitalize()

        current_user.first_name = first_name
        current_user.last_name = last_name
        await sync_to_async(current_user.save, thread_sensitive=True)(
            update_fields=["first_name", "last_name"]
        )

    username_value = f"{first_name} {last_name}".strip()

    current_status_value = (profile.presence_status or "offline").lower()
    status_label = profile.get_presence_status_display()
    status_message_value = (profile.status_message or "").strip() or status_label

    return {
        "id": current_user.id,  
        "email": current_user.email,
        "username": username_value,
        "first_name": first_name,
        "last_name": last_name,
        "current_status": current_status_value,
        "status_label": status_label,
        "status_message": status_message_value,
        "is_online": profile.is_online,
        "last_seen": profile.last_seen,
    }



@router.get("/", response_model=List[UserRead])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user = Depends(is_admin) 
):
    """
    Fetch ALL users. 
    Only accessible by ADMIN users.
    """
    User = get_user_model()
    users = User.objects.all()[skip : skip + limit]
    return users

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, 
    current_user = Depends(is_admin) 
):
    """
    Delete a user by ID. 
    Only accessible by ADMIN users.
    """
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
        user.delete()
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    
    return None

 
@router.patch("/me", response_model=UserRead)
def update_user_me(
    user_update: UserUpdate, 
    current_user = Depends(get_current_active_user)
):
    """
    Update my own profile details.
    """
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    current_user.save()
    return current_user


@router.patch("/status")
async def update_my_status(
    status: PresenceStatus = Body(..., embed=True),
    message: Optional[str] = Body("", embed=True),
    duration: Optional[int] = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
):
    def _update_profile():
        profile, _ = UserProfile.objects.get_or_create(user=current_user)
        profile.presence_status = status.value if hasattr(status, "value") else str(status).lower()
        profile.status_message = (message or "").strip()
        profile.is_online = True
        profile.last_seen = timezone.now()
        profile.save(update_fields=["presence_status", "status_message", "is_online", "last_seen"])
        return profile

    profile = await sync_to_async(_update_profile, thread_sensitive=True)()

    if duration and duration > 0:
        expiry_time = timezone.now() + timedelta(minutes=duration)
        reset_user_status.apply_async(args=[current_user.id], countdown=duration * 60)
        return {
            "message": f"Status set to {profile.presence_status}. Will reset in {duration} minutes.",
            "expires_at": expiry_time,
            "status": profile.presence_status,
        }

    return {"message": "Status updated successfully", "status": profile.presence_status}



@router.get("/search-chat", response_model=List[ChatSearchResponse])
def search_colleagues(
    q: Optional[str] = Query(None, min_length=1, description="Search by name or email"),
    current_user=Depends(get_current_active_user),
):
    normalized_q = " ".join((q or "").split())

    if len(normalized_q) < 1:
        return []

    terms = [term for term in normalized_q.split(" ") if term]

    users_queryset = User.objects.select_related("profile").exclude(id=current_user.id)

    # Match each term against email/first_name/last_name
    
    for term in terms:
        users_queryset = users_queryset.filter(
            Q(email__icontains=term) |
            Q(first_name__icontains=term) |
            Q(last_name__icontains=term)
        )

    users = users_queryset[:20]

    results = []
    for user in users:
        avatar_link = None
        presence = "offline"
        is_online = False
        last_seen = None

        # Use websocket connection state for online status
        from fastapi_app.core.socket_manager import manager

        if hasattr(user, "profile") and user.profile:
            if user.profile.avatar:
                avatar_link = user.profile.avatar.url

            is_online = user.id in manager.user_connection_counts
            last_seen = user.profile.last_seen

            # Green dot logic: only show real status if online
            presence = user.profile.presence_status if is_online else "offline"

        results.append(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "current_status": presence,
                "status_message": getattr(user.profile, "status_message", "") if hasattr(user, "profile") and user.profile else "",
                "avatar_url": avatar_link,
                "is_online": is_online,
                "last_seen": last_seen,
            }
        )

    return results





