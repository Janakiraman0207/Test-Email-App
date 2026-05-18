from fastapi import APIRouter, Depends, HTTPException
from asgiref.sync import sync_to_async

from django_backend.models import Note
from ..schemas.note_schemas import NoteCreate, NoteUpdate, NoteRead
from .auth import get_current_user

router = APIRouter()


# ✅ CREATE NOTE
@router.post("/", response_model=NoteRead)
async def create_note(data: NoteCreate, user=Depends(get_current_user)):
    try:
        note_data = {
            "created_by": user,   # ✅ correct field
            "title": data.title or "Untitled",
            "content": data.content or "",
        }

        # include only if model has it
        if hasattr(Note, "is_pinned"):
            note_data["is_pinned"] = False

        note = await sync_to_async(Note.objects.create)(**note_data)

        return note

    except Exception as e:
        print("CREATE NOTE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ✅ LIST NOTES (FILTER BY USER)
@router.get("/", response_model=list[NoteRead])
async def list_notes(user=Depends(get_current_user)):
    try:
        notes = await sync_to_async(list)(
            Note.objects.filter(created_by=user).order_by("-updated_at")
        )
        return notes
    except Exception as e:
        print("LIST NOTES ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ✅ GET SINGLE NOTE
@router.get("/{note_id}", response_model=NoteRead)
async def get_note(note_id: int, user=Depends(get_current_user)):
    note = await sync_to_async(
        Note.objects.filter(id=note_id, created_by=user).first
    )()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return note


# ✅ UPDATE NOTE
@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(note_id: int, data: NoteUpdate, user=Depends(get_current_user)):
    try:
        note = await sync_to_async(
            Note.objects.filter(id=note_id, created_by=user).first
        )()

        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        if data.title is not None:
            note.title = data.title
        if data.content is not None:
            note.content = data.content
        if hasattr(note, "is_pinned") and data.is_pinned is not None:
            note.is_pinned = data.is_pinned

        await sync_to_async(note.save)()

        return note

    except Exception as e:
        print("UPDATE NOTE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ✅ DELETE NOTE
@router.delete("/{note_id}")
async def delete_note(note_id: int, user=Depends(get_current_user)):
    try:
        note = await sync_to_async(
            Note.objects.filter(id=note_id, created_by=user).first
        )()

        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        await sync_to_async(note.delete)()

        return {"message": "Note deleted successfully"}

    except Exception as e:
        print("DELETE NOTE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))