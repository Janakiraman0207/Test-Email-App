from django.db.models import Q, Prefetch
from asgiref.sync import sync_to_async
from django_backend.models import DriveFile, User, FileAccess, Meeting
 
@sync_to_async
def get_browse_people_data(current_user):
   
    shared_files_qs = DriveFile.objects.filter(
        Q(owner=current_user) | Q(access_list__user=current_user)
    ).distinct().order_by("-created_at")
 
    collaborators = User.objects.filter(
    Q(created_files__access_list__user=current_user) |
    Q(fileaccess__file__owner=current_user)           
).exclude(id=current_user.id).distinct().prefetch_related(
    Prefetch(
        "created_files",
        queryset=shared_files_qs,
        to_attr="owned_shared_files"
    ),
    Prefetch(
        "fileaccess_set",
        queryset=FileAccess.objects.filter(file__owner=current_user).select_related('file'),
        to_attr="guest_shared_files"
    )
)
 
    response = []
 
    for collaborator in collaborators:
       
        owned = list(collaborator.owned_shared_files)
        guest_access = [fa.file for fa in collaborator.guest_shared_files]

        all_shared_files = sorted(
            owned + guest_access,
            key=lambda x: x.created_at,
            reverse=True
        )
        
        preview_files = all_shared_files[:2]

        user_meetings = Meeting.objects.filter(participants=collaborator).order_by("-created_at")

        preview_meetings = user_meetings[:2]

        profile_url = None
        if hasattr(collaborator, 'profile_image') and collaborator.profile_image:
            try:
                profile_url = collaborator.profile_image.url
            except (ValueError, AttributeError):
                profile_url = None
 
        response.append ({
            "user_id": collaborator.id,
            "first_name": collaborator.first_name,
            "last_name": collaborator.last_name,
            "profile_image": profile_url,

            "recent_files": [
                {
                    "id": f.id,
                    "original_name": f.original_name,
                    "created_at": f.created_at,
                    "content_type": f.content_type,
                }
                for f in preview_files
            ],
            "additional_files_count": max(len(all_shared_files) - 2, 0),
        
            "meetings": [
            {
                "id": m.id,
                "title": m.title,
                "meeting_code": m.meeting_code,
                "call_type": m.call_type,
                "created_at": m.created_at,
            }
            for m in preview_meetings
        ],

            "meetings_count": user_meetings.count()
    
        })
 
    return response