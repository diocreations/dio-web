"""Seed data route"""
from fastapi import APIRouter
from database import db, logger
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


@router.post("/seed")
async def seed_data():
    """Seed initial data for the website"""
    services = [
        {"title": "Web & Mobile App Development", "slug": "web-mobile-development", "short_description": "From small business websites to enterprise-grade systems", "description": "DioCreations builds eCommerce, AI-driven, and mobile app solutions that scale your business.", "icon": "Code", "features": ["Custom Web Applications", "Mobile App Development", "E-commerce Solutions", "Progressive Web Apps", "API Development", "Cloud Infrastructure"], "order": 1},
        {"title": "Search Engine Optimization", "slug": "seo-services", "short_description": "Dominate search results with data-driven SEO", "description": "Our SEO experts use advanced strategies to improve your search rankings.", "icon": "Search", "features": ["Technical SEO Audit", "Keyword Research", "On-Page Optimization", "Link Building", "Content Strategy", "Analytics & Reporting"], "order": 2},
        {"title": "AI-Powered Solutions", "slug": "ai-solutions", "short_description": "Leverage artificial intelligence for business growth", "description": "We integrate cutting-edge AI technologies into your business.", "icon": "Brain", "features": ["Custom AI Chatbots", "Machine Learning Models", "Natural Language Processing", "Computer Vision", "Predictive Analytics", "AI Automation"], "order": 3},
        {"title": "Local SEO & Google Business", "slug": "local-seo", "short_description": "Dominate local search results", "description": "Get found by local customers with our specialized local SEO services.", "icon": "MapPin", "features": ["Google Business Profile", "Local Citations", "Review Management", "Local Content Strategy", "Map Pack Optimization", "Local Link Building"], "order": 4},
        {"title": "Marketing Automation", "slug": "marketing-automation", "short_description": "Automate your marketing for maximum ROI", "description": "Streamline your marketing with automation tools.", "icon": "Rocket", "features": ["Email Automation", "Social Media Scheduling", "Lead Nurturing", "CRM Integration", "Campaign Analytics", "A/B Testing"], "order": 5},
    ]
    for s in services:
        existing = await db.services.find_one({"slug": s["slug"]})
        if not existing:
            s["service_id"] = f"svc_{uuid.uuid4().hex[:12]}"
            s["is_active"] = True
            s["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.services.insert_one(s)

    products = [
        {"title": "Business Website Package", "slug": "business-website", "short_description": "Complete business website with modern design", "description": "Get a professionally designed website.", "icon": "Globe", "price": 999, "price_unit": "one-time", "features": ["5 Custom Pages", "Mobile Responsive", "SEO Optimized", "Contact Form", "SSL Certificate"], "is_purchasable": True, "order": 1},
        {"title": "E-commerce Store", "slug": "ecommerce-store", "short_description": "Full-featured online store", "description": "Launch your online store with everything you need.", "icon": "ShoppingCart", "price": 2499, "price_unit": "one-time", "features": ["Unlimited Products", "Payment Integration", "Inventory Management", "Order Tracking", "SEO Optimized"], "is_popular": True, "is_purchasable": True, "order": 2},
        {"title": "SEO Growth Package", "slug": "seo-growth", "short_description": "Monthly SEO management", "description": "Ongoing SEO services.", "icon": "TrendingUp", "price": 499, "price_unit": "/month", "pricing_type": "subscription", "billing_period": "monthly", "features": ["Keyword Research", "On-Page Optimization", "Link Building", "Monthly Reports"], "is_purchasable": True, "order": 3},
    ]
    for p in products:
        existing = await db.products.find_one({"slug": p["slug"]})
        if not existing:
            p["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
            p["is_active"] = True
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.insert_one(p)

    blog_posts = [
        {"title": "10 Essential SEO Tips for Small Businesses in 2025", "slug": "seo-tips-small-businesses-2025", "excerpt": "Discover the most effective SEO strategies.", "content": "SEO is crucial for small businesses...", "featured_image": "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80", "category": "SEO", "tags": ["SEO", "small business", "digital marketing"], "author": "DioCreations Team", "is_published": True},
        {"title": "How AI is Revolutionizing Web Development", "slug": "ai-revolutionizing-web-development", "excerpt": "Explore how AI is changing the landscape.", "content": "Artificial intelligence is transforming...", "featured_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", "category": "Technology", "tags": ["AI", "web development", "technology"], "author": "DioCreations Team", "is_published": True},
        {"title": "The Complete Guide to E-commerce Success", "slug": "ecommerce-success-guide", "excerpt": "Learn the secrets to e-commerce success.", "content": "E-commerce has become essential...", "featured_image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80", "category": "E-commerce", "tags": ["e-commerce", "online store", "business"], "author": "DioCreations Team", "is_published": True},
    ]
    for post in blog_posts:
        existing = await db.blog.find_one({"slug": post["slug"]})
        if not existing:
            post["post_id"] = f"blog_{uuid.uuid4().hex[:12]}"
            post["published_at"] = datetime.now(timezone.utc).isoformat()
            post["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.blog.insert_one(post)

    existing_settings = await db.settings.find_one({"settings_id": "site_settings"})
    if not existing_settings:
        await db.settings.insert_one({
            "settings_id": "site_settings",
            "site_name": "DioCreations",
            "tagline": "Digital Excellence for Modern Business",
            "contact_email": "info@diocreations.eu",
            "contact_phone": "+1 234 567 8900",
            "contact_address": "123 Tech Street, Digital City, DC 12345",
            "footer_text": "\u00a9 2025 DioCreations. All rights reserved.",
        })

    return {"message": "Data seeded successfully"}
