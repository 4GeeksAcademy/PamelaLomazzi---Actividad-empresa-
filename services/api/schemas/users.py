from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from services.api.models.auth import UserRole


class UserCreateRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class UserUpdateRequest(BaseModel):
    email: str | None = None
    role: UserRole | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    role: UserRole
    created_at: datetime


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    address: str


class UserWithProfileResponse(BaseModel):
    user: UserResponse
    profile: ProfileResponse
