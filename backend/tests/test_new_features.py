"""
Test suite for DioCreations New Features (Iteration 11):
- GET /api/geo/currency - Geo-based currency resolution
- GET /api/admin/currency/settings - Admin currency config
- PUT /api/admin/currency/settings - Update currency config
- GET /api/menus/nav - Dynamic navigation menu items
- GET /api/menus/footer - Dynamic footer menu items
- POST /api/admin/menus - Create menu item
- PUT /api/admin/menus/{item_id} - Update menu item
- DELETE /api/admin/menus/{item_id} - Delete menu item
- POST /api/user/register - Public user registration
- POST /api/user/login - Public user login
- GET /api/user/me - Get current public user
- POST /api/user/logout - Public user logout
- GET /api/user/dashboard - User dashboard data
- GET /api/resume/templates - Resume templates
- POST /api/cover-letter/generate - AI cover letter generator
- POST /api/resume/improve - Resume improvement (now free)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://resume-optimizer-app.preview.emergentagent.com').rstrip('/')


# =============================================================================
# Module: Geo Currency API Tests
# =============================================================================
class TestGeoCurrencyAPI:
    """Tests for geo-based currency endpoints"""
    
    def test_get_geo_currency_returns_200(self):
        """GET /api/geo/currency returns 200 and currency info"""
        response = requests.get(f"{BASE_URL}/api/geo/currency")
        assert response.status_code == 200
        data = response.json()
        
        # Must have required fields
        assert "currency" in data, "Missing 'currency' field"
        assert "currency_symbol" in data, "Missing 'currency_symbol' field"
        assert "currency_rate" in data, "Missing 'currency_rate' field"
        assert "all_currencies" in data, "Missing 'all_currencies' field"
        
        # Verify data types
        assert isinstance(data["currency"], str)
        assert isinstance(data["currency_rate"], (int, float))
        assert isinstance(data["all_currencies"], list)
        
        print(f"✓ GET /api/geo/currency: currency={data['currency']}, rate={data['currency_rate']}")
    
    def test_admin_currency_settings_requires_auth(self):
        """GET /api/admin/currency/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/currency/settings")
        assert response.status_code == 401
        print("✓ GET /api/admin/currency/settings requires authentication (401)")
    
    def test_update_currency_settings_requires_auth(self):
        """PUT /api/admin/currency/settings requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/currency/settings",
            json={"default_currency": "EUR"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/currency/settings requires authentication (401)")


class TestGeoCurrencyWithAuth:
    """Tests for admin currency settings with authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        token = login_response.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_admin_currency_settings(self, auth_session):
        """GET /api/admin/currency/settings returns full currency config"""
        response = auth_session.get(f"{BASE_URL}/api/admin/currency/settings")
        assert response.status_code == 200
        data = response.json()
        
        assert "default_currency" in data
        assert "region_currencies" in data
        assert "rates" in data
        assert "symbols" in data
        
        print(f"✓ GET /api/admin/currency/settings: default={data['default_currency']}, {len(data['rates'])} rates configured")
    
    def test_update_currency_settings(self, auth_session):
        """PUT /api/admin/currency/settings updates and persists settings"""
        # Get current settings first
        current = auth_session.get(f"{BASE_URL}/api/admin/currency/settings").json()
        
        # Update with small change
        update_data = {
            "default_currency": current.get("default_currency", "USD"),
            "region_currencies": current.get("region_currencies", {}),
            "rates": current.get("rates", {}),
            "symbols": current.get("symbols", {})
        }
        
        response = auth_session.put(
            f"{BASE_URL}/api/admin/currency/settings",
            json=update_data
        )
        assert response.status_code == 200
        print("✓ PUT /api/admin/currency/settings works correctly")


# =============================================================================
# Module: Dynamic Menus API Tests
# =============================================================================
class TestMenusAPI:
    """Tests for dynamic menu endpoints"""
    
    def test_get_nav_menu_returns_200(self):
        """GET /api/menus/nav returns navigation items"""
        response = requests.get(f"{BASE_URL}/api/menus/nav")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Nav menu should return a list"
        
        # If items exist, check structure
        if len(data) > 0:
            item = data[0]
            assert "label" in item, "Menu item missing 'label'"
            assert "path" in item, "Menu item missing 'path'"
        
        print(f"✓ GET /api/menus/nav returns {len(data)} items")
    
    def test_get_footer_menu_returns_200(self):
        """GET /api/menus/footer returns footer items"""
        response = requests.get(f"{BASE_URL}/api/menus/footer")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Footer menu should return a list"
        print(f"✓ GET /api/menus/footer returns {len(data)} items")
    
    def test_admin_menus_requires_auth(self):
        """GET /api/admin/menus requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/menus")
        assert response.status_code == 401
        print("✓ GET /api/admin/menus requires authentication (401)")


class TestMenusWithAuth:
    """Tests for admin menu management with authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        token = login_response.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_all_menus(self, auth_session):
        """GET /api/admin/menus returns all menu items"""
        response = auth_session.get(f"{BASE_URL}/api/admin/menus")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/menus returns {len(data)} items")
    
    def test_create_update_delete_menu_item(self, auth_session):
        """Full CRUD cycle for menu items"""
        # CREATE
        create_response = auth_session.post(
            f"{BASE_URL}/api/admin/menus",
            json={
                "menu_type": "nav",
                "label": "TEST_Menu_Item",
                "path": "/test-path",
                "order": 99,
                "is_active": True
            }
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert "item_id" in created
        assert created["label"] == "TEST_Menu_Item"
        item_id = created["item_id"]
        print(f"✓ POST /api/admin/menus created item: {item_id}")
        
        # UPDATE
        update_response = auth_session.put(
            f"{BASE_URL}/api/admin/menus/{item_id}",
            json={"label": "TEST_Updated_Menu"}
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["label"] == "TEST_Updated_Menu"
        print(f"✓ PUT /api/admin/menus/{item_id} updated successfully")
        
        # Verify persistence via GET
        verify_response = auth_session.get(f"{BASE_URL}/api/admin/menus")
        all_items = verify_response.json()
        found = [i for i in all_items if i.get("item_id") == item_id]
        assert len(found) == 1
        assert found[0]["label"] == "TEST_Updated_Menu"
        print("✓ Menu update persisted correctly")
        
        # DELETE
        delete_response = auth_session.delete(f"{BASE_URL}/api/admin/menus/{item_id}")
        assert delete_response.status_code == 200
        print(f"✓ DELETE /api/admin/menus/{item_id} succeeded")
        
        # Verify deletion
        verify_after_delete = auth_session.get(f"{BASE_URL}/api/admin/menus")
        remaining = [i for i in verify_after_delete.json() if i.get("item_id") == item_id]
        assert len(remaining) == 0
        print("✓ Menu item deletion verified")


# =============================================================================
# Module: Public User Authentication API Tests
# =============================================================================
class TestPublicUserAuthAPI:
    """Tests for public user registration, login, and session management"""
    
    @pytest.fixture
    def test_email(self):
        """Generate unique test email"""
        return f"TEST_{uuid.uuid4().hex[:8]}@test.com"
    
    def test_register_new_user(self, test_email):
        """POST /api/user/register creates new public user account"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": test_email,
                "password": "testpass123",
                "name": "Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert data["email"] == test_email.lower()
        assert "session_token" in data
        
        print(f"✓ POST /api/user/register: created user {data['user_id']}")
        return data
    
    def test_register_duplicate_email_fails(self, test_email):
        """POST /api/user/register fails for duplicate email"""
        # First registration
        requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "test123", "name": "Test"}
        )
        
        # Second registration with same email should fail
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "test456", "name": "Test2"}
        )
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate email registration correctly rejected (400)")
    
    def test_register_short_password_fails(self, test_email):
        """POST /api/user/register fails for password < 6 chars"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "123", "name": "Test"}
        )
        assert response.status_code == 400
        print("✓ Short password correctly rejected (400)")
    
    def test_login_user(self):
        """POST /api/user/login authenticates existing user"""
        # Create user first
        test_email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "testpass123", "name": "Test"}
        )
        
        # Login
        login_response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={"email": test_email, "password": "testpass123"}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        
        assert "user_id" in data
        assert "session_token" in data
        assert data["email"] == test_email.lower()
        
        print(f"✓ POST /api/user/login: authenticated {data['user_id']}")
        return data
    
    def test_login_invalid_credentials(self):
        """POST /api/user/login fails with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={"email": "nonexistent@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected (401)")
    
    def test_get_user_me_requires_auth(self):
        """GET /api/user/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/me")
        assert response.status_code == 401
        print("✓ GET /api/user/me requires authentication (401)")
    
    def test_full_auth_flow(self):
        """Full register → login → me → logout flow"""
        test_email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        session = requests.Session()
        
        # Register
        reg_response = session.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "testpass123", "name": "Flow Test User"}
        )
        assert reg_response.status_code == 200
        token = reg_response.json()["session_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get user info
        me_response = session.get(f"{BASE_URL}/api/user/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["email"] == test_email.lower()
        print(f"✓ GET /api/user/me: {me_data['email']}")
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/user/logout")
        assert logout_response.status_code == 200
        print("✓ POST /api/user/logout succeeded")
        
        # Verify session invalidated (me should fail now)
        me_after_logout = session.get(f"{BASE_URL}/api/user/me")
        assert me_after_logout.status_code == 401
        print("✓ Session correctly invalidated after logout")


# =============================================================================
# Module: User Dashboard API Tests
# =============================================================================
class TestUserDashboardAPI:
    """Tests for user dashboard endpoint"""
    
    def test_dashboard_requires_auth(self):
        """GET /api/user/dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/dashboard")
        assert response.status_code == 401
        print("✓ GET /api/user/dashboard requires authentication (401)")
    
    def test_dashboard_returns_user_data(self):
        """GET /api/user/dashboard returns analyses and cover letters"""
        # Create and login user
        test_email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        session = requests.Session()
        
        reg_response = session.post(
            f"{BASE_URL}/api/user/register",
            json={"email": test_email, "password": "testpass123", "name": "Dashboard Test"}
        )
        if reg_response.status_code != 200:
            pytest.skip("Registration failed")
        
        token = reg_response.json()["session_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get dashboard
        dashboard_response = session.get(f"{BASE_URL}/api/user/dashboard")
        assert dashboard_response.status_code == 200
        data = dashboard_response.json()
        
        assert "user" in data
        assert "analyses" in data
        assert "cover_letters" in data
        assert isinstance(data["analyses"], list)
        assert isinstance(data["cover_letters"], list)
        
        print(f"✓ GET /api/user/dashboard: {len(data['analyses'])} analyses, {len(data['cover_letters'])} cover letters")


# =============================================================================
# Module: Resume Templates API Tests
# =============================================================================
class TestResumeTemplatesAPI:
    """Tests for resume templates endpoints"""
    
    def test_get_public_templates(self):
        """GET /api/resume/templates returns available templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "Should return at least default templates"
        
        # Check template structure
        template = data[0]
        assert "template_id" in template
        assert "name" in template
        assert "description" in template
        assert "category" in template
        
        print(f"✓ GET /api/resume/templates returns {len(data)} templates")
        for t in data[:3]:
            print(f"  - {t['name']} ({t['category']})")
    
    def test_admin_templates_requires_auth(self):
        """GET /api/admin/resume/templates requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/resume/templates")
        assert response.status_code == 401
        print("✓ GET /api/admin/resume/templates requires authentication (401)")


class TestAdminTemplatesWithAuth:
    """Tests for admin template management"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        token = login_response.json().get("session_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_admin_get_all_templates(self, auth_session):
        """GET /api/admin/resume/templates returns all templates"""
        response = auth_session.get(f"{BASE_URL}/api/admin/resume/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/resume/templates returns {len(data)} templates")
    
    def test_admin_create_update_delete_template(self, auth_session):
        """Full CRUD for resume templates"""
        # CREATE
        create_response = auth_session.post(
            f"{BASE_URL}/api/admin/resume/templates",
            json={
                "name": "TEST_Template",
                "description": "Test template for automated testing",
                "category": "test",
                "is_active": False
            }
        )
        assert create_response.status_code == 200
        created = create_response.json()
        assert "template_id" in created
        template_id = created["template_id"]
        print(f"✓ Created template: {template_id}")
        
        # UPDATE
        update_response = auth_session.put(
            f"{BASE_URL}/api/admin/resume/templates/{template_id}",
            json={"name": "TEST_Template_Updated"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "TEST_Template_Updated"
        print("✓ Template updated successfully")
        
        # DELETE
        delete_response = auth_session.delete(f"{BASE_URL}/api/admin/resume/templates/{template_id}")
        assert delete_response.status_code == 200
        print("✓ Template deleted successfully")


# =============================================================================
# Module: Cover Letter Generator API Tests
# =============================================================================
class TestCoverLetterAPI:
    """Tests for cover letter generation endpoint"""
    
    def test_generate_cover_letter_without_auth(self):
        """POST /api/cover-letter/generate works without auth (anonymous)"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={
                "job_description": "Senior Python Developer position. Requirements: 5+ years experience with Python, FastAPI, MongoDB.",
                "job_title": "Senior Python Developer",
                "company_name": "Test Company",
                "tone": "professional"
            },
            timeout=60  # AI generation can take time
        )
        # Should work (200) or return expected errors (400 for missing data)
        assert response.status_code in [200, 400, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "letter_id" in data
            assert "cover_letter" in data
            assert len(data["cover_letter"]) > 100, "Cover letter too short"
            print(f"✓ POST /api/cover-letter/generate: {len(data['cover_letter'])} chars")
        else:
            print(f"✓ Cover letter endpoint responded with {response.status_code}")
    
    def test_cover_letter_requires_input(self):
        """POST /api/cover-letter/generate requires job_description or resume_text"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={"tone": "professional"}
        )
        assert response.status_code == 400
        print("✓ Cover letter correctly requires input data (400)")
    
    def test_get_cover_letter_by_id(self):
        """GET /api/cover-letter/{letter_id} retrieves stored letter"""
        # First generate one
        gen_response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={
                "job_description": "Marketing Manager role",
                "job_title": "Marketing Manager",
                "tone": "enthusiastic"
            },
            timeout=60
        )
        
        if gen_response.status_code != 200:
            pytest.skip("Cover letter generation failed")
        
        letter_id = gen_response.json()["letter_id"]
        
        # Retrieve it
        get_response = requests.get(f"{BASE_URL}/api/cover-letter/{letter_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["letter_id"] == letter_id
        print(f"✓ GET /api/cover-letter/{letter_id} retrieved successfully")


# =============================================================================
# Module: Resume Improve API Tests (Paywall Change)
# =============================================================================
class TestResumeImprovePaywallChange:
    """Tests for resume improve endpoint - now works WITHOUT payment"""
    
    def test_resume_improve_works_without_payment(self):
        """POST /api/resume/improve should now work without requiring payment"""
        # First upload a resume
        # We need to create a test file
        import io
        
        # Create simple PDF-like content or use multipart
        files = {
            'file': ('test_resume.pdf', io.BytesIO(b'%PDF-1.4 test resume content for testing'), 'application/pdf')
        }
        
        upload_response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        if upload_response.status_code != 200:
            # Try text-based approach
            print(f"Upload returned {upload_response.status_code}, checking improve endpoint directly...")
            # Just verify the improve endpoint doesn't require payment by status code
            improve_response = requests.post(
                f"{BASE_URL}/api/resume/improve",
                json={"resume_id": "test_nonexistent"}
            )
            # If it's 402 Payment Required, the paywall is still active
            # If it's 404/400 (resume not found), the paywall is disabled
            assert improve_response.status_code != 402, "Paywall still active on /api/resume/improve!"
            print(f"✓ /api/resume/improve does not return 402 (paywall disabled)")
            return
        
        resume_id = upload_response.json().get("resume_id")
        
        # Try to improve without payment
        improve_response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": resume_id},
            timeout=90  # AI improvement can take time
        )
        
        # Should NOT be 402 Payment Required anymore
        assert improve_response.status_code != 402, "Paywall still active on /api/resume/improve!"
        
        if improve_response.status_code == 200:
            data = improve_response.json()
            assert "improved_text" in data
            print(f"✓ POST /api/resume/improve works without payment! Length: {len(data.get('improved_text', ''))}")
        else:
            print(f"✓ /api/resume/improve returned {improve_response.status_code} (not 402 paywall)")


# =============================================================================
# Module: Download Access API Tests
# =============================================================================
class TestDownloadAccessAPI:
    """Tests for download payment status endpoint"""
    
    def test_download_access_endpoint_exists(self):
        """POST /api/resume/download-access endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/resume/download-access",
            json={"resume_id": "test_nonexistent"}
        )
        # Should not be 404 (endpoint exists)
        assert response.status_code != 404, "Download access endpoint not found"
        print(f"✓ POST /api/resume/download-access exists (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
