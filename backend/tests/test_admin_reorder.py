"""
Test Admin Panel Reorder Features
Tests for:
1. PUT /api/services/reorder - Reorder services
2. PUT /api/blog/reorder - Reorder blog posts
3. PUT /api/portfolio/reorder - Reorder portfolio items
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestAdminReorderEndpoints:
    """Test reorder endpoints for admin panel drag-and-drop functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for admin user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@diocreations.com",
                "password": "adminpassword"
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping reorder tests")
        
        self.admin_data = login_response.json()
        # Store cookies for authenticated requests
        self.session.cookies.update(login_response.cookies)
    
    # ==================== SERVICES REORDER TESTS ====================
    
    def test_get_services(self):
        """GET /api/services - Retrieve all services"""
        response = self.session.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/services returned {len(data)} services")
        return data
    
    def test_services_reorder_success(self):
        """PUT /api/services/reorder - Reorder services successfully"""
        # First get current services
        get_response = self.session.get(f"{BASE_URL}/api/services")
        assert get_response.status_code == 200
        services = get_response.json()
        
        if len(services) < 2:
            pytest.skip("Need at least 2 services to test reorder")
        
        # Get original order
        original_ids = [s["service_id"] for s in services]
        print(f"Original order: {original_ids}")
        
        # Reverse the order
        reversed_ids = list(reversed(original_ids))
        print(f"New order: {reversed_ids}")
        
        # Call reorder endpoint
        reorder_response = self.session.put(
            f"{BASE_URL}/api/services/reorder",
            json={"order": reversed_ids}
        )
        
        assert reorder_response.status_code == 200
        data = reorder_response.json()
        assert data.get("message") == "Services reordered"
        print("✓ PUT /api/services/reorder returned success message")
        
        # Verify order was persisted by fetching again
        verify_response = self.session.get(f"{BASE_URL}/api/services")
        assert verify_response.status_code == 200
        new_services = verify_response.json()
        new_ids = [s["service_id"] for s in new_services]
        
        # Check that order field was updated
        assert new_ids == reversed_ids, f"Expected {reversed_ids}, got {new_ids}"
        print("✓ Services order verified - order persisted correctly")
        
        # Restore original order
        self.session.put(
            f"{BASE_URL}/api/services/reorder",
            json={"order": original_ids}
        )
        print("✓ Original order restored")
    
    # ==================== BLOG REORDER TESTS ====================
    
    def test_get_blog(self):
        """GET /api/blog - Retrieve all blog posts"""
        response = self.session.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/blog returned {len(data)} posts")
        return data
    
    def test_blog_reorder_success(self):
        """PUT /api/blog/reorder - Reorder blog posts successfully"""
        # First get current blog posts
        get_response = self.session.get(f"{BASE_URL}/api/blog")
        assert get_response.status_code == 200
        posts = get_response.json()
        
        if len(posts) < 2:
            pytest.skip("Need at least 2 blog posts to test reorder")
        
        # Get original order
        original_ids = [p["post_id"] for p in posts]
        print(f"Original blog order: {original_ids}")
        
        # Reverse the order
        reversed_ids = list(reversed(original_ids))
        print(f"New blog order: {reversed_ids}")
        
        # Call reorder endpoint
        reorder_response = self.session.put(
            f"{BASE_URL}/api/blog/reorder",
            json={"order": reversed_ids}
        )
        
        assert reorder_response.status_code == 200
        data = reorder_response.json()
        assert data.get("message") == "Blog posts reordered"
        print("✓ PUT /api/blog/reorder returned success message")
        
        # Verify order was persisted
        verify_response = self.session.get(f"{BASE_URL}/api/blog")
        assert verify_response.status_code == 200
        new_posts = verify_response.json()
        new_ids = [p["post_id"] for p in new_posts]
        
        assert new_ids == reversed_ids, f"Expected {reversed_ids}, got {new_ids}"
        print("✓ Blog order verified - order persisted correctly")
        
        # Restore original order
        self.session.put(
            f"{BASE_URL}/api/blog/reorder",
            json={"order": original_ids}
        )
        print("✓ Original blog order restored")
    
    # ==================== PORTFOLIO REORDER TESTS ====================
    
    def test_get_portfolio(self):
        """GET /api/portfolio - Retrieve all portfolio items"""
        response = self.session.get(f"{BASE_URL}/api/portfolio")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/portfolio returned {len(data)} items")
        return data
    
    def test_portfolio_reorder_success(self):
        """PUT /api/portfolio/reorder - Reorder portfolio items successfully"""
        # First get current portfolio items
        get_response = self.session.get(f"{BASE_URL}/api/portfolio")
        assert get_response.status_code == 200
        items = get_response.json()
        
        if len(items) < 2:
            pytest.skip("Need at least 2 portfolio items to test reorder")
        
        # Get original order
        original_ids = [i["portfolio_id"] for i in items]
        print(f"Original portfolio order: {original_ids}")
        
        # Reverse the order
        reversed_ids = list(reversed(original_ids))
        print(f"New portfolio order: {reversed_ids}")
        
        # Call reorder endpoint
        reorder_response = self.session.put(
            f"{BASE_URL}/api/portfolio/reorder",
            json={"order": reversed_ids}
        )
        
        assert reorder_response.status_code == 200
        data = reorder_response.json()
        assert data.get("message") == "Portfolio reordered"
        print("✓ PUT /api/portfolio/reorder returned success message")
        
        # Verify order was persisted
        verify_response = self.session.get(f"{BASE_URL}/api/portfolio")
        assert verify_response.status_code == 200
        new_items = verify_response.json()
        new_ids = [i["portfolio_id"] for i in new_items]
        
        assert new_ids == reversed_ids, f"Expected {reversed_ids}, got {new_ids}"
        print("✓ Portfolio order verified - order persisted correctly")
        
        # Restore original order
        self.session.put(
            f"{BASE_URL}/api/portfolio/reorder",
            json={"order": original_ids}
        )
        print("✓ Original portfolio order restored")
    
    # ==================== ERROR HANDLING TESTS ====================
    
    def test_services_reorder_empty_order(self):
        """PUT /api/services/reorder with empty order array"""
        response = self.session.put(
            f"{BASE_URL}/api/services/reorder",
            json={"order": []}
        )
        # Should not fail with empty array
        assert response.status_code == 200
        print("✓ Services reorder handles empty array gracefully")
    
    def test_blog_reorder_empty_order(self):
        """PUT /api/blog/reorder with empty order array"""
        response = self.session.put(
            f"{BASE_URL}/api/blog/reorder",
            json={"order": []}
        )
        assert response.status_code == 200
        print("✓ Blog reorder handles empty array gracefully")
    
    def test_portfolio_reorder_empty_order(self):
        """PUT /api/portfolio/reorder with empty order array"""
        response = self.session.put(
            f"{BASE_URL}/api/portfolio/reorder",
            json={"order": []}
        )
        assert response.status_code == 200
        print("✓ Portfolio reorder handles empty array gracefully")


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login - Admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@diocreations.com",
                "password": "adminpassword"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["email"] == "admin@diocreations.com"
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_password(self):
        """POST /api/auth/login - Admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@diocreations.com",
                "password": "wrongpassword"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401
        print("✓ Invalid password correctly rejected")
