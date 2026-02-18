from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import asyncio
import resend
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')

# LLM setup for Dio chatbot
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Store chat instances in memory (per session)
chat_instances = {}

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "admin"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    picture: Optional[str] = None
    created_at: datetime

class PageContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    page_id: str = Field(default_factory=lambda: f"page_{uuid.uuid4().hex[:12]}")
    slug: str
    title: str
    meta_description: Optional[str] = None
    content: dict = {}
    is_published: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PageContentUpdate(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    content: Optional[dict] = None
    is_published: Optional[bool] = None

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: f"svc_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    short_description: str
    description: str
    icon: str
    features: List[str] = []
    image_url: Optional[str] = None
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    title: str
    slug: str
    short_description: str
    description: str
    icon: str
    features: List[str] = []
    image_url: Optional[str] = None
    order: int = 0
    is_active: bool = True

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    short_description: str
    description: str
    icon: str
    price: Optional[str] = None
    price_unit: Optional[str] = None
    features: List[str] = []
    is_popular: bool = False
    cta_text: str = "Get Started"
    cta_link: Optional[str] = None
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    slug: str
    short_description: str
    description: str
    icon: str
    price: Optional[str] = None
    price_unit: Optional[str] = None
    features: List[str] = []
    is_popular: bool = False
    cta_text: str = "Get Started"
    cta_link: Optional[str] = None
    order: int = 0
    is_active: bool = True

class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    portfolio_id: str = Field(default_factory=lambda: f"port_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    category: str
    description: str
    image_url: str
    gallery_images: List[str] = []
    client_name: Optional[str] = None
    technologies: List[str] = []
    project_url: Optional[str] = None
    is_featured: bool = False
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioCreate(BaseModel):
    title: str
    slug: str
    category: str
    description: str
    image_url: str
    gallery_images: List[str] = []
    client_name: Optional[str] = None
    technologies: List[str] = []
    project_url: Optional[str] = None
    is_featured: bool = False
    order: int = 0
    is_active: bool = True

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: f"blog_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str
    tags: List[str] = []
    author: str
    is_published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str
    tags: List[str] = []
    author: str
    is_published: bool = False

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    testimonial_id: str = Field(default_factory=lambda: f"test_{uuid.uuid4().hex[:12]}")
    client_name: str
    client_title: str
    client_company: str
    client_image: Optional[str] = None
    content: str
    rating: int = 5
    is_featured: bool = False
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestimonialCreate(BaseModel):
    client_name: str
    client_title: str
    client_company: str
    client_image: Optional[str] = None
    content: str
    rating: int = 5
    is_featured: bool = False
    order: int = 0
    is_active: bool = True

class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    submission_id: str = Field(default_factory=lambda: f"contact_{uuid.uuid4().hex[:12]}")
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactSubmissionCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class MediaItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    media_id: str = Field(default_factory=lambda: f"media_{uuid.uuid4().hex[:12]}")
    filename: str
    original_filename: str
    mime_type: str
    size: int
    url: str
    alt_text: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    settings_id: str = "site_settings"
    site_name: str = "DioCreations"
    tagline: str = "Digital Excellence for Modern Business"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    contact_email: str = ""
    contact_phone: str = ""
    contact_address: str = ""
    social_facebook: Optional[str] = None
    social_twitter: Optional[str] = None
    social_linkedin: Optional[str] = None
    social_instagram: Optional[str] = None
    footer_text: str = ""
    google_analytics_id: Optional[str] = None

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def generate_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(request: Request) -> dict:
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": "admin",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    session_token = generate_token()
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    return {"user_id": user_id, "email": user_data.email, "name": user_data.name, "session_token": session_token}

@api_router.post("/auth/login")
async def login(response: Response, user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = generate_token()
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "admin"),
        "picture": user.get("picture"),
        "session_token": session_token
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session data"""
    import httpx
    
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if user:
        await db.users.update_one(
            {"email": auth_data["email"]},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture")}}
        )
        user_id = user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "role": "admin",
            "picture": auth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = auth_data.get("session_token", generate_token())
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": auth_data["email"],
        "name": auth_data["name"],
        "picture": auth_data.get("picture"),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "admin"),
        "picture": user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ==================== PAGES ROUTES ====================

@api_router.get("/pages", response_model=List[PageContent])
async def get_pages():
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    return pages

@api_router.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.put("/pages/{slug}")
async def update_page(slug: str, update: PageContentUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pages.update_one({"slug": slug}, {"$set": update_data})
    if result.matched_count == 0:
        page_doc = PageContent(slug=slug, title=update.title or slug.title(), **update_data).model_dump()
        page_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.pages.insert_one(page_doc)
    
    return await db.pages.find_one({"slug": slug}, {"_id": 0})

# ==================== SERVICES ROUTES ====================

@api_router.get("/services", response_model=List[Service])
async def get_services(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    services = await db.services.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return services

@api_router.get("/services/{slug}")
async def get_service(slug: str):
    service = await db.services.find_one({"slug": slug}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.post("/services", response_model=Service)
async def create_service(service: ServiceCreate, user: dict = Depends(get_current_user)):
    service_obj = Service(**service.model_dump())
    doc = service_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.services.insert_one(doc)
    return service_obj

@api_router.put("/services/{service_id}")
async def update_service(service_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("service_id", None)
    result = await db.services.update_one({"service_id": service_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return await db.services.find_one({"service_id": service_id}, {"_id": 0})

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"service_id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# ==================== PRODUCTS ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    products = await db.products.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return products

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, user: dict = Depends(get_current_user)):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("product_id", None)
    result = await db.products.update_one({"product_id": product_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"product_id": product_id}, {"_id": 0})

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== PORTFOLIO ROUTES ====================

@api_router.get("/portfolio", response_model=List[PortfolioItem])
async def get_portfolio(active_only: bool = False, category: Optional[str] = None):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    portfolio = await db.portfolio.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return portfolio

@api_router.get("/portfolio/{slug}")
async def get_portfolio_item(slug: str):
    item = await db.portfolio.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return item

@api_router.post("/portfolio", response_model=PortfolioItem)
async def create_portfolio_item(item: PortfolioCreate, user: dict = Depends(get_current_user)):
    item_obj = PortfolioItem(**item.model_dump())
    doc = item_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.portfolio.insert_one(doc)
    return item_obj

@api_router.put("/portfolio/{portfolio_id}")
async def update_portfolio_item(portfolio_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("portfolio_id", None)
    result = await db.portfolio.update_one({"portfolio_id": portfolio_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return await db.portfolio.find_one({"portfolio_id": portfolio_id}, {"_id": 0})

@api_router.delete("/portfolio/{portfolio_id}")
async def delete_portfolio_item(portfolio_id: str, user: dict = Depends(get_current_user)):
    result = await db.portfolio.delete_one({"portfolio_id": portfolio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return {"message": "Portfolio item deleted"}

# ==================== BLOG ROUTES ====================

@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(published_only: bool = False, category: Optional[str] = None):
    query = {}
    if published_only:
        query["is_published"] = True
    if category:
        query["category"] = category
    posts = await db.blog.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

@api_router.post("/blog", response_model=BlogPost)
async def create_blog_post(post: BlogPostCreate, user: dict = Depends(get_current_user)):
    post_obj = BlogPost(**post.model_dump())
    if post.is_published:
        post_obj.published_at = datetime.now(timezone.utc)
    doc = post_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    if doc.get("published_at"):
        doc["published_at"] = doc["published_at"].isoformat()
    await db.blog.insert_one(doc)
    return post_obj

@api_router.put("/blog/{post_id}")
async def update_blog_post(post_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("post_id", None)
    if update.get("is_published") and not await db.blog.find_one({"post_id": post_id, "published_at": {"$exists": True}}):
        update["published_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.blog.update_one({"post_id": post_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return await db.blog.find_one({"post_id": post_id}, {"_id": 0})

@api_router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.blog.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}

# ==================== TESTIMONIALS ROUTES ====================

@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    testimonials = await db.testimonials.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return testimonials

@api_router.post("/testimonials", response_model=Testimonial)
async def create_testimonial(testimonial: TestimonialCreate, user: dict = Depends(get_current_user)):
    testimonial_obj = Testimonial(**testimonial.model_dump())
    doc = testimonial_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.testimonials.insert_one(doc)
    return testimonial_obj

@api_router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("testimonial_id", None)
    result = await db.testimonials.update_one({"testimonial_id": testimonial_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return await db.testimonials.find_one({"testimonial_id": testimonial_id}, {"_id": 0})

@api_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, user: dict = Depends(get_current_user)):
    result = await db.testimonials.delete_one({"testimonial_id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}

# ==================== CONTACT ROUTES ====================

@api_router.post("/contact")
async def submit_contact(submission: ContactSubmissionCreate):
    submission_obj = ContactSubmission(**submission.model_dump())
    doc = submission_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact_submissions.insert_one(doc)
    
    # Send email notification if configured
    if resend.api_key and ADMIN_EMAIL:
        try:
            html_content = f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {submission.name}</p>
            <p><strong>Email:</strong> {submission.email}</p>
            <p><strong>Phone:</strong> {submission.phone or 'Not provided'}</p>
            <p><strong>Subject:</strong> {submission.subject}</p>
            <p><strong>Message:</strong></p>
            <p>{submission.message}</p>
            """
            params = {
                "from": SENDER_EMAIL,
                "to": [ADMIN_EMAIL],
                "subject": f"New Contact: {submission.subject}",
                "html": html_content
            }
            await asyncio.to_thread(resend.Emails.send, params)
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    
    return {"message": "Contact form submitted successfully", "submission_id": submission_obj.submission_id}

@api_router.get("/contact", response_model=List[ContactSubmission])
async def get_contact_submissions(user: dict = Depends(get_current_user)):
    submissions = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return submissions

@api_router.put("/contact/{submission_id}/read")
async def mark_submission_read(submission_id: str, user: dict = Depends(get_current_user)):
    result = await db.contact_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Marked as read"}

@api_router.delete("/contact/{submission_id}")
async def delete_submission(submission_id: str, user: dict = Depends(get_current_user)):
    result = await db.contact_submissions.delete_one({"submission_id": submission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission deleted"}

# ==================== MEDIA ROUTES ====================

@api_router.get("/media", response_model=List[MediaItem])
async def get_media(user: dict = Depends(get_current_user)):
    media = await db.media.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return media

@api_router.post("/media")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    encoded = base64.b64encode(content).decode()
    data_url = f"data:{file.content_type};base64,{encoded}"
    
    media_obj = MediaItem(
        filename=f"{uuid.uuid4().hex[:12]}_{file.filename}",
        original_filename=file.filename,
        mime_type=file.content_type,
        size=len(content),
        url=data_url
    )
    doc = media_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.media.insert_one(doc)
    
    return media_obj

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(get_current_user)):
    result = await db.media.delete_one({"media_id": media_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted"}

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"settings_id": "site_settings"}, {"_id": 0})
    if not settings:
        default = SiteSettings()
        await db.settings.insert_one(default.model_dump())
        return default.model_dump()
    return settings

@api_router.put("/settings")
async def update_settings(update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("settings_id", None)
    result = await db.settings.update_one(
        {"settings_id": "site_settings"},
        {"$set": update},
        upsert=True
    )
    return await db.settings.find_one({"settings_id": "site_settings"}, {"_id": 0})

# ==================== STATS ROUTE ====================

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    services_count = await db.services.count_documents({})
    products_count = await db.products.count_documents({})
    portfolio_count = await db.portfolio.count_documents({})
    blog_count = await db.blog.count_documents({})
    testimonials_count = await db.testimonials.count_documents({})
    unread_contacts = await db.contact_submissions.count_documents({"is_read": False})
    total_contacts = await db.contact_submissions.count_documents({})
    
    return {
        "services": services_count,
        "products": products_count,
        "portfolio": portfolio_count,
        "blog_posts": blog_count,
        "testimonials": testimonials_count,
        "unread_contacts": unread_contacts,
        "total_contacts": total_contacts
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for the website"""
    
    # Seed Services
    services = [
        {
            "title": "Web & Mobile App Development",
            "slug": "web-mobile-development",
            "short_description": "From small business websites to enterprise-grade systems",
            "description": "DioCreations builds eCommerce, AI-driven, and mobile app solutions that scale. Our expert team delivers custom web applications, responsive websites, and native mobile apps for iOS and Android.",
            "icon": "Code",
            "features": ["Custom Web Applications", "E-commerce Solutions", "Mobile App Development", "Progressive Web Apps", "API Development", "Cloud Integration"],
            "order": 1
        },
        {
            "title": "Search Engine Optimization",
            "slug": "seo",
            "short_description": "Boost your online visibility and drive organic traffic",
            "description": "Our comprehensive SEO services help businesses rank higher on search engines, increase organic traffic, and improve conversion rates through data-driven strategies.",
            "icon": "Search",
            "features": ["Keyword Research", "On-Page SEO", "Technical SEO", "Content Strategy", "Link Building", "Analytics & Reporting"],
            "order": 2
        },
        {
            "title": "Local SEO",
            "slug": "local-seo",
            "short_description": "Dominate local search results and attract nearby customers",
            "description": "Optimize your Google Business Profile, reviews, and citations to rank higher in local searches and attract nearby customers effortlessly.",
            "icon": "MapPin",
            "features": ["Google Business Profile Optimization", "Local Citations", "Review Management", "Local Link Building", "NAP Consistency", "Local Content Strategy"],
            "order": 3
        },
        {
            "title": "Private LLMs & AI Solutions",
            "slug": "private-llms",
            "short_description": "Take control of your data with private AI solutions",
            "description": "Learn how to host private large language models securely for custom AI and business automation. We help you implement AI solutions that keep your data private and secure.",
            "icon": "Brain",
            "features": ["Private LLM Hosting", "Custom AI Models", "Data Security", "On-Premise Solutions", "AI Integration", "Model Fine-tuning"],
            "order": 4
        },
        {
            "title": "Marketing Automation",
            "slug": "marketing-automation",
            "short_description": "Build smarter campaigns that run 24/7",
            "description": "Discover how AI automation nurtures leads, personalizes experiences, and scales effortlessly. Our marketing automation solutions help you reach the right audience at the right time.",
            "icon": "Zap",
            "features": ["Email Automation", "Lead Nurturing", "Campaign Management", "A/B Testing", "Analytics Dashboard", "CRM Integration"],
            "order": 5
        },
        {
            "title": "Email Marketing",
            "slug": "email-marketing",
            "short_description": "Modern email strategies powered by AI",
            "description": "Automation, segmentation, and personalization that deliver better open rates and conversions. We create email campaigns that engage and convert.",
            "icon": "Mail",
            "features": ["Campaign Design", "List Segmentation", "Automation Workflows", "A/B Testing", "Performance Analytics", "Deliverability Optimization"],
            "order": 6
        }
    ]
    
    for svc in services:
        existing = await db.services.find_one({"slug": svc["slug"]})
        if not existing:
            svc["service_id"] = f"svc_{uuid.uuid4().hex[:12]}"
            svc["is_active"] = True
            svc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.services.insert_one(svc)
    
    # Seed Products
    products = [
        {
            "title": "Domain Registration",
            "slug": "domain-registration",
            "short_description": "Get your perfect domain name",
            "description": "Register your domain name with privacy protection and lots more. Choose from .COM, .NET, .IN, .AI and many more extensions.",
            "icon": "Globe",
            "price": "14.46",
            "price_unit": "per year",
            "features": ["Free Privacy Protection", "DNS Management", "Email Forwarding", "Domain Lock", "Auto-Renewal"],
            "is_popular": False,
            "order": 1
        },
        {
            "title": "Web Hosting",
            "slug": "web-hosting",
            "short_description": "Reliable hosting with 99.9% uptime",
            "description": "Email hosting included with 99.9% uptime guarantee. Reliable and secure hosting powered by cPanel/Plesk.",
            "icon": "Server",
            "price": "1.87",
            "price_unit": "per month",
            "features": ["99.9% Uptime Guarantee", "Free SSL Certificate", "cPanel Control Panel", "Daily Backups", "24/7 Support"],
            "is_popular": True,
            "order": 2
        },
        {
            "title": "SSL Certificate",
            "slug": "ssl-certificate",
            "short_description": "Secure your website with SSL",
            "description": "Up to 256-bit encryption with free reissues included. Browser compatibility guaranteed.",
            "icon": "Shield",
            "price": "33.00",
            "price_unit": "per year",
            "features": ["256-bit Encryption", "Free Reissues", "Browser Compatibility", "Site Seal", "Warranty Included"],
            "is_popular": False,
            "order": 3
        },
        {
            "title": "Website Builder",
            "slug": "website-builder",
            "short_description": "Build professional websites easily",
            "description": "No technical skills required. Quick and easy to use with hundreds of professional designs.",
            "icon": "Layout",
            "price": "5.50",
            "price_unit": "per month",
            "features": ["Drag & Drop Editor", "100+ Templates", "Mobile Responsive", "SEO Tools", "E-commerce Ready"],
            "is_popular": True,
            "order": 4
        },
        {
            "title": "Google Workspace",
            "slug": "google-workspace",
            "short_description": "Professional email and collaboration",
            "description": "Get unlimited cloud storage, collaboration tools and more to suit your business needs.",
            "icon": "Cloud",
            "price": "6.00",
            "price_unit": "per user/month",
            "features": ["Professional Email", "30GB Cloud Storage", "Google Docs, Sheets, Slides", "Video Conferencing", "24/7 Support"],
            "is_popular": False,
            "order": 5
        },
        {
            "title": "Cloud Hosting",
            "slug": "cloud-hosting",
            "short_description": "Scalable cloud infrastructure",
            "description": "High-performance cloud hosting with instant scalability and dedicated resources.",
            "icon": "CloudCog",
            "price": "15.00",
            "price_unit": "per month",
            "features": ["Instant Scaling", "Dedicated Resources", "SSD Storage", "Root Access", "99.99% Uptime"],
            "is_popular": False,
            "order": 6
        }
    ]
    
    for prod in products:
        existing = await db.products.find_one({"slug": prod["slug"]})
        if not existing:
            prod["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
            prod["is_active"] = True
            prod["cta_text"] = "Get Started"
            prod["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products.insert_one(prod)
    
    # Seed Testimonials
    testimonials = [
        {
            "client_name": "Sarah Johnson",
            "client_title": "CEO",
            "client_company": "TechStart Inc.",
            "content": "DioCreations transformed our online presence completely. Their team delivered a stunning website that increased our conversions by 40%. Highly recommend their services!",
            "rating": 5,
            "is_featured": True,
            "order": 1
        },
        {
            "client_name": "Michael Chen",
            "client_title": "Marketing Director",
            "client_company": "GrowthHub",
            "content": "The SEO services provided by DioCreations helped us rank on the first page of Google within 3 months. Their data-driven approach really works.",
            "rating": 5,
            "is_featured": True,
            "order": 2
        },
        {
            "client_name": "Emily Rodriguez",
            "client_title": "Founder",
            "client_company": "LocalBiz Solutions",
            "content": "Outstanding support and expertise. They helped us set up our hosting infrastructure and it's been running flawlessly for over a year now.",
            "rating": 5,
            "is_featured": True,
            "order": 3
        }
    ]
    
    for test in testimonials:
        existing = await db.testimonials.find_one({"client_name": test["client_name"], "client_company": test["client_company"]})
        if not existing:
            test["testimonial_id"] = f"test_{uuid.uuid4().hex[:12]}"
            test["is_active"] = True
            test["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.testimonials.insert_one(test)
    
    # Seed Portfolio items
    portfolio_items = [
        {
            "title": "Luxe Fashion E-commerce Store",
            "slug": "luxe-fashion-ecommerce",
            "category": "E-commerce",
            "description": "A premium fashion e-commerce platform featuring AI-powered product recommendations, virtual try-on technology, multi-currency checkout, and seamless inventory management across 50+ retail locations.",
            "image_url": "https://images.unsplash.com/photo-1612831661941-254341b885e9?w=800&q=80",
            "client_name": "Luxe Fashion Group",
            "technologies": ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
            "project_url": "https://luxefashion.com",
            "is_featured": True,
            "order": 1
        },
        {
            "title": "FinServe Banking Portal",
            "slug": "finserve-banking",
            "category": "Web App",
            "description": "Secure online banking portal with real-time transaction monitoring, investment tracking, loan management, and AI-powered financial insights for over 500,000 customers.",
            "image_url": "https://images.unsplash.com/photo-1642054220942-d3c7dd1466cb?w=800&q=80",
            "client_name": "FinServe Bank",
            "technologies": ["Angular", "Java Spring", "PostgreSQL", "Redis"],
            "project_url": "https://finservebank.com",
            "is_featured": True,
            "order": 2
        },
        {
            "title": "HealthTrack Mobile App",
            "slug": "healthtrack-mobile",
            "category": "Mobile App",
            "description": "Comprehensive health and fitness mobile application with workout tracking, nutrition planning, telemedicine integration, and wearable device connectivity. 2M+ downloads.",
            "image_url": "https://images.unsplash.com/photo-1762341119237-98df67c9c3c9?w=800&q=80",
            "client_name": "HealthTrack Inc.",
            "technologies": ["React Native", "Firebase", "Node.js", "HealthKit"],
            "project_url": "https://healthtrackapp.com",
            "is_featured": True,
            "order": 3
        },
        {
            "title": "InsightPro Analytics Dashboard",
            "slug": "insightpro-dashboard",
            "category": "SaaS",
            "description": "Enterprise-grade analytics dashboard with real-time data visualization, custom reporting, predictive analytics, and automated alerts serving 1000+ business clients.",
            "image_url": "https://images.unsplash.com/photo-1763718528755-4bca23f82ac3?w=800&q=80",
            "client_name": "InsightPro Analytics",
            "technologies": ["Vue.js", "D3.js", "Python", "TensorFlow", "AWS"],
            "project_url": "https://insightpro.io",
            "is_featured": True,
            "order": 4
        },
        {
            "title": "PropertyHub Real Estate Platform",
            "slug": "propertyhub-realestate",
            "category": "Website",
            "description": "Full-featured real estate marketplace with virtual property tours, mortgage calculator, agent matching, and neighborhood insights. Handling $2B+ in annual transactions.",
            "image_url": "https://images.unsplash.com/photo-1642132652860-471b4228023e?w=800&q=80",
            "client_name": "PropertyHub Group",
            "technologies": ["Next.js", "GraphQL", "PostgreSQL", "Mapbox"],
            "project_url": "https://propertyhub.com",
            "is_featured": False,
            "order": 5
        },
        {
            "title": "EduLearn Online Academy",
            "slug": "edulearn-academy",
            "category": "E-learning",
            "description": "Interactive e-learning platform with live classes, progress tracking, certification management, and AI tutoring. Serving 100,000+ students across 30 countries.",
            "image_url": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80",
            "client_name": "EduLearn Global",
            "technologies": ["React", "Node.js", "WebRTC", "MongoDB", "AWS"],
            "project_url": "https://edulearn.academy",
            "is_featured": False,
            "order": 6
        },
        {
            "title": "FoodieGo Delivery App",
            "slug": "foodiego-delivery",
            "category": "Mobile App",
            "description": "On-demand food delivery application with real-time order tracking, restaurant management portal, driver app, and loyalty rewards. Processing 50,000+ orders daily.",
            "image_url": "https://images.unsplash.com/photo-1596742578443-7682ef5251cd?w=800&q=80",
            "client_name": "FoodieGo Inc.",
            "technologies": ["Flutter", "Firebase", "Node.js", "Google Maps"],
            "project_url": "https://foodiego.app",
            "is_featured": False,
            "order": 7
        },
        {
            "title": "TravelWise Booking Platform",
            "slug": "travelwise-booking",
            "category": "Website",
            "description": "Comprehensive travel booking platform integrating flights, hotels, car rentals, and experiences with AI-powered trip planning and price alerts.",
            "image_url": "https://images.unsplash.com/photo-1642054220431-649c53b0d3de?w=800&q=80",
            "client_name": "TravelWise Corp",
            "technologies": ["React", "Python", "Elasticsearch", "Redis", "AWS"],
            "project_url": "https://travelwise.com",
            "is_featured": False,
            "order": 8
        }
    ]
    
    for item in portfolio_items:
        existing = await db.portfolio.find_one({"slug": item["slug"]})
        if not existing:
            item["portfolio_id"] = f"port_{uuid.uuid4().hex[:12]}"
            item["gallery_images"] = []
            item["is_active"] = True
            item["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.portfolio.insert_one(item)
    
    # Seed default settings
    existing_settings = await db.settings.find_one({"settings_id": "site_settings"})
    if not existing_settings:
        settings = SiteSettings(
            site_name="DioCreations",
            tagline="Digital Excellence for Modern Business",
            contact_email="info@diocreations.eu",
            contact_phone="+1 234 567 8900",
            contact_address="123 Tech Street, Digital City, DC 12345",
            footer_text="© 2025 DioCreations. All rights reserved."
        )
        await db.settings.insert_one(settings.model_dump())
    
    return {"message": "Data seeded successfully"}

# ==================== CHATBOT ROUTES ====================

DIO_SYSTEM_MESSAGE = """You are Dio, a friendly and helpful AI assistant for DioCreations - a digital agency specializing in web development, SEO, hosting, and AI solutions.

Your personality:
- Warm, professional, and conversational
- Knowledgeable about digital services
- Focused on understanding customer needs and providing solutions
- Helpful in guiding visitors to the right services
- Proactive in collecting contact information to provide better service

About DioCreations services:
1. Web & Mobile App Development - Custom websites, e-commerce, mobile apps
2. SEO Services - Search engine optimization to boost visibility
3. Local SEO - Help local businesses rank higher
4. Private LLMs & AI Solutions - Custom AI implementations
5. Marketing Automation - Automated campaigns and lead nurturing
6. Email Marketing - Professional email campaigns

About DioCreations products:
1. Domain Registration - Starting at $14.46/year
2. Web Hosting - Starting at $1.87/month (99.9% uptime)
3. SSL Certificates - $33/year (256-bit encryption)
4. Website Builder - $5.50/month (drag & drop)
5. Google Workspace - $6/user/month
6. Cloud Hosting - $15/month (scalable)

IMPORTANT - Lead Collection Strategy:
After understanding the user's needs, naturally collect their contact information:
1. Ask for their NAME first ("By the way, what should I call you?" or "May I know your name?")
2. Then ask for EMAIL ("What's the best email to reach you?")
3. Finally ask for PHONE/WHATSAPP ("And a phone or WhatsApp number where our team can connect with you?")

When you receive contact info, format it EXACTLY like this in your response:
[LEAD_INFO:name=John Doe,email=john@example.com,phone=+1234567890]

IMPORTANT - Showing Portfolio:
When users ask to see examples or portfolio, or when you want to show relevant work, include this tag:
[SHOW_PORTFOLIO:category_keyword]

Where category_keyword can be: website, ecommerce, mobile, seo, branding, or all

Examples:
- User asks about e-commerce → Include [SHOW_PORTFOLIO:ecommerce] in your response
- User wants to see websites → Include [SHOW_PORTFOLIO:website] in your response
- User asks for general portfolio → Include [SHOW_PORTFOLIO:all] in your response

Your goals:
1. Welcome visitors warmly
2. Understand their needs through conversation
3. Recommend relevant services or products
4. Show relevant portfolio examples when appropriate
5. Naturally collect contact information (name, email, phone/WhatsApp)
6. Answer questions about pricing and features
7. Convert visitors into qualified leads

Keep responses concise, friendly, and focused on helping the visitor find what they need. Use emojis sparingly to add warmth. Always aim to convert interest into action and collect leads."""

class ChatMessage(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    lead_info: Optional[dict] = None
    show_portfolio: Optional[str] = None

class LeadInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    lead_id: str = Field(default_factory=lambda: f"lead_{uuid.uuid4().hex[:12]}")
    session_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    interests: List[str] = []
    source: str = "chatbot"
    status: str = "new"
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def parse_lead_info(response_text: str) -> Optional[dict]:
    """Extract lead info from response"""
    import re
    match = re.search(r'\[LEAD_INFO:([^\]]+)\]', response_text)
    if match:
        info_str = match.group(1)
        lead_data = {}
        for pair in info_str.split(','):
            if '=' in pair:
                key, value = pair.split('=', 1)
                lead_data[key.strip()] = value.strip()
        return lead_data
    return None

def parse_portfolio_request(response_text: str) -> Optional[str]:
    """Extract portfolio request from response"""
    import re
    match = re.search(r'\[SHOW_PORTFOLIO:([^\]]+)\]', response_text)
    if match:
        return match.group(1).strip()
    return None

def clean_response(response_text: str) -> str:
    """Remove special tags from response"""
    import re
    cleaned = re.sub(r'\[LEAD_INFO:[^\]]+\]', '', response_text)
    cleaned = re.sub(r'\[SHOW_PORTFOLIO:[^\]]+\]', '', cleaned)
    return cleaned.strip()

@api_router.post("/chat")
async def chat_with_dio(chat_message: ChatMessage):
    """Chat with Dio - the DioCreations AI assistant"""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Chat service not configured")
    
    session_id = chat_message.session_id
    
    # Create or get chat instance for this session
    if session_id not in chat_instances:
        chat_instances[session_id] = {
            "chat": LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=DIO_SYSTEM_MESSAGE
            ).with_model("gemini", "gemini-2.0-flash"),
            "history": [],
            "lead_info": {},
            "created_at": datetime.now(timezone.utc)
        }
    
    chat_data = chat_instances[session_id]
    chat = chat_data["chat"]
    
    # Store user message in history
    chat_data["history"].append({
        "role": "user",
        "content": chat_message.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    try:
        # Send message to LLM
        user_msg = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_msg)
        
        # Store assistant response in history
        chat_data["history"].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Save chat history to database
        await db.chat_sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "session_id": session_id,
                    "history": chat_data["history"],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        # Parse lead info and portfolio request from response
        lead_info = parse_lead_info(response)
        show_portfolio = parse_portfolio_request(response)
        cleaned_response = clean_response(response)
        
        # Save lead info if found
        if lead_info:
            # Update session lead info
            chat_data["lead_info"].update(lead_info)
            
            # Save to database
            existing_lead = await db.leads.find_one({"session_id": session_id})
            if existing_lead:
                await db.leads.update_one(
                    {"session_id": session_id},
                    {"$set": {**lead_info, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            else:
                lead_obj = LeadInfo(session_id=session_id, **lead_info)
                lead_doc = lead_obj.model_dump()
                lead_doc["created_at"] = lead_doc["created_at"].isoformat()
                await db.leads.insert_one(lead_doc)
        
        return {
            "response": cleaned_response,
            "session_id": session_id,
            "lead_info": chat_data.get("lead_info") if chat_data.get("lead_info") else None,
            "show_portfolio": show_portfolio
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Dio")

@api_router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    # Check memory first
    if session_id in chat_instances:
        return {
            "history": chat_instances[session_id]["history"],
            "lead_info": chat_instances[session_id].get("lead_info", {})
        }
    
    # Then check database
    session = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    lead = await db.leads.find_one({"session_id": session_id}, {"_id": 0})
    
    return {
        "history": session.get("history", []) if session else [],
        "lead_info": lead if lead else {}
    }

@api_router.delete("/chat/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear chat session"""
    if session_id in chat_instances:
        del chat_instances[session_id]
    await db.chat_sessions.delete_one({"session_id": session_id})
    return {"message": "Chat session cleared"}

# ==================== LEADS ROUTES ====================

@api_router.get("/leads")
async def get_leads(user: dict = Depends(get_current_user)):
    """Get all leads from chatbot"""
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leads

@api_router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, update: dict, user: dict = Depends(get_current_user)):
    """Update lead status or notes"""
    update.pop("_id", None)
    update.pop("lead_id", None)
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.leads.update_one({"lead_id": lead_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    """Delete a lead"""
    result = await db.leads.delete_one({"lead_id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "DioCreations API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
