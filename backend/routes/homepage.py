"""Homepage, about page, and SEO routes"""
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from database import db, CURRENCY_RATES, logger
from helpers import get_current_user
from datetime import datetime, timezone
from typing import List

router = APIRouter(prefix="/api")

# Default data
_DEFAULT_HERO = {
    "variant_id": "hero_default",
    "badge_text": "Digital Excellence for Modern Business",
    "title_line1": "Your AI-Powered",
    "title_line2": "Growing Partner",
    "subtitle": "From small business websites to enterprise-grade systems - we build eCommerce, AI-driven, and mobile app solutions that scale your business",
    "primary_cta_text": "Get Started",
    "primary_cta_link": "/contact",
    "secondary_cta_text": "View Services",
    "secondary_cta_link": "/services",
    "hero_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "accent_color": "violet",
    "is_active": True,
    "order": 0,
}

_DEFAULT_COLORS = [
    {"scheme_id": "color_violet", "name": "Violet", "primary": "violet-600", "secondary": "violet-800", "accent": "violet-400", "gradient_from": "violet-900", "gradient_via": "violet-800", "gradient_to": "slate-900", "is_active": True},
    {"scheme_id": "color_blue", "name": "Blue", "primary": "blue-600", "secondary": "blue-800", "accent": "blue-400", "gradient_from": "blue-900", "gradient_via": "blue-800", "gradient_to": "slate-900", "is_active": True},
    {"scheme_id": "color_teal", "name": "Teal", "primary": "teal-600", "secondary": "teal-800", "accent": "teal-400", "gradient_from": "teal-900", "gradient_via": "teal-800", "gradient_to": "slate-900", "is_active": True},
    {"scheme_id": "color_pink", "name": "Pink", "primary": "pink-600", "secondary": "pink-800", "accent": "pink-400", "gradient_from": "pink-900", "gradient_via": "pink-800", "gradient_to": "slate-900", "is_active": True},
    {"scheme_id": "color_orange", "name": "Orange", "primary": "orange-600", "secondary": "orange-800", "accent": "orange-400", "gradient_from": "orange-900", "gradient_via": "orange-800", "gradient_to": "slate-900", "is_active": True},
]

_DEFAULT_SETTINGS = {
    "settings_id": "homepage_settings",
    "enable_hero_rotation": True,
    "hero_rotation_interval": 10,
    "hero_rotation_type": "refresh",
    "enable_color_rotation": True,
    "color_rotation_type": "refresh",
    "show_featured_blog": True,
    "featured_blog_count": 3,
    "show_featured_products": True,
    "featured_products_count": 3,
    "show_services": True,
    "show_products": True,
    "show_portfolio": True,
    "show_testimonials": True,
    "show_cta": True,
    "show_blog": True,
    "section_order": ["services", "products", "blog", "portfolio", "testimonials", "cta"],
    "show_stats": True,
    "stats": [
        {"label": "Projects Completed", "value": "500+"},
        {"label": "Happy Clients", "value": "200+"},
        {"label": "Years Experience", "value": "10+"},
        {"label": "Team Members", "value": "25+"},
    ],
}


@router.get("/homepage/content")
async def get_homepage_content(request: Request):
    try:
        from routes.geo_currency import resolve_visitor_currency
        geo = await resolve_visitor_currency(request)
        visitor_currency = geo["currency"]
        currency_symbol = geo["currency_symbol"]
        currency_rate = geo["currency_rate"]
    except Exception:
        visitor_currency = "EUR"
        currency_symbol = "\u20ac"
        currency_rate = 1.0

    settings = await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})
    if not settings:
        settings = {**_DEFAULT_SETTINGS, "updated_at": datetime.now(timezone.utc).isoformat()}

    hero_variants = await db.hero_variants.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    if not hero_variants:
        hero_variants = [_DEFAULT_HERO]

    color_schemes = await db.color_schemes.find({"is_active": True}, {"_id": 0}).to_list(20)
    if not color_schemes:
        color_schemes = list(_DEFAULT_COLORS)

    featured_blog = []
    if settings.get("show_featured_blog", True):
        count = settings.get("featured_blog_count", 3)
        items = await db.featured_items.find({"item_type": "blog"}, {"_id": 0}).sort("order", 1).to_list(count)
        if items:
            blog_ids = [f["item_id"] for f in items]
            featured_blog = await db.blog.find({"post_id": {"$in": blog_ids}, "is_published": True}, {"_id": 0}).to_list(count)
        else:
            featured_blog = await db.blog.find({"is_published": True}, {"_id": 0}).sort("published_at", -1).to_list(count)

    featured_products = []
    if settings.get("show_featured_products", True):
        count = settings.get("featured_products_count", 3)
        items = await db.featured_items.find({"item_type": "product"}, {"_id": 0}).sort("order", 1).to_list(count)
        if items:
            product_ids = [f["item_id"] for f in items]
            featured_products = await db.products.find({"product_id": {"$in": product_ids}, "is_active": True}, {"_id": 0}).to_list(count)
        else:
            featured_products = await db.products.find({"is_active": True, "is_popular": True}, {"_id": 0}).sort("order", 1).to_list(count)
            if len(featured_products) < count:
                featured_products = await db.products.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(count)

    for product in featured_products:
        if product.get("price"):
            product["display_price"] = round(float(product["price"]) * currency_rate, 2)
            product["display_currency"] = visitor_currency
            product["currency_symbol"] = currency_symbol

    return {
        "settings": settings,
        "hero_variants": hero_variants,
        "color_schemes": color_schemes,
        "featured_blog": featured_blog,
        "featured_products": featured_products,
        "visitor_currency": visitor_currency,
        "currency_symbol": currency_symbol,
        "currency_rate": currency_rate,
    }


@router.get("/homepage/settings")
async def get_homepage_settings(user: dict = Depends(get_current_user)):
    settings = await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})
    if not settings:
        doc = {**_DEFAULT_SETTINGS, "updated_at": datetime.now(timezone.utc).isoformat()}
        await db.homepage_settings.insert_one(doc)
        return doc
    return settings


@router.put("/homepage/settings")
async def update_homepage_settings(update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update["settings_id"] = "homepage_settings"
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.homepage_settings.update_one({"settings_id": "homepage_settings"}, {"$set": update}, upsert=True)
    return await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})


@router.get("/homepage/hero-variants")
async def get_hero_variants(user: dict = Depends(get_current_user)):
    variants = await db.hero_variants.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not variants:
        await db.hero_variants.insert_one({**_DEFAULT_HERO})
        variants = [_DEFAULT_HERO]
    return variants


@router.post("/homepage/hero-variants")
async def create_hero_variant(variant: dict, user: dict = Depends(get_current_user)):
    import uuid as _uuid
    variant.setdefault("variant_id", f"hero_{_uuid.uuid4().hex[:8]}")
    await db.hero_variants.insert_one(variant)
    variant.pop("_id", None)
    return variant


@router.put("/homepage/hero-variants/{variant_id}")
async def update_hero_variant(variant_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("variant_id", None)
    result = await db.hero_variants.update_one({"variant_id": variant_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hero variant not found")
    return await db.hero_variants.find_one({"variant_id": variant_id}, {"_id": 0})


@router.delete("/homepage/hero-variants/{variant_id}")
async def delete_hero_variant(variant_id: str, user: dict = Depends(get_current_user)):
    result = await db.hero_variants.delete_one({"variant_id": variant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hero variant not found")
    return {"message": "Hero variant deleted"}


@router.get("/homepage/color-schemes")
async def get_color_schemes(user: dict = Depends(get_current_user)):
    schemes = await db.color_schemes.find({}, {"_id": 0}).to_list(50)
    if not schemes:
        for s in _DEFAULT_COLORS:
            await db.color_schemes.insert_one({**s})
        schemes = list(_DEFAULT_COLORS)
    return schemes


@router.put("/homepage/color-schemes/{scheme_id}")
async def update_color_scheme(scheme_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("scheme_id", None)
    result = await db.color_schemes.update_one({"scheme_id": scheme_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Color scheme not found")
    return await db.color_schemes.find_one({"scheme_id": scheme_id}, {"_id": 0})


@router.get("/homepage/featured-items")
async def get_featured_items(user: dict = Depends(get_current_user)):
    return await db.featured_items.find({}, {"_id": 0}).sort("order", 1).to_list(100)


@router.put("/homepage/featured-items")
async def update_featured_items(items: List[dict], user: dict = Depends(get_current_user)):
    await db.featured_items.delete_many({})
    for i, item in enumerate(items):
        item["order"] = i
        await db.featured_items.insert_one(item)
    return {"message": "Featured items updated"}


# ==================== ABOUT PAGE ====================

_DEFAULT_ABOUT = {
    "content_id": "about_page",
    "hero_badge": "About Us",
    "hero_title_line1": "Building Digital",
    "hero_title_line2": "Excellence Since 2015",
    "hero_description": "DioCreations is a full-service digital agency specializing in web development, SEO, and AI-powered solutions.",
    "hero_cta_text": "Work With Us",
    "hero_cta_link": "/contact",
    "hero_image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    "show_stats": True,
    "stats": [{"value": "10+", "label": "Years Experience"}, {"value": "500+", "label": "Projects Completed"}, {"value": "50+", "label": "Team Members"}, {"value": "20+", "label": "Countries Served"}],
    "show_values": True,
    "values_badge": "Our Values",
    "values_title": "What Drives Us",
    "values_subtitle": "Our core values shape everything we do",
    "values": [
        {"icon": "Target", "title": "Client-Focused", "description": "Your success is our priority."},
        {"icon": "Lightbulb", "title": "Innovation First", "description": "We stay ahead of technology trends."},
        {"icon": "Award", "title": "Excellence", "description": "Quality is non-negotiable."},
        {"icon": "Users", "title": "Collaboration", "description": "Transparent communication and partnership."},
    ],
    "show_timeline": True,
    "timeline_badge": "Our Journey",
    "timeline_title": "Milestones Along the Way",
    "milestones": [
        {"year": "2015", "title": "Founded", "description": "Started with a vision"},
        {"year": "2017", "title": "100+ Projects", "description": "Reached 100 successful deliveries"},
        {"year": "2019", "title": "Global Expansion", "description": "Extended to 20+ countries"},
        {"year": "2021", "title": "AI Integration", "description": "Launched AI-powered services"},
        {"year": "2023", "title": "500+ Projects", "description": "500+ successful transformations"},
        {"year": "2025", "title": "Industry Leader", "description": "Recognized leader"},
    ],
    "show_why_us": True,
    "why_us_badge": "Why Choose Us",
    "why_us_title": "We're Your Partners in Digital Growth",
    "why_us_description": "Years of experience delivering real results.",
    "why_us_image": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
    "why_us_points": ["Custom solutions", "Dedicated project managers", "Transparent pricing", "24/7 support", "Proven track record", "Latest technologies"],
    "show_cta": True,
    "cta_title": "Ready to Start Your Project?",
    "cta_subtitle": "Let's discuss your digital goals",
    "cta_button_text": "Get in Touch",
    "cta_button_link": "/contact",
    "meta_title": "About Us | DIOCREATIONS",
    "meta_description": "Learn about DIOCREATIONS - Your AI-Powered Growing Partner.",
}


@router.get("/about/content")
async def get_about_content():
    content = await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})
    if not content:
        return {**_DEFAULT_ABOUT, "updated_at": datetime.now(timezone.utc).isoformat()}
    return content


@router.get("/about/settings")
async def get_about_settings(user: dict = Depends(get_current_user)):
    content = await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})
    if not content:
        doc = {**_DEFAULT_ABOUT, "updated_at": datetime.now(timezone.utc).isoformat()}
        await db.about_page.insert_one(doc)
        return doc
    return content


@router.put("/about/settings")
async def update_about_settings(update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update["content_id"] = "about_page"
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.about_page.update_one({"content_id": "about_page"}, {"$set": update}, upsert=True)
    return await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})


# ==================== SITEMAP ====================

@router.get("/sitemap.xml")
async def get_sitemap():
    base_url = "https://www.diocreations.eu"
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
        {"loc": "/about", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/services", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/products", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/portfolio", "priority": "0.8", "changefreq": "weekly"},
        {"loc": "/blog", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/contact", "priority": "0.8", "changefreq": "monthly"},
    ]
    services = await db.services.find({"is_active": True}, {"slug": 1}).to_list(100)
    blog_posts = await db.blog.find({"is_published": True}, {"slug": 1}).to_list(500)
    portfolio = await db.portfolio.find({"is_active": True}, {"slug": 1}).to_list(100)

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for page in static_pages:
        xml += f'  <url><loc>{base_url}{page["loc"]}</loc><changefreq>{page["changefreq"]}</changefreq><priority>{page["priority"]}</priority></url>\n'
    for s in services:
        xml += f'  <url><loc>{base_url}/services/{s["slug"]}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n'
    for p in blog_posts:
        xml += f'  <url><loc>{base_url}/blog/{p["slug"]}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n'
    for i in portfolio:
        xml += f'  <url><loc>{base_url}/portfolio/{i["slug"]}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n'
    xml += "</urlset>"
    return Response(content=xml, media_type="application/xml")


# ============ PROMOTED SECTIONS ============

@router.get("/homepage/promoted-sections")
async def get_promoted_sections():
    """Get promoted tools sections for homepage"""
    sections = await db.promoted_sections.find({}, {"_id": 0}).sort("order", 1).to_list(20)
    return sections


@router.put("/homepage/promoted-sections")
async def update_promoted_sections(sections: list, user: dict = Depends(get_current_user)):
    """Update all promoted sections"""
    # Clear existing and insert new
    await db.promoted_sections.delete_many({})
    if sections:
        for i, section in enumerate(sections):
            section["order"] = i
        await db.promoted_sections.insert_many(sections)
    return {"message": "Promoted sections updated"}


# ============ CLIENT LOGOS ============

# Default client logos for initial setup
_DEFAULT_CLIENT_LOGOS = [
    {"logo_id": "logo_google", "name": "Google", "image_url": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png", "url": "", "is_active": True, "order": 0},
    {"logo_id": "logo_microsoft", "name": "Microsoft", "image_url": "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31", "url": "", "is_active": True, "order": 1},
    {"logo_id": "logo_amazon", "name": "Amazon", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/200px-Amazon_logo.svg.png", "url": "", "is_active": True, "order": 2},
    {"logo_id": "logo_meta", "name": "Meta", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/200px-Meta_Platforms_Inc._logo.svg.png", "url": "", "is_active": True, "order": 3},
    {"logo_id": "logo_apple", "name": "Apple", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/80px-Apple_logo_black.svg.png", "url": "", "is_active": True, "order": 4},
]


@router.get("/homepage/client-logos")
async def get_client_logos():
    """Get client logos for trust section on homepage"""
    logos = await db.client_logos.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    return logos


@router.get("/homepage/client-logos/all")
async def get_all_client_logos(user: dict = Depends(get_current_user)):
    """Get all client logos for admin (including inactive)"""
    logos = await db.client_logos.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not logos:
        # Initialize with default logos
        for logo in _DEFAULT_CLIENT_LOGOS:
            await db.client_logos.insert_one({**logo})
        logos = list(_DEFAULT_CLIENT_LOGOS)
    return logos


@router.post("/homepage/client-logos")
async def create_client_logo(logo: dict, user: dict = Depends(get_current_user)):
    """Create a new client logo"""
    import uuid as _uuid
    logo["logo_id"] = f"logo_{_uuid.uuid4().hex[:8]}"
    logo["is_active"] = logo.get("is_active", True)
    logo["order"] = logo.get("order", 0)
    await db.client_logos.insert_one(logo)
    logo.pop("_id", None)
    return logo


@router.put("/homepage/client-logos/reorder")
async def reorder_client_logos(data: dict, user: dict = Depends(get_current_user)):
    """Reorder client logos - MUST be before /{logo_id} route"""
    for idx, logo_id in enumerate(data.get("order", [])):
        await db.client_logos.update_one({"logo_id": logo_id}, {"$set": {"order": idx}})
    return {"message": "Client logos reordered"}


@router.put("/homepage/client-logos/{logo_id}")
async def update_client_logo(logo_id: str, update: dict, user: dict = Depends(get_current_user)):
    """Update a client logo"""
    update.pop("_id", None)
    update.pop("logo_id", None)
    result = await db.client_logos.update_one({"logo_id": logo_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client logo not found")
    return await db.client_logos.find_one({"logo_id": logo_id}, {"_id": 0})


@router.delete("/homepage/client-logos/{logo_id}")
async def delete_client_logo(logo_id: str, user: dict = Depends(get_current_user)):
    """Delete a client logo"""
    result = await db.client_logos.delete_one({"logo_id": logo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client logo not found")
    return {"message": "Client logo deleted"}
