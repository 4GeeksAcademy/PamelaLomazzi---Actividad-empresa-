from __future__ import annotations

from fastapi import APIRouter, Depends

from services.api.routers.auth import get_current_user
from services.api.schemas.auth import ProfileData, ProfileUpdate
from services.api.services.auth_service import StoredUser, auth_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.put("/me", response_model=ProfileData)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: StoredUser = Depends(get_current_user),
) -> ProfileData:
    return auth_service.update_profile(current_user, ProfileData(**payload.model_dump()))
