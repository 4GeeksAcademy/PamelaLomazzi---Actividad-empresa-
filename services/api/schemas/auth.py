from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ProfileData(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    email: str
    profile: ProfileData


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    message: str

