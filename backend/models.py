"""Pydantic models"""
from pydantic import BaseModel
from typing import Optional


class SiteSettings(BaseModel):
    settings_id: str = "site_settings"
    site_name: str = "DioCreations"
    tagline: str = "Digital Excellence for Modern Business"
    contact_email: str = "info@diocreations.eu"
    contact_phone: str = "+1 234 567 8900"
    contact_address: str = "123 Tech Street, Digital City, DC 12345"
    footer_text: str = "\u00a9 2025 DioCreations. All rights reserved."
    stripe_api_key: Optional[str] = None
    resellerclub_api_key: Optional[str] = None
    resellerclub_reseller_id: Optional[str] = None
