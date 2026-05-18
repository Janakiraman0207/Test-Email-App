from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TemplateBase(BaseModel):
    title: str
    body: str

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None

class TemplateRead(TemplateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True