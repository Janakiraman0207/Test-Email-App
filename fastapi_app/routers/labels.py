from fastapi import APIRouter, Depends, HTTPException
from typing import List
from asgiref.sync import sync_to_async

from django_backend.models import Label, Email, User
from fastapi_app.routers.auth import get_current_user
from fastapi_app.schemas.label_schemas import (
    LabelCreate,
    LabelUpdate,
    LabelRead
)

router = APIRouter(prefix="/emails", tags=["Emails"])

# GET ALL LABELS
@router.get("/labels", response_model=List[LabelRead])
async def get_labels(current_user: User = Depends(get_current_user)):

    labels = await sync_to_async(list)(
        Label.objects.filter(user=current_user)
    )

    return labels

# CREATE LABEL (SECURE)
@router.post("/labels", response_model=LabelRead)
async def create_label(
    data: LabelCreate,
    current_user: User = Depends(get_current_user)
):

    parent = None

    if data.parent_id:
        parent_exists = await sync_to_async(
            Label.objects.filter(
                id=data.parent_id,
                user=current_user
            ).exists
        )()

        if not parent_exists:
            raise HTTPException(
                status_code=400,
                detail="Invalid parent label"
            )

        parent = await sync_to_async(Label.objects.get)(
            id=data.parent_id,
            user=current_user
        )

    label = await sync_to_async(Label.objects.create)(
        name=data.name,
        user=current_user,
        parent=parent
    )

    return label

# UPDATE LABEL (SECURE)
@router.put("/labels/{label_id}", response_model=LabelRead)
async def update_label(
    label_id: int,
    data: LabelUpdate,
    current_user: User = Depends(get_current_user)
):

    label = await sync_to_async(
        Label.objects.filter(id=label_id, user=current_user).first
    )()

    if not label:
        raise HTTPException(status_code=404, detail="Label not found")

    if data.parent_id:
        parent_exists = await sync_to_async(
            Label.objects.filter(
                id=data.parent_id,
                user=current_user
            ).exists
        )()

        if not parent_exists:
            raise HTTPException(
                status_code=400,
                detail="Invalid parent label"
            )

        label.parent_id = data.parent_id

    if data.name is not None:
        label.name = data.name

    if data.show_in_label_list is not None:
        label.show_in_label_list = data.show_in_label_list

    if data.show_in_message_list is not None:
        label.show_in_message_list = data.show_in_message_list

    await sync_to_async(label.save)()

    return label

# DELETE LABEL
@router.delete("/labels/{label_id}")
async def delete_label(
    label_id: int,
    current_user: User = Depends(get_current_user)
):

    label = await sync_to_async(
        Label.objects.filter(id=label_id, user=current_user).first
    )()

    if not label:
        raise HTTPException(status_code=404, detail="Label not found")

    await sync_to_async(label.delete)()

    return {"message": "Label deleted successfully"}

# ASSIGN LABELS TO EMAIL 
@router.post("/{email_id}/labels", response_model=List[LabelRead])
async def assign_labels(
    email_id: int,
    label_ids: List[int],
    current_user: User = Depends(get_current_user)
):

    @sync_to_async
    def update_labels():
        try:
    
            email = Email.objects.get(
                id=email_id,
                sender=current_user   # (based on your model)
            )

            valid_labels = Label.objects.filter(
                id__in=label_ids,
                user=current_user
            )

            if valid_labels.count() != len(label_ids):
                raise HTTPException(
                    status_code=400,
                    detail="One or more labels are invalid or unauthorized"
                )

            email.labels.set(valid_labels)

            return list(email.labels.all())

        except Email.DoesNotExist:
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )

    return await update_labels()