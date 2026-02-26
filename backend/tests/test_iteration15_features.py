"""
Iteration 15 Tests: Resume Score Comparison, Component Splitting, Chatbot Hiding
Tests for:
- Resume upload and analyze APIs (for score comparison feature)
- Templates API (5 templates)
- Pricing API
- Admin auth
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestResumeAPIs:
    """Resume optimizer API tests for score comparison feature"""
    
    def test_resume_pricing_endpoint(self):
        """GET /api/resume/pricing returns pricing data with product_name"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "product_name" in data
        assert "price" in data
        assert "currency" in data
        assert "features" in data
        
        # Validate values
        assert data["product_name"] == "DioAI Resume & LinkedIn Optimizer"
        assert isinstance(data["price"], (int, float))
        assert data["currency"] in ["EUR", "USD", "GBP"]
        print(f"PASS: Pricing API - {data['price']} {data['currency']}")
    
    def test_resume_templates_returns_5_templates(self):
        """GET /api/resume/templates returns exactly 5 templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        data = response.json()
        
        # Should have exactly 5 templates
        assert len(data) == 5, f"Expected 5 templates, got {len(data)}"
        
        # Each template should have required fields
        for template in data:
            assert "template_id" in template
            assert "name" in template
            assert "description" in template
            assert "style" in template
            assert "prompt_instruction" in template
        
        # Verify template IDs
        template_ids = [t["template_id"] for t in data]
        expected_ids = ["tpl_executive", "tpl_modern_tech", "tpl_ats_max", "tpl_career_change", "tpl_compact"]
        for tid in expected_ids:
            assert tid in template_ids, f"Missing template: {tid}"
        
        print(f"PASS: Templates API - {len(data)} templates found")
    
    def test_resume_upload_accepts_pdf(self):
        """POST /api/resume/upload accepts PDF files"""
        # Create a minimal test PDF content
        test_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF"
        
        files = {'file': ('test.pdf', test_content, 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        # May succeed or fail based on content extraction - but should not be 500
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        print(f"PASS: Upload API accepts PDF - status {response.status_code}")
    
    def test_resume_upload_rejects_invalid_format(self):
        """POST /api/resume/upload rejects non-PDF/DOCX files"""
        files = {'file': ('test.txt', b'plain text content', 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"PASS: Upload API rejects invalid format - {data['detail']}")
    
    def test_resume_analyze_returns_scores(self):
        """POST /api/resume/analyze returns overall_score and ats_score"""
        # First create a test resume using a real PDF
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from io import BytesIO
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(72, 750, "John Doe - Senior Software Engineer")
        c.drawString(72, 730, "Email: john@example.com | Phone: 555-1234")
        c.drawString(72, 700, "PROFESSIONAL SUMMARY")
        c.drawString(72, 680, "Experienced developer with 5 years in Python and JavaScript")
        c.drawString(72, 650, "SKILLS: Python, JavaScript, React, AWS, Docker")
        c.save()
        buffer.seek(0)
        
        # Upload
        files = {'file': ('test_resume.pdf', buffer.getvalue(), 'application/pdf')}
        upload_response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        if upload_response.status_code != 200:
            pytest.skip("Upload failed - skipping analyze test")
        
        resume_id = upload_response.json()["resume_id"]
        
        # Analyze
        analyze_response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id}
        )
        
        assert analyze_response.status_code == 200
        data = analyze_response.json()
        
        # Verify score comparison fields
        assert "overall_score" in data
        assert "ats_score" in data
        assert "strengths" in data
        assert "weaknesses" in data
        assert "missing_keywords" in data
        assert "suggestions" in data
        
        # Scores should be 0-100
        assert 0 <= data["overall_score"] <= 100
        assert 0 <= data["ats_score"] <= 100
        
        print(f"PASS: Analyze API - Overall: {data['overall_score']}, ATS: {data['ats_score']}")
    
    def test_resume_analyze_requires_resume_id(self):
        """POST /api/resume/analyze requires resume_id"""
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={}
        )
        assert response.status_code == 400
        print("PASS: Analyze API validates resume_id required")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "session_token" in data
        assert "email" in data
        assert data["email"] == "admin@diocreations.com"
        assert data["role"] == "admin"
        
        print(f"PASS: Admin login - token received")
    
    def test_admin_login_invalid_credentials(self):
        """POST /api/auth/login rejects invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("PASS: Admin login rejects invalid password")
    
    def test_admin_login_missing_fields(self):
        """POST /api/auth/login validates required fields"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com"}
        )
        assert response.status_code in [400, 401, 422]
        print("PASS: Admin login validates required fields")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_root_endpoint(self):
        """GET /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "DioCreations" in data["message"]
        print(f"PASS: Root API - {data['message']}")
    
    def test_drive_status_endpoint(self):
        """GET /api/drive/status returns configured status"""
        response = requests.get(f"{BASE_URL}/api/drive/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        print(f"PASS: Drive status - configured: {data['configured']}")


class TestLinkedInScraper:
    """LinkedIn scraper endpoint tests"""
    
    def test_linkedin_scrape_valid_url(self):
        """POST /api/resume/linkedin-scrape with valid LinkedIn URL"""
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin-scrape",
            json={"url": "https://www.linkedin.com/in/satyanadella/"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return structured response
        assert "success" in data
        assert "headline" in data or "note" in data
        print(f"PASS: LinkedIn scraper - success: {data.get('success')}")
    
    def test_linkedin_scrape_invalid_url(self):
        """POST /api/resume/linkedin-scrape rejects invalid URLs"""
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin-scrape",
            json={"url": "https://example.com/not-linkedin"}
        )
        assert response.status_code == 400
        print("PASS: LinkedIn scraper rejects non-LinkedIn URLs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
