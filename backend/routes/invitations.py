"""User invitation system - allows users and admins to invite others to the platform"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from database import db, logger
from helpers import get_current_user, get_current_public_user, optional_public_user
from datetime import datetime, timezone, timedelta
import uuid
import os
import asyncio
import csv
import io

router = APIRouter(prefix="/api")


async def send_invitation_email(to_email: str, inviter_name: str, inviter_email: str, is_admin: bool = False):
    """Send invitation email via Resend"""
    resend_key = os.environ.get("RESEND_API_KEY", "")
    sender_email = os.environ.get("SENDER_EMAIL", "Diocreations <noreply@diocreations.eu>")
    
    if not resend_key:
        logger.error("RESEND_API_KEY not configured - cannot send invitation email")
        return False
    
    try:
        import resend
        resend.api_key = resend_key
        
        # Generate unique invitation token
        invite_token = f"inv_{uuid.uuid4().hex[:16]}"
        registration_link = f"https://www.diocreations.eu/login?invite={invite_token}"
        
        # Store invitation in database
        invite_doc = {
            "invite_id": invite_token,
            "email": to_email.lower().strip(),
            "inviter_email": inviter_email,
            "inviter_name": inviter_name,
            "is_admin_invite": is_admin,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        }
        await db.invitations.insert_one(invite_doc)
        
        # Build email content
        inviter_text = f"by {inviter_name}" if inviter_name else "by a team member"
        if is_admin:
            inviter_text = "by the Diocreations team"
        
        html_content = f'''
        <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:32px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;">You're Invited! 🎉</h1>
            </div>
            <div style="padding:32px;">
                <p style="color:#374151;font-size:16px;line-height:1.6;">
                    Hi there!
                </p>
                <p style="color:#374151;font-size:16px;line-height:1.6;">
                    You've been invited {inviter_text} to join <strong>Diocreations AI Career Tools</strong> — your one-stop platform for:
                </p>
                <ul style="color:#374151;font-size:14px;line-height:1.8;">
                    <li>📄 AI-powered Resume Analysis & Optimization</li>
                    <li>💼 LinkedIn Profile Enhancement</li>
                    <li>✉️ Custom Cover Letter Generation</li>
                </ul>
                <div style="text-align:center;margin:32px 0;">
                    <a href="{registration_link}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        Create Your Account
                    </a>
                </div>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                    This invitation link expires in 7 days.
                </p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                <p style="color:#9ca3af;font-size:12px;text-align:center;">
                    Diocreations | AI Career Tools | www.diocreations.eu
                </p>
            </div>
        </div>
        '''
        
        await asyncio.to_thread(resend.Emails.send, {
            "from": sender_email,
            "to": [to_email],
            "subject": "You're invited to join Diocreations AI Career Tools!",
            "html": html_content,
        })
        logger.info(f"Invitation email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send invitation email: {e}")
        return False


# ==================== USER INVITATIONS ====================

@router.post("/user/invite")
async def user_send_invitation(data: dict, user: dict = Depends(get_current_public_user)):
    """Allow logged-in users to invite others"""
    email = data.get("email", "").strip().lower()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    
    # Check if already invited
    existing = await db.invitations.find_one({"email": email, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="This email has already been invited")
    
    # Check if already a user
    existing_user = await db.public_users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="This person is already a user")
    
    # Send invitation
    inviter_name = user.get("name", "") or user.get("email", "").split("@")[0]
    success = await send_invitation_email(email, inviter_name, user.get("email", ""), is_admin=False)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send invitation. Please try again.")
    
    return {"message": f"Invitation sent to {email}", "email": email}


@router.get("/user/invitations")
async def get_user_invitations(user: dict = Depends(get_current_public_user)):
    """Get list of invitations sent by the current user"""
    invitations = await db.invitations.find(
        {"inviter_email": user.get("email")},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return invitations


# ==================== ADMIN INVITATIONS ====================

@router.post("/admin/invitations/send")
async def admin_send_invitation(data: dict, user: dict = Depends(get_current_user)):
    """Admin sends single invitation"""
    email = data.get("email", "").strip().lower()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    
    # Check if already invited (pending)
    existing = await db.invitations.find_one({"email": email, "status": "pending"})
    if existing:
        raise HTTPException(status_code=400, detail="This email has already been invited")
    
    # Check if already a user
    existing_user = await db.public_users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="This person is already a user")
    
    # Send invitation
    success = await send_invitation_email(email, "Diocreations Team", user.get("email", ""), is_admin=True)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send invitation. Please try again.")
    
    return {"message": f"Invitation sent to {email}", "email": email}


@router.post("/admin/invitations/bulk")
async def admin_bulk_invitations(data: dict, user: dict = Depends(get_current_user)):
    """Admin sends bulk invitations from a list of emails"""
    emails = data.get("emails", [])
    
    if not emails:
        raise HTTPException(status_code=400, detail="No emails provided")
    
    # Normalize and validate emails
    valid_emails = []
    for email in emails:
        email = email.strip().lower()
        if email and "@" in email:
            valid_emails.append(email)
    
    if not valid_emails:
        raise HTTPException(status_code=400, detail="No valid emails found")
    
    # Filter out already invited or existing users
    results = {
        "sent": [],
        "already_invited": [],
        "already_user": [],
        "failed": [],
    }
    
    for email in valid_emails:
        # Check if already invited
        existing = await db.invitations.find_one({"email": email, "status": "pending"})
        if existing:
            results["already_invited"].append(email)
            continue
        
        # Check if already a user
        existing_user = await db.public_users.find_one({"email": email})
        if existing_user:
            results["already_user"].append(email)
            continue
        
        # Send invitation
        success = await send_invitation_email(email, "Diocreations Team", user.get("email", ""), is_admin=True)
        if success:
            results["sent"].append(email)
        else:
            results["failed"].append(email)
    
    return {
        "message": f"Sent {len(results['sent'])} invitations",
        "results": results,
    }


@router.post("/admin/invitations/csv")
async def admin_csv_invitations(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Admin uploads CSV file with email addresses"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read CSV content
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        decoded = contents.decode("latin-1")
    
    # Parse CSV
    emails = []
    reader = csv.reader(io.StringIO(decoded))
    for row in reader:
        for cell in row:
            cell = cell.strip().lower()
            if cell and "@" in cell and "." in cell:
                emails.append(cell)
    
    if not emails:
        raise HTTPException(status_code=400, detail="No valid emails found in CSV")
    
    # Remove duplicates
    emails = list(set(emails))
    
    # Use bulk invitation logic
    results = {
        "sent": [],
        "already_invited": [],
        "already_user": [],
        "failed": [],
    }
    
    for email in emails[:100]:  # Limit to 100 at a time
        existing = await db.invitations.find_one({"email": email, "status": "pending"})
        if existing:
            results["already_invited"].append(email)
            continue
        
        existing_user = await db.public_users.find_one({"email": email})
        if existing_user:
            results["already_user"].append(email)
            continue
        
        success = await send_invitation_email(email, "Diocreations Team", user.get("email", ""), is_admin=True)
        if success:
            results["sent"].append(email)
        else:
            results["failed"].append(email)
    
    return {
        "message": f"Processed {len(emails)} emails, sent {len(results['sent'])} invitations",
        "results": results,
    }


@router.get("/admin/invitations")
async def get_all_invitations(user: dict = Depends(get_current_user)):
    """Get all invitations for admin dashboard"""
    invitations = await db.invitations.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Add statistics
    stats = {
        "total": len(invitations),
        "pending": len([i for i in invitations if i.get("status") == "pending"]),
        "accepted": len([i for i in invitations if i.get("status") == "accepted"]),
        "expired": len([i for i in invitations if i.get("status") == "expired"]),
    }
    
    return {"invitations": invitations, "stats": stats}


@router.delete("/admin/invitations/{invite_id}")
async def delete_invitation(invite_id: str, user: dict = Depends(get_current_user)):
    """Delete/cancel a pending invitation"""
    result = await db.invitations.delete_one({"invite_id": invite_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"message": "Invitation deleted"}


@router.post("/admin/invitations/resend/{invite_id}")
async def resend_invitation(invite_id: str, user: dict = Depends(get_current_user)):
    """Resend a pending invitation"""
    invite = await db.invitations.find_one({"invite_id": invite_id}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    email = invite.get("email")
    is_admin = invite.get("is_admin_invite", True)
    
    success = await send_invitation_email(email, "Diocreations Team", user.get("email", ""), is_admin=is_admin)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to resend invitation")
    
    # Update the invitation record
    await db.invitations.update_one(
        {"invite_id": invite_id},
        {"$set": {
            "resent_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        }}
    )
    
    return {"message": f"Invitation resent to {email}"}


# ==================== PUBLIC: VERIFY INVITATION ====================

@router.get("/invitation/verify/{invite_id}")
async def verify_invitation(invite_id: str):
    """Verify if an invitation is valid (public endpoint)"""
    invite = await db.invitations.find_one({"invite_id": invite_id}, {"_id": 0})
    
    if not invite:
        return {"valid": False, "message": "Invitation not found"}
    
    if invite.get("status") == "accepted":
        return {"valid": False, "message": "Invitation already used"}
    
    # Check expiration
    expires_at = invite.get("expires_at", "")
    if expires_at:
        try:
            exp_date = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp_date:
                await db.invitations.update_one(
                    {"invite_id": invite_id},
                    {"$set": {"status": "expired"}}
                )
                return {"valid": False, "message": "Invitation has expired"}
        except ValueError:
            pass
    
    return {
        "valid": True,
        "email": invite.get("email"),
        "inviter_name": invite.get("inviter_name"),
    }


@router.post("/invitation/accept/{invite_id}")
async def accept_invitation(invite_id: str):
    """Mark invitation as accepted (called after successful registration)"""
    result = await db.invitations.update_one(
        {"invite_id": invite_id, "status": "pending"},
        {"$set": {
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    
    if result.modified_count == 0:
        return {"success": False, "message": "Invitation not found or already accepted"}
    
    return {"success": True, "message": "Invitation accepted"}
