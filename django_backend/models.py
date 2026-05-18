from django.db.models.signals import post_save
from django.db.models import Q
from django.dispatch import receiver
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, AbstractUser
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)
   
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
    )

    GENDER_CHOICES = (
    ("MALE", "Male"),
    ("FEMALE", "Female"),
    ("OTHER", "Other"),
    )
 
    gender = models.CharField(
    max_length=10,
    choices=GENDER_CHOICES,
    blank=True,
    null=True
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('IN_MEETING', 'In Meeting'),
        ('DND', 'Do Not Disturb'),
        ('BRB', 'Be Right Back'),
        ('AWAY', 'Appear Away'),
        ('OFFLINE', 'Offline'),
    )
    
    THEME_CHOICES = (
        ('light', 'Light Mode'),
        ('dark', 'Dark Mode'),
        ('dim', 'Dim Mode'),
        ('system', 'System Default'),
    )

    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
   
    dob = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) 
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF') 
    mobile_number = models.CharField(max_length=15, blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(null=True, blank=True)
   
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OFFLINE')
    is_manually_set = models.BooleanField(default=False)
    status_expiry = models.DateTimeField(null=True, blank=True)
    status_message = models.CharField(max_length=255, blank=True, null=True)
    
    signature = models.TextField(blank=True, null=True, help_text="User's email signature")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    last_active_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    
    vacation_mode_enabled = models.BooleanField(default=False)
    vacation_start_date = models.DateTimeField(null=True, blank=True)
    vacation_end_date = models.DateTimeField(null=True, blank=True)
    vacation_message = models.TextField(
         blank=True,
         default="I am currently out of the office and will reply upon my return."
     )

    def __str__(self):
        return self.email

class Email(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_emails",
        on_delete=models.CASCADE
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_emails",
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    subject = models.CharField(max_length=255)
    body = models.TextField()
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="replies",
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    is_pinned = models.BooleanField(default=False)

    is_deleted_by_sender = models.BooleanField(default=False)
    is_deleted_by_receiver = models.BooleanField(default=False)

    is_important = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    has_invites = models.BooleanField(default=False)

    
    labels = models.ManyToManyField(
        'Label',
        blank=True,
        related_name='emails'
    )
    
    @property
    def from_email(self) -> str:
        return self.sender.email if self.sender else ""

    @property
    def snippet(self) -> str:
        return (self.body or "")[:100]

    def __str__(self):
        receiver_email = self.receiver.email if self.receiver else "Draft"
        return f"{self.sender.email} -> {receiver_email}"
    snoozed_until = models.DateTimeField(null=True, blank=True)
    snoozed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="snoozed_emails",
    )

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("OUTBOX", "Outbox"),
        ("SCHEDULED", "Scheduled"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )

    scheduled_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)

    @property
    def is_snoozed(self):
        return self.snoozed_until is not None and self.snoozed_until > timezone.now()

    @property
    def from_email(self) -> str:
        return self.sender.email if self.sender else ""

    @property
    def snippet(self) -> str:
        return (self.body or "")[:100]

    def __str__(self):
        receiver_email = self.receiver.email if self.receiver else "Draft"
        return f"{self.sender.email} -> {receiver_email}"

class Label(models.Model):

    SHOW_LABEL_LIST_CHOICES = [
        ('show', 'Show'),
        ('hide', 'Hide'),
        ('show_if_unread', 'Show if unread'),
    ]

    SHOW_MESSAGE_LIST_CHOICES = [
        ('show', 'Show'),
        ('hide', 'Hide'),
    ]

    name = models.CharField(max_length=255)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='labels'
    )

    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children'
    )

    show_in_label_list = models.CharField(
        max_length=20,
        choices=SHOW_LABEL_LIST_CHOICES,
        default='show'
    )

    show_in_message_list = models.CharField(
        max_length=20,
        choices=SHOW_MESSAGE_LIST_CHOICES,
        default='show'
    )

    def __str__(self):
        return self.name
    
class EmailState(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_states"
    )

    email = models.ForeignKey(
        Email,
        on_delete=models.CASCADE,
        related_name="states"
    )

    is_read = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    trashed_at = models.DateTimeField(null=True, blank=True, db_index=True)

    snoozed_until = models.DateTimeField(null=True, blank=True)

    last_visible_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'email')

    @property
    def is_snoozed(self):
        return (
            self.snoozed_until is not None and
            self.snoozed_until > timezone.now()
        )

    def __str__(self):
        return f"{self.user.email} → Email {self.email.id}"

class Recipient(models.Model):

    email = models.ForeignKey(
        Email,
        related_name="recipients",
        on_delete=models.CASCADE
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    recipient_type = models.CharField(
        max_length=10,
        choices=[
            ("TO", "To"),
            ("CC", "Cc"),
            ("BCC", "Bcc"),
        ]
    )

    is_deleted = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} ({self.recipient_type})"
    
class Attachment(models.Model):
    email = models.ForeignKey(
    Email,
    on_delete=models.CASCADE,
    related_name="attachments"
)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for Email {self.email.id}"

class GeneralSettings(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="general_settings"
    )
    time_zone = models.CharField(max_length=64, default="UTC")
    desktop_notifications_enabled = models.BooleanField(default=True)
    sound_notifications_enabled = models.BooleanField(default=True)
    email_notifications_enabled = models.BooleanField(default=True)

    last_email_sent = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)


class ChatRoom(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)  

    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="chat_rooms"
    )

    last_message = models.ForeignKey(
        'ChatMessage', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="last_message_of_room"
    )
    
    related_email = models.OneToOneField(
        Email,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_room"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f"Room {self.id}"

class UserChatSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_settings")
    
    chat_push_enabled = models.BooleanField(default=True)
    chat_sounds_enabled = models.BooleanField(default=True)
    chat_email_alerts = models.BooleanField(default=False)
    
    read_receipts = models.BooleanField(default=True)
    show_last_seen = models.BooleanField(default=True)
    
    auto_download_media = models.BooleanField(default=False)
    enter_to_send = models.BooleanField(default=True)
    typing_indicators = models.BooleanField(default=True)
    
    dark_mode = models.BooleanField(default=False)
    compact_mode = models.BooleanField(default=False)

    def __str__(self):
        return f"Chat Settings for {self.user.username}"

class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="sent_chat_messages", on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')

    TYPE_CHOICES = (
        ('TEXT', 'Text'),
        ('SYSTEM', 'System Alert'),
        ('FILE', 'File'),
    )

    message_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='TEXT')
    content = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)

    link_url = models.URLField(blank=True, null=True)
    link_title = models.CharField(max_length=255, blank=True, null=True)
    link_description = models.TextField(blank=True, null=True)
    link_image = models.URLField(blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="read_messages",
        blank=True
    )
    starred_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="starred_chat_messages",
        blank=True
    )
    saved_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="saved_chat_messages",
        blank=True
    )

    is_deleted = models.BooleanField(default=False)
    is_forwarded = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    share_token = models.CharField(max_length=100, unique=True, null=True, blank=True, db_index=True)   
    mentions = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="mentioned_in_messages",
        blank=True
    )
    
    @classmethod
    def get_unread_filter(cls, user):
        
        return Q(is_deleted=False) & ~Q(sender=user) & ~Q(read_by=user)

    def __str__(self):
        return f"{self.sender.email}: {str(self.content)[:20]}"
    
class ChatMute(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chat = models.ForeignKey("ChatRoom", on_delete=models.CASCADE)
    muted_until = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "chat")

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#FFFFFF")

    def __str__(self):
        return self.name

class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="owned_projects", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="created_tasks", on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="assigned_tasks", null=True, blank=True, on_delete=models.SET_NULL) 
    due_date = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name="tasks", blank=True)
    project = models.ForeignKey(Project, related_name="tasks", on_delete=models.CASCADE, null=True, blank=True)
    
    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    )
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    email = models.ForeignKey(
    Email,
    related_name="tasks",
    null=True,
    blank=True,
    on_delete=models.SET_NULL
)
    
    STATUS_CHOICES = (
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.title

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    
    full_name = models.CharField(max_length=150)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)  
    tokens_valid_after = models.DateTimeField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_format = models.CharField(max_length=20, default="DD-MM-YYYY")
    language = models.CharField(max_length=20, default="en")
    store_activity = models.BooleanField(default=True)
    is_2fa_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)


    STATUS_AVAILABLE_NOW = "available_now"
    STATUS_AVAILABLE = "available"
    STATUS_BUSY = "busy"
    STATUS_DND = "dnd"
    STATUS_AWAY = "away"
    STATUS_OFFLINE = "offline"
    STATUS_OOO = "out_of_office"

    STATUS_CHOICES = [
    (STATUS_AVAILABLE_NOW, "Available now"),
    (STATUS_AVAILABLE, "Available"),
    (STATUS_BUSY, "Busy"),
    (STATUS_DND, "Do not disturb"),
    (STATUS_AWAY, "Appear away"),
    (STATUS_OFFLINE, "Offline"),
    (STATUS_OOO, "Out of office"),
]

    presence_status = models.CharField(
    max_length=30,
    choices=STATUS_CHOICES,
    default=STATUS_AVAILABLE,
)

    status_message = models.CharField(
    max_length=255,
    blank=True,
    default=""
)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    language = models.CharField(max_length=10,default="en")

    def update_presence(self, online: bool):
        self.is_online = online
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])

    def __str__(self):
        return self.user.username

class LoginActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="login_activities", on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.timestamp}"
    

class UserSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sessions",
        on_delete=models.CASCADE
    )

    session_id = models.UUIDField(default=uuid.uuid4, unique=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    device_name = models.CharField(max_length=255, null=True, blank=True)
    browser = models.CharField(max_length=100, null=True, blank=True)
    os = models.CharField(max_length=100, null=True, blank=True)

    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-login_time"]


class Meeting(models.Model):
    host = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="hosted_meetings", on_delete=models.CASCADE)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL,related_name="meetings",blank=True)
    title = models.CharField(max_length=255, default="New Meeting")
    meeting_code = models.CharField(max_length=50, unique=True)
    chat_room = models.OneToOneField(
        ChatRoom, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="meeting"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    TYPE_CHOICES = (
        ('audio', 'Audio Call'),
        ('video', 'Video Call'),
        ('group', 'Group Call'),
    )
    call_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='video')
    
    def __str__(self):
        return f"{self.title} ({self.meeting_code}) - {self.call_type}"

class Note(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Event(models.Model):
    title = models.CharField(max_length=255)
    category_name = models.CharField(max_length=50, null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=20, default="blue")
    timezone = models.CharField(max_length=50, default="UTC")
    repeat_rule = models.CharField(max_length=100, blank=True, null=True)
    url = models.URLField(blank=True, null=True)

    can_modify_event = models.BooleanField(default=False)
    can_invite_others = models.BooleanField(default=False)
    can_see_guest_list = models.BooleanField(default=False)

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reminders = models.JSONField(default=list, blank=True)

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="events",
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    meeting = models.ForeignKey(
        "Meeting",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def clean(self):
        if self.end_datetime <= self.start_datetime:
            raise ValidationError("End time must be after start time")

    def __str__(self):
        return self.title
            
class EventAttendee(models.Model):

    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"
    STATUS_MAYBE = "maybe"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_DECLINED, "Declined"),
        (STATUS_MAYBE, "Maybe"),
    )

    ROLE_OWNER = "owner"
    ROLE_GUEST = "guest"

    ROLE_CHOICES = (
        (ROLE_OWNER, "Owner"),
        (ROLE_GUEST, "Guest"),
    )

    ATTENDANCE_TYPE_CHOICES = (
        ("required", "Required"),
        ("optional", "Optional"),
    )

    event = models.ForeignKey(
        "Event",
        on_delete=models.CASCADE,
        related_name="attendees"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_participations"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_GUEST
    )

    attendance_type = models.CharField(
        max_length=20,
        choices=ATTENDANCE_TYPE_CHOICES,
        default="required"
    )
    permissions = models.JSONField(default=dict, blank=True, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["user"]),
            models.Index(fields=["event", "user"]),
        ]
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user} - {self.event.title} [{self.status}]"

class EventReminder(models.Model):

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="event_reminders"  
    )

    minutes_before = models.PositiveIntegerField()

    class Meta:
        ordering = ["minutes_before"]
        indexes = [
            models.Index(fields=["event"]),
        ]

    def __str__(self):
        return f"{self.minutes_before} min before - {self.event.title}"

class GovernmentHoliday(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]
        verbose_name = "Government Holiday"
        verbose_name_plural = "Government Holidays"

    def __str__(self):
        return f"{self.name} ({self.date})"

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    message = models.CharField(max_length=255)

    TYPE_CHOICES = (
        ('email', 'Email'),
        ('meet', 'Meeting'),
        ('chat', 'Chat'),
        ('task', 'Task'),
        ('system', 'System'),
    )
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_id = models.IntegerField(null=True, blank=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        indexes = [
            models.Index(fields=["recipient", "is_read"]),   
            models.Index(fields=["created_at"]),            
        ]

    def __str__(self):
        return f"Notification for {self.recipient}: {self.message}"

class TaskComment(models.Model):
    task = models.ForeignKey(Task, related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="task_comments", on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"

class TaskActivity(models.Model):
    task = models.ForeignKey(Task, related_name="activity_log", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="actions", on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.email} - {self.action_type}"

class MessageReaction(models.Model):
    message = models.ForeignKey(ChatMessage, related_name="reactions", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="message_reactions", on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.email} reacted {self.emoji} to {self.message.id}"
    
class DriveFile(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="drive_files")
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="drive/")
    size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=100, default="application/octet-stream")
    uploaded_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_files")
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_files")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="updated_files")
    shared_with = models.ManyToManyField(User,related_name="shared_files",blank=True)
    is_favorite = models.BooleanField(default=False)
    favorited_by = models.ManyToManyField(User, related_name="favorite_files", blank=True)
    is_trashed = models.BooleanField(default=False)
    
    class SharingLevel(models.TextChoices):
        RESTRICTED = 'RESTRICTED', 'Restricted'
        ANYONE_WITH_LINK = 'ANYONE_WITH_LINK', 'Anyone with link'

    sharing_level = models.CharField(
        max_length=20, 
        choices=SharingLevel.choices, 
        default=SharingLevel.RESTRICTED
    )
    
    class PermissionLevel(models.TextChoices):
        VIEW = 'VIEW', 'Viewer'
        EDIT = 'EDIT', 'Editor'

    link_permission = models.CharField(
        max_length=10,
        choices=PermissionLevel.choices,
        default=PermissionLevel.VIEW
    )
    share_token = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.original_name  
    
class FileLink(models.Model):
    file = models.ForeignKey("DriveFile", on_delete=models.CASCADE, related_name="links")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.file.original_name} - {self.token}"

class FileAccess(models.Model):
    file = models.ForeignKey("DriveFile", on_delete=models.CASCADE, related_name="access_list")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    PERMISSION_CHOICES = [
        ("VIEW", "Viewer"),
        ("EDIT", "Editor"),
    ]
    
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES)
    is_owner = models.BooleanField(default=False)
    
    SOURCE_CHOICES = [
        ("MANUAL", "Manual Invite"),
        ("LINK", "Public Link"),
    ]
    access_source = models.CharField(
        max_length=10, 
        choices=SOURCE_CHOICES, 
        default="MANUAL"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

class FileInvite(models.Model):
    file = models.ForeignKey(DriveFile, on_delete=models.CASCADE)
    email = models.EmailField()
    permission = models.CharField(max_length=10, default="view")
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)

    class Meta:
        unique_together = ("file", "email")

class EmailTemplate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="email_templates", on_delete=models.CASCADE)
    title = models.CharField(max_length=100, help_text="Short name like 'Weekly Report'")
    body = models.TextField(help_text="The actual email content")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'title') 

    def __str__(self):
        return f"{self.user.email} - {self.title}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()        

class FavouriteContact(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favourite_contacts"
    )
    contact = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favourited_by_users"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'contact')

    def __str__(self):
        return f"{self.user.email} → {self.contact.email}"

class Call(models.Model):
    room = models.ForeignKey('ChatRoom', on_delete=models.CASCADE, related_name='calls')
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='calls_made')
    jitsi_meeting_id = models.CharField(max_length=255, unique=True)
    
    STATUS_CHOICES = [
        ('RINGING', 'Ringing'),
        ('ONGOING', 'Ongoing'),
        ('ENDED', 'Ended'),
        ('MISSED', 'Missed')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RINGING')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Call {self.id} in Room {self.room.id} - {self.status}"

