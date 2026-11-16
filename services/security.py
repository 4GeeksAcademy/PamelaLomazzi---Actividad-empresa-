from __future__ import annotations

import os

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import PyJWTError
from pydantic import ValidationError

from services.schemas import AuditActor

_bearer_scheme = HTTPBearer(auto_error=False)
_TOKEN_ISSUER = "healthcore"
_TOKEN_AUDIENCE = "healthcore-audit"


def get_audit_actor(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuditActor:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    secret = os.getenv("AUDIT_JWT_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La autenticación del visor de auditoría no está configurada.",
        )

    try:
        claims = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=["HS256"],
            audience=_TOKEN_AUDIENCE,
            issuer=_TOKEN_ISSUER,
            options={
                "require": [
                    "aud",
                    "department_id",
                    "exp",
                    "iat",
                    "iss",
                    "role",
                    "sub",
                ]
            },
        )
        return AuditActor(
            id=claims["sub"],
            role=claims["role"],
            department_id=claims["department_id"],
        )
    except (PyJWTError, KeyError, TypeError, ValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de auditoría inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc