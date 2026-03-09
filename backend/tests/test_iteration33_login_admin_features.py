"""
Test Iteration 33: Login flow improvements and Admin Paid Users management
- Diocreations Login branding
- Forgot Password flow
- Reset Password flow
- Admin Paid Users management (grant/revoke access)
- Resume upload similarity-based deduplication
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestForgotPasswordFlow:
    """Test forgot password and reset password endpoints"""
    
    def test_forgot_password_endpoint_exists(self):
        """Test POST /api/user/forgot-password endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/user/forgot-password",
            json={"email": "test@example.com", "origin_url": "https://test.com"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 even for non-existent email (to prevent enumeration)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Forgot password response: {data['message']}")
    
    def test_forgot_password_missing_email(self):
        """Test forgot password with missing email"""
        response = requests.post(
            f"{BASE_URL}/api/user/forgot-password",
            json={"origin_url": "https://test.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✅ Forgot password correctly rejects missing email")
    
    def test_reset_password_missing_token(self):
        """Test reset password with missing token"""
        response = requests.post(
            f"{BASE_URL}/api/user/reset-password",
            json={"password": "newpassword123"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✅ Reset password correctly rejects missing token")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/user/reset-password",
            json={"token": "invalid_token_123", "password": "newpassword123"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Invalid" in data.get("detail", "") or "expired" in data.get("detail", "").lower()
        print("✅ Reset password correctly rejects invalid token")
    
    def test_reset_password_short_password(self):
        """Test reset password with short password"""
        response = requests.post(
            f"{BASE_URL}/api/user/reset-password",
            json={"token": "some_token", "password": "123"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✅ Reset password correctly rejects short password")


class TestAdminPaidUsersManagement:
    """Test admin endpoints for managing paid users"""
    
    @pytest.fixture
    def admin_session(self):
        """Login as admin and return session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"},
            headers={"Content-Type": "application/json"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        return session
    
    def test_get_paid_users_list(self, admin_session):
        """Test GET /api/admin/resume/paid-users endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/resume/paid-users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Paid users list returned {len(data)} users")
    
    def test_grant_access_missing_resume_id(self, admin_session):
        """Test grant access with missing resume_id"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/resume/grant-access",
            json={"email": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✅ Grant access correctly rejects missing resume_id")
    
    def test_grant_access_nonexistent_resume(self, admin_session):
        """Test grant access for non-existent resume"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/resume/grant-access",
            json={"resume_id": "nonexistent_resume_123", "email": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        print("✅ Grant access correctly rejects non-existent resume")
    
    def test_revoke_access_nonexistent(self, admin_session):
        """Test revoke access for non-existent payment"""
        response = admin_session.delete(
            f"{BASE_URL}/api/admin/resume/revoke-access/nonexistent_resume_123"
        )
        assert response.status_code == 404
        print("✅ Revoke access correctly handles non-existent payment")
    
    def test_admin_resume_list(self, admin_session):
        """Test GET /api/admin/resume/list endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/resume/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Admin resume list returned {len(data)} resumes")
    
    def test_admin_resume_pricing(self, admin_session):
        """Test GET /api/admin/resume/pricing endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/resume/pricing")
        assert response.status_code == 200
        data = response.json()
        assert "price" in data
        assert "currency" in data
        print(f"✅ Admin pricing: {data.get('currency')} {data.get('price')}")


class TestResumeUploadDeduplication:
    """Test resume upload with similarity-based deduplication"""
    
    def test_resume_upload_endpoint_exists(self):
        """Test that resume upload endpoint exists"""
        # Just check the endpoint responds (without actually uploading)
        response = requests.post(
            f"{BASE_URL}/api/resume/upload",
            data={}  # Empty data should return error
        )
        # Should return 400 or 422 for missing file, not 404
        assert response.status_code in [400, 422]
        print("✅ Resume upload endpoint exists")
    
    def test_resume_pricing_public(self):
        """Test public pricing endpoint"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200
        data = response.json()
        assert "price" in data
        assert "currency" in data
        assert "pricing_enabled" in data
        print(f"✅ Public pricing: {data.get('currency')} {data.get('price')}, enabled: {data.get('pricing_enabled')}")


class TestUserAuthentication:
    """Test user authentication endpoints"""
    
    def test_user_login_endpoint(self):
        """Test user login endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 for invalid credentials, not 404
        assert response.status_code == 401
        print("✅ User login endpoint works (returns 401 for invalid credentials)")
    
    def test_user_register_endpoint(self):
        """Test user register endpoint exists"""
        # Use unique email to avoid conflicts
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": unique_email, "password": "testpassword123", "name": "Test User"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 for successful registration
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "session_token" in data
        print(f"✅ User registration works - created user: {data.get('user_id')}")
    
    def test_user_register_duplicate_email(self):
        """Test user register with duplicate email"""
        # First registration
        unique_email = f"test_dup_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": unique_email, "password": "testpassword123", "name": "Test User"},
            headers={"Content-Type": "application/json"}
        )
        # Second registration with same email
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": unique_email, "password": "testpassword123", "name": "Test User 2"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        print("✅ User registration correctly rejects duplicate email")


class TestAdminAuthentication:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        print(f"✅ Admin login successful: {data.get('email')}")
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✅ Admin login correctly rejects wrong password")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
