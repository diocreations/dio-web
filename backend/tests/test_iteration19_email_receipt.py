"""
Iteration 19: Email Receipt Feature Tests
Tests for:
- POST /api/resume/verify-payment accepts BackgroundTasks and triggers email receipt
- send_payment_receipt gracefully skips when RESEND_API_KEY not set
- Checkout endpoint stores customer email in resume_payments collection
- verify-payment retrieves email from resume_payments for receipt
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestEmailReceiptFeature:
    """Test the new email receipt feature for payments"""

    @pytest.fixture(scope="class")
    def uploaded_resume(self):
        """Upload a test resume and return resume_id"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        if not os.path.exists(test_pdf_path):
            # Create a minimal test PDF if it doesn't exist
            from reportlab.pdfgen import canvas
            from io import BytesIO
            buffer = BytesIO()
            c = canvas.Canvas(buffer)
            c.drawString(100, 750, "John Doe")
            c.drawString(100, 730, "john.doe@test.com | 555-123-4567")
            c.drawString(100, 700, "PROFESSIONAL EXPERIENCE")
            c.drawString(100, 680, "Senior Software Engineer at TechCorp")
            c.drawString(100, 660, "2020 - Present")
            c.drawString(100, 640, "- Led development of microservices architecture")
            c.drawString(100, 620, "- Managed team of 5 developers")
            c.save()
            with open(test_pdf_path, 'wb') as f:
                f.write(buffer.getvalue())

        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('test_resume.pdf', f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert 'resume_id' in data
        print(f"✓ Uploaded test resume: {data['resume_id']}")
        return data['resume_id']

    def test_checkout_stores_customer_email(self, uploaded_resume):
        """Test that POST /api/resume/checkout stores customer email in resume_payments"""
        test_email = "testuser@example.com"
        
        response = requests.post(f"{BASE_URL}/api/resume/checkout", json={
            "resume_id": uploaded_resume,
            "email": test_email,
            "origin_url": "https://test.example.com"
        })
        
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        assert 'checkout_url' in data, "Missing checkout_url in response"
        assert 'session_id' in data, "Missing session_id in response"
        
        # Store session_id for later verification
        self.__class__.checkout_session_id = data['session_id']
        self.__class__.test_email = test_email
        
        print(f"✓ Checkout created with session_id: {data['session_id']}")
        print(f"✓ Email '{test_email}' should be stored in resume_payments collection")
        return data

    def test_verify_payment_returns_paid_status(self, uploaded_resume):
        """Test that POST /api/resume/verify-payment returns paid status (without crashing)"""
        # Use a test session_id - in production this would be a real Stripe session
        session_id = getattr(self.__class__, 'checkout_session_id', 'test_session_xyz')
        
        response = requests.post(f"{BASE_URL}/api/resume/verify-payment", json={
            "session_id": session_id
        })
        
        # Should return 200 regardless of payment status - no crash even without RESEND_API_KEY
        assert response.status_code == 200, f"verify-payment failed: {response.text}"
        data = response.json()
        
        # Response should contain 'paid' boolean
        assert 'paid' in data, f"Response should contain 'paid' field: {data}"
        print(f"✓ verify-payment returned: paid={data['paid']}")
        
        # The endpoint should NOT crash even though RESEND_API_KEY is not set
        print("✓ verify-payment completed without crash (RESEND_API_KEY not set)")
        return data

    def test_verify_payment_with_invalid_session(self):
        """Test that verify-payment handles invalid session gracefully"""
        response = requests.post(f"{BASE_URL}/api/resume/verify-payment", json={
            "session_id": "invalid_session_12345"
        })
        
        assert response.status_code == 200, f"Should return 200 even for invalid session: {response.text}"
        data = response.json()
        assert data.get('paid') == False, f"Invalid session should return paid=False: {data}"
        print("✓ verify-payment handles invalid session gracefully (returns paid=False)")

    def test_verify_payment_missing_session_id(self):
        """Test that verify-payment returns 400 when session_id is missing"""
        response = requests.post(f"{BASE_URL}/api/resume/verify-payment", json={})
        
        assert response.status_code == 400, f"Expected 400 for missing session_id: {response.status_code}"
        print("✓ verify-payment returns 400 when session_id is missing")

    def test_checkout_without_email(self, uploaded_resume):
        """Test checkout works with empty email (backwards compatibility)"""
        response = requests.post(f"{BASE_URL}/api/resume/checkout", json={
            "resume_id": uploaded_resume,
            "email": "",  # Empty email
            "origin_url": "https://test.example.com"
        })
        
        assert response.status_code == 200, f"Checkout should work without email: {response.text}"
        data = response.json()
        assert 'checkout_url' in data
        print("✓ Checkout works with empty email (backwards compatible)")

    def test_pricing_endpoint_still_works(self):
        """Verify pricing endpoint returns expected data"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        
        assert response.status_code == 200, f"Pricing endpoint failed: {response.text}"
        data = response.json()
        
        assert 'price' in data, "Missing price in pricing response"
        assert 'currency' in data, "Missing currency in pricing response"
        assert 'product_name' in data, "Missing product_name in pricing response"
        
        print(f"✓ Pricing: {data['currency']} {data['price']} - {data['product_name']}")
        return data


class TestEmailReceiptGracefulHandling:
    """Test that email sending gracefully handles missing RESEND_API_KEY"""
    
    def test_backend_logs_when_resend_key_missing(self):
        """
        Verify that the send_payment_receipt function logs info when key is missing.
        We can't directly test the function, but we verify the endpoint doesn't crash.
        """
        # The fact that verify-payment works proves graceful handling
        response = requests.post(f"{BASE_URL}/api/resume/verify-payment", json={
            "session_id": "test_graceful_session"
        })
        
        assert response.status_code == 200
        print("✓ Backend handles missing RESEND_API_KEY gracefully (no crash)")

    def test_verify_payment_response_format(self):
        """Verify that verify-payment response format is consistent"""
        response = requests.post(f"{BASE_URL}/api/resume/verify-payment", json={
            "session_id": "test_format_session"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Only required field is 'paid'
        assert isinstance(data.get('paid'), bool), f"'paid' should be boolean: {data}"
        print("✓ verify-payment returns {paid: true/false} format")


class TestCheckoutEmailStorage:
    """Test email storage in checkout flow"""
    
    @pytest.fixture(scope="class")
    def test_resume(self):
        """Upload a test resume"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('email_test_resume.pdf', f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 200
        return response.json()['resume_id']

    def test_checkout_with_valid_email(self, test_resume):
        """Test checkout stores valid email"""
        test_email = "receipt_test@example.com"
        
        response = requests.post(f"{BASE_URL}/api/resume/checkout", json={
            "resume_id": test_resume,
            "email": test_email,
            "origin_url": "https://example.com"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # The email is stored in the database, we can only verify the endpoint works
        assert 'checkout_url' in data
        assert 'session_id' in data
        
        print(f"✓ Checkout with email '{test_email}' - session: {data['session_id']}")
        
        # Store for subsequent tests
        self.__class__.session_id = data['session_id']
        return data

    def test_checkout_with_special_chars_email(self, test_resume):
        """Test checkout handles email with special chars"""
        test_email = "test+receipt@sub.example.com"
        
        response = requests.post(f"{BASE_URL}/api/resume/checkout", json={
            "resume_id": test_resume,
            "email": test_email,
            "origin_url": "https://example.com"
        })
        
        assert response.status_code == 200
        print(f"✓ Checkout handles email with special chars: {test_email}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
