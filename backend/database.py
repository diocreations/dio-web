from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
SUPER_ADMIN_EMAIL = "jomiejoseph@gmail.com"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("diocreations")

CURRENCY_RATES = {
    "EUR": 1.0, "USD": 1.08, "GBP": 0.86, "INR": 90.50,
    "AED": 3.97, "AUD": 1.65, "CAD": 1.47, "SGD": 1.45, "CHF": 0.94,
}

COUNTRY_TO_CURRENCY = {
    "AT": "EUR", "BE": "EUR", "CY": "EUR", "EE": "EUR", "FI": "EUR",
    "FR": "EUR", "DE": "EUR", "GR": "EUR", "IE": "EUR", "IT": "EUR",
    "LV": "EUR", "LT": "EUR", "LU": "EUR", "MT": "EUR", "NL": "EUR",
    "PT": "EUR", "SK": "EUR", "SI": "EUR", "ES": "EUR",
    "IN": "INR", "GB": "GBP", "US": "USD", "AE": "AED",
    "AU": "AUD", "CA": "CAD", "SG": "SGD", "CH": "CHF",
}

CURRENCY_SYMBOLS = {
    "EUR": "\u20ac", "USD": "$", "GBP": "\u00a3", "INR": "\u20b9",
    "AED": "\u062f.\u0625", "AUD": "A$", "CAD": "C$", "SGD": "S$", "CHF": "CHF",
}
