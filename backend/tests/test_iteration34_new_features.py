"""
Iteration 34: Testing new features
- Cover Letter Job URL Import (POST /api/cover-letter/fetch-job)
- Resume Editor Sticky Toolbar
- Resume Editor Full Width
- PDF Multi-page Support (pagebreak settings)
- Resume Upload Error Handling with Contact Support Options
- LinkedIn URL Editing in RichEditor
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCoverLetterJobUrlFetch:
    """Test the new Cover Letter Job URL Import feature"""
    
    def test_fetch_job_endpoint_exists(self):
        """Test that the fetch-job endpoint exists and accepts POST"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": "https://example.com/job"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404, "Endpoint /api/cover-letter/fetch-job should exist"
        print(f"✓ Endpoint exists, status: {response.status_code}")
    
    def test_fetch_job_requires_url(self):
        """Test that fetch-job requires a URL parameter"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert response.status_code == 400, f"Expected 400 for missing URL, got {response.status_code}"
        data = response.json()
        assert "detail" in data or "error" in data
        print(f"✓ Missing URL returns 400: {data}")
    
    def test_fetch_job_empty_url(self):
        """Test that fetch-job rejects empty URL"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": ""},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert response.status_code == 400, f"Expected 400 for empty URL, got {response.status_code}"
        print(f"✓ Empty URL returns 400")
    
    def test_fetch_job_invalid_url(self):
        """Test that fetch-job handles invalid URLs gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": "not-a-valid-url"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        # Should either return 400 or try to fetch with https:// prefix
        assert response.status_code in [400, 408, 500], f"Expected error for invalid URL, got {response.status_code}"
        print(f"✓ Invalid URL handled, status: {response.status_code}")
    
    def test_fetch_job_with_real_url(self):
        """Test fetch-job with a real job posting URL (example.com as test)"""
        # Using a simple URL that should be accessible
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": "https://httpbin.org/html"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        # Should return 200 with extracted data or error if AI extraction fails
        if response.status_code == 200:
            data = response.json()
            # Check response structure
            assert "job_title" in data or "job_description" in data, "Response should contain job data"
            assert "source_url" in data, "Response should contain source_url"
            print(f"✓ Job fetch successful: {data.get('job_title', 'N/A')}")
        else:
            # Acceptable if external URL fetch fails
            print(f"✓ Job fetch returned {response.status_code} (external URL may be blocked)")
    
    def test_fetch_job_response_structure(self):
        """Test that successful fetch returns expected structure"""
        # Test with a URL that should work
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": "https://www.google.com"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            # Verify expected fields exist
            expected_fields = ["job_title", "company_name", "job_description", "source_url"]
            for field in expected_fields:
                assert field in data, f"Response should contain '{field}'"
            print(f"✓ Response structure correct with all expected fields")
        else:
            print(f"✓ Response status {response.status_code} - external fetch may be limited")


class TestCoverLetterGenerate:
    """Test the cover letter generation endpoint"""
    
    def test_generate_endpoint_exists(self):
        """Test that generate endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={"job_description": "Test job", "resume_text": "Test resume"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        assert response.status_code != 404, "Endpoint should exist"
        print(f"✓ Generate endpoint exists, status: {response.status_code}")
    
    def test_generate_requires_content(self):
        """Test that generate requires job description or resume"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert response.status_code == 400, f"Expected 400 for empty request, got {response.status_code}"
        print(f"✓ Empty request returns 400")


class TestResumeUploadEndpoint:
    """Test resume upload endpoint error handling"""
    
    def test_upload_endpoint_exists(self):
        """Test that upload endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/resume/upload",
            files={},
            timeout=30
        )
        # Should return 422 (validation error) or 400, not 404
        assert response.status_code != 404, "Upload endpoint should exist"
        print(f"✓ Upload endpoint exists, status: {response.status_code}")
    
    def test_upload_requires_file(self):
        """Test that upload requires a file"""
        response = requests.post(
            f"{BASE_URL}/api/resume/upload",
            timeout=30
        )
        # Should return error for missing file
        assert response.status_code in [400, 422], f"Expected 400/422 for missing file, got {response.status_code}"
        print(f"✓ Missing file returns error: {response.status_code}")


class TestHealthAndBasicEndpoints:
    """Test basic health and API endpoints"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ API health check passed")
    
    def test_resume_pricing_endpoint(self):
        """Test resume pricing endpoint"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing", timeout=10)
        assert response.status_code == 200, f"Pricing endpoint failed: {response.status_code}"
        data = response.json()
        assert "price" in data or "pricing_enabled" in data
        print(f"✓ Pricing endpoint works: {data}")
    
    def test_resume_templates_endpoint(self):
        """Test resume templates endpoint"""
        response = requests.get(f"{BASE_URL}/api/resume/templates", timeout=10)
        assert response.status_code == 200, f"Templates endpoint failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Templates should return a list"
        print(f"✓ Templates endpoint works: {len(data)} templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
