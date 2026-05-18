from datetime import datetime, timedelta
from jose import jwt

ACCESS_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(user):
    expire = datetime.utcnow() + timedelta(minutes=15)

    payload = {
        "sub": str(user.id),
        "token_version": user.profile.token_version,
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)