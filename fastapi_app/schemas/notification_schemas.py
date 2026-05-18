from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NotificationRead(BaseModel):
    id: int
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    related_id: int | None = Field(default=None, validation_alias="object_id")

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool = True
    
class MuteChatRequest(BaseModel):
    chat_id: int
    mute_until: Optional[datetime] = None