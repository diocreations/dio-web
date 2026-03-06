"""
Iteration 32 Tests: Blog Newsletter, Landing Pages, Contact Form, Admin Features
Tests for:
1. Blog page newsletter subscription (not redirect to contact)
2. Landing pages: Resume Builder, Resume Analyzer, Cover Letter
3. Contact page new fields: company, service_interest, budget_range
4. Admin Landing Pages section
5. Admin SEO page with Resume Builder option
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNewsletterSubscription:
    """Newsletter subscription API tests"""
    
    def test_newsletter_subscribe_success(self):
        """Test newsletter subscription with valid email"""
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": f"TEST_newsletter_{os.urandom(4).hex()}@example.com",
            "source": "blog-page"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "subscribed" in data["message"].lower() or "already" in data["message"].lower()
    
    def test_newsletter_subscribe_invalid_email(self):
        """Test newsletter subscription with invalid email"""
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": "invalid-email",
            "source": "test"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_newsletter_subscribe_empty_email(self):
        """Test newsletter subscription with empty email"""
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": "",
            "source": "test"
        })
        assert response.status_code == 400


class TestContactFormNewFields:
    """Contact form with new fields: company, service_interest, budget_range"""
    
    def test_contact_submit_all_fields(self):
        """Test contact form submission with all new fields"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_Contact User",
            "email": "test_contact@example.com",
            "phone": "+1234567890",
            "company": "TEST Company Inc",
            "service_interest": "Web Development",
            "budget_range": "$5,000 - $10,000",
            "subject": "Test Inquiry",
            "message": "This is a test message with all new fields"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "submission_id" in data
        assert data["submission_id"].startswith("contact_")
    
    def test_contact_submit_minimal_fields(self):
        """Test contact form with only required fields"""
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_Minimal User",
            "email": "minimal@example.com",
            "subject": "Minimal Test",
            "message": "Minimal message"
        })
        assert response.status_code == 200
        data = response.json()
        assert "submission_id" in data
    
    def test_contact_submit_with_service_interest(self):
        """Test contact form with service interest dropdown value"""
        services = [
            "Web Development",
            "Mobile App Development",
            "SEO Services",
            "AI Solutions",
            "E-commerce Development",
            "Digital Marketing",
            "Resume Services",
            "Other"
        ]
        for service in services[:3]:  # Test first 3 services
            response = requests.post(f"{BASE_URL}/api/contact", json={
                "name": f"TEST_Service_{service}",
                "email": "service_test@example.com",
                "service_interest": service,
                "subject": f"Interest in {service}",
                "message": f"I'm interested in {service}"
            })
            assert response.status_code == 200
    
    def test_contact_submit_with_budget_range(self):
        """Test contact form with budget range dropdown value"""
        budgets = [
            "Under $1,000",
            "$1,000 - $5,000",
            "$5,000 - $10,000",
            "$10,000 - $25,000",
            "Not Sure Yet"
        ]
        for budget in budgets[:2]:  # Test first 2 budgets
            response = requests.post(f"{BASE_URL}/api/contact", json={
                "name": f"TEST_Budget_{budget}",
                "email": "budget_test@example.com",
                "budget_range": budget,
                "subject": "Budget Test",
                "message": f"My budget is {budget}"
            })
            assert response.status_code == 200


class TestLandingPagesAPI:
    """Landing pages API tests - pages may not exist yet but API should work"""
    
    def test_pages_list_endpoint(self):
        """Test GET /api/pages returns list"""
        response = requests.get(f"{BASE_URL}/api/pages")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_resume_builder_landing_page_fetch(self):
        """Test fetching resume-builder-landing page (may be 404 if not created)"""
        response = requests.get(f"{BASE_URL}/api/pages/resume-builder-landing")
        # Either 200 (page exists) or 404 (page not created yet)
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "slug" in data or "content" in data
    
    def test_resume_analyzer_landing_page_fetch(self):
        """Test fetching resume-analyzer-landing page"""
        response = requests.get(f"{BASE_URL}/api/pages/resume-analyzer-landing")
        assert response.status_code in [200, 404]
    
    def test_cover_letter_landing_page_fetch(self):
        """Test fetching cover-letter-landing page"""
        response = requests.get(f"{BASE_URL}/api/pages/cover-letter-landing")
        assert response.status_code in [200, 404]


class TestAdminSEOPages:
    """Admin SEO pages API tests"""
    
    def test_seo_global_endpoint(self):
        """Test GET /api/seo/global returns SEO settings"""
        response = requests.get(f"{BASE_URL}/api/seo/global")
        assert response.status_code == 200
        # Should return dict with SEO settings
        data = response.json()
        assert isinstance(data, dict)
    
    def test_seo_pages_endpoint(self):
        """Test GET /api/seo/pages returns page-specific SEO"""
        response = requests.get(f"{BASE_URL}/api/seo/pages")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_seo_page_resume_builder_info(self):
        """Test SEO for resume-builder-info page"""
        response = requests.get(f"{BASE_URL}/api/seo/pages/resume-builder-info")
        assert response.status_code == 200
    
    def test_seo_page_resume_analyzer_info(self):
        """Test SEO for resume-analyzer-info page"""
        response = requests.get(f"{BASE_URL}/api/seo/pages/resume-analyzer-info")
        assert response.status_code == 200
    
    def test_seo_page_cover_letter_info(self):
        """Test SEO for cover-letter-info page"""
        response = requests.get(f"{BASE_URL}/api/seo/pages/cover-letter-info")
        assert response.status_code == 200


class TestAdminAuthentication:
    """Admin authentication for protected endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        return session
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert "email" in data or "user" in data or "message" in data
    
    def test_admin_contact_submissions_list(self, admin_session):
        """Test admin can list contact submissions"""
        response = admin_session.get(f"{BASE_URL}/api/contact")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_newsletter_subscribers_list(self, admin_session):
        """Test admin can list newsletter subscribers"""
        response = admin_session.get(f"{BASE_URL}/api/admin/newsletter/subscribers")
        assert response.status_code == 200
        data = response.json()
        assert "subscribers" in data
        assert "stats" in data


class TestBlogEndpoint:
    """Blog endpoint tests"""
    
    def test_blog_list_published(self):
        """Test GET /api/blog with published_only=true"""
        response = requests.get(f"{BASE_URL}/api/blog?published_only=true")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_blog_list_all(self):
        """Test GET /api/blog returns all posts"""
        response = requests.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
