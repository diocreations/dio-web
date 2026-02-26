from fastapi import APIRouter, Depends, HTTPException
from database import db
from helpers import get_current_user
import uuid

router = APIRouter(prefix="/api")

DEFAULT_TEMPLATES = [
    {
        "template_id": "tpl_classic",
        "name": "Classic Professional",
        "description": "Clean, traditional resume layout suitable for most industries",
        "category": "professional",
        "is_active": True,
        "order": 0,
        "sections": ["header", "summary", "experience", "education", "skills"],
        "style": {"font": "serif", "color": "#1a1a2e", "layout": "single-column"},
    },
    {
        "template_id": "tpl_modern",
        "name": "Modern Minimal",
        "description": "Contemporary design with clean lines and ample whitespace",
        "category": "modern",
        "is_active": True,
        "order": 1,
        "sections": ["header", "summary", "skills", "experience", "education", "certifications"],
        "style": {"font": "sans-serif", "color": "#0f3460", "layout": "two-column"},
    },
    {
        "template_id": "tpl_creative",
        "name": "Creative Bold",
        "description": "Eye-catching design for creative professionals",
        "category": "creative",
        "is_active": True,
        "order": 2,
        "sections": ["header", "summary", "portfolio", "experience", "skills", "education"],
        "style": {"font": "sans-serif", "color": "#6c63ff", "layout": "sidebar"},
    },
    {
        "template_id": "tpl_ats",
        "name": "ATS Optimized",
        "description": "Maximum compatibility with applicant tracking systems",
        "category": "ats",
        "is_active": True,
        "order": 3,
        "sections": ["header", "summary", "keywords", "experience", "education", "skills"],
        "style": {"font": "sans-serif", "color": "#2d3436", "layout": "single-column"},
    },
]


# ---- Public endpoints ----

@router.get("/resume/templates")
async def get_templates_public():
    """Get active resume templates for users"""
    templates = await db.resume_templates.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    if not templates:
        return DEFAULT_TEMPLATES
    return templates


# ---- Admin endpoints ----

@router.get("/admin/resume/templates")
async def get_all_templates(user: dict = Depends(get_current_user)):
    templates = await db.resume_templates.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not templates:
        # Seed defaults
        for tpl in DEFAULT_TEMPLATES:
            await db.resume_templates.insert_one({**tpl})
        return DEFAULT_TEMPLATES
    return templates


@router.post("/admin/resume/templates")
async def create_template(data: dict, user: dict = Depends(get_current_user)):
    tpl = {
        "template_id": f"tpl_{uuid.uuid4().hex[:12]}",
        "name": data.get("name", "New Template"),
        "description": data.get("description", ""),
        "category": data.get("category", "professional"),
        "is_active": data.get("is_active", True),
        "order": data.get("order", 0),
        "sections": data.get("sections", ["header", "summary", "experience", "education", "skills"]),
        "style": data.get("style", {"font": "sans-serif", "color": "#1a1a2e", "layout": "single-column"}),
    }
    await db.resume_templates.insert_one(tpl)
    tpl.pop("_id", None)
    return tpl


@router.put("/admin/resume/templates/{template_id}")
async def update_template(template_id: str, data: dict, user: dict = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("template_id", None)
    result = await db.resume_templates.update_one({"template_id": template_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return await db.resume_templates.find_one({"template_id": template_id}, {"_id": 0})


@router.delete("/admin/resume/templates/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    result = await db.resume_templates.delete_one({"template_id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}
