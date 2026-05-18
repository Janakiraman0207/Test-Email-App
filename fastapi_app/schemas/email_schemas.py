
from pydantic import BaseModel , EmailStr, model_validator, Field
from typing import List
from datetime import datetime
from typing import Optional
from .user_schemas import UserNameOut

class EmailCreate(BaseModel):
    to_emails: List[EmailStr] = Field(default_factory=list)
    cc_emails: List[EmailStr] = Field(default_factory=list)
    bcc_emails: List[EmailStr] = Field(default_factory=list)
    to: Optional[List[EmailStr]] = []
    cc: Optional[List[EmailStr]] = []
    bcc: Optional[List[EmailStr]] = []
    subject: str
    body: str
    scheduled_at: Optional[datetime] = None
    
    @model_validator(mode='after')
    def check_at_least_one_recipient(self):
        if not self.to and not self.cc and not self.bcc:
            raise ValueError("You must provide at least one recipient in 'to', 'cc', or 'bcc'.")
        return self


class EmailReply(BaseModel):
    email_id: int
    body: str


class EmailUpdate(BaseModel):
    is_important: Optional[bool] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_spam: Optional[bool] = None
    is_read: Optional[bool] = None
    has_invites: Optional[bool] = None


class DraftCreate(BaseModel):
    to: list[EmailStr] | None = Field(default_factory=list)     
    cc: list[EmailStr] | None = Field(default_factory=list)     
    bcc: list[EmailStr] | None = Field(default_factory=list)    
     
    subject: str | None = None 
    body: str | None = None

class EmailRead(BaseModel):
    id: int
    sender_id: int
    sender: UserNameOut
    to: List[UserNameOut] = []
    cc: List[UserNameOut] = []
    bcc: List[UserNameOut] = []
    subject: Optional[str] = None
    body: Optional[str] = None
    date: Optional[datetime] = None
    attachments: List[dict] = Field(default_factory=list)

    is_important: bool = False
    is_favorite: bool = False
    is_archived: bool = False
    is_spam: bool = False
    is_read: bool = False
    has_invites: bool = False

    snoozed_until: Optional[datetime] = None
    is_snoozed: bool = False

    class Config:
        from_attributes = True

class SnoozeRequest(BaseModel):
    snoozed_until: Optional[datetime] = None
        
class BulkReadRequest(BaseModel):
    ids: List[int] = Field(default_factory=list) 
          
class BulkUpdateRequest(EmailUpdate):
    ids: List[int]        

class BulkReadRequest(BaseModel):
    ids: List[int]