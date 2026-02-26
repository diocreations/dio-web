from fastapi import APIRouter, Depends, HTTPException
from database import db, EMERGENT_LLM_KEY, logger
from helpers import get_current_public_user, optional_public_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timezone
import uuid
import json

router = APIRouter(prefix="/api")


@router.post("/cover-letter/generate")
async def generate_cover_letter(data: dict, user=Depends(optional_public_user)):
    """Generate an AI cover letter from resume text + job description"""
    resume_text = data.get("resume_text", "")
    job_description = data.get("job_description", "")
    job_title = data.get("job_title", "")
    company_name = data.get("company_name", "")
    tone = data.get("tone", "professional")

    if not resume_text and not job_description:
        raise HTTPException(status_code=400, detail="Provide resume text or job description")

    # If resume_id provided, load text from DB
    resume_id = data.get("resume_id")
    if resume_id and not resume_text:
        upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
        if upload:
            resume_text = upload.get("text", "")[:4000]

    prompt = f"""Write a professional cover letter based on the following information. Return ONLY the cover letter text (no JSON, no markdown code blocks).

TONE: {tone}
JOB TITLE: {job_title or 'Not specified'}
COMPANY: {company_name or 'Not specified'}

JOB DESCRIPTION:
{job_description[:3000] if job_description else 'Not provided'}

RESUME/BACKGROUND:
{resume_text[:4000] if resume_text else 'Not provided'}

Write a compelling, personalized cover letter (3-4 paragraphs). Be specific about how the candidate's experience matches the job requirements. Keep it concise and impactful."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"cover_letter_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert cover letter writer. Write compelling, professional cover letters. Return only the letter text."
        ).with_model("gemini", "gemini-2.0-flash")
        cover_letter_text = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}")
        raise HTTPException(status_code=500, detail="Generation failed. Please try again.")

    letter_id = f"cl_{uuid.uuid4().hex[:12]}"
    doc = {
        "letter_id": letter_id,
        "cover_letter": cover_letter_text.strip(),
        "job_title": job_title,
        "company_name": company_name,
        "tone": tone,
        "resume_id": resume_id,
        "user_id": user["user_id"] if user else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cover_letters.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/cover-letter/{letter_id}")
async def get_cover_letter(letter_id: str):
    doc = await db.cover_letters.find_one({"letter_id": letter_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return doc
