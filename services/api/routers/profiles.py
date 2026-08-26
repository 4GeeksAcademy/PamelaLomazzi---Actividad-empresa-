from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from services.api.db.auth_repository import find_profile_by_user_id, update_profile_for_user
from services.api.dependencies.auth import get_current_user
from services.api.models.auth import User, UserRole
from services.api.schemas.profiles import ProfileUpdateRequest
from services.api.schemas.users import ProfileResponse

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    user_id: str | None = None,
) -> ProfileResponse:
    target_user_id = user_id or current_user.id
    if target_user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    profile = find_profile_by_user_id(target_user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return ProfileResponse(**profile.model_dump())


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_id: str | None = None,
) -> ProfileResponse:
    target_user_id = user_id or current_user.id
    if target_user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    profile = find_profile_by_user_id(target_user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if payload.name is None and payload.phone is None and payload.address is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided",
        )

    updated_profile = update_profile_for_user(
        user_id=target_user_id,
        name=payload.name if payload.name is not None else profile.name,
        phone=payload.phone if payload.phone is not None else profile.phone,
        address=payload.address if payload.address is not None else profile.address,
    )
    if updated_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return ProfileResponse(**updated_profile.model_dump())
