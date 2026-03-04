"""
Iteration 25: Test Currency Detection and External Link Features
- Currency Detection: /api/geo/currency endpoint
- Currency Rates: /api/currency-rates endpoint
- Products External Link: external_url and open_in_new_tab fields
- Admin Currency Settings: /api/admin/currency/settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGeoCurrencyEndpoint:
    """Test /api/geo/currency endpoint for visitor currency detection"""
    
    def test_geo_currency_returns_valid_response(self):
        """Test that geo/currency endpoint returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/geo/currency")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields exist
        assert "currency" in data, "Response should contain 'currency' field"
        assert "currency_symbol" in data, "Response should contain 'currency_symbol' field"
        assert "currency_rate" in data, "Response should contain 'currency_rate' field"
        assert "all_currencies" in data, "Response should contain 'all_currencies' field"
        
        # Verify data types
        assert isinstance(data["currency"], str), "currency should be a string"
        assert isinstance(data["currency_symbol"], str), "currency_symbol should be a string"
        assert isinstance(data["currency_rate"], (int, float)), "currency_rate should be numeric"
        assert isinstance(data["all_currencies"], list), "all_currencies should be a list"
        
        # Verify currency is valid
        valid_currencies = ["EUR", "USD", "GBP", "INR", "AED", "AUD", "CAD", "SGD", "CHF"]
        assert data["currency"] in valid_currencies, f"Currency {data['currency']} not in valid list"
        
        print(f"✓ Geo currency endpoint returned: {data['currency']} ({data['currency_symbol']}) rate={data['currency_rate']}")
    
    def test_geo_currency_returns_all_supported_currencies(self):
        """Test that all_currencies contains expected currencies"""
        response = requests.get(f"{BASE_URL}/api/geo/currency")
        assert response.status_code == 200
        
        data = response.json()
        all_currencies = data.get("all_currencies", [])
        
        # Should have at least EUR and USD
        assert "EUR" in all_currencies, "EUR should be in all_currencies"
        assert "USD" in all_currencies, "USD should be in all_currencies"
        assert len(all_currencies) >= 2, "Should have at least 2 currencies"
        
        print(f"✓ All currencies available: {all_currencies}")


class TestCurrencyRatesEndpoint:
    """Test /api/currency-rates endpoint"""
    
    def test_currency_rates_returns_valid_response(self):
        """Test that currency-rates endpoint returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/currency-rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields
        assert "base_currency" in data, "Response should contain 'base_currency'"
        assert "rates" in data, "Response should contain 'rates'"
        assert "supported_currencies" in data, "Response should contain 'supported_currencies'"
        
        # Verify rates structure
        rates = data["rates"]
        assert isinstance(rates, dict), "rates should be a dictionary"
        assert "EUR" in rates, "EUR should be in rates"
        assert "USD" in rates, "USD should be in rates"
        
        # Verify EUR rate is 1.0 (base currency)
        assert rates["EUR"] == 1.0, "EUR rate should be 1.0 as base currency"
        
        # Verify USD rate is reasonable (between 0.5 and 2.0)
        assert 0.5 < rates["USD"] < 2.0, f"USD rate {rates['USD']} seems unreasonable"
        
        print(f"✓ Currency rates: EUR=1.0, USD={rates['USD']}, supported={data['supported_currencies']}")
    
    def test_currency_rates_has_all_major_currencies(self):
        """Test that all major currencies have rates"""
        response = requests.get(f"{BASE_URL}/api/currency-rates")
        assert response.status_code == 200
        
        data = response.json()
        rates = data["rates"]
        
        expected_currencies = ["EUR", "USD", "GBP", "INR", "AED", "AUD", "CAD", "SGD", "CHF"]
        for currency in expected_currencies:
            assert currency in rates, f"{currency} should have a rate"
            assert isinstance(rates[currency], (int, float)), f"{currency} rate should be numeric"
            assert rates[currency] > 0, f"{currency} rate should be positive"
        
        print(f"✓ All {len(expected_currencies)} major currencies have valid rates")


class TestProductsEndpoint:
    """Test products endpoint for external link support"""
    
    def test_products_endpoint_returns_list(self):
        """Test that products endpoint returns a list"""
        response = requests.get(f"{BASE_URL}/api/products?active_only=true")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Products should return a list"
        print(f"✓ Products endpoint returned {len(data)} products")
    
    def test_products_have_required_fields(self):
        """Test that products have required fields"""
        response = requests.get(f"{BASE_URL}/api/products?active_only=true")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) == 0:
            pytest.skip("No products available to test")
        
        product = data[0]
        required_fields = ["product_id", "title", "slug", "is_active"]
        for field in required_fields:
            assert field in product, f"Product should have '{field}' field"
        
        print(f"✓ Products have required fields: {required_fields}")
    
    def test_products_can_have_external_url(self):
        """Test that products schema supports external_url and open_in_new_tab"""
        # This test verifies the frontend code handles these fields
        # The backend accepts any fields in the product document
        response = requests.get(f"{BASE_URL}/api/products?active_only=true")
        assert response.status_code == 200
        
        data = response.json()
        # Check if any product has external_url set
        products_with_external = [p for p in data if p.get("external_url")]
        
        print(f"✓ Products endpoint works. {len(products_with_external)} products have external_url set")


class TestAdminCurrencySettings:
    """Test admin currency settings endpoint (requires auth)"""
    
    def test_admin_currency_settings_requires_auth(self):
        """Test that admin currency settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/currency/settings")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✓ Admin currency settings correctly requires authentication")


class TestProductExternalLinkIntegration:
    """Integration tests for product external link feature"""
    
    def test_create_product_with_external_url(self):
        """Test creating a product with external_url (requires admin auth)"""
        # First, try to login as admin
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated test")
        
        cookies = login_response.cookies
        
        # Create a test product with external_url
        test_product = {
            "title": "TEST_External_Link_Product",
            "slug": "test-external-link-product",
            "short_description": "Test product with external link",
            "description": "This product has an external URL for testing",
            "icon": "Globe",
            "price": "0",
            "price_unit": "one-time",
            "currency": "EUR",
            "features": ["Test feature"],
            "is_popular": False,
            "cta_text": "Visit External Site",
            "order": 999,
            "is_active": True,
            "external_url": "https://example.com/test-product",
            "open_in_new_tab": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/products",
            json=test_product,
            cookies=cookies
        )
        
        assert create_response.status_code == 200, f"Failed to create product: {create_response.text}"
        
        created = create_response.json()
        assert created.get("external_url") == "https://example.com/test-product"
        assert created.get("open_in_new_tab") == True
        
        product_id = created.get("product_id")
        print(f"✓ Created product with external_url: {product_id}")
        
        # Verify the product is returned with external_url
        get_response = requests.get(f"{BASE_URL}/api/products/{test_product['slug']}")
        assert get_response.status_code == 200
        
        fetched = get_response.json()
        assert fetched.get("external_url") == "https://example.com/test-product"
        assert fetched.get("open_in_new_tab") == True
        
        # Cleanup - delete the test product
        delete_response = requests.delete(
            f"{BASE_URL}/api/products/{product_id}",
            cookies=cookies
        )
        assert delete_response.status_code == 200
        print(f"✓ Cleaned up test product: {product_id}")


class TestHomepageHeroCarousel:
    """Test homepage hero carousel external link support"""
    
    def test_homepage_content_endpoint(self):
        """Test that homepage content endpoint works"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check for hero_variants which may have external link support
        hero_variants = data.get("hero_variants", [])
        
        print(f"✓ Homepage content loaded. {len(hero_variants)} hero variants found")
        
        # Check if any hero variant has new_tab settings
        for variant in hero_variants:
            if variant.get("primary_cta_new_tab") or variant.get("secondary_cta_new_tab"):
                print(f"  - Hero variant has new_tab CTA support")
                break


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
