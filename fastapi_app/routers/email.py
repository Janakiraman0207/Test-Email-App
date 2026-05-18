
from datetime import date, datetime
from typing import List, Optional, Union
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from django.contrib.auth import get_user_model
from django.utils import timezone
from asgiref.sync import sync_to_async

from fastapi_app.routers.auth import get_current_user
from fastapi_app.utils.notifications import create_notification
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.base import ContentFile
from django_backend.models import Email,EmailState, User, Attachment, Recipient
from fastapi_app.schemas.email_schemas import (EmailCreate, EmailReply, EmailUpdate, DraftCreate, BulkUpdateRequest, 
EmailRead, SnoozeRequest, BulkReadRequest)
from django.db.models import Q, Count
from fastapi_app.dependencies.permissions import get_current_user  
from pathlib import Path
import shutil
import os
from fastapi_app.tasks import send_email_task, send_scheduled_email
from fastapi import UploadFile
from fastapi_app.utils.file_convert import docx_to_pdf
from fastapi_app.utils.email_utils import smtp_send
from django.db import transaction

router = APIRouter()
User = get_user_model()

def ensure_stackly_email(email: str):
    email = email.strip()
    
    if "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )

    local_part, domain = email.rsplit("@", 1)

    if domain.lower() != "thestackly.com":
        raise HTTPException(
            status_code=400,
            detail="Only thestackly.com email addresses are allowed"
        )
        
def get_attachments(email_obj):
    return [
        {"filename": os.path.basename(a.file.name), "url": a.file.url,"size": a.file.size } 
        for a in email_obj.attachments.all()
    ]  

FRIENDS_LIST = {
             "karthik@gmail.com",
             "arun@gmail.com",
             "aishu@gmail.com",
             "sneha@gmail.com",
}

def detect_label(email: str):
        email = email.lower()
        domain = email.split("@")[-1]

        if email in FRIENDS_LIST:
            return "FRIENDS"

        if domain == "thestackly.com":
             return "COLLEAGUE"

        if domain == "stackly.com":
             return "OFFICE"

        return "OTHERS"         

def get_user_display(user):
    name = f"{user.first_name} {user.last_name}".strip()
    return name if name else user.email

def send_welcome_email(new_user):
    try:
        subject = "Welcome to Stackly"
        body = f"""
Hi {new_user.first_name} {new_user.last_name},

Welcome to Stackly! 

Your account has been successfully created.

You can now start sending and receiving emails.

Best regards,
Stackly Team
"""

        #  CREATE EMAIL (system email - no sender)
        email_obj = Email.objects.create(
            subject=subject,
            body=body,
            status="SENT"
        )

        #  IMPORTANT: recipient = THIS is what makes inbox work
        Recipient.objects.create(
            email=email_obj,
            user=new_user,
            recipient_type="TO"
        )

        #  OPTIONAL: tracking state (not required for inbox but ok)
        EmailState.objects.create(
            user=new_user,
            email=email_obj,
            is_read=False,
            is_important=False,
            is_favorite=False,
            is_archived=False,
            is_spam=False,
            is_deleted=False
        )

        #  SEND EMAIL
        smtp_send(email_obj)

        print("WELCOME EMAIL TRIGGERED")
        print("EMAIL ID:", email_obj.id)

    except Exception as e:
        print("Welcome email failed:", e)
       
@router.post("/send")

async def send_email( 

    to: Optional[List[str]] = Form(None),

    cc: Optional[List[str]] = Form(None),

    bcc: Optional[List[str]] = Form(None),

    subject: str = Form(...),

    body: str = Form(...),

    schedule_at: Optional[datetime] = Form(None),

    files: Optional[List[UploadFile]] = File(None),

    current_user: User = Depends(get_current_user)

):

    if not current_user:

        raise HTTPException(status_code=401, detail="Authentication failed or user context lost.")
 
    schedule_dt = schedule_at
 
    to_list = []

    if to:

        for email in to:

            to_list.extend([e.strip() for e in email.split(",") if e.strip()])
 
    cc_list = []

    if cc:

        for email in cc:

            cc_list.extend([e.strip() for e in email.split(",") if e.strip()])
 
    bcc_list = []

    if bcc:

        for email in bcc:

            bcc_list.extend([e.strip() for e in email.split(",") if e.strip()])
 
    if not to_list and not cc_list and not bcc_list:

        raise HTTPException(status_code=400, detail="At least one recipient (TO, CC, or BCC) is required")

    label = "OTHERS"

    if to_list:        

        label = detect_label(to_list[0])    

    elif cc_list:        

        label = detect_label(cc_list[0])

    elif bcc_list:

        label = detect_label(bcc_list[0])
 

    file_data_list = []

    if files:

        for f in files:

            if f and f.filename:

                content = await f.read() 

                file_data_list.append((f.filename, content))
 
    @sync_to_async

    def _sync_send_logic():

        ensure_stackly_email(current_user.email)

        with transaction.atomic():

            email_obj = Email.objects.create(

                sender=current_user,

                subject=subject,

                body=body,

                status="SCHEDULED" if schedule_dt else "OUTBOX",

                scheduled_at=schedule_dt,

            )
 
            EmailState.objects.create(

                user=current_user,

                email=email_obj,

                is_read=True,

                is_favorite=False,

                is_archived=False,

                is_spam=False,

                is_deleted=False

            )
 
            def process_recipient(email_address, r_type):
                ensure_stackly_email(email_address)

                try:
                    user = User.objects.get(
                        email__iexact=email_address
                    )

                except User.DoesNotExist:
                    raise HTTPException(
                        status_code=404,
                        detail=f"{email_address} does not exist"
                    )

                Recipient.objects.create(
                    email=email_obj,
                    user=user,
                    recipient_type=r_type
                )

                # Create inbox state only for immediate mails
                if not schedule_dt:
                    EmailState.objects.get_or_create(
                        user=user,
                        email=email_obj,
                        defaults={
                            'is_read': False,
                            'is_favorite': False,
                            'is_archived': False,
                            'is_spam': False,
                            'is_deleted': False
                        }
                    )

                return user
 
            to_users = [process_recipient(e, "TO") for e in to_list]

            cc_users = [process_recipient(e, "CC") for e in cc_list]

            bcc_users = [process_recipient(e, "BCC") for e in bcc_list]
 
            all_receivers = to_users + cc_users + bcc_users
 

            for filename, file_content in file_data_list:

                attachment = Attachment.objects.create(email=email_obj)

                attachment.file.save(

                    filename,

                    ContentFile(file_content),

                    save=True

                )
 
                        # Immediate send
            if not schedule_dt:

                try:

                    smtp_send(email_obj)

                    # Create inbox states for receivers
                    for recipient in email_obj.recipients.all():

                        EmailState.objects.get_or_create(
                            user=recipient.user,
                            email=email_obj,
                            defaults={
                                'is_read': False,
                                'is_favorite': False,
                                'is_archived': False,
                                'is_spam': False,
                                'is_deleted': False
                            }
                        )

                    email_obj.status = "SENT"

                    email_obj.save(update_fields=["status"])

                    for user in all_receivers:

                        create_notification(
                            recipient=user,
                            message=f"New email from {current_user.email}: {subject}",
                            type_choice="email"
                        )

                except Exception as e:

                    email_obj.status = "FAILED"

                    email_obj.save(update_fields=["status"])

                    print(f"SMTP Error: {e}")

            # Scheduled mail stays in OUTBOX
            else:

                email_obj.status = "SCHEDULED"

                email_obj.save(update_fields=["status"])

            return email_obj, to_users, cc_users, bcc_users
 
    try:


        email_obj, to_users, cc_users, bcc_users = await _sync_send_logic()

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
 
    return {

        "message": "Email scheduled successfully" if schedule_dt else "Email sent successfully",

        "id": email_obj.id,

        "to": [{"email": u.email, "first_name": u.first_name, "last_name": u.last_name} for u in to_users],

        "cc": [{"email": u.email, "first_name": u.first_name, "last_name": u.last_name} for u in cc_users],

        "bcc": [{"email": u.email, "first_name": u.first_name, "last_name": u.last_name} for u in bcc_users],

    }
             
@router.post("/reply")
def reply_email(
    data: EmailReply,
    current_user: User = Depends(get_current_user)
):
    ensure_stackly_email(current_user.email)

    try:
        parent_state = EmailState.objects.select_related('email', 'email__sender').exclude(
            email__status__in=['DRAFT', 'SCHEDULED']
        ).get(
            email_id=data.email_id, 
            user=current_user,
            is_deleted=False
        )    
        parent = parent_state.email
    except EmailState.DoesNotExist:
        raise HTTPException(
            status_code=404, 
            detail="Original email not found in your account"
        )
        
    with transaction.atomic():
        reply = Email.objects.create(
            sender=current_user,
            subject=f"Re: {parent.subject}" if not parent.subject.startswith("Re:") else parent.subject,
            body=data.body,
            parent=parent,
            status='OUTBOX'
        )
        
    Recipient.objects.create(
        email=reply,
        user=parent.sender,
        recipient_type='TO'
        )
    
    EmailState.objects.create(
        user=current_user,
        email=reply,
        is_read=True 
    )
    
    EmailState.objects.create(
        user=parent.sender,
        email=reply,
        is_read=False
    )
    
    try:
        smtp_send(reply)      
        reply.status = "SENT"  
        reply.save(update_fields=['status']) 
        
        create_notification(
            recipient=parent.sender,
            message=f"New reply from {current_user.email}: {reply.subject}",
            type_choice="email"
        )          
    except Exception as e:
        reply.status = "FAILED"
        reply.save(update_fields=['status'])
        print(f"SMTP Error on Reply: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email via SMTP")
    
    return {"message": "Reply sent successfully", "id": reply.id}


@router.get("/inbox")
def inbox(
    q: Optional[str] = None,
    sender: Optional[str] = None,
    label: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    include_snoozed: bool = Query(False),

    sort_by: str = Query("date"),     
    order: str = Query("desc"),     

    current_user: User = Depends(get_current_user)
):
    now = timezone.now()

    EmailState.objects.filter(
        user=current_user,
        snoozed_until__lte=now
    ).update(
        snoozed_until=None,
        last_visible_at=now
    )

    state_qs = EmailState.objects.select_related(
        'email', 'email__sender'
    ).prefetch_related(
        'email__recipients',
        'email__recipients__user',
        'email__attachments'
    ).filter(
        user=current_user,
        email__recipients__user=current_user,
        is_deleted=False,
        is_archived=False,
        is_spam=False
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).distinct()

    # 🔥 STEP 3: SNOOZE FILTER
    if not include_snoozed:
        state_qs = state_qs.exclude(
            snoozed_until__gt=now
        )


    if q:
        state_qs = state_qs.filter(
            Q(email__subject__icontains=q) |
            Q(email__body__icontains=q)
        )
        
        new_recipients = []
        state_objects = []
        notified_users = set() 
        
        if parent.sender != current_user:
            new_recipients.append(Recipient(email=reply, user=parent.sender, recipient_type='TO'))
            state_objects.append(EmailState(user=parent.sender, email=reply, is_read=False))
            notified_users.add(parent.sender)

    if sender:
        state_qs = state_qs.filter(
            email__sender__email__icontains=sender
        )

    if date_from:
        state_qs = state_qs.filter(
            email__created_at__date__gte=date_from
        )

    if date_to:
        state_qs = state_qs.filter(
            email__created_at__date__lte=date_to
        )

    if label:
        state_qs = state_qs.filter(
            email__label=label
        )


    sort_map = {
        "date": "email__created_at",
        "subject": "email__subject"
    }

    sort_field = sort_map.get(sort_by, "email__created_at")

    
    if order == "desc":
        sort_field = f"-{sort_field}"

    state_qs = state_qs.order_by(
        "-email__is_pinned",   
        sort_field,            
        "-last_visible_at"     
    )[:200]

    
    return [
        {
            "id": state.email.id,
            "from": get_user_display(state.email.sender),

            "to": ", ".join([
                get_user_display(r.user)
                for r in state.email.recipients.all()
                if r.recipient_type == 'TO'
            ]),

            "cc": ", ".join([
                get_user_display(r.user)
                for r in state.email.recipients.all()
                if r.recipient_type == 'CC'
            ]),

            "bcc": ", ".join([
                get_user_display(r.user)
                for r in state.email.recipients.all()
                if r.recipient_type == 'BCC'
            ]) if state.email.sender == current_user else "",

            "subject": state.email.subject,

            "body": state.email.body,

            "date": state.email.created_at,

            "is_important": state.is_important,

            "is_favorite": state.is_favorite,

            "is_archived": state.is_archived,

            "is_read": state.is_read,

            "is_spam": state.is_spam,

            "is_pinned": getattr(state.email, 'is_pinned', False),

            "snoozed_until": state.snoozed_until,

            "has_invites": getattr(state.email, 'has_invites', False), 

            "attachments": get_attachments(state.email)

        }

        for state in state_qs

    ]
    
@router.get("/outbox", response_model=List[EmailRead])
def get_outbox(current_user: User = Depends(get_current_user)):
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,                      
        email__sender_id=current_user.id,
        email__status__in=['OUTBOX', 'FAILED', 'SCHEDULED'],
        is_deleted=False                        
    ).order_by("-email__created_at")
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "status": state.email.status,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": getattr(state, "is_spam", False),
            "snoozed_until": getattr(state, "snoozed_until", None),

            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]

@router.get("/sent")

def sent(current_user: User = Depends(get_current_user)):

    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(

        'email__recipients', 'email__recipients__user', 'email__attachments'

    ).filter(

        user=current_user,                  

        email__sender=current_user,        

        email__status='SENT',

        is_deleted=False                    

    ).exclude(

        email__status__in=['DRAFT', 'SCHEDULED'] 

    ).order_by("-email__created_at")

    return [

        {

            "id": state.email.id, 

            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),

            "sender_name": (

                f"{state.email.sender.first_name} {state.email.sender.last_name}".strip()

                if f"{state.email.sender.first_name} {state.email.sender.last_name}".strip()

                else state.email.sender.email

            ),

            "sender": {

                "email": state.email.sender.email,

                "first_name": state.email.sender.first_name,

                "last_name": state.email.sender.last_name

            },

            "to": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'TO'

            ],

            "cc": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'CC'

            ],

            "bcc": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'BCC'

            ],

            "subject": state.email.subject,

            "body": state.email.body,

            "date": state.email.created_at,

            "is_important": state.is_important,

            "is_favorite": state.is_favorite,

            "is_archived": state.is_archived,

            "is_read": state.is_read,

            "is_spam": state.is_spam,

            "snoozed_until": state.snoozed_until,

            "has_invites": getattr(state.email, 'has_invites', False), 

            "attachments": get_attachments(state.email)

        }

        for state in state_qs

    ]
 
@router.get("/drafts", response_model=List[EmailRead])
def list_drafts(current_user: User = Depends(get_current_user)):
    
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,               
        email__sender=current_user,      
        email__status='DRAFT',           
        is_deleted=False,                
        is_archived=False                
    ).order_by("-email__created_at")
    
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,   
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
            "to": [
                {
                    "email": r.user.email, 
                    "first_name": r.user.first_name, 
                    "last_name": r.user.last_name
                } 
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email, 
                    "first_name": r.user.first_name, 
                    "last_name": r.user.last_name
                } 
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email, 
                    "first_name": r.user.first_name, 
                    "last_name": r.user.last_name
                } 
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ],
            
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "status": state.email.status,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": state.is_spam,
            "snoozed_until": state.snoozed_until,
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]


@router.get("/thread/{email_id}")

def email_thread(

    email_id: int,

    current_user: User = Depends(get_current_user)

):

    try:

       root_state = EmailState.objects.get(

            email_id=email_id, 

            user=current_user,

            is_deleted=False 

        )

    except EmailState.DoesNotExist:

        raise HTTPException(status_code=404, detail="Email not found in your account")

    thread_states = EmailState.objects.select_related(

        'email', 'email__sender'

    ).prefetch_related(

        'email__recipients', 'email__recipients__user','email__attachments'

    ).filter(

        user=current_user,

        is_deleted=False

    ).filter(

        Q(email_id=email_id) | Q(email__parent_id=email_id)

    ).order_by('email__created_at')


    unread_state_ids = [state.id for state in thread_states if not state.is_read]

    if unread_state_ids:

        EmailState.objects.filter(id__in=unread_state_ids).update(is_read=True)
 
    return [

        {

            "id": state.email.id,

            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),


            "sender_name": (

                f"{state.email.sender.first_name} {state.email.sender.last_name}".strip()

                if f"{state.email.sender.first_name} {state.email.sender.last_name}".strip()

                else state.email.sender.email

            ),

            "sender": {

                "email": state.email.sender.email,

                "first_name": state.email.sender.first_name,

                "last_name": state.email.sender.last_name

            },

            "to": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'TO'

            ],

            "cc": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'CC'

            ],

            "bcc": [

                {

                    "email": r.user.email, 

                    "first_name": r.user.first_name, 

                    "last_name": r.user.last_name

                } 

                for r in state.email.recipients.all() if r.recipient_type == 'BCC'

            ] if state.email.sender == current_user else [],

            "subject": state.email.subject,

            "body": state.email.body,

            "date": state.email.created_at,

            "is_read": True, 

            "is_important": state.is_important,

            "is_favorite": state.is_favorite,

            "has_invites": getattr(state.email, 'has_invites', False), 

            "attachments": get_attachments(state.email)

        }

        for state in thread_states

    ]
 
@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int, current_user: User = Depends(get_current_user)):
    try:
       
        state_obj = EmailState.objects.get(email_id=email_id, user=current_user)
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found in your account")
 
    state_obj.is_deleted = True
    state_obj.trashed_at = timezone.now()
    state_obj.save(update_fields=['is_deleted', 'trashed_at'])
 
    return None        

@router.patch("/{email_id}")
def update_email_flags(
    email_id: int,
    data: EmailUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        state_obj = EmailState.objects.get(
            email_id=email_id,
            user=current_user
        )
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found in your account")
 
    update_data = data.model_dump(exclude_unset=True)
 
    for key, value in update_data.items():
        setattr(state_obj, key, value)    
   
    if update_data:
        state_obj.save(update_fields=list(update_data.keys()))
       
    return {"message": "Email flags updated successfully",
            "id": email_id,
        "is_read": state_obj.is_read,
        "is_important": state_obj.is_important,
        "is_favorite": state_obj.is_favorite,
        "is_archived": state_obj.is_archived,
        "is_spam": state_obj.is_spam,
        "is_deleted": state_obj.is_deleted
    }

@router.get("/unread-count")
def get_unread_email_count(current_user: User = Depends(get_current_user)):
   
    unread_count = EmailState.objects.filter(
        user=current_user,                        
        is_read=False,                      
        is_deleted=False,                  
        is_archived=False,
        is_spam=False
    ).exclude(
        email__sender=current_user                  
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).count()
   
    return {"unread_count": unread_count}
 
@router.patch("/bulk/update")
def bulk_update_emails(
    payload: BulkUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    update_data = payload.model_dump(exclude_unset=True, exclude={'ids'})
   
    if not payload.ids or not update_data:
        raise HTTPException(status_code=400, detail="No email IDs or update flags provided")
 
    updated_count = EmailState.objects.filter(
        email_id__in=payload.ids,
        user=current_user
    ).update(**update_data)
   
    return {
        "message": f"Successfully updated {updated_count} emails",
        "updated_count": updated_count
    }
 
@router.post("/draft")
def save_draft(
    data: DraftCreate,
    current_user: User = Depends(get_current_user)
):
    ensure_stackly_email(current_user.email)
 
    try:
        with transaction. atomic():
            draft = Email.objects.create(
                sender=current_user,
                subject=data.subject or "(No Subject)",
                body=data.body or "",
                status='DRAFT'
    )
   
            def add_recipients(email_list, recipient_type):
                if not email_list:
                    return
                
                for email_address in email_list:
                    if not email_address.strip():
                        continue

                    ensure_stackly_email(email_address)

                    try:
                        recipient_user = User.objects.get(email=email_address)
                    except User.DoesNotExist:
                        raise HTTPException(status_code=404, detail=f"Recipient not found: {email_address}")
                        
                    Recipient.objects.create(
                        email=draft,
                        user=recipient_user,
                        recipient_type=recipient_type
                    )

            add_recipients(getattr(data, 'to', []), 'TO')
            add_recipients(getattr(data, 'cc', []), 'CC')
            add_recipients(getattr(data, 'bcc', []), 'BCC')

            EmailState.objects.create(
                user=current_user,
                email=draft,
                is_read=True
            )
                    
    except HTTPException:
        raise

    return {"message": "Draft saved", "id": draft.id, "status": "DRAFT"}
 

@router.post("/{email_id}/publish")
def publish_draft(
    email_id: int,
    current_user: User = Depends(get_current_user)):
    try:
        sender_state = EmailState.objects.select_related('email').prefetch_related(
            'email__recipients', 'email__recipients__user'
        ).get(
            email_id=email_id,
            user=current_user,
            is_deleted=False,     
            email__status='DRAFT'
        )
        email_obj = sender_state.email
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Draft not found, deleted, or already sent.")
    
    all_recipients = email_obj.recipients.all()
    if not all_recipients:
         raise HTTPException(status_code=400, detail="Cannot send email without at least one recipient (TO, CC, or BCC)")
 
    with transaction.atomic():
        email_obj.status = 'OUTBOX'
        email_obj.created_at = timezone.now()
        email_obj.save(update_fields=['status', 'created_at'])
            
        for recipient_obj in all_recipients:
  
            EmailState.objects.get_or_create(
                user=recipient_obj.user,
                email=email_obj,
                defaults={'is_read': False}
            )
    
    try:
        smtp_send(email_obj)
        
        email_obj.status = 'SENT'
        email_obj.save(update_fields=['status'])
        
        for recipient_obj in all_recipients:
            create_notification(
                recipient=recipient_obj.user,
                message=f"New email from {current_user.email}: {email_obj.subject}",
                type_choice="email"
            )
    except Exception as e:
        email_obj.status = 'FAILED'
        email_obj.save(update_fields=['status'])
        print(f"SMTP Error during draft publish: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email via SMTP. Saved as FAILED.")
    
    return {
        "message": "Email sent successfully",
        "id": email_obj.id,
        "status": email_obj.status
    }

@router.patch("/draft/{email_id}")
def edit_draft(
    email_id: int,
    data: DraftCreate,  
    current_user: User = Depends(get_current_user)):
    try:
        state_obj = EmailState.objects.select_related('email').prefetch_related(
            'email__recipients', 'email__recipients__user'
        ).get(
            email_id=email_id,
            user=current_user,
            is_deleted=False,    
            email__status='DRAFT'
        )
        email_obj = state_obj.email
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Draft not found, deleted, or already sent.")
 
    try:
        with transaction.atomic():
            
            update_fields = []
            if data.subject is not None:
                email_obj.subject = data.subject
                update_fields.append('subject')
 
            if data.body is not None:
                email_obj.body = data.body
                update_fields.append('body')
 
            if update_fields:
                email_obj.save(update_fields=update_fields)
 
            if data.to is not None or data.cc is not None or data.bcc is not None:
                
                email_obj.recipients.all().delete()
                
                def add_recipients(email_list, recipient_type):
                    if not email_list:
                        return
                    for email_address in email_list:
                        if not email_address.strip():
                            continue
                        
                        ensure_stackly_email(email_address)
                        try:
                            recipient_user = User.objects.get(email=email_address)
                            Recipient.objects.create(
                                email=email_obj,
                                user=recipient_user,
                                recipient_type=recipient_type
                            )
                        except User.DoesNotExist:
                            raise HTTPException(status_code=404, detail=f"Recipient not found: {email_address}")
 
                add_recipients(getattr(data, 'to', []), 'TO')
                add_recipients(getattr(data, 'cc', []), 'CC')
                add_recipients(getattr(data, 'bcc', []), 'BCC')
                
    except HTTPException:
        raise
 
    return {
        "message": "Draft updated",
        "id": email_obj.id,
        "subject": email_obj.subject,
        "to": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in email_obj.recipients.all() if r.recipient_type == 'TO'
        ],
        "cc": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in email_obj.recipients.all() if r.recipient_type == 'CC'
        ],
        "bcc": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in email_obj.recipients.all() if r.recipient_type == 'BCC'
        ]
    }

@router.post("/{email_id}/forward")
def forward_email(
    email_id: int,
    new_receiver_email: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        original_state = EmailState.objects.select_related('email', 'email__sender').exclude(
            email__status__in=['DRAFT', 'SCHEDULED']
        ).get(
            email_id=email_id,
            user=current_user,
            is_deleted=False  
        )
        original = original_state.email
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Original email not found in your account")
 
    ensure_stackly_email(new_receiver_email)
    try:
        new_receiver = User.objects.get(email__iexact=new_receiver_email)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Receiver does not exist")
 
    new_subject = f"Fwd: {original.subject}"
    date_str = original.created_at.strftime('%Y-%m-%d %H:%M:%S')
    new_body = f"\n\n---------- Forwarded message ----------\nFrom: {original.sender.email}\nDate: {date_str}\n\n{original.body}"
 
    with transaction.atomic():
        forwarded_email = Email.objects.create(
            sender=current_user,
            subject=new_subject[:255],
            body=new_body,
            status='OUTBOX'
        )
       
        Recipient.objects.create(
            email=forwarded_email,
            user=new_receiver,
            recipient_type='TO'
        )
       
        for attachment in original.attachments.all():
            Attachment.objects.create(
                email=forwarded_email,
                file=attachment.file
            )
       
        EmailState.objects.create(
            user=current_user,
            email=forwarded_email,
            is_read=True
        )
       
        EmailState.objects.create(
            user=new_receiver,
            email=forwarded_email,
            is_read=False
        )
       
    try:
        smtp_send(forwarded_email)      
        forwarded_email.status = "SENT"  
        forwarded_email.save(update_fields=['status'])          
 
        create_notification(
            recipient=new_receiver,
            message=f"New forwarded email from {current_user.email}: {forwarded_email.subject}",
            type_choice="email"
        )
    except Exception as e:
        forwarded_email.status = "FAILED"
        forwarded_email.save(update_fields=['status'])
        print(f"SMTP Error on Forward: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email via SMTP")
   
    return {"message": "Email forwarded successfully", "id": forwarded_email.id}
 
@router.get("/archived")
def archived(current_user: User = Depends(get_current_user)):
   
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,
        is_archived=True,
        is_deleted=False
    ).order_by("-email__created_at")
 
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": state.is_spam,
            "snoozed_until": state.snoozed_until,
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]    
    
@router.get("/starred")
def starred(current_user: User = Depends(get_current_user)):
   
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,      
        is_favorite=True,        
        is_deleted=False        
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).order_by("-email__created_at")
 
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": getattr(state, "is_spam", False),
            "snoozed_until": getattr(state, "snoozed_until", None),
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]
     
@router.get("/important")
def important(current_user: User = Depends(get_current_user)):
   
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,      
        is_important=True,      
        is_deleted=False        
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).order_by("-email__created_at")
 
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": getattr(state, "is_spam", False),
            "snoozed_until": getattr(state, "snoozed_until", None),
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]
 
@router.get("/trash")
def trash(current_user: User = Depends(get_current_user)):
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,
        is_deleted=True  
    ).order_by("-trashed_at", "-email__created_at")
 
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "status": state.email.status,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": state.is_spam,
            "trashed_at": state.trashed_at,
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]
     
@router.post("/{email_id}/restore")
def restore_email(email_id: int, current_user: User = Depends(get_current_user)):
    try:
       state_obj = EmailState.objects.get(
            email_id=email_id,
            user=current_user
        )
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found in your account")
 
    if not state_obj.is_deleted:
        return {"message": "Email is already outside of the trash", "id": email_id}
 
    state_obj.is_deleted = False
    state_obj.trashed_at = None
   
    state_obj.save(update_fields=['is_deleted', 'trashed_at'])
 
    return {"message": "Email restored successfully", "id": email_id}

@router.delete("/trash/empty")
def empty_trash(current_user: User = Depends(get_current_user)):
    trashed_states = EmailState.objects.filter(
        user=current_user,
        is_deleted=True
    )
    deleted_count = trashed_states.count()
   
    if deleted_count == 0:
        return {"message": "Your trash is already empty.", "deleted_count": 0}
   
    with transaction.atomic():
       
        trashed_states.delete()
           
    Email.objects.filter(
        states__isnull=True
    ).delete()
 
    return {"message": f"Successfully deleted {deleted_count} emails permanently.", "deleted_count": deleted_count}  
 
@router.patch("/{email_id}/spam", response_model=EmailRead)
def mark_email_as_spam(
    email_id: int,
    current_user: User = Depends(get_current_user),
):
    try:
       state_obj = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
            'email__recipients', 'email__recipients__user', 'email__attachments'
        ).get(email_id=email_id,
            user=current_user
        )
    except EmailState.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found in your account",
        )
 
    state_obj.is_spam = True
    state_obj.save(update_fields=['is_spam'])
 
    return {
        "id": state_obj.email.id,
        "sender_id": state_obj.email.sender.id,
        "sender": {
            "email": state_obj.email.sender.email,
            "first_name": state_obj.email.sender.first_name,
            "last_name": state_obj.email.sender.last_name
        },
       
        "to": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in state_obj.email.recipients.all() if r.recipient_type == 'TO'
        ],
        "cc": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in state_obj.email.recipients.all() if r.recipient_type == 'CC'
        ],
        "bcc": [
            {
                "email": r.user.email,
                "first_name": r.user.first_name,
                "last_name": r.user.last_name
            }
            for r in state_obj.email.recipients.all() if r.recipient_type == 'BCC'
        ] if state_obj.email.sender == current_user else [],
        "subject": state_obj.email.subject,
        "body": state_obj.email.body,
        "date": state_obj.email.created_at,
        "status": state_obj.email.status,
        "is_important": state_obj.is_important,
        "is_favorite": state_obj.is_favorite,
        "is_archived": state_obj.is_archived,
        "is_read": state_obj.is_read,
        "is_spam": state_obj.is_spam,
        "snoozed_until": state_obj.snoozed_until,
        "attachments": get_attachments(state_obj.email)
    }

@router.get("/spam", response_model=List[EmailRead])
def list_spam_emails(current_user: User = Depends(get_current_user)):
   
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user', 'email__attachments'
    ).filter(
        user=current_user,      
        is_spam=True,            
        is_deleted=False
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']            
    ).order_by("-email__created_at")
   
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "status": state.email.status,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": state.is_spam,
            "snoozed_until": getattr(state, "snoozed_until", None),
           
            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]

@router.get("/unread", response_model=List[EmailRead])
def list_unread(current_user: User = Depends(get_current_user)):
   
    state_qs = EmailState.objects.select_related('email', 'email__sender').prefetch_related(
        'email__recipients', 'email__recipients__user'
    ).filter(
        user=current_user,                
        is_read=False,                  
        is_deleted=False,                
        is_spam=False,                  
        is_archived=False              
        ).exclude(
        email__sender=current_user
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).order_by("-email__created_at").distinct()
   
    return [
        {
            "id": state.email.id,
            "sender_id": state.email.sender.id,
            "sender_name": get_user_display(state.email.sender),
            "sender": {
                "email": state.email.sender.email,
                "first_name": state.email.sender.first_name,
                "last_name": state.email.sender.last_name
            },
           
            "to": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'TO'
            ],
            "cc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'CC'
            ],
            "bcc": [
                {
                    "email": r.user.email,
                    "first_name": r.user.first_name,
                    "last_name": r.user.last_name
                }
                for r in state.email.recipients.all() if r.recipient_type == 'BCC'
            ] if state.email.sender == current_user else [],
           
            "subject": state.email.subject,
            "body": state.email.body,
            "date": state.email.created_at,
            "status": state.email.status,
            "is_important": state.is_important,
            "is_favorite": state.is_favorite,
            "is_archived": state.is_archived,
            "is_read": state.is_read,
            "is_spam": getattr(state, "is_spam", False),
            "snoozed_until": getattr(state, "snoozed_until", None),

            "attachments": get_attachments(state.email)
        }
        for state in state_qs
    ]
 
@router.post("/mark-read")
def mark_all_read(
    data: BulkReadRequest,
    current_user: User = Depends(get_current_user)
):
   
    if not data.ids:
        return {
            "message": "No emails provided",
            "count": 0
        }
 
    updated_count = EmailState.objects.filter(
        email_id__in=data.ids,
        user=current_user,
        is_read=False
    ).update(is_read=True)
 
    return {
        "message": "Emails marked as read",
        "count": updated_count
    }
   
@router.patch("/{email_id}/snooze", response_model=EmailRead)
def snooze_mail(
    email_id: int,
    payload: SnoozeRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        state = EmailState.objects.select_related(
            'email', 'email__sender'
        ).prefetch_related(
            'email__recipients', 'email__recipients__user', 'email__attachments'
        ).get(
            email_id=email_id,
            user=current_user
        )

    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found in your account")

    now = timezone.now()

    if payload.snoozed_until is None:
        state.snoozed_until = None
        state.last_visible_at = now   # 🔥 important
        state.save(update_fields=['snoozed_until', 'last_visible_at'])

    else:
        # ✅ Validate future time
        if payload.snoozed_until <= now:
            raise HTTPException(
                status_code=400,
                detail="snoozed_until must be a future time"
            )

        state.snoozed_until = payload.snoozed_until
        state.save(update_fields=['snoozed_until'])

    email = state.email

    return {
    "id": email.id,

    "sender_id": email.sender.id,

    "sender": {
        "id": email.sender.id,
        "name": get_user_display(email.sender),
        "email": email.sender.email   
    },

    "to": [
        {
            "id": r.user.id,
            "name": get_user_display(r.user),
            "email": r.user.email     
        }
        for r in email.recipients.all()
        if r.recipient_type == 'TO'
    ],

    "cc": [
        {
            "id": r.user.id,
            "name": get_user_display(r.user),
            "email": r.user.email
        }
        for r in email.recipients.all()
        if r.recipient_type == 'CC'
    ],

    "bcc": [
        {
            "id": r.user.id,
            "name": get_user_display(r.user),
            "email": r.user.email
        }
        for r in email.recipients.all()
        if r.recipient_type == 'BCC'
    ] if email.sender == current_user else [],

    "subject": email.subject,
    "body": email.body,
    "date": email.created_at,

    "attachments": get_attachments(email),

    "is_important": state.is_important,
    "is_favorite": state.is_favorite,
    "is_archived": state.is_archived,
    "is_spam": state.is_spam,
    "is_read": state.is_read,

    "snoozed_until": state.snoozed_until,

    "is_snoozed": (
        state.snoozed_until is not None and
        state.snoozed_until > timezone.now()
    )
}

@router.get("/snoozed", response_model=list[EmailRead])
def snoozed_list(current_user: User = Depends(get_current_user)):
    now = timezone.now()

    state_qs = EmailState.objects.select_related(
        'email', 'email__sender'
    ).prefetch_related(
        'email__recipients',
        'email__recipients__user',
        'email__attachments'
    ).filter(
        user=current_user,
        snoozed_until__gt=now,
        is_deleted=False,
        is_spam=False,
        is_archived=False  
    ).distinct().order_by(
        "snoozed_until"
    )[:200]

    return [
    {
        "id": state.email.id,

        "sender_id": state.email.sender.id,

        "sender": {
            "id": state.email.sender.id,
            "name": get_user_display(state.email.sender),
            "email": state.email.sender.email
        },

        "to": [
            {
                "id": r.user.id,
                "name": get_user_display(r.user),
                "email": r.user.email
            }
            for r in state.email.recipients.all()
            if r.recipient_type == 'TO'
        ],

        "cc": [
            {
                "id": r.user.id,
                "name": get_user_display(r.user),
                "email": r.user.email
            }
            for r in state.email.recipients.all()
            if r.recipient_type == 'CC'
        ],

        "bcc": [
            {
                "id": r.user.id,
                "name": get_user_display(r.user),
                "email": r.user.email
            }
            for r in state.email.recipients.all()
            if r.recipient_type == 'BCC'
        ] if state.email.sender == current_user else [],

        "subject": state.email.subject,
        "body": state.email.body,
        "date": state.email.created_at,

        "attachments": get_attachments(state.email),

        "is_important": state.is_important,
        "is_favorite": state.is_favorite,
        "is_archived": state.is_archived,
        "is_spam": state.is_spam,
        "is_read": state.is_read,

        "snoozed_until": state.snoozed_until,

        "is_snoozed": True   #
    }
    for state in state_qs
]

@router.get("/sidebar-count")
def get_sidebar_counts(current_user: User = Depends(get_current_user)):
   
    user_id = current_user.id
 
    inbox_count = EmailState.objects.filter(
        user=current_user,
        is_deleted=False,
        is_archived=False,
        is_spam=False
    ).exclude(
        email__sender_id=user_id    
    ).exclude(
        email__status__in=['DRAFT', 'SCHEDULED']
    ).count()

    sent_count = EmailState.objects.filter(
        user=current_user,
        email__sender_id=user_id,
        is_deleted=False,
        is_archived=False,
        email__status='SENT'
    ).count()
   
    draft_count = EmailState.objects.filter(
        user=current_user,
        email__sender_id=user_id,
        email__status='DRAFT',
        is_deleted=False,
        is_archived=False
    ).count()
 
    scheduled_count = EmailState.objects.filter(
        user=current_user,
        email__sender_id=user_id,
        email__status='SCHEDULED',
        is_deleted=False,
        is_archived=False
    ).count()
 
    spam_count = EmailState.objects.filter(
        user=current_user,
        is_spam=True,
        is_deleted=False
    ).count()
 
    trash_count = EmailState.objects.filter(
        user=current_user,
        is_deleted=True
    ).count()
 
    return {
        "inbox": inbox_count,
        "sent": sent_count,
        "drafts": draft_count,
        "scheduled": scheduled_count,  
        "spam": spam_count,
        "trash": trash_count
    }

@router.put("/pin/{email_id}")
def pin_email(email_id: int, current_user: User = Depends(get_current_user)):
 
    try:
        state_obj = EmailState.objects.select_related('email').get(
            email_id=email_id,
            user=current_user
        )
       
        email_obj = state_obj.email
        email_obj.is_pinned = not email_obj.is_pinned  
        email_obj.save(update_fields=['is_pinned'])
 
        return {
            "message": f"Email {'pinned' if email_obj.is_pinned else 'unpinned'} successfully",
            "is_pinned": email_obj.is_pinned,
            "id": email_id
        }
 
    except EmailState.DoesNotExist:
        raise HTTPException(status_code=404, detail="Email not found in your account")
        

