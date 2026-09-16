from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from services.api.schemas.auth import UserCreate, UserPublic
from services.api.services.auth_service import AuthError, auth_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> UserPublic:
    try:
        user = auth_service.register(
            email=payload.email,
            password=payload.password,
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
        )
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    return UserPublic(id=user.id, email=user.email, profile=user.profile)
