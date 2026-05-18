from __future__ import annotations
from typing import Any, Dict, Literal, Optional
from fastapi_app.utils.languages import LANGUAGES
from fastapi_app.schemas.user_schemas import UpdateLanguageSchema

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from django_backend.models import UserProfile
from fastapi_app.routers.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from zoneinfo import ZoneInfo,  ZoneInfoNotFoundError
from fastapi import HTTPException
from django_backend.models import GeneralSettings
from fastapi_app.schemas.user_schemas import UpdateLanguageSchema
import inspect

router = APIRouter(tags=["Settings"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SETTINGS_DB: Dict[int, Dict[str, Any]] = {}


ThemeType = Literal["light", "dark"]
LangType = Literal["en", "ta", "hi"]
WeekStartType = Literal["Sunday", "Monday"]
DefaultViewType = Literal["Day", "Week", "Month"]


class PeopleSettings(BaseModel):
    auto_add_contacts: bool = True
    show_profile_photos: bool = True
    contact_suggestions: bool = True
    sync_phone_contacts: bool = False


class CalendarSettings(BaseModel):
    start_week_on: WeekStartType = "Sunday"
    default_view: DefaultViewType = "Week"
    show_weekends: bool = True
    show_declined_events: bool = False


class GeneralSettings(BaseModel):
    language: LangType = "en"
    timezone: str = "Asia/Kolkata"
    desktop_notification: bool = False
    sound_notification: bool = False
    theme: ThemeType = "light"
    signature: str = ""
    notifications_email: bool = True
    notifications_chat: bool = True
    notifications_tasks: bool = True


class AccountSettings(BaseModel):
    email: str = ""
    display_name: str = ""
    two_fa: bool = False
    email_notifications_account: bool = True


class SettingsOut(BaseModel):
    account: AccountSettings = Field(default_factory=AccountSettings)
    general: GeneralSettings = Field(default_factory=GeneralSettings)
    people: PeopleSettings = Field(default_factory=PeopleSettings)
    calendar: CalendarSettings = Field(default_factory=CalendarSettings)



class PeopleSettingsPatch(BaseModel):
    auto_add_contacts: Optional[bool] = None
    show_profile_photos: Optional[bool] = None
    contact_suggestions: Optional[bool] = None
    sync_phone_contacts: Optional[bool] = None


class CalendarSettingsPatch(BaseModel):
    start_week_on: Optional[WeekStartType] = None
    default_view: Optional[DefaultViewType] = None
    show_weekends: Optional[bool] = None
    show_declined_events: Optional[bool] = None


class GeneralSettingsPatch(BaseModel):
    language: Optional[LangType] = None
    timezone: Optional[str] = None
    desktop_notification: Optional[bool] = None
    sound_notification: Optional[bool] = None
    theme: Optional[ThemeType] = None
    signature: Optional[str] = None
    notifications_email: Optional[bool] = None
    notifications_chat: Optional[bool] = None
    notifications_tasks: Optional[bool] = None


class AccountSettingsPatch(BaseModel):
    email: Optional[str] = None
    display_name: Optional[str] = None
    two_fa: Optional[bool] = None
    email_notifications_account: Optional[bool] = None


class SettingsUpdate(BaseModel):
    account: Optional[AccountSettingsPatch] = None
    general: Optional[GeneralSettingsPatch] = None
    people: Optional[PeopleSettingsPatch] = None
    calendar: Optional[CalendarSettingsPatch] = None


class GeneralSettingsResponse(BaseModel):
    timezone: str = Field(..., alias="timeZone")
    desktop_notification: bool = Field(..., alias="desktopNotifications")
    sound_notification: bool = Field(..., alias="soundNotifications")

    class Config:
        populate_by_name = True


class UpdateGeneralSettings(BaseModel):
    timezone: Optional[str] = Field(default=None, alias="timeZone")
    desktop_notification: Optional[bool] = Field(default=None, alias="desktopNotifications")
    sound_notification: Optional[bool] = Field(default=None, alias="soundNotifications")

    class Config:
        populate_by_name = True

def _import_project_get_current_user():
    """
    If your project already has get_current_user() we will use it.
    IMPORTANT: we call it WITHOUT passing token to avoid 500 crashes.
    """
    candidates = [
        "fastapi_app.core.dependencies",
        "fastapi_app.core.deps",
        "fastapi_app.core.security",
        "fastapi_app.routers.auth",
        "app.core.dependencies",
        "app.core.deps",
        "app.core.security",
        "app.routers.auth",
    ]
    for mod in candidates:
        try:
            m = __import__(mod, fromlist=["get_current_user"])
            fn = getattr(m, "get_current_user", None)
            if callable(fn):
                return fn
        except Exception:
            continue
    return None


_project_get_current_user = _import_project_get_current_user()


async def get_current_user(token: str = Depends(oauth2_scheme)):

    if _project_get_current_user:
        try:
            if inspect.iscoroutinefunction(_project_get_current_user):
                user = await _project_get_current_user(token)
            else:
                user = _project_get_current_user(token)
        except TypeError:
            if inspect.iscoroutinefunction(_project_get_current_user):
                user = await _project_get_current_user()
            else:
                user = _project_get_current_user()

        return user

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return {"id": 1, "email": "authorized-user@example.com", "name": "Demo User"}


def _dump(model: BaseModel) -> dict:
    if hasattr(model, "model_dump"):  
        return model.model_dump()
    return model.dict()  


def _dump_exclude_unset(model: BaseModel) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=True)
    return model.dict(exclude_unset=True)


def _deep_merge_dict(current: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(current)
    for k, v in patch.items():
        if v is None:
            continue
        if isinstance(v, dict) and isinstance(merged.get(k), dict):
            merged[k] = _deep_merge_dict(merged[k], v)
        else:
            merged[k] = v
    return merged


def _ensure_user_settings(user: Any) -> Dict[str, Any]: 
    if isinstance(user, dict):
        user_id = int(user.get("id", 1))
        email = user.get("email")
        name = user.get("display_name") or user.get("name")
    else:
        user_id = int(getattr(user, "id", 1))
        email = getattr(user, "email", None)
        name = (
    f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    or getattr(user, "username", None)
)

    if user_id not in SETTINGS_DB:
        base = _dump(SettingsOut())
        SETTINGS_DB[user_id] = base
    if email:
           SETTINGS_DB[user_id]["account"]["email"] = email
    if name:
           SETTINGS_DB[user_id]["account"]["display_name"] = name

    return SETTINGS_DB[user_id]


def _validate_and_save(user_id: int, merged: Dict[str, Any]) -> Dict[str, Any]:
    try:
        validated = SettingsOut(**merged)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid settings payload: {e}")

    SETTINGS_DB[user_id] = _dump(validated)
    return SETTINGS_DB[user_id]


def validate_timezone(tz: str):
    try:
        ZoneInfo(tz)   
    except ZoneInfoNotFoundError:
        raise HTTPException(
            status_code=422,
            detail=f"'{tz}' is not a recognized IANA time zone."
        )



@router.get("/me", response_model=SettingsOut, summary="Get My Settings")
def get_my_settings(user=Depends(get_current_user)):
    user_dict = user if isinstance(user, dict) else {"id": getattr(user, "id", 1)}
    _ensure_user_settings(user)
    user_id = int(user_dict.get("id", 1))
    return SETTINGS_DB[user_id]


@router.patch("/me", response_model=SettingsOut, summary="Update My Settings")
def update_my_settings(payload: SettingsUpdate, user=Depends(get_current_user)):
    user_dict = user if isinstance(user, dict) else {"id": getattr(user, "id", 1)}
    user_id = int(user_dict.get("id", 1))

    current = _ensure_user_settings(user)
    patch = _dump_exclude_unset(payload)

    tz = None
    if isinstance(patch.get("general"), dict):
        tz = patch["general"].get("timezone")

    if tz is not None:
        validate_timezone(tz)

    merged = _deep_merge_dict(current, patch)
    return _validate_and_save(user_id, merged)

@router.get("/me/account", response_model=AccountSettings, summary="Get Account Settings")
def get_account_settings(user=Depends(get_current_user)):
    s = _ensure_user_settings(user)
    return s["account"]


@router.patch("/me/account", response_model=AccountSettings, summary="Update Account Settings")
def patch_account_settings(payload: AccountSettingsPatch, user=Depends(get_current_user)):
    user_dict = user if isinstance(user, dict) else {"id": getattr(user, "id", 1)}
    user_id = int(user_dict.get("id", 1))

    current = _ensure_user_settings(user)
    upd = _dump_exclude_unset(payload)
    merged = _deep_merge_dict(current, {"account": upd})
    saved = _validate_and_save(user_id, merged)
    return saved["account"]


def get_or_create_general_settings(user):
    gs = user.general_settings if hasattr(user, "general_settings") else None

    if not gs:
        gs = GeneralSettings.objects.create(
            user=user,
            timezone="UTC",
            desktop_notification=True,
            sound_notification=True,
        )

    return gs


@router.get("/general", response_model=GeneralSettingsResponse)
def get_general_settings(current_user: User = Depends(get_current_user)):
    
    gs = get_or_create_general_settings(current_user)

    return {
        "timezone": gs.timezone,
        "desktop_notification": gs.desktop_notification,
        "sound_notification": gs.sound_notification,
    }
    
@router.patch("/general", response_model=GeneralSettingsResponse)
def update_general_settings(
    payload: UpdateGeneralSettings,
    current_user: User = Depends(get_current_user),
):
    gs = get_or_create_general_settings(current_user)

    data = payload.model_dump(exclude_unset=True, by_alias=False)

    if data.get("timezone") is not None:
        validate_timezone(data["timezone"])  
        gs.timezone = data["timezone"]

    if data.get("desktop_notification") is not None:
        gs.desktop_notification = data["desktop_notification"]

    if data.get("sound_notification") is not None:
        gs.sound_notification = data["sound_notification"]

    gs.save()

    return {
        "timezone": gs.timezone,
        "desktop_notification": gs.desktop_notification,
        "sound_notification": gs.sound_notification,
    }


@router.get("/me/people", response_model=PeopleSettings, summary="Get People Settings")
def get_people_settings(user=Depends(get_current_user)):
    s = _ensure_user_settings(user)
    return s["people"]


@router.patch("/me/people", response_model=PeopleSettings, summary="Update People Settings")
def patch_people_settings(payload: PeopleSettingsPatch, user=Depends(get_current_user)):
    user_dict = user if isinstance(user, dict) else {"id": getattr(user, "id", 1)}
    user_id = int(user_dict.get("id", 1))

    current = _ensure_user_settings(user)
    upd = _dump_exclude_unset(payload)
    merged = _deep_merge_dict(current, {"people": upd})
    saved = _validate_and_save(user_id, merged)
    return saved["people"]


@router.get("/me/calendar", response_model=CalendarSettings, summary="Get Calendar Settings")
def get_calendar_settings(user=Depends(get_current_user)):
    s = _ensure_user_settings(user)
    return s["calendar"]


@router.patch("/me/calendar", response_model=CalendarSettings, summary="Update Calendar Settings")
def patch_calendar_settings(payload: CalendarSettingsPatch, user=Depends(get_current_user)):
    user_dict = user if isinstance(user, dict) else {"id": getattr(user, "id", 1)}
    user_id = int(user_dict.get("id", 1))

    current = _ensure_user_settings(user)
    upd = _dump_exclude_unset(payload)
    merged = _deep_merge_dict(current, {"calendar": upd})
    saved = _validate_and_save(user_id, merged)
    return saved["calendar"]


@router.get("/languages")
def get_languages():
    return LANGUAGES


@router.put("/language")
def update_language(
    data: UpdateLanguageSchema,
    current_user=Depends(get_current_user)
):

    profile = UserProfile.objects.get(user_id=current_user.id)

    profile.language = data.language
    profile.save()

    return {
        "message": "Language updated successfully",
        "language": profile.language
    }