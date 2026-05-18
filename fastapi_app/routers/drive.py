import os
import shutil
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, Body
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.utils.timesince import timesince
from django.db.models import Q
from django.conf import settings
from fastapi_app.schemas.drive_schemas import BrowseByPersonResponse, InviteRequest, MediaGroupedResponse
from fastapi_app.utils.drive_people_service import get_browse_people_data
from django_backend.models import DriveFile, FileAccess, FileLink, FileInvite, Meeting
from fastapi_app.routers.auth import get_current_user, get_user_model
from fastapi_app.schemas.drive_schemas import DriveFileRead, DeleteFilesSchema
from fastapi.responses import FileResponse
import mimetypes
import uuid
from django.contrib.auth.models import User
from collections import defaultdict

MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024 

router = APIRouter()

@router.post("/upload", response_model=Dict[str, Any])
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_user)
):

    @sync_to_async
    def _process_uploads():
        upload_dir = os.path.join("media", "drive")
        os.makedirs(upload_dir, exist_ok=True)
        results = []
 
        for file in files:
            original_base_name = os.path.basename(file.filename)
            safe_filename = original_base_name
            file_path = os.path.join(upload_dir, safe_filename)

            counter = 1
            while os.path.exists(file_path):
                name, ext = os.path.splitext(original_base_name)
                safe_filename = f"{name}_{counter}{ext}"
                file_path = os.path.join(upload_dir, safe_filename)
                counter += 1

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_size = os.path.getsize(file_path)
            if file_size > 1024 * 1024 * 1024: # 1GB
                os.remove(file_path)
                raise HTTPException(status_code=413,detail=f"File '{original_base_name}' exceeds 1GB limit")

            drive_file = DriveFile.objects.create(
                owner=current_user,
                created_by=current_user,
                updated_by=current_user,
                original_name=safe_filename,
                size=file_size,
                content_type=file.content_type or "application/octet-stream",
                file=os.path.join("drive", safe_filename),
                is_trashed=False
            )

            results.append({
                "id": drive_file.id,
                "original_name": drive_file.original_name,
                "size": drive_file.size,
                "content_type": drive_file.content_type,
                "created_at": drive_file.created_at.isoformat() if drive_file.created_at else None,
                "url": drive_file.file.url if drive_file.file else None,
                "is_image": drive_file.content_type.startswith("image"),
                "is_favorite": False,
                "is_shared": False
            })
 
        return results
 
    try:
        saved_files_data = await _process_uploads()

        return {
            "message": f"Successfully uploaded {len(saved_files_data)} file(s)",
            "files": saved_files_data
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        raise HTTPException( status_code=500, detail=f"File upload failed: {str(e)}")
      
@router.get("/all-files")
async def all_files(
    search: Optional[str] = Query(None),
    current_user=Depends(get_current_user)
):
    queryset = DriveFile.objects.filter(
        is_trashed=False
    ).filter(
        Q(owner=current_user) | Q(access_list__user=current_user)
    )
 
    if search and search.strip():
        search = search.strip()
        queryset = queryset.filter(
            Q(original_name__icontains=search) |
            Q(created_by__email__icontains=search) |
            Q(owner__email__icontains=search)
        )
 
    files = await sync_to_async(list)(
        queryset
        .select_related("created_by", "owner")
        .prefetch_related("access_list__user", "favorited_by") 
        .distinct()
        .order_by("-created_at")
    )
 
    def format_size(size):
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size / 1024)} KB"
        else:
            return f"{round(size / (1024 * 1024), 1)} MB"
 
    result = []
 
    for file in files:
        created_by = (
            file.created_by.first_name
            if file.created_by and file.created_by.first_name
            else (file.owner.first_name or file.owner.email)
        )
 
        access_users = list(file.access_list.all())
        user_list = [
    (f"{a.user.first_name} {a.user.last_name}".strip() or a.user.email)
    for a in access_users]
 
        if len(user_list) == 0:
            action_users = "Only you"
        elif len(user_list) == 1:
            action_users = user_list[0]
        else:
            action_users = f"{user_list[0]} + Many"
 
        time_str = timesince(file.created_at)
        time_display = time_str.split(",")[0] + " ago"
        is_fav = current_user in file.favorited_by.all()
 
        result.append({
            "id": file.id,
            "title": file.original_name,
            "size": format_size(file.size),
            "created_by": created_by,
            "created_at": file.created_at.isoformat(),
            "action": {
                "users": action_users,
                "time": time_display
            },
            "url": f"/drive/view/{file.original_name}",
            "is_image": file.content_type.startswith("image"),
            "is_favorite": is_fav, 
        })
 
    return result

@router.get("/files/{file_id}/share-link")
async def get_invite_link(
    file_id: int, 
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def fetch_file():
        return DriveFile.objects.filter(id=file_id, owner=current_user).first()

    file_obj = await fetch_file()
    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")

    share_url = f"http://127.0.0.1:8000/drive/share/{file_obj.share_token}"
    
    return {
        "share_link": share_url,
        "sharing_level": file_obj.sharing_level
    }

@router.get("/share/{token}")
async def access_via_share_link(
    token: uuid.UUID, 
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def process_access():
        try:
            file_obj = DriveFile.objects.get(share_token=token)
            
            if file_obj.sharing_level == "RESTRICTED":
                is_authorized = FileAccess.objects.filter(file=file_obj, user=current_user).exists()
                if not is_authorized and file_obj.owner != current_user:
                    return None, "RESTRICTED"
            
            access_record, created = FileAccess.objects.get_or_create(
                file=file_obj,
                user=current_user,
                defaults={
                    "permission": file_obj.link_permission, 
                    "access_source": "LINK" 
                }
            )
            return file_obj, "SUCCESS"

        except DriveFile.DoesNotExist:
            return None, "NOT_FOUND"

    file_obj, status = await process_access()
    
    if status == "NOT_FOUND":
        raise HTTPException(status_code=404, detail="Invalid share link.")
    if status == "RESTRICTED":
        raise HTTPException(status_code=403, detail="This link is private. Request access from the owner.")

    return {
        "message": "Access granted via link",
        "file_id": file_obj.id,
        "title": file_obj.original_name,
        "permission": file_obj.link_permission
    }
    
@router.patch("/files/{file_id}/sharing-level")
async def update_sharing_level(
    file_id: int, 
    sharing_level: str, 
    current_user: User = Depends(get_current_user)
):
    @sync_to_async
    def update_db():
        file_obj = DriveFile.objects.filter(id=file_id, owner=current_user).first()
        if not file_obj:
            return None
        file_obj.sharing_level = sharing_level
        file_obj.save()
        return file_obj

    updated_file = await update_db()
    if not updated_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    return {"message": f"Sharing level updated to {sharing_level}"}    

@router.get("/my-files")

async def my_files(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(

        DriveFile.objects.filter(

            owner=current_user,  

            is_trashed=False

        )

        .select_related("updated_by", "owner")

        .prefetch_related("access_list", "favorited_by")

        .order_by("-updated_at")

    )
 
    def format_size(size):

        if size < 1024:

            return f"{size} B"

        elif size < 1024 * 1024:

            return f"{round(size / 1024)} KB"

        else:

            return f"{round(size / (1024 * 1024), 1)} MB"
 
    result = []
 
    for file in files:

        access_users = list(file.access_list.all())

        sharing_type = "Shared" if len(access_users) > 0 else "Private"
 
        modified_by = (

            file.updated_by.first_name

            if file.updated_by and file.updated_by.first_name

            else (file.owner.first_name or file.owner.email)

        )


        is_fav = current_user in file.favorited_by.all()
 
        result.append({

            "id": file.id,

            "title": file.original_name,

            "size": format_size(file.size),

            "modified_on": file.updated_at,

            "modified_by": modified_by,

            "sharing_type": sharing_type,

            "url": f"/drive/view/{file.original_name}",

            "is_image": file.content_type.startswith("image"),

            "is_favorite": is_fav, 

        })
 
    return result
 

@router.patch("/{file_id}/favorite")
async def toggle_favorite(file_id: int, current_user=Depends(get_current_user)):
    @sync_to_async
    def _toggle_db():
        try:
            file = DriveFile.objects.get(id=file_id)
            
            if current_user in file.favorited_by.all():
                file.favorited_by.remove(current_user)
                is_favorite = False
            else:
                file.favorited_by.add(current_user)
                is_favorite = True
                
            return is_favorite, None
            
        except DriveFile.DoesNotExist:
            return None, "File not found"
 
    is_favorite, error = await _toggle_db()
 
    if error:
        raise HTTPException(status_code=404, detail=error)
 
    return {
        "message": "Favorite updated",
        "is_favorite": is_favorite
    }
    
@router.patch("/files/{file_id}/rename")
async def rename_file(
    file_id: int,
    new_name: str = Body(..., embed=True),
    current_user=Depends(get_current_user)
):
    try:
        file = await sync_to_async(DriveFile.objects.get)(
            id=file_id,
            owner=current_user
        )

        if not new_name.strip():
            raise HTTPException(status_code=400, detail="File name cannot be empty")

        _, ext = os.path.splitext(file.original_name)
        if "." not in new_name:
            new_name = new_name + ext

        old_path = file.file.path

        if not os.path.exists(old_path):
            fixed_path = old_path.replace("media\\media\\", "media\\").replace("media/media/", "media/")
            if os.path.exists(fixed_path):
                old_path = fixed_path
            else:
                raise HTTPException(status_code=400, detail="Original file not found")

        directory = os.path.dirname(old_path)
        new_path = os.path.join(directory, new_name)

        print("OLD PATH:", old_path)
        print("NEW PATH:", new_path)

        if os.path.exists(new_path):
            raise HTTPException(status_code=400, detail="File name already exists")

        os.rename(old_path, new_path)

        file.file.name = new_name
        file.original_name = new_name
        file.updated_by = current_user

        await sync_to_async(file.save)()

        return {
            "message": "File renamed successfully",
            "new_name": new_name
        }

    except DriveFile.DoesNotExist:
        raise HTTPException(status_code=404, detail="File not found")

    except Exception as e:
        print(" RENAME ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/favorites")
async def get_favorite_files(current_user=Depends(get_current_user)):
 
    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            favorited_by=current_user,  
            is_trashed=False
        )
        .select_related("owner", "updated_by")
        .prefetch_related("access_list__user")
        .order_by("-created_at")
    )
 
    def format_size(size):
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size / 1024)} KB"
        else:
            return f"{round(size / (1024 * 1024), 1)} MB"
 
    result = []
 
    for file in files:
 
        owned_by = (
            "You"
            if file.owner_id == current_user.id
            else (file.owner.first_name or file.owner.email)
        )
 
        modified_by = (
            file.updated_by.first_name
            if file.updated_by and file.updated_by.first_name
            else file.owner.first_name or file.owner.email
        )
 
        access_users = list(file.access_list.all())
 
        user_list = [
            a.user.first_name if a.user.first_name else a.user.email
            for a in access_users
        ]
 
        if len(user_list) == 0:
            activity = "Only you"
        elif len(user_list) == 1:
            activity = user_list[0]
        else:
            activity = f"{user_list[0]} + {len(user_list)-1}"
 
        result.append({
            "id": file.id,
            "title": file.original_name,
            "size": format_size(file.size),
 
            "modified_on": file.updated_at,
 
            "modified_by": modified_by,
            "owned_by": owned_by,
            "activity": activity,
 
            "url": f"/drive/view/{file.original_name}",
            "is_image": file.content_type.startswith("image"),
 
            "is_favorite": True
        })
 
    return result
 
@router.get("/shared-with-me")
async def shared_with_me(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            access_list__user=current_user,
            is_trashed=False
        )
        .select_related("owner", "created_by")
        .prefetch_related("access_list__user", "favorited_by")
        .distinct()
        .order_by("-created_at")
    )


    def format_size(size):
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size / 1024)} KB"
        else:
            return f"{round(size / (1024 * 1024), 1)} MB"

    result = []

    for file in files:

        shared_by = (
            file.owner.first_name
            if file.owner and file.owner.first_name
            else file.owner.email
        )

        access_users = list(file.access_list.all())
        user_list = [
            a.user.first_name if a.user.first_name else a.user.email
            for a in access_users
        ]

        if len(user_list) == 0:
            activity = "Only you"
        elif len(user_list) == 1:
            activity = user_list[0]
        else:
            activity = f"{user_list[0]} + {len(user_list)-1}"

        is_fav = current_user in file.favorited_by.all()

        result.append({
            "id": file.id,

            "title": file.original_name,
            "size": format_size(file.size),

            "shared_by": shared_by,

            "shared_on": file.created_at,

            "activity": activity,

            "url": f"/drive/view/{file.original_name}",
            "is_image": file.content_type.startswith("image"),
            "is_favorite": is_fav,
        })

    return result

@router.get("/shared-by-me")
async def shared_by_me(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            owner_id=current_user.id,        
            access_list__isnull=False,
            is_trashed=False
        )
        .select_related("owner")
        .prefetch_related("access_list__user", "favorited_by")
        .distinct()
        .order_by("-created_at")
    )

    def format_size(size):
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size / 1024)} KB"
        else:
            return f"{round(size / (1024 * 1024), 1)} MB"

    result = []

    for file in files:

        access_users = list(file.access_list.all())

       
        user_list = [
            a.user.first_name if a.user.first_name else a.user.email
            for a in access_users
        ]

        if len(user_list) == 0:
            activity = "Only you"
        elif len(user_list) == 1:
            activity = user_list[0]
        else:
            activity = f"{user_list[0]} + {len(user_list)-1}"

        is_fav = current_user in file.favorited_by.all()

        result.append({
            "id": file.id,           
            "title": file.original_name,
            "size": format_size(file.size),
            "shared_by": "You",
            "shared_on": file.created_at,
            "activity": activity,
            "url": f"/drive/view/{file.original_name}",
            "is_image": file.content_type.startswith("image"),
            "is_favorite": is_fav,
        })

    return result

@router.delete("/{file_id}")
async def move_to_trash(file_id: int, current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _trash_db():
        try:
            file = DriveFile.objects.get(id=file_id, owner=current_user)
            
            if file.is_trashed:
                return False, "File is already in the trash"
            
            file.is_trashed = True
            file.deleted_at = timezone.now()    
            file.deleted_by = current_user
            file.save()
            
            return True, None
            
        except DriveFile.DoesNotExist:
            return False, "File not found"
 
    success, error = await _trash_db()
 
    if error == "File not found":
        raise HTTPException(status_code=404, detail=error)
    elif error == "File is already in the trash":
        raise HTTPException(status_code=403, detail=error)
 
    return {"message": "File moved to trash"}
     
@router.get("/trash")
async def get_trash(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            owner=current_user,
            is_trashed=True
        )
        .select_related("deleted_by", "created_by", "owner")
        .prefetch_related("access_list__user", "favorited_by")
        .order_by("-deleted_at")  
    )

    def format_size(size):
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size / 1024)} KB"
        else:
            return f"{round(size / (1024 * 1024), 1)} MB"

    result = []

    for file in files:

        
        deleted_by = (
            "You"
            if file.deleted_by_id == current_user.id
            else (file.deleted_by.first_name or file.deleted_by.email)
            if file.deleted_by else None
        )

        created_by = (
            "You"
            if file.created_by_id == current_user.id
            else (file.created_by.first_name or file.created_by.email)
            if file.created_by else (file.owner.first_name or file.owner.email)
        )
 
        access_users = list(file.access_list.all())

        user_list = [
            a.user.first_name if a.user.first_name else a.user.email
            for a in access_users
        ]

        if len(user_list) == 0:
            action = "Only you"
        elif len(user_list) == 1:
            action = user_list[0]
        else:
            action = f"{user_list[0]} + {len(user_list)-1}"

        is_fav = current_user in file.favorited_by.all()

        result.append({
            "id": file.id,
            "title": file.original_name,
            "size": format_size(file.size),
            "deleted_on": file.deleted_at,
            "deleted_by": deleted_by,
            "created_by": created_by,
            "action": action,
            "url": f"/drive/view/{file.original_name}",
            "is_image": file.content_type.startswith("image"),
            "is_favorite": is_fav,
        })

    return result

@router.delete("/trash/empty")
async def empty_trash(current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _empty_trash_db():
        trashed_files = DriveFile.objects.filter(owner=current_user, is_trashed=True)
        deleted_count = trashed_files.count()
        
        if deleted_count == 0:
            return 0
            
        for f in trashed_files:
            if f.file:
                
                f.file.delete(save=False)
                
        trashed_files.delete()
        
        return deleted_count
 
    deleted_count = await _empty_trash_db()
 
    if deleted_count == 0:
        return {"message": "Trash is already empty."}
 
    return {"message": f"Trash emptied successfully. {deleted_count} files permanently deleted."}
 
@router.delete("/trash/delete-selected")
async def delete_selected_files(
    data: DeleteFilesSchema,
    current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _delete_selected_db():
        
        files_to_delete = DriveFile.objects.filter(
            owner=current_user,
            id__in=data.file_ids,
            is_trashed=True
        )
        
        deleted_count = files_to_delete.count()
        
        if deleted_count == 0:
            return 0
            
        for f in files_to_delete:
            if f.file:
                f.file.delete(save=False)
                
        files_to_delete.delete()
        
        return deleted_count
 
    deleted_count = await _delete_selected_db()
 
    if deleted_count == 0:
        return {"message": "No valid files found to delete."}
 
    return {"message": f"{deleted_count} selected files permanently deleted."}
 
@router.patch("/{file_id}/restore")
async def restore_file(file_id: int, current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _restore_db():
        try:
            file = DriveFile.objects.get(id=file_id, owner=current_user)
            
            if not file.is_trashed:
                return False, "File is not currently in the trash"
            
            file.is_trashed = False
            file.deleted_at = None        
            file.deleted_by = None
            file.save()
            
            return True, None
            
        except DriveFile.DoesNotExist:
            return False, "File not found"
 
    success, error = await _restore_db()
 
    if error == "File not found":
        raise HTTPException(status_code=404, detail=error)
    elif error == "File is not currently in the trash":
        raise HTTPException(status_code=400, detail=error)
 
    return {"message": "File restored successfully"}
     
@router.post("/files/{file_id}/share")
async def share_file(file_id: int, email: str, permission: str, current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _share_db():
        User = get_user_model()
        
        try:
            file = DriveFile.objects.select_related("owner").get(id=file_id)
        except DriveFile.DoesNotExist:
            return None, "File not found"
 
        if file.owner_id != current_user.id:
            return None, "You do not have permission to share this file"
            
        if email == current_user.email:
            return None, "You already own this file!"
 
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None, "User with this email does not exist"
 
        access, created = FileAccess.objects.get_or_create(
            file=file,
            user=user,
            defaults={"permission": permission}
        )
 
        if not created:
            access.permission = permission
            access.save()
 
        return True, None
 
    success, error = await _share_db()
 
    if error == "File not found":
        raise HTTPException(status_code=404, detail=error)
    elif error == "You do not have permission to share this file":
        raise HTTPException(status_code=403, detail=error)
    elif error:
        raise HTTPException(status_code=400, detail=error)
 
    return {"message": "Access updated successfully"}

@router.post("/files/{file_id}/invite")
async def invite_user(
    file_id: int,
    request: InviteRequest,
    current_user=Depends(get_current_user)
):
    
    @sync_to_async
    def _invite_db():
        try:
            file = DriveFile.objects.get(id=file_id)
        except DriveFile.DoesNotExist:
            return None, "File not found"

        if file.owner_id != current_user.id:
            return None, "No permission"

        if request.email == current_user.email:
            return None, "Cannot invite yourself"

        invite, created = FileInvite.objects.get_or_create(
            file=file,
            email=request.email,
            defaults={
                "permission": request.permission,
                "invited_by": current_user
            }
        )

        if not created:
            return None, "Already invited"

        return invite.id, None

    invite_id, error = await _invite_db()

    if error:
        if error == "File not found":
            raise HTTPException(status_code=404, detail=error)
        else:
            raise HTTPException(status_code=403, detail=error)
 
    return {
        "status": "success",
        "message": f"Invitation sent to {request.email}",
        "invite_id": invite_id
    }

@router.post("/files/{file_id}/copy-link")
async def copy_link(file_id: int, current_user=Depends(get_current_user)):

    @sync_to_async
    def _create_link():
        try:
            file = DriveFile.objects.get(id=file_id)

            if file.owner_id != current_user.id:
                return None, "No permission"

            link = FileLink.objects.create(
                file=file,
                created_by=current_user
            )

            return link, None

        except DriveFile.DoesNotExist:
            return None, "File not found"

    link, error = await _create_link()

    if error:
        status_code = 404 if "not found" in error else 403
        raise HTTPException(status_code=status_code, detail=error)
 
    return {
        "status": "success",
        "message": "Link generated successfully",
        "link_id": link.id,
        "token": link.token,
        # Construct the full URL if needed
        "share_link": f"http://127.0.0.1:8000/drive/share/{link.token}"
    }

@router.get("/invites")
async def get_my_invites(current_user=Depends(get_current_user)):

    invites = await sync_to_async(list)(
        FileInvite.objects.filter(
            email=current_user.email,
            accepted=False
        ).select_related("file", "invited_by")
    )

    result = []
    for inv in invites:
        result.append({
            "invite_id": inv.id,
            "file_name": inv.file.original_name,
           "invited_by": inv.invited_by.email if inv.invited_by else "System",
            "permission": inv.permission,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        })

    return result

@router.post("/invites/{invite_id}/accept")
async def accept_invite(invite_id: int, current_user=Depends(get_current_user)):

    @sync_to_async
    def _accept():
        try:
            invite = FileInvite.objects.select_related("file").get(id=invite_id)
        except FileInvite.DoesNotExist:
            return None, "Invite not found"

        if invite.email != current_user.email:
            return None, "Not your invite"

        if invite.accepted:
            return None, "Already accepted"

        FileAccess.objects.get_or_create(
            file=invite.file,
            user=current_user,
            defaults={"permission": invite.permission}
        )

        invite.accepted = True
        invite.save()

        return invite, None

    invite, error = await _accept()

    if error:
        status_code = 404 if "not found" in error else 400
        raise HTTPException(status_code=status_code, detail=error)
 
    return {
        "status": "success",
        "message": "Invite accepted. You now have access to the file.",
        "file_id": invite.file.id  
    }
 
@router.get("/files/{file_id}/access")
async def get_access(file_id: int, current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _get_access_db():
        try:
            file = DriveFile.objects.select_related("owner").get(id=file_id)
        except DriveFile.DoesNotExist:
            return None, "File not found"
 
        if file.owner_id != current_user.id:
            return None, "You do not have permission to view this file's access list"
 
        access_list = FileAccess.objects.filter(file=file).select_related("user")
        
        result = []
        for a in access_list:
            display_name = a.user.first_name if a.user.first_name else a.user.email
            
            result.append({
                "id": a.user.id,  
                "username": display_name,
                "email": a.user.email,
                "permission": a.permission,
                "is_owner": getattr(a, "is_owner", False)
            })
            
        return result, None
 
    access_data, error = await _get_access_db()
 
    if error == "File not found":
        raise HTTPException(status_code=404, detail=error)
    elif error == "You do not have permission to view this file's access list":
        raise HTTPException(status_code=403, detail=error)
 
    return access_data
 
@router.put("/files/{file_id}/access/{user_id}")
async def update_permission(
    file_id: int,
    user_id: int,
    permission: str,
    current_user=Depends(get_current_user)):
    
    @sync_to_async
    def _update_permission_db():
        User = get_user_model()
        
        try:
            file = DriveFile.objects.get(id=file_id)
        except DriveFile.DoesNotExist:
            return None, "File not found"
            
        if file.owner_id != current_user.id:
            return None, "You do not have permission to modify access for this file"
 
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None, "Target user not found"
 
        access, created = FileAccess.objects.update_or_create(
            file=file,
            user=target_user,
            defaults={"permission": permission}
        )
 
        return created, None
 
    created, error = await _update_permission_db()
 
    if error in ["File not found", "Target user not found"]:
        raise HTTPException(status_code=404, detail=error)
    elif error == "You do not have permission to modify access for this file":
        raise HTTPException(status_code=403, detail=error)
 
    return {
        "message": "Permission updated successfully",
        "created": created
    }
 
@router.delete("/files/{file_id}/access/{user_id}")
async def remove_access(file_id: int, user_id: int, current_user=Depends(get_current_user)):

    await sync_to_async(
        FileAccess.objects.filter(
            file_id=file_id,
            user_id=user_id
        ).delete
    )()

    return {"message": "Access removed"}

@router.get("/open/{token}")
async def open_file(token: str):

    @sync_to_async
    def _get_file():
        try:
            link = FileLink.objects.select_related("file").get(
                token=token,
                is_active=True
            )
            return link.file, None
        except FileLink.DoesNotExist:
            return None, "Invalid or expired link"

    file, error = await _get_file()

    if error:
        raise HTTPException(status_code=404, detail=error)

    file_path = str(file.file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    mime_type, _ = mimetypes.guess_type(file_path)

    return FileResponse(
        file_path,
        media_type=mime_type or "application/octet-stream",
        filename=file.original_name
    )

@router.get("/view/{filename}")
async def view_file(
    filename: str,
    current_user=Depends(get_current_user)
):
    file = await sync_to_async(DriveFile.objects.filter(
        original_name=filename,
        is_trashed=False
    ).first)()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    has_access = (
        file.owner_id == current_user.id or
        await sync_to_async(FileAccess.objects.filter(
            file=file,
            user=current_user
        ).exists)()
    )

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to view this file.")

    db_path = file.file.name 

    clean_path = db_path
    if clean_path.startswith('media/'):
        clean_path = clean_path[6:]
    elif clean_path.startswith('media\\'):
        clean_path = clean_path[6:]

    full_path = os.path.normpath(os.path.join(settings.MEDIA_ROOT, clean_path))

    if not os.path.exists(full_path):
        print(f"DEBUG: Still failing. Tried: {full_path}")
        raise HTTPException(status_code=404, detail="The physical file is missing. Check your media/drive folder.")

    mime_type, _ = mimetypes.guess_type(full_path)

    return FileResponse(
        path=full_path,
        media_type=mime_type or "application/octet-stream",
        filename=file.original_name
    )

@router.get("/media", response_model=MediaGroupedResponse)
async def get_media_files(current_user=Depends(get_current_user)):

    @sync_to_async
    def _get_media():
        media_extensions = [
            ".jpg", ".jpeg", ".png", ".gif",
            ".webp", ".mp4", ".mov", ".avi", ".mkv"
        ]

        files = DriveFile.objects.filter(
            owner=current_user,
            is_trashed=False
        ).order_by("-created_at")

        grouped_files = defaultdict(list)

        for file in files:
            file_name = file.original_name.lower()

            if any(file_name.endswith(ext) for ext in media_extensions):
                date_label = file.created_at.strftime("%b %d")

                grouped_files[date_label].append({
                    "id": file.id,
                    "original_name": file.original_name,
                    "size": file.size,
                    "content_type": file.content_type,
                    "created_at": file.created_at,
                    "url": file.file.url if file.file else None,
                    "file_path": file.file.path if file.file else None,
                    "is_image": file.content_type.startswith("image"),
                    "is_favorite": current_user in file.favorited_by.all(),
                    "is_shared": file.access_list.exists(),
                })

        return {
            "status": "success",
            "media_files": dict(grouped_files)
        }

    return await _get_media()

@router.get("/browse/people", response_model=List[BrowseByPersonResponse])
async def browse_people(current_user=Depends(get_current_user)):
    return await get_browse_people_data(current_user)


@router.get("/meetings")
async def get_drive_meetings(current_user=Depends(get_current_user)):

    def _sync():
        meetings = Meeting.objects.filter(
            Q(host=current_user) |
            Q(participants=current_user)
        ).order_by("-created_at")

        return [
            {
                "id": m.id,
                "title": m.title,
                "meeting_code": m.meeting_code,
                "call_type": m.call_type,
                "created_at": m.created_at,
                "participants": [
                    {
                        "id": u.id,
                        "name": u.first_name or u.email
                    }
                    for u in m.participants.all()
                ]
            }
            for m in meetings
        ]

    return await sync_to_async(_sync)()