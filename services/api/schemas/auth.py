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
