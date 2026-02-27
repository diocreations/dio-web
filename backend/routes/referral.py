"""Referral discount system routes"""
from fastapi import APIRouter, HTTPException, Depends
from database import db, logger
from helpers import get_current_user, get_current_public_user
from datetime import datetime, timezone
import uuid
import secrets

router = APIRouter(prefix="/api")


# ==================== ADMIN: Referral Config ====================

@router.get("/referral/config")
async def get_referral_config():
    """Get referral program configuration"""
    config = await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})
    if not config:
        default = {
            "config_id": "referral",
            "enabled": True,
            "discount_percent": 20,
            "referrer_reward_percent": 10,
            "max_uses_per_code": 50,
            "min_purchase_amount": 0,
        }
        await db.referral_config.insert_one(default)
        return {k: v for k, v in default.items() if k != "_id"}
    return config


@router.put("/referral/config")
async def update_referral_config(data: dict, user: dict = Depends(get_current_user)):
    """Update referral program config (admin only)"""
    data.pop("_id", None)
    data["config_id"] = "referral"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.referral_config.update_one({"config_id": "referral"}, {"$set": data}, upsert=True)
    return await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})


@router.get("/referral/stats")
async def get_referral_stats(user: dict = Depends(get_current_user)):
    """Get referral stats for admin dashboard"""
    total_codes = await db.referral_codes.count_documents({})
    total_uses = await db.referral_uses.count_documents({})
    total_revenue = 0
    uses = await db.referral_uses.find({}, {"_id": 0}).to_list(1000)
    for u in uses:
        total_revenue += u.get("original_amount", 0) - u.get("discounted_amount", 0)
    top_referrers = await db.referral_codes.find({}, {"_id": 0}).sort("use_count", -1).to_list(10)
    return {
        "total_codes": total_codes,
        "total_uses": total_uses,
        "total_discount_given": round(total_revenue, 2),
        "top_referrers": top_referrers,
    }


# ==================== PUBLIC: Referral Codes ====================

@router.post("/referral/generate")
async def generate_referral_code(data: dict):
    """Generate a referral code for a user (logged-in or by email)"""
    email = data.get("email", "")
    name = data.get("name", "")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    existing = await db.referral_codes.find_one({"email": email}, {"_id": 0})
    if existing:
        return existing
    code = f"DIO-{secrets.token_hex(3).upper()}"
    doc = {
        "code": code,
        "email": email,
        "name": name,
        "use_count": 0,
        "earnings": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.referral_codes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/referral/validate/{code}")
async def validate_referral_code(code: str):
    """Validate a referral code and return discount info"""
    referral = await db.referral_codes.find_one({"code": code.upper()}, {"_id": 0})
    if not referral:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    config = await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})
    if not config or not config.get("enabled", True):
        raise HTTPException(status_code=400, detail="Referral program is currently disabled")
    max_uses = config.get("max_uses_per_code", 50)
    if referral.get("use_count", 0) >= max_uses:
        raise HTTPException(status_code=400, detail="This referral code has reached its maximum uses")
    return {
        "valid": True,
        "code": referral["code"],
        "referrer_name": referral.get("name", ""),
        "discount_percent": config.get("discount_percent", 20),
    }


@router.post("/referral/apply")
async def apply_referral_code(data: dict):
    """Apply referral code to a purchase and return discounted price"""
    code = data.get("code", "").upper()
    original_amount = data.get("amount", 0)
    buyer_email = data.get("buyer_email", "")
    resume_id = data.get("resume_id", "")

    if not code or not original_amount:
        raise HTTPException(status_code=400, detail="code and amount required")

    referral = await db.referral_codes.find_one({"code": code}, {"_id": 0})
    if not referral:
        raise HTTPException(status_code=404, detail="Invalid referral code")

    # Can't use own referral code
    if referral.get("email") == buyer_email:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")

    config = await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})
    discount_percent = (config or {}).get("discount_percent", 20)
    discounted = round(original_amount * (1 - discount_percent / 100), 2)

    # Record the use
    await db.referral_uses.insert_one({
        "use_id": f"ref_use_{uuid.uuid4().hex[:12]}",
        "code": code,
        "referrer_email": referral["email"],
        "buyer_email": buyer_email,
        "resume_id": resume_id,
        "original_amount": original_amount,
        "discounted_amount": discounted,
        "discount_percent": discount_percent,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Update referral code stats
    referrer_reward = (config or {}).get("referrer_reward_percent", 10)
    await db.referral_codes.update_one(
        {"code": code},
        {"$inc": {"use_count": 1, "earnings": round(original_amount * referrer_reward / 100, 2)}},
    )

    return {
        "original_amount": original_amount,
        "discounted_amount": discounted,
        "discount_percent": discount_percent,
        "savings": round(original_amount - discounted, 2),
    }


@router.get("/referral/my-code")
async def get_my_referral_code(user: dict = Depends(get_current_public_user)):
    """Get the logged-in user's referral code"""
    email = user["email"]
    existing = await db.referral_codes.find_one({"email": email}, {"_id": 0})
    if not existing:
        code = f"DIO-{secrets.token_hex(3).upper()}"
        doc = {
            "code": code,
            "email": email,
            "name": user.get("name", ""),
            "use_count": 0,
            "earnings": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.referral_codes.insert_one(doc)
        doc.pop("_id", None)
        return doc
    return existing
