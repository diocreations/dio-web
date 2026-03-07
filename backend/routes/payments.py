"""Payments, checkout, webhooks, and builder routes"""
from fastapi import APIRouter, HTTPException, Depends, Request
from database import db, EMERGENT_LLM_KEY, CURRENCY_RATES, logger
from helpers import get_current_user, get_stripe_api_key
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage
from datetime import datetime, timezone
import uuid
import json
import re
import os

router = APIRouter(prefix="/api")

RESELLERCLUB_API_KEY = os.environ.get("RESELLERCLUB_API_KEY", "")
RESELLERCLUB_RESELLER_ID = os.environ.get("RESELLERCLUB_RESELLER_ID", "")
RESELLERCLUB_API_URL = "https://httpapi.com/api"


# ==================== CURRENCY RATES ====================

@router.get("/currency-rates")
async def get_currency_rates():
    # Fetch admin-configured currency settings
    settings = await db.currency_settings.find_one({"settings_id": "currency"}, {"_id": 0})
    if settings and settings.get("rates"):
        return {
            "base_currency": "EUR",
            "rates": settings.get("rates", CURRENCY_RATES),
            "supported_currencies": list(settings.get("rates", CURRENCY_RATES).keys())
        }
    return {"base_currency": "EUR", "rates": CURRENCY_RATES, "supported_currencies": list(CURRENCY_RATES.keys())}


# ==================== PRODUCT CHECKOUT ====================

@router.post("/checkout/create")
async def create_checkout_session(request: Request, data: dict):
    product = await db.products.find_one({"product_id": data.get("product_id")}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.get("is_purchasable", True):
        raise HTTPException(status_code=400, detail="Not available for purchase")
    base_price = product.get("price")
    if not base_price:
        raise HTTPException(status_code=400, detail="Product has no price set")
    
    # Get product's native currency (default to EUR if not specified)
    product_currency = product.get("currency", "EUR").upper()
    # Get requested display/checkout currency
    display_currency = data.get("currency", "EUR").upper()
    if display_currency not in CURRENCY_RATES:
        display_currency = "EUR"
    
    # Convert price from product currency to display currency
    price_value = float(base_price)
    if product_currency == display_currency:
        # No conversion needed
        converted_price = round(price_value, 2)
    else:
        # Convert: product_currency -> EUR -> display_currency
        product_to_eur_rate = CURRENCY_RATES.get(product_currency, 1.0)
        price_in_eur = price_value / product_to_eur_rate
        display_rate = CURRENCY_RATES.get(display_currency, 1.0)
        converted_price = round(price_in_eur * display_rate, 2)
    
    origin_url = data.get("origin_url", "")
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/products"
    host_url = str(request.base_url)
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    metadata = {
        "product_id": data.get("product_id"),
        "product_title": product["title"],
        "customer_email": data.get("customer_email", ""),
        "customer_name": data.get("customer_name", ""),
        "pricing_type": product.get("pricing_type", "one_time"),
        "original_price": str(base_price),
        "original_currency": product_currency,
    }
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=converted_price, currency=display_currency.lower(), success_url=success_url, cancel_url=cancel_url, metadata=metadata,
    ))
    txn_doc = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "product_id": data.get("product_id"),
        "product_title": product["title"],
        "amount": converted_price,
        "currency": display_currency,
        "original_amount": base_price,
        "original_currency": product_currency,
        "customer_email": data.get("customer_email"),
        "customer_name": data.get("customer_name"),
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(txn_doc)
    return {"checkout_url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    host_url = str(request.base_url)
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    new_status = "paid" if status.payment_status == "paid" else status.status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100,
        "currency": status.currency.upper(),
        "metadata": status.metadata,
    }


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        host_url = str(request.base_url)
        stripe_api_key = await get_stripe_api_key()
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": webhook_response.payment_status, "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
        return {"status": "success", "event_type": webhook_response.event_type}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/payments/transactions")
async def get_payment_transactions(user: dict = Depends(get_current_user)):
    return await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


# ==================== AI WEBSITE BUILDER ====================

@router.get("/builder/categories")
async def get_builder_categories():
    categories = await db.builder_categories.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(50)
    if not categories:
        categories = [
            {"category_id": "cat_basic", "name": "Business Website", "slug": "business", "description": "Professional website for your business", "icon": "Briefcase", "template_type": "basic", "is_active": True, "order": 1},
            {"category_id": "cat_portfolio", "name": "Portfolio", "slug": "portfolio", "description": "Showcase your work with style", "icon": "Image", "template_type": "portfolio", "is_active": True, "order": 2},
            {"category_id": "cat_ecommerce", "name": "E-commerce Store", "slug": "ecommerce", "description": "Sell products online", "icon": "ShoppingCart", "template_type": "ecommerce", "is_active": True, "order": 3},
            {"category_id": "cat_restaurant", "name": "Restaurant", "slug": "restaurant", "description": "Menu and reservations", "icon": "Utensils", "template_type": "basic", "is_active": True, "order": 4},
            {"category_id": "cat_agency", "name": "Agency", "slug": "agency", "description": "Creative agency website", "icon": "Rocket", "template_type": "basic", "is_active": True, "order": 5},
        ]
    return categories


@router.get("/builder/pricing")
async def get_builder_pricing():
    pricing = await db.builder_pricing.find({"is_active": True}, {"_id": 0}).to_list(10)
    if not pricing:
        pricing = [
            {"tier": "basic", "name": "Basic", "price": 99, "currency": "EUR", "features": ["5 Pages", "Mobile Responsive", "Contact Form", "SEO Optimized", "Code Download"], "pages_limit": 5, "includes_hosting": False, "includes_domain": False, "is_active": True},
            {"tier": "standard", "name": "Standard", "price": 199, "currency": "EUR", "features": ["5 Pages", "Mobile Responsive", "Contact Form", "SEO Optimized", "1 Year Hosting", "SSL Certificate"], "pages_limit": 5, "includes_hosting": True, "includes_domain": False, "is_active": True},
            {"tier": "pro", "name": "Pro", "price": 349, "currency": "EUR", "features": ["10 Pages", "Mobile Responsive", "Contact Form", "E-commerce Ready", "1 Year Hosting", "Free Domain", "SSL Certificate", "Priority Support"], "pages_limit": 10, "includes_hosting": True, "includes_domain": True, "is_active": True},
        ]
    return pricing


@router.post("/builder/pricing")
async def update_builder_pricing(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    for tier_data in data:
        await db.builder_pricing.update_one({"tier": tier_data["tier"]}, {"$set": tier_data}, upsert=True)
    return {"message": "Pricing updated"}


@router.post("/builder/generate")
async def generate_website(request: Request):
    data = await request.json()
    category = data.get("category", "business")
    business_name = data.get("business_name", "My Business")
    business_description = data.get("business_description", "")
    pages = data.get("pages", ["home", "about", "services", "products", "contact"])
    template_type = data.get("template_type", "basic")
    prompt = f"""Generate a complete website for a {category} business.
Business Name: {business_name}
Description: {business_description}
Pages: {', '.join(pages)}
Template: {template_type}
Generate JSON content for each page. Return only valid JSON."""
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, model="gemini-2.0-flash", system_message="You are a professional web designer. Generate website content in JSON format only.")
        response = await chat.send_message(UserMessage(text=prompt))
        json_match = re.search(r'\{[\s\S]*\}', response.text if hasattr(response, 'text') else response)
        generated_content = json.loads(json_match.group()) if json_match else {"error": "Failed to parse"}
        return {"success": True, "content": generated_content, "category": category, "business_name": business_name}
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return {"success": False, "error": str(e), "content": None}


@router.post("/builder/create-order")
async def create_builder_order(request: Request):
    data = await request.json()
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id,
        "customer_email": data.get("customer_email"),
        "customer_name": data.get("customer_name"),
        "category": data.get("category"),
        "tier": data.get("tier", "basic"),
        "business_name": data.get("business_name"),
        "business_description": data.get("business_description"),
        "pages": data.get("pages", []),
        "generated_content": data.get("generated_content"),
        "hosting_option": data.get("hosting_option", "download"),
        "amount": data.get("amount", 0),
        "currency": data.get("currency", "EUR"),
        "payment_status": "pending",
        "order_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.website_orders.insert_one(order_doc)
    return {"order_id": order_id, "message": "Order created"}


@router.post("/builder/checkout")
async def create_builder_checkout(request: Request):
    data = await request.json()
    order_id = data.get("order_id")
    origin_url = data.get("origin_url")
    order = await db.website_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    host_url = str(request.base_url)
    stripe_api_key = await get_stripe_api_key()
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=f"{host_url}api/webhook/stripe")
    session = await stripe_checkout.create_checkout_session(CheckoutSessionRequest(
        amount=order["amount"], currency=order["currency"].lower(),
        success_url=f"{origin_url}/builder/success?order_id={order_id}",
        cancel_url=f"{origin_url}/builder",
        metadata={"order_id": order_id, "type": "website_builder", "tier": order["tier"]},
    ))
    await db.website_orders.update_one({"order_id": order_id}, {"$set": {"stripe_session_id": session.session_id}})
    return {"checkout_url": session.url, "session_id": session.session_id}


@router.get("/builder/orders")
async def get_builder_orders(user: dict = Depends(get_current_user)):
    return await db.website_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@router.get("/builder/order/{order_id}")
async def get_builder_order(order_id: str):
    order = await db.website_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/builder/order/{order_id}")
async def update_builder_order(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.website_orders.update_one({"order_id": order_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order updated"}


# ==================== DOMAINS ====================

async def _get_resellerclub_creds():
    settings = await db.settings.find_one({"settings_id": "site_settings"})
    api_key = RESELLERCLUB_API_KEY
    reseller_id = RESELLERCLUB_RESELLER_ID
    if settings:
        if settings.get("resellerclub_api_key"):
            api_key = settings["resellerclub_api_key"]
        if settings.get("resellerclub_reseller_id"):
            reseller_id = settings["resellerclub_reseller_id"]
    return api_key, reseller_id


@router.get("/domains/check")
async def check_domain_availability(domain: str):
    import httpx
    api_key, reseller_id = await _get_resellerclub_creds()
    if not api_key or not reseller_id:
        raise HTTPException(status_code=500, detail="ResellerClub credentials not configured")
    parts = domain.lower().strip().split(".")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid domain format")
    domain_name = parts[0]
    tlds = [".".join(parts[1:])]
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{RESELLERCLUB_API_URL}/domains/available.json", params={"auth-userid": reseller_id, "api-key": api_key, "domain-name": domain_name, "tlds": tlds}, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return {"domain": domain, "available": data.get(domain, {}).get("status") == "available", "data": data}
            return {"domain": domain, "available": False, "error": resp.text}
    except Exception as e:
        logger.error(f"Domain check error: {e}")
        return {"domain": domain, "available": False, "error": str(e)}


@router.get("/domains/suggest")
async def suggest_domains(keyword: str):
    import httpx
    api_key, reseller_id = await _get_resellerclub_creds()
    tlds = ["com", "net", "org", "io", "co", "eu"]
    suggestions = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{RESELLERCLUB_API_URL}/domains/available.json", params={"auth-userid": reseller_id, "api-key": api_key, "domain-name": keyword, "tlds": tlds}, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                for tld in tlds:
                    d = f"{keyword}.{tld}"
                    if d in data:
                        suggestions.append({"domain": d, "available": data[d].get("status") == "available"})
        return {"keyword": keyword, "suggestions": suggestions}
    except Exception as e:
        logger.error(f"Domain suggest error: {e}")
        return {"keyword": keyword, "suggestions": [], "error": str(e)}


@router.get("/domains/pricing")
async def get_domain_pricing():
    import httpx
    api_key, reseller_id = await _get_resellerclub_creds()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{RESELLERCLUB_API_URL}/products/reseller-cost-price.json", params={"auth-userid": reseller_id, "api-key": api_key}, timeout=30)
            return resp.json() if resp.status_code == 200 else {"error": resp.text}
    except Exception as e:
        logger.error(f"Pricing error: {e}")
        return {"error": str(e)}


@router.get("/resellerclub/products")
async def get_resellerclub_products():
    tld_prices = {"com": {"register": 12.99, "renew": 14.99}, "net": {"register": 13.99, "renew": 15.99}, "org": {"register": 12.99, "renew": 14.99}, "io": {"register": 49.99, "renew": 59.99}, "eu": {"register": 9.99, "renew": 11.99}, "co": {"register": 29.99, "renew": 34.99}}
    products = [{"product_id": f"domain_{tld}", "type": "domain", "name": f".{tld} Domain", "description": f"Register a .{tld} domain", "price": p["register"], "renew_price": p["renew"], "currency": "EUR", "billing_cycle": "yearly"} for tld, p in tld_prices.items()]
    products.extend([
        {"product_id": "hosting_starter", "type": "hosting", "name": "Starter Hosting", "description": "Perfect for small websites", "price": 4.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["10GB SSD", "1 Website", "Free SSL", "24/7 Support"]},
        {"product_id": "hosting_business", "type": "hosting", "name": "Business Hosting", "description": "For growing businesses", "price": 9.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["50GB SSD", "5 Websites", "Free SSL", "Free Domain", "24/7 Support"]},
        {"product_id": "hosting_enterprise", "type": "hosting", "name": "Enterprise Hosting", "description": "Maximum performance", "price": 19.99, "currency": "EUR", "billing_cycle": "monthly", "features": ["100GB SSD", "Unlimited Websites", "Free SSL", "Free Domain", "Priority Support"]},
        {"product_id": "ssl_basic", "type": "ssl", "name": "Basic SSL", "description": "Domain Validation SSL", "price": 9.99, "currency": "EUR", "billing_cycle": "yearly"},
        {"product_id": "ssl_business", "type": "ssl", "name": "Business SSL", "description": "Organization Validation SSL", "price": 49.99, "currency": "EUR", "billing_cycle": "yearly"},
        {"product_id": "ssl_premium", "type": "ssl", "name": "Premium SSL", "description": "Extended Validation SSL", "price": 149.99, "currency": "EUR", "billing_cycle": "yearly"},
    ])
    return {"products": products}
