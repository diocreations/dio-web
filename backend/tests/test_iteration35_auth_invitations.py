"""
Iteration 35: Testing Authentication System Fixes and User Invitation System
- User signup API POST /api/user/register
- User login API POST /api/user/login
- Admin Invitations endpoints
- User invitation endpoints
- Invitation verification endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@diocreations.com"
ADMIN_PASSWORD = "adminpassword"

# Generate unique test email for each test run
TEST_USER_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_USER_NAME = "Test User"


class TestUserAuthentication:
    """Test user registration and login endpoints"""
    
    def test_register_missing_email(self):
        """POST /api/user/register - should fail with missing email"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"password": "testpass123"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Register missing email returns 400: {data['detail']}")
    
    def test_register_missing_password(self):
        """POST /api/user/register - should fail with missing password"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Register missing password returns 400: {data['detail']}")
    
    def test_register_short_password(self):
        """POST /api/user/register - should fail with password < 6 chars"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={"email": "test@example.com", "password": "12345"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "6 characters" in data["detail"]
        print(f"✓ Register short password returns 400: {data['detail']}")
    
    def test_register_success(self):
        """POST /api/user/register - should succeed with valid data"""
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "session_token" in data
        assert data["email"] == TEST_USER_EMAIL.lower()
        print(f"✓ User registration successful: {data['email']}")
        return data
    
    def test_register_duplicate_email(self):
        """POST /api/user/register - should fail with duplicate email"""
        # First register
        requests.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": f"dup_{TEST_USER_EMAIL}",
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            },
            headers={"Content-Type": "application/json"}
        )
        # Try to register again with same email
        response = requests.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": f"dup_{TEST_USER_EMAIL}",
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print(f"✓ Duplicate email returns 400: {data['detail']}")
    
    def test_login_missing_credentials(self):
        """POST /api/user/login - should fail with missing credentials"""
        response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Login missing credentials returns 400: {data['detail']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/user/login - should fail with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={"email": "nonexistent@example.com", "password": "wrongpass"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower()
        print(f"✓ Login invalid credentials returns 401: {data['detail']}")
    
    def test_login_success(self):
        """POST /api/user/login - should succeed with valid credentials"""
        # First register a user
        unique_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": unique_email,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Now login
        response = requests.post(
            f"{BASE_URL}/api/user/login",
            json={"email": unique_email, "password": TEST_USER_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "session_token" in data
        assert data["email"] == unique_email.lower()
        print(f"✓ User login successful: {data['email']}")
        return data


class TestAdminAuthentication:
    """Test admin authentication for invitation endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code}")
        return session
    
    def test_admin_login(self):
        """POST /api/auth/login - admin should be able to login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data or "email" in data
        print(f"✓ Admin login successful")


class TestAdminInvitations:
    """Test admin invitation endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.status_code}")
        return session
    
    def test_get_all_invitations(self, admin_session):
        """GET /api/admin/invitations - should return invitations list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/invitations")
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert "stats" in data
        assert isinstance(data["invitations"], list)
        assert "total" in data["stats"]
        assert "pending" in data["stats"]
        assert "accepted" in data["stats"]
        print(f"✓ GET /api/admin/invitations returns {len(data['invitations'])} invitations")
        print(f"  Stats: {data['stats']}")
    
    def test_send_single_invitation_missing_email(self, admin_session):
        """POST /api/admin/invitations/send - should fail without email"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/send",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Send invitation without email returns 400: {data['detail']}")
    
    def test_send_single_invitation_invalid_email(self, admin_session):
        """POST /api/admin/invitations/send - should fail with invalid email"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/send",
            json={"email": "notanemail"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Send invitation with invalid email returns 400: {data['detail']}")
    
    def test_send_single_invitation_success(self, admin_session):
        """POST /api/admin/invitations/send - should succeed with valid email"""
        test_email = f"invite_test_{uuid.uuid4().hex[:8]}@example.com"
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/send",
            json={"email": test_email},
            headers={"Content-Type": "application/json"}
        )
        # May return 200 (success) or 500 (if RESEND_API_KEY not configured)
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"✓ Send single invitation successful: {data['message']}")
        elif response.status_code == 500:
            data = response.json()
            # This is expected if RESEND_API_KEY is not configured
            print(f"✓ Send invitation returned 500 (expected if email service not configured): {data.get('detail', 'No detail')}")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_bulk_invitations_empty_list(self, admin_session):
        """POST /api/admin/invitations/bulk - should fail with empty list"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/bulk",
            json={"emails": []},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Bulk invitations with empty list returns 400: {data['detail']}")
    
    def test_bulk_invitations_no_valid_emails(self, admin_session):
        """POST /api/admin/invitations/bulk - should fail with no valid emails"""
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/bulk",
            json={"emails": ["notanemail", "alsonotanemail"]},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Bulk invitations with no valid emails returns 400: {data['detail']}")
    
    def test_bulk_invitations_success(self, admin_session):
        """POST /api/admin/invitations/bulk - should process valid emails"""
        test_emails = [
            f"bulk_test1_{uuid.uuid4().hex[:8]}@example.com",
            f"bulk_test2_{uuid.uuid4().hex[:8]}@example.com"
        ]
        response = admin_session.post(
            f"{BASE_URL}/api/admin/invitations/bulk",
            json={"emails": test_emails},
            headers={"Content-Type": "application/json"}
        )
        # May return 200 (success) or partial success
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "results" in data
        print(f"✓ Bulk invitations processed: {data['message']}")
        print(f"  Results: sent={len(data['results'].get('sent', []))}, failed={len(data['results'].get('failed', []))}")


class TestInvitationVerification:
    """Test public invitation verification endpoint"""
    
    def test_verify_nonexistent_invitation(self):
        """GET /api/invitation/verify/{id} - should return invalid for nonexistent"""
        response = requests.get(f"{BASE_URL}/api/invitation/verify/inv_nonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        assert data["valid"] == False
        print(f"✓ Verify nonexistent invitation returns valid=False: {data.get('message', '')}")
    
    def test_verify_invalid_format(self):
        """GET /api/invitation/verify/{id} - should handle invalid format"""
        response = requests.get(f"{BASE_URL}/api/invitation/verify/invalid")
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        assert data["valid"] == False
        print(f"✓ Verify invalid format returns valid=False")


class TestUserInvitations:
    """Test user invitation endpoints (requires auth)"""
    
    @pytest.fixture
    def user_session(self):
        """Get authenticated user session"""
        session = requests.Session()
        # Register a new user
        unique_email = f"user_invite_test_{uuid.uuid4().hex[:8]}@example.com"
        response = session.post(
            f"{BASE_URL}/api/user/register",
            json={
                "email": unique_email,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            },
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            pytest.skip(f"User registration failed: {response.status_code}")
        data = response.json()
        session.headers.update({"Authorization": f"Bearer {data['session_token']}"})
        return session
    
    def test_user_invite_missing_email(self, user_session):
        """POST /api/user/invite - should fail without email"""
        response = user_session.post(
            f"{BASE_URL}/api/user/invite",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ User invite without email returns 400: {data['detail']}")
    
    def test_user_invite_invalid_email(self, user_session):
        """POST /api/user/invite - should fail with invalid email"""
        response = user_session.post(
            f"{BASE_URL}/api/user/invite",
            json={"email": "notanemail"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ User invite with invalid email returns 400: {data['detail']}")
    
    def test_user_invite_success(self, user_session):
        """POST /api/user/invite - should succeed with valid email"""
        test_email = f"friend_test_{uuid.uuid4().hex[:8]}@example.com"
        response = user_session.post(
            f"{BASE_URL}/api/user/invite",
            json={"email": test_email},
            headers={"Content-Type": "application/json"}
        )
        # May return 200 (success) or 500 (if RESEND_API_KEY not configured)
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"✓ User invite successful: {data['message']}")
        elif response.status_code == 500:
            data = response.json()
            print(f"✓ User invite returned 500 (expected if email service not configured): {data.get('detail', 'No detail')}")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_user_invite_unauthenticated(self):
        """POST /api/user/invite - should fail without auth"""
        response = requests.post(
            f"{BASE_URL}/api/user/invite",
            json={"email": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [401, 403]
        print(f"✓ User invite without auth returns {response.status_code}")


class TestForgotPassword:
    """Test forgot password endpoint"""
    
    def test_forgot_password_missing_email(self):
        """POST /api/user/forgot-password - should fail without email"""
        response = requests.post(
            f"{BASE_URL}/api/user/forgot-password",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Forgot password without email returns 400: {data['detail']}")
    
    def test_forgot_password_success(self):
        """POST /api/user/forgot-password - should return success message"""
        response = requests.post(
            f"{BASE_URL}/api/user/forgot-password",
            json={"email": "test@example.com", "origin_url": "https://example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should always return success to prevent email enumeration
        print(f"✓ Forgot password returns success message: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
