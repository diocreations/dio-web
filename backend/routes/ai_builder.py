"""AI Website Builder API - Single AI call for instant website generation"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from database import db, logger
from datetime import datetime, timezone
import json
import os
import uuid
import base64
import io
import zipfile
import re

router = APIRouter(prefix="/api/ai-builder", tags=["ai-builder"])


class WebsiteGenerationRequest(BaseModel):
    business_name: str
    business_type: str
    description: str
    location: Optional[str] = ""
    customer_email: EmailStr


class WebsiteGenerationResponse(BaseModel):
    website_id: str
    content: dict
    images: dict
    generated_at: str


class HostingRequest(BaseModel):
    website_id: str
    hosting_type: str  # "waas", "ewaas", "download"
    domain: Optional[str] = None


class DomainSubmitRequest(BaseModel):
    website_id: str
    domain: str


class ThemeUpdateRequest(BaseModel):
    theme: str


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


@router.get("/settings")
async def get_builder_settings():
    """Get AI builder settings (public)"""
    settings = await db.ai_builder_settings.find_one({"settings_id": "ai_builder"}, {"_id": 0})
    if not settings:
        settings = {
            "settings_id": "ai_builder",
            "domain_registration_url": "https://www.diocreations.in/products/domain-registration",
            "waas_price": 29.99,
            "waas_stripe_link": "",
            "ewaas_price": 49.99,
            "ewaas_stripe_link": "",
            "download_price": 19.99,
            "download_stripe_link": "",
            "dns_server_ip": "",
            "whatsapp_number": "",
            "support_email": "support@diocreations.eu"
        }
    return settings


@router.post("/generate", response_model=WebsiteGenerationResponse)
async def generate_website(request: WebsiteGenerationRequest):
    """Generate a complete website with ONE AI call + image generation"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Register/update user as Diocreations platform user
        existing_user = await db.public_users.find_one({"email": request.customer_email})
        if not existing_user:
            await db.public_users.insert_one({
                "email": request.customer_email,
                "source": "ai_builder",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "websites_generated": 1
            })
        else:
            await db.public_users.update_one(
                {"email": request.customer_email},
                {"$inc": {"websites_generated": 1}, "$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
            )
        
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
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            content = json.loads(clean_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            content = generate_fallback_content(request)
        
        # Generate images using Gemini Nano Banana
        images = {}
        try:
            images = await generate_website_images(api_key, request.business_name, request.business_type, request.description)
        except Exception as img_error:
            logger.error(f"Image generation failed: {img_error}")
            images = {"hero": None, "service_icons": []}
        
        # Generate website ID
        website_id = f"site_{uuid.uuid4().hex[:12]}"
        generated_at = datetime.now(timezone.utc).isoformat()
        
        # Randomly assign a template theme for visual uniqueness
        import random
        template_themes = ["modern", "corporate", "startup", "minimal"]
        assigned_theme = random.choice(template_themes)
        
        # Template-specific color schemes (applied to brand)
        theme_colors = {
            "modern": "#7c3aed",
            "corporate": "#1e40af", 
            "startup": "#059669",
            "minimal": "#18181b"
        }
        
        # Update brand color based on assigned theme
        if "brand" in content:
            content["brand"]["primary_color"] = theme_colors.get(assigned_theme, "#7c3aed")
        
        # Cache the generated website
        website_doc = {
            "website_id": website_id,
            "customer_email": request.customer_email,
            "business_name": request.business_name,
            "business_type": request.business_type,
            "description": request.description,
            "location": request.location,
            "content": content,
            "images": images,
            "theme": assigned_theme,  # Randomly assigned for uniqueness
            "hosting_status": "preview",  # preview, pending_domain, pending_payment, deployed, downloaded
            "hosting_type": None,  # waas, ewaas, download
            "domain": None,
            "payment_status": None,
            "generated_at": generated_at,
            "updated_at": generated_at
        }
        await db.ai_websites.insert_one(website_doc)
        
        return WebsiteGenerationResponse(
            website_id=website_id,
            content=content,
            images=images,
            generated_at=generated_at
        )
        
    except Exception as e:
        logger.error(f"Website generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


async def generate_website_images(api_key: str, business_name: str, business_type: str, description: str) -> dict:
    """Generate hero image and service icons using Gemini Nano Banana - ONE AI call"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    images = {"hero": None, "service_icons": []}
    
    try:
        # Generate hero image
        chat = LlmChat(
            api_key=api_key,
            session_id=f"img-hero-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at generating professional business website images."
        ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        hero_prompt = f"""Create a professional, modern hero banner image for a {business_type} business called "{business_name}". 
The image should be:
- Wide landscape format suitable for a website hero section
- Professional and clean design
- Relevant to: {description}
- No text in the image
- Modern, high-quality aesthetic"""

        msg = UserMessage(text=hero_prompt)
        text, hero_images = await chat.send_message_multimodal_response(msg)
        
        if hero_images and len(hero_images) > 0:
            images["hero"] = hero_images[0]["data"]  # Base64 encoded
            logger.info(f"Hero image generated: {images['hero'][:30]}...")
        
        # Generate service icons (3 icons in one call for efficiency)
        icon_chat = LlmChat(
            api_key=api_key,
            session_id=f"img-icons-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at generating professional business icons."
        ).with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        icon_prompt = f"""Create a set of 3 professional, minimal service icons for a {business_type} business.
Each icon should be:
- Simple, flat design style
- Single color (purple/violet theme)
- Suitable for a website services section
- No text, pure icon/symbol
- Modern and professional"""

        icon_msg = UserMessage(text=icon_prompt)
        text, icon_images = await icon_chat.send_message_multimodal_response(icon_msg)
        
        if icon_images:
            images["service_icons"] = [img["data"] for img in icon_images[:4]]
            logger.info(f"Generated {len(images['service_icons'])} service icons")
            
    except Exception as e:
        logger.error(f"Image generation error: {e}")
    
    return images


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


@router.post("/website/{website_id}/submit-domain")
async def submit_domain(website_id: str, request: DomainSubmitRequest):
    """Submit purchased domain for hosting"""
    # Validate domain format
    domain_pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
    if not re.match(domain_pattern, request.domain):
        raise HTTPException(status_code=400, detail="Invalid domain format")
    
    result = await db.ai_websites.update_one(
        {"website_id": website_id},
        {"$set": {
            "domain": request.domain,
            "hosting_status": "pending_payment",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"success": True, "domain": request.domain}


@router.post("/website/{website_id}/select-hosting")
async def select_hosting(website_id: str, request: HostingRequest):
    """Select hosting plan"""
    valid_types = ["waas", "ewaas", "download"]
    if request.hosting_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid hosting type. Choose from: {valid_types}")
    
    update_data = {
        "hosting_type": request.hosting_type,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if request.hosting_type == "download":
        update_data["hosting_status"] = "pending_download_payment"
    else:
        update_data["hosting_status"] = "pending_payment"
    
    result = await db.ai_websites.update_one(
        {"website_id": website_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"success": True, "hosting_type": request.hosting_type}


@router.post("/website/{website_id}/confirm-payment")
async def confirm_payment(website_id: str):
    """Confirm payment (called after Stripe redirect)"""
    website = await db.ai_websites.find_one({"website_id": website_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    new_status = "deployed" if website.get("hosting_type") != "download" else "download_ready"
    
    await db.ai_websites.update_one(
        {"website_id": website_id},
        {"$set": {
            "payment_status": "paid",
            "hosting_status": new_status,
            "payment_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"success": True, "status": new_status}


@router.get("/website/{website_id}/download")
async def download_website_zip(website_id: str):
    """Download website as ZIP file (cPanel compatible)"""
    website = await db.ai_websites.find_one({"website_id": website_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # Check if download is allowed
    if website.get("hosting_type") == "download" and website.get("hosting_status") != "download_ready":
        raise HTTPException(status_code=403, detail="Payment required before download")
    
    content = website.get("content", {})
    theme = website.get("theme", "modern")
    images = website.get("images", {})
    brand = content.get("brand", {"name": website.get("business_name", "Website")})
    
    # Generate multi-page static HTML files
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Generate each page
        pages = generate_static_pages(content, brand, theme, images)
        for filename, html_content in pages.items():
            zf.writestr(filename, html_content)
        
        # Add CSS file
        css_content = generate_css(theme)
        zf.writestr("assets/css/style.css", css_content)
        
        # Add JS file
        js_content = generate_js()
        zf.writestr("assets/js/main.js", js_content)
        
        # Add images if available
        if images.get("hero"):
            try:
                hero_bytes = base64.b64decode(images["hero"])
                zf.writestr("assets/images/hero.png", hero_bytes)
            except Exception:
                pass
        
        for i, icon in enumerate(images.get("service_icons", [])):
            try:
                icon_bytes = base64.b64decode(icon)
                zf.writestr(f"assets/images/icon_{i+1}.png", icon_bytes)
            except Exception:
                pass
        
        # Add README
        readme = generate_readme(brand.get("name", "Website"))
        zf.writestr("README.md", readme)
    
    zip_buffer.seek(0)
    filename = f"{brand.get('name', 'website').lower().replace(' ', '-')}-website.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_static_pages(content: dict, brand: dict, theme: str, images: dict) -> dict:
    """Generate static HTML pages for cPanel hosting"""
    theme_colors = {
        "modern": {"primary": "#7c3aed", "secondary": "#a855f7"},
        "corporate": {"primary": "#1e40af", "secondary": "#3b82f6"},
        "startup": {"primary": "#059669", "secondary": "#10b981"},
        "minimal": {"primary": "#18181b", "secondary": "#3f3f46"}
    }
    _ = theme_colors.get(theme, theme_colors["modern"])  # Colors available for future use
    
    # Common header
    header = f'''<header class="site-header">
    <div class="container">
      <a href="index.html" class="logo">{brand.get("name", "Business")}</a>
      <nav class="main-nav">
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="services.html">Services</a>
        <a href="blog.html">Blog</a>
        <a href="contact.html">Contact</a>
      </nav>
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
    </div>
  </header>'''
    
    # Branding badge with animated butterfly
    branding_badge = '''<div class="diocreations-badge">
    <a href="https://diocreations.eu" target="_blank" rel="noopener">
      <svg class="butterfly-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <style>.st0{fill:#4D629A}.st1{fill:#2F4977}.st2{fill:#00A096}.st3{fill:#08877A}.st4{fill:#89BF4A}.st5{fill:#8F5398}.st6{fill:#75387F}.st7{fill:#E16136}.st8{fill:#C34727}.st9{fill:#F3BE33}</style>
        <g class="right-wing"><path class="st0" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/><path class="st1" d="M10.06,10.03c0,0,1.91,2.77,6.57,3.13c-0.25-0.33-0.52-0.63-0.83-0.9L10.06,10.03z"/><path class="st2" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/><path class="st3" d="M10.06,10.03c0,0,3.63,0.39,7.07-2.39c0,0-0.34-0.13-1.51-0.09L10.06,10.03z"/><path class="st4" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/></g>
        <g class="left-wing"><path class="st5" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/><path class="st6" d="M9.94,9.98c0,0-1.91,2.77-6.57,3.13c0.25-0.33,0.52-0.63,0.83-0.9L9.94,9.98z"/><path class="st7" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/><path class="st8" d="M9.94,9.98c0,0-3.63,0.39-7.07-2.39c0,0,0.34-0.13,1.51-0.09L9.94,9.98z"/><path class="st9" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/></g>
      </svg>
      <span>Built with Diocreations AI</span>
    </a>
  </div>'''
    
    # Common footer
    footer = f'''<footer class="site-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">{brand.get("name", "Business")}</div>
        <div class="footer-links">
          <a href="index.html">Home</a>
          <a href="about.html">About</a>
          <a href="services.html">Services</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer-social">
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="LinkedIn">LI</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{content.get("footer", {}).get("copyright", f"© 2025 {brand.get('name')}. All rights reserved.")}</p>
        {branding_badge}
      </div>
    </div>
  </footer>'''
    
    # HTML template wrapper
    def wrap_page(title: str, body_content: str, page_class: str = "") -> str:
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - {brand.get("name", "Website")}</title>
  <meta name="description" content="{content.get("homepage", {}).get("subheadline", "")}">
  <link rel="stylesheet" href="assets/css/style.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="{page_class}">
  {header}
  <main>
    {body_content}
  </main>
  {footer}
  <script src="assets/js/main.js"></script>
</body>
</html>'''
    
    homepage = content.get("homepage", {})
    about = content.get("about", {})
    services = content.get("services", {})
    blog = content.get("blog", {})
    contact = content.get("contact", {})
    
    pages = {}
    
    # Index/Home page
    hero_bg = 'assets/images/hero.png' if images.get("hero") else ''
    hero_style = f'style="background-image: url(\'{hero_bg}\');"' if hero_bg else ''
    
    features_html = ""
    for i, f in enumerate(homepage.get("features", [])):
        icon_src = f"assets/images/icon_{i+1}.png" if i < len(images.get("service_icons", [])) else ""
        icon_html = f'<img src="{icon_src}" alt="{f.get("title")}" class="feature-icon">' if icon_src else '<div class="feature-icon-placeholder">★</div>'
        features_html += f'''<div class="feature-card">
          {icon_html}
          <h3>{f.get("title", "")}</h3>
          <p>{f.get("description", "")}</p>
        </div>'''
    
    index_body = f'''<section class="hero" {hero_style}>
      <div class="hero-content">
        <h1>{homepage.get("headline", "Welcome")}</h1>
        <p>{homepage.get("subheadline", "")}</p>
        <a href="contact.html" class="btn btn-primary">{homepage.get("cta_text", "Get Started")}</a>
      </div>
    </section>
    <section class="features">
      <div class="container">
        <h2>Why Choose Us</h2>
        <div class="features-grid">{features_html}</div>
      </div>
    </section>'''
    pages["index.html"] = wrap_page("Home", index_body, "page-home")
    
    # About page
    values_html = "".join([f'<span class="value-tag">{v}</span>' for v in about.get("values", [])])
    about_body = f'''<section class="page-hero">
      <div class="container">
        <h1>{about.get("headline", "About Us")}</h1>
      </div>
    </section>
    <section class="about-content">
      <div class="container">
        <div class="about-text">{about.get("content", "").replace(chr(10), "<br>")}</div>
        <div class="about-mission">
          <h3>Our Mission</h3>
          <p>{about.get("mission", "")}</p>
        </div>
        <div class="about-values">
          <h3>Our Values</h3>
          <div class="values-list">{values_html}</div>
        </div>
      </div>
    </section>'''
    pages["about.html"] = wrap_page("About", about_body, "page-about")
    
    # Services page
    services_html = ""
    for s in services.get("services", []):
        services_html += f'''<div class="service-card">
          <h3>{s.get("title", "")}</h3>
          <p>{s.get("description", "")}</p>
          <span class="service-price">{s.get("price", "")}</span>
        </div>'''
    services_body = f'''<section class="page-hero">
      <div class="container">
        <h1>{services.get("headline", "Our Services")}</h1>
        <p>{services.get("description", "")}</p>
      </div>
    </section>
    <section class="services-list">
      <div class="container">
        <div class="services-grid">{services_html}</div>
      </div>
    </section>'''
    pages["services.html"] = wrap_page("Services", services_body, "page-services")
    
    # Blog page
    articles_html = ""
    for a in blog.get("articles", []):
        articles_html += f'''<article class="blog-card">
          <h3>{a.get("title", "")}</h3>
          <p>{a.get("summary", "")}</p>
          <span class="blog-date">{a.get("date", "")}</span>
        </article>'''
    blog_body = f'''<section class="page-hero">
      <div class="container">
        <h1>{blog.get("headline", "Blog")}</h1>
      </div>
    </section>
    <section class="blog-list">
      <div class="container">
        <div class="blog-grid">{articles_html}</div>
      </div>
    </section>'''
    pages["blog.html"] = wrap_page("Blog", blog_body, "page-blog")
    
    # Contact page
    contact_body = f'''<section class="page-hero">
      <div class="container">
        <h1>{contact.get("headline", "Contact Us")}</h1>
        <p>{contact.get("description", "")}</p>
      </div>
    </section>
    <section class="contact-content">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h3>Get in Touch</h3>
            <p><strong>Email:</strong> {contact.get("email", "")}</p>
            <p><strong>Phone:</strong> {contact.get("phone", "")}</p>
            <p><strong>Address:</strong> {contact.get("address", "")}</p>
            <p><strong>Hours:</strong> {contact.get("hours", "")}</p>
          </div>
          <form class="contact-form" onsubmit="handleContactForm(event)">
            <input type="text" name="name" placeholder="Your Name" required>
            <input type="email" name="email" placeholder="Your Email" required>
            <textarea name="message" placeholder="Your Message" rows="5" required></textarea>
            <button type="submit" class="btn btn-primary">Send Message</button>
          </form>
        </div>
      </div>
    </section>'''
    pages["contact.html"] = wrap_page("Contact", contact_body, "page-contact")
    
    return pages


def generate_css(theme: str) -> str:
    """Generate CSS stylesheet"""
    theme_colors = {
        "modern": {"primary": "#7c3aed", "secondary": "#a855f7", "gradient": "linear-gradient(135deg, #7c3aed, #a855f7)"},
        "corporate": {"primary": "#1e40af", "secondary": "#3b82f6", "gradient": "linear-gradient(135deg, #1e40af, #3b82f6)"},
        "startup": {"primary": "#059669", "secondary": "#10b981", "gradient": "linear-gradient(135deg, #059669, #10b981)"},
        "minimal": {"primary": "#18181b", "secondary": "#3f3f46", "gradient": "linear-gradient(135deg, #18181b, #3f3f46)"}
    }
    colors = theme_colors.get(theme, theme_colors["modern"])
    
    return f'''/* Generated by Diocreations AI Website Builder */
:root {{
  --primary: {colors["primary"]};
  --secondary: {colors["secondary"]};
  --gradient: {colors["gradient"]};
}}

* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }}
.container {{ max-width: 1200px; margin: 0 auto; padding: 0 24px; }}

/* Header */
.site-header {{ background: var(--gradient); color: white; position: sticky; top: 0; z-index: 100; }}
.site-header .container {{ display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; }}
.logo {{ font-weight: 700; font-size: 1.25rem; color: white; text-decoration: none; }}
.main-nav {{ display: flex; gap: 24px; }}
.main-nav a {{ color: white; text-decoration: none; font-weight: 500; opacity: 0.9; transition: opacity 0.2s; }}
.main-nav a:hover {{ opacity: 1; }}
.mobile-menu-btn {{ display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }}

/* Hero */
.hero {{ background: var(--gradient); color: white; padding: 80px 24px; text-align: center; background-size: cover; background-position: center; position: relative; }}
.hero::before {{ content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.3); }}
.hero-content {{ position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }}
.hero h1 {{ font-size: 3rem; font-weight: 700; margin-bottom: 16px; }}
.hero p {{ font-size: 1.25rem; opacity: 0.9; margin-bottom: 32px; }}

/* Page Hero */
.page-hero {{ background: var(--gradient); color: white; padding: 60px 24px; text-align: center; }}
.page-hero h1 {{ font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }}
.page-hero p {{ font-size: 1.1rem; opacity: 0.9; }}

/* Buttons */
.btn {{ display: inline-block; padding: 12px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; transition: all 0.2s; border: none; cursor: pointer; }}
.btn-primary {{ background: white; color: var(--primary); }}
.btn-primary:hover {{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }}

/* Features */
.features {{ padding: 80px 24px; }}
.features h2 {{ text-align: center; font-size: 2rem; margin-bottom: 48px; }}
.features-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }}
.feature-card {{ text-align: center; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; transition: all 0.2s; }}
.feature-card:hover {{ box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-4px); }}
.feature-icon {{ width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 12px; object-fit: cover; }}
.feature-icon-placeholder {{ width: 64px; height: 64px; margin: 0 auto 16px; background: var(--gradient); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }}
.feature-card h3 {{ font-size: 1.25rem; margin-bottom: 8px; }}
.feature-card p {{ color: #64748b; }}

/* About */
.about-content {{ padding: 80px 24px; }}
.about-text {{ font-size: 1.1rem; line-height: 1.8; margin-bottom: 48px; }}
.about-mission, .about-values {{ background: #f8fafc; padding: 32px; border-radius: 12px; margin-bottom: 24px; }}
.about-mission h3, .about-values h3 {{ margin-bottom: 12px; }}
.values-list {{ display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }}
.value-tag {{ background: var(--gradient); color: white; padding: 8px 20px; border-radius: 50px; font-size: 0.9rem; }}

/* Services */
.services-list {{ padding: 80px 24px; }}
.services-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }}
.service-card {{ padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s; }}
.service-card:hover {{ box-shadow: 0 8px 24px rgba(0,0,0,0.1); }}
.service-card h3 {{ font-size: 1.25rem; margin-bottom: 12px; }}
.service-card p {{ color: #64748b; margin-bottom: 16px; }}
.service-price {{ color: var(--primary); font-weight: 600; }}

/* Blog */
.blog-list {{ padding: 80px 24px; }}
.blog-grid {{ display: grid; gap: 24px; }}
.blog-card {{ padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.2s; cursor: pointer; }}
.blog-card:hover {{ box-shadow: 0 8px 24px rgba(0,0,0,0.1); }}
.blog-card h3 {{ font-size: 1.25rem; margin-bottom: 12px; }}
.blog-card p {{ color: #64748b; margin-bottom: 12px; }}
.blog-date {{ color: #94a3b8; font-size: 0.875rem; }}

/* Contact */
.contact-content {{ padding: 80px 24px; }}
.contact-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }}
.contact-info h3 {{ margin-bottom: 24px; }}
.contact-info p {{ margin-bottom: 12px; }}
.contact-form {{ display: flex; flex-direction: column; gap: 16px; }}
.contact-form input, .contact-form textarea {{ padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 1rem; }}
.contact-form input:focus, .contact-form textarea:focus {{ outline: none; border-color: var(--primary); }}

/* Footer */
.site-footer {{ background: #0f172a; color: white; padding: 48px 24px 24px; }}
.footer-content {{ display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; margin-bottom: 32px; }}
.footer-brand {{ font-weight: 700; font-size: 1.25rem; }}
.footer-links {{ display: flex; gap: 24px; }}
.footer-links a {{ color: #94a3b8; text-decoration: none; transition: color 0.2s; }}
.footer-links a:hover {{ color: white; }}
.footer-social {{ display: flex; gap: 16px; }}
.footer-social a {{ color: #94a3b8; text-decoration: none; }}
.footer-bottom {{ border-top: 1px solid #1e293b; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }}
.footer-bottom p {{ color: #94a3b8; font-size: 0.875rem; }}

/* Diocreations Badge */
.diocreations-badge {{ display: flex; align-items: center; }}
.diocreations-badge a {{ display: flex; align-items: center; gap: 8px; color: #94a3b8; text-decoration: none; font-size: 0.8rem; transition: color 0.2s; }}
.diocreations-badge a:hover {{ color: white; }}
.butterfly-icon {{ width: 24px; height: 24px; animation: float 3s ease-in-out infinite; }}
.butterfly-icon .left-wing {{ animation: flap-left 0.4s ease-in-out infinite alternate; transform-origin: 10px 10px; }}
.butterfly-icon .right-wing {{ animation: flap-right 0.4s ease-in-out infinite alternate; transform-origin: 10px 10px; }}
@keyframes float {{ 0%, 100% {{ transform: translateY(0); }} 50% {{ transform: translateY(-3px); }} }}
@keyframes flap-left {{ from {{ transform: rotate(0deg); }} to {{ transform: rotate(-20deg); }} }}
@keyframes flap-right {{ from {{ transform: rotate(0deg); }} to {{ transform: rotate(20deg); }} }}

/* Mobile */
@media (max-width: 768px) {{
  .main-nav {{ display: none; }}
  .mobile-menu-btn {{ display: block; }}
  .hero h1 {{ font-size: 2rem; }}
  .contact-grid {{ grid-template-columns: 1fr; }}
  .footer-content {{ flex-direction: column; text-align: center; }}
}}
'''


def generate_js() -> str:
    """Generate JavaScript file"""
    return '''// Generated by Diocreations AI Website Builder
function toggleMobileMenu() {
  const nav = document.querySelector('.main-nav');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
}

function handleContactForm(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  alert('Thank you for your message! We will get back to you soon.');
  form.reset();
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
'''


def generate_readme(business_name: str) -> str:
    """Generate README file with deployment instructions"""
    return f'''# {business_name} Website

This website was generated by **Diocreations AI Website Builder**.

## 📁 Folder Structure

```
/index.html       - Homepage
/about.html       - About page
/services.html    - Services page
/blog.html        - Blog page
/contact.html     - Contact page
/assets/
  /css/style.css  - Stylesheet
  /js/main.js     - JavaScript
  /images/        - Website images
```

## 🚀 Deployment Instructions

### Option 1: cPanel Hosting

1. Log in to your cPanel account
2. Open **File Manager**
3. Navigate to `public_html` folder
4. Upload all files from this ZIP
5. Your website will be live at your domain!

### Option 2: Other Hosting (Netlify, Vercel, etc.)

1. Extract the ZIP contents
2. Upload the folder to your hosting provider
3. Point your domain to the hosting

## 🔧 Customization

### Editing Content
- Open any `.html` file in a text editor
- Find and replace text content as needed
- Save the file

### Changing Colors
- Open `assets/css/style.css`
- Modify the `:root` variables at the top:
  - `--primary`: Main brand color
  - `--secondary`: Secondary brand color

### Adding Images
- Add images to `assets/images/`
- Reference them in HTML: `<img src="assets/images/your-image.jpg">`

## 🌐 Connecting Your Domain

1. In your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS settings
3. Add an A record:
   - Type: A
   - Host: @
   - Points to: [Your hosting IP address]
4. Wait 24-48 hours for DNS propagation

## 📞 Need Help?

- Visit: https://diocreations.eu
- Email: support@diocreations.eu

---
Built with ❤️ by Diocreations AI
'''


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/websites")
async def get_all_websites(skip: int = 0, limit: int = 50):
    """Get all generated websites for admin"""
    websites = await db.ai_websites.find(
        {},
        {"_id": 0, "content": 0, "images": 0}  # Exclude large fields
    ).sort("generated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.ai_websites.count_documents({})
    return {"websites": websites, "total": total}


@router.get("/admin/website/{website_id}")
async def get_admin_website(website_id: str):
    """Get full website details for admin"""
    website = await db.ai_websites.find_one({"website_id": website_id}, {"_id": 0})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    return website


@router.delete("/admin/website/{website_id}")
async def delete_website(website_id: str):
    """Delete a website"""
    result = await db.ai_websites.delete_one({"website_id": website_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Website not found")
    return {"success": True}


@router.get("/admin/settings")
async def get_admin_settings():
    """Get AI builder admin settings"""
    settings = await db.ai_builder_settings.find_one({"settings_id": "ai_builder"}, {"_id": 0})
    if not settings:
        settings = {
            "settings_id": "ai_builder",
            "domain_registration_url": "https://www.diocreations.in/products/domain-registration",
            "waas_price": 29.99,
            "waas_stripe_link": "",
            "ewaas_price": 49.99,
            "ewaas_stripe_link": "",
            "download_price": 19.99,
            "download_stripe_link": "",
            "dns_server_ip": "",
            "whatsapp_number": "",
            "support_email": "support@diocreations.eu"
        }
        await db.ai_builder_settings.insert_one(settings)
    return settings


class AdminSettingsUpdate(BaseModel):
    domain_registration_url: Optional[str] = None
    waas_price: Optional[float] = None
    waas_stripe_link: Optional[str] = None
    ewaas_price: Optional[float] = None
    ewaas_stripe_link: Optional[str] = None
    download_price: Optional[float] = None
    download_stripe_link: Optional[str] = None
    dns_server_ip: Optional[str] = None
    whatsapp_number: Optional[str] = None
    support_email: Optional[str] = None


@router.put("/admin/settings")
async def update_admin_settings(settings: AdminSettingsUpdate):
    """Update AI builder admin settings"""
    update_data = {k: v for k, v in settings.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.ai_builder_settings.update_one(
        {"settings_id": "ai_builder"},
        {"$set": update_data},
        upsert=True
    )
    return {"success": True}


@router.get("/admin/stats")
async def get_admin_stats():
    """Get AI builder statistics"""
    total_websites = await db.ai_websites.count_documents({})
    preview_count = await db.ai_websites.count_documents({"hosting_status": "preview"})
    deployed_count = await db.ai_websites.count_documents({"hosting_status": "deployed"})
    downloaded_count = await db.ai_websites.count_documents({"hosting_status": "download_ready"})
    pending_payment = await db.ai_websites.count_documents({"hosting_status": {"$in": ["pending_payment", "pending_download_payment"]}})
    
    return {
        "total_websites": total_websites,
        "preview": preview_count,
        "deployed": deployed_count,
        "downloaded": downloaded_count,
        "pending_payment": pending_payment
    }
