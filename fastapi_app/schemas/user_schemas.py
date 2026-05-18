import re
import requests
import hashlib
from enum import Enum
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator, Field
import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException
from typing import List

class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    profile_image: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    dob: Optional[date]
    theme: Optional[str] = "light" 
    mobile_number: Optional[str]
    gender: str
    password: str
    confirm_password: str


    language: Optional[str] = Field(default="en-US", max_length=10)

    @field_validator("mobile_number")
    def validate_mobile_number(cls, v):
        if v is None:
            return v

        v = v.strip()

        if not v.startswith("+"):
            raise ValueError(
                "Mobile number must include country code (e.g. +1, +44, +91)"
            )

        try:
            phone = phonenumbers.parse(v, None)
        except NumberParseException:
            raise ValueError("Invalid mobile number format")

        if not phonenumbers.is_valid_number(phone):
            raise ValueError("Invalid mobile number")

        return phonenumbers.format_number(
            phone, phonenumbers.PhoneNumberFormat.E164
        )

    @field_validator("password")
    def validate_password_strength(cls, v):

        if len(v) < 6 or len(v) > 18:
            raise ValueError("Password must be between 6 and 18 characters long")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")


        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")

        try:
            sha1_password = hashlib.sha1(v.encode("utf-8")).hexdigest().upper()
            
            prefix, suffix = sha1_password[:5], sha1_password[5:]
            
            response = requests.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                timeout=5,
            )
            
            if suffix in response.text:
                raise ValueError(
                    "This password has been exposed in a data breach. Please choose a different one."
                )
        except requests.RequestException:
            pass

        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match")
        return self

    @field_validator("dob")
    def validate_dob(cls, v):
        if v is None:
            return v  

        today = date.today()

        if v > today:
            raise ValueError("Date of birth cannot be in the future")

        
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))

        if age < 10:
            raise ValueError("User must be at least 10 years old")

        return v


class LanguageChoice(str, Enum):
    EN_US = "en-US"
    ES_ES = "es-ES"
    FR_FR = "fr-FR"
    DE_DE = "de-DE"
    HI_IN = "hi-IN"


class PresenceStatus(str, Enum):
    AVAILABLE_NOW = "available_now"
    AVAILABLE = "available"
    BUSY = "busy"
    DND = "dnd"
    AWAY = "away"
    OFFLINE = "offline"
    OUT_OF_OFFICE = "out_of_office"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    role: Optional[str] = None
    is_active: bool
    last_seen: Optional[datetime] = None

    current_status: Optional[PresenceStatus] = PresenceStatus.OFFLINE
    status_message: Optional[str] = ""

    language: Optional[str] = None
    
    vacation_mode_enabled: bool
    vacation_start_date: Optional[datetime]
    vacation_end_date: Optional[datetime]
    vacation_message: str

    class Config:
        from_attributes = True

class UpdateLanguageSchema(BaseModel):
    language: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None


    language: Optional[str] = None


    
    vacation_mode_enabled: Optional[bool] = None
    vacation_start_date: Optional[datetime] = None
    vacation_end_date: Optional[datetime] = None
    vacation_message: Optional[str] = None

    @model_validator(mode="after")
    def validate_vacation_dates(self):
        if self.vacation_start_date and self.vacation_end_date:
            if self.vacation_start_date >= self.vacation_end_date:
                raise ValueError("Vacation start date must be before end date")
        return self


class ForgotPasswordRequest(BaseModel):
    mobile_number: str


class ResetPasswordRequest(BaseModel):
    mobile_number: str
    otp: str
    new_password: str

    @field_validator("new_password")
    def validate_password_strength(cls, v):
        return UserCreate.validate_password_strength(v)


ResetPasswordWithOTP = ResetPasswordRequest


class ForgotUsernameRequest(BaseModel):
    phone_number: str

class ChangePasswordRequest(BaseModel):

    old_password: str = Field(..., min_length=1, description="Current active password")
    
    new_password: str = Field(
        ..., 
        min_length=6, 
        max_length=18, 
        description="New secure password (6-18 chars)"
    )
    
    confirm_password: str = Field(
        ..., 
        min_length=6, 
        max_length=18, 
        description="Repeat new password"
    )

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 6 or len(v) > 18:
            raise ValueError("Password must be between 6 and 18 characters long")

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")

        try:
            sha1_password = hashlib.sha1(v.encode("utf-8")).hexdigest().upper()
            prefix, suffix = sha1_password[:5], sha1_password[5:]
            
            response = requests.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                timeout=5,
            )
            
            if suffix in response.text:
                raise ValueError(
                    "This password has been exposed in a data breach. Please choose a different one."
                )
        except requests.RequestException:
            pass

        return v
    
class ChatSearchResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    current_status: Optional[PresenceStatus] = None
    avatar_url: Optional[str] = None

class AccountMeResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    current_status: PresenceStatus
    status_label: str
    status_message: str
    is_online: bool
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserSearchItem(BaseModel):
    id: int
    name: str
    email: str

class UserSearchResult(BaseModel):
    total: int
    results: List[UserSearchItem]

class UserNameOut(BaseModel):
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

    class Config:
        from_attributes = True 

class UpdateLanguageSchema(BaseModel):
    language: str

class UserResponse(BaseModel):
    email: str
    language: Optional[str] = None

    class Config:
        from_attributes = True