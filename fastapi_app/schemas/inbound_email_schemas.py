from pydantic import BaseModel
from typing import Dict, Optional


class IncomingEmail(BaseModel):
    from_email: str
    to: str
    subject: str
    body: str
    headers: Optional[Dict[str, str]] = {}