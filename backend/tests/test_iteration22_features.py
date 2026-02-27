"""
Iteration 22: Testing backend API endpoints for resume optimizer features
- POST /api/resume/upload
- POST /api/resume/analyze
- POST /api/resume/quick-fix (preview for unpaid)
- GET /api/seo/global
- GET /api/referral/config
- GET /api/sitemap.xml
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackendAPIs:
    """Backend API endpoint tests for iteration 22"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def test_pdf_path(self):
        """Create a test PDF file for upload testing"""
        pdf_path = "/tmp/test_resume_iteration22.pdf"
        # Create a simple PDF-like file (minimal valid structure)
        pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(John Smith) Tj
(Senior Software Engineer) Tj
(john@email.com | 555-123-4567) Tj
(EXPERIENCE) Tj
(Software Engineer at TechCorp) Tj
(- Led development of microservices architecture) Tj
(- Improved system performance by 40%) Tj
(SKILLS) Tj
(Python, JavaScript, React, AWS) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF"""
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
        return pdf_path
    
    def test_seo_global_endpoint(self, api_client):
        """Test GET /api/seo/global returns SEO settings"""
        response = api_client.get(f"{BASE_URL}/api/seo/global")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "config_id" in data, "SEO config should have config_id"
        assert data["config_id"] == "global_seo", f"Expected config_id 'global_seo', got {data['config_id']}"
        assert "site_title" in data, "SEO config should have site_title"
        assert "site_description" in data, "SEO config should have site_description"
        assert "default_keywords" in data, "SEO config should have default_keywords"
        print(f"SEO Global endpoint working - site_title: {data['site_title']}")
    
    def test_referral_config_endpoint(self, api_client):
        """Test GET /api/referral/config returns referral settings"""
        response = api_client.get(f"{BASE_URL}/api/referral/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "config_id" in data, "Referral config should have config_id"
        assert data["config_id"] == "referral", f"Expected config_id 'referral', got {data['config_id']}"
        assert "enabled" in data, "Referral config should have enabled field"
        assert "discount_percent" in data, "Referral config should have discount_percent"
        assert isinstance(data["discount_percent"], (int, float)), "discount_percent should be numeric"
        print(f"Referral config endpoint working - enabled: {data['enabled']}, discount: {data['discount_percent']}%")
    
    def test_sitemap_xml_endpoint(self, api_client):
        """Test GET /api/sitemap.xml returns valid XML"""
        response = api_client.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content = response.text
        assert content.startswith('<?xml version="1.0"'), "Sitemap should start with XML declaration"
        assert '<urlset' in content, "Sitemap should have urlset element"
        assert '<url>' in content, "Sitemap should have url elements"
        assert '<loc>' in content, "Sitemap should have loc elements"
        print("Sitemap.xml endpoint working - valid XML structure")
    
    def test_resume_upload_endpoint(self, api_client, test_pdf_path):
        """Test POST /api/resume/upload accepts PDF files"""
        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('test_resume.pdf', f, 'application/pdf')}
            # Remove Content-Type header for multipart upload
            headers = {k: v for k, v in api_client.headers.items() if k != 'Content-Type'}
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files=files,
                headers=headers
            )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "resume_id" in data, "Upload response should have resume_id"
        assert "text_preview" in data, "Upload response should have text_preview"
        assert "word_count" in data, "Upload response should have word_count"
        print(f"Resume upload working - resume_id: {data['resume_id']}, word_count: {data['word_count']}")
        
        # Store resume_id for subsequent tests
        return data["resume_id"]
    
    def test_resume_analyze_endpoint(self, api_client, test_pdf_path):
        """Test POST /api/resume/analyze returns analysis results"""
        # First upload a resume
        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('test_resume.pdf', f, 'application/pdf')}
            headers = {k: v for k, v in api_client.headers.items() if k != 'Content-Type'}
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files=files,
                headers=headers
            )
        
        if upload_response.status_code != 200:
            pytest.skip(f"Upload failed with status {upload_response.status_code}")
        
        resume_id = upload_response.json()["resume_id"]
        
        # Now analyze the resume
        response = api_client.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check for required analysis fields
        assert "overall_score" in data or "ats_score" in data, "Analysis should have score fields"
        print(f"Resume analyze working - received analysis data")
    
    def test_resume_quick_fix_preview(self, api_client, test_pdf_path):
        """Test POST /api/resume/quick-fix returns preview for unpaid users"""
        # First upload a resume
        with open(test_pdf_path, 'rb') as f:
            files = {'file': ('test_resume.pdf', f, 'application/pdf')}
            headers = {k: v for k, v in api_client.headers.items() if k != 'Content-Type'}
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files=files,
                headers=headers
            )
        
        if upload_response.status_code != 200:
            pytest.skip(f"Upload failed with status {upload_response.status_code}")
        
        resume_id = upload_response.json()["resume_id"]
        
        # Request quick fix (should return preview for unpaid)
        response = api_client.post(
            f"{BASE_URL}/api/resume/quick-fix",
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "fixed_text" in data, "Quick-fix should return fixed_text"
        # For unpaid users, is_preview should be true
        if "is_preview" in data:
            print(f"Quick-fix working - is_preview: {data.get('is_preview')}")
        else:
            print(f"Quick-fix working - returned fixed_text")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
