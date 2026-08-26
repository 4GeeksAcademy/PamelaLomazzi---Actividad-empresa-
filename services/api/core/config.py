from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
API_ROOT = Path(__file__).resolve().parents[1]

# Carga variables desde .env del repo y de services/api si existen.
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(API_ROOT / ".env")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value.strip()


SECRET_KEY = _require_env("SECRET_KEY")
ALGORITHM = _require_env("ALGORITHM")
if ALGORITHM != "HS256":
    raise RuntimeError("ALGORITHM must be HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(_require_env("ACCESS_TOKEN_EXPIRE_MINUTES"))
