from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.api.schemas.auth import LoginRequest, TokenResponse, UserPublic
from services.api.services.auth_service import (
    AuthError,
    InvalidTokenError,
    StoredUser,
    auth_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> StoredUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó un token de autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return auth_service.get_user_by_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    try:
        user = auth_service.authenticate(payload.email, payload.password)
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc

    token = auth_service.create_access_token(user)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
def me(current_user: StoredUser = Depends(get_current_user)) -> UserPublic:
    return UserPublic(id=current_user.id, email=current_user.email, profile=current_user.profile)
