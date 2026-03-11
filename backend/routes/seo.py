"""SEO management routes: meta tags, keywords, sitemap, robots.txt"""
from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import PlainTextResponse, Response, FileResponse
from database import db, logger
from helpers import get_current_user
from datetime import datetime, timezone
import uuid
import os
import shutil

router = APIRouter(prefix="/api")

# Directory for uploaded OG images
OG_IMAGES_DIR = "/app/frontend/public/og-images"
os.makedirs(OG_IMAGES_DIR, exist_ok=True)


@router.post("/seo/upload-og-image")
async def upload_og_image(file: UploadFile = File(...), page_slug: str = None, user: dict = Depends(get_current_user)):
    """Upload an OG image for social sharing - saves to public folder for production persistence"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPG, PNG, WebP, or GIF.")
    
    public_dir = "/app/frontend/public"
    
    # Determine filename based on page slug
    if page_slug and page_slug != "global":
        # Page-specific OG image: og-{slug}.png
        filename = f"og-{page_slug}.png"
    else:
        # Global/default OG image
        filename = "og-default.png"
    
    filepath = os.path.join(public_dir, filename)
    
    # Read file content
    content = await file.read()
    
    # Save the file
    with open(filepath, "wb") as buffer:
        buffer.write(content)
    
    logger.info(f"OG image uploaded and saved as {filename} ({len(content)} bytes)")
    
    # Return the public URL path
    return {"url": f"/{filename}", "filename": filename, "size": len(content)}


@router.delete("/seo/og-image/{filename}")
async def delete_og_image(filename: str, user: dict = Depends(get_current_user)):
    """Delete an uploaded OG image"""
    filepath = os.path.join(OG_IMAGES_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"message": "Image deleted"}
    raise HTTPException(status_code=404, detail="Image not found")


# ==================== SEO SETTINGS (Admin) ====================

@router.get("/seo/pages")
async def get_seo_pages():
    """Get SEO settings for all pages"""
    pages = await db.seo_pages.find({}, {"_id": 0}).to_list(100)
    return pages


@router.get("/seo/pages/{slug}")
async def get_seo_page(slug: str):
    """Get SEO settings for a specific page"""
    page = await db.seo_pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        return {"slug": slug, "title": "", "description": "", "keywords": [], "og_title": "", "og_description": "", "og_image": "", "canonical_url": "", "noindex": False}
    return page


@router.put("/seo/pages/{slug}")
async def update_seo_page(slug: str, data: dict, user: dict = Depends(get_current_user)):
    """Update SEO settings for a page"""
    data.pop("_id", None)
    data["slug"] = slug
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.seo_pages.update_one({"slug": slug}, {"$set": data}, upsert=True)
    return await db.seo_pages.find_one({"slug": slug}, {"_id": 0})


@router.get("/seo/global")
async def get_global_seo():
    """Get global SEO settings (site-wide defaults, schema, etc.)"""
    seo = await db.seo_global.find_one({"config_id": "global_seo"}, {"_id": 0})
    if not seo:
        default = {
            "config_id": "global_seo",
            "site_title": "DioCreations - Digital Excellence",
            "site_description": "Professional AI-powered resume optimization, LinkedIn profile enhancement, and digital services.",
            "default_keywords": ["resume optimizer", "AI resume", "LinkedIn optimizer", "ATS resume", "career tools"],
            "default_og_image": "",
            "google_verification": "",
            "bing_verification": "",
            "schema_org_type": "Organization",
            "schema_org_name": "DioCreations",
            "schema_org_url": "",
            "schema_org_logo": "",
            "schema_org_description": "",
            "robots_extra": "",
            "custom_head_tags": "",
        }
        await db.seo_global.insert_one(default)
        return {k: v for k, v in default.items() if k != "_id"}
    return seo


@router.put("/seo/global")
async def update_global_seo(data: dict, user: dict = Depends(get_current_user)):
    """Update global SEO settings"""
    data.pop("_id", None)
    data["config_id"] = "global_seo"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.seo_global.update_one({"config_id": "global_seo"}, {"$set": data}, upsert=True)
    
    # Update index.html with the new OG image (for social media crawlers)
    og_image = data.get("default_og_image", "")
    if og_image:
        try:
            index_path = "/app/frontend/public/index.html"
            with open(index_path, "r") as f:
                content = f.read()
            
            import re
            
            # Determine the full URL for the image
            # If it's a relative path like /og-default.png, prepend the domain
            if og_image.startswith("/"):
                full_og_url = f"https://www.diocreations.eu{og_image}"
            else:
                full_og_url = og_image
            
            # Update og:image meta tag
            new_content = re.sub(
                r'<meta property="og:image" content="[^"]*"',
                f'<meta property="og:image" content="{full_og_url}"',
                content
            )
            
            # Also update twitter:image meta tag
            new_content = re.sub(
                r'<meta property="twitter:image" content="[^"]*"',
                f'<meta property="twitter:image" content="{full_og_url}"',
                new_content
            )
            
            with open(index_path, "w") as f:
                f.write(new_content)
            
            logger.info(f"Updated index.html og:image and twitter:image to: {full_og_url}")
        except Exception as e:
            logger.error(f"Failed to update index.html: {e}")
    
    return await db.seo_global.find_one({"config_id": "global_seo"}, {"_id": 0})


# ==================== SITEMAP & ROBOTS ====================

@router.get("/sitemap.xml", response_class=Response)
async def get_sitemap(request: Request):
    """Generate dynamic XML sitemap with all blog posts"""
    # Always use the production domain
    site_url = "https://www.diocreations.eu"
    
    # Static pages
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
        {"loc": "/about", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/services", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/products", "priority": "0.8", "changefreq": "weekly"},
        {"loc": "/portfolio", "priority": "0.7", "changefreq": "weekly"},
        {"loc": "/blog", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/contact", "priority": "0.6", "changefreq": "monthly"},
        {"loc": "/resume-optimizer", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/resume-builder", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/cover-letter", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/resume-builder-info", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/resume-analyzer-info", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/cover-letter-info", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/privacy", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/terms", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/cookies", "priority": "0.3", "changefreq": "yearly"},
    ]

    # Dynamic pages from DB - include ALL blog posts (published or with slug)
    # Query for posts that are either published OR have a slug (fallback)
    blog_posts = await db.blog.find(
        {"$or": [{"is_published": True}, {"slug": {"$exists": True, "$ne": ""}}]},
        {"_id": 0, "slug": 1, "updated_at": 1, "created_at": 1}
    ).to_list(500)
    
    services = await db.services.find({"slug": {"$exists": True, "$ne": ""}}, {"_id": 0, "slug": 1}).to_list(100)
    portfolio = await db.portfolio.find({}, {"_id": 0, "portfolio_id": 1}).to_list(100)

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for p in static_pages:
        xml += f'  <url>\n    <loc>{site_url}{p["loc"]}</loc>\n    <changefreq>{p["changefreq"]}</changefreq>\n    <priority>{p["priority"]}</priority>\n  </url>\n'

    # Add all blog posts with their slugs
    for post in blog_posts:
        slug = post.get("slug", "")
        if slug:  # Only include posts with valid slugs
            lastmod = post.get("updated_at") or post.get("created_at", "")
            lastmod_tag = f'\n    <lastmod>{lastmod}</lastmod>' if lastmod else ''
            xml += f'  <url>\n    <loc>{site_url}/blog/{slug}</loc>{lastmod_tag}\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n'

    for s in services:
        if s.get("slug"):
            xml += f'  <url>\n    <loc>{site_url}/services/{s["slug"]}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n'

    for p in portfolio:
        if p.get("portfolio_id"):
            xml += f'  <url>\n    <loc>{site_url}/portfolio/{p["portfolio_id"]}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n'

    xml += '</urlset>'
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def get_robots():
    """Generate robots.txt"""
    global_seo = await db.seo_global.find_one({"config_id": "global_seo"}, {"_id": 0})
    extra = (global_seo or {}).get("robots_extra", "")
    txt = "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://www.diocreations.eu/api/sitemap.xml\n"
    if extra:
        txt += f"\n{extra}\n"
    return txt
