from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import List, Optional, Dict

class DriveFileRead(BaseModel):
    id: int
    original_name: str
    size: int
    content_type: str
    created_at: datetime

    url: Optional[str] = None
    file_path: Optional[str] = None

    is_image: Optional[bool] = False
    is_favorite: Optional[bool] = False
    is_shared: Optional[bool] = False

    share_link: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )

class DeleteFilesSchema(BaseModel):
    file_ids: List[int]

class PersonFilePreview(BaseModel):
    id: int
    original_name: str
    created_at: datetime
    content_type: str

class MeetingPreview(BaseModel):
    id: int
    title: str
    meeting_code: str
    call_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BrowseByPersonResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    profile_image: Optional[str] = None
    recent_files: List[PersonFilePreview]
    additional_files_count: int
    meetings: List[MeetingPreview]
    meetings_count: int

    model_config = ConfigDict(
        from_attributes=True
    )

class InviteRequest(BaseModel):
    email: EmailStr
    permission: str = "view"

class MediaGroupedResponse(BaseModel):
    status: str
    media_files: Dict[str, List[DriveFileRead]]

    model_config = ConfigDict(
        from_attributes=True
    )