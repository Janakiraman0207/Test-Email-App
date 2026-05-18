from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from django.contrib.auth import get_user_model
from ..core.config import settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_iat = payload.get("iat")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    User = get_user_model()
    try:
        user = User.objects.select_related('profile').get(email=email)
    except User.DoesNotExist:
        raise credentials_exception

    if hasattr(user, 'profile') and user.profile.tokens_valid_after:
        valid_after_timestamp = user.profile.tokens_valid_after.timestamp()
        
        if token_iat is not None and token_iat < (valid_after_timestamp - 1):
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user

def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def is_admin(current_user = Depends(get_current_active_user)):
    """Only allows users who are Superusers (Admins)"""
    if not current_user.is_superuser:
         raise HTTPException(
            status_code=403, 
            detail="You do not have permission to access this resource"
        )
    return current_user