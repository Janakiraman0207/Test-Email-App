from typing import Optional
from pydantic import BaseModel, ConfigDict
from enum import Enum

# ENUMS (SENIOR STYLE)
class ShowLabelListType(str, Enum):
    show = "show"
    hide = "hide"
    show_if_unread = "show_if_unread"

class ShowMessageListType(str, Enum):
    show = "show"
    hide = "hide"

# CREATE LABEL
class LabelCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

# UPDATE LABEL
class LabelUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    show_in_label_list: Optional[ShowLabelListType] = None
    show_in_message_list: Optional[ShowMessageListType] = None

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

# RESPONSE SCHEMA 
class LabelRead(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    show_in_label_list: ShowLabelListType
    show_in_message_list: ShowMessageListType

    model_config = ConfigDict(
        from_attributes=True
    )