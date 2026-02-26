"""
Test Resume Optimizer API Endpoints
Tests: upload, analyze, improve, linkedin, pricing, admin pricing, analytics, payment-status
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestResumePricing:
    """Public pricing endpoint tests"""

    def test_get_resume_pricing(self):
        """GET /api/resume/pricing returns product name, price, features, currency"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "product_name" in data, "Missing product_name"
        assert "price" in data, "Missing price"
        assert "currency" in data, "Missing currency"
        assert "features" in data, "Missing features"
        assert isinstance(data["features"], list), "Features should be a list"
        print(f"Pricing: {data['currency']} {data['price']} for {data['product_name']}")


class TestResumeUpload:
    """Resume upload endpoint tests"""

    def test_upload_pdf_resume(self):
        """POST /api/resume/upload accepts PDF, returns resume_id and text preview"""
        # Create test PDF file
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), 'Test Resume\nSoftware Engineer\n5 years Python React AWS')
        doc.save('/tmp/test_upload.pdf')
        doc.close()
        
        with open('/tmp/test_upload.pdf', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('test_resume.pdf', f, 'application/pdf')}
            )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "resume_id" in data, "Missing resume_id"
        assert "text_preview" in data, "Missing text_preview"
        assert data["resume_id"].startswith("resume_"), "resume_id should start with 'resume_'"
        print(f"Uploaded resume_id: {data['resume_id']}")
        # Store for later tests
        TestResumeUpload.resume_id = data["resume_id"]

    def test_upload_rejects_non_pdf_docx(self):
        """POST /api/resume/upload rejects non-PDF/DOCX files"""
        # Create a text file
        with open('/tmp/test.txt', 'w') as f:
            f.write('This is a text file')
        
        with open('/tmp/test.txt', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('test.txt', f, 'text/plain')}
            )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Missing error detail"
        print(f"Correctly rejected non-PDF/DOCX: {data['detail']}")

    def test_upload_rejects_jpg_image(self):
        """POST /api/resume/upload rejects image files"""
        # Create a fake jpg
        with open('/tmp/test.jpg', 'wb') as f:
            f.write(b'\xff\xd8\xff\xe0test image content')
        
        with open('/tmp/test.jpg', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('resume.jpg', f, 'image/jpeg')}
            )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestResumeAnalysis:
    """Resume analysis endpoint tests"""

    @pytest.fixture(autouse=True)
    def ensure_resume_exists(self):
        """Ensure we have an uploaded resume for analysis"""
        if not hasattr(TestResumeUpload, 'resume_id'):
            # Upload a resume first
            import fitz
            doc = fitz.open()
            page = doc.new_page()
            page.insert_text((50, 100), 'Test Resume\nSoftware Engineer with 5 years experience\nPython React AWS Docker Kubernetes\nLed team of 10 developers')
            doc.save('/tmp/analysis_test.pdf')
            doc.close()
            
            with open('/tmp/analysis_test.pdf', 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/resume/upload",
                    files={'file': ('analysis_resume.pdf', f, 'application/pdf')}
                )
            if response.status_code == 200:
                TestResumeUpload.resume_id = response.json()["resume_id"]

    def test_analyze_resume_returns_structured_analysis(self):
        """POST /api/resume/analyze returns structured analysis with scores and feedback"""
        resume_id = getattr(TestResumeUpload, 'resume_id', None)
        if not resume_id:
            pytest.skip("No resume_id available")
        
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "overall_score" in data, "Missing overall_score"
        assert "ats_score" in data, "Missing ats_score"
        assert "strengths" in data, "Missing strengths"
        assert "weaknesses" in data, "Missing weaknesses"
        assert "missing_keywords" in data, "Missing missing_keywords"
        assert "suggestions" in data, "Missing suggestions"
        
        # Validate scores are numeric
        assert isinstance(data["overall_score"], (int, float)), "overall_score should be numeric"
        assert isinstance(data["ats_score"], (int, float)), "ats_score should be numeric"
        assert 0 <= data["overall_score"] <= 100, "overall_score should be 0-100"
        assert 0 <= data["ats_score"] <= 100, "ats_score should be 0-100"
        
        print(f"Analysis scores: Overall={data['overall_score']}, ATS={data['ats_score']}")


class TestPaymentRequired:
    """Tests for paid features returning 402 without payment"""

    @pytest.fixture(autouse=True)
    def ensure_resume_exists(self):
        """Ensure we have an uploaded resume"""
        if not hasattr(TestResumeUpload, 'resume_id'):
            import fitz
            doc = fitz.open()
            page = doc.new_page()
            page.insert_text((50, 100), 'Test Resume for Payment Check')
            doc.save('/tmp/payment_test.pdf')
            doc.close()
            
            with open('/tmp/payment_test.pdf', 'rb') as f:
                response = requests.post(
                    f"{BASE_URL}/api/resume/upload",
                    files={'file': ('payment_resume.pdf', f, 'application/pdf')}
                )
            if response.status_code == 200:
                TestResumeUpload.resume_id = response.json()["resume_id"]

    def test_improve_requires_payment(self):
        """POST /api/resume/improve returns 402 without payment"""
        # Create a new resume for this test to ensure no payment exists
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), 'Unique Resume for Payment Test ' + str(time.time()))
        doc.save('/tmp/improve_test.pdf')
        doc.close()
        
        with open('/tmp/improve_test.pdf', 'rb') as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('improve_resume.pdf', f, 'application/pdf')}
            )
        
        if upload_response.status_code != 200:
            pytest.skip("Upload failed")
        
        new_resume_id = upload_response.json()["resume_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": new_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 402, f"Expected 402, got {response.status_code}"
        print("Correctly returned 402 for improve without payment")

    def test_linkedin_requires_payment(self):
        """POST /api/resume/linkedin returns 402 without payment"""
        # Create a new resume for this test
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), 'LinkedIn Resume Test ' + str(time.time()))
        doc.save('/tmp/linkedin_test.pdf')
        doc.close()
        
        with open('/tmp/linkedin_test.pdf', 'rb') as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('linkedin_resume.pdf', f, 'application/pdf')}
            )
        
        if upload_response.status_code != 200:
            pytest.skip("Upload failed")
        
        new_resume_id = upload_response.json()["resume_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={"resume_id": new_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 402, f"Expected 402, got {response.status_code}"
        print("Correctly returned 402 for linkedin without payment")


class TestPaymentStatus:
    """Payment status endpoint tests"""

    def test_payment_status_unpaid(self):
        """GET /api/resume/payment-status/{resume_id} returns paid:false for unpaid resume"""
        # Create a new resume to check payment status
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), 'Payment Status Test ' + str(time.time()))
        doc.save('/tmp/status_test.pdf')
        doc.close()
        
        with open('/tmp/status_test.pdf', 'rb') as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('status_resume.pdf', f, 'application/pdf')}
            )
        
        if upload_response.status_code != 200:
            pytest.skip("Upload failed")
        
        new_resume_id = upload_response.json()["resume_id"]
        
        response = requests.get(f"{BASE_URL}/api/resume/payment-status/{new_resume_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "paid" in data, "Missing 'paid' field"
        assert data["paid"] == False, "Expected paid=false for unpaid resume"
        print(f"Payment status correctly shows paid={data['paid']}")


class TestAdminEndpoints:
    """Admin endpoints tests (require authentication)"""

    @pytest.fixture(autouse=True)
    def get_auth_cookie(self):
        """Login and get auth cookie"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"},
            headers={"Content-Type": "application/json"}
        )
        if login_response.status_code == 200:
            self.session = requests.Session()
            self.session.cookies.update(login_response.cookies)
        else:
            self.session = None

    def test_admin_get_pricing(self):
        """GET /api/admin/resume/pricing returns full pricing config (auth required)"""
        if not self.session:
            pytest.skip("Authentication failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/resume/pricing")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "pricing_id" in data or "product_name" in data, "Missing pricing data"
        print(f"Admin pricing retrieved: {data}")

    def test_admin_update_pricing(self):
        """PUT /api/admin/resume/pricing updates pricing (auth required)"""
        if not self.session:
            pytest.skip("Authentication failed")
        
        # First get current pricing
        get_response = self.session.get(f"{BASE_URL}/api/admin/resume/pricing")
        if get_response.status_code != 200:
            pytest.skip("Could not get current pricing")
        
        current = get_response.json()
        
        # Update with same data to avoid changing actual pricing
        update_data = {
            "product_name": current.get("product_name", "DioAI Resume & LinkedIn Optimizer"),
            "price": current.get("price", 19.99),
            "currency": current.get("currency", "EUR"),
            "discount_enabled": current.get("discount_enabled", False),
            "discount_percent": current.get("discount_percent", 0),
            "linkedin_enabled": current.get("linkedin_enabled", True),
            "features": current.get("features", [])
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/admin/resume/pricing",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("Admin pricing update successful")

    def test_admin_analytics(self):
        """GET /api/admin/resume/analytics returns analytics data"""
        if not self.session:
            pytest.skip("Authentication failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/resume/analytics")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "total_analyses" in data, "Missing total_analyses"
        assert "total_paid_users" in data, "Missing total_paid_users"
        assert "total_revenue" in data, "Missing total_revenue"
        
        # Validate types
        assert isinstance(data["total_analyses"], int), "total_analyses should be int"
        assert isinstance(data["total_paid_users"], int), "total_paid_users should be int"
        assert isinstance(data["total_revenue"], (int, float)), "total_revenue should be numeric"
        
        print(f"Analytics: {data['total_analyses']} analyses, {data['total_paid_users']} paid, {data['total_revenue']} revenue")


class TestAdminAuthRequired:
    """Test that admin endpoints require authentication"""

    def test_admin_pricing_requires_auth(self):
        """GET /api/admin/resume/pricing without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/admin/resume/pricing")
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print(f"Admin pricing correctly requires auth: {response.status_code}")

    def test_admin_analytics_requires_auth(self):
        """GET /api/admin/resume/analytics without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/admin/resume/analytics")
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}"
        print(f"Admin analytics correctly requires auth: {response.status_code}")
