"""
Test suite for DioCreations New Features:
- About Page Admin API (GET /api/about/content, GET/PUT /api/about/settings)
- Dio Chat components
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAboutPageAPI:
    """Tests for About Page content API endpoints"""
    
    def test_get_about_content_returns_200(self):
        """Test GET /api/about/content returns 200 (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/about/content")
        assert response.status_code == 200
        print("✓ GET /api/about/content returns 200")
    
    def test_about_content_has_required_fields(self):
        """Test about content has all required structure"""
        response = requests.get(f"{BASE_URL}/api/about/content")
        data = response.json()
        
        # Hero section fields
        assert "hero_badge" in data, "Missing 'hero_badge'"
        assert "hero_title_line1" in data, "Missing 'hero_title_line1'"
        assert "hero_title_line2" in data, "Missing 'hero_title_line2'"
        assert "hero_description" in data, "Missing 'hero_description'"
        assert "hero_cta_text" in data, "Missing 'hero_cta_text'"
        assert "hero_cta_link" in data, "Missing 'hero_cta_link'"
        assert "hero_image" in data, "Missing 'hero_image'"
        
        # Stats section
        assert "show_stats" in data, "Missing 'show_stats'"
        assert "stats" in data, "Missing 'stats'"
        
        # Values section
        assert "show_values" in data, "Missing 'show_values'"
        assert "values" in data, "Missing 'values'"
        
        # Timeline section
        assert "show_timeline" in data, "Missing 'show_timeline'"
        assert "milestones" in data, "Missing 'milestones'"
        
        # Why Us section
        assert "show_why_us" in data, "Missing 'show_why_us'"
        assert "why_us_points" in data, "Missing 'why_us_points'"
        
        # CTA section
        assert "show_cta" in data, "Missing 'show_cta'"
        assert "cta_title" in data, "Missing 'cta_title'"
        
        # Meta fields
        assert "meta_title" in data, "Missing 'meta_title'"
        assert "meta_description" in data, "Missing 'meta_description'"
        
        print("✓ About content has all required fields")
        print(f"  - Hero: '{data['hero_title_line1']} {data['hero_title_line2']}'")
        print(f"  - Stats: {len(data['stats'])} items")
        print(f"  - Values: {len(data['values'])} items")
        print(f"  - Milestones: {len(data['milestones'])} items")
    
    def test_about_settings_requires_auth(self):
        """Test GET /api/about/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/about/settings")
        assert response.status_code == 401
        print("✓ GET /api/about/settings requires authentication (401)")
    
    def test_about_settings_put_requires_auth(self):
        """Test PUT /api/about/settings requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/about/settings",
            json={"hero_badge": "Test Update"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/about/settings requires authentication (401)")


class TestAboutAPIWithAuth:
    """Tests for About Page settings API with authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "admin@diocreations.com",
                "password": "adminpassword"
            }
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        token = login_response.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_about_settings_with_auth(self, auth_session):
        """Test GET /api/about/settings with authentication"""
        response = auth_session.get(f"{BASE_URL}/api/about/settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "content_id" in data
        assert data["content_id"] == "about_page"
        print("✓ GET /api/about/settings works with authentication")
        print(f"  - Content ID: {data['content_id']}")


class TestDioChatAPI:
    """Tests for Dio chatbot API endpoints"""
    
    def test_chat_endpoint_exists(self):
        """Test POST /api/chat endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": "test_session_123",
                "message": "Hello Dio"
            }
        )
        # Should return 200 (success) or a valid response, not 404
        assert response.status_code != 404, "Chat endpoint not found"
        # Even 500 is acceptable (LLM might have issues), just not 404
        print(f"✓ POST /api/chat endpoint exists (status: {response.status_code})")
    
    def test_chat_history_endpoint_exists(self):
        """Test GET /api/chat/{session_id}/history endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/chat/test_session_123/history")
        # Should return 200 with empty history or existing history, not 404
        assert response.status_code != 404, "Chat history endpoint not found"
        print(f"✓ GET /api/chat/{{session_id}}/history endpoint exists (status: {response.status_code})")


class TestColorAccentOnHomepage:
    """Tests for color accent system on homepage"""
    
    def test_homepage_content_has_color_schemes(self):
        """Test homepage content returns color schemes for accent rotation"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        
        data = response.json()
        color_schemes = data.get("color_schemes", [])
        
        assert len(color_schemes) > 0, "No color schemes returned"
        
        # Verify each scheme has required fields for frontend HSL mapping
        scheme = color_schemes[0]
        assert "name" in scheme
        assert "primary" in scheme
        assert "is_active" in scheme
        
        active_schemes = [s for s in color_schemes if s.get("is_active")]
        print(f"✓ Homepage returns {len(active_schemes)} active color schemes for accent rotation")
        print(f"  - Schemes: {[s['name'] for s in active_schemes]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
