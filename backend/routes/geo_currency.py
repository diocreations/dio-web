from fastapi import APIRouter, Request, Depends
from database import db, CURRENCY_RATES, COUNTRY_TO_CURRENCY, CURRENCY_SYMBOLS, logger
from helpers import get_current_user
import httpx

router = APIRouter(prefix="/api")

# In-memory cache for IP -> country lookups
_ip_country_cache = {}


async def detect_country(request: Request) -> str:
    """Detect visitor country using headers, then IP geolocation fallback"""
    # 1. Try standard headers from CDN/proxy
    cf_country = request.headers.get("CF-IPCountry", "")
    x_country = request.headers.get("X-Country-Code", "")
    if cf_country:
        return cf_country.upper()
    if x_country:
        return x_country.upper()

    # 2. Get client IP
    forwarded = request.headers.get("X-Forwarded-For", "")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
    if not client_ip or client_ip in ("127.0.0.1", "::1", "localhost"):
        return ""

    # 3. Check cache
    if client_ip in _ip_country_cache:
        return _ip_country_cache[client_ip]

    # 4. Check DB cache
    cached = await db.ip_geo_cache.find_one({"ip": client_ip}, {"_id": 0})
    if cached:
        _ip_country_cache[client_ip] = cached["country"]
        return cached["country"]

    # 5. Call free geo-IP API
    try:
        async with httpx.AsyncClient(timeout=3) as client_http:
            resp = await client_http.get(f"http://ip-api.com/json/{client_ip}?fields=countryCode")
            if resp.status_code == 200:
                data = resp.json()
                country = data.get("countryCode", "")
                if country:
                    _ip_country_cache[client_ip] = country
                    await db.ip_geo_cache.update_one(
                        {"ip": client_ip},
                        {"$set": {"ip": client_ip, "country": country}},
                        upsert=True,
                    )
                    return country
    except Exception as e:
        logger.warning(f"Geo-IP lookup failed: {e}")

    return ""


async def get_currency_settings():
    """Get admin-defined currency settings from DB, fallback to defaults"""
    settings = await db.currency_settings.find_one({"settings_id": "currency"}, {"_id": 0})
    if not settings:
        return {
            "default_currency": "USD",
            "region_currencies": dict(COUNTRY_TO_CURRENCY),
            "rates": dict(CURRENCY_RATES),
            "symbols": dict(CURRENCY_SYMBOLS),
        }
    rates = settings.get("rates", CURRENCY_RATES)
    symbols = settings.get("symbols", CURRENCY_SYMBOLS)
    return {
        "default_currency": settings.get("default_currency", "USD"),
        "region_currencies": settings.get("region_currencies", COUNTRY_TO_CURRENCY),
        "rates": rates,
        "symbols": symbols,
    }


async def resolve_visitor_currency(request: Request) -> dict:
    """Resolve the visitor's currency based on geo + admin settings"""
    country_code = await detect_country(request)
    cs = await get_currency_settings()
    region_map = cs["region_currencies"]
    rates = cs["rates"]
    symbols = cs["symbols"]
    default_cur = cs["default_currency"]

    currency = region_map.get(country_code, default_cur) if country_code else default_cur
    if currency not in rates:
        currency = default_cur
    rate = rates.get(currency, 1.0)
    symbol = symbols.get(currency, currency)
    return {
        "country_code": country_code,
        "currency": currency,
        "currency_symbol": symbol,
        "currency_rate": rate,
    }


# ---- Public endpoints ----

@router.get("/geo/currency")
async def get_visitor_currency(request: Request):
    """Get visitor currency based on geo-IP with admin overrides"""
    result = await resolve_visitor_currency(request)
    cs = await get_currency_settings()
    result["all_currencies"] = list(cs["rates"].keys())
    return result


@router.get("/currency/rates")
async def get_public_currency_rates():
    """Public endpoint to get currency rates for frontend conversion"""
    cs = await get_currency_settings()
    return {
        "rates": cs["rates"],
        "symbols": cs["symbols"],
        "default_currency": cs["default_currency"],
    }


# ---- Admin endpoints ----

@router.get("/admin/currency/settings")
async def get_admin_currency_settings(user: dict = Depends(get_current_user)):
    cs = await get_currency_settings()
    return cs


@router.put("/admin/currency/settings")
async def update_admin_currency_settings(data: dict, user: dict = Depends(get_current_user)):
    data.pop("_id", None)
    data["settings_id"] = "currency"
    await db.currency_settings.update_one(
        {"settings_id": "currency"}, {"$set": data}, upsert=True
    )
    # Clear IP cache so new settings take effect
    _ip_country_cache.clear()
    return await db.currency_settings.find_one({"settings_id": "currency"}, {"_id": 0})
