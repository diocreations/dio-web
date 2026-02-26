from fastapi import APIRouter, Request, Response, Depends
from database import db, logger
from helpers import hash_password, verify_password, generate_token, get_current_public_user, optional_public_user
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api")


@router.post("/user/register")
async def register_public_user(data: dict, response: Response):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "")
    if not email or not password:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(password) < 6:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.public_users.find_one({"email": email})
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"pub_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": hash_password(password),
        "auth_type": "email",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.public_users.insert_one(user_doc)
    session_token = generate_token()
    await db.public_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("pub_session_token", session_token, httponly=True, samesite="none", secure=True, max_age=86400)
    return {"user_id": user_id, "email": email, "name": name, "session_token": session_token}


@router.post("/user/login")
async def login_public_user(data: dict, response: Response):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email and password required")
    user = await db.public_users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(password, user.get("password_hash", "")):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Update last login
    await db.public_users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    session_token = generate_token()
    await db.public_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("pub_session_token", session_token, httponly=True, samesite="none", secure=True, max_age=86400)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "session_token": session_token,
    }


@router.get("/user/me")
async def get_public_me(user: dict = Depends(get_current_public_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "auth_type": user.get("auth_type", "email"),
    }


@router.post("/user/logout")
async def logout_public_user(request: Request, response: Response):
    token = request.cookies.get("pub_session_token")
    if token:
        await db.public_sessions.delete_one({"session_token": token})
    response.delete_cookie("pub_session_token")
    return {"message": "Logged out"}


@router.post("/user/google-callback")
async def google_callback_public(data: dict, response: Response):
    """Handle Google sign-in for public users.
    This receives the user info from the frontend after Google auth."""
    email = data.get("email", "").strip().lower()
    name = data.get("name", "")
    picture = data.get("picture", "")
    google_id = data.get("google_id", "")
    if not email:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Email required")
    user = await db.public_users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"pub_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "password_hash": "",
            "auth_type": "google",
            "google_id": google_id,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.public_users.insert_one(user)
    else:
        await db.public_users.update_one(
            {"email": email},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat(), "picture": picture or user.get("picture"), "name": name or user.get("name")}}
        )
    session_token = generate_token()
    await db.public_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("pub_session_token", session_token, httponly=True, samesite="none", secure=True, max_age=86400)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "session_token": session_token,
    }
