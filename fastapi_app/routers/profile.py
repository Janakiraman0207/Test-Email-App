import pyotp
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from asgiref.sync import sync_to_async
from typing import List
from django.core.files.base import ContentFile 
from datetime import datetime
from django.utils import timezone
from typing import Optional
from rest_framework.authtoken.models import Token
from django.contrib.sessions.models import Session

from django_backend.models import UserProfile, LoginActivity, User
from fastapi_app.schemas.profile_schemas import (
    ProfileCreate, ProfileRead, ActivityRead,
    ProfileUpdate, TwoFactorSetupResponse, TwoFactorVerifyRequest ,ProfileStatusUpdate
)
from fastapi_app.routers.auth import get_current_user

router = APIRouter(tags=["Profile"])

@router.get("/", response_model=ProfileRead)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()

    if not profile:
        
       full_name = getattr(current_user, "full_name", None) or f"{current_user.first_name} {current_user.last_name}".strip()
       phone = getattr(current_user, "mobile_number", None) or getattr(current_user, "phone_number", None)

       profile = await sync_to_async(UserProfile.objects.create)(
       user=current_user,
       full_name=full_name,
       display_name=current_user.first_name or "User",
       phone_number=phone
       )
    
    
    profile_data = profile
    if profile.avatar:
        profile_data.avatar_url = profile.avatar.url 

    return profile_data

@router.patch("/", response_model=ProfileRead)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    profile = await _get_or_create_profile(current_user)
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == 'avatar_url': 
            continue
        setattr(profile, key, value)

    await sync_to_async(profile.save)()
    
    profile = await _get_or_create_profile(current_user)
    return _to_profile_read(current_user, profile)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a profile picture.
    """
    profile, _ = await sync_to_async(UserProfile.objects.get_or_create)(user=current_user)
    
    content = await file.read()
    
    await sync_to_async(profile.avatar.save)(file.filename, ContentFile(content), save=True)
    
    return {"message": "Avatar updated successfully", "url": profile.avatar.url}

@router.get("/activity", response_model=List[ActivityRead])
def get_account_activity(
    current_user: User = Depends(get_current_user)
):
    activities = LoginActivity.objects.filter(user=current_user).order_by("-timestamp")[:10]
    return list(activities)

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(current_user: User = Depends(get_current_user)):
    profile, _ = await sync_to_async(UserProfile.objects.get_or_create)(user=current_user)

    secret = pyotp.random_base32()
    profile.two_factor_secret = secret
    await sync_to_async(profile.save)()

    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="Stackly"
    )

    qr_bytes = uri.encode("utf-8")
    qr_base64 = base64.b64encode(qr_bytes).decode("utf-8")

    return {
        "secret": secret,
        "qr_code": qr_base64
    }

@router.post("/2fa/verify")
async def verify_two_factor(
    data: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    profile = await sync_to_async(UserProfile.objects.get)(user=current_user)

    if not profile.two_factor_secret:
        raise HTTPException(status_code=400, detail="Please run setup first")

    totp = pyotp.TOTP(profile.two_factor_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid code. Try again.")

    profile.is_2fa_enabled = True
    await sync_to_async(profile.save)()

    return {"message": "2FA Enabled Successfully"}

ALLOWED_STATUS = {
    "available_now",
    "available",
    "busy",
    "dnd",
    "away",
    "offline",
    "out_of_office",
}

ONLINE_THRESHOLD_SECONDS = 120

def _is_online(profile: Optional[UserProfile]) -> bool:
    """Return True if user was active recently and not manually set offline."""
    if not profile:
        return False

    updated_at = getattr(profile, "updated_at", None)
    if not updated_at:
        return False

    if getattr(profile, "presence_status", None) == "offline":
        return False

    now = datetime.now(timezone.utc)

    if getattr(updated_at, "tzinfo", None) is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    return (now - updated_at).total_seconds() <= ONLINE_THRESHOLD_SECONDS

async def _get_or_create_profile(current_user) -> UserProfile:
    """Fetch profile for user, create if missing, and ensure updated_at is available."""
    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()

    if not profile:
        profile = UserProfile(user=current_user)
        await sync_to_async(profile.save)()
        # re-fetch so auto_now fields (updated_at) are populated
        profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()

    return profile

def _to_profile_read(current_user, profile: UserProfile) -> ProfileRead:
    email = getattr(current_user, "email", None)
    full_name = (
    getattr(profile, "full_name", None)
    or getattr(current_user, "full_name", None)
    or (email.split("@")[0] if email else None)
    )
    avatar_url = profile.avatar.url if getattr(profile, "avatar", None) else None

    return ProfileRead(
    user_id=current_user.id,
    full_name=full_name,
    email=email,

    display_name=getattr(profile, "display_name", None),
    bio=getattr(profile, "bio", None),
    avatar_url=avatar_url,
    phone_number=getattr(profile, "phone_number", None),
    date_of_birth=getattr(profile, "date_of_birth", None),
    address=getattr(profile, "address", None),
    language=getattr(profile, "language", "en-US"),

    presence_status=getattr(profile, "presence_status", "available"),
    status_message=getattr(profile, "status_message", "") or "",
    is_online=_is_online(profile),
    last_seen=getattr(profile, "updated_at", None),
)

@router.get("/me/status", response_model=ProfileRead)
async def get_my_profile_status(current_user=Depends(get_current_user)):
    profile = await _get_or_create_profile(current_user)
    return _to_profile_read(current_user, profile)

@router.patch("/me/status", response_model=ProfileRead)
async def update_my_profile_status(
    payload: ProfileStatusUpdate,
    current_user=Depends(get_current_user),
):
    if payload.presence_status not in ALLOWED_STATUS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Allowed: {sorted(ALLOWED_STATUS)}",
        )

    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()
    if not profile:
        profile = UserProfile(user=current_user)

    profile.presence_status = payload.presence_status

    if payload.status_message is not None:
        profile.status_message = payload.status_message

    await sync_to_async(profile.save)()
    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()

    return _to_profile_read(current_user, profile)

@router.post("/me/ping", response_model=ProfileRead)
async def ping_me(current_user=Depends(get_current_user)):
   
    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()
    if not profile:
        profile = UserProfile(user=current_user)

    await sync_to_async(profile.save)()
    profile = await sync_to_async(UserProfile.objects.filter(user=current_user).first)()

    return _to_profile_read(current_user, profile)

@router.post("/logout-all")
async def logout_all_devices(current_user: User = Depends(get_current_user)):  

    sessions = await sync_to_async(list)(
        Session.objects.filter(expire_date__gte=timezone.now())
    )

    for session in sessions:
        try:
            data = session.get_decoded()
            if str(data.get('_auth_user_id')) == str(current_user.id):
                await sync_to_async(session.delete)()
        except Exception:
            continue

    return {"message": "Logged out from all devices successfully"}