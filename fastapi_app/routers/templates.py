from fastapi import APIRouter, Depends, HTTPException
from typing import List
from django_backend.models import EmailTemplate
from fastapi_app.schemas.template_schemas import TemplateRead, TemplateCreate, TemplateUpdate
from fastapi_app.dependencies.auth import get_current_user
from asgiref.sync import sync_to_async

router = APIRouter()

@router.get("/", response_model=List[TemplateRead])
def list_my_templates(current_user = Depends(get_current_user)):
    return list(EmailTemplate.objects.filter(user=current_user))

@router.post("/", response_model=TemplateRead)
def create_template(template: TemplateCreate, current_user = Depends(get_current_user)):
    if EmailTemplate.objects.filter(user=current_user, title=template.title).exists():
        raise HTTPException(status_code=400, detail="Template with this title already exists.")
    
    return EmailTemplate.objects.create(
        user=current_user,
        title=template.title,
        body=template.body
    )

@router.delete("/{template_id}")
def delete_template(template_id: int, current_user = Depends(get_current_user)):
    try:
        template = EmailTemplate.objects.get(id=template_id, user=current_user)
        template.delete()
        return {"message": "Template deleted successfully"}
    except EmailTemplate.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template not found")
    
@router.patch("/{template_id}", response_model=TemplateRead)
def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    current_user = Depends(get_current_user)
):
    
    try:
        template = EmailTemplate.objects.get(id=template_id, user=current_user)
    except EmailTemplate.DoesNotExist:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(template, key, value)

    template.save()
    return template    