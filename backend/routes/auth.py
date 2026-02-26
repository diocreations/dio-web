"""Admin authentication routes (register, login, session, Google OAuth)"""
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from database import db, SUPER_ADMIN_EMAIL, logger
from helpers import hash_password, verify_password, generate_token, get_current_user, check_admin_access, get_admin_role
from datetime import datetime, timezone, timedelta
import uuid
import httpx

router = APIRouter(prefix="/api")


@router.post("/auth/register")
async def register(data: dict):
    email = data.get("email", "")
    password = data.get("password", "")
    name = data.get("name", "")
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "role": "admin",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    session_token = generate_token()
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"user_id": user_id, "email": email, "name": name, "session_token": session_token}


@router.post("/auth/login")
async def login(response: Response, data: dict):
    email = data.get("email", "")
    password = data.get("password", "")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_token = generate_token()
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "admin"),
        "picture": user.get("picture"),
        "session_token": session_token,
    }


@router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session data (admin)"""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        auth_data = auth_response.json()
    user_email = auth_data["email"]
    has_access = await check_admin_access(user_email)
    user_role = await get_admin_role(user_email)
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied. You don't have admin privileges. Contact the super admin to get access.")
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if user:
        await db.users.update_one({"email": user_email}, {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture"), "role": user_role}})
        user_id = user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_email,
            "name": auth_data["name"],
            "role": user_role,
            "picture": auth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    session_token = auth_data.get("session_token", generate_token())
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    return {
        "user_id": user_id,
        "email": user_email,
        "name": auth_data["name"],
        "role": user_role,
        "picture": auth_data.get("picture"),
        "session_token": session_token,
    }


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_role = await get_admin_role(user["email"])
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user_role or user.get("role", "admin"),
        "picture": user.get("picture"),
    }


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}


@router.post("/auth/check-admin")
async def check_admin_access_route(request: Request):
    user = await get_current_user(request)
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Email not found")
    has_access = await check_admin_access(email)
    if not has_access:
        raise HTTPException(status_code=403, detail="Admin access denied. Contact administrator.")
    role = await get_admin_role(email)
    return {"has_access": True, "role": role, "email": email}
