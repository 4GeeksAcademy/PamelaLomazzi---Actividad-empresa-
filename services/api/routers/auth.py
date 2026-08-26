from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from services.api.db.auth_repository import (
    find_profile_by_user_id,
    find_user_by_email,
    upsert_profile,
    upsert_user,
)
from services.api.dependencies.auth import get_current_user
from services.api.models.auth import Profile, User
from services.api.schemas.auth import (
    CurrentUserProfileData,
    CurrentUserResponse,
    LoginRequest,
    SignupRequest,
    TokenResponse,
)
from services.api.security.auth import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest) -> TokenResponse:
    existing_user = find_user_by_email(payload.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user_id = str(uuid4())
    user = User(
        id=user_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    profile = Profile(
        id=str(uuid4()),
        user_id=user_id,
        name=payload.name,
        phone=payload.phone,
        address=payload.address,
    )

    upsert_user(user)
    upsert_profile(profile)

    token = create_access_token(user_id=user.id)
    return TokenResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest) -> TokenResponse:
    user = find_user_by_email(credentials.email)
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_id=user.id)
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: User = Depends(get_current_user)) -> CurrentUserResponse:
    profile = find_profile_by_user_id(current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for current user",
        )

    return CurrentUserResponse(
        email=current_user.email,
        role=current_user.role.value,
        profile=CurrentUserProfileData(
            name=profile.name,
            phone=profile.phone,
            address=profile.address,
        ),
    )
