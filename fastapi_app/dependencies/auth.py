from typing import TYPE_CHECKING
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from fastapi_app.core.security import decode_access_token
from jose import jwt, JWTError
from fastapi_app.core.config import settings

if TYPE_CHECKING:
    from django_backend.models import User as DjangoUser

User = get_user_model()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )    

    email = payload.get("sub")
    token_version = payload.get("token_version")  
    token_iat = payload.get("iat") 

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user = await sync_to_async(
            User.objects.select_related("profile").get
        )(email=email)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if token_version is not None:
        if hasattr(user, "profile") and token_version != getattr(user.profile, "token_version", None):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalidated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if hasattr(user, "profile"):
        if getattr(user.profile, "tokens_valid_after", None):
            valid_after_timestamp = user.profile.tokens_valid_after.timestamp()
            
            if token_iat is not None and token_iat < (valid_after_timestamp - 1):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired. Please log in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    return user