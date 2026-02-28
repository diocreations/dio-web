"""Google OAuth for public users via Emergent Auth"""
from fastapi import APIRouter, Response, HTTPException
from database import db, logger
from helpers import generate_token
from datetime import datetime, timezone, timedelta
import httpx
import uuid

router = APIRouter(prefix="/api")

EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


@router.post("/user/google-session")
async def exchange_google_session(data: dict, response: Response):
    """Exchange Emergent Auth session_id for a local public user session.
    Frontend sends session_id from the URL fragment after Google redirect.
    REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH"""
    session_id = data.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    # Call Emergent Auth to get user data
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                EMERGENT_AUTH_SESSION_URL,
                headers={"X-Session-ID": session_id},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            google_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergent Auth call failed: {e}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")

    email = google_data.get("email", "").strip().lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")

    # Find or create public user
    user = await db.public_users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"pub_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "password_hash": "",
            "auth_type": "google",
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.public_users.insert_one(user)
    else:
        await db.public_users.update_one(
            {"email": email},
            {"$set": {
                "last_login": datetime.now(timezone.utc).isoformat(),
                "picture": picture or user.get("picture"),
                "name": name or user.get("name"),
            }},
        )

    # Create session
    session_token = generate_token()
    await db.public_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
        "pub_session_token", session_token,
        httponly=True, samesite="none", secure=True, max_age=86400, path="/",
    )
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "session_token": session_token,
    }


@router.post("/admin/google-session")
async def exchange_admin_google_session(data: dict, response: Response):
    """Exchange Emergent Auth session_id for an admin session.
    Only works for users who are in the admin_users collection or are the super_admin."""
    from database import SUPER_ADMIN_EMAIL
    
    session_id = data.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    # Call Emergent Auth to get user data
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                EMERGENT_AUTH_SESSION_URL,
                headers={"X-Session-ID": session_id},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            google_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emergent Auth call failed: {e}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")

    email = google_data.get("email", "").strip().lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")

    # Check if user is super admin or in admin_users
    is_super_admin = email == SUPER_ADMIN_EMAIL.lower()
    admin_user = await db.admin_users.find_one({"email": email, "is_active": True}, {"_id": 0})
    
    if not is_super_admin and not admin_user:
        raise HTTPException(status_code=403, detail="You don't have admin access. Contact the super admin.")

    # Determine role and admin_id
    if is_super_admin:
        admin_id = "super_admin"
        role = "super_admin"
    else:
        admin_id = admin_user["admin_id"]
        role = admin_user.get("role", "admin")

    # Create admin session token
    session_token = generate_token()
    await db.admin_sessions.insert_one({
        "admin_id": admin_id,
        "email": email,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    response.set_cookie(
        "admin_session", session_token,
        httponly=True, samesite="none", secure=True, max_age=86400, path="/",
    )
    
    return {
        "admin_id": admin_id,
        "email": email,
        "name": name or (admin_user.get("name") if admin_user else "Super Admin"),
        "role": role,
        "picture": picture,
    }
