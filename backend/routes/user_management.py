"""User Management Routes for Admin - Manages all user types"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from database import db, logger
from helpers import get_current_user
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/admin/user-management", tags=["user-management"])


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class PaidServiceAdd(BaseModel):
    service_type: str  # "resume_analyzer", "resume_builder", "cover_letter", "linkedin_optimizer"
    credits: int = 1
    expires_at: Optional[str] = None
    notes: Optional[str] = None


# ==================== RESUME TOOL USERS ====================

@router.get("/resume-users")
async def get_resume_users(user: dict = Depends(get_current_user)):
    """Get all users who have used resume tools (analyzer, builder, cover letter)"""
    
    # Get unique users from resume analyses
    analyzer_users = await db.resume_analyses.aggregate([
        {"$match": {"user_email": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$user_email",
            "analysis_count": {"$sum": 1},
            "last_analysis": {"$max": "$created_at"},
            "first_analysis": {"$min": "$created_at"}
        }}
    ]).to_list(1000)
    
    # Get users from resume uploads (includes those without email in analyses)
    upload_users = await db.resume_uploads.aggregate([
        {"$match": {"user_email": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$user_email",
            "upload_count": {"$sum": 1},
            "last_upload": {"$max": "$created_at"}
        }}
    ]).to_list(1000)
    
    # Get users from saved resumes (builder)
    builder_users = await db.saved_resumes.aggregate([
        {"$match": {"user_email": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$user_email",
            "resume_count": {"$sum": 1},
            "last_saved": {"$max": "$updated_at"}
        }}
    ]).to_list(1000)
    
    # Get cover letter users
    cover_letter_users = await db.cover_letters.aggregate([
        {"$match": {"user_email": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$user_email",
            "cover_letter_count": {"$sum": 1},
            "last_generated": {"$max": "$created_at"}
        }}
    ]).to_list(1000)
    
    # Get LinkedIn optimizer users
    linkedin_users = await db.linkedin_analyses.aggregate([
        {"$match": {"user_email": {"$exists": True, "$ne": ""}}},
        {"$group": {
            "_id": "$user_email",
            "linkedin_count": {"$sum": 1},
            "last_analysis": {"$max": "$created_at"}
        }}
    ]).to_list(1000)
    
    # Get payments for credits info
    payments = await db.resume_payments.find(
        {"status": "completed"},
        {"_id": 0, "email": 1, "amount": 1, "created_at": 1}
    ).to_list(1000)
    
    # Get manual credits from user_credits collection
    manual_credits = await db.user_credits.find({}, {"_id": 0}).to_list(1000)
    credits_map = {c.get("email", ""): c for c in manual_credits}
    
    # Merge all users
    all_emails = set()
    for u in analyzer_users:
        if u["_id"]:
            all_emails.add(u["_id"])
    for u in upload_users:
        if u["_id"]:
            all_emails.add(u["_id"])
    for u in builder_users:
        if u["_id"]:
            all_emails.add(u["_id"])
    for u in cover_letter_users:
        if u["_id"]:
            all_emails.add(u["_id"])
    for u in linkedin_users:
        if u["_id"]:
            all_emails.add(u["_id"])
    
    # Build user list with aggregated data
    users = []
    analyzer_map = {u["_id"]: u for u in analyzer_users}
    upload_map = {u["_id"]: u for u in upload_users}
    builder_map = {u["_id"]: u for u in builder_users}
    cover_map = {u["_id"]: u for u in cover_letter_users}
    linkedin_map = {u["_id"]: u for u in linkedin_users}
    payment_map = {}
    for p in payments:
        email = p.get("email", "")
        if email:
            if email not in payment_map:
                payment_map[email] = {"total_paid": 0, "payment_count": 0}
            payment_map[email]["total_paid"] += p.get("amount", 0)
            payment_map[email]["payment_count"] += 1
    
    for email in all_emails:
        analyzer_data = analyzer_map.get(email, {})
        upload_data = upload_map.get(email, {})
        builder_data = builder_map.get(email, {})
        cover_data = cover_map.get(email, {})
        linkedin_data = linkedin_map.get(email, {})
        payment_data = payment_map.get(email, {})
        credit_data = credits_map.get(email, {})
        
        users.append({
            "email": email,
            "name": credit_data.get("name", ""),
            "tools_used": {
                "analyzer": analyzer_data.get("analysis_count", 0) > 0,
                "builder": builder_data.get("resume_count", 0) > 0,
                "cover_letter": cover_data.get("cover_letter_count", 0) > 0,
                "linkedin": linkedin_data.get("linkedin_count", 0) > 0
            },
            "usage": {
                "analyses": analyzer_data.get("analysis_count", 0),
                "uploads": upload_data.get("upload_count", 0),
                "saved_resumes": builder_data.get("resume_count", 0),
                "cover_letters": cover_data.get("cover_letter_count", 0),
                "linkedin_analyses": linkedin_data.get("linkedin_count", 0)
            },
            "credits": {
                "analyzer": credit_data.get("analyzer_credits", 0),
                "builder": credit_data.get("builder_credits", 0),
                "cover_letter": credit_data.get("cover_letter_credits", 0),
                "linkedin": credit_data.get("linkedin_credits", 0)
            },
            "payments": {
                "total_paid": payment_data.get("total_paid", 0),
                "payment_count": payment_data.get("payment_count", 0)
            },
            "last_activity": max(
                analyzer_data.get("last_analysis", ""),
                upload_data.get("last_upload", ""),
                builder_data.get("last_saved", ""),
                cover_data.get("last_generated", ""),
                linkedin_data.get("last_analysis", "")
            ) or None,
            "notes": credit_data.get("notes", ""),
            "is_active": credit_data.get("is_active", True)
        })
    
    # Sort by last activity
    users.sort(key=lambda x: x.get("last_activity") or "", reverse=True)
    
    return users


@router.get("/resume-users/{email}")
async def get_resume_user_detail(email: str, user: dict = Depends(get_current_user)):
    """Get detailed info for a specific resume tool user"""
    
    # Get all analyses
    analyses = await db.resume_analyses.find(
        {"user_email": email},
        {"_id": 0, "resume_id": 1, "filename": 1, "overall_score": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    
    # Get saved resumes
    resumes = await db.saved_resumes.find(
        {"user_email": email},
        {"_id": 0, "resume_id": 1, "name": 1, "updated_at": 1}
    ).sort("updated_at", -1).to_list(50)
    
    # Get cover letters
    cover_letters = await db.cover_letters.find(
        {"user_email": email},
        {"_id": 0, "cover_letter_id": 1, "job_title": 1, "company": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    
    # Get LinkedIn analyses
    linkedin = await db.linkedin_analyses.find(
        {"user_email": email},
        {"_id": 0, "analysis_id": 1, "score": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    
    # Get payments
    payments = await db.resume_payments.find(
        {"email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Get credits
    credits = await db.user_credits.find_one({"email": email}, {"_id": 0})
    
    return {
        "email": email,
        "credits": credits or {},
        "analyses": analyses,
        "saved_resumes": resumes,
        "cover_letters": cover_letters,
        "linkedin_analyses": linkedin,
        "payments": payments
    }


@router.put("/resume-users/{email}")
async def update_resume_user(email: str, update: UserUpdate, user: dict = Depends(get_current_user)):
    """Update resume user info"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = user.get("email", "admin")
    
    await db.user_credits.update_one(
        {"email": email},
        {"$set": update_data},
        upsert=True
    )
    return {"success": True}


@router.post("/resume-users/{email}/add-credits")
async def add_resume_user_credits(email: str, service: PaidServiceAdd, user: dict = Depends(get_current_user)):
    """Manually add credits/paid service for a user"""
    credit_field = f"{service.service_type}_credits"
    
    # Get current credits
    existing = await db.user_credits.find_one({"email": email})
    current_credits = existing.get(credit_field, 0) if existing else 0
    
    await db.user_credits.update_one(
        {"email": email},
        {
            "$set": {
                credit_field: current_credits + service.credits,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": user.get("email", "admin")
            },
            "$push": {
                "credit_history": {
                    "type": "manual_add",
                    "service": service.service_type,
                    "credits": service.credits,
                    "notes": service.notes,
                    "added_by": user.get("email", "admin"),
                    "added_at": datetime.now(timezone.utc).isoformat()
                }
            }
        },
        upsert=True
    )
    
    logger.info(f"Admin {user.get('email')} added {service.credits} {service.service_type} credits to {email}")
    return {"success": True, "new_total": current_credits + service.credits}


@router.delete("/resume-users/{email}")
async def delete_resume_user_data(email: str, user: dict = Depends(get_current_user)):
    """Delete all data for a resume tool user (GDPR compliance)"""
    # Delete from all collections
    await db.resume_analyses.delete_many({"user_email": email})
    await db.resume_uploads.delete_many({"user_email": email})
    await db.saved_resumes.delete_many({"user_email": email})
    await db.cover_letters.delete_many({"user_email": email})
    await db.linkedin_analyses.delete_many({"user_email": email})
    await db.user_credits.delete_one({"email": email})
    
    logger.info(f"Admin {user.get('email')} deleted all data for resume user: {email}")
    return {"success": True, "message": f"All data deleted for {email}"}


# ==================== DIOCREATIONS USERS (Products & Services) ====================

@router.get("/diocreations-users")
async def get_diocreations_users(user: dict = Depends(get_current_user)):
    """Get all DioCreations platform users (registered via public auth)"""
    
    users_cursor = db.public_users.find({}, {"_id": 0, "password": 0})
    users = await users_cursor.to_list(1000)
    
    # Enrich with activity data
    for u in users:
        email = u.get("email", "")
        
        # Check for product purchases
        purchases = await db.product_purchases.find(
            {"user_email": email},
            {"_id": 0, "product_id": 1, "amount": 1, "created_at": 1}
        ).to_list(100)
        u["purchases"] = purchases
        u["total_spent"] = sum(p.get("amount", 0) for p in purchases)
        
        # Check for service inquiries
        inquiries = await db.contact_submissions.count_documents({"email": email})
        u["service_inquiries"] = inquiries
        
        # Check for newsletter subscription
        newsletter = await db.newsletter_subscribers.find_one({"email": email})
        u["newsletter_subscribed"] = newsletter is not None
    
    return users


@router.get("/diocreations-users/{user_id}")
async def get_diocreations_user_detail(user_id: str, user: dict = Depends(get_current_user)):
    """Get detailed info for a DioCreations user"""
    
    pub_user = await db.public_users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if not pub_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email = pub_user.get("email", "")
    
    # Get purchases
    purchases = await db.product_purchases.find(
        {"user_email": email},
        {"_id": 0}
    ).to_list(100)
    
    # Get contact submissions
    contacts = await db.contact_submissions.find(
        {"email": email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Get sessions
    sessions = await db.public_sessions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    return {
        "user": pub_user,
        "purchases": purchases,
        "contacts": contacts,
        "sessions": sessions
    }


@router.post("/diocreations-users")
async def create_diocreations_user(data: dict, user: dict = Depends(get_current_user)):
    """Create a new DioCreations user (admin only)"""
    from helpers import hash_password
    
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    password = data.get("password", "")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if exists
    existing = await db.public_users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user_doc = {
        "user_id": f"pub_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": name,
        "password": hash_password(password) if password else None,
        "is_active": True,
        "is_verified": True,  # Admin-created users are pre-verified
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.get("email", "admin"),
        "notes": data.get("notes", "")
    }
    
    await db.public_users.insert_one(user_doc)
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    
    return user_doc


@router.put("/diocreations-users/{user_id}")
async def update_diocreations_user(user_id: str, update: UserUpdate, user: dict = Depends(get_current_user)):
    """Update a DioCreations user"""
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = user.get("email", "admin")
    
    result = await db.public_users.update_one({"user_id": user_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True}


@router.post("/diocreations-users/{user_id}/add-service")
async def add_diocreations_user_service(user_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Manually add a paid service/product for a DioCreations user"""
    
    pub_user = await db.public_users.find_one({"user_id": user_id}, {"_id": 0, "email": 1})
    if not pub_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    service_doc = {
        "purchase_id": f"manual_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "user_email": pub_user.get("email", ""),
        "product_id": data.get("product_id"),
        "product_name": data.get("product_name"),
        "amount": data.get("amount", 0),
        "currency": data.get("currency", "EUR"),
        "status": "completed",
        "payment_method": "manual",
        "notes": data.get("notes", ""),
        "added_by": user.get("email", "admin"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.product_purchases.insert_one(service_doc)
    
    logger.info(f"Admin {user.get('email')} added manual service for user {user_id}")
    return {"success": True}


@router.delete("/diocreations-users/{user_id}")
async def delete_diocreations_user(user_id: str, user: dict = Depends(get_current_user)):
    """Delete a DioCreations user and their data"""
    
    pub_user = await db.public_users.find_one({"user_id": user_id})
    if not pub_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email = pub_user.get("email", "")
    
    # Delete user data
    await db.public_users.delete_one({"user_id": user_id})
    await db.public_sessions.delete_many({"user_id": user_id})
    await db.product_purchases.delete_many({"user_id": user_id})
    
    logger.info(f"Admin {user.get('email')} deleted DioCreations user: {email}")
    return {"success": True, "message": f"User {email} deleted"}


# ==================== STATISTICS ====================

@router.get("/stats")
async def get_user_stats(user: dict = Depends(get_current_user)):
    """Get user statistics for dashboard"""
    
    # Resume tool stats
    analyzer_users = await db.resume_analyses.distinct("user_email")
    builder_users = await db.saved_resumes.distinct("user_email")
    cover_letter_users = await db.cover_letters.distinct("user_email")
    
    # DioCreations users
    dio_users_count = await db.public_users.count_documents({})
    
    # Active today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    active_today = await db.resume_analyses.count_documents({"created_at": {"$gte": today}})
    
    # Revenue
    payments = await db.resume_payments.find({"status": "completed"}, {"_id": 0, "amount": 1}).to_list(1000)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    return {
        "resume_tools": {
            "analyzer_users": len([u for u in analyzer_users if u]),
            "builder_users": len([u for u in builder_users if u]),
            "cover_letter_users": len([u for u in cover_letter_users if u])
        },
        "diocreations_users": dio_users_count,
        "active_today": active_today,
        "total_revenue": total_revenue
    }
