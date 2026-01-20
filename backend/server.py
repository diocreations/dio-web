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
