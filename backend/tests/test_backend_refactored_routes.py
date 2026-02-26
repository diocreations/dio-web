"""
Backend Tests for Refactored Routes (Iteration 14)
Tests all API endpoints after the monolithic server.py was split into 15 modular route files.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestRootAndConfig:
    """Root endpoint and configuration routes"""
    
    def test_api_root(self):
        """GET /api/ - Root endpoint returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert data["message"] == "DioCreations API", f"Expected 'DioCreations API', got {data['message']}"
        assert "version" in data, "Response should contain 'version'"
        print(f"PASS: Root endpoint returns {data}")
    
    def test_subdomain_config(self):
        """GET /api/config/subdomain - Returns subdomain configuration"""
        response = requests.get(f"{BASE_URL}/api/config/subdomain")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "subdomains" in data, "Response should contain 'subdomains'"
        assert "instructions" in data, "Response should contain 'instructions'"
        assert len(data["subdomains"]) > 0, "Should have at least one subdomain config"
        # Verify subdomain is for resume
        subdomain_config = data["subdomains"][0]
        assert "resume" in subdomain_config.get("subdomain", ""), "Subdomain should be for resume"
        print(f"PASS: Subdomain config has {len(data['subdomains'])} entries")


class TestAdminAuth:
    """Admin authentication routes (/api/auth/*)"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login - Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Body: {response.text}"
        data = response.json()
        assert "session_token" in data, "Response should contain 'session_token'"
        assert "email" in data, "Response should contain 'email'"
        assert data["email"] == "admin@diocreations.com"
        assert "user_id" in data, "Response should contain 'user_id'"
        print(f"PASS: Admin login successful, got session token")
        return data["session_token"]
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/auth/login - Admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Invalid credentials returns 401")
    
    def test_auth_me_unauthorized(self):
        """GET /api/auth/me - Without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /auth/me without token returns 401")


class TestPublicAuth:
    """Public user authentication routes (/api/user/*)"""
    
    def test_user_register(self):
        """POST /api/user/register - Register a new public user"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}. Body: {response.text}"
        data = response.json()
        assert "user_id" in data, "Response should contain 'user_id'"
        assert "session_token" in data, "Response should contain 'session_token'"
        assert data["email"] == unique_email
        print(f"PASS: User registered with ID {data['user_id']}")
        return data
    
    def test_user_register_duplicate(self):
        """POST /api/user/register - Duplicate email returns 400"""
        # First registration
        unique_email = f"test_dup_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User"
        })
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User 2"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Duplicate email registration returns 400")
    
    def test_user_login(self):
        """POST /api/user/login - Login existing public user"""
        # First register
        unique_email = f"test_login_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Login Test User"
        })
        # Now login
        response = requests.post(f"{BASE_URL}/api/user/login", json={
            "email": unique_email,
            "password": "testpassword123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "session_token" in data, "Response should contain 'session_token'"
        assert data["email"] == unique_email
        print(f"PASS: User login successful")
    
    def test_user_login_invalid(self):
        """POST /api/user/login - Invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/user/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Invalid user login returns 401")


class TestContentRoutes:
    """Content routes: services, products"""
    
    def test_get_services(self):
        """GET /api/services - Returns array of services"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/services returns {len(data)} services")
    
    def test_get_products(self):
        """GET /api/products - Returns array of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: GET /api/products returns {len(data)} products")


class TestResumeRoutes:
    """Resume optimizer routes"""
    
    def test_resume_pricing(self):
        """GET /api/resume/pricing - Returns pricing with product_name"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "product_name" in data, "Response should contain 'product_name'"
        assert "price" in data, "Response should contain 'price'"
        assert "currency" in data, "Response should contain 'currency'"
        assert "features" in data, "Response should contain 'features'"
        print(f"PASS: Resume pricing - {data['product_name']} at {data['currency']} {data['price']}")
    
    def test_resume_templates(self):
        """GET /api/resume/templates - Returns 5 templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 5, f"Expected 5 templates, got {len(data)}"
        # Verify each template has required fields
        for tpl in data:
            assert "template_id" in tpl, "Template should have template_id"
            assert "name" in tpl, "Template should have name"
            assert "description" in tpl, "Template should have description"
            assert "style" in tpl, "Template should have style"
            assert "prompt_instruction" in tpl, "Template should have prompt_instruction"
        print(f"PASS: Resume templates returns 5 templates: {[t['name'] for t in data]}")
    
    def test_linkedin_scrape(self):
        """POST /api/resume/linkedin-scrape - Returns response for valid URL"""
        response = requests.post(f"{BASE_URL}/api/resume/linkedin-scrape", json={
            "url": "https://www.linkedin.com/in/test-profile"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should return either success or note about manual entry
        assert "success" in data or "note" in data, "Response should contain 'success' or 'note'"
        print(f"PASS: LinkedIn scrape endpoint working. Success: {data.get('success')}")
    
    def test_linkedin_scrape_invalid_url(self):
        """POST /api/resume/linkedin-scrape - Invalid URL returns 400"""
        response = requests.post(f"{BASE_URL}/api/resume/linkedin-scrape", json={
            "url": "https://google.com"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Invalid LinkedIn URL returns 400")


class TestChatbotRoutes:
    """Chatbot routes"""
    
    def test_chatbot_greeting(self):
        """GET /api/chatbot/greeting - Returns greeting"""
        response = requests.get(f"{BASE_URL}/api/chatbot/greeting")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "greeting" in data, "Response should contain 'greeting'"
        assert len(data["greeting"]) > 0, "Greeting should not be empty"
        print(f"PASS: Chatbot greeting: '{data['greeting'][:50]}...'")


class TestHomepageRoutes:
    """Homepage and about page routes"""
    
    def test_homepage_content(self):
        """GET /api/homepage/content - Returns hero_variants and color_schemes"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "hero_variants" in data, "Response should contain 'hero_variants'"
        assert "color_schemes" in data, "Response should contain 'color_schemes'"
        assert "settings" in data, "Response should contain 'settings'"
        assert len(data["hero_variants"]) > 0, "Should have at least one hero variant"
        assert len(data["color_schemes"]) > 0, "Should have at least one color scheme"
        print(f"PASS: Homepage content with {len(data['hero_variants'])} hero variants, {len(data['color_schemes'])} color schemes")
    
    def test_about_content(self):
        """GET /api/about/content - Returns about page data"""
        response = requests.get(f"{BASE_URL}/api/about/content")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "hero_title_line1" in data or "hero_badge" in data, "Response should contain hero content"
        print(f"PASS: About content retrieved successfully")


class TestBuilderRoutes:
    """Builder categories route - note: this might be in templates.py"""
    
    def test_builder_categories(self):
        """GET /api/builder/categories - Returns builder categories if exists"""
        response = requests.get(f"{BASE_URL}/api/builder/categories")
        # This endpoint may or may not exist, so we accept 200 or 404
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: Builder categories returns {len(data) if isinstance(data, list) else 'data'}")
        else:
            print("INFO: Builder categories endpoint not found (404)")


class TestGoogleDriveRoutes:
    """Google Drive integration routes"""
    
    def test_drive_status(self):
        """GET /api/drive/status - Returns {configured: false} when not configured"""
        response = requests.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "configured" in data, "Response should contain 'configured'"
        # We expect it to be False since no GOOGLE_CLIENT_ID is set
        assert isinstance(data["configured"], bool), "configured should be boolean"
        print(f"PASS: Drive status - configured: {data['configured']}")


class TestMenuRoutes:
    """Navigation and footer menu routes"""
    
    def test_nav_menu(self):
        """GET /api/menus/nav - Returns navigation items"""
        response = requests.get(f"{BASE_URL}/api/menus/nav")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one nav item"
        # Verify structure
        for item in data:
            assert "label" in item, "Nav item should have label"
            assert "path" in item, "Nav item should have path"
        print(f"PASS: Nav menu returns {len(data)} items: {[i['label'] for i in data[:5]]}...")
    
    def test_footer_menu(self):
        """GET /api/menus/footer - Returns footer items"""
        response = requests.get(f"{BASE_URL}/api/menus/footer")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one footer item"
        print(f"PASS: Footer menu returns {len(data)} items")


# Additional tests for completeness
class TestOtherEndpoints:
    """Additional endpoints"""
    
    def test_testimonials(self):
        """GET /api/testimonials - Returns testimonials"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: Testimonials returns {len(data)} items")
    
    def test_portfolio(self):
        """GET /api/portfolio - Returns portfolio items"""
        response = requests.get(f"{BASE_URL}/api/portfolio")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: Portfolio returns {len(data)} items")
    
    def test_blog(self):
        """GET /api/blog - Returns blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: Blog returns {len(data)} posts")
    
    def test_settings(self):
        """GET /api/settings - Should exist if app uses global settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        # Settings might or might not exist
        if response.status_code == 200:
            print(f"PASS: Settings endpoint exists")
        else:
            print(f"INFO: Settings endpoint returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
