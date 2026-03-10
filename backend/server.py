"""Slim server.py - App init, middleware, router includes, startup/shutdown"""
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from database import db, logger
from datetime import datetime, timezone, timedelta
import hashlib
import uuid
import asyncio
import re

app = FastAPI()

# Bot user agents for SEO pre-rendering
BOT_USER_AGENTS = [
    'googlebot', 'google-inspectiontool', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'sogou', 'exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'linkedinbot', 'twitterbot', 'applebot', 'semrushbot',
    'ahrefsbot', 'mj12bot', 'petalbot', 'dotbot', 'rogerbot'
]

def is_bot(user_agent: str) -> bool:
    """Check if request is from a search engine bot"""
    if not user_agent:
        return False
    ua_lower = user_agent.lower()
    return any(bot in ua_lower for bot in BOT_USER_AGENTS)

# SEO Bot Detection Middleware - Serve pre-rendered HTML to crawlers
@app.middleware("http")
async def seo_prerender_middleware(request: Request, call_next):
    """Redirect search engine bots to pre-rendered pages for proper indexing"""
    user_agent = request.headers.get("user-agent", "")
    path = request.url.path
    
    # Only intercept frontend blog routes (not API routes)
    if is_bot(user_agent) and not path.startswith("/api"):
        # Check for blog post URLs: /blog/{slug}
        blog_post_match = re.match(r'^/blog/([a-zA-Z0-9_-]+)$', path)
        if blog_post_match:
            slug = blog_post_match.group(1)
            # Redirect to pre-rendered version
            logger.info(f"Bot detected ({user_agent[:50]}...) - serving pre-rendered: /blog/{slug}")
            return RedirectResponse(
                url=f"/api/prerender/blog/{slug}",
                status_code=200  # Use 200 internally, the prerender endpoint returns proper HTML
            )
        
        # Check for blog listing: /blog
        if path == "/blog" or path == "/blog/":
            logger.info(f"Bot detected ({user_agent[:50]}...) - serving pre-rendered blog list")
            return RedirectResponse(
                url="/api/prerender/blog",
                status_code=200
            )
    
    response = await call_next(request)
    return response

# Subdomain middleware - serve resume-only mode for resume.diocreations.eu
@app.middleware("http")
async def subdomain_handler(request, call_next):
    host = request.headers.get("host", "")
    # Set a header so frontend can detect subdomain mode
    response = await call_next(request)
    if host.startswith("resume."):
        response.headers["X-Resume-Subdomain"] = "true"
    return response

# CORS middleware - must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include all routers
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.content import router as content_router
from routes.homepage import router as homepage_router
from routes.resume import router as resume_router
from routes.chatbot import router as chatbot_router
from routes.payments import router as payments_router
from routes.seed import router as seed_router
from routes.geo_currency import router as geo_router
from routes.menus import router as menus_router
from routes.public_auth import router as public_auth_router
from routes.user_dashboard import router as user_dashboard_router
from routes.cover_letter import router as cover_letter_router
from routes.templates import router as templates_router
from routes.google_auth_public import router as google_auth_public_router
from routes.google_drive import router as google_drive_router
from routes.seo import router as seo_router
from routes.referral import router as referral_router
from routes.builder import router as builder_router
from routes.newsletter import router as newsletter_router
from routes.invitations import router as invitations_router
from routes.prerender import router as prerender_router

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(content_router)
app.include_router(homepage_router)
app.include_router(resume_router)
app.include_router(chatbot_router)
app.include_router(payments_router)
app.include_router(seed_router)
app.include_router(geo_router)
app.include_router(menus_router)
app.include_router(public_auth_router)
app.include_router(user_dashboard_router)
app.include_router(cover_letter_router)
app.include_router(templates_router)
app.include_router(google_auth_public_router)
app.include_router(google_drive_router)
app.include_router(seo_router)
app.include_router(referral_router)
app.include_router(builder_router)
app.include_router(newsletter_router)
app.include_router(invitations_router)
app.include_router(prerender_router, prefix="/api")


# Root endpoint
@app.get("/api/")
async def root():
    return {"message": "DioCreations API", "version": "1.0.0"}


@app.get("/api/config/subdomain")
async def get_subdomain_config():
    """Return subdomain configuration for DNS setup"""
    return {
        "subdomains": [
            {
                "subdomain": "resume.diocreations.eu",
                "purpose": "Resume & LinkedIn Optimizer standalone",
                "dns_type": "CNAME",
                "dns_value": "diocreations.eu",
                "status": "configured",
                "notes": "Point this CNAME to your main domain. The app auto-detects and serves resume-only mode.",
            }
        ],
        "instructions": [
            "1. Go to your DNS provider (where diocreations.eu is registered)",
            "2. Add a CNAME record: resume -> diocreations.eu (or your hosting IP)",
            "3. If using Cloudflare, enable proxy for SSL",
            "4. The app automatically detects the subdomain and serves the resume optimizer",
        ],
    }


@app.on_event("startup")
async def startup_event():
    """Create default admin user on startup if not exists"""
    try:
        existing_admin = await db.users.find_one({"email": "admin@diocreations.com"})
        if not existing_admin:
            password_hash = hashlib.sha256("adminpassword".encode()).hexdigest()
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": "admin@diocreations.com",
                "password_hash": password_hash,
                "name": "Admin",
                "role": "admin",
            })
            logger.info("Default admin user created: admin@diocreations.com")
        else:
            logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
    # Start 24-hour data cleanup background task
    asyncio.create_task(_cleanup_expired_data_loop())


async def _cleanup_expired_data_loop():
    """Background task: delete public user data older than 24 hours"""
    while True:
        try:
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            r1 = await db.public_sessions.delete_many({"expires_at": {"$lt": cutoff}})
            old_users = await db.public_users.find(
                {"created_at": {"$lt": cutoff}}, {"_id": 0, "user_id": 1, "email": 1}
            ).to_list(500)
            for u in old_users:
                uid = u["user_id"]
                email = u.get("email", "")
                q = {"$or": [{"user_id": uid}, {"email": email}]}
                await db.resume_analyses.delete_many(q)
                await db.resume_uploads.delete_many(q)
                await db.resume_improvements.delete_many(q)
                await db.cover_letters.delete_many({"user_id": uid})
                await db.resume_payments.delete_many(q)
                await db.public_users.delete_one({"user_id": uid})
            if old_users:
                logger.info(f"Cleanup: removed {len(old_users)} expired users and their data")
            if r1.deleted_count > 0:
                logger.info(f"Cleanup: removed {r1.deleted_count} expired sessions")
        except Exception as e:
            logger.error(f"Cleanup task error: {e}")
        await asyncio.sleep(3600)


@app.on_event("shutdown")
async def shutdown_db_client():
    from database import _client
    _client.close()
