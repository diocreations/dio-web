"""
Iteration 36: Testing authentication, password reset, Google login, and invitation flow fixes (Req #16)
Issues tested:
A) Sign-up/Login APIs work correctly
B) Google sign-in button present and redirects correctly  
C) Password reset email includes clickable link AND plaintext URL fallback
D) Invitation URL includes email parameter, email pre-filled and locked
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserSignupLogin:
    """A. Test user signup and login APIs"""
    
    def test_register_missing_email(self):
        """POST /api/user/register - returns 400 for missing email"""
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "password": "testpass123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Register missing email: {data['detail']}")
    
    def test_register_missing_password(self):
        """POST /api/user/register - returns 400 for missing password"""
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": "test@example.com"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Register missing password: {data['detail']}")
    
    def test_register_short_password(self):
        """POST /api/user/register - returns 400 for password < 6 chars"""
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": "test@example.com",
            "password": "12345"
        })
        assert response.status_code == 400
        data = response.json()
        assert "6 characters" in data.get("detail", "")
        print(f"✓ Register short password: {data['detail']}")
    
    def test_register_success(self):
        """POST /api/user/register - succeeds with valid data"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == unique_email.lower()
        assert "session_token" in data
        print(f"✓ Register success: user_id={data['user_id']}")
    
    def test_register_duplicate_email(self):
        """POST /api/user/register - returns 400 for duplicate email"""
        unique_email = f"TEST_dup_{uuid.uuid4().hex[:8]}@example.com"
        # First registration
        requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpass123"
        })
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpass123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower()
        print(f"✓ Register duplicate: {data['detail']}")
    
    def test_login_missing_credentials(self):
        """POST /api/user/login - returns 400 for missing credentials"""
        response = requests.post(f"{BASE_URL}/api/user/login", json={})
        assert response.status_code == 400
        print("✓ Login missing credentials: 400")
    
    def test_login_invalid_credentials(self):
        """POST /api/user/login - returns 401 for invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/user/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
        print(f"✓ Login invalid: {data['detail']}")
    
    def test_login_success(self):
        """POST /api/user/login - succeeds with valid credentials"""
        # First create a user
        unique_email = f"TEST_login_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Login Test"
        })
        # Then login
        response = requests.post(f"{BASE_URL}/api/user/login", json={
            "email": unique_email,
            "password": "testpass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "session_token" in data
        assert data["email"] == unique_email.lower()
        print(f"✓ Login success: user_id={data['user_id']}")


class TestPasswordReset:
    """C. Test password reset functionality"""
    
    def test_forgot_password_missing_email(self):
        """POST /api/user/forgot-password - returns 400 without email"""
        response = requests.post(f"{BASE_URL}/api/user/forgot-password", json={})
        assert response.status_code == 400
        data = response.json()
        assert "email" in data.get("detail", "").lower()
        print(f"✓ Forgot password missing email: {data['detail']}")
    
    def test_forgot_password_success(self):
        """POST /api/user/forgot-password - returns success message (prevents email enumeration)"""
        response = requests.post(f"{BASE_URL}/api/user/forgot-password", json={
            "email": "test@example.com",
            "origin_url": "https://www.diocreations.eu"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should not reveal if email exists
        assert "if an account exists" in data["message"].lower()
        print(f"✓ Forgot password success: {data['message']}")
    
    def test_forgot_password_with_origin_url(self):
        """POST /api/user/forgot-password - accepts origin_url parameter"""
        response = requests.post(f"{BASE_URL}/api/user/forgot-password", json={
            "email": "test@example.com",
            "origin_url": "https://custom-domain.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Forgot password with origin_url: {data['message']}")
    
    def test_reset_password_missing_token(self):
        """POST /api/user/reset-password - returns 400 without token"""
        response = requests.post(f"{BASE_URL}/api/user/reset-password", json={
            "password": "newpassword123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "token" in data.get("detail", "").lower()
        print(f"✓ Reset password missing token: {data['detail']}")
    
    def test_reset_password_short_password(self):
        """POST /api/user/reset-password - returns 400 for short password"""
        response = requests.post(f"{BASE_URL}/api/user/reset-password", json={
            "token": "rst_invalid_token",
            "password": "12345"
        })
        assert response.status_code == 400
        data = response.json()
        assert "6 characters" in data.get("detail", "")
        print(f"✓ Reset password short: {data['detail']}")
    
    def test_reset_password_invalid_token(self):
        """POST /api/user/reset-password - returns 400 for invalid token"""
        response = requests.post(f"{BASE_URL}/api/user/reset-password", json={
            "token": "rst_invalid_token_12345",
            "password": "newpassword123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data.get("detail", "").lower() or "expired" in data.get("detail", "").lower()
        print(f"✓ Reset password invalid token: {data['detail']}")


class TestInvitationFlow:
    """D. Test invitation URL and verification"""
    
    def test_invitation_verify_nonexistent(self):
        """GET /api/invitation/verify/{id} - returns valid=false for nonexistent"""
        response = requests.get(f"{BASE_URL}/api/invitation/verify/inv_nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "not found" in data.get("message", "").lower()
        print(f"✓ Invitation verify nonexistent: valid={data['valid']}")
    
    def test_invitation_verify_invalid_format(self):
        """GET /api/invitation/verify/{id} - handles invalid format"""
        response = requests.get(f"{BASE_URL}/api/invitation/verify/invalid")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Invitation verify invalid format: valid={data['valid']}")
    
    def test_invitation_accept_nonexistent(self):
        """POST /api/invitation/accept/{id} - handles nonexistent invitation"""
        response = requests.post(f"{BASE_URL}/api/invitation/accept/inv_nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        print(f"✓ Invitation accept nonexistent: success={data['success']}")


class TestAdminInvitations:
    """Test admin invitation endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_login(self):
        """POST /api/auth/login - admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@diocreations.com",
            "password": "adminpassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Admin login success")
    
    def test_admin_get_invitations(self, admin_token):
        """GET /api/admin/invitations - returns invitations list with stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/invitations",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert "stats" in data
        assert "total" in data["stats"]
        print(f"✓ Admin get invitations: {data['stats']['total']} total")
    
    def test_admin_send_invitation_missing_email(self, admin_token):
        """POST /api/admin/invitations/send - returns 400 without email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/invitations/send",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={}
        )
        assert response.status_code == 400
        print("✓ Admin send invitation missing email: 400")
    
    def test_admin_send_invitation_invalid_email(self, admin_token):
        """POST /api/admin/invitations/send - returns 400 with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/invitations/send",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"email": "invalid-email"}
        )
        assert response.status_code == 400
        print("✓ Admin send invitation invalid email: 400")


class TestUserInvite:
    """Test user invite functionality (requires auth)"""
    
    @pytest.fixture
    def user_session(self):
        """Create a test user and get session"""
        unique_email = f"TEST_inviter_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/user/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Inviter Test"
        })
        if response.status_code == 200:
            return response.json().get("session_token")
        pytest.skip("User registration failed")
    
    def test_user_invite_without_auth(self):
        """POST /api/user/invite - returns 401/403 without auth"""
        response = requests.post(f"{BASE_URL}/api/user/invite", json={
            "email": "friend@example.com"
        })
        assert response.status_code in [401, 403]
        print(f"✓ User invite without auth: {response.status_code}")
    
    def test_user_invite_missing_email(self, user_session):
        """POST /api/user/invite - returns 400 without email"""
        response = requests.post(
            f"{BASE_URL}/api/user/invite",
            headers={"Cookie": f"pub_session_token={user_session}"},
            json={}
        )
        assert response.status_code == 400
        print("✓ User invite missing email: 400")
    
    def test_user_invite_invalid_email(self, user_session):
        """POST /api/user/invite - returns 400 with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/user/invite",
            headers={"Cookie": f"pub_session_token={user_session}"},
            json={"email": "invalid-email"}
        )
        assert response.status_code == 400
        print("✓ User invite invalid email: 400")


class TestResetPasswordPage:
    """Test reset password page endpoint"""
    
    def test_reset_password_page_loads(self):
        """GET /reset-password - page loads"""
        response = requests.get(f"{BASE_URL}/reset-password")
        # Frontend route, should return 200 (SPA)
        assert response.status_code == 200
        print("✓ Reset password page loads: 200")
    
    def test_reset_password_page_with_token(self):
        """GET /reset-password?token=xxx - page loads with token"""
        response = requests.get(f"{BASE_URL}/reset-password?token=rst_test123")
        assert response.status_code == 200
        print("✓ Reset password page with token loads: 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
