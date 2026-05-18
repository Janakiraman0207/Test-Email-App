from django.utils import timezone
from fastapi_app.dependencies.permissions import get_current_user
import pyotp
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from asgiref.sync import sync_to_async
from django_backend.models import LoginActivity , UserProfile
from django.contrib.auth import get_user_model
from django.db import connection
from fastapi_app.routers.email import send_welcome_email
from datetime import datetime, timezone as dt_timezone
User = get_user_model()

from ..core.security import (
    verify_password, create_access_token,
    create_password_reset_token, decode_access_token
)
from ..core.config import settings
from ..schemas.user_schemas import (
    Token, 
    ForgotPasswordRequest, 
    ResetPasswordWithOTP, 
    ForgotUsernameRequest, 
    ChangePasswordRequest, 
    UserCreate, 
    UserLogin,
    ResetPasswordRequest
)
from fastapi_app.utils.otp import generate_otp, otp_expiry
from fastapi_app.utils.sms import send_otp_sms
from fastapi_app.dependencies.auth import get_current_user
from django_backend.models import UserSession
from fastapi_app.utils.device import get_device_details


router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Extracts the logged-in user from the JWT access token.
    Used in authenticated endpoints like:
    - create task
    - create chat room
    - send messages
    """

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
        )

    email = payload.get("sub")
    session_id = payload.get("session_id")

    if not email or not session_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    user = await sync_to_async(
        User.objects.filter(email=email).first
    )()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    session = await sync_to_async(
        UserSession.objects.filter(
            session_id=session_id,
            user=user,
            is_active=True
        ).first
    )()

    token_iat = payload.get("iat")

    profile = await sync_to_async(
         lambda: getattr(user, "profile", None)
    )()

    if profile and profile.tokens_valid_after:

        token_issue_time = datetime.fromtimestamp(
            token_iat,
            tz=dt_timezone.utc
        )

        valid_after = profile.tokens_valid_after

        if valid_after.tzinfo is None:
           valid_after = valid_after.replace(
            tzinfo=dt_timezone.utc
           )

        if token_issue_time < valid_after:

            raise HTTPException(
                status_code=401,
                detail="Token expired due to logout from all devices"
            )

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Session expired or logged out",
        )

    return user


@router.post("/login", response_model=Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    otp: str | None = Query(default=None, description="2FA Code if enabled")
):
    connection.close_if_unusable_or_obsolete()
    email = form_data.username.strip()

    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    local_part, domain = email.rsplit("@", 1)

    if domain.lower() != "thestackly.com":
        raise HTTPException(
            status_code=400,
            detail="Only thestackly.com emails allowed"
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.check_password(form_data.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # 🔐 2FA Validation
    if hasattr(user, "profile") and user.profile.is_2fa_enabled:
        if not otp:
            raise HTTPException(
                status_code=401,
                detail="2FA Required. Please provide the 'otp' parameter."
            )

        secret = user.profile.two_factor_secret
        if not secret:
            raise HTTPException(status_code=401, detail="2FA Configuration Error")

        totp = pyotp.TOTP(secret)
        if not totp.verify(otp):
            raise HTTPException(status_code=401, detail="Invalid 2FA Code")

    
    should_record = True
    if hasattr(user, "profile"):
        should_record = user.profile.store_activity

    if should_record:
        LoginActivity.objects.create(
            user=user,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )

    # ✅ Detect Device
    device = get_device_details(request)

    # ✅ Create Multi-Device Session
    session_obj = UserSession.objects.create(
        user=user,
        ip_address=device["ip_address"],
        user_agent=device["user_agent"],
        device_name=device["device_name"],
        browser=device["browser"],
        os=device["os"],
    )

    # ✅ Create JWT with session_id
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "session_id": str(session_obj.session_id)  # 🔥 KEY PART
        },
        expires_delta=access_token_expires,
    )

    # ✅ Ensure profile exists
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "full_name": f"{user.first_name} {user.last_name}",
            "display_name": user.first_name or user.email
        }
    )
    
    profile.is_online = True
    profile.save(update_fields=['is_online'])
    
    user.current_status = 'AVAILABLE'
    user.save(update_fields=['current_status'])

    profile_image = None
    if profile.avatar:
        try:
            profile_image = profile.avatar.url
        except (ValueError, AttributeError):
            base_url = settings.MEDIA_URL
            if not base_url.endswith('/'):
                base_url += '/'
            profile_image = f"{base_url}{profile.avatar.name}"

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": profile.display_name or user.email,
        "profile_image": profile_image
    }

@router.post("/logout-all-devices")
def logout_all_devices(current_user = Depends(get_current_user)):
    
    if not hasattr(current_user, 'profile'):
        raise HTTPException(
            status_code=404, 
            detail="User profile not found."
        )

    current_user.profile.tokens_valid_after = timezone.now()
    
    current_user.profile.save()
    
    return {
        "message": "Successfully logged out of all devices.",
        "detail": "All previous tokens are now invalid. You must log in again."
    }

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(data: ForgotPasswordRequest):
    user = User.objects.filter(mobile_number=data.mobile_number).first()

    if not user:
       
        return {"message": "If this mobile number exists, an OTP has been sent"}

    otp = generate_otp()

    user.otp = otp
    user.otp_expires_at = otp_expiry()
    user.save(update_fields=["otp", "otp_expires_at"])

    result = send_otp_sms(user.mobile_number, otp)



    return {"message": "OTP sent to registered mobile number"}

@router.post("/reset-password")
def reset_password(data: ResetPasswordWithOTP):
    user = User.objects.filter(mobile_number=data.mobile_number).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if user.otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if not user.otp_expires_at or user.otp_expires_at < now():
        raise HTTPException(status_code=400, detail="OTP expired")

    user.set_password(data.new_password)
    user.otp = None
    user.otp_expires_at = None
    user.save(update_fields=["password", "otp", "otp_expires_at"])

    return {"message": "Password reset successful"}



@router.post("/forgot-username", status_code=200)
def forgot_username(data: ForgotUsernameRequest):
    users = User.objects.filter(mobile_number=data.phone_number)

    if not users.exists():
        return {
            "message": "If this phone number exists, username details have been sent."
        }

    masked_emails = []

    for user in users:
        local, domain = user.email.split("@")
        masked_emails.append(local[:2] + "****@" + domain)

    print("\n==========================================")
    print(" FORGOT USERNAME REQUEST")
    print(f" PHONE: {data.phone_number}")
    print(" USERNAMES:")
    for email in masked_emails:
        print(f"  - {email}")
    print("==========================================\n")

    return {
        "message": "If this phone number exists, username details have been sent.",
        "username_hints": masked_emails,
    }

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    
    is_correct_password = await sync_to_async(current_user.check_password)(payload.old_password)
    
    if not is_correct_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The old password you entered is incorrect."
        )

    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match."
        )

    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as the old password."
        )

    await sync_to_async(current_user.set_password)(payload.new_password)
    await sync_to_async(current_user.save)()

    return {"message": "Password updated successfully. Please login again with your new password."}
