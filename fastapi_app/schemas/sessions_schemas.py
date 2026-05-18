from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class SessionResponse(BaseModel):
    id: int
    session_id: UUID   # ✅ FIXED
    device_name: Optional[str]
    browser: Optional[str]
    os: Optional[str]
    ip_address: Optional[str]
    login_time: datetime
    logout_time: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True