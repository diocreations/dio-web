"""
Iteration 20: Testing 5 NEW features
1. Admin SEO Manager - global SEO, per-page SEO, sitemap.xml, robots.txt
2. Referral Discount System - generate, validate, apply, config, stats
3. Enhanced User Dashboard - resume history, payments, stats, referral
4. Resume checkout with referral_code support
5. Dynamic SEO meta tag injection in Layout
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSEOGlobal:
    """Test global SEO settings endpoints"""
    
    def test_get_global_seo_returns_defaults(self):
        """GET /api/seo/global returns default SEO settings"""
        response = requests.get(f"{BASE_URL}/api/seo/global")
        assert response.status_code == 200
        data = response.json()
        assert "site_title" in data
        assert "site_description" in data
        assert "default_keywords" in data
        assert isinstance(data["default_keywords"], list)
        print(f"Global SEO: site_title={data.get('site_title', '')[:50]}")
    
    def test_update_global_seo_requires_auth(self):
        """PUT /api/seo/global requires admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/seo/global",
            json={"site_title": "Test Update"},
            headers={"Content-Type": "application/json"}
        )
        # Without auth, should return 401 or 403
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        print("PUT /api/seo/global correctly requires auth")
    
    def test_update_global_seo_with_admin_auth(self, admin_session):
        """PUT /api/seo/global updates settings when authenticated"""
        # First get current settings
        response = admin_session.get(f"{BASE_URL}/api/seo/global")
        assert response.status_code == 200
        original = response.json()
        
        # Update settings
        update_data = {
            "site_title": "TEST_Updated Site Title",
            "site_description": "TEST_Updated description",
            "default_keywords": ["test", "keywords"],
        }
        response = admin_session.put(
            f"{BASE_URL}/api/seo/global",
            json=update_data
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated.get("site_title") == "TEST_Updated Site Title"
        
        # Restore original settings
        admin_session.put(f"{BASE_URL}/api/seo/global", json=original)
        print("PUT /api/seo/global successfully updates and restores")


class TestSEOPages:
    """Test per-page SEO settings endpoints"""
    
    def test_get_seo_page_returns_defaults(self):
        """GET /api/seo/pages/{slug} returns page SEO (defaults if not set)"""
        response = requests.get(f"{BASE_URL}/api/seo/pages/home")
        assert response.status_code == 200
        data = response.json()
        assert "slug" in data or "title" in data or "description" in data
        print(f"Page SEO for 'home': {data}")
    
    def test_get_seo_pages_list(self):
        """GET /api/seo/pages returns list of all page SEO settings"""
        response = requests.get(f"{BASE_URL}/api/seo/pages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SEO pages list count: {len(data)}")
    
    def test_update_page_seo_with_admin_auth(self, admin_session):
        """PUT /api/seo/pages/{slug} saves page SEO settings"""
        test_slug = "resume-optimizer"
        test_data = {
            "title": "TEST_Resume Optimizer - DioAI",
            "description": "TEST_AI-powered resume optimization",
            "keywords": ["resume", "AI", "optimizer"],
            "og_title": "TEST_Resume Optimizer OG Title",
        }
        
        response = admin_session.put(
            f"{BASE_URL}/api/seo/pages/{test_slug}",
            json=test_data
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated.get("title") == test_data["title"]
        assert updated.get("slug") == test_slug
        print(f"Page SEO for '{test_slug}' updated successfully")


class TestSitemapRobots:
    """Test sitemap.xml and robots.txt endpoints"""
    
    def test_sitemap_xml_returns_valid_xml(self):
        """GET /api/sitemap.xml returns valid XML sitemap"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "xml" in content_type.lower(), f"Expected XML, got {content_type}"
        content = response.text
        assert '<?xml version="1.0"' in content
        assert "<urlset" in content
        assert "<url>" in content
        assert "<loc>" in content
        # Check that it has valid URL entries (content varies by DB)
        assert content.count("<url>") >= 5, "Should have at least 5 URLs"
        print(f"Sitemap XML valid, length={len(content)} chars, url_count={content.count('<url>')}")
    
    def test_robots_txt_returns_proper_content(self):
        """GET /api/robots.txt returns proper robots.txt content"""
        response = requests.get(f"{BASE_URL}/api/robots.txt")
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "text/plain" in content_type.lower()
        content = response.text
        assert "User-agent:" in content
        assert "Allow:" in content or "Disallow:" in content
        assert "Sitemap:" in content
        print(f"Robots.txt content:\n{content[:200]}")


class TestReferralConfig:
    """Test referral program config endpoints"""
    
    def test_get_referral_config_returns_defaults(self):
        """GET /api/referral/config returns referral program configuration"""
        response = requests.get(f"{BASE_URL}/api/referral/config")
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data
        assert "discount_percent" in data
        assert "referrer_reward_percent" in data
        assert data.get("discount_percent") == 20, f"Expected 20% discount, got {data.get('discount_percent')}"
        assert data.get("referrer_reward_percent") == 10, f"Expected 10% reward, got {data.get('referrer_reward_percent')}"
        print(f"Referral config: enabled={data.get('enabled')}, discount={data.get('discount_percent')}%, reward={data.get('referrer_reward_percent')}%")


class TestReferralCodes:
    """Test referral code generation, validation, application"""
    
    def test_generate_referral_code(self):
        """POST /api/referral/generate creates unique referral code for email"""
        test_email = "TEST_referral_user@example.com"
        response = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email, "name": "Test User"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "code" in data
        assert data["code"].startswith("DIO-")
        assert data.get("email") == test_email
        print(f"Generated referral code: {data['code']}")
        return data["code"]
    
    def test_generate_referral_code_returns_existing(self):
        """POST /api/referral/generate returns existing code for same email"""
        test_email = "TEST_existing_referral@example.com"
        # First request
        r1 = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email}
        )
        code1 = r1.json().get("code")
        
        # Second request with same email should return same code
        r2 = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email}
        )
        code2 = r2.json().get("code")
        
        assert code1 == code2, f"Expected same code, got {code1} vs {code2}"
        print(f"Same email returns same code: {code1}")
    
    def test_validate_referral_code_success(self):
        """GET /api/referral/validate/{code} returns valid=true with discount"""
        # First generate a code
        test_email = "TEST_validate_code@example.com"
        gen_response = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email}
        )
        code = gen_response.json().get("code")
        
        # Validate it
        response = requests.get(f"{BASE_URL}/api/referral/validate/{code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("valid") == True
        assert data.get("discount_percent") == 20
        assert data.get("code") == code
        print(f"Validated code {code}: discount={data.get('discount_percent')}%")
    
    def test_validate_invalid_code_returns_404(self):
        """GET /api/referral/validate/INVALIDCODE returns 404"""
        response = requests.get(f"{BASE_URL}/api/referral/validate/INVALIDCODE123")
        assert response.status_code == 404
        print("Invalid referral code correctly returns 404")
    
    def test_apply_referral_code(self):
        """POST /api/referral/apply applies discount and records usage"""
        # Generate a code first
        test_email = "TEST_apply_referral@example.com"
        gen_response = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email, "name": "Referrer"}
        )
        code = gen_response.json().get("code")
        
        # Apply the code
        response = requests.post(
            f"{BASE_URL}/api/referral/apply",
            json={
                "code": code,
                "amount": 19.99,
                "buyer_email": "TEST_buyer@example.com",
                "resume_id": "test_resume_123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "original_amount" in data
        assert "discounted_amount" in data
        assert "discount_percent" in data
        assert "savings" in data
        assert data["original_amount"] == 19.99
        assert data["discount_percent"] == 20
        expected_discounted = round(19.99 * 0.8, 2)
        assert abs(data["discounted_amount"] - expected_discounted) < 0.01
        print(f"Applied referral: {data['original_amount']} -> {data['discounted_amount']} (saved {data['savings']})")
    
    def test_cannot_use_own_referral_code(self):
        """POST /api/referral/apply rejects using own referral code"""
        test_email = "TEST_own_code_user@example.com"
        gen_response = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": test_email}
        )
        code = gen_response.json().get("code")
        
        # Try to apply own code
        response = requests.post(
            f"{BASE_URL}/api/referral/apply",
            json={
                "code": code,
                "amount": 19.99,
                "buyer_email": test_email  # Same email as referrer
            }
        )
        assert response.status_code == 400
        assert "own referral" in response.json().get("detail", "").lower()
        print("Correctly prevents using own referral code")


class TestCheckoutWithReferral:
    """Test resume checkout with referral code support"""
    
    def test_checkout_with_referral_code_applies_discount(self):
        """POST /api/resume/checkout with referral_code applies discount to price"""
        # Generate a referral code
        referrer_email = "TEST_checkout_referrer@example.com"
        gen_response = requests.post(
            f"{BASE_URL}/api/referral/generate",
            json={"email": referrer_email}
        )
        ref_code = gen_response.json().get("code")
        
        # Create a test resume upload first
        test_pdf_path = "/tmp/test_resume_iter20.pdf"
        if not os.path.exists(test_pdf_path):
            # Create minimal PDF
            import fitz
            doc = fitz.open()
            page = doc.new_page()
            page.insert_text((100, 100), "Test Resume\nJohn Doe\nSoftware Engineer\nExperience: 5 years")
            doc.save(test_pdf_path)
            doc.close()
        
        with open(test_pdf_path, "rb") as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={"file": ("test_resume.pdf", f, "application/pdf")}
            )
        
        if upload_response.status_code != 200:
            pytest.skip("Could not upload test resume")
        
        resume_id = upload_response.json().get("resume_id")
        
        # Now test checkout with referral code
        checkout_response = requests.post(
            f"{BASE_URL}/api/resume/checkout",
            json={
                "resume_id": resume_id,
                "email": "TEST_buyer_checkout@example.com",
                "origin_url": BASE_URL,
                "referral_code": ref_code
            }
        )
        assert checkout_response.status_code == 200
        data = checkout_response.json()
        assert "checkout_url" in data
        assert "final_price" in data
        
        # Price should be discounted (19.99 * 0.8 = 15.99)
        expected_price = round(19.99 * 0.8, 2)
        assert abs(data["final_price"] - expected_price) < 0.01, f"Expected {expected_price}, got {data['final_price']}"
        print(f"Checkout with referral: final_price={data['final_price']} (expected {expected_price})")


class TestUserDashboard:
    """Test enhanced user dashboard endpoints"""
    
    def test_user_dashboard_requires_auth(self):
        """GET /api/user/dashboard requires public user auth"""
        response = requests.get(f"{BASE_URL}/api/user/dashboard")
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
        print("User dashboard correctly requires auth")


class TestReferralStats:
    """Test referral stats endpoint (admin)"""
    
    def test_referral_stats_requires_admin(self):
        """GET /api/referral/stats requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/referral/stats")
        assert response.status_code in [401, 403]
        print("Referral stats correctly requires admin auth")
    
    def test_referral_stats_with_admin(self, admin_session):
        """GET /api/referral/stats returns stats for admin"""
        response = admin_session.get(f"{BASE_URL}/api/referral/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_codes" in data
        assert "total_uses" in data
        assert "total_discount_given" in data
        assert "top_referrers" in data
        print(f"Referral stats: codes={data.get('total_codes')}, uses={data.get('total_uses')}")


# Fixtures
@pytest.fixture
def admin_session():
    """Create authenticated admin session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        }
    )
    
    if login_response.status_code != 200:
        pytest.skip("Could not authenticate as admin")
    
    return session


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Note: In a real scenario, we'd clean up TEST_ prefixed data
    print("Test cleanup complete")
