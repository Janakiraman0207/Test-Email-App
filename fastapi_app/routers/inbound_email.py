from fastapi import APIRouter, BackgroundTasks
from fastapi_app.tasks import process_incoming_email
from pydantic import BaseModel
from typing import Dict, Optional

router = APIRouter(prefix="/email", tags=["Inbound Email"])

class IncomingEmail(BaseModel):
    from_email: str
    to: str
    subject: str
    body: str
    headers: Optional[Dict[str, str]] = {}


@router.post("/inbound")
def receive_inbound_email(
    payload: IncomingEmail,
    background_tasks: BackgroundTasks
):
    """
    Entry point for ALL incoming emails
    (SMTP / webhook / external provider).
    """

    # Run in background so API stays fast
    background_tasks.add_task(
        process_incoming_email,
        payload
    )

    return {
        "status": "received",
        "message": "Inbound email queued"
    }