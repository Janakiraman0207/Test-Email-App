from fastapi import APIRouter, Depends, HTTPException
from django_backend.models import FavouriteContact
from django.contrib.auth import get_user_model
from fastapi_app.dependencies.auth import get_current_user
from django.shortcuts import get_object_or_404

router = APIRouter()
User = get_user_model()

@router.get("/people/")
def get_people(current_user=Depends(get_current_user)):

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if hasattr(current_user, "organization") and current_user.organization:
        people = User.objects.filter(
            organization=current_user.organization
        ).exclude(id=current_user.id)
    else:
        people = User.objects.exclude(id=current_user.id)

    favourite_ids = FavouriteContact.objects.filter(
        user=current_user
    ).values_list("contact_id", flat=True)

    result = []

    for person in people:
        result.append({
            "id": person.id,
            "name": f"{person.first_name} {person.last_name}".strip(),
            "email": person.email,
            "is_favourite": person.id in favourite_ids
        })

    return {
        "favourites": [p for p in result if p["is_favourite"]],
        "all_contacts": result
    }

@router.post("/people/{contact_id}/toggle-favourite/")
def toggle_favourite(contact_id: int,
                     current_user=Depends(get_current_user)):

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if current_user.id == contact_id:
        raise HTTPException(status_code=400, detail="Cannot favourite yourself")

    contact = get_object_or_404(User, id=contact_id)

    obj, created = FavouriteContact.objects.get_or_create(
        user=current_user,
        contact=contact
    )

    if not created:
        obj.delete()
        return {"message": "Removed from favourites"}

    return {"message": "Added to favourites"}

@router.get("/organisation/people")
def organisation_people(current_user=Depends(get_current_user)):

    favourites = FavouriteContact.objects.filter(
        user=current_user
    ).select_related("contact")

    favourite_users = [fav.contact for fav in favourites]
    favourite_ids = [u.id for u in favourite_users]

    all_contacts = User.objects.exclude(
        id__in=favourite_ids
    ).exclude(id=current_user.id)

    return {
        "favourites": [
            {
                "id": u.id,
                "name": u.first_name,
                "email": u.email
            }
            for u in favourite_users
        ],
        "all_contacts": [
            {
                "id": u.id,
                "name": u.first_name,
                "email": u.email
            }
            for u in all_contacts
        ]
    }

@router.get("/people/search")
def search_people(
    query: str,
    current_user=Depends(get_current_user)
):

    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    people = User.objects.filter(
        first_name__icontains=query
    ).exclude(id=current_user.id)

    result = []

    for person in people:
        result.append({
            "id": person.id,
            "name": f"{person.first_name} {person.last_name}".strip(),
            "email": person.email
        })

    return {
        "results": result
    }