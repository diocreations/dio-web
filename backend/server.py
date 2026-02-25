from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import asyncio
import resend
import base64
import httpx
import re
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

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

# Stripe setup
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# ResellerClub setup
RESELLERCLUB_API_KEY = os.environ.get('RESELLERCLUB_API_KEY', '')
RESELLERCLUB_RESELLER_ID = os.environ.get('RESELLERCLUB_RESELLER_ID', '')
RESELLERCLUB_API_URL = "https://httpapi.com/api"

# Super Admin Email (owner)
SUPER_ADMIN_EMAIL = "jomiejoseph@gmail.com"

# Butterfly Logo SVG for emails (inline)
BUTTERFLY_LOGO_SVG = '''<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="60" height="60">
<g><path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
<path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
<path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/></g>
<g><path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
<path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
<path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/></g>
</svg>'''

async def send_purchase_email(to_email: str, customer_name: str, product_name: str, amount: str, currency: str):
    """Send purchase confirmation email with butterfly logo"""
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return False
    
    email_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 30px; text-align: center;">
                <div style="display: inline-block; background: white; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
                    {BUTTERFLY_LOGO_SVG}
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">DIOCREATIONS</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Digital Excellence for Modern Business</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 24px;">Thank You for Your Purchase! 🎉</h2>
                
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hi <strong>{customer_name or 'Valued Customer'}</strong>,
                </p>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    We're excited to confirm your purchase. Here are the details:
                </p>
                
                <!-- Order Details Box -->
                <div style="background-color: #f8f5ff; border-radius: 8px; padding: 25px; margin-bottom: 25px; border-left: 4px solid #7c3aed;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="color: #666; padding: 8px 0; font-size: 14px;">Product:</td>
                            <td style="color: #333; padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">{product_name}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; padding: 8px 0; font-size: 14px; border-top: 1px solid #e0d4f5;">Amount Paid:</td>
                            <td style="color: #7c3aed; padding: 8px 0; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #e0d4f5;">{currency}{amount}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                    Our team will be in touch within <strong>24 hours</strong> to help you get started. If you have any questions, feel free to reach out!
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.diocreations.eu/contact" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-weight: 600; font-size: 14px;">Contact Support</a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f5ff; padding: 25px 30px; text-align: center; border-top: 1px solid #e0d4f5;">
                <div style="margin-bottom: 15px;">
                    {BUTTERFLY_LOGO_SVG.replace('width="60" height="60"', 'width="40" height="40"')}
                </div>
                <p style="color: #7c3aed; font-weight: 600; margin: 0 0 5px 0; font-size: 14px;">DIOCREATIONS</p>
                <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">Your AI-Powered Growing Partner</p>
                <p style="color: #999; font-size: 11px; margin: 0;">
                    <a href="https://www.diocreations.eu" style="color: #7c3aed; text-decoration: none;">www.diocreations.eu</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": f"Purchase Confirmation - {product_name} | DioCreations",
            "html": email_html
        }
        resend.Emails.send(params)
        logger.info(f"Purchase email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

# Currency exchange rates (base: EUR)
CURRENCY_RATES = {
    "EUR": 1.0,
    "USD": 1.08,
    "GBP": 0.86,
    "INR": 90.50,
    "AED": 3.97,
    "AUD": 1.65,
    "CAD": 1.47,
    "SGD": 1.45,
    "CHF": 0.94
}

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
    price: Optional[float] = None  # Base price in EUR
    price_unit: Optional[str] = None  # e.g., "/month", "/year", "one-time"
    pricing_type: str = "one_time"  # "one_time" or "subscription"
    billing_period: Optional[str] = None  # "monthly", "yearly" for subscriptions
    features: List[str] = []
    is_popular: bool = False
    cta_text: str = "Get Started"
    cta_link: Optional[str] = None
    order: int = 0
    is_active: bool = True
    is_purchasable: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    slug: str
    short_description: str
    description: str
    icon: str
    price: Optional[float] = None
    price_unit: Optional[str] = None
    pricing_type: str = "one_time"
    billing_period: Optional[str] = None
    features: List[str] = []
    is_popular: bool = False
    cta_text: str = "Get Started"
    cta_link: Optional[str] = None
    order: int = 0
    is_active: bool = True
    is_purchasable: bool = True

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
    # Payment Settings
    stripe_api_key: Optional[str] = None
    stripe_mode: str = "test"  # "test" or "live"
    # ResellerClub Settings
    resellerclub_api_key: Optional[str] = None
    resellerclub_reseller_id: Optional[str] = None

# Admin User Management
class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    admin_id: str = Field(default_factory=lambda: f"admin_{uuid.uuid4().hex[:12]}")
    email: str
    name: Optional[str] = None
    role: str = "admin"  # "super_admin" or "admin"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

# AI Website Builder Models
class WebsiteCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    name: str
    slug: str
    description: str
    icon: str
    template_type: str  # "basic", "portfolio", "ecommerce"
    is_active: bool = True
    order: int = 0

class BuilderPricing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tier: str  # "basic", "standard", "pro"
    name: str
    price: float
    currency: str = "EUR"
    features: List[str] = []
    pages_limit: int = 5
    includes_hosting: bool = False
    includes_domain: bool = False
    is_active: bool = True

class WebsiteOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"order_{uuid.uuid4().hex[:12]}")
    customer_email: str
    customer_name: Optional[str] = None
    category: str
    tier: str  # "basic", "standard", "pro"
    business_name: str
    business_description: Optional[str] = None
    pages: List[str] = []  # Selected pages
    portfolio_images: List[str] = []  # For portfolio sites
    portfolio_videos: List[str] = []  # For portfolio sites
    products: List[Dict] = []  # For e-commerce sites
    generated_content: Optional[Dict] = None
    generated_code: Optional[str] = None
    hosting_option: str = "auto"  # "auto" or "download"
    domain_name: Optional[str] = None
    domain_ordered: bool = False
    hosting_credentials: Optional[Dict] = None
    payment_status: str = "pending"
    order_status: str = "pending"  # pending, generating, completed, delivered
    amount: float = 0
    currency: str = "EUR"
    stripe_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class DomainOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    domain_order_id: str = Field(default_factory=lambda: f"dom_{uuid.uuid4().hex[:12]}")
    customer_email: str
    domain_name: str
    years: int = 1
    price: float
    currency: str = "EUR"
    resellerclub_order_id: Optional[str] = None
    payment_status: str = "pending"
    order_status: str = "pending"
    stripe_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HOMEPAGE CONTENT MODELS ====================

class HeroVariant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    variant_id: str = Field(default_factory=lambda: f"hero_{uuid.uuid4().hex[:8]}")
    badge_text: str = "Digital Excellence for Modern Business"
    title_line1: str = "Your AI-Powered"
    title_line2: str = "Growing Partner"
    subtitle: str = "From small business websites to enterprise-grade systems - we build eCommerce, AI-driven, and mobile app solutions that scale your business"
    primary_cta_text: str = "Get Started"
    primary_cta_link: str = "/contact"
    secondary_cta_text: str = "View Services"
    secondary_cta_link: str = "/services"
    hero_image: str = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
    accent_color: str = "violet"  # violet, blue, pink, teal, orange
    is_active: bool = True
    order: int = 0

class ColorScheme(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scheme_id: str = Field(default_factory=lambda: f"color_{uuid.uuid4().hex[:8]}")
    name: str
    primary: str  # e.g., "violet-600"
    secondary: str  # e.g., "violet-800"
    accent: str  # e.g., "pink-500"
    gradient_from: str
    gradient_via: str
    gradient_to: str
    is_active: bool = True

class HomepageSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    settings_id: str = "homepage_settings"
    # Hero settings
    enable_hero_rotation: bool = True
    hero_rotation_interval: int = 10  # seconds (for carousel-style)
    hero_rotation_type: str = "refresh"  # "refresh" = change on page load, "auto" = carousel
    # Color settings
    enable_color_rotation: bool = True
    color_rotation_type: str = "refresh"  # "refresh" = change on page load
    # Featured sections
    show_featured_blog: bool = True
    featured_blog_count: int = 3
    show_featured_products: bool = True
    featured_products_count: int = 3
    # Section visibility and ordering
    show_services: bool = True
    show_products: bool = True
    show_portfolio: bool = True
    show_testimonials: bool = True
    show_cta: bool = True
    show_blog: bool = True
    # Section order (drag & drop)
    section_order: List[str] = ["services", "products", "blog", "portfolio", "testimonials", "cta"]
    # Stats section
    show_stats: bool = True
    stats: List[Dict] = [
        {"label": "Projects Completed", "value": "500+"},
        {"label": "Happy Clients", "value": "200+"},
        {"label": "Years Experience", "value": "10+"},
        {"label": "Team Members", "value": "25+"}
    ]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeaturedItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_type: str  # "blog" or "product"
    item_id: str
    order: int = 0

# ==================== ABOUT PAGE CONTENT MODEL ====================

class AboutPageContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    content_id: str = "about_page"
    # Hero Section
    hero_badge: str = "About Us"
    hero_title_line1: str = "Building Digital"
    hero_title_line2: str = "Excellence Since 2015"
    hero_description: str = "DioCreations is a full-service digital agency specializing in web development, SEO, and AI-powered solutions. We help businesses of all sizes establish and grow their online presence."
    hero_cta_text: str = "Work With Us"
    hero_cta_link: str = "/contact"
    hero_image: str = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
    # Stats Section
    show_stats: bool = True
    stats: List[Dict] = [
        {"value": "10+", "label": "Years Experience"},
        {"value": "500+", "label": "Projects Completed"},
        {"value": "50+", "label": "Team Members"},
        {"value": "20+", "label": "Countries Served"}
    ]
    # Values Section
    show_values: bool = True
    values_badge: str = "Our Values"
    values_title: str = "What Drives Us"
    values_subtitle: str = "Our core values shape everything we do and how we serve our clients"
    values: List[Dict] = [
        {"icon": "Target", "title": "Client-Focused", "description": "Your success is our priority. We work closely with you to understand your goals and deliver solutions that exceed expectations."},
        {"icon": "Lightbulb", "title": "Innovation First", "description": "We stay ahead of technology trends to bring you cutting-edge solutions that give you a competitive advantage."},
        {"icon": "Award", "title": "Excellence", "description": "Quality is non-negotiable. Every project we deliver meets the highest standards of performance and reliability."},
        {"icon": "Users", "title": "Collaboration", "description": "We believe in transparent communication and partnership throughout the project lifecycle."}
    ]
    # Timeline/Milestones Section
    show_timeline: bool = True
    timeline_badge: str = "Our Journey"
    timeline_title: str = "Milestones Along the Way"
    milestones: List[Dict] = [
        {"year": "2015", "title": "Founded", "description": "Started with a vision to democratize digital solutions"},
        {"year": "2017", "title": "100+ Projects", "description": "Reached milestone of 100 successful project deliveries"},
        {"year": "2019", "title": "Global Expansion", "description": "Extended services to clients across 20+ countries"},
        {"year": "2021", "title": "AI Integration", "description": "Launched AI-powered development and automation services"},
        {"year": "2023", "title": "500+ Projects", "description": "Celebrated 500+ successful digital transformations"},
        {"year": "2025", "title": "Industry Leader", "description": "Recognized as a leading digital solutions provider"}
    ]
    # Why Choose Us Section
    show_why_us: bool = True
    why_us_badge: str = "Why Choose Us"
    why_us_title: str = "We're Your Partners in Digital Growth"
    why_us_description: str = "With years of experience and a dedicated team of experts, we deliver solutions that drive real results for your business."
    why_us_image: str = "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80"
    why_us_points: List[str] = [
        "Custom solutions tailored to your needs",
        "Dedicated project managers for every project",
        "Transparent pricing with no hidden fees",
        "24/7 support and maintenance",
        "Proven track record of success",
        "Latest technologies and best practices"
    ]
    # CTA Section
    show_cta: bool = True
    cta_title: str = "Ready to Start Your Project?"
    cta_subtitle: str = "Let's discuss how we can help you achieve your digital goals"
    cta_button_text: str = "Get in Touch"
    cta_button_link: str = "/contact"
    # Metadata
    meta_title: str = "About Us | DIOCREATIONS"
    meta_description: str = "Learn about DIOCREATIONS - Your AI-Powered Growing Partner. 10+ years experience, 500+ projects delivered across 20+ countries."
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# GeoIP country to currency mapping
COUNTRY_TO_CURRENCY = {
    # Europe
    "AT": "EUR", "BE": "EUR", "CY": "EUR", "EE": "EUR", "FI": "EUR",
    "FR": "EUR", "DE": "EUR", "GR": "EUR", "IE": "EUR", "IT": "EUR",
    "LV": "EUR", "LT": "EUR", "LU": "EUR", "MT": "EUR", "NL": "EUR",
    "PT": "EUR", "SK": "EUR", "SI": "EUR", "ES": "EUR",
    # India
    "IN": "INR",
    # UK
    "GB": "GBP",
    # USA
    "US": "USD",
    # UAE
    "AE": "AED",
    # Australia
    "AU": "AUD",
    # Canada
    "CA": "CAD",
    # Singapore
    "SG": "SGD",
    # Switzerland
    "CH": "CHF"
}

# ==================== HELPERS ====================

async def get_stripe_api_key() -> str:
    """Get Stripe API key from database settings, fallback to env"""
    settings = await db.settings.find_one({"settings_id": "site_settings"})
    if settings and settings.get("stripe_api_key"):
        return settings["stripe_api_key"]
    return STRIPE_API_KEY

async def get_resellerclub_credentials() -> tuple:
    """Get ResellerClub credentials from database settings, fallback to env"""
    settings = await db.settings.find_one({"settings_id": "site_settings"})
    api_key = RESELLERCLUB_API_KEY
    reseller_id = RESELLERCLUB_RESELLER_ID
    if settings:
        if settings.get("resellerclub_api_key"):
            api_key = settings["resellerclub_api_key"]
        if settings.get("resellerclub_reseller_id"):
            reseller_id = settings["resellerclub_reseller_id"]
    return api_key, reseller_id

async def check_admin_access(email: str) -> bool:
    """Check if email has admin access"""
    if email == SUPER_ADMIN_EMAIL:
        return True
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    return admin is not None

async def get_admin_role(email: str) -> str:
    """Get admin role for email"""
    if email == SUPER_ADMIN_EMAIL:
        return "super_admin"
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    return admin.get("role", "admin") if admin else None

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
    
    # Check if user has admin access
    user_email = auth_data["email"]
    has_access = await check_admin_access(user_email)
    user_role = await get_admin_role(user_email)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied. You don't have admin privileges. Contact the super admin to get access.")
    
    user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if user:
        await db.users.update_one(
            {"email": user_email},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture"), "role": user_role}}
        )
        user_id = user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_email,
            "name": auth_data["name"],
            "role": user_role,
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
        "email": user_email,
        "name": auth_data["name"],
        "role": user_role,
        "picture": auth_data.get("picture"),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    # Get the actual role (super_admin check)
    user_role = await get_admin_role(user["email"])
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user_role or user.get("role", "admin"),
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

# ==================== HOMEPAGE CONTENT ROUTES ====================

@api_router.get("/homepage/content")
async def get_homepage_content(request: Request):
    """Get all homepage content for public display with geo-based currency"""
    # Get visitor's currency based on geo-IP
    visitor_currency = "EUR"  # Default
    cf_country = request.headers.get("CF-IPCountry", "")
    x_country = request.headers.get("X-Country-Code", "")
    country_code = cf_country or x_country or ""
    
    if country_code in COUNTRY_TO_CURRENCY:
        visitor_currency = COUNTRY_TO_CURRENCY[country_code]
    
    # Get homepage settings
    settings = await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})
    if not settings:
        settings = HomepageSettings().model_dump()
        settings["updated_at"] = settings["updated_at"].isoformat()
    
    # Get hero variants
    hero_variants = await db.hero_variants.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(20)
    if not hero_variants:
        # Return default hero variant
        hero_variants = [HeroVariant().model_dump()]
    
    # Get color schemes
    color_schemes = await db.color_schemes.find({"is_active": True}, {"_id": 0}).to_list(20)
    if not color_schemes:
        # Default color schemes
        color_schemes = [
            {"scheme_id": "color_violet", "name": "Violet", "primary": "violet-600", "secondary": "violet-800", "accent": "violet-400", "gradient_from": "violet-900", "gradient_via": "violet-800", "gradient_to": "slate-900", "is_active": True},
            {"scheme_id": "color_blue", "name": "Blue", "primary": "blue-600", "secondary": "blue-800", "accent": "blue-400", "gradient_from": "blue-900", "gradient_via": "blue-800", "gradient_to": "slate-900", "is_active": True},
            {"scheme_id": "color_teal", "name": "Teal", "primary": "teal-600", "secondary": "teal-800", "accent": "teal-400", "gradient_from": "teal-900", "gradient_via": "teal-800", "gradient_to": "slate-900", "is_active": True},
            {"scheme_id": "color_pink", "name": "Pink", "primary": "pink-600", "secondary": "pink-800", "accent": "pink-400", "gradient_from": "pink-900", "gradient_via": "pink-800", "gradient_to": "slate-900", "is_active": True},
            {"scheme_id": "color_orange", "name": "Orange", "primary": "orange-600", "secondary": "orange-800", "accent": "orange-400", "gradient_from": "orange-900", "gradient_via": "orange-800", "gradient_to": "slate-900", "is_active": True},
        ]
    
    # Get featured blog posts
    featured_blog = []
    if settings.get("show_featured_blog", True):
        featured_count = settings.get("featured_blog_count", 3)
        # First check for manually featured
        featured_items = await db.featured_items.find({"item_type": "blog"}, {"_id": 0}).sort("order", 1).to_list(featured_count)
        if featured_items:
            blog_ids = [f["item_id"] for f in featured_items]
            featured_blog = await db.blog.find({"post_id": {"$in": blog_ids}, "is_published": True}, {"_id": 0}).to_list(featured_count)
        else:
            # Fallback to most recent published
            featured_blog = await db.blog.find({"is_published": True}, {"_id": 0}).sort("published_at", -1).to_list(featured_count)
    
    # Get featured products with currency conversion
    featured_products = []
    if settings.get("show_featured_products", True):
        featured_count = settings.get("featured_products_count", 3)
        # First check for manually featured
        featured_items = await db.featured_items.find({"item_type": "product"}, {"_id": 0}).sort("order", 1).to_list(featured_count)
        if featured_items:
            product_ids = [f["item_id"] for f in featured_items]
            featured_products = await db.products.find({"product_id": {"$in": product_ids}, "is_active": True}, {"_id": 0}).to_list(featured_count)
        else:
            # Fallback to popular or first active products
            featured_products = await db.products.find({"is_active": True, "is_popular": True}, {"_id": 0}).sort("order", 1).to_list(featured_count)
            if len(featured_products) < featured_count:
                more = await db.products.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(featured_count)
                featured_products = more[:featured_count]
    
    # Convert product prices to visitor's currency
    currency_rate = CURRENCY_RATES.get(visitor_currency, 1.0)
    currency_symbol = {"EUR": "€", "USD": "$", "GBP": "£", "INR": "₹", "AED": "د.إ", "AUD": "A$", "CAD": "C$", "SGD": "S$", "CHF": "CHF"}.get(visitor_currency, "€")
    
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
        "currency_rate": currency_rate
    }

@api_router.get("/homepage/settings")
async def get_homepage_settings(user: dict = Depends(get_current_user)):
    """Get homepage settings for admin"""
    settings = await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})
    if not settings:
        default = HomepageSettings()
        doc = default.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.homepage_settings.insert_one(doc)
        return doc
    return settings

@api_router.put("/homepage/settings")
async def update_homepage_settings(update: dict, user: dict = Depends(get_current_user)):
    """Update homepage settings"""
    update.pop("_id", None)
    update["settings_id"] = "homepage_settings"
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.homepage_settings.update_one(
        {"settings_id": "homepage_settings"},
        {"$set": update},
        upsert=True
    )
    return await db.homepage_settings.find_one({"settings_id": "homepage_settings"}, {"_id": 0})

@api_router.get("/homepage/hero-variants")
async def get_hero_variants(user: dict = Depends(get_current_user)):
    """Get all hero variants for admin"""
    variants = await db.hero_variants.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not variants:
        # Create default variant
        default = HeroVariant()
        doc = default.model_dump()
        await db.hero_variants.insert_one(doc)
        variants = [doc]
    return variants

@api_router.post("/homepage/hero-variants")
async def create_hero_variant(variant: dict, user: dict = Depends(get_current_user)):
    """Create a new hero variant"""
    variant_obj = HeroVariant(**variant)
    doc = variant_obj.model_dump()
    await db.hero_variants.insert_one(doc)
    return doc

@api_router.put("/homepage/hero-variants/{variant_id}")
async def update_hero_variant(variant_id: str, update: dict, user: dict = Depends(get_current_user)):
    """Update a hero variant"""
    update.pop("_id", None)
    update.pop("variant_id", None)
    result = await db.hero_variants.update_one({"variant_id": variant_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hero variant not found")
    return await db.hero_variants.find_one({"variant_id": variant_id}, {"_id": 0})

@api_router.delete("/homepage/hero-variants/{variant_id}")
async def delete_hero_variant(variant_id: str, user: dict = Depends(get_current_user)):
    """Delete a hero variant"""
    result = await db.hero_variants.delete_one({"variant_id": variant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hero variant not found")
    return {"message": "Hero variant deleted"}

@api_router.get("/homepage/color-schemes")
async def get_color_schemes(user: dict = Depends(get_current_user)):
    """Get all color schemes for admin"""
    schemes = await db.color_schemes.find({}, {"_id": 0}).to_list(50)
    if not schemes:
        # Create default schemes
        defaults = [
            ColorScheme(scheme_id="color_violet", name="Violet", primary="violet-600", secondary="violet-800", accent="violet-400", gradient_from="violet-900", gradient_via="violet-800", gradient_to="slate-900"),
            ColorScheme(scheme_id="color_blue", name="Blue", primary="blue-600", secondary="blue-800", accent="blue-400", gradient_from="blue-900", gradient_via="blue-800", gradient_to="slate-900"),
            ColorScheme(scheme_id="color_teal", name="Teal", primary="teal-600", secondary="teal-800", accent="teal-400", gradient_from="teal-900", gradient_via="teal-800", gradient_to="slate-900"),
            ColorScheme(scheme_id="color_pink", name="Pink", primary="pink-600", secondary="pink-800", accent="pink-400", gradient_from="pink-900", gradient_via="pink-800", gradient_to="slate-900"),
            ColorScheme(scheme_id="color_orange", name="Orange", primary="orange-600", secondary="orange-800", accent="orange-400", gradient_from="orange-900", gradient_via="orange-800", gradient_to="slate-900"),
        ]
        for scheme in defaults:
            await db.color_schemes.insert_one(scheme.model_dump())
        schemes = [s.model_dump() for s in defaults]
    return schemes

@api_router.put("/homepage/color-schemes/{scheme_id}")
async def update_color_scheme(scheme_id: str, update: dict, user: dict = Depends(get_current_user)):
    """Update a color scheme"""
    update.pop("_id", None)
    update.pop("scheme_id", None)
    result = await db.color_schemes.update_one({"scheme_id": scheme_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Color scheme not found")
    return await db.color_schemes.find_one({"scheme_id": scheme_id}, {"_id": 0})

@api_router.get("/homepage/featured-items")
async def get_featured_items(user: dict = Depends(get_current_user)):
    """Get all featured items for admin"""
    items = await db.featured_items.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return items

@api_router.put("/homepage/featured-items")
async def update_featured_items(items: List[dict], user: dict = Depends(get_current_user)):
    """Update featured items (replace all)"""
    # Clear existing featured items
    await db.featured_items.delete_many({})
    # Insert new ones
    if items:
        for i, item in enumerate(items):
            item["order"] = i
            await db.featured_items.insert_one(item)
    return {"message": "Featured items updated"}

@api_router.get("/geo/currency")
async def get_visitor_currency(request: Request):
    """Get visitor's currency based on geo-IP"""
    # Check various headers for country code
    cf_country = request.headers.get("CF-IPCountry", "")
    x_country = request.headers.get("X-Country-Code", "")
    country_code = cf_country or x_country or ""
    
    visitor_currency = "EUR"  # Default
    if country_code in COUNTRY_TO_CURRENCY:
        visitor_currency = COUNTRY_TO_CURRENCY[country_code]
    
    currency_rate = CURRENCY_RATES.get(visitor_currency, 1.0)
    currency_symbol = {"EUR": "€", "USD": "$", "GBP": "£", "INR": "₹", "AED": "د.إ", "AUD": "A$", "CAD": "C$", "SGD": "S$", "CHF": "CHF"}.get(visitor_currency, "€")
    
    return {
        "country_code": country_code,
        "currency": visitor_currency,
        "currency_symbol": currency_symbol,
        "currency_rate": currency_rate,
        "all_currencies": list(CURRENCY_RATES.keys())
    }

# ==================== ABOUT PAGE ROUTES ====================

@api_router.get("/about/content")
async def get_about_content():
    """Get about page content for public display"""
    content = await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})
    if not content:
        # Return default content
        default = AboutPageContent()
        doc = default.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        return doc
    return content

@api_router.get("/about/settings")
async def get_about_settings(user: dict = Depends(get_current_user)):
    """Get about page settings for admin"""
    content = await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})
    if not content:
        default = AboutPageContent()
        doc = default.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.about_page.insert_one(doc)
        return doc
    return content

@api_router.put("/about/settings")
async def update_about_settings(update: dict, user: dict = Depends(get_current_user)):
    """Update about page settings"""
    update.pop("_id", None)
    update["content_id"] = "about_page"
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.about_page.update_one(
        {"content_id": "about_page"},
        {"$set": update},
        upsert=True
    )
    return await db.about_page.find_one({"content_id": "about_page"}, {"_id": 0})

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
    
    # Seed Blog Posts
    blog_posts = [
        {
            "title": "10 Web Design Trends Dominating 2025",
            "slug": "web-design-trends-2025",
            "excerpt": "Discover the cutting-edge design trends that are shaping the digital landscape in 2025, from AI-driven personalization to immersive 3D experiences.",
            "content": """The web design landscape is constantly evolving, and 2025 brings exciting new trends that are reshaping how we create digital experiences.

**1. AI-Driven Personalization**
Websites now adapt in real-time to user behavior, creating unique experiences for each visitor.

**2. Immersive 3D Elements**
WebGL and Three.js are enabling stunning 3D visuals that engage users like never before.

**3. Dark Mode by Default**
More sites are adopting dark mode as the primary theme for better battery life and reduced eye strain.

**4. Micro-Interactions Everywhere**
Subtle animations and feedback make interfaces feel more alive and responsive.

**5. Voice User Interfaces**
Voice navigation is becoming a standard feature, making websites more accessible.

**6. Glassmorphism 2.0**
The frosted glass effect continues to evolve with more sophisticated implementations.

**7. Sustainable Web Design**
Optimizing for lower carbon footprints through efficient code and green hosting.

**8. AI-Generated Content**
Dynamic content that adapts to user interests and preferences.

**9. Motion Design**
Sophisticated animations that tell stories and guide users through experiences.

**10. Accessibility-First Design**
WCAG compliance is now a baseline requirement, not an afterthought.

Contact DioCreations to implement these trends in your next project!""",
            "featured_image": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80",
            "category": "Web Design",
            "tags": ["design", "trends", "2025", "web development"],
            "author": "DioCreations Team",
            "is_published": True
        },
        {
            "title": "How AI is Revolutionizing SEO in 2025",
            "slug": "ai-revolutionizing-seo-2025",
            "excerpt": "Artificial intelligence is transforming search engine optimization. Learn how to leverage AI tools to boost your rankings and outperform competitors.",
            "content": """Search engine optimization has entered a new era with AI at its core. Here's how to stay ahead.

**The AI SEO Revolution**

Google's algorithms are now primarily AI-driven, understanding context and intent better than ever. This means traditional keyword stuffing is dead, and quality content reigns supreme.

**Key AI SEO Strategies:**

1. **Content Optimization with AI**
Use AI tools to analyze top-ranking content and identify gaps in your strategy.

2. **Predictive Analytics**
AI can forecast trending topics before they peak, giving you a first-mover advantage.

3. **Voice Search Optimization**
With 50% of searches being voice-based, conversational content is essential.

4. **Automated Technical SEO**
AI crawlers can identify and fix technical issues in real-time.

5. **Personalized User Experiences**
AI-driven personalization improves engagement metrics that search engines love.

**Tools We Recommend:**
- Surfer SEO for content optimization
- Clearscope for semantic analysis
- MarketMuse for content planning

At DioCreations, we combine AI tools with human expertise to deliver SEO results that matter. Contact us for a free SEO audit!""",
            "featured_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
            "category": "SEO",
            "tags": ["seo", "ai", "marketing", "search"],
            "author": "DioCreations Team",
            "is_published": True
        },
        {
            "title": "The Ultimate Guide to E-commerce Success",
            "slug": "ultimate-guide-ecommerce-success",
            "excerpt": "Everything you need to know to build and scale a successful e-commerce business in today's competitive market.",
            "content": """Building a successful e-commerce business requires more than just a good product. Here's our comprehensive guide.

**1. Choose the Right Platform**

Your platform choice affects everything from performance to scalability:
- Shopify: Best for beginners
- WooCommerce: Best for WordPress users
- Custom Solutions: Best for unique requirements

**2. Optimize for Mobile**

Over 70% of e-commerce traffic comes from mobile devices. Ensure:
- Fast loading times (under 3 seconds)
- Easy navigation with thumb-friendly buttons
- Simplified checkout process

**3. Build Trust**

Essential trust signals include:
- SSL certificates
- Customer reviews
- Clear return policies
- Multiple payment options

**4. SEO for E-commerce**

Product pages need:
- Unique, detailed descriptions
- High-quality images with alt text
- Schema markup for rich snippets

**5. Marketing Strategies**

Effective channels:
- Email marketing (highest ROI)
- Social media advertising
- Influencer partnerships
- Google Shopping ads

**6. Analytics and Optimization**

Track key metrics:
- Conversion rate
- Average order value
- Customer acquisition cost
- Lifetime value

Ready to launch your e-commerce store? DioCreations can help you build a scalable, conversion-optimized platform.""",
            "featured_image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
            "category": "E-commerce",
            "tags": ["ecommerce", "business", "online store", "sales"],
            "author": "DioCreations Team",
            "is_published": True
        },
        {
            "title": "Why Your Business Needs a Mobile App in 2025",
            "slug": "business-needs-mobile-app-2025",
            "excerpt": "Mobile apps are no longer optional for businesses. Discover why having a dedicated app can transform your customer engagement and revenue.",
            "content": """In 2025, mobile apps have become essential for businesses of all sizes. Here's why you need one.

**The Mobile-First World**

Statistics show:
- Average person spends 4+ hours daily on mobile apps
- Mobile commerce accounts for 73% of total e-commerce sales
- Push notifications have 50% higher open rates than email

**Benefits of a Mobile App:**

1. **Direct Customer Access**
Unlike websites, apps live on your customers' phones, providing instant access to your brand.

2. **Enhanced User Experience**
Apps are faster, more responsive, and can work offline.

3. **Push Notifications**
Reach customers directly with personalized messages and offers.

4. **Increased Loyalty**
App users are 3x more likely to make repeat purchases.

5. **Competitive Advantage**
Many competitors still don't have apps, giving you an edge.

**Types of Apps to Consider:**

- **E-commerce Apps**: Direct sales channel
- **Service Apps**: Booking and appointments
- **Loyalty Apps**: Rewards programs
- **Content Apps**: News and updates

**Development Options:**

1. Native Apps (iOS/Android)
2. Cross-Platform (React Native, Flutter)
3. Progressive Web Apps (PWAs)

DioCreations specializes in mobile app development. Let's discuss your app idea!""",
            "featured_image": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
            "category": "Mobile Development",
            "tags": ["mobile", "app development", "business", "technology"],
            "author": "DioCreations Team",
            "is_published": True
        }
    ]
    
    for post in blog_posts:
        existing = await db.blog.find_one({"slug": post["slug"]})
        if not existing:
            post["post_id"] = f"blog_{uuid.uuid4().hex[:12]}"
            post["published_at"] = datetime.now(timezone.utc).isoformat()
            post["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.blog.insert_one(post)
    
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

# Default greeting messages
DEFAULT_GREETINGS = [
    "Hey there! I'm Dio, your digital guide at DioCreations. What are you working on today?",
    "Welcome! I'm Dio — think of me as your tech-savvy friend. What can I help you with?",
    "Hi! Dio here, ready to chat. Whether it's websites, apps, or AI — I've got you covered. What's on your mind?",
    "Hello! I'm Dio from DioCreations. Need a website, SEO boost, or just curious about what we do? Let's talk!",
    "Hey! Dio at your service. I know a thing or two about the digital world. What brings you here today?",
    "Welcome to DioCreations! I'm Dio, your friendly AI assistant. Ask me anything — tech, business, or just say hi!",
    "Hi there! I'm Dio, and I love helping people figure out their digital needs. What can I do for you?",
    "Greetings! I'm Dio — part AI, part digital enthusiast, fully here to help. What's up?",
]

# Cached system message (rebuilt when admin saves settings)
_cached_system_message = None

async def get_chatbot_settings():
    """Get chatbot settings from DB, return defaults if not found"""
    settings = await db.chatbot_settings.find_one({"settings_id": "chatbot"}, {"_id": 0})
    if not settings:
        settings = {
            "settings_id": "chatbot",
            "greetings": DEFAULT_GREETINGS,
            "knowledge_base": [],
            "personality": "",
        }
    return settings

async def build_system_message():
    """Build dynamic system message from DB knowledge base (with caching)"""
    global _cached_system_message
    if _cached_system_message:
        return _cached_system_message

    settings = await get_chatbot_settings()
    knowledge_entries = settings.get("knowledge_base", [])
    custom_personality = settings.get("personality", "")

    kb_text = ""
    if knowledge_entries:
        kb_text = "\n\nKNOWLEDGE BASE:\n"
        for entry in knowledge_entries:
            if entry.get("enabled", True):
                kb_text += f"[{entry.get('title', 'Info')}] {entry.get('content', '')}\n"

    personality_text = ""
    if custom_personality.strip():
        personality_text = f"\n\nEXTRA CONTEXT: {custom_personality}\n"

    msg = f"""You are Dio, a sharp and friendly AI assistant for DioCreations. You're knowledgeable about everything — tech, business, science, culture — but you specialize in digital solutions.

RULES:
- Keep replies SHORT (2-4 sentences max). Be punchy and conversational.
- Sound like a smart friend texting, not a corporate chatbot.
- Ask ONE follow-up question to keep the conversation going.
- Use the visitor's name after they share it.
- Answer ANY question helpfully. When relevant, casually mention DioCreations services.
- Never give a wall of text. Break long info into multiple messages.

SERVICES (mention naturally when relevant):
Web Dev: /services/web-development | Mobile Apps: /services/mobile-app-development | SEO: /services/seo-services | Local SEO: /services/local-seo | AI Solutions: /services/ai-solutions | Marketing: /services/marketing-automation | Products: /products | Portfolio: /portfolio | Contact: /contact

LEAD CAPTURE: When someone's interested in services, smoothly ask for their email. Format: [LEAD_INFO:name=X,email=Y,phone=Z] (only fields provided)
PORTFOLIO: Include [SHOW_PORTFOLIO:category] when relevant (website/ecommerce/mobile/seo/branding/all)

QUICK REPLIES: After your response, suggest 2-3 clickable options on a new line starting with [QUICK_REPLIES:] separated by |
Example: [QUICK_REPLIES:See our portfolio|Get a free quote|Tell me about SEO]
{kb_text}{personality_text}"""

    _cached_system_message = msg
    return msg

@api_router.get("/chatbot/greeting")
async def get_random_greeting():
    """Get a random greeting for the chatbot"""
    import random
    settings = await get_chatbot_settings()
    greetings = settings.get("greetings", DEFAULT_GREETINGS)
    active_greetings = [g for g in greetings if g.strip()]
    if not active_greetings:
        active_greetings = DEFAULT_GREETINGS
    return {"greeting": random.choice(active_greetings)}

@api_router.get("/chatbot/settings")
async def get_chatbot_settings_admin(user: dict = Depends(get_current_user)):
    """Get chatbot settings for admin"""
    settings = await get_chatbot_settings()
    return settings

@api_router.put("/chatbot/settings")
async def update_chatbot_settings(update: dict, user: dict = Depends(get_current_user)):
    """Update chatbot settings"""
    update["settings_id"] = "chatbot"
    update.pop("_id", None)
    await db.chatbot_settings.update_one(
        {"settings_id": "chatbot"},
        {"$set": update},
        upsert=True
    )
    # Clear all chat instances so they pick up new system message
    chat_instances.clear()
    return await db.chatbot_settings.find_one({"settings_id": "chatbot"}, {"_id": 0})

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

# Payment Models
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str = Field(default_factory=lambda: f"txn_{uuid.uuid4().hex[:12]}")
    session_id: str
    product_id: str
    product_title: str
    amount: float
    currency: str
    payment_status: str = "pending"  # pending, paid, failed, expired
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CheckoutRequest(BaseModel):
    product_id: str
    origin_url: str
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    currency: str = "EUR"

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
        system_msg = await build_system_message()
        chat_instances[session_id] = {
            "chat": LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=system_msg
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

# ==================== PAYMENTS ====================

@api_router.get("/currency-rates")
async def get_currency_rates():
    """Get available currencies and exchange rates"""
    return {
        "base_currency": "EUR",
        "rates": CURRENCY_RATES,
        "supported_currencies": list(CURRENCY_RATES.keys())
    }

@api_router.post("/checkout/create")
async def create_checkout_session(request: Request, checkout_req: CheckoutRequest):
    """Create a Stripe checkout session for a product"""
    # Get product from database
    product = await db.products.find_one({"product_id": checkout_req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.get("is_purchasable", True):
        raise HTTPException(status_code=400, detail="This product is not available for purchase")
    
    base_price = product.get("price")
    if not base_price:
        raise HTTPException(status_code=400, detail="Product has no price set")
    
    # Convert price to requested currency
    currency = checkout_req.currency.upper()
    if currency not in CURRENCY_RATES:
        currency = "EUR"
    
    converted_price = float(base_price) * CURRENCY_RATES[currency]
    converted_price = round(converted_price, 2)
    
    # Build URLs
    success_url = f"{checkout_req.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_req.origin_url}/products"
    
    # Initialize Stripe with key from settings or env
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    metadata = {
        "product_id": checkout_req.product_id,
        "product_title": product["title"],
        "customer_email": checkout_req.customer_email or "",
        "customer_name": checkout_req.customer_name or "",
        "pricing_type": product.get("pricing_type", "one_time")
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=converted_price,
        currency=currency.lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        product_id=checkout_req.product_id,
        product_title=product["title"],
        amount=converted_price,
        currency=currency,
        customer_email=checkout_req.customer_email,
        customer_name=checkout_req.customer_name,
        metadata=metadata
    )
    
    txn_doc = transaction.model_dump()
    txn_doc["created_at"] = txn_doc["created_at"].isoformat()
    await db.payment_transactions.insert_one(txn_doc)
    
    return {
        "checkout_url": session.url,
        "session_id": session.session_id
    }

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    """Get the status of a checkout session"""
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in database
    new_status = "paid" if status.payment_status == "paid" else status.status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "payment_status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100,  # Convert from cents
        "currency": status.currency.upper(),
        "metadata": status.metadata
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_api_key = await get_stripe_api_key()
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Send purchase confirmation email on successful payment
            if webhook_response.payment_status == "paid":
                transaction = await db.payment_transactions.find_one(
                    {"session_id": webhook_response.session_id},
                    {"_id": 0}
                )
                if transaction:
                    await send_purchase_email(
                        to_email=transaction.get("customer_email", ""),
                        customer_name=transaction.get("customer_name", ""),
                        product_name=transaction.get("product_name", "Product"),
                        amount=str(transaction.get("amount", "0")),
                        currency=transaction.get("currency_symbol", "€")
                    )
        
        return {"status": "success", "event_type": webhook_response.event_type}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@api_router.get("/payments/transactions")
async def get_payment_transactions(user: dict = Depends(get_current_user)):
    """Get all payment transactions (admin only)"""
    transactions = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return transactions

# ==================== ADMIN ACCESS CONTROL ====================

@api_router.post("/auth/check-admin")
async def check_admin_access_route(request: Request):
    """Check if current user has admin access (Google login required)"""
    user = await get_current_user(request)
    email = user.get("email")
    
    if not email:
        raise HTTPException(status_code=401, detail="Email not found")
    
    has_access = await check_admin_access(email)
    if not has_access:
        raise HTTPException(status_code=403, detail="Admin access denied. Contact administrator.")
    
    role = await get_admin_role(email)
    return {"has_access": True, "role": role, "email": email}

@api_router.get("/admin/users")
async def get_admin_users(user: dict = Depends(get_current_user)):
    """Get all admin users (super_admin only)"""
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    admins = await db.admin_users.find({}, {"_id": 0}).to_list(100)
    # Add super admin to list
    admins.insert(0, {
        "admin_id": "super_admin",
        "email": SUPER_ADMIN_EMAIL,
        "name": "Super Admin",
        "role": "super_admin",
        "is_active": True
    })
    return admins

@api_router.post("/admin/users")
async def add_admin_user(request: Request, user: dict = Depends(get_current_user)):
    """Add a new admin user (super_admin only)"""
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    data = await request.json()
    new_email = data.get("email")
    new_name = data.get("name", "")
    
    if not new_email:
        raise HTTPException(status_code=400, detail="Email required")
    
    existing = await db.admin_users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = AdminUser(email=new_email, name=new_name)
    admin_doc = admin.model_dump()
    admin_doc["created_at"] = admin_doc["created_at"].isoformat()
    await db.admin_users.insert_one(admin_doc)
    
    return {"message": "Admin user added", "admin_id": admin.admin_id}

@api_router.delete("/admin/users/{admin_id}")
async def remove_admin_user(admin_id: str, user: dict = Depends(get_current_user)):
    """Remove an admin user (super_admin only)"""
    email = user.get("email")
    role = await get_admin_role(email)
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    if admin_id == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot remove super admin")
    
    result = await db.admin_users.delete_one({"admin_id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin user removed"}

# ==================== AI WEBSITE BUILDER ====================

@api_router.get("/builder/categories")
async def get_builder_categories():
    """Get all website builder categories"""
    categories = await db.builder_categories.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(50)
    if not categories:
        # Return default categories if none exist
        categories = [
            {"category_id": "cat_basic", "name": "Business Website", "slug": "business", "description": "Professional website for your business", "icon": "Briefcase", "template_type": "basic", "is_active": True, "order": 1},
            {"category_id": "cat_portfolio", "name": "Portfolio", "slug": "portfolio", "description": "Showcase your work with style", "icon": "Image", "template_type": "portfolio", "is_active": True, "order": 2},
            {"category_id": "cat_ecommerce", "name": "E-commerce Store", "slug": "ecommerce", "description": "Sell products online", "icon": "ShoppingCart", "template_type": "ecommerce", "is_active": True, "order": 3},
            {"category_id": "cat_restaurant", "name": "Restaurant", "slug": "restaurant", "description": "Menu and reservations", "icon": "Utensils", "template_type": "basic", "is_active": True, "order": 4},
            {"category_id": "cat_agency", "name": "Agency", "slug": "agency", "description": "Creative agency website", "icon": "Rocket", "template_type": "basic", "is_active": True, "order": 5},
        ]
    return categories

@api_router.get("/builder/pricing")
async def get_builder_pricing():
    """Get builder pricing tiers"""
    pricing = await db.builder_pricing.find({"is_active": True}, {"_id": 0}).to_list(10)
    if not pricing:
        # Return default pricing if none exist
        pricing = [
            {"tier": "basic", "name": "Basic", "price": 99, "currency": "EUR", "features": ["5 Pages", "Mobile Responsive", "Contact Form", "SEO Optimized", "Code Download"], "pages_limit": 5, "includes_hosting": False, "includes_domain": False, "is_active": True},
            {"tier": "standard", "name": "Standard", "price": 199, "currency": "EUR", "features": ["5 Pages", "Mobile Responsive", "Contact Form", "SEO Optimized", "1 Year Hosting", "SSL Certificate"], "pages_limit": 5, "includes_hosting": True, "includes_domain": False, "is_active": True},
            {"tier": "pro", "name": "Pro", "price": 349, "currency": "EUR", "features": ["10 Pages", "Mobile Responsive", "Contact Form", "E-commerce Ready", "1 Year Hosting", "Free Domain", "SSL Certificate", "Priority Support"], "pages_limit": 10, "includes_hosting": True, "includes_domain": True, "is_active": True},
        ]
    return pricing

@api_router.post("/builder/pricing")
async def update_builder_pricing(request: Request, user: dict = Depends(get_current_user)):
    """Update builder pricing (admin only)"""
    data = await request.json()
    for tier_data in data:
        await db.builder_pricing.update_one(
            {"tier": tier_data["tier"]},
            {"$set": tier_data},
            upsert=True
        )
    return {"message": "Pricing updated"}

@api_router.post("/builder/generate")
async def generate_website(request: Request):
    """Generate website content using AI"""
    data = await request.json()
    
    category = data.get("category", "business")
    business_name = data.get("business_name", "My Business")
    business_description = data.get("business_description", "")
    pages = data.get("pages", ["home", "about", "services", "products", "contact"])
    template_type = data.get("template_type", "basic")
    portfolio_images = data.get("portfolio_images", [])
    portfolio_videos = data.get("portfolio_videos", [])
    products = data.get("products", [])
    
    # Create AI prompt for website generation
    prompt = f"""Generate a complete website for a {category} business.

Business Name: {business_name}
Description: {business_description}
Pages to generate: {', '.join(pages)}
Template Type: {template_type}

{"Portfolio Images: " + str(len(portfolio_images)) + " images provided" if portfolio_images else ""}
{"Portfolio Videos: " + str(len(portfolio_videos)) + " videos provided" if portfolio_videos else ""}
{"Products: " + str(len(products)) + " products to display" if products else ""}

Generate JSON content for each page with the following structure:
{{
    "pages": {{
        "home": {{
            "hero_title": "...",
            "hero_subtitle": "...",
            "hero_cta": "...",
            "sections": [...]
        }},
        "about": {{
            "title": "...",
            "content": "...",
            "team": [...]
        }},
        ...
    }},
    "meta": {{
        "title": "...",
        "description": "...",
        "keywords": [...]
    }},
    "colors": {{
        "primary": "#...",
        "secondary": "#...",
        "accent": "#..."
    }}
}}

Make the content professional, engaging, and SEO-friendly. Return only valid JSON."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            model="gemini-2.0-flash",
            system_message="You are a professional web designer and content creator. Generate website content in JSON format only."
        )
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON from response
        response_text = response.text
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            generated_content = json.loads(json_match.group())
        else:
            generated_content = {"error": "Failed to parse AI response", "raw": response_text[:500]}
        
        return {
            "success": True,
            "content": generated_content,
            "category": category,
            "business_name": business_name
        }
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return {
            "success": False,
            "error": str(e),
            "content": None
        }

@api_router.post("/builder/create-order")
async def create_builder_order(request: Request):
    """Create a website builder order"""
    data = await request.json()
    
    order = WebsiteOrder(
        customer_email=data.get("customer_email"),
        customer_name=data.get("customer_name"),
        category=data.get("category"),
        tier=data.get("tier", "basic"),
        business_name=data.get("business_name"),
        business_description=data.get("business_description"),
        pages=data.get("pages", []),
        portfolio_images=data.get("portfolio_images", []),
        portfolio_videos=data.get("portfolio_videos", []),
        products=data.get("products", []),
        generated_content=data.get("generated_content"),
        hosting_option=data.get("hosting_option", "download"),
        amount=data.get("amount", 0),
        currency=data.get("currency", "EUR")
    )
    
    order_doc = order.model_dump()
    order_doc["created_at"] = order_doc["created_at"].isoformat()
    await db.website_orders.insert_one(order_doc)
    
    return {"order_id": order.order_id, "message": "Order created"}

@api_router.post("/builder/checkout")
async def create_builder_checkout(request: Request):
    """Create Stripe checkout for website builder order"""
    data = await request.json()
    order_id = data.get("order_id")
    origin_url = data.get("origin_url")
    
    order = await db.website_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    success_url = f"{origin_url}/builder/success?order_id={order_id}"
    cancel_url = f"{origin_url}/builder"
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=order["amount"],
        currency=order["currency"].lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "type": "website_builder",
            "tier": order["tier"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.website_orders.update_one(
        {"order_id": order_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/builder/orders")
async def get_builder_orders(user: dict = Depends(get_current_user)):
    """Get all website builder orders (admin only)"""
    orders = await db.website_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/builder/order/{order_id}")
async def get_builder_order(order_id: str):
    """Get a specific builder order"""
    order = await db.website_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/builder/order/{order_id}")
async def update_builder_order(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Update a builder order (admin only)"""
    data = await request.json()
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.website_orders.update_one({"order_id": order_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order updated"}

# ==================== RESELLERCLUB API ====================

@api_router.get("/domains/check")
async def check_domain_availability(domain: str):
    """Check domain availability via ResellerClub API"""
    api_key, reseller_id = await get_resellerclub_credentials()
    
    if not api_key or not reseller_id:
        raise HTTPException(status_code=500, detail="ResellerClub credentials not configured")
    
    # Extract domain name and TLD
    parts = domain.lower().strip().split(".")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid domain format")
    
    domain_name = parts[0]
    tlds = [".".join(parts[1:])]  # Get TLD(s)
    
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "auth-userid": reseller_id,
                "api-key": api_key,
                "domain-name": domain_name,
                "tlds": tlds
            }
            response = await client.get(
                f"{RESELLERCLUB_API_URL}/domains/available.json",
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "domain": domain,
                    "available": data.get(domain, {}).get("status") == "available",
                    "data": data
                }
            else:
                return {"domain": domain, "available": False, "error": response.text}
    except Exception as e:
        logger.error(f"Domain check error: {e}")
        return {"domain": domain, "available": False, "error": str(e)}

@api_router.get("/domains/suggest")
async def suggest_domains(keyword: str):
    """Get domain suggestions via ResellerClub API"""
    api_key, reseller_id = await get_resellerclub_credentials()
    
    tlds = ["com", "net", "org", "io", "co", "eu"]
    suggestions = []
    
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "auth-userid": reseller_id,
                "api-key": api_key,
                "domain-name": keyword,
                "tlds": tlds
            }
            response = await client.get(
                f"{RESELLERCLUB_API_URL}/domains/available.json",
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                for tld in tlds:
                    domain = f"{keyword}.{tld}"
                    if domain in data:
                        suggestions.append({
                            "domain": domain,
                            "available": data[domain].get("status") == "available"
                        })
        return {"keyword": keyword, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"Domain suggest error: {e}")
        return {"keyword": keyword, "suggestions": [], "error": str(e)}

@api_router.get("/domains/pricing")
async def get_domain_pricing():
    """Get domain pricing from ResellerClub"""
    api_key, reseller_id = await get_resellerclub_credentials()
    
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "auth-userid": reseller_id,
                "api-key": api_key,
            }
            response = await client.get(
                f"{RESELLERCLUB_API_URL}/products/reseller-cost-price.json",
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": response.text}
    except Exception as e:
        logger.error(f"Pricing error: {e}")
        return {"error": str(e)}

@api_router.get("/resellerclub/products")
async def get_resellerclub_products():
    """Get all products from ResellerClub"""
    api_key, reseller_id = await get_resellerclub_credentials()
    
    try:
        async with httpx.AsyncClient() as client:
            # Get domain pricing
            params = {
                "auth-userid": reseller_id,
                "api-key": api_key,
            }
            
            products = []
            
            # Common TLDs pricing
            tld_prices = {
                "com": {"register": 12.99, "renew": 14.99},
                "net": {"register": 13.99, "renew": 15.99},
                "org": {"register": 12.99, "renew": 14.99},
                "io": {"register": 49.99, "renew": 59.99},
                "eu": {"register": 9.99, "renew": 11.99},
                "co": {"register": 29.99, "renew": 34.99},
            }
            
            for tld, prices in tld_prices.items():
                products.append({
                    "product_id": f"domain_{tld}",
                    "type": "domain",
                    "name": f".{tld} Domain",
                    "description": f"Register a .{tld} domain",
                    "price": prices["register"],
                    "renew_price": prices["renew"],
                    "currency": "EUR",
                    "billing_cycle": "yearly"
                })
            
            # Hosting products
            hosting_products = [
                {"product_id": "hosting_starter", "type": "hosting", "name": "Starter Hosting", "description": "Perfect for small websites", "price": 4.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["10GB SSD", "1 Website", "Free SSL", "24/7 Support"]},
                {"product_id": "hosting_business", "type": "hosting", "name": "Business Hosting", "description": "For growing businesses", "price": 9.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["50GB SSD", "5 Websites", "Free SSL", "Free Domain", "24/7 Support"]},
                {"product_id": "hosting_enterprise", "type": "hosting", "name": "Enterprise Hosting", "description": "Maximum performance", "price": 19.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["100GB SSD", "Unlimited Websites", "Free SSL", "Free Domain", "Priority Support"]},
            ]
            products.extend(hosting_products)
            
            # SSL products
            ssl_products = [
                {"product_id": "ssl_basic", "type": "ssl", "name": "Basic SSL", "description": "Domain Validation SSL", "price": 9.99, "currency": "EUR", "billing_cycle": "yearly"},
                {"product_id": "ssl_business", "type": "ssl", "name": "Business SSL", "description": "Organization Validation SSL", "price": 49.99, "currency": "EUR", "billing_cycle": "yearly"},
                {"product_id": "ssl_premium", "type": "ssl", "name": "Premium SSL", "description": "Extended Validation SSL", "price": 149.99, "currency": "EUR", "billing_cycle": "yearly"},
            ]
            products.extend(ssl_products)
            
            return {"products": products}
    except Exception as e:
        logger.error(f"Products error: {e}")
        return {"products": [], "error": str(e)}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "DioCreations API", "version": "1.0.0"}

# ==================== SITEMAP FOR SEO ====================

@api_router.get("/sitemap.xml")
async def get_sitemap():
    """Generate dynamic sitemap for SEO"""
    from fastapi.responses import Response
    
    base_url = "https://www.diocreations.eu"
    
    # Static pages
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
        {"loc": "/about", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/services", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/products", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/portfolio", "priority": "0.8", "changefreq": "weekly"},
        {"loc": "/blog", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/contact", "priority": "0.8", "changefreq": "monthly"},
    ]
    
    # Dynamic service pages
    services = await db.services.find({"is_active": True}, {"slug": 1}).to_list(100)
    
    # Dynamic blog pages
    blog_posts = await db.blog.find({"is_published": True}, {"slug": 1, "updated_at": 1}).to_list(500)
    
    # Dynamic portfolio pages
    portfolio = await db.portfolio.find({"is_active": True}, {"slug": 1}).to_list(100)
    
    # Build XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Add static pages
    for page in static_pages:
        xml += f'  <url>\n'
        xml += f'    <loc>{base_url}{page["loc"]}</loc>\n'
        xml += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{page["priority"]}</priority>\n'
        xml += f'  </url>\n'
    
    # Add services
    for service in services:
        xml += f'  <url>\n'
        xml += f'    <loc>{base_url}/services/{service["slug"]}</loc>\n'
        xml += f'    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>0.7</priority>\n'
        xml += f'  </url>\n'
    
    # Add blog posts
    for post in blog_posts:
        xml += f'  <url>\n'
        xml += f'    <loc>{base_url}/blog/{post["slug"]}</loc>\n'
        xml += f'    <changefreq>weekly</changefreq>\n'
        xml += f'    <priority>0.6</priority>\n'
        xml += f'  </url>\n'
    
    # Add portfolio
    for item in portfolio:
        xml += f'  <url>\n'
        xml += f'    <loc>{base_url}/portfolio/{item["slug"]}</loc>\n'
        xml += f'    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>0.6</priority>\n'
        xml += f'  </url>\n'
    
    xml += '</urlset>'
    
    return Response(content=xml, media_type="application/xml")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                "role": "admin"
            })
            logger.info("Default admin user created: admin@diocreations.com")
        else:
            logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
