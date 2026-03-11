"""FAQ management routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import db
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/faq", tags=["faq"])


class FAQItem(BaseModel):
    question: str
    answer: str
    category: str = "general"
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    order: int = 0
    is_active: bool = True


class FAQCategory(BaseModel):
    category_id: str
    name: str
    slug: str
    description: Optional[str] = None
    page_type: str = "both"  # "products", "services", or "both"
    order: int = 0
    is_active: bool = True


# Default FAQ data for DioCreations
DEFAULT_FAQS = [
    # Web Development FAQs
    {
        "faq_id": "faq_web_1",
        "question": "How long does it take to build a custom website?",
        "answer": "Timeline varies based on complexity. A simple business website typically takes 2-4 weeks, while complex web applications may take 6-12 weeks. We'll provide a detailed timeline during our initial consultation.",
        "category": "web-development",
        "link_url": "/services/web-mobile-development",
        "link_text": "View Web Development Services",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_web_2",
        "question": "Do you provide website maintenance and support?",
        "answer": "Yes! We offer ongoing maintenance packages that include security updates, content updates, performance optimization, and 24/7 support. Our team ensures your website stays secure and up-to-date.",
        "category": "web-development",
        "link_url": "/contact",
        "link_text": "Contact Us for Support",
        "order": 2,
        "is_active": True
    },
    {
        "faq_id": "faq_web_3",
        "question": "Can you redesign my existing website?",
        "answer": "Absolutely! We specialize in website redesigns that improve user experience, modernize aesthetics, and optimize performance. We can work with your existing platform or migrate to a better solution.",
        "category": "web-development",
        "order": 3,
        "is_active": True
    },
    # AI Solutions FAQs
    {
        "faq_id": "faq_ai_1",
        "question": "What AI solutions do you offer for businesses?",
        "answer": "We provide custom AI implementations including chatbots, content generation, data analysis, process automation, and private LLMs. Our solutions integrate seamlessly with your existing workflows.",
        "category": "ai-solutions",
        "link_url": "/services/ai-solutions",
        "link_text": "Explore AI Solutions",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_ai_2",
        "question": "How can AI help my business save time and money?",
        "answer": "AI automates repetitive tasks, provides 24/7 customer support via chatbots, generates content at scale, analyzes data for insights, and streamlines workflows. Clients typically see 40-60% time savings on automated tasks.",
        "category": "ai-solutions",
        "order": 2,
        "is_active": True
    },
    # SEO FAQs
    {
        "faq_id": "faq_seo_1",
        "question": "How long does it take to see SEO results?",
        "answer": "SEO is a long-term strategy. Initial improvements can be seen in 3-6 months, with significant results typically appearing after 6-12 months of consistent effort. We provide monthly reports to track progress.",
        "category": "seo",
        "link_url": "/services/seo-services",
        "link_text": "Learn About Our SEO Services",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_seo_2",
        "question": "Do you offer local SEO services?",
        "answer": "Yes! Local SEO is one of our specialties. We optimize Google Business Profile, local citations, location-specific keywords, and reviews to help you dominate local search results.",
        "category": "seo",
        "link_url": "/services/local-seo",
        "link_text": "View Local SEO Services",
        "order": 2,
        "is_active": True
    },
    # Resume Tools FAQs
    {
        "faq_id": "faq_resume_1",
        "question": "How does the AI Resume Analyzer work?",
        "answer": "Our AI analyzes your resume against job descriptions, checking for keyword optimization, ATS compatibility, formatting issues, and content gaps. You receive detailed scores and actionable recommendations to improve your resume.",
        "category": "resume-tools",
        "link_url": "/resume-optimizer",
        "link_text": "Try Resume Analyzer",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_resume_2",
        "question": "What is ATS and why does it matter?",
        "answer": "ATS (Applicant Tracking System) is software that filters resumes before human review. Up to 75% of resumes are rejected by ATS. Our tools ensure your resume passes these systems and reaches recruiters.",
        "category": "resume-tools",
        "order": 2,
        "is_active": True
    },
    {
        "faq_id": "faq_resume_3",
        "question": "Can I create multiple versions of my resume?",
        "answer": "Yes! Our Resume Builder lets you create unlimited resume versions tailored to different job applications. Save templates and quickly customize for each opportunity.",
        "category": "resume-tools",
        "link_url": "/resume-builder",
        "link_text": "Build Your Resume",
        "order": 3,
        "is_active": True
    },
    # Pricing FAQs
    {
        "faq_id": "faq_pricing_1",
        "question": "How much do your services cost?",
        "answer": "Pricing varies based on project scope and requirements. We offer flexible packages for businesses of all sizes. Contact us for a free consultation and custom quote tailored to your needs.",
        "category": "pricing",
        "link_url": "/contact",
        "link_text": "Get a Free Quote",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_pricing_2",
        "question": "Do you offer payment plans?",
        "answer": "Yes! For larger projects, we offer flexible payment plans. Typically, we structure payments as 50% upfront and 50% upon completion, or monthly installments for ongoing services.",
        "category": "pricing",
        "order": 2,
        "is_active": True
    },
    {
        "faq_id": "faq_pricing_3",
        "question": "What's your refund policy?",
        "answer": "We're committed to your satisfaction. If you're not happy with our work, we'll revise it until it meets your expectations. Refunds are available within 14 days of service delivery under our satisfaction guarantee.",
        "category": "pricing",
        "order": 3,
        "is_active": True
    },
    # General FAQs
    {
        "faq_id": "faq_general_1",
        "question": "How do I get started with DIOCREATIONS?",
        "answer": "Simply contact us through our website, email, or schedule a free consultation. We'll discuss your needs, provide recommendations, and create a customized proposal for your project.",
        "category": "general",
        "link_url": "/contact",
        "link_text": "Start Your Project",
        "order": 1,
        "is_active": True
    },
    {
        "faq_id": "faq_general_2",
        "question": "Do you work with clients internationally?",
        "answer": "Yes! We work with clients worldwide. Our team is experienced in remote collaboration, and we use modern communication tools to ensure seamless project management across time zones.",
        "category": "general",
        "order": 2,
        "is_active": True
    },
]

DEFAULT_CATEGORIES = [
    {"category_id": "cat_web", "name": "Web Development", "slug": "web-development", "description": "Questions about website development services", "page_type": "services", "order": 1, "is_active": True},
    {"category_id": "cat_ai", "name": "AI Solutions", "slug": "ai-solutions", "description": "Questions about AI and automation services", "page_type": "services", "order": 2, "is_active": True},
    {"category_id": "cat_seo", "name": "SEO Services", "slug": "seo", "description": "Questions about search engine optimization", "page_type": "services", "order": 3, "is_active": True},
    {"category_id": "cat_resume", "name": "Resume Tools", "slug": "resume-tools", "description": "Questions about resume analyzer, builder, and cover letter tools", "page_type": "products", "order": 4, "is_active": True},
    {"category_id": "cat_pricing", "name": "Pricing & Payments", "slug": "pricing", "description": "Questions about costs, payments, and refunds", "page_type": "both", "order": 5, "is_active": True},
    {"category_id": "cat_general", "name": "General Questions", "slug": "general", "description": "General questions about working with us", "page_type": "both", "order": 6, "is_active": True},
]


@router.get("/public")
async def get_public_faqs(page_type: str = "both"):
    """Get FAQs for public pages (products or services)"""
    # Get active categories for the page type
    category_filter = {"is_active": True}
    if page_type != "both":
        category_filter["$or"] = [{"page_type": page_type}, {"page_type": "both"}]
    
    categories_cursor = db.faq_categories.find(category_filter, {"_id": 0}).sort("order", 1)
    categories = await categories_cursor.to_list(100)
    
    if not categories:
        # Initialize with defaults if empty
        for cat in DEFAULT_CATEGORIES:
            await db.faq_categories.update_one(
                {"category_id": cat["category_id"]},
                {"$set": cat},
                upsert=True
            )
        for faq in DEFAULT_FAQS:
            await db.faqs.update_one(
                {"faq_id": faq["faq_id"]},
                {"$set": faq},
                upsert=True
            )
        categories = [dict(c) for c in DEFAULT_CATEGORIES]
    else:
        categories = [dict(c) for c in categories]
    
    category_slugs = [c["slug"] for c in categories]
    
    # Get FAQs for those categories
    faqs_cursor = db.faqs.find(
        {"category": {"$in": category_slugs}, "is_active": True},
        {"_id": 0}
    ).sort("order", 1)
    faqs = await faqs_cursor.to_list(500)
    
    if not faqs:
        faqs = [dict(f) for f in DEFAULT_FAQS if f["category"] in category_slugs]
    else:
        faqs = [dict(f) for f in faqs]
    
    # Group by category
    result = []
    for cat in categories:
        cat_faqs = [f for f in faqs if f["category"] == cat["slug"]]
        if cat_faqs:
            result.append({
                "category": cat,
                "faqs": cat_faqs
            })
    
    return result


@router.get("/admin/all")
async def get_all_faqs():
    """Get all FAQs for admin"""
    faqs_cursor = db.faqs.find({}, {"_id": 0}).sort("order", 1)
    faqs = await faqs_cursor.to_list(500)
    if not faqs:
        for faq in DEFAULT_FAQS:
            await db.faqs.update_one({"faq_id": faq["faq_id"]}, {"$set": faq}, upsert=True)
        faqs = [dict(f) for f in DEFAULT_FAQS]
    else:
        faqs = [dict(f) for f in faqs]
    return faqs


@router.get("/admin/categories")
async def get_all_categories():
    """Get all FAQ categories for admin"""
    categories_cursor = db.faq_categories.find({}, {"_id": 0}).sort("order", 1)
    categories = await categories_cursor.to_list(100)
    if not categories:
        for cat in DEFAULT_CATEGORIES:
            await db.faq_categories.update_one({"category_id": cat["category_id"]}, {"$set": cat}, upsert=True)
        categories = [dict(c) for c in DEFAULT_CATEGORIES]
    else:
        categories = [dict(c) for c in categories]
    return categories


@router.post("/admin/faq")
async def create_faq(faq: FAQItem):
    """Create a new FAQ"""
    faq_data = faq.dict()
    faq_data["faq_id"] = f"faq_{uuid.uuid4().hex[:8]}"
    faq_data["created_at"] = datetime.utcnow().isoformat()
    faq_data["updated_at"] = datetime.utcnow().isoformat()
    await db.faqs.insert_one(faq_data)
    return {"success": True, "faq_id": faq_data["faq_id"]}


@router.put("/admin/faq/{faq_id}")
async def update_faq(faq_id: str, faq: FAQItem):
    """Update an existing FAQ"""
    faq_data = faq.dict()
    faq_data["updated_at"] = datetime.utcnow().isoformat()
    result = await db.faqs.update_one({"faq_id": faq_id}, {"$set": faq_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True}


@router.delete("/admin/faq/{faq_id}")
async def delete_faq(faq_id: str):
    """Delete an FAQ"""
    result = await db.faqs.delete_one({"faq_id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True}


@router.post("/admin/category")
async def create_category(category: FAQCategory):
    """Create a new FAQ category"""
    cat_data = category.dict()
    cat_data["created_at"] = datetime.utcnow().isoformat()
    await db.faq_categories.insert_one(cat_data)
    return {"success": True, "category_id": cat_data["category_id"]}


@router.put("/admin/category/{category_id}")
async def update_category(category_id: str, category: FAQCategory):
    """Update an FAQ category"""
    cat_data = category.dict()
    cat_data["updated_at"] = datetime.utcnow().isoformat()
    result = await db.faq_categories.update_one({"category_id": category_id}, {"$set": cat_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


@router.delete("/admin/category/{category_id}")
async def delete_category(category_id: str):
    """Delete an FAQ category"""
    result = await db.faq_categories.delete_one({"category_id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


@router.post("/admin/reset-defaults")
async def reset_to_defaults():
    """Reset FAQs to default values"""
    await db.faqs.delete_many({})
    await db.faq_categories.delete_many({})
    await db.faqs.insert_many(DEFAULT_FAQS)
    await db.faq_categories.insert_many(DEFAULT_CATEGORIES)
    return {"success": True, "message": "FAQs reset to defaults"}
