from fastapi import APIRouter, Depends, HTTPException
from typing import List
from django.utils import timezone
from django_backend.models import UserSession
from fastapi_app.dependencies.auth import get_current_user
from fastapi_app.schemas.sessions_schemas import SessionResponse

router = APIRouter()
 
@router.get("/sessions/", response_model=list[SessionResponse])
def get_sessions(current_user=Depends(get_current_user)):

    sessions = UserSession.objects.filter(
        user=current_user
    ).order_by("-login_time")

    return sessions

@router.post("/sessions/logout/{session_id}")
def logout_device(session_id: str, current_user=Depends(get_current_user)):

    session_obj = UserSession.objects.filter(
        session_id=session_id,  
        user=current_user,
        is_active=True
    ).first()

    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    session_obj.logout_time = timezone.now()
    session_obj.is_active = False
    session_obj.save()

    return {"message": "Logged out successfully"}

@router.post("/sessions/logout-all")
def logout_all_devices(current_user=Depends(get_current_user)):

    sessions = UserSession.objects.filter(
        user=current_user,
        is_active=True
    )

    if not sessions.exists():
        raise HTTPException(status_code=404, detail="No active sessions found")

    for session_obj in sessions:
        session_obj.logout_time = timezone.now()
        session_obj.is_active = False
        session_obj.save()

    return {"message": "Logged out from all devices"}