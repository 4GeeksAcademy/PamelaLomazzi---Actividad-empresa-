from __future__ import annotations

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str
    address: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserProfileData(BaseModel):
    name: str
    phone: str
    address: str


class CurrentUserResponse(BaseModel):
    email: str
    role: str
    profile: CurrentUserProfileData
