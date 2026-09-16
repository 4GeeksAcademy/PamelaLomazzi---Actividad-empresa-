from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import bcrypt
from jose import JWTError, jwt

from services.api.schemas.auth import ProfileData

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("AUTH_TOKEN_EXPIRE_MINUTES", "1440"))


class AuthError(Exception):
    """Error de autenticación: credenciales inválidas o email ya registrado."""


class InvalidTokenError(Exception):
    """Token ausente, expirado o inválido."""


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


class StoredUser:
    __slots__ = ("id", "email", "hashed_password", "profile")

    def __init__(self, id: str, email: str, hashed_password: str, profile: ProfileData) -> None:
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.profile = profile


class AuthService:
    """Almacenamiento en memoria de usuarios; pensado para desarrollo/demo."""

    def __init__(self) -> None:
        self._users_by_email: Dict[str, StoredUser] = {}

    def register(
        self,
        email: str,
        password: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
    ) -> StoredUser:
        normalized_email = email.strip().lower()
        if normalized_email in self._users_by_email:
            raise AuthError("Ya existe una cuenta registrada con este email.")

        user = StoredUser(
            id=str(uuid.uuid4()),
            email=normalized_email,
            hashed_password=_hash_password(password),
            profile=ProfileData(name=name, phone=phone, address=address),
        )
        self._users_by_email[normalized_email] = user
        return user

    def authenticate(self, email: str, password: str) -> StoredUser:
        user = self._users_by_email.get(email.strip().lower())
        if user is None or not _verify_password(password, user.hashed_password):
            raise AuthError("Email o contraseña incorrectos.")
        return user

    def create_access_token(self, user: StoredUser) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": user.id, "email": user.email, "exp": expire}
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def get_user_by_token(self, token: str) -> StoredUser:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError as exc:
            raise InvalidTokenError("Token inválido o expirado.") from exc

        user_id = payload.get("sub")
        for user in self._users_by_email.values():
            if user.id == user_id:
                return user

        raise InvalidTokenError("Usuario no encontrado.")

    def update_profile(self, user: StoredUser, update: ProfileData) -> ProfileData:
        current = user.profile
        user.profile = ProfileData(
            name=update.name if update.name is not None else current.name,
            phone=update.phone if update.phone is not None else current.phone,
            address=update.address if update.address is not None else current.address,
        )
        return user.profile


# Instancia compartida por el proceso: los usuarios se pierden al reiniciar el backend.
auth_service = AuthService()
