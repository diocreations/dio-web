from fastapi import APIRouter, Request, Response, Depends, HTTPException, BackgroundTasks
from database import db, logger
from helpers import hash_password, verify_password, generate_token, get_current_public_user, optional_public_user
from datetime import datetime, timezone, timedelta
import uuid
import os
import asyncio

router = APIRouter(prefix="/api")


async def send_password_reset_email(email: str, reset_token: str, origin_url: str):
    """Send password reset email via Resend"""
    resend_key = os.environ.get("RESEND_API_KEY", "")
    sender_email = os.environ.get("SENDER_EMAIL", "Diocreations <noreply@diocreations.eu>")
    
    if not resend_key:
        logger.error("RESEND_API_KEY not configured - cannot send password reset email")
        return
    
    try:
        import resend
        resend.api_key = resend_key
        
        # Use FRONTEND_URL from environment, fallback to production URL
        if not origin_url or "localhost" in origin_url or "preview.emergentagent" in origin_url:
            origin_url = os.environ.get("FRONTEND_URL", "https://www.diocreations.eu")
        
        reset_link = f"{origin_url}/reset-password?token={reset_token}"
        
        # Log for debugging
        logger.info(f"Password reset link generated: {reset_link}")
        
        html_content = f'''
        <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:32px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;">Password Reset Request</h1>
            </div>
            <div style="padding:32px;">
                <p style="color:#374151;font-size:16px;line-height:1.6;">
                    Hi there,
                </p>
                <p style="color:#374151;font-size:16px;line-height:1.6;">
                    We received a request to reset your password for your Diocreations account. Click the button below to set a new password:
                </p>
                <div style="text-align:center;margin:32px 0;">
                    <a href="{reset_link}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        Reset Password
                    </a>
                </div>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;text-align:center;">
                    Or copy and paste this link in your browser:<br/>
                    <a href="{reset_link}" style="color:#7c3aed;word-break:break-all;">{reset_link}</a>
                </p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                    This link will expire in 1 hour for security reasons.
                </p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                <p style="color:#9ca3af;font-size:12px;text-align:center;">
                    Diocreations | www.diocreations.eu
                </p>
            </div>
        </div>
        '''
        
        await asyncio.to_thread(resend.Emails.send, {
            "from": sender_email,
            "to": [email],
            "subject": "Reset Your Diocreations Password",
            "html": html_content,
        })
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")


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


@router.post("/user/forgot-password")
async def forgot_password(data: dict, background_tasks: BackgroundTasks):
    """Request a password reset email"""
    email = data.get("email", "").strip().lower()
    origin_url = data.get("origin_url", "https://www.diocreations.eu")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user exists and has email auth
    user = await db.public_users.find_one({"email": email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists with this email, you will receive a password reset link."}
    
    # Check if user registered with Google (no password to reset)
    if user.get("auth_type") == "google" and not user.get("password_hash"):
        return {"message": "If an account exists with this email, you will receive a password reset link."}
    
    # Generate reset token
    reset_token = f"rst_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_reset_tokens.delete_many({"email": email})  # Remove old tokens
    await db.password_reset_tokens.insert_one({
        "email": email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "used": False,
    })
    
    # Send email in background
    background_tasks.add_task(send_password_reset_email, email, reset_token, origin_url)
    
    return {"message": "If an account exists with this email, you will receive a password reset link."}


@router.post("/user/reset-password")
async def reset_password(data: dict):
    """Reset password using the token from email"""
    token = data.get("token", "").strip()
    new_password = data.get("password", "")
    
    if not token:
        raise HTTPException(status_code=400, detail="Reset token is required")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find valid token
    reset_doc = await db.password_reset_tokens.find_one({
        "token": token,
        "used": False,
    }, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")
    
    email = reset_doc["email"]
    
    # Update user password
    result = await db.public_users.update_one(
        {"email": email},
        {"$set": {
            "password_hash": hash_password(new_password),
            "auth_type": "email",  # Ensure they can now login with email
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update password")
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    # Invalidate all existing sessions for security
    user = await db.public_users.find_one({"email": email}, {"_id": 0})
    if user:
        await db.public_sessions.delete_many({"user_id": user["user_id"]})
    
    return {"message": "Password reset successful. You can now log in with your new password."}
