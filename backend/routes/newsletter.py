"""Newsletter routes - subscribers, newsletter management, scheduling"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from database import db, logger
from helpers import get_current_user
from datetime import datetime, timezone
from typing import Optional
import uuid
import httpx
from bs4 import BeautifulSoup
import os
import re

router = APIRouter(prefix="/api")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "DioCreations <newsletter@diocreations.eu>")
SITE_URL = os.environ.get("SITE_URL", "https://www.diocreations.eu")


# ============ SUBSCRIBER ENDPOINTS ============

@router.post("/newsletter/subscribe")
async def subscribe_to_newsletter(data: dict):
    """Public endpoint for users to subscribe"""
    email = data.get("email", "").strip().lower()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    
    # Check if already subscribed
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        if existing.get("status") == "unsubscribed":
            # Re-subscribe
            await db.newsletter_subscribers.update_one(
                {"email": email},
                {"$set": {"status": "active", "resubscribed_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"message": "Welcome back! You've been re-subscribed."}
        return {"message": "You're already subscribed!"}
    
    # New subscriber
    doc = {
        "subscriber_id": f"sub_{uuid.uuid4().hex[:12]}",
        "email": email,
        "status": "active",
        "source": data.get("source", "website"),
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.newsletter_subscribers.insert_one(doc)
    return {"message": "Successfully subscribed! You'll receive our latest updates."}


@router.get("/newsletter/unsubscribe/{subscriber_id}")
async def unsubscribe(subscriber_id: str):
    """Unsubscribe link handler"""
    result = await db.newsletter_subscribers.update_one(
        {"subscriber_id": subscriber_id},
        {"$set": {"status": "unsubscribed", "unsubscribed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"message": "You have been unsubscribed. Sorry to see you go!"}


# ============ ADMIN SUBSCRIBER MANAGEMENT ============

@router.get("/admin/newsletter/subscribers")
async def list_subscribers(user: dict = Depends(get_current_user)):
    """List all newsletter subscribers"""
    subscribers = await db.newsletter_subscribers.find({}, {"_id": 0}).sort("subscribed_at", -1).to_list(500)
    stats = {
        "total": len(subscribers),
        "active": len([s for s in subscribers if s.get("status") == "active"]),
        "unsubscribed": len([s for s in subscribers if s.get("status") == "unsubscribed"]),
    }
    return {"subscribers": subscribers, "stats": stats}


@router.delete("/admin/newsletter/subscribers/{subscriber_id}")
async def delete_subscriber(subscriber_id: str, user: dict = Depends(get_current_user)):
    """Delete a single subscriber"""
    result = await db.newsletter_subscribers.delete_one({"subscriber_id": subscriber_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"message": "Subscriber deleted"}


@router.delete("/admin/newsletter/subscribers/delete-all")
async def delete_all_subscribers(user: dict = Depends(get_current_user)):
    """Delete ALL subscribers"""
    count = await db.newsletter_subscribers.count_documents({})
    await db.newsletter_subscribers.delete_many({})
    return {"message": "All subscribers deleted", "deleted_count": count}


# ============ NEWSLETTER CREATION & MANAGEMENT ============

@router.post("/admin/newsletter/fetch-blog")
async def fetch_blog_content(data: dict, user: dict = Depends(get_current_user)):
    """Fetch blog content from URL to auto-populate newsletter"""
    url = data.get("url", "").strip()
    
    if not url:
        raise HTTPException(status_code=400, detail="URL required")
    
    try:
        # First try to get from our database if it's our blog
        slug = url.rstrip("/").split("/")[-1]
        blog_post = await db.blogs.find_one({"slug": slug, "status": "published"}, {"_id": 0})
        
        if blog_post:
            return {
                "title": blog_post.get("title", ""),
                "excerpt": blog_post.get("excerpt", blog_post.get("content", "")[:300]),
                "content": blog_post.get("content", ""),
                "image": blog_post.get("featured_image", ""),
                "author": blog_post.get("author", "DioCreations"),
                "url": url,
                "source": "database"
            }
        
        # Otherwise fetch from URL
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract metadata
        title = ""
        if soup.find("meta", property="og:title"):
            title = soup.find("meta", property="og:title")["content"]
        elif soup.find("title"):
            title = soup.find("title").text
        
        excerpt = ""
        if soup.find("meta", property="og:description"):
            excerpt = soup.find("meta", property="og:description")["content"]
        elif soup.find("meta", attrs={"name": "description"}):
            excerpt = soup.find("meta", attrs={"name": "description"})["content"]
        
        image = ""
        if soup.find("meta", property="og:image"):
            image = soup.find("meta", property="og:image")["content"]
        
        # Try to get main content
        content = excerpt
        article = soup.find("article") or soup.find("main") or soup.find(class_=re.compile("content|post|article"))
        if article:
            paragraphs = article.find_all("p")[:5]
            content = " ".join([p.get_text(strip=True) for p in paragraphs])[:1000]
        
        return {
            "title": title.strip(),
            "excerpt": excerpt.strip()[:500],
            "content": content.strip(),
            "image": image,
            "author": "DioCreations",
            "url": url,
            "source": "scraped"
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch blog content: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch content: {str(e)}")


@router.post("/admin/newsletter/create")
async def create_newsletter(data: dict, user: dict = Depends(get_current_user)):
    """Create a new newsletter (draft or scheduled)"""
    newsletter_id = f"nl_{uuid.uuid4().hex[:12]}"
    
    doc = {
        "newsletter_id": newsletter_id,
        "subject": data.get("subject", "Newsletter from DioCreations"),
        "preview_text": data.get("preview_text", ""),
        "blog_url": data.get("blog_url", ""),
        "blog_title": data.get("blog_title", ""),
        "blog_excerpt": data.get("blog_excerpt", ""),
        "blog_image": data.get("blog_image", ""),
        "custom_message": data.get("custom_message", ""),
        "status": data.get("status", "draft"),  # draft, scheduled, sent
        "scheduled_for": data.get("scheduled_for"),  # ISO datetime string
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.get("email", "admin"),
        "sent_at": None,
        "sent_count": 0,
    }
    
    await db.newsletters.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/admin/newsletter/list")
async def list_newsletters(user: dict = Depends(get_current_user)):
    """List all newsletters"""
    newsletters = await db.newsletters.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return newsletters


@router.get("/admin/newsletter/{newsletter_id}")
async def get_newsletter(newsletter_id: str, user: dict = Depends(get_current_user)):
    """Get a single newsletter"""
    doc = await db.newsletters.find_one({"newsletter_id": newsletter_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    return doc


@router.put("/admin/newsletter/{newsletter_id}")
async def update_newsletter(newsletter_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Update a newsletter"""
    data.pop("_id", None)
    data.pop("newsletter_id", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.newsletters.update_one(
        {"newsletter_id": newsletter_id},
        {"$set": data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    return await db.newsletters.find_one({"newsletter_id": newsletter_id}, {"_id": 0})


@router.delete("/admin/newsletter/{newsletter_id}")
async def delete_newsletter(newsletter_id: str, user: dict = Depends(get_current_user)):
    """Delete a newsletter"""
    result = await db.newsletters.delete_one({"newsletter_id": newsletter_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    return {"message": "Newsletter deleted"}


# ============ NEWSLETTER SENDING ============

def generate_newsletter_html(newsletter: dict, subscriber_id: str = "") -> str:
    """Generate branded HTML email template"""
    unsubscribe_url = f"{SITE_URL}/api/newsletter/unsubscribe/{subscriber_id}" if subscriber_id else "#"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{newsletter.get('subject', 'Newsletter')}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                <span style="color: #1f2937;">DIO</span><span style="color: #ffffff;">CREATIONS</span>
                            </h1>
                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Digital Excellence for Modern Business</p>
                        </td>
                    </tr>
                    
                    <!-- Custom Message -->
                    {f'''<tr>
                        <td style="padding: 30px 30px 0;">
                            <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">{newsletter.get("custom_message", "")}</p>
                        </td>
                    </tr>''' if newsletter.get("custom_message") else ""}
                    
                    <!-- Featured Blog -->
                    {f'''<tr>
                        <td style="padding: 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                                {f'<tr><td><img src="{newsletter.get("blog_image")}" alt="" style="width: 100%; height: 200px; object-fit: cover;"></td></tr>' if newsletter.get("blog_image") else ""}
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 12px; color: #1f2937; font-size: 20px; font-weight: bold;">
                                            {newsletter.get("blog_title", "Featured Article")}
                                        </h2>
                                        <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                            {newsletter.get("blog_excerpt", "")[:300]}...
                                        </p>
                                        <a href="{newsletter.get("blog_url", SITE_URL)}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                            Read More →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>''' if newsletter.get("blog_title") else ""}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                                © {datetime.now().year} DioCreations. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 11px;">
                                <a href="{unsubscribe_url}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
                                &nbsp;|&nbsp;
                                <a href="{SITE_URL}" style="color: #9ca3af; text-decoration: underline;">Visit Website</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html


async def send_newsletter_email(newsletter: dict, subscriber: dict) -> bool:
    """Send newsletter to a single subscriber via Resend"""
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not configured")
        return False
    
    try:
        html_content = generate_newsletter_html(newsletter, subscriber.get("subscriber_id", ""))
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [subscriber["email"]],
                    "subject": newsletter.get("subject", "Newsletter from DioCreations"),
                    "html": html_content,
                }
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Failed to send newsletter to {subscriber.get('email')}: {e}")
        return False


async def send_newsletter_batch(newsletter_id: str):
    """Background task to send newsletter to all active subscribers"""
    newsletter = await db.newsletters.find_one({"newsletter_id": newsletter_id})
    if not newsletter:
        logger.error(f"Newsletter {newsletter_id} not found")
        return
    
    subscribers = await db.newsletter_subscribers.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    sent_count = 0
    for subscriber in subscribers:
        success = await send_newsletter_email(newsletter, subscriber)
        if success:
            sent_count += 1
    
    # Update newsletter status
    await db.newsletters.update_one(
        {"newsletter_id": newsletter_id},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "sent_count": sent_count
        }}
    )
    logger.info(f"Newsletter {newsletter_id} sent to {sent_count} subscribers")


@router.post("/admin/newsletter/{newsletter_id}/send")
async def send_newsletter_now(newsletter_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Send newsletter immediately"""
    newsletter = await db.newsletters.find_one({"newsletter_id": newsletter_id}, {"_id": 0})
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    if newsletter.get("status") == "sent":
        raise HTTPException(status_code=400, detail="Newsletter already sent")
    
    # Get subscriber count
    sub_count = await db.newsletter_subscribers.count_documents({"status": "active"})
    if sub_count == 0:
        raise HTTPException(status_code=400, detail="No active subscribers to send to")
    
    # Update status to sending
    await db.newsletters.update_one(
        {"newsletter_id": newsletter_id},
        {"$set": {"status": "sending"}}
    )
    
    # Send in background
    background_tasks.add_task(send_newsletter_batch, newsletter_id)
    
    return {"message": f"Newsletter is being sent to {sub_count} subscribers"}


@router.post("/admin/newsletter/{newsletter_id}/schedule")
async def schedule_newsletter(newsletter_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Schedule newsletter for later"""
    scheduled_for = data.get("scheduled_for")
    if not scheduled_for:
        raise HTTPException(status_code=400, detail="Scheduled date/time required")
    
    result = await db.newsletters.update_one(
        {"newsletter_id": newsletter_id},
        {"$set": {
            "status": "scheduled",
            "scheduled_for": scheduled_for
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    return {"message": f"Newsletter scheduled for {scheduled_for}"}


@router.get("/admin/newsletter/{newsletter_id}/preview")
async def preview_newsletter(newsletter_id: str, user: dict = Depends(get_current_user)):
    """Get HTML preview of newsletter"""
    newsletter = await db.newsletters.find_one({"newsletter_id": newsletter_id}, {"_id": 0})
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    html = generate_newsletter_html(newsletter, "preview")
    return {"html": html}


# ============ SCHEDULED NEWSLETTER CHECKER ============
# This should be called by a cron job or scheduled task

@router.post("/admin/newsletter/process-scheduled")
async def process_scheduled_newsletters(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Process any newsletters that are due to be sent"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Find scheduled newsletters that are due
    due_newsletters = await db.newsletters.find({
        "status": "scheduled",
        "scheduled_for": {"$lte": now}
    }, {"_id": 0}).to_list(10)
    
    for newsletter in due_newsletters:
        background_tasks.add_task(send_newsletter_batch, newsletter["newsletter_id"])
    
    return {"message": f"Processing {len(due_newsletters)} scheduled newsletters"}
