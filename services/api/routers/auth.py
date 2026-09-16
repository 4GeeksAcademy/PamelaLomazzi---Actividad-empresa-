from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.api.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserPublic,
)
from services.api.services.auth_service import (
    AuthError,
    InvalidTokenError,
    StoredUser,
    auth_service,
)
from services.api.services.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer_scheme = HTTPBearer(auto_error=False)

RESET_PASSWORD_URL = os.getenv("RESET_PASSWORD_URL", "http://localhost:3000/reset-password")
GENERIC_FORGOT_PASSWORD_MESSAGE = (
    "Si el email está registrado, enviamos un enlace para restablecer la contraseña."
)


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


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest) -> MessageResponse:
    user = auth_service.find_user_by_email(payload.email)
    if user is not None:
        token = auth_service.create_password_reset_token(user)
        reset_link = f"{RESET_PASSWORD_URL}?token={token}"
        send_password_reset_email(user.email, reset_link)

    # Siempre 200 con mensaje genérico: evita enumerar cuentas registradas.
    return MessageResponse(message=GENERIC_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest) -> MessageResponse:
    try:
        auth_service.reset_password(payload.token, payload.new_password)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return MessageResponse(message="Contraseña actualizada correctamente.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_user: StoredUser = Depends(get_current_user),
) -> MessageResponse:
    try:
        auth_service.change_password(
            current_user, payload.current_password, payload.new_password
        )
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return MessageResponse(message="Contraseña actualizada correctamente.")
