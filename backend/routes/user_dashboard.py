from fastapi import APIRouter, Depends
from database import db
from helpers import get_current_public_user

router = APIRouter(prefix="/api")


@router.get("/user/dashboard")
async def get_user_dashboard(user: dict = Depends(get_current_public_user)):
    """Get user's resume analysis history and dashboard data"""
    user_id = user["user_id"]
    email = user["email"]

    # Get resume analyses linked to this user
    analyses = await db.resume_analyses.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Also check by email for analyses done before login
    email_analyses = await db.resume_analyses.find(
        {"email": email, "user_id": {"$exists": False}}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Get cover letters
    cover_letters = await db.cover_letters.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    # Get payment history
    payments = await db.resume_payments.find(
        {"$or": [{"user_id": user_id}, {"email": email}]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return {
        "user": {
            "user_id": user_id,
            "email": email,
            "name": user.get("name", ""),
        },
        "analyses": analyses + email_analyses,
        "cover_letters": cover_letters,
        "payments": payments,
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
    await db.public_sessions.delete_many({"user_id": user_id})
    await db.public_users.delete_one({"user_id": user_id})
    return {"message": "All data deleted"}
