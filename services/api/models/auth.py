from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TypedDict

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


class User(BaseModel):
    id: str
    email: str
    hashed_password: str
    is_active: bool = True
    role: UserRole = UserRole.user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Profile(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    address: str


class UserTinyDBDoc(TypedDict):
    id: str
    email: str
    hashed_password: str
    is_active: bool
    role: str
    created_at: str


class ProfileTinyDBDoc(TypedDict):
    id: str
    user_id: str
    name: str
    phone: str
    address: str
