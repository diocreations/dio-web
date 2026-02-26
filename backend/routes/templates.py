from fastapi import APIRouter, Depends, HTTPException
from database import db
from helpers import get_current_user
import uuid

router = APIRouter(prefix="/api")

DEFAULT_TEMPLATES = [
    {
        "template_id": "tpl_executive",
        "name": "Executive Professional",
        "description": "Polished format for senior roles. Clean single-column layout with a strong summary and quantified achievements.",
        "category": "professional",
        "is_active": True,
        "order": 0,
        "sections": ["header", "summary", "experience", "education", "skills", "certifications"],
        "style": {"font": "serif", "color": "#1a1a2e", "layout": "single-column", "accent": "#1a1a2e"},
        "preview": {"header_style": "centered", "section_dividers": True, "bullet_style": "dash"},
        "prompt_instruction": "Executive format: Start with full name centered, contact info below. Write a strong 3-line Professional Summary. List Work Experience with company, title, dates, then 4-5 bullet points per role using strong action verbs and quantified results. End with Education, Skills, and Certifications. Use clean section dividers.",
    },
    {
        "template_id": "tpl_modern_tech",
        "name": "Modern Tech",
        "description": "Optimized for tech roles. Leads with a Technical Skills section and highlights engineering impact.",
        "category": "modern",
        "is_active": True,
        "order": 1,
        "sections": ["header", "summary", "technical_skills", "experience", "projects", "education"],
        "style": {"font": "sans-serif", "color": "#0f3460", "layout": "skills-first", "accent": "#0f3460"},
        "preview": {"header_style": "left-aligned", "section_dividers": True, "bullet_style": "arrow"},
        "prompt_instruction": "Tech-focused format: Name and contact left-aligned. Concise 2-line Summary focused on years of experience and key technologies. TECHNICAL SKILLS section grouped by category (Languages, Frameworks, Cloud, Tools). Work Experience with engineering-specific impact metrics (latency reduced, uptime improved, users served). Include a KEY PROJECTS section. Education at the end.",
    },
    {
        "template_id": "tpl_ats_max",
        "name": "ATS Maximum",
        "description": "Stripped-down, keyword-dense format that scores highest on ATS scanners. No columns, no graphics.",
        "category": "ats",
        "is_active": True,
        "order": 2,
        "sections": ["header", "summary", "keywords", "experience", "education", "skills"],
        "style": {"font": "sans-serif", "color": "#2d3436", "layout": "single-column", "accent": "#2d3436"},
        "preview": {"header_style": "left-aligned", "section_dividers": False, "bullet_style": "dash"},
        "prompt_instruction": "ATS-optimized format: Simple plain text, no special formatting. Name and contact on top lines. Summary with keyword-rich sentences. Include a dedicated CORE COMPETENCIES / KEYWORDS section listing 15-20 relevant skills and technologies as comma-separated terms. Experience with clear Company | Title | Dates format and bullet points starting with action verbs. Keep everything in a single column with no tables or columns.",
    },
    {
        "template_id": "tpl_career_change",
        "name": "Career Pivot",
        "description": "Highlights transferable skills for career changers. Leads with skills and a compelling narrative.",
        "category": "career-change",
        "is_active": True,
        "order": 3,
        "sections": ["header", "summary", "core_competencies", "relevant_experience", "additional_experience", "education"],
        "style": {"font": "sans-serif", "color": "#6c5ce7", "layout": "skills-first", "accent": "#6c5ce7"},
        "preview": {"header_style": "centered", "section_dividers": True, "bullet_style": "dot"},
        "prompt_instruction": "Career-change format: Open with a compelling 4-line Professional Summary that bridges past experience to the target role. CORE COMPETENCIES section listing transferable skills. Rename work experience to RELEVANT EXPERIENCE highlighting only the transferable aspects. Separate ADDITIONAL EXPERIENCE for older/unrelated roles in brief format. Focus on skills, adaptability, and outcomes rather than job-specific duties.",
    },
    {
        "template_id": "tpl_compact",
        "name": "One-Page Compact",
        "description": "Everything fits on one page. Tight formatting for early-career professionals or internship seekers.",
        "category": "compact",
        "is_active": True,
        "order": 4,
        "sections": ["header", "summary", "skills", "experience", "education"],
        "style": {"font": "sans-serif", "color": "#2d3436", "layout": "single-column", "accent": "#636e72"},
        "preview": {"header_style": "inline", "section_dividers": False, "bullet_style": "dash"},
        "prompt_instruction": "Compact one-page format: Name and all contact info on ONE line. Summary in 2 sentences max. SKILLS as a single comma-separated line. Experience with max 3 bullet points per role, each one line. Education in one line per degree. Be extremely concise — every word must earn its place. Target total length under 400 words.",
    },
]


# ---- Public endpoints ----

@router.get("/resume/templates")
async def get_templates_public():
    """Get active resume templates for users"""
    templates = await db.resume_templates.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    if not templates:
        # Seed defaults
        for tpl in DEFAULT_TEMPLATES:
            await db.resume_templates.insert_one({**tpl})
        return DEFAULT_TEMPLATES
    return templates


# ---- Admin endpoints ----

@router.get("/admin/resume/templates")
async def get_all_templates(user: dict = Depends(get_current_user)):
    templates = await db.resume_templates.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not templates:
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
        "prompt_instruction": data.get("prompt_instruction", ""),
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
