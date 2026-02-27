from fastapi import APIRouter, Depends
from database import db
from helpers import get_current_public_user

router = APIRouter(prefix="/api")


@router.get("/user/dashboard")
async def get_user_dashboard(user: dict = Depends(get_current_public_user)):
    """Get user's full dashboard: resume history, payments, referrals"""
    user_id = user["user_id"]
    email = user["email"]

    # Resume uploads (history/versions)
    uploads = await db.resume_uploads.find(
        {"$or": [{"user_id": user_id}, {"email": email}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Resume analyses
    analyses = await db.resume_analyses.find(
        {"$or": [{"user_id": user_id}, {"email": email}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Also check by email for analyses done before login
    email_only = await db.resume_analyses.find(
        {"email": email, "user_id": {"$exists": False}}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Resume improvements
    improvements = await db.resume_improvements.find(
        {"$or": [{"user_id": user_id}, {"email": email}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Cover letters
    cover_letters = await db.cover_letters.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Payment history
    payments = await db.resume_payments.find(
        {"$or": [{"user_id": user_id}, {"email": email}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Referral code
    referral = await db.referral_codes.find_one({"email": email}, {"_id": 0})

    # Build resume history with versions
    resume_history = []
    for upload in uploads:
        rid = upload.get("resume_id")
        analysis = next((a for a in analyses if a.get("resume_id") == rid), None)
        improvement = next((imp for imp in improvements if imp.get("resume_id") == rid), None)
        payment = next((p for p in payments if p.get("resume_id") == rid and p.get("status") == "paid"), None)
        resume_history.append({
            "resume_id": rid,
            "filename": upload.get("filename", "Unknown"),
            "word_count": upload.get("word_count", 0),
            "created_at": upload.get("created_at", ""),
            "overall_score": analysis.get("overall_score") if analysis else None,
            "ats_score": analysis.get("ats_score") if analysis else None,
            "has_improvement": improvement is not None,
            "is_paid": payment is not None,
            "paid_at": payment.get("paid_at") if payment else None,
            "amount": payment.get("amount") if payment else None,
            "currency": payment.get("currency") if payment else None,
        })

    all_analyses = analyses + email_only
    # Deduplicate by resume_id
    seen = set()
    unique_analyses = []
    for a in all_analyses:
        rid = a.get("resume_id", "")
        if rid not in seen:
            seen.add(rid)
            unique_analyses.append(a)

    return {
        "user": {
            "user_id": user_id,
            "email": email,
            "name": user.get("name", ""),
        },
        "resume_history": resume_history,
        "analyses": unique_analyses,
        "cover_letters": cover_letters,
        "payments": payments,
        "referral": referral,
        "stats": {
            "total_resumes": len(resume_history),
            "total_paid": sum(1 for r in resume_history if r["is_paid"]),
            "total_analyses": len(unique_analyses),
            "total_cover_letters": len(cover_letters),
        },
    }


@router.delete("/user/data")
async def delete_user_data(user: dict = Depends(get_current_public_user)):
    """Let user delete all their data"""
    user_id = user["user_id"]
    email = user["email"]
    await db.resume_analyses.delete_many({"$or": [{"user_id": user_id}, {"email": email}]})
    await db.resume_uploads.delete_many({"$or": [{"user_id": user_id}, {"email": email}]})
    await db.resume_improvements.delete_many({"$or": [{"user_id": user_id}, {"email": email}]})
    await db.cover_letters.delete_many({"user_id": user_id})
    await db.resume_payments.delete_many({"$or": [{"user_id": user_id}, {"email": email}]})
    await db.linkedin_optimizations.delete_many({"$or": [{"user_id": user_id}, {"email": email}]})
    await db.public_sessions.delete_many({"user_id": user_id})
    await db.public_users.delete_one({"user_id": user_id})
    return {"message": "All data deleted"}
