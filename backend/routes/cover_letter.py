from fastapi import APIRouter, Depends, HTTPException
from database import db, EMERGENT_LLM_KEY, logger
from helpers import get_current_public_user, optional_public_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timezone
import uuid
import json
import httpx
from bs4 import BeautifulSoup
import re

router = APIRouter(prefix="/api")


@router.post("/cover-letter/fetch-job")
async def fetch_job_from_url(data: dict):
    """Fetch and extract job description from a URL"""
    url = data.get("url", "").strip()
    
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Validate URL
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    try:
        # Fetch the page content
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            }
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        
        html_content = response.text
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Remove script and style elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
            element.decompose()
        
        # Extract text content
        text_content = soup.get_text(separator="\n", strip=True)
        
        # Truncate for AI processing
        text_content = text_content[:6000]
        
        # Use AI to extract structured job information
        prompt = f"""Extract job posting information from this webpage content. Return ONLY valid JSON (no markdown, no code blocks):
{{"job_title": "extracted title or empty string", "company_name": "extracted company or empty string", "job_description": "the full job description including responsibilities and requirements"}}

Be thorough in extracting the job description - include all responsibilities, requirements, qualifications, and skills mentioned.

WEBPAGE CONTENT:
{text_content}"""

        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"job_fetch_{uuid.uuid4().hex[:8]}",
                system_message="You are a job posting parser. Extract job details from webpage content. Return ONLY valid JSON."
            ).with_model("gemini", "gemini-2.0-flash")
            response_text = await chat.send_message(UserMessage(text=prompt))
            
            # Clean the response
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
            
            result = json.loads(cleaned)
            
            return {
                "job_title": result.get("job_title", ""),
                "company_name": result.get("company_name", ""),
                "job_description": result.get("job_description", ""),
                "source_url": url,
            }
        except json.JSONDecodeError:
            # If AI fails to return valid JSON, try basic extraction
            logger.warning(f"AI extraction failed for URL {url}, using fallback")
            
            # Basic fallback extraction
            title = soup.find("h1")
            title_text = title.get_text(strip=True) if title else ""
            
            return {
                "job_title": title_text[:100] if title_text else "",
                "company_name": "",
                "job_description": text_content[:2000],
                "source_url": url,
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out. Please try again.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Could not access URL (status {e.response.status_code})")
    except Exception as e:
        logger.error(f"Job URL fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch job details. Please paste the description manually.")


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
        try:
            upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
            if upload:
                resume_text = upload.get("text", "")[:4000]
        except Exception as e:
            logger.warning(f"Failed to load resume from DB: {e}")

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
        raise HTTPException(status_code=500, detail="Unable to generate cover letter at the moment. Please try again later.")

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
    
    try:
        await db.cover_letters.insert_one(doc)
    except Exception as e:
        logger.warning(f"Failed to save cover letter to DB: {e}")
    
    doc.pop("_id", None)
    return doc


@router.get("/cover-letter/{letter_id}")
async def get_cover_letter(letter_id: str):
    doc = await db.cover_letters.find_one({"letter_id": letter_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return doc


# Admin endpoints
from helpers import get_current_user

@router.get("/admin/cover-letters")
async def list_all_cover_letters(user: dict = Depends(get_current_user)):
    """List all cover letters for admin"""
    letters = await db.cover_letters.find({}, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
    return letters


@router.delete("/admin/cover-letters/delete-all")
async def delete_all_cover_letters(user: dict = Depends(get_current_user)):
    """Delete ALL cover letters"""
    count = await db.cover_letters.count_documents({})
    await db.cover_letters.delete_many({})
    return {"message": "All cover letters deleted", "deleted_count": count}


@router.delete("/admin/cover-letters/{letter_id}")
async def delete_cover_letter(letter_id: str, user: dict = Depends(get_current_user)):
    """Delete a single cover letter"""
    result = await db.cover_letters.delete_one({"letter_id": letter_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return {"message": "Cover letter deleted"}

