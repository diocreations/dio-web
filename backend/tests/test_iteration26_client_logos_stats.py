"""
Iteration 26: Test Client Logos and Stats Section Features
- Client logos display on homepage
- Admin client logos CRUD operations
- Stats section positioning (below client logos)
- Favicon and site.webmanifest setup
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestClientLogosPublicAPI:
    """Test public client logos endpoint"""
    
    def test_get_client_logos_returns_list(self):
        """Public endpoint should return list of active client logos"""
        response = requests.get(f"{BASE_URL}/api/homepage/client-logos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} client logos")
    
    def test_client_logos_have_required_fields(self):
        """Each logo should have name, image_url, is_active, order"""
        response = requests.get(f"{BASE_URL}/api/homepage/client-logos")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            logo = data[0]
            assert "name" in logo
            assert "image_url" in logo
            assert "is_active" in logo
            assert "order" in logo
            print(f"✓ Logo has required fields: {logo.get('name')}")
    
    def test_default_logos_seeded(self):
        """Should have default logos (Google, Microsoft, Amazon, Meta, Apple)"""
        response = requests.get(f"{BASE_URL}/api/homepage/client-logos")
        assert response.status_code == 200
        data = response.json()
        names = [l.get("name") for l in data]
        expected = ["Google", "Microsoft", "Amazon", "Meta", "Apple"]
        for name in expected:
            assert name in names, f"Missing default logo: {name}"
        print(f"✓ All default logos present: {names}")


class TestClientLogosAdminAPI:
    """Test admin client logos endpoints (requires auth)"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        self.user = login_response.json()
        print(f"✓ Logged in as {self.user.get('email')}")
    
    def test_get_all_client_logos_admin(self):
        """Admin endpoint should return all logos including inactive"""
        response = self.session.get(f"{BASE_URL}/api/homepage/client-logos/all")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} client logos")
    
    def test_create_client_logo(self):
        """Should create a new client logo"""
        new_logo = {
            "name": "TEST_NewCompany",
            "image_url": "https://example.com/test-logo.png",
            "url": "https://example.com",
            "is_active": True
        }
        response = self.session.post(
            f"{BASE_URL}/api/homepage/client-logos",
            json=new_logo
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "TEST_NewCompany"
        assert "logo_id" in data
        self.created_logo_id = data.get("logo_id")
        print(f"✓ Created logo: {data.get('name')} with ID {self.created_logo_id}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/homepage/client-logos/{self.created_logo_id}")
    
    def test_update_client_logo(self):
        """Should update an existing client logo"""
        # First create a logo
        create_response = self.session.post(
            f"{BASE_URL}/api/homepage/client-logos",
            json={"name": "TEST_UpdateLogo", "image_url": "https://example.com/logo.png"}
        )
        logo_id = create_response.json().get("logo_id")
        
        # Update it
        update_response = self.session.put(
            f"{BASE_URL}/api/homepage/client-logos/{logo_id}",
            json={"name": "TEST_UpdatedLogo", "is_active": False}
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data.get("name") == "TEST_UpdatedLogo"
        assert data.get("is_active") == False
        print(f"✓ Updated logo: {data.get('name')}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/homepage/client-logos/{logo_id}")
    
    def test_delete_client_logo(self):
        """Should delete a client logo"""
        # First create a logo
        create_response = self.session.post(
            f"{BASE_URL}/api/homepage/client-logos",
            json={"name": "TEST_DeleteLogo", "image_url": "https://example.com/logo.png"}
        )
        logo_id = create_response.json().get("logo_id")
        
        # Delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/homepage/client-logos/{logo_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("message") == "Client logo deleted"
        print(f"✓ Deleted logo: {logo_id}")
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/homepage/client-logos/all")
        logos = get_response.json()
        logo_ids = [l.get("logo_id") for l in logos]
        assert logo_id not in logo_ids
        print(f"✓ Verified logo deleted from database")
    
    def test_reorder_client_logos(self):
        """Should reorder client logos"""
        # Get current logos
        get_response = self.session.get(f"{BASE_URL}/api/homepage/client-logos/all")
        logos = get_response.json()
        logo_ids = [l.get("logo_id") for l in logos]
        
        # Reverse order
        reversed_ids = list(reversed(logo_ids))
        reorder_response = self.session.put(
            f"{BASE_URL}/api/homepage/client-logos/reorder",
            json={"order": reversed_ids}
        )
        assert reorder_response.status_code == 200
        assert reorder_response.json().get("message") == "Client logos reordered"
        print(f"✓ Reordered logos")
        
        # Verify order changed
        verify_response = self.session.get(f"{BASE_URL}/api/homepage/client-logos")
        new_logos = verify_response.json()
        new_order = [l.get("logo_id") for l in new_logos]
        assert new_order == reversed_ids
        print(f"✓ Verified new order: {[l.get('name') for l in new_logos]}")
        
        # Restore original order
        self.session.put(
            f"{BASE_URL}/api/homepage/client-logos/reorder",
            json={"order": logo_ids}
        )


class TestHomepageContent:
    """Test homepage content API for stats and trust section"""
    
    def test_homepage_content_has_stats(self):
        """Homepage content should include stats settings"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        assert response.status_code == 200
        data = response.json()
        settings = data.get("settings", {})
        assert "show_stats" in settings
        assert "stats" in settings
        stats = settings.get("stats", [])
        assert len(stats) > 0
        print(f"✓ Stats found: {[s.get('label') for s in stats]}")
    
    def test_stats_have_value_and_label(self):
        """Each stat should have value and label"""
        response = requests.get(f"{BASE_URL}/api/homepage/content")
        data = response.json()
        stats = data.get("settings", {}).get("stats", [])
        for stat in stats:
            assert "value" in stat
            assert "label" in stat
        print(f"✓ All stats have value and label")


class TestFaviconSetup:
    """Test favicon and web manifest setup"""
    
    def test_site_webmanifest_accessible(self):
        """site.webmanifest should be accessible"""
        response = requests.get(f"{BASE_URL}/site.webmanifest")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "DIOCREATIONS"
        assert "icons" in data
        print(f"✓ site.webmanifest accessible with name: {data.get('name')}")
    
    def test_favicon_ico_accessible(self):
        """favicon.ico should be accessible"""
        response = requests.get(f"{BASE_URL}/favicon.ico")
        assert response.status_code == 200
        print(f"✓ favicon.ico accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
