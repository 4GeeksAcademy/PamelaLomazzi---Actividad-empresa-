from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from services.api.db import auth_repository
from services.api.main import app
from services.api.models.auth import Profile, User, UserRole
from services.api.security.auth import get_password_hash


@pytest.fixture(autouse=True)
def isolated_auth_db(tmp_path: Path) -> None:
    auth_repository.DB_PATH = tmp_path / "auth_test_db.json"
    if auth_repository._db is not None:
        auth_repository._db.close()
    auth_repository._db = None
    yield
    if auth_repository._db is not None:
        auth_repository._db.close()
    auth_repository._db = None


def _seed_user_with_profile(*, email: str, password: str) -> None:
    user = User(
        id="user-1",
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True,
        role=UserRole.manager,
    )
    profile = Profile(
        id="profile-1",
        user_id="user-1",
        name="Pamela Lomazzi",
        phone="+34 600 123 456",
        address="Calle Salud 123, Madrid",
    )

    auth_repository.upsert_user(user)
    auth_repository.upsert_profile(profile)


def test_login_returns_bearer_token() -> None:
    _seed_user_with_profile(email="pamela@example.com", password="super-secret")
    client = TestClient(app)

    response = client.post(
        "/auth/login",
        json={"email": "pamela@example.com", "password": "super-secret"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert isinstance(payload["access_token"], str)
    assert payload["access_token"]


def test_signup_creates_user_and_returns_bearer_token() -> None:
    client = TestClient(app)

    response = client.post(
        "/auth/signup",
        json={
            "email": "new.user@example.com",
            "password": "new-secret",
            "name": "New User",
            "phone": "+34 611 111 111",
            "address": "Avenida Central 456, Barcelona",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert isinstance(payload["access_token"], str)
    assert payload["access_token"]


def test_signup_duplicate_email_returns_409() -> None:
    _seed_user_with_profile(email="pamela@example.com", password="super-secret")
    client = TestClient(app)

    response = client.post(
        "/auth/signup",
        json={
            "email": "pamela@example.com",
            "password": "other-secret",
            "name": "Other Name",
            "phone": "+34 622 222 222",
            "address": "Calle Duplicada 1, Madrid",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered"


def test_login_invalid_password_returns_401() -> None:
    _seed_user_with_profile(email="pamela@example.com", password="super-secret")
    client = TestClient(app)

    response = client.post(
        "/auth/login",
        json={"email": "pamela@example.com", "password": "wrong-pass"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_returns_user_and_profile() -> None:
    _seed_user_with_profile(email="pamela@example.com", password="super-secret")
    client = TestClient(app)

    login_response = client.post(
        "/auth/login",
        json={"email": "pamela@example.com", "password": "super-secret"},
    )
    token = login_response.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "pamela@example.com"
    assert payload["role"] == "manager"
    assert payload["profile"] == {
        "name": "Pamela Lomazzi",
        "phone": "+34 600 123 456",
        "address": "Calle Salud 123, Madrid",
    }


def test_me_with_invalid_token_returns_401() -> None:
    client = TestClient(app)

    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_signup_then_me_returns_created_profile() -> None:
    client = TestClient(app)

    signup_response = client.post(
        "/auth/signup",
        json={
            "email": "created.user@example.com",
            "password": "created-secret",
            "name": "Created User",
            "phone": "+34 633 333 333",
            "address": "Calle Nueva 77, Valencia",
        },
    )
    token = signup_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert me_response.status_code == 200
    payload = me_response.json()
    assert payload["email"] == "created.user@example.com"
    assert payload["role"] == "user"
    assert payload["profile"] == {
        "name": "Created User",
        "phone": "+34 633 333 333",
        "address": "Calle Nueva 77, Valencia",
    }
