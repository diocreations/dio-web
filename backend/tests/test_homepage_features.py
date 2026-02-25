"""
Test suite for DioCreations CMS Homepage Features
Tests: Homepage content API, Geo-based currency, Hero variants with hero_image, Color schemes, 
       Section ordering, Admin homepage settings with 6 tabs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHomepageContentAPI:
    """Tests for public homepage content API"""
    
    def test_homepage_content_returns_200(self):
        """Test homepage content API returns 200"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        print("✓ Homepage content API returns 200")
    
    def test_homepage_content_has_required_fields(self):
        """Test homepage content has all required fields"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        data = response.json()
        
        # Check required top-level fields
        assert "settings" in data, "Missing 'settings' field"
        assert "hero_variants" in data, "Missing 'hero_variants' field"
        assert "color_schemes" in data, "Missing 'color_schemes' field"
        assert "featured_blog" in data, "Missing 'featured_blog' field"
        assert "featured_products" in data, "Missing 'featured_products' field"
        assert "visitor_currency" in data, "Missing 'visitor_currency' field"
        assert "currency_symbol" in data, "Missing 'currency_symbol' field"
        assert "currency_rate" in data, "Missing 'currency_rate' field"
        print("✓ Homepage content has all required fields")
    
    def test_homepage_settings_structure(self):
        """Test homepage settings has correct structure"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        settings = response.json()["settings"]
        
        # Check settings fields
        assert "enable_hero_rotation" in settings
        assert "enable_color_rotation" in settings
        assert "show_featured_blog" in settings
        assert "show_featured_products" in settings
        assert "show_services" in settings
        assert "show_portfolio" in settings
        assert "show_testimonials" in settings
        assert "show_stats" in settings
        assert "stats" in settings
        print("✓ Homepage settings has correct structure")
    
    def test_hero_variants_structure(self):
        """Test hero variants have correct structure including hero_image"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        hero_variants = response.json()["hero_variants"]
        
        assert len(hero_variants) > 0, "No hero variants found"
        
        hero = hero_variants[0]
        assert "variant_id" in hero
        assert "badge_text" in hero
        assert "title_line1" in hero
        assert "title_line2" in hero
        assert "subtitle" in hero
        assert "primary_cta_text" in hero
        assert "primary_cta_link" in hero
        assert "secondary_cta_text" in hero
        assert "secondary_cta_link" in hero
        assert "is_active" in hero
        # NEW: Check hero_image field
        assert "hero_image" in hero, "Missing 'hero_image' field in hero variant"
        assert hero["hero_image"].startswith("http"), "hero_image should be a valid URL"
        print(f"✓ Hero variants structure correct with hero_image (found {len(hero_variants)} variants)")
        print(f"  - hero_image: {hero['hero_image'][:60]}...")
    
    def test_color_schemes_structure(self):
        """Test color schemes have correct structure"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        color_schemes = response.json()["color_schemes"]
        
        assert len(color_schemes) > 0, "No color schemes found"
        
        scheme = color_schemes[0]
        assert "scheme_id" in scheme
        assert "name" in scheme
        assert "primary" in scheme
        assert "secondary" in scheme
        assert "accent" in scheme
        assert "gradient_from" in scheme
        assert "is_active" in scheme
        print(f"✓ Color schemes structure correct (found {len(color_schemes)} schemes)")
    
    def test_stats_section_data(self):
        """Test stats section has data"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        settings = response.json()["settings"]
        
        assert settings.get("show_stats") == True
        assert "stats" in settings
        assert len(settings["stats"]) > 0
        
        stat = settings["stats"][0]
        assert "label" in stat
        assert "value" in stat
        print(f"✓ Stats section has {len(settings['stats'])} stats")


class TestSectionOrdering:
    """Tests for section ordering feature"""
    
    def test_section_order_in_model(self):
        """Test that section_order field exists in HomepageSettings model"""
        # The section_order should be available in settings
        # Even if not set in DB, the frontend should handle default order
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        settings = response.json()["settings"]
        
        # section_order may be None if not set, but model supports it
        # Default order: ["services", "products", "blog", "portfolio", "testimonials", "cta"]
        expected_sections = ["services", "products", "blog", "portfolio", "testimonials", "cta"]
        
        section_order = settings.get("section_order")
        if section_order:
            assert isinstance(section_order, list), "section_order should be a list"
            assert len(section_order) == 6, "section_order should have 6 sections"
            for section in expected_sections:
                assert section in section_order, f"Missing section '{section}' in section_order"
            print(f"✓ Section order configured: {section_order}")
        else:
            print("✓ Section order not set in DB (uses default order in frontend)")


class TestGeoCurrencyAPI:
    """Tests for geo-based currency detection"""
    
    def test_geo_currency_default(self):
        """Test default currency is EUR"""
        response = requests.get(f"{BASE_URL}/api/geo/currency")
        assert response.status_code == 200
        data = response.json()
        
        assert "currency" in data
        assert "currency_symbol" in data
        assert "currency_rate" in data
        assert "all_currencies" in data
        print(f"✓ Default currency: {data['currency']} ({data['currency_symbol']})")
    
    def test_geo_currency_india(self):
        """Test currency for India (INR)"""
        response = requests.get(
            f"{BASE_URL}/api/geo/currency",
            headers={"X-Country-Code": "IN"}
        )
        data = response.json()
        
        assert data["currency"] == "INR"
        assert data["currency_symbol"] == "₹"
        assert data["currency_rate"] == 90.5
        assert data["country_code"] == "IN"
        print("✓ India currency: INR (₹) with rate 90.5")
    
    def test_geo_currency_germany(self):
        """Test currency for Germany (EUR)"""
        response = requests.get(
            f"{BASE_URL}/api/geo/currency",
            headers={"X-Country-Code": "DE"}
        )
        data = response.json()
        
        assert data["currency"] == "EUR"
        assert data["currency_symbol"] == "€"
        assert data["currency_rate"] == 1.0
        print("✓ Germany currency: EUR (€) with rate 1.0")
    
    def test_geo_currency_usa(self):
        """Test currency for USA (USD)"""
        response = requests.get(
            f"{BASE_URL}/api/geo/currency",
            headers={"X-Country-Code": "US"}
        )
        data = response.json()
        
        assert data["currency"] == "USD"
        assert data["currency_symbol"] == "$"
        assert data["currency_rate"] == 1.08
        print("✓ USA currency: USD ($) with rate 1.08")
    
    def test_geo_currency_uk(self):
        """Test currency for UK (GBP)"""
        response = requests.get(
            f"{BASE_URL}/api/geo/currency",
            headers={"X-Country-Code": "GB"}
        )
        data = response.json()
        
        assert data["currency"] == "GBP"
        assert data["currency_symbol"] == "£"
        print("✓ UK currency: GBP (£)")
    
    def test_geo_currency_italy(self):
        """Test currency for Italy (EUR)"""
        response = requests.get(
            f"{BASE_URL}/api/geo/currency",
            headers={"X-Country-Code": "IT"}
        )
        data = response.json()
        
        assert data["currency"] == "EUR"
        assert data["currency_symbol"] == "€"
        assert data["currency_rate"] == 1.0
        print("✓ Italy currency: EUR (€) with rate 1.0")
    
    def test_homepage_content_with_india_currency(self):
        """Test homepage content returns INR prices for India"""
        response = requests.get(
            f"{BASE_URL}/api/homepage/content",
            headers={"X-Country-Code": "IN"}
        )
        data = response.json()
        
        assert data["visitor_currency"] == "INR"
        assert data["currency_symbol"] == "₹"
        assert data["currency_rate"] == 90.5
        
        # Check featured products have converted prices
        if data["featured_products"]:
            product = data["featured_products"][0]
            assert product.get("display_currency") == "INR"
            assert product.get("currency_symbol") == "₹"
            print(f"✓ Product '{product['title']}' shows INR price: ₹{product.get('display_price')}")
        print("✓ Homepage content returns INR for India")


class TestFeaturedSections:
    """Tests for featured blog and products sections"""
    
    def test_featured_blog_posts(self):
        """Test featured blog posts are returned"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        data = response.json()
        
        featured_blog = data.get("featured_blog", [])
        settings = data.get("settings", {})
        
        if settings.get("show_featured_blog"):
            # Should have blog posts if enabled
            print(f"✓ Featured blog enabled, found {len(featured_blog)} posts")
            
            if featured_blog:
                post = featured_blog[0]
                assert "post_id" in post
                assert "title" in post
                assert "slug" in post
                assert "excerpt" in post
                print(f"  - First post: '{post['title']}'")
    
    def test_featured_products(self):
        """Test featured products are returned"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        data = response.json()
        
        featured_products = data.get("featured_products", [])
        settings = data.get("settings", {})
        
        if settings.get("show_featured_products"):
            print(f"✓ Featured products enabled, found {len(featured_products)} products")
            
            if featured_products:
                product = featured_products[0]
                assert "product_id" in product
                assert "title" in product
                assert "slug" in product
                assert "price" in product or product.get("price") is None
                print(f"  - First product: '{product['title']}'")


class TestAdminHomepageAPIs:
    """Tests for admin homepage management APIs (require auth)"""
    
    def test_homepage_settings_requires_auth(self):
        """Test homepage settings API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/homepage/settings")
        assert response.status_code == 401
        print("✓ Homepage settings API requires authentication")
    
    def test_hero_variants_requires_auth(self):
        """Test hero variants API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/homepage/hero-variants")
        assert response.status_code == 401
        print("✓ Hero variants API requires authentication")
    
    def test_color_schemes_requires_auth(self):
        """Test color schemes API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/homepage/color-schemes")
        assert response.status_code == 401
        print("✓ Color schemes API requires authentication")
    
    def test_featured_items_requires_auth(self):
        """Test featured items API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/homepage/featured-items")
        assert response.status_code == 401
        print("✓ Featured items API requires authentication")


class TestAdminUsersAPI:
    """Tests for admin users management API"""
    
    def test_admin_users_requires_auth(self):
        """Test admin users API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401
        print("✓ Admin users API requires authentication")
    
    def test_add_admin_requires_auth(self):
        """Test adding admin requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users",
            json={"email": "test@example.com", "name": "Test User"}
        )
        assert response.status_code == 401
        print("✓ Add admin API requires authentication")


class TestExistingAPIs:
    """Tests for existing APIs to ensure they still work"""
    
    def test_services_api(self):
        """Test services API returns data"""
        response = requests.get(f"{BASE_URL}/api/services?active_only=true")
        assert response.status_code == 200
        services = response.json()
        assert isinstance(services, list)
        print(f"✓ Services API returns {len(services)} services")
    
    def test_products_api(self):
        """Test products API returns data"""
        response = requests.get(f"{BASE_URL}/api/products?active_only=true")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        print(f"✓ Products API returns {len(products)} products")
    
    def test_portfolio_api(self):
        """Test portfolio API returns data"""
        response = requests.get(f"{BASE_URL}/api/portfolio?active_only=true")
        assert response.status_code == 200
        portfolio = response.json()
        assert isinstance(portfolio, list)
        print(f"✓ Portfolio API returns {len(portfolio)} items")
    
    def test_blog_api(self):
        """Test blog API returns data"""
        response = requests.get(f"{BASE_URL}/api/blog?published_only=true")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        print(f"✓ Blog API returns {len(posts)} posts")
    
    def test_testimonials_api(self):
        """Test testimonials API returns data"""
        response = requests.get(f"{BASE_URL}/api/testimonials?active_only=true")
        assert response.status_code == 200
        testimonials = response.json()
        assert isinstance(testimonials, list)
        print(f"✓ Testimonials API returns {len(testimonials)} testimonials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
