
from pydantic import BaseModel,field_validator , Field, ValidationInfo
from datetime import datetime,date
import bleach
from typing import List, Optional, Literal, Dict, Any
from fastapi_app.utils.sanitizer import sanitize_rich_text
from enum import Enum
import bleach

def sanitize_rich_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return value

    allowed_tags = ['b', 'i', 'u', 'ul', 'li', 'p', 'br']
    return bleach.clean(value, tags=allowed_tags, strip=True)

class AttendanceType(str, Enum):
    required = "required"
    optional = "optional"

RoleType = Literal["owner", "guest"]
StatusType = Literal["pending", "accepted", "declined", "maybe"]

class AvailabilityRequest(BaseModel):
    date: date
    user_ids: List[int]

class TimeBlock(BaseModel):
    start: str
    end: str
    title: Optional[str] = None
    
AvailabilityResponse = Dict[str, List[TimeBlock]]    

class AttendeeInput(BaseModel):
    user_id: int = Field(..., alias="user", description="The ID of the user attending")
    attendance_type: Optional[str] = "required"
    
    permissions: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "user": 5,
                "attendance_type": "optional",
                "permissions": {
                    "can_modify_event": False,
                    "can_invite_others": True
                }
            }
        }
    }
 
class AttendeeRead(BaseModel):
    user_id: int
    full_name: str
    email: Optional[str] = None
    profile_image: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    attendance_type: Optional[str] = None

    can_modify_event: Optional[bool] = False
    can_invite_others: Optional[bool] = False
    can_see_guest_list: Optional[bool] = False

    model_config = {"from_attributes": True}

class UserSearchResponse(BaseModel):
    id: int
    name: str
    profile_image: Optional[str] = None

    model_config = {"from_attributes": True}

class EventParticipant(BaseModel):
    
    id: int  
    name: str 
    email: str
    profile_image: Optional[str] = None
    role: RoleType
    status: StatusType
    attendance_type: AttendanceType
    can_modify_event: Optional[bool] = False
    can_invite_others: Optional[bool] = False
    can_see_guest_list: Optional[bool] = False

    model_config = {"from_attributes": True}

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    is_all_day: bool = False
    location: Optional[str] = None
    url: Optional[str] = None
    required_attendees: List[int] = Field(default_factory=list)
    optional_attendees: List[int] = Field(default_factory=list)
    can_modify_event: bool = False
    can_invite_others: bool = False
    can_see_guest_list: bool = False
    color: Optional[str] = "blue"
    repeat_rule: Optional[str] = None
    timezone: str = "UTC"
    reminders: List[int] = Field(default_factory=list)
    category_name: Optional[str] = None

    @field_validator("end_datetime")
    @classmethod
    def validate_event_time(cls, v, info: ValidationInfo):
        start = info.data.get("start_datetime")
        if start and v <= start:
            raise ValueError("End time must be after start time")
        return v
    
    @field_validator("description")    
    @classmethod
    def validate_description(cls, v):
        return sanitize_rich_text(v)

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    url: Optional[str] = None
    required_attendees: Optional[List[int]] = None
    optional_attendees: Optional[List[int]] = None
    can_modify_event: Optional[bool] = None
    can_invite_others: Optional[bool] = None
    can_see_guest_list: Optional[bool] = None
    color: Optional[str] = None
    repeat_rule: Optional[str] = None
    timezone: Optional[str] = None
    reminders: Optional[List[int]] = None
    category_name: Optional[str] = None

    @field_validator("description")
    @classmethod
    def clean_description(cls, v):
        return sanitize_rich_text(v)

class EventRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""

    start_datetime: datetime
    end_datetime: datetime

    is_all_day: bool
    location: Optional[str] = None
    url: Optional[str] = None
    can_modify_event: bool = False
    can_invite_others: bool = False
    can_see_guest_list: bool = False
    color: Optional[str] = "blue"
    repeat_rule: Optional[str] = None
    timezone: str
    category_name: Optional[str] = None

    created_by_id: int
    participants: List[EventParticipant] = []

    model_config = {"from_attributes": True}

class HolidayCreate(BaseModel):
    name: str
    date: date
    description: Optional[str] = None

class HolidayRead(BaseModel):
    id: int
    name: str
    date: date

    description: Optional[str] = None

    model_config = {"from_attributes": True}
    
class CalendarDayView(BaseModel):
    date: date
    events: List[EventRead]
    holidays: List[HolidayRead]

class CalendarWeekView(BaseModel):
    start_date: date
    end_date: date
    events: List[EventRead]
    holidays: List[HolidayRead]

class CalendarMonthView(BaseModel):
    year: int
    month: int
    events: List[EventRead]
    holidays: List[HolidayRead]

class CalendarCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    url: Optional[str] = None
    color: Optional[str] = "blue"
    reminder_minutes: Optional[int] = 15


class MessageUpdate(BaseModel):
    content: Optional[str] = None
    file_name: Optional[str] = None  # This field must be present

class ReminderRead(BaseModel):
    id: int
    minutes_before: int
    
    model_config = {"from_attributes": True}

