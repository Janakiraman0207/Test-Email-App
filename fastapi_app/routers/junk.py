# routers/junk.py
from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Literal, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field

#  Router WITHOUT tags (because you keep tags in main.py)
router = APIRouter()

FolderType = Literal["junk", "inbox", "trash"]

UPLOAD_DIR = "uploads_junk"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# user_id -> { email_id -> EmailDetail }
JUNK_DB: Dict[int, Dict[str, "EmailDetail"]] = {}

#  Import real auth dependency (creates  lock in Swagger)
from fastapi_app.routers.auth import get_current_user


# -------------------------
# Helpers: supports dict OR object user
# -------------------------
def _uid(user: Any) -> int:
    if isinstance(user, dict):
        return int(user.get("id", 0) or 0)
    return int(getattr(user, "id", 0) or 0)


def _uemail(user: Any) -> str:
    if isinstance(user, dict):
        return str(user.get("email") or "")
    return str(getattr(user, "email", "") or "")


# -------------------------
# Schemas
# -------------------------
class AttachmentMeta(BaseModel):
    id: str
    filename: str
    content_type: str
    size: int
    url: str


class EmailListItem(BaseModel):
    id: str
    folder: FolderType = "junk"
    subject: str
    snippet: str
    from_email: EmailStr
    from_name: str
    date: datetime
    is_read: bool = False
    has_attachments: bool = False
    spam_score: int = Field(ge=0, le=10, default=8)


class EmailDetail(BaseModel):
    id: str
    folder: FolderType = "junk"
    subject: str
    body_html: str
    from_email: EmailStr
    from_name: str
    to: List[EmailStr]
    date: datetime
    is_read: bool = False
    spam_score: int = Field(ge=0, le=10, default=8)
    attachments: List[AttachmentMeta] = Field(default_factory=list)


class SendJunkEmailIn(BaseModel):
    from_email: EmailStr
    from_name: str
    to: List[EmailStr]
    subject: str
    body_html: str
    spam_score: int = 8


class UpdateJunkEmailIn(BaseModel):
    is_read: Optional[bool] = None


# -------------------------
# Internal functions
# -------------------------
def _make_snippet(html: str) -> str:
    text = (
        html.replace("<br>", " ")
        .replace("<p>", " ")
        .replace("</p>", " ")
        .replace("<h2>", " ")
        .replace("</h2>", " ")
        .replace("<ul>", " ")
        .replace("</ul>", " ")
        .replace("<li>", " ")
        .replace("</li>", " ")
    )
    return " ".join(text.split())[:140]


def _seed_junk(user_id: int, user_email: str):
    email_id = uuid.uuid4().hex
    JUNK_DB[user_id][email_id] = EmailDetail(
        id=email_id,
        folder="junk",
        subject=" Stackly Rewards: Free Premium Upgrade (Limited Time)",
        body_html="""
        <p>Hello,</p>
        <p>You have been selected for a <b>Stackly Premium Upgrade</b>.</p>
        <p>Please confirm within 24 hours.</p>
        """,
        from_email="rewards@stackly-promotions.com",
        from_name="Stackly Rewards",
        to=[user_email],
        date=datetime.utcnow(),
        is_read=False,
        spam_score=8,
        attachments=[],
    )


def _ensure_user_box(user_id: int, user_email: str):
    if user_id not in JUNK_DB:
        JUNK_DB[user_id] = {}
        _seed_junk(user_id, user_email)


def _to_list_item(e: EmailDetail) -> EmailListItem:
    return EmailListItem(
        id=e.id,
        folder=e.folder,
        subject=e.subject,
        snippet=_make_snippet(e.body_html),
        from_email=e.from_email,
        from_name=e.from_name,
        date=e.date,
        is_read=e.is_read,
        has_attachments=len(e.attachments) > 0,
        spam_score=e.spam_score,
    )


def _get_user_info(user: Any) -> tuple[int, str]:
    user_id = _uid(user)
    user_email = _uemail(user)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    # if email missing, use a safe default (for demo)
    if not user_email:
        user_email = "user@thestackly.com"

    return user_id, user_email


# -------------------------
# APIs ( protected)
# -------------------------
@router.get("", response_model=List[EmailListItem], summary="List junk emails")
def list_junk(
    user=Depends(get_current_user),
    q: Optional[str] = Query(default=None, description="Search subject/body"),
):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    items = [e for e in JUNK_DB[user_id].values() if e.folder == "junk"]

    if q:
        ql = q.lower()
        items = [
            e
            for e in items
            if ql in e.subject.lower() or ql in _make_snippet(e.body_html).lower()
        ]

    items.sort(key=lambda x: x.date, reverse=True)
    return [_to_list_item(e) for e in items]


@router.get("/{email_id}", response_model=EmailDetail, summary="Open junk email")
def get_junk_email(email_id: str, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    e = JUNK_DB[user_id].get(email_id)
    if not e or e.folder != "junk":
        raise HTTPException(status_code=404, detail="Junk email not found")

    e.is_read = True
    JUNK_DB[user_id][email_id] = e
    return e


@router.post("/send", response_model=EmailDetail, summary="Create a junk email (testing)")
def create_junk_email(payload: SendJunkEmailIn, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    email_id = uuid.uuid4().hex
    e = EmailDetail(
        id=email_id,
        folder="junk",
        subject=payload.subject,
        body_html=payload.body_html,
        from_email=payload.from_email,
        from_name=payload.from_name,
        to=payload.to,
        date=datetime.utcnow(),
        is_read=False,
        spam_score=max(0, min(10, payload.spam_score)),
        attachments=[],
    )
    JUNK_DB[user_id][email_id] = e
    return e


@router.patch("/{email_id}", response_model=EmailDetail, summary="Update junk email (read/unread)")
def update_junk_email(email_id: str, payload: UpdateJunkEmailIn, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    e = JUNK_DB[user_id].get(email_id)
    if not e or e.folder != "junk":
        raise HTTPException(status_code=404, detail="Junk email not found")

    if payload.is_read is not None:
        e.is_read = payload.is_read

    JUNK_DB[user_id][email_id] = e
    return e


@router.post("/{email_id}/move-to-inbox", response_model=EmailDetail, summary="Move junk email to inbox")
def move_to_inbox(email_id: str, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    e = JUNK_DB[user_id].get(email_id)
    if not e or e.folder != "junk":
        raise HTTPException(status_code=404, detail="Junk email not found")

    e.folder = "inbox"
    JUNK_DB[user_id][email_id] = e
    return e


@router.delete("/{email_id}", summary="Delete junk email (move to trash)")
def delete_junk(email_id: str, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    e = JUNK_DB[user_id].get(email_id)
    if not e:
        raise HTTPException(status_code=404, detail="Email not found")

    e.folder = "trash"
    JUNK_DB[user_id][email_id] = e
    return {"status": "ok", "moved_to": "trash", "id": email_id}


@router.post("/{email_id}/attachments/upload", response_model=AttachmentMeta, summary="Upload attachment to junk email")
def upload_junk_attachment(
    email_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    e = JUNK_DB[user_id].get(email_id)
    if not e or e.folder != "junk":
        raise HTTPException(status_code=404, detail="Junk email not found")

    att_id = uuid.uuid4().hex
    stored_name = f"{att_id}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, stored_name)

    content = file.file.read()
    with open(path, "wb") as f:
        f.write(content)

    size = os.path.getsize(path)

    meta = AttachmentMeta(
        id=att_id,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=size,
        url=f"/junk/attachments/{stored_name}",
    )

    e.attachments.append(meta)
    JUNK_DB[user_id][email_id] = e
    return meta


@router.get("/attachments/{stored_name}", summary="Download/view an attachment")
def download_junk_attachment(stored_name: str, user=Depends(get_current_user)):
    user_id, user_email = _get_user_info(user)
    _ensure_user_box(user_id, user_email)

    path = os.path.join(UPLOAD_DIR, stored_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Attachment not found")

    filename = stored_name.split("_", 1)[-1]
    return FileResponse(path, filename=filename)
