"""Admin user management, stats, settings, and media routes"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from database import db, SUPER_ADMIN_EMAIL, logger
from helpers import get_current_user, get_admin_role
from datetime import datetime, timezone
import uuid
import base64

router = APIRouter(prefix="/api")


# ==================== STATS ====================

@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    services_count = await db.services.count_documents({})
    products_count = await db.products.count_documents({})
    portfolio_count = await db.portfolio.count_documents({})
    blog_count = await db.blog.count_documents({})
    testimonials_count = await db.testimonials.count_documents({})
    unread_contacts = await db.contact_submissions.count_documents({"is_read": False})
    total_contacts = await db.contact_submissions.count_documents({})
    return {
        "services": services_count,
        "products": products_count,
        "portfolio": portfolio_count,
        "blog_posts": blog_count,
        "testimonials": testimonials_count,
        "unread_contacts": unread_contacts,
        "total_contacts": total_contacts,
    }


# ==================== SETTINGS ====================

@router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"settings_id": "site_settings"}, {"_id": 0})
    if not settings:
        from models import SiteSettings
        default = SiteSettings()
        await db.settings.insert_one(default.model_dump())
        return default.model_dump()
    return settings


@router.put("/settings")
async def update_settings(update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("settings_id", None)
    await db.settings.update_one({"settings_id": "site_settings"}, {"$set": update}, upsert=True)
    return await db.settings.find_one({"settings_id": "site_settings"}, {"_id": 0})


# ==================== MEDIA ====================

@router.get("/media")
async def get_media(user: dict = Depends(get_current_user)):
    media = await db.media.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return media


@router.post("/media")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    encoded = base64.b64encode(content).decode()
    data_url = f"data:{file.content_type};base64,{encoded}"
    media_doc = {
        "media_id": f"media_{uuid.uuid4().hex[:12]}",
        "filename": f"{uuid.uuid4().hex[:12]}_{file.filename}",
        "original_filename": file.filename,
        "mime_type": file.content_type,
        "size": len(content),
        "url": data_url,
        "alt_text": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media.insert_one(media_doc)
    media_doc.pop("_id", None)
    return media_doc


@router.delete("/media/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(get_current_user)):
    result = await db.media.delete_one({"media_id": media_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted"}


# ==================== ADMIN USERS ====================

@router.get("/admin/users")
async def get_admin_users(user: dict = Depends(get_current_user)):
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    admins = await db.admin_users.find({}, {"_id": 0}).to_list(100)
    admins.insert(0, {
        "admin_id": "super_admin",
        "email": SUPER_ADMIN_EMAIL,
        "name": "Super Admin",
        "role": "super_admin",
        "is_active": True,
    })
    return admins


@router.post("/admin/users")
async def add_admin_user(request: Request, user: dict = Depends(get_current_user)):
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    data = await request.json()
    new_email = data.get("email")
    new_name = data.get("name", "")
    if not new_email:
        raise HTTPException(status_code=400, detail="Email required")
    existing = await db.admin_users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    admin_id = f"admin_{uuid.uuid4().hex[:12]}"
    admin_doc = {
        "admin_id": admin_id,
        "email": new_email,
        "name": new_name,
        "role": "admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.admin_users.insert_one(admin_doc)
    return {"message": "Admin user added", "admin_id": admin_id}


@router.delete("/admin/users/{admin_id}")
async def remove_admin_user(admin_id: str, user: dict = Depends(get_current_user)):
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    if admin_id == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot remove super admin")
    result = await db.admin_users.delete_one({"admin_id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin user removed"}
