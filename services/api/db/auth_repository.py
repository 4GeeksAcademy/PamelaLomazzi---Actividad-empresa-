from __future__ import annotations

from datetime import datetime
from pathlib import Path

from tinydb import Query, TinyDB
from tinydb.table import Table

from services.api.models.auth import Profile, ProfileTinyDBDoc, User, UserRole, UserTinyDBDoc

DB_PATH = Path(__file__).resolve().parents[3] / "data" / "auth_db.json"
USERS_TABLE_NAME = "users"
PROFILES_TABLE_NAME = "profiles"

_db: TinyDB | None = None


def _get_db() -> TinyDB:
    global _db
    if _db is None:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        _db = TinyDB(DB_PATH)
    return _db


def _users_table() -> Table:
    return _get_db().table(USERS_TABLE_NAME)


def _profiles_table() -> Table:
    return _get_db().table(PROFILES_TABLE_NAME)


def _serialize_user(user: User) -> UserTinyDBDoc:
    payload = user.model_dump()
    payload["role"] = user.role.value
    payload["created_at"] = user.created_at.isoformat()
    return payload  # type: ignore[return-value]


def _deserialize_user(payload: dict) -> User:
    user_data = dict(payload)
    created_at = user_data.get("created_at")
    if isinstance(created_at, str):
        user_data["created_at"] = datetime.fromisoformat(created_at)

    role = user_data.get("role")
    if isinstance(role, str):
        user_data["role"] = UserRole(role)

    return User(**user_data)


def _serialize_profile(profile: Profile) -> ProfileTinyDBDoc:
    return profile.model_dump()  # type: ignore[return-value]


def find_user_by_id(user_id: str) -> User | None:
    query = Query()
    record = _users_table().get(query.id == user_id)
    if record is None:
        return None
    return _deserialize_user(record)


def find_user_by_email(email: str) -> User | None:
    query = Query()
    record = _users_table().get(query.email == email)
    if record is None:
        return None
    return _deserialize_user(record)


def upsert_user(user: User) -> None:
    query = Query()
    _users_table().upsert(_serialize_user(user), query.id == user.id)


def find_profile_by_user_id(user_id: str) -> Profile | None:
    query = Query()
    record = _profiles_table().get(query.user_id == user_id)
    if record is None:
        return None
    return Profile(**record)


def upsert_profile(profile: Profile) -> None:
    query = Query()
    existing = _profiles_table().get(query.user_id == profile.user_id)
    if existing is not None and existing.get("id") != profile.id:
        raise ValueError("A profile for this user_id already exists")

    _profiles_table().upsert(_serialize_profile(profile), query.id == profile.id)


def list_users() -> list[User]:
    return [_deserialize_user(record) for record in _users_table().all()]


def delete_user_and_profile(user_id: str) -> bool:
    query = Query()
    user_removed = bool(_users_table().remove(query.id == user_id))
    _profiles_table().remove(query.user_id == user_id)
    return user_removed


def update_user_identity(*, user_id: str, email: str, role: UserRole) -> User | None:
    user = find_user_by_id(user_id)
    if user is None:
        return None

    user.email = email
    user.role = role
    upsert_user(user)
    return user


def update_profile_for_user(
    *,
    user_id: str,
    name: str,
    phone: str,
    address: str,
) -> Profile | None:
    profile = find_profile_by_user_id(user_id)
    if profile is None:
        return None

    profile.name = name
    profile.phone = phone
    profile.address = address
    upsert_profile(profile)
    return profile
