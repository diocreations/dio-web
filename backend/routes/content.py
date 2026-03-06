"""Content management routes: services, products, portfolio, blog, testimonials, pages"""
from fastapi import APIRouter, HTTPException, Depends
from database import db, logger
from helpers import get_current_user
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api")


# ==================== PAGES ====================

@router.get("/pages")
async def get_pages():
    return await db.pages.find({}, {"_id": 0}).to_list(100)


@router.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/pages/{slug}")
async def update_page(slug: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.pages.update_one({"slug": slug}, {"$set": update})
    if result.matched_count == 0:
        page_doc = {"slug": slug, "title": update.get("title", slug.title()), "page_id": f"page_{uuid.uuid4().hex[:12]}", **update}
        await db.pages.insert_one(page_doc)
    return await db.pages.find_one({"slug": slug}, {"_id": 0})


# ==================== SERVICES ====================

@router.get("/services")
async def get_services(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    return await db.services.find(query, {"_id": 0}).sort("order", 1).to_list(100)


@router.get("/services/{slug}")
async def get_service(slug: str):
    service = await db.services.find_one({"slug": slug}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("/services")
async def create_service(service: dict, user: dict = Depends(get_current_user)):
    service["service_id"] = f"svc_{uuid.uuid4().hex[:12]}"
    service["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.services.insert_one(service)
    service.pop("_id", None)
    return service


@router.put("/services/reorder")
async def reorder_services(data: dict, user: dict = Depends(get_current_user)):
    for idx, service_id in enumerate(data.get("order", [])):
        await db.services.update_one({"service_id": service_id}, {"$set": {"order": idx}})
    return {"message": "Services reordered"}


@router.put("/services/{service_id}")
async def update_service(service_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("service_id", None)
    result = await db.services.update_one({"service_id": service_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return await db.services.find_one({"service_id": service_id}, {"_id": 0})


@router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"service_id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_products(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    return await db.products.find(query, {"_id": 0}).sort("order", 1).to_list(100)


@router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products")
async def create_product(product: dict, user: dict = Depends(get_current_user)):
    product["product_id"] = f"prod_{uuid.uuid4().hex[:12]}"
    product["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product


@router.put("/products/bulk-currency")
async def bulk_update_currency(data: dict, user: dict = Depends(get_current_user)):
    currency = data.get("currency", "EUR")
    valid = ["EUR", "USD", "GBP", "INR", "AED", "AUD", "CAD", "SGD", "CHF"]
    if currency not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid currency. Use one of: {', '.join(valid)}")
    result = await db.products.update_many({}, {"$set": {"currency": currency}})
    return {"message": f"All products updated to {currency}", "updated_count": result.modified_count}


@router.put("/products/{product_id}")
async def update_product(product_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("product_id", None)
    result = await db.products.update_one({"product_id": product_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"product_id": product_id}, {"_id": 0})


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


# ==================== PORTFOLIO ====================

@router.get("/portfolio")
async def get_portfolio(active_only: bool = False, category: str = None):
    query = {}
    if active_only:
        query["is_active"] = True
    if category:
        query["category"] = category
    return await db.portfolio.find(query, {"_id": 0}).sort("order", 1).to_list(100)


@router.get("/portfolio/{slug}")
async def get_portfolio_item(slug: str):
    item = await db.portfolio.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return item


@router.post("/portfolio")
async def create_portfolio_item(item: dict, user: dict = Depends(get_current_user)):
    item["portfolio_id"] = f"port_{uuid.uuid4().hex[:12]}"
    item["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.portfolio.insert_one(item)
    item.pop("_id", None)
    return item


@router.put("/portfolio/reorder")
async def reorder_portfolio(data: dict, user: dict = Depends(get_current_user)):
    for idx, item_id in enumerate(data.get("order", [])):
        await db.portfolio.update_one({"portfolio_id": item_id}, {"$set": {"order": idx}})
    return {"message": "Portfolio reordered"}


@router.put("/portfolio/{portfolio_id}")
async def update_portfolio_item(portfolio_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("portfolio_id", None)
    result = await db.portfolio.update_one({"portfolio_id": portfolio_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return await db.portfolio.find_one({"portfolio_id": portfolio_id}, {"_id": 0})


@router.delete("/portfolio/{portfolio_id}")
async def delete_portfolio_item(portfolio_id: str, user: dict = Depends(get_current_user)):
    result = await db.portfolio.delete_one({"portfolio_id": portfolio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return {"message": "Portfolio item deleted"}


@router.post("/portfolio/screenshot")
async def capture_portfolio_screenshot(data: dict, user: dict = Depends(get_current_user)):
    """Capture a screenshot from a URL using a free screenshot service"""
    url = data.get("url", "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Ensure URL has protocol
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    # Use microlink.io free screenshot API (no key required)
    import urllib.parse
    encoded_url = urllib.parse.quote(url, safe="")
    screenshot_url = f"https://api.microlink.io/?url={encoded_url}&screenshot=true&meta=false&embed=screenshot.url"
    
    try:
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(screenshot_url)
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success" and result.get("data", {}).get("screenshot", {}).get("url"):
                    return {"screenshot_url": result["data"]["screenshot"]["url"], "success": True}
            
            # Fallback: Use alternative free service
            fallback_url = f"https://image.thum.io/get/width/1200/crop/800/{url}"
            return {"screenshot_url": fallback_url, "success": True, "provider": "thum.io"}
    except Exception as e:
        logger.error(f"Screenshot capture failed: {e}")
        # Return fallback service URL
        fallback_url = f"https://image.thum.io/get/width/1200/crop/800/{url}"
        return {"screenshot_url": fallback_url, "success": True, "provider": "thum.io"}


# ==================== BLOG ====================

@router.get("/blog")
async def get_blog_posts(published_only: bool = False, category: str = None):
    query = {}
    if published_only:
        query["is_published"] = True
    if category:
        query["category"] = category
    return await db.blog.find(query, {"_id": 0}).sort("order", 1).to_list(100)


@router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post


@router.post("/blog")
async def create_blog_post(post: dict, user: dict = Depends(get_current_user)):
    post["post_id"] = f"blog_{uuid.uuid4().hex[:12]}"
    post["created_at"] = datetime.now(timezone.utc).isoformat()
    if post.get("is_published"):
        post["published_at"] = datetime.now(timezone.utc).isoformat()
    await db.blog.insert_one(post)
    post.pop("_id", None)
    return post


@router.put("/blog/reorder")
async def reorder_blog(data: dict, user: dict = Depends(get_current_user)):
    for idx, post_id in enumerate(data.get("order", [])):
        await db.blog.update_one({"post_id": post_id}, {"$set": {"order": idx}})
    return {"message": "Blog posts reordered"}


@router.put("/blog/{post_id}")
async def update_blog_post(post_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("post_id", None)
    if update.get("is_published"):
        existing = await db.blog.find_one({"post_id": post_id, "published_at": {"$exists": True}})
        if not existing:
            update["published_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.blog.update_one({"post_id": post_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return await db.blog.find_one({"post_id": post_id}, {"_id": 0})


@router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.blog.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}


# ==================== TESTIMONIALS ====================

@router.get("/testimonials")
async def get_testimonials(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    return await db.testimonials.find(query, {"_id": 0}).sort("order", 1).to_list(100)


@router.post("/testimonials")
async def create_testimonial(testimonial: dict, user: dict = Depends(get_current_user)):
    testimonial["testimonial_id"] = f"test_{uuid.uuid4().hex[:12]}"
    testimonial["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.testimonials.insert_one(testimonial)
    testimonial.pop("_id", None)
    return testimonial


@router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, update: dict, user: dict = Depends(get_current_user)):
    update.pop("_id", None)
    update.pop("testimonial_id", None)
    result = await db.testimonials.update_one({"testimonial_id": testimonial_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return await db.testimonials.find_one({"testimonial_id": testimonial_id}, {"_id": 0})


@router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, user: dict = Depends(get_current_user)):
    result = await db.testimonials.delete_one({"testimonial_id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}


# ==================== CONTACT ====================

@router.post("/contact")
async def submit_contact(data: dict):
    import resend
    import asyncio
    import os
    from email_templates import get_email_wrapper, get_email_header
    
    submission_id = f"contact_{uuid.uuid4().hex[:12]}"
    doc = {
        "submission_id": submission_id,
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone"),
        "company": data.get("company"),
        "service_interest": data.get("service_interest"),
        "budget_range": data.get("budget_range"),
        "subject": data.get("subject", ""),
        "message": data.get("message", ""),
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contact_submissions.insert_one(doc)
    resend_key = os.environ.get("RESEND_API_KEY", "")
    admin_email = os.environ.get("ADMIN_EMAIL", "")
    sender_email = os.environ.get("SENDER_EMAIL", "Diocreations <noreply@diocreations.eu>")
    if resend_key and admin_email:
        try:
            resend.api_key = resend_key
            header = get_email_header()
            body_content = f'''
            {header}
            <div style="padding:24px;">
              <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:18px;">New Contact Form Submission</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;width:120px;">Name</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #f3f4f6;">{doc['name']}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><a href="mailto:{doc['email']}" style="color:#7c3aed;">{doc['email']}</a></td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">{doc.get('phone') or 'N/A'}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">{doc.get('company') or 'N/A'}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Service Interest</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">{doc.get('service_interest') or 'N/A'}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Budget Range</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">{doc.get('budget_range') or 'N/A'}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Subject</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #f3f4f6;">{doc['subject']}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;">
                <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Message</p>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">{doc['message']}</p>
              </div>
            </div>
            '''
            html_content = get_email_wrapper(body_content, "Diocreations Contact Form | www.diocreations.eu")
            await asyncio.to_thread(resend.Emails.send, {"from": sender_email, "to": [admin_email], "subject": f"New Contact: {doc['subject']}", "html": html_content})
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    return {"message": "Contact form submitted successfully", "submission_id": submission_id}


@router.get("/contact")
async def get_contact_submissions(user: dict = Depends(get_current_user)):
    return await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.put("/contact/{submission_id}/read")
async def mark_submission_read(submission_id: str, user: dict = Depends(get_current_user)):
    result = await db.contact_submissions.update_one({"submission_id": submission_id}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Marked as read"}


@router.delete("/contact/{submission_id}")
async def delete_submission(submission_id: str, user: dict = Depends(get_current_user)):
    result = await db.contact_submissions.delete_one({"submission_id": submission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission deleted"}
