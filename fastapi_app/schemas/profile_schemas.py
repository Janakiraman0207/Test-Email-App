from pydantic import BaseModel, Field, computed_field
from datetime import datetime, date
from user_agents import parse
from typing import Optional

class ProfileBase(BaseModel):
    display_name: str | None = None
    bio: str | None = None            
    avatar_url: str | None = None     
    phone_number: str | None = None
    date_of_birth: date | None = None
    address: str | None = None
    language: str = "English"

class ProfileCreate(ProfileBase):
    full_name: str 

class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    phone_number: str | None = None
    date_of_birth: date | None = None  
    address: str | None = None
    language: str | None = None
    
    store_activity: bool | None = None
    is_2fa_enabled: bool | None = None


class ProfileRead(ProfileBase):
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None

    presence_status: str
    status_message: str = ""

    is_online: bool = False
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProfileStatusUpdate(BaseModel):
    presence_status: str
    status_message: Optional[str] = None

class ActivityRead(BaseModel):
    id: int
    ip_address: str | None
    user_agent: str | None
    timestamp: datetime
    
    @computed_field
    def device_details(self) -> str:
        if not self.user_agent:
            return "Unknown Device"
        try:
            ua = parse(self.user_agent)
            return f"{ua.browser.family} on {ua.os.family}"
        except Exception:
            return "Unknown Device"
            
    class Config:
        from_attributes = True  

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str 

class TwoFactorVerifyRequest(BaseModel):
    code: str