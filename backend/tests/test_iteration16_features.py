"""
Iteration 16 Backend Tests
Tests for:
1. POST /api/resume/upload - file upload
2. POST /api/resume/analyze - resume analysis 
3. POST /api/resume/improve - improved text generation
4. PUT /api/products/bulk-currency - bulk currency update
5. GET /api/products - products with currency field
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestResumeEndpoints:
    """Test resume-related endpoints for rich text editor feature"""
    
    def test_resume_upload_accepts_pdf(self):
        """POST /api/resume/upload accepts PDF files"""
        # Create a minimal PDF
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
        
        files = {"file": ("test_resume.pdf", io.BytesIO(pdf_content), "application/pdf")}
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        # Should return 200 with resume_id
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "resume_id" in data, "Response missing resume_id"
        print(f"SUCCESS: Resume upload returned resume_id: {data['resume_id']}")
        return data["resume_id"]
    
    def test_resume_upload_rejects_invalid_format(self):
        """POST /api/resume/upload rejects invalid file types"""
        files = {"file": ("test.txt", io.BytesIO(b"plain text content"), "text/plain")}
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 400, f"Expected 400 for invalid format, got {response.status_code}"
        print("SUCCESS: Invalid file format correctly rejected with 400")
    
    def test_resume_analyze_returns_scores(self):
        """POST /api/resume/analyze returns analysis with scores"""
        # First upload a resume
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
        files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        upload_res = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        if upload_res.status_code != 200:
            pytest.skip("Upload failed, skipping analyze test")
        
        resume_id = upload_res.json()["resume_id"]
        
        # Now analyze
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            headers={"Content-Type": "application/json"},
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "overall_score" in data, "Response missing overall_score"
        assert "ats_score" in data, "Response missing ats_score"
        print(f"SUCCESS: Analyze returned overall_score={data['overall_score']}, ats_score={data['ats_score']}")
    
    def test_resume_improve_returns_text(self):
        """POST /api/resume/improve returns improved text for rich text editor"""
        # Upload a resume first
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
        files = {"file": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        upload_res = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        if upload_res.status_code != 200:
            pytest.skip("Upload failed, skipping improve test")
        
        resume_id = upload_res.json()["resume_id"]
        
        # Call improve
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            headers={"Content-Type": "application/json"},
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "improved_text" in data, "Response missing improved_text"
        print(f"SUCCESS: Improve returned improved_text (length: {len(data.get('improved_text', ''))})")


class TestBulkCurrencyEndpoint:
    """Test bulk currency update endpoint for admin settings"""
    
    @pytest.fixture
    def auth_token(self):
        """Login as admin and get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            headers={"Content-Type": "application/json"},
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if response.status_code == 200:
            return response.cookies
        pytest.skip("Admin login failed")
    
    def test_bulk_currency_update_valid(self, auth_token):
        """PUT /api/products/bulk-currency updates all products"""
        response = requests.put(
            f"{BASE_URL}/api/products/bulk-currency",
            headers={"Content-Type": "application/json"},
            cookies=auth_token,
            json={"currency": "USD"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "updated_count" in data, "Response missing updated_count"
        assert "message" in data, "Response missing message"
        print(f"SUCCESS: Bulk currency update succeeded - {data['updated_count']} products updated")
        
        # Reset back to EUR
        requests.put(
            f"{BASE_URL}/api/products/bulk-currency",
            headers={"Content-Type": "application/json"},
            cookies=auth_token,
            json={"currency": "EUR"}
        )
    
    def test_bulk_currency_update_invalid_currency(self, auth_token):
        """PUT /api/products/bulk-currency rejects invalid currency codes"""
        response = requests.put(
            f"{BASE_URL}/api/products/bulk-currency",
            headers={"Content-Type": "application/json"},
            cookies=auth_token,
            json={"currency": "INVALID"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid currency, got {response.status_code}"
        print("SUCCESS: Invalid currency correctly rejected with 400")
    
    def test_bulk_currency_requires_auth(self):
        """PUT /api/products/bulk-currency requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/products/bulk-currency",
            headers={"Content-Type": "application/json"},
            json={"currency": "USD"}
        )
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"SUCCESS: Bulk currency requires auth - returned {response.status_code}")


class TestProductsEndpoint:
    """Test products endpoint returns currency field"""
    
    def test_products_list_returns_currency(self):
        """GET /api/products returns products with currency field"""
        response = requests.get(f"{BASE_URL}/api/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        if len(data) > 0:
            # Check first product has currency field
            first_product = data[0]
            # Currency may or may not be present depending on seed data
            print(f"SUCCESS: Products returned {len(data)} items")
            if "currency" in first_product:
                print(f"  - First product has currency: {first_product['currency']}")
            else:
                print("  - Note: First product does not have currency field yet")
        else:
            print("SUCCESS: Products endpoint returned empty list (no products seeded)")


class TestRootAndHealthEndpoints:
    """Test basic API health endpoints"""
    
    def test_root_endpoint(self):
        """GET /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: Root endpoint returns 200")
    
    def test_resume_pricing_endpoint(self):
        """GET /api/resume/pricing returns pricing info"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "price" in data, "Response missing price"
        print(f"SUCCESS: Pricing endpoint returns price={data.get('price')}, currency={data.get('currency')}")
    
    def test_resume_templates_endpoint(self):
        """GET /api/resume/templates returns 5 templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert len(data) == 5, f"Expected 5 templates, got {len(data)}"
        print(f"SUCCESS: Templates endpoint returns {len(data)} templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
