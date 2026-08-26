from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status

from services.api.db.auth_repository import (
    delete_user_and_profile,
    find_user_by_email,
    find_user_by_id,
    list_users,
    update_user_identity,
    upsert_profile,
    upsert_user,
)
from services.api.dependencies.auth import get_current_user
from services.api.models.auth import Profile, User, UserRole
from services.api.schemas.users import (
    ProfileResponse,
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
    UserWithProfileResponse,
)
from services.api.security.auth import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
    )


@router.post("", response_model=UserWithProfileResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreateRequest) -> UserWithProfileResponse:
    if find_user_by_email(payload.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user_id = str(uuid4())
    user = User(
        id=user_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.user,
    )
    profile = Profile(
        id=str(uuid4()),
        user_id=user_id,
        name=payload.name or "",
        phone=payload.phone or "",
        address=payload.address or "",
    )

    upsert_user(user)
    try:
        upsert_profile(profile)
    except Exception as exc:
        delete_user_and_profile(user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user profile",
        ) from exc

    return UserWithProfileResponse(
        user=_to_user_response(user),
        profile=ProfileResponse(**profile.model_dump()),
    )


@router.get("", response_model=list[UserResponse])
def get_users(current_user: User = Depends(get_current_user)) -> list[UserResponse]:
    del current_user
    return [_to_user_response(user) for user in list_users()]


@router.get("/{id}", response_model=UserResponse)
def get_user(id: str, current_user: User = Depends(get_current_user)) -> UserResponse:
    del current_user
    user = find_user_by_id(id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _to_user_response(user)


@router.put("/{id}", response_model=UserResponse)
def update_user(
    id: str,
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    target_user = find_user_by_id(id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role != UserRole.admin and current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if payload.email is None and payload.role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided",
        )

    email = payload.email if payload.email is not None else target_user.email
    role = payload.role if payload.role is not None else target_user.role

    existing = find_user_by_email(email)
    if existing is not None and existing.id != id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    updated_user = update_user_identity(user_id=id, email=email, role=role)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return _to_user_response(updated_user)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: str, current_user: User = Depends(get_current_user)) -> Response:
    del current_user
    deleted = delete_user_and_profile(id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
