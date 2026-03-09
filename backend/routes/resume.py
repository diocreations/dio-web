"""Resume optimizer routes: upload, analyze, improve, LinkedIn, pricing, download"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request, BackgroundTasks
from database import db, EMERGENT_LLM_KEY, logger
from helpers import get_current_user, get_stripe_api_key
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from datetime import datetime, timezone
import uuid
import json
import re
import os
import asyncio
import fitz
from docx import Document as DocxDocument
from io import BytesIO

router = APIRouter(prefix="/api")


async def is_resume_paid(resume_id: str) -> bool:
    """Check if payment exists for a specific resume OR if pricing is disabled"""
    # First check if pricing is disabled globally
    pricing = await db.resume_pricing.find_one({"pricing_id": "resume_optimizer"}, {"_id": 0})
    if pricing and not pricing.get("pricing_enabled", True):
        return True  # Free access when pricing is disabled
    
    # Otherwise check for payment
    payment = await db.resume_payments.find_one(
        {"resume_id": resume_id, "status": "paid"}, {"_id": 0}
    )
    return payment is not None


def truncate_preview(text: str, max_lines: int = 8) -> str:
    """Return first N lines as a teaser preview"""
    lines = text.split("\n")
    return "\n".join(lines[:max_lines])


async def send_payment_receipt(email: str, amount: float, currency: str, resume_filename: str, session_id: str):
    """Send a payment receipt email via Resend"""
    from email_templates import get_email_wrapper, get_email_header, get_success_badge, get_info_box
    
    resend_key = os.environ.get("RESEND_API_KEY", "")
    sender_email = os.environ.get("SENDER_EMAIL", "Diocreations <noreply@diocreations.eu>")
    if not resend_key or not email:
        logger.info(f"Skipping receipt email: resend_key={'set' if resend_key else 'missing'}, email={email or 'missing'}")
        return
    try:
        import resend
        resend.api_key = resend_key
        date_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
        receipt_id = session_id[-12:].upper() if session_id else "N/A"
        
        header = get_email_header("Payment Receipt", "DioAI Resume & LinkedIn Optimizer")
        success_badge = get_success_badge("Payment Successful")
        info_box = get_info_box([
            "Your improved resume and LinkedIn optimization are now unlocked.",
            "Return to the optimizer to download your professional PDF."
        ])
        
        body_content = f'''
        {header}
        <div style="padding:28px;">
          {success_badge}
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Product</td><td style="padding:10px 0;text-align:right;font-weight:600;border-bottom:1px solid #f3f4f6;">Resume & LinkedIn Optimizer</td></tr>
            <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Resume</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f3f4f6;">{resume_filename or 'Your resume'}</td></tr>
            <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Date</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f3f4f6;">{date_str}</td></tr>
            <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Receipt #</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #f3f4f6;">{receipt_id}</td></tr>
            <tr><td style="padding:14px 0;color:#1a1a2e;font-weight:700;font-size:16px;">Total Paid</td><td style="padding:14px 0;text-align:right;font-weight:700;font-size:18px;color:#7c3aed;">{currency} {amount:.2f}</td></tr>
          </table>
          {info_box}
        </div>
        '''
        
        html = get_email_wrapper(body_content, "Diocreations | www.diocreations.eu | This is an automated receipt")
        
        await asyncio.to_thread(resend.Emails.send, {
            "from": sender_email,
            "to": [email],
            "subject": f"Payment Receipt - DioAI Resume Optimizer ({currency} {amount:.2f})",
            "html": html,
        })
        logger.info(f"Receipt email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send receipt email: {e}")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text[:8000]


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(BytesIO(file_bytes))
    text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    return text[:8000]


async def get_resume_pricing():
    pricing = await db.resume_pricing.find_one({"pricing_id": "resume_optimizer"}, {"_id": 0})
    if not pricing:
        pricing = {
            "pricing_id": "resume_optimizer",
            "product_name": "DioAI Resume & LinkedIn Optimizer",
            "product_description": "AI-powered resume analysis, ATS optimization, and LinkedIn profile enhancement",
            "price": 19.99,
            "currency": "EUR",
            "discount_enabled": False,
            "discount_percent": 0,
            "linkedin_enabled": True,
            "features": ["AI Resume Analysis (Free)", "ATS-Optimized Resume Rewrite", "LinkedIn Profile Optimization", "Download as PDF"],
        }
    return pricing


@router.get("/resume/user-resumes")
async def get_user_resumes(user_id: str = None, user_email: str = None):
    """Get all resumes for a user (by user_id or email)"""
    if not user_id and not user_email:
        return []
    
    query = {}
    if user_id and user_email:
        query = {"$or": [{"user_id": user_id}, {"user_email": user_email}]}
    elif user_id:
        query = {"user_id": user_id}
    else:
        query = {"user_email": user_email}
    
    resumes = await db.resume_uploads.find(query, {"_id": 0, "text": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with analysis and payment status
    for resume in resumes:
        analysis = await db.resume_analyses.find_one({"resume_id": resume["resume_id"]}, {"_id": 0, "overall_score": 1, "ats_score": 1})
        payment = await db.resume_payments.find_one({"resume_id": resume["resume_id"], "status": "paid"}, {"_id": 0})
        improvement = await db.resume_improvements.find_one({"resume_id": resume["resume_id"]}, {"_id": 0, "improved_text": 1})
        
        resume["has_analysis"] = analysis is not None
        resume["overall_score"] = analysis.get("overall_score") if analysis else None
        resume["ats_score"] = analysis.get("ats_score") if analysis else None
        resume["is_paid"] = payment is not None
        resume["has_improvement"] = improvement is not None
    
    return resumes


@router.get("/resume/{resume_id}/full")
async def get_resume_full(resume_id: str):
    """Get full resume data including text, analysis, and improvements"""
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not upload:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    analysis = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    improvement = await db.resume_improvements.find_one({"resume_id": resume_id}, {"_id": 0})
    payment = await db.resume_payments.find_one({"resume_id": resume_id, "status": "paid"}, {"_id": 0})
    linkedin = await db.resume_improvements.find_one({"resume_id": resume_id, "linkedin_optimization": {"$exists": True}}, {"_id": 0, "linkedin_optimization": 1})
    
    return {
        "resume_id": resume_id,
        "filename": upload.get("filename"),
        "text": upload.get("text"),
        "created_at": upload.get("created_at"),
        "analysis": analysis,
        "improvement": improvement,
        "is_paid": payment is not None,
        "linkedin_optimization": linkedin.get("linkedin_optimization") if linkedin else None
    }


@router.get("/resume/pricing")
async def get_pricing_public():
    pricing = await get_resume_pricing()
    logger.info(f"Pricing from DB: {pricing}")
    price = pricing["price"]
    if pricing.get("discount_enabled") and pricing.get("discount_percent", 0) > 0:
        price = round(price * (1 - pricing["discount_percent"] / 100), 2)
    pricing_enabled = pricing.get("pricing_enabled", True)
    logger.info(f"pricing_enabled value: {pricing_enabled}")
    return {
        "product_name": pricing.get("product_name", "DioAI Resume & LinkedIn Optimizer"),
        "product_description": pricing.get("product_description", ""),
        "price": price,
        "original_price": pricing["price"] if pricing.get("discount_enabled") else None,
        "currency": pricing.get("currency", "EUR"),
        "discount_percent": pricing.get("discount_percent", 0) if pricing.get("discount_enabled") else 0,
        "linkedin_enabled": pricing.get("linkedin_enabled", True),
        "features": pricing.get("features", []),
        "pricing_enabled": pricing_enabled,
    }


@router.get("/admin/resume/pricing")
async def get_pricing_admin(user: dict = Depends(get_current_user)):
    return await get_resume_pricing()


@router.put("/admin/resume/pricing")
async def update_pricing_admin(update: dict, user: dict = Depends(get_current_user)):
    update["pricing_id"] = "resume_optimizer"
    update.pop("_id", None)
    await db.resume_pricing.update_one({"pricing_id": "resume_optimizer"}, {"$set": update}, upsert=True)
    return await db.resume_pricing.find_one({"pricing_id": "resume_optimizer"}, {"_id": 0})


@router.get("/admin/resume/analytics")
async def get_resume_analytics(user: dict = Depends(get_current_user)):
    total_analyses = await db.resume_analyses.count_documents({})
    total_paid = await db.resume_payments.count_documents({"status": "paid"})
    revenue_cursor = db.resume_payments.find({"status": "paid"}, {"amount": 1, "_id": 0})
    revenue = sum([doc.get("amount", 0) async for doc in revenue_cursor])
    recent = await db.resume_analyses.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return {
        "total_analyses": total_analyses,
        "total_paid_users": total_paid,
        "total_revenue": round(revenue, 2),
        "recent_analyses": recent,
    }


@router.get("/admin/resume/list")
async def list_all_resumes(user: dict = Depends(get_current_user)):
    """List all uploaded resumes for admin management"""
    resumes = await db.resume_uploads.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    # Add analysis and payment info
    for resume in resumes:
        analysis = await db.resume_analyses.find_one({"resume_id": resume["resume_id"]}, {"_id": 0, "overall_score": 1})
        payment = await db.resume_payments.find_one({"resume_id": resume["resume_id"], "status": "paid"}, {"_id": 0, "amount": 1})
        resume["overall_score"] = analysis.get("overall_score") if analysis else None
        resume["is_paid"] = payment is not None
        resume["amount_paid"] = payment.get("amount") if payment else 0
        resume["has_file"] = bool(resume.get("file_content") or resume.get("filename"))
    return resumes


@router.delete("/admin/resume/delete-all")
async def delete_all_resumes(user: dict = Depends(get_current_user)):
    """Delete ALL resumes and associated data - USE WITH CAUTION"""
    # Count before deletion
    count = await db.resume_uploads.count_documents({})
    
    # Delete from all resume-related collections
    await db.resume_uploads.delete_many({})
    await db.resume_analyses.delete_many({})
    await db.resume_improvements.delete_many({})
    await db.user_resume_data.delete_many({})
    # Note: Don't delete payments for audit trail
    
    return {"message": "All resumes deleted", "deleted_count": count}


@router.delete("/admin/resume/{resume_id}")
async def delete_resume(resume_id: str, user: dict = Depends(get_current_user)):
    """Delete a resume and all associated data"""
    # Delete from all resume-related collections
    await db.resume_uploads.delete_one({"resume_id": resume_id})
    await db.resume_analyses.delete_one({"resume_id": resume_id})
    await db.resume_improvements.delete_one({"resume_id": resume_id})
    await db.user_resume_data.delete_many({"resume_id": resume_id})
    # Note: Don't delete payments for audit trail
    return {"message": "Resume and associated data deleted"}


@router.get("/admin/resume/paid-users")
async def get_paid_users(user: dict = Depends(get_current_user)):
    """Get list of all users who have paid for Resume AI"""
    payments = await db.resume_payments.find(
        {"status": "paid"}, 
        {"_id": 0}
    ).sort("paid_at", -1).to_list(500)
    
    # Enrich with resume and user info
    result = []
    for payment in payments:
        resume_id = payment.get("resume_id")
        upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0, "filename": 1, "user_email": 1})
        analysis = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0, "overall_score": 1})
        
        result.append({
            "resume_id": resume_id,
            "email": payment.get("email") or (upload.get("user_email") if upload else None),
            "filename": upload.get("filename") if upload else "Unknown",
            "amount": payment.get("amount"),
            "currency": payment.get("currency", "EUR"),
            "paid_at": payment.get("paid_at"),
            "overall_score": analysis.get("overall_score") if analysis else None,
            "session_id": payment.get("session_id"),
        })
    
    return result


@router.post("/admin/resume/grant-access")
async def grant_resume_access(data: dict, user: dict = Depends(get_current_user)):
    """Manually grant paid access to a resume"""
    resume_id = data.get("resume_id")
    email = data.get("email", "")
    
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")
    
    # Check if resume exists
    resume = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Check if already paid
    existing = await db.resume_payments.find_one({"resume_id": resume_id, "status": "paid"})
    if existing:
        raise HTTPException(status_code=400, detail="This resume already has paid access")
    
    # Create manual payment record
    payment_doc = {
        "session_id": f"manual_{uuid.uuid4().hex[:12]}",
        "resume_id": resume_id,
        "amount": 0,
        "currency": "EUR",
        "email": email or resume.get("user_email", ""),
        "status": "paid",
        "paid_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "granted_by": user.get("email", "admin"),
        "is_manual_grant": True,
    }
    await db.resume_payments.insert_one(payment_doc)
    
    return {"message": "Access granted successfully", "resume_id": resume_id}


@router.delete("/admin/resume/revoke-access/{resume_id}")
async def revoke_resume_access(resume_id: str, user: dict = Depends(get_current_user)):
    """Revoke paid access from a resume"""
    # Delete the payment record (or mark as revoked)
    result = await db.resume_payments.delete_one({"resume_id": resume_id, "status": "paid"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No paid access found for this resume")
    
    return {"message": "Access revoked", "resume_id": resume_id}


@router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = None, user_email: str = None):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = file.filename.lower().split(".")[-1]
    if ext not in ("pdf", "docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    try:
        text = extract_text_from_pdf(contents) if ext == "pdf" else extract_text_from_docx(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not extract text: {str(e)}")
    if len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough text from file")
    
    # Generate content hash for deduplication
    import hashlib
    content_hash = hashlib.md5(text.encode()).hexdigest()
    
    # Check if this exact resume (by content) already exists for this user
    if user_id or user_email:
        query_conditions = []
        if user_id:
            query_conditions.append({"user_id": user_id})
        if user_email:
            query_conditions.append({"user_email": user_email})
        
        existing_resume = await db.resume_uploads.find_one({
            "$or": query_conditions,
            "content_hash": content_hash
        }, {"_id": 0})
        
        if existing_resume:
            # Check if this existing resume is paid
            payment = await db.resume_payments.find_one({
                "resume_id": existing_resume["resume_id"],
                "status": "paid"
            })
            
            return {
                "resume_id": existing_resume["resume_id"],
                "text_preview": existing_resume["text"][:500],
                "word_count": len(existing_resume["text"].split()),
                "is_existing": True,
                "is_paid": payment is not None,
                "message": "Found your existing resume - continuing where you left off"
            }
    
    # This is a NEW resume - create new entry
    resume_id = f"resume_{uuid.uuid4().hex[:12]}"
    resume_doc = {
        "resume_id": resume_id,
        "filename": file.filename,
        "text": text,
        "content_hash": content_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Associate with user if provided
    if user_id:
        resume_doc["user_id"] = user_id
    if user_email:
        resume_doc["user_email"] = user_email
    
    await db.resume_uploads.insert_one(resume_doc)
    
    # For new resumes, payment is NOT carried over - user must pay again
    return {
        "resume_id": resume_id, 
        "text_preview": text[:500], 
        "word_count": len(text.split()), 
        "is_existing": False,
        "is_paid": False,
        "is_new_resume": True,
        "message": "New resume uploaded - analysis is free, payment required for full optimization"
    }


@router.post("/resume/analyze")
async def analyze_resume(data: dict):
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id required")
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not upload:
        raise HTTPException(status_code=404, detail="Resume not found")
    existing = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    if existing:
        return existing
    text = upload["text"][:6000]
    prompt = f"""Analyze this resume and return ONLY valid JSON (no markdown, no code blocks):
{{"overall_score": <0-100>, "ats_score": <0-100>, "strengths": ["s1","s2","s3"], "weaknesses": ["w1","w2","w3"], "missing_keywords": ["k1","k2","k3"], "formatting_issues": ["i1","i2"], "suggestions": ["s1","s2","s3","s4"]}}
Be concise. Max 3-4 items per array.
RESUME TEXT:
{text}"""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"resume_analysis_{resume_id}", system_message="You are a professional resume analyst. Return ONLY valid JSON.").with_model("gemini", "gemini-2.0-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
        analysis = json.loads(cleaned)
    except Exception as e:
        logger.error(f"Resume analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")
    analysis["resume_id"] = resume_id
    analysis["filename"] = upload["filename"]
    analysis["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.resume_analyses.insert_one({**analysis})
    analysis.pop("_id", None)
    return analysis


@router.post("/resume/improve")
async def improve_resume(data: dict):
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id required")
    template_id = data.get("template_id")
    force_regenerate = data.get("force_regenerate", False)
    paid = await is_resume_paid(resume_id)

    if not force_regenerate:
        existing = await db.resume_improvements.find_one({"resume_id": resume_id, "fix_type": {"$ne": "quick_fix"}}, {"_id": 0})
        if existing:
            if paid:
                return existing
            return {
                "resume_id": resume_id,
                "improved_text": truncate_preview(existing.get("improved_text", "")),
                "is_preview": True,
                "template_id": existing.get("template_id"),
            }

    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not upload:
        raise HTTPException(status_code=404, detail="Resume not found")
    text = upload["text"][:6000]
    template_instruction = ""
    if template_id:
        tpl = await db.resume_templates.find_one({"template_id": template_id}, {"_id": 0})
        if tpl:
            tpl_prompt = tpl.get("prompt_instruction", "")
            template_instruction = f"\n\nTEMPLATE STYLE: {tpl_prompt}" if tpl_prompt else f"\n\nTEMPLATE STYLE: {tpl.get('name', '')} — {tpl.get('description', '')}."
    prompt = f"""You are a professional resume writer. Rewrite this resume to be polished, ATS-optimized, and ready to submit.
RULES:
- Use PLAIN TEXT only. Do NOT use markdown symbols (no #, ##, **, *, ```, or any markup).
- Use ALL CAPS for section headings (e.g. PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS).
- Separate sections with a blank line.
- For the header: Name on first line, contact info on next line.
- For each job: Company name, title, and dates on one line. Bullet points with "- " prefix.
- Quantify achievements with specific numbers wherever possible.
- Use strong action verbs.
- Keep it concise: maximum 2 pages worth of content.
{template_instruction}

ORIGINAL RESUME:
{text}

Rewrite the entire resume now in clean, professional plain text format:"""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"resume_improve_{resume_id}_{template_id or 'default'}", system_message="You are an expert resume writer. Produce clean, ATS-friendly plain text resumes. Never use markdown formatting.").with_model("gemini", "gemini-2.0-flash")
        improved_text = await chat.send_message(UserMessage(text=prompt))
        improved_text = improved_text.replace("```", "").replace("##", "").replace("**", "").strip()
    except Exception as e:
        logger.error(f"Resume improvement failed: {e}")
        raise HTTPException(status_code=500, detail="Improvement failed. Please try again.")
    result = {"resume_id": resume_id, "improved_text": improved_text, "template_id": template_id, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.resume_improvements.update_one({"resume_id": resume_id, "fix_type": {"$ne": "quick_fix"}}, {"$set": result}, upsert=True)
    result.pop("_id", None)

    if paid:
        return result
    return {
        "resume_id": resume_id,
        "improved_text": truncate_preview(improved_text),
        "is_preview": True,
        "template_id": template_id,
    }


@router.post("/resume/quick-fix")
async def quick_fix_resume(data: dict):
    """Apply AI-suggested fixes to the original resume while preserving its structure"""
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id required")

    paid = await is_resume_paid(resume_id)

    # Check for cached result first
    existing = await db.resume_improvements.find_one(
        {"resume_id": resume_id, "fix_type": "quick_fix"}, {"_id": 0}
    )
    if existing:
        if paid:
            return existing
        return {
            "resume_id": resume_id,
            "fixed_text": truncate_preview(existing.get("fixed_text", "")),
            "is_preview": True,
            "fix_type": "quick_fix",
        }

    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not upload:
        raise HTTPException(status_code=404, detail="Resume not found")
    analysis = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    text = upload["text"][:6000]

    weaknesses = ""
    suggestions = ""
    keywords = ""
    if analysis:
        weaknesses = "\n".join(f"- {w}" for w in analysis.get("weaknesses", []))
        suggestions = "\n".join(f"- {s}" for s in analysis.get("suggestions", []))
        keywords = ", ".join(analysis.get("missing_keywords", []))

    prompt = f"""You are a professional resume editor. Fix and improve this resume while PRESERVING ITS ORIGINAL STRUCTURE AND LAYOUT.

CRITICAL RULES:
- Keep the SAME sections, SAME order, SAME overall layout as the original.
- Do NOT reorganize or restructure the resume.
- Fix grammar, spelling, and awkward phrasing.
- Replace weak action verbs with strong ones (Led, Architected, Implemented, Optimized, etc.).
- Add specific numbers and metrics where possible (e.g., "managed team" -> "managed team of 8").
- Naturally incorporate these missing ATS keywords where relevant: {keywords}
- Fix these identified weaknesses:
{weaknesses}
- Apply these suggestions:
{suggestions}
- Use PLAIN TEXT only. No markdown (no #, **, ```).
- Use ALL CAPS for section headings.
- Use "- " prefix for bullet points.
- Keep the name on the first line, contact info on the second line.

ORIGINAL RESUME:
{text}

Output the FIXED resume now (same structure, improved content):"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"resume_quickfix_{resume_id}",
            system_message="You are a precise resume editor. Fix content while preserving the original structure. Never use markdown.",
        ).with_model("gemini", "gemini-2.0-flash")
        fixed_text = await chat.send_message(UserMessage(text=prompt))
        fixed_text = fixed_text.replace("```", "").replace("##", "").replace("**", "").strip()
    except Exception as e:
        logger.error(f"Quick fix failed: {e}")
        raise HTTPException(status_code=500, detail="Quick fix failed. Please try again.")
    result = {
        "resume_id": resume_id,
        "fixed_text": fixed_text,
        "fix_type": "quick_fix",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.resume_improvements.update_one(
        {"resume_id": resume_id, "fix_type": "quick_fix"},
        {"$set": result},
        upsert=True,
    )

    if paid:
        return result
    return {
        "resume_id": resume_id,
        "fixed_text": truncate_preview(fixed_text),
        "is_preview": True,
        "fix_type": "quick_fix",
    }


@router.get("/resume/get-text/{resume_id}")
async def get_resume_text(resume_id: str):
    """Get the raw text of an uploaded resume for copying"""
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    if not upload:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"text": upload.get("text", ""), "filename": upload.get("filename", "")}


@router.post("/resume/checkout")
async def create_resume_checkout(data: dict, request: Request):
    resume_id = data.get("resume_id")
    customer_email = data.get("email", "")
    origin_url = data.get("origin_url", "")
    referral_code = data.get("referral_code", "")
    pricing = await get_resume_pricing()
    price = pricing["price"]
    if pricing.get("discount_enabled") and pricing.get("discount_percent", 0) > 0:
        price = round(price * (1 - pricing["discount_percent"] / 100), 2)
    # Apply referral discount
    applied_referral = None
    if referral_code:
        ref = await db.referral_codes.find_one({"code": referral_code.upper()}, {"_id": 0})
        ref_config = await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})
        if ref and ref_config and ref_config.get("enabled", True):
            if ref.get("email") != customer_email:
                discount_pct = ref_config.get("discount_percent", 20)
                price = round(price * (1 - discount_pct / 100), 2)
                applied_referral = {"code": referral_code.upper(), "discount_percent": discount_pct}
    currency = pricing.get("currency", "EUR").lower()
    success_url = f"{origin_url}/resume-optimizer?session_id={{CHECKOUT_SESSION_ID}}&resume_id={resume_id}"
    cancel_url = f"{origin_url}/resume-optimizer?resume_id={resume_id}"
    host_url = str(request.base_url)
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=price, currency=currency, success_url=success_url, cancel_url=cancel_url,
        metadata={"product_type": "resume_optimizer", "resume_id": resume_id, "customer_email": customer_email, "referral_code": referral_code},
    ))
    payment_doc = {
        "session_id": session.session_id, "resume_id": resume_id,
        "amount": price, "currency": currency.upper(), "email": customer_email,
        "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if applied_referral:
        payment_doc["referral"] = applied_referral
    await db.resume_payments.insert_one(payment_doc)
    return {"checkout_url": session.url, "session_id": session.session_id, "final_price": price}


@router.get("/resume/payment-status/{resume_id}")
async def check_resume_payment(resume_id: str):
    payment = await db.resume_payments.find_one({"resume_id": resume_id, "status": "paid"}, {"_id": 0})
    return {"paid": payment is not None}


@router.post("/resume/verify-payment")
async def verify_resume_payment(data: dict, background_tasks: BackgroundTasks):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        if status.payment_status == "paid":
            await db.resume_payments.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
            )
            # Send receipt email in background
            payment = await db.resume_payments.find_one({"session_id": session_id}, {"_id": 0})
            if payment:
                email = payment.get("email", "")
                amount = payment.get("amount", 0)
                currency = payment.get("currency", "EUR")
                resume_id = payment.get("resume_id", "")
                filename = ""
                if resume_id:
                    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
                    if upload:
                        filename = upload.get("filename", "")
                background_tasks.add_task(send_payment_receipt, email, amount, currency, filename, session_id)
                # Record referral use if applicable
                ref_data = payment.get("referral")
                if ref_data and ref_data.get("code"):
                    ref_config = await db.referral_config.find_one({"config_id": "referral"}, {"_id": 0})
                    referrer_reward = (ref_config or {}).get("referrer_reward_percent", 10)
                    original_price = amount / (1 - ref_data["discount_percent"] / 100)
                    await db.referral_uses.insert_one({
                        "use_id": f"ref_use_{uuid.uuid4().hex[:12]}",
                        "code": ref_data["code"],
                        "buyer_email": email,
                        "resume_id": resume_id,
                        "original_amount": round(original_price, 2),
                        "discounted_amount": amount,
                        "discount_percent": ref_data["discount_percent"],
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })
                    await db.referral_codes.update_one(
                        {"code": ref_data["code"]},
                        {"$inc": {"use_count": 1, "earnings": round(original_price * referrer_reward / 100, 2)}},
                    )
            return {"paid": True}
    except Exception as e:
        logger.error(f"Payment verify error: {e}")
    return {"paid": False}


@router.post("/resume/download-access")
async def check_download_access(data: dict):
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id required")
    payment = await db.resume_payments.find_one({"resume_id": resume_id, "status": "paid"}, {"_id": 0})
    return {"has_access": payment is not None}


@router.post("/resume/linkedin")
async def optimize_linkedin(data: dict):
    resume_id = data.get("resume_id")
    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id required")

    paid = await is_resume_paid(resume_id)

    # Check for cached result first
    existing = await db.linkedin_optimizations.find_one({"resume_id": resume_id}, {"_id": 0})
    if existing:
        if paid:
            existing["is_preview"] = False
            return existing
        return {
            "resume_id": resume_id,
            "headlines": existing.get("headlines", [])[:1],
            "about": (existing.get("about", "").split(". ")[0] + ".") if existing.get("about") else "",
            "keywords": existing.get("keywords", [])[:2],
            "experience_bullets": [],
            "post_ideas": [],
            "is_preview": True,
        }

    headline = data.get("headline", "")
    about = data.get("about", "")
    experience = data.get("experience", "")
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0})
    resume_context = upload["text"][:3000] if upload else ""
    prompt = f"""Based on this person's resume and LinkedIn info, generate LinkedIn optimizations. Return ONLY valid JSON:
{{"headlines": ["h1","h2","h3"], "about": "optimized about (2-3 paragraphs)", "experience_bullets": ["b1","b2","b3","b4"], "keywords": ["k1","k2","k3","k4","k5"], "post_ideas": ["p1","p2","p3"]}}
RESUME CONTEXT: {resume_context[:2000]}
CURRENT HEADLINE: {headline[:200]}
CURRENT ABOUT: {about[:1000]}
CURRENT EXPERIENCE: {experience[:1000]}"""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"linkedin_{resume_id}", system_message="You are a LinkedIn optimization expert. Return ONLY valid JSON.").with_model("gemini", "gemini-2.0-flash")
        response = await chat.send_message(UserMessage(text=prompt))
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
        result = json.loads(cleaned)
    except Exception as e:
        logger.error(f"LinkedIn optimization failed: {e}")
        raise HTTPException(status_code=500, detail="Optimization failed. Please try again.")

    # Store full result in DB
    result["resume_id"] = resume_id
    result["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.linkedin_optimizations.update_one(
        {"resume_id": resume_id}, {"$set": result}, upsert=True
    )
    result.pop("_id", None)

    if paid:
        result["is_preview"] = False
        return result
    return {
        "resume_id": resume_id,
        "headlines": result.get("headlines", [])[:1],
        "about": (result.get("about", "").split(". ")[0] + ".") if result.get("about") else "",
        "keywords": result.get("keywords", [])[:2],
        "experience_bullets": [],
        "post_ideas": [],
        "is_preview": True,
    }


@router.get("/resume/share/{resume_id}")
async def get_shared_resume(resume_id: str):
    """Public endpoint to view shared resume analysis (for viral sharing)"""
    analysis = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Resume analysis not found")
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0, "filename": 1})
    # Return analysis data for sharing (but not the improved text)
    return {
        "resume_id": resume_id,
        "filename": upload.get("filename", "Resume") if upload else "Resume",
        "overall_score": analysis.get("overall_score", 0),
        "ats_score": analysis.get("ats_score", 0),
        "strengths": analysis.get("strengths", []),
        "weaknesses": analysis.get("weaknesses", []),
        "missing_keywords": analysis.get("missing_keywords", []),
        "suggestions": analysis.get("suggestions", []),
        "created_at": analysis.get("created_at", ""),
    }


@router.post("/resume/linkedin-scrape")
async def scrape_linkedin_profile(data: dict):
    import httpx
    url = data.get("url", "").strip()
    if not url or "linkedin.com" not in url:
        raise HTTPException(status_code=400, detail="Valid LinkedIn URL required")
    if not url.startswith("http"):
        url = "https://" + url
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            html = resp.text
        og_title = ""
        og_desc = ""
        m = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\']', html)
        if m:
            og_title = m.group(1)
        m = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\']', html)
        if m:
            og_desc = m.group(1)
        if not og_title:
            m = re.search(r'<title>([^<]*)</title>', html)
            if m:
                og_title = m.group(1)
        headline = ""
        name = ""
        if " - " in og_title:
            parts = og_title.split(" - ", 1)
            name = parts[0].strip()
            headline = parts[1].replace(" | LinkedIn", "").strip()
        elif og_title:
            name = og_title.replace(" | LinkedIn", "").strip()
        return {
            "success": True, "name": name, "headline": headline,
            "about": og_desc.strip() if og_desc else "", "experience": "",
            "note": "Extracted from public profile. Paste additional details for better results." if headline else "Could not extract full profile. Please paste your LinkedIn info manually.",
        }
    except Exception as e:
        logger.warning(f"LinkedIn scrape failed: {e}")
        return {"success": False, "name": "", "headline": "", "about": "", "experience": "", "note": "Could not access LinkedIn profile. Please paste your details manually."}



@router.get("/resume/og/{resume_id}")
async def get_resume_og_meta(resume_id: str):
    """Return Open Graph meta data for shared resume links"""
    analysis = await db.resume_analyses.find_one({"resume_id": resume_id}, {"_id": 0})
    upload = await db.resume_uploads.find_one({"resume_id": resume_id}, {"_id": 0, "filename": 1})
    
    if not analysis:
        return {
            "title": "DioAI Resume Optimizer",
            "description": "Get your resume professionally analyzed and optimized with AI",
            "score": 0,
        }
    
    overall_score = analysis.get("overall_score", 0)
    ats_score = analysis.get("ats_score", 0)
    filename = upload.get("filename", "Resume") if upload else "Resume"
    
    # Create engaging title and description based on score
    if overall_score >= 80:
        title = f"🌟 Resume Score: {overall_score}/100 - Excellent!"
        desc = f"Check out this impressive resume with an ATS score of {ats_score}/100. Get your own free resume analysis at DioAI!"
    elif overall_score >= 60:
        title = f"📈 Resume Score: {overall_score}/100 - Good Progress!"
        desc = f"This resume scored {ats_score}/100 on ATS compatibility. Want to see how your resume compares? Try DioAI free!"
    else:
        title = f"📊 Resume Score: {overall_score}/100"
        desc = "See this resume's detailed AI analysis. Get your own free resume score and improvement tips at DioAI!"
    
    return {
        "title": title,
        "description": desc,
        "score": overall_score,
        "ats_score": ats_score,
        "filename": filename,
        "image": "https://www.diocreations.eu/og-resume.jpg",
    }
