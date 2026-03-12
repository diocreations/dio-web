"""AI Website Builder API - Single AI call for instant website generation"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db, logger
from datetime import datetime, timezone
import json
import os
import uuid

router = APIRouter(prefix="/api/ai-builder", tags=["ai-builder"])


class WebsiteGenerationRequest(BaseModel):
    business_name: str
    business_type: str
    description: str
    location: Optional[str] = ""


class WebsiteGenerationResponse(BaseModel):
    website_id: str
    content: dict
    generated_at: str


# Business type options
BUSINESS_TYPES = [
    "Restaurant & Food",
    "Professional Services",
    "Retail & E-commerce",
    "Healthcare & Wellness",
    "Real Estate",
    "Technology & IT",
    "Creative & Design",
    "Education & Training",
    "Construction & Home Services",
    "Beauty & Personal Care",
    "Fitness & Sports",
    "Legal Services",
    "Financial Services",
    "Travel & Tourism",
    "Other"
]


@router.get("/business-types")
async def get_business_types():
    """Get available business types for dropdown"""
    return BUSINESS_TYPES


@router.post("/generate", response_model=WebsiteGenerationResponse)
async def generate_website(request: WebsiteGenerationRequest):
    """Generate a complete website with ONE AI call"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Create the prompt for website generation
        prompt = f"""Generate a complete small business website content structure.

Business Name: {request.business_name}
Business Type: {request.business_type}
Description: {request.description}
Location: {request.location or "Not specified"}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):

{{
  "brand": {{
    "name": "{request.business_name}",
    "tagline": "A short catchy tagline",
    "primary_color": "#7c3aed"
  }},
  "homepage": {{
    "headline": "Main attention-grabbing headline",
    "subheadline": "Supporting text that explains the value proposition",
    "cta_text": "Call to action button text",
    "features": [
      {{"title": "Feature 1", "description": "Description of feature 1", "icon": "star"}},
      {{"title": "Feature 2", "description": "Description of feature 2", "icon": "shield"}},
      {{"title": "Feature 3", "description": "Description of feature 3", "icon": "zap"}}
    ],
    "services_preview": [
      {{"title": "Service 1", "description": "Brief description"}},
      {{"title": "Service 2", "description": "Brief description"}},
      {{"title": "Service 3", "description": "Brief description"}}
    ]
  }},
  "about": {{
    "title": "About Us",
    "headline": "About page headline",
    "content": "2-3 paragraphs about the business, its mission, values, and story.",
    "mission": "Company mission statement",
    "values": ["Value 1", "Value 2", "Value 3"]
  }},
  "services": {{
    "title": "Our Services",
    "headline": "Services page headline",
    "description": "Introduction to services",
    "services": [
      {{"title": "Service 1", "description": "Detailed description of service 1", "price": "From $XX"}},
      {{"title": "Service 2", "description": "Detailed description of service 2", "price": "From $XX"}},
      {{"title": "Service 3", "description": "Detailed description of service 3", "price": "From $XX"}},
      {{"title": "Service 4", "description": "Detailed description of service 4", "price": "From $XX"}}
    ]
  }},
  "contact": {{
    "title": "Contact Us",
    "headline": "Get in Touch",
    "description": "Invitation to contact the business",
    "email": "contact@example.com",
    "phone": "(XXX) XXX-XXXX",
    "address": "{request.location or 'Business Address'}",
    "hours": "Mon-Fri: 9AM-5PM"
  }},
  "blog": {{
    "title": "Blog",
    "headline": "Latest News & Insights",
    "articles": [
      {{"title": "Article 1 Title", "summary": "Brief summary of the article", "date": "2025-01-15"}},
      {{"title": "Article 2 Title", "summary": "Brief summary of the article", "date": "2025-01-10"}},
      {{"title": "Article 3 Title", "summary": "Brief summary of the article", "date": "2025-01-05"}}
    ]
  }},
  "footer": {{
    "copyright": "© 2025 {request.business_name}. All rights reserved.",
    "social_links": ["facebook", "instagram", "linkedin"]
  }}
}}

Make the content professional, engaging, and specific to a {request.business_type} business. Use realistic placeholder information."""
        
        # Initialize chat with Gemini Flash for speed
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai-builder-{uuid.uuid4().hex[:8]}",
            system_message="You are a professional website content generator. You generate complete, professional website content in JSON format. Always return valid JSON only, no markdown formatting."
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Send message and get response
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        try:
            # Clean the response - remove any markdown formatting
            clean_response = response.strip()
            if clean_response.startswith("```"):
                # Remove markdown code blocks
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            content = json.loads(clean_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            logger.error(f"Response was: {response[:500]}")
            # Return a fallback structure
            content = generate_fallback_content(request)
        
        # Generate website ID
        website_id = f"site_{uuid.uuid4().hex[:12]}"
        generated_at = datetime.now(timezone.utc).isoformat()
        
        # Cache the generated website
        website_doc = {
            "website_id": website_id,
            "business_name": request.business_name,
            "business_type": request.business_type,
            "description": request.description,
            "location": request.location,
            "content": content,
            "theme": "modern",
            "generated_at": generated_at,
            "updated_at": generated_at
        }
        await db.ai_websites.insert_one(website_doc)
        
        return WebsiteGenerationResponse(
            website_id=website_id,
            content=content,
            generated_at=generated_at
        )
        
    except Exception as e:
        logger.error(f"Website generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


def generate_fallback_content(request: WebsiteGenerationRequest) -> dict:
    """Generate fallback content if AI fails"""
    return {
        "brand": {
            "name": request.business_name,
            "tagline": f"Your Trusted {request.business_type} Partner",
            "primary_color": "#7c3aed"
        },
        "homepage": {
            "headline": f"Welcome to {request.business_name}",
            "subheadline": request.description or f"Professional {request.business_type} services you can trust",
            "cta_text": "Get Started",
            "features": [
                {"title": "Quality Service", "description": "We deliver excellence in everything we do", "icon": "star"},
                {"title": "Expert Team", "description": "Our professionals are here to help", "icon": "users"},
                {"title": "Fast Results", "description": "Quick turnaround without compromising quality", "icon": "zap"}
            ],
            "services_preview": [
                {"title": "Core Services", "description": "Our main offerings"},
                {"title": "Consultation", "description": "Expert advice and guidance"},
                {"title": "Support", "description": "Ongoing assistance"}
            ]
        },
        "about": {
            "title": "About Us",
            "headline": f"About {request.business_name}",
            "content": f"{request.business_name} is a leading {request.business_type} business dedicated to providing exceptional service. {request.description}",
            "mission": "To deliver outstanding value to every customer",
            "values": ["Integrity", "Excellence", "Innovation"]
        },
        "services": {
            "title": "Our Services",
            "headline": "What We Offer",
            "description": "Comprehensive solutions tailored to your needs",
            "services": [
                {"title": "Service 1", "description": "Professional service offering", "price": "Contact us"},
                {"title": "Service 2", "description": "Expert solutions", "price": "Contact us"},
                {"title": "Service 3", "description": "Quality deliverables", "price": "Contact us"}
            ]
        },
        "contact": {
            "title": "Contact Us",
            "headline": "Get in Touch",
            "description": "We'd love to hear from you",
            "email": "contact@example.com",
            "phone": "(555) 123-4567",
            "address": request.location or "Contact us for location",
            "hours": "Mon-Fri: 9AM-5PM"
        },
        "blog": {
            "title": "Blog",
            "headline": "Latest News",
            "articles": [
                {"title": "Welcome to Our Blog", "summary": "Stay tuned for updates", "date": "2025-01-15"}
            ]
        },
        "footer": {
            "copyright": f"© 2025 {request.business_name}. All rights reserved.",
            "social_links": ["facebook", "instagram", "linkedin"]
        }
    }


@router.get("/website/{website_id}")
async def get_website(website_id: str):
    """Get a cached website by ID"""
    website = await db.ai_websites.find_one({"website_id": website_id}, {"_id": 0})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.put("/website/{website_id}")
async def update_website(website_id: str, content: dict):
    """Update website content (for editing without AI)"""
    result = await db.ai_websites.update_one(
        {"website_id": website_id},
        {"$set": {
            "content": content,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"success": True}


class ThemeUpdateRequest(BaseModel):
    theme: str


@router.put("/website/{website_id}/theme")
async def update_theme(website_id: str, request: ThemeUpdateRequest):
    """Update website theme (no AI call)"""
    valid_themes = ["modern", "corporate", "startup", "minimal"]
    theme = request.theme
    if theme not in valid_themes:
        raise HTTPException(status_code=400, detail=f"Invalid theme. Choose from: {valid_themes}")
    
    result = await db.ai_websites.update_one(
        {"website_id": website_id},
        {"$set": {
            "theme": theme,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"success": True, "theme": theme}
