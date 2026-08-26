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


def _seed_user_with_profile(*, user_id: str, email: str, password: str, role: UserRole) -> None:
    user = User(
        id=user_id,
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True,
        role=role,
    )
    profile = Profile(
        id=f"profile-{user_id}",
        user_id=user_id,
        name=f"Name {user_id}",
        phone="+34 600 000 000",
        address="Address",
    )
    auth_repository.upsert_user(user)
    auth_repository.upsert_profile(profile)


def _login_and_get_header(email: str, password: str) -> dict[str, str]:
    client = TestClient(app)
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_post_users_creates_user_with_profile_and_default_role() -> None:
    client = TestClient(app)

    response = client.post(
        "/users",
        json={
            "email": "create.user@example.com",
            "password": "create-secret",
            "name": "Create User",
            "phone": "+34 611 000 000",
            "address": "Madrid",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["user"]["email"] == "create.user@example.com"
    assert payload["user"]["role"] == "user"
    assert payload["profile"]["name"] == "Create User"
    stored_user = auth_repository.find_user_by_email("create.user@example.com")
    assert stored_user is not None
    assert stored_user.hashed_password != "create-secret"


def test_get_users_requires_authentication() -> None:
    client = TestClient(app)
    response = client.get("/users")
    assert response.status_code == 401


def test_get_users_and_get_user_by_id_work_when_authenticated() -> None:
    _seed_user_with_profile(
        user_id="admin-1",
        email="admin@example.com",
        password="admin-secret",
        role=UserRole.admin,
    )
    _seed_user_with_profile(
        user_id="user-1",
        email="user@example.com",
        password="user-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("admin@example.com", "admin-secret")
    client = TestClient(app)

    list_response = client.get("/users", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 2

    get_response = client.get("/users/user-1", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["email"] == "user@example.com"


def test_put_users_allows_admin_and_blocks_other_non_admin_users() -> None:
    _seed_user_with_profile(
        user_id="admin-1",
        email="admin@example.com",
        password="admin-secret",
        role=UserRole.admin,
    )
    _seed_user_with_profile(
        user_id="manager-1",
        email="manager@example.com",
        password="manager-secret",
        role=UserRole.manager,
    )
    _seed_user_with_profile(
        user_id="user-1",
        email="user@example.com",
        password="user-secret",
        role=UserRole.user,
    )
    client = TestClient(app)

    manager_headers = _login_and_get_header("manager@example.com", "manager-secret")
    forbidden_response = client.put(
        "/users/user-1",
        headers=manager_headers,
        json={"email": "updated.by.manager@example.com", "role": "manager"},
    )
    assert forbidden_response.status_code == 403

    admin_headers = _login_and_get_header("admin@example.com", "admin-secret")
    updated_response = client.put(
        "/users/user-1",
        headers=admin_headers,
        json={"email": "updated.by.admin@example.com", "role": "manager"},
    )
    assert updated_response.status_code == 200
    payload = updated_response.json()
    assert payload["email"] == "updated.by.admin@example.com"
    assert payload["role"] == "manager"


def test_put_users_allows_self_update() -> None:
    _seed_user_with_profile(
        user_id="user-1",
        email="user@example.com",
        password="user-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("user@example.com", "user-secret")
    client = TestClient(app)

    response = client.put(
        "/users/user-1",
        headers=headers,
        json={"email": "self.updated@example.com"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "self.updated@example.com"


def test_delete_users_removes_user_and_profile() -> None:
    _seed_user_with_profile(
        user_id="deleter-1",
        email="deleter@example.com",
        password="deleter-secret",
        role=UserRole.user,
    )
    _seed_user_with_profile(
        user_id="victim-1",
        email="victim@example.com",
        password="victim-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("deleter@example.com", "deleter-secret")
    client = TestClient(app)

    response = client.delete("/users/victim-1", headers=headers)

    assert response.status_code == 204
    assert auth_repository.find_user_by_id("victim-1") is None
    assert auth_repository.find_profile_by_user_id("victim-1") is None


def test_profiles_me_get_and_update_work_for_authenticated_user() -> None:
    _seed_user_with_profile(
        user_id="user-1",
        email="user@example.com",
        password="user-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("user@example.com", "user-secret")
    client = TestClient(app)

    get_response = client.get("/profiles/me", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["user_id"] == "user-1"

    update_response = client.put(
        "/profiles/me",
        headers=headers,
        json={"name": "Updated Name", "phone": "+34 699 999 999", "address": "Sevilla"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Name"
    assert update_response.json()["phone"] == "+34 699 999 999"
    assert update_response.json()["address"] == "Sevilla"


def test_profiles_me_routes_require_authentication() -> None:
    client = TestClient(app)

    get_response = client.get("/profiles/me")
    put_response = client.put("/profiles/me", json={"name": "No Auth"})

    assert get_response.status_code == 401
    assert put_response.status_code == 401


def test_profiles_me_returns_403_when_accessing_foreign_profile() -> None:
    _seed_user_with_profile(
        user_id="owner-1",
        email="owner@example.com",
        password="owner-secret",
        role=UserRole.user,
    )
    _seed_user_with_profile(
        user_id="other-1",
        email="other@example.com",
        password="other-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("other@example.com", "other-secret")
    client = TestClient(app)

    response = client.get("/profiles/me", headers=headers, params={"user_id": "owner-1"})

    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_health_route_requires_authentication() -> None:
    client = TestClient(app)

    unauthorized_response = client.get("/health")

    _seed_user_with_profile(
        user_id="health-1",
        email="health@example.com",
        password="health-secret",
        role=UserRole.user,
    )
    headers = _login_and_get_header("health@example.com", "health-secret")
    authorized_response = client.get("/health", headers=headers)

    assert unauthorized_response.status_code == 401
    assert authorized_response.status_code == 200
    assert authorized_response.json() == {"status": "ok"}
