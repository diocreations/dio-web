from fastapi import Request, HTTPException
from database import db, SUPER_ADMIN_EMAIL, STRIPE_API_KEY, logger
from datetime import datetime, timezone
import hashlib
import secrets


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def generate_token() -> str:
    return secrets.token_urlsafe(32)


async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_public_user(request: Request) -> dict:
    """Get currently authenticated public user (non-admin)"""
    token = request.cookies.get("pub_session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.public_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.public_users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def optional_public_user(request: Request):
    """Get public user if authenticated, None otherwise"""
    try:
        return await get_current_public_user(request)
    except HTTPException:
        return None


async def check_admin_access(email: str) -> bool:
    if email == SUPER_ADMIN_EMAIL:
        return True
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    return admin is not None


async def get_admin_role(email: str) -> str:
    if email == SUPER_ADMIN_EMAIL:
        return "super_admin"
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    return admin.get("role", "admin") if admin else None


async def get_stripe_api_key() -> str:
    settings = await db.settings.find_one({"settings_id": "site_settings"})
    if settings and settings.get("stripe_api_key"):
        return settings["stripe_api_key"]
    return STRIPE_API_KEY
