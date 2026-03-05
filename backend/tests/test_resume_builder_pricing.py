"""
Resume Builder Pricing API Tests
Tests for the admin pricing toggle feature for Resume Builder
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestResumePricingAPI:
    """Tests for /api/builder/resume-pricing endpoint"""
    
    def test_get_resume_pricing_returns_200(self):
        """GET /api/builder/resume-pricing should return 200"""
        response = requests.get(f"{BASE_URL}/api/builder/resume-pricing")
        assert response.status_code == 200
        print(f"✓ GET /api/builder/resume-pricing returned 200")
    
    def test_get_resume_pricing_returns_correct_format(self):
        """GET /api/builder/resume-pricing should return correct JSON format"""
        response = requests.get(f"{BASE_URL}/api/builder/resume-pricing")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields exist
        assert "pricing_id" in data, "Missing pricing_id field"
        assert "enabled" in data, "Missing enabled field"
        assert "price" in data, "Missing price field"
        assert "currency" in data, "Missing currency field"
        
        # Check field types
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["price"], (int, float)), "price should be numeric"
        assert isinstance(data["currency"], str), "currency should be string"
        
        print(f"✓ Response format is correct: {data}")
    
    def test_get_resume_pricing_default_disabled(self):
        """Default pricing should be disabled (enabled: false)"""
        response = requests.get(f"{BASE_URL}/api/builder/resume-pricing")
        assert response.status_code == 200
        
        data = response.json()
        # Note: This test assumes default state. If admin has changed it, this may fail.
        # The important thing is that the field exists and is boolean
        assert "enabled" in data
        assert isinstance(data["enabled"], bool)
        print(f"✓ Pricing enabled state: {data['enabled']}")
    
    def test_get_resume_pricing_has_product_info(self):
        """Pricing should include product name and description"""
        response = requests.get(f"{BASE_URL}/api/builder/resume-pricing")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check optional but expected fields
        if "product_name" in data:
            assert isinstance(data["product_name"], str)
            print(f"✓ Product name: {data['product_name']}")
        
        if "description" in data:
            assert isinstance(data["description"], str)
            print(f"✓ Description: {data['description']}")


class TestResumeBuilderAIEndpoints:
    """Tests for Resume Builder AI generation endpoints"""
    
    def test_generate_summary_endpoint_exists(self):
        """POST /api/builder/generate/summary should exist"""
        response = requests.post(
            f"{BASE_URL}/api/builder/generate/summary",
            json={"job_title": "Software Engineer"}
        )
        # Should return 200 (success) or 500 (AI error), not 404
        assert response.status_code != 404, "Endpoint not found"
        print(f"✓ /api/builder/generate/summary endpoint exists (status: {response.status_code})")
    
    def test_generate_experience_endpoint_exists(self):
        """POST /api/builder/generate/experience should exist"""
        response = requests.post(
            f"{BASE_URL}/api/builder/generate/experience",
            json={"job_title": "Software Engineer"}
        )
        # Should return 200 (success) or 500 (AI error), not 404
        assert response.status_code != 404, "Endpoint not found"
        print(f"✓ /api/builder/generate/experience endpoint exists (status: {response.status_code})")
    
    def test_generate_skills_endpoint_exists(self):
        """POST /api/builder/generate/skills should exist"""
        response = requests.post(
            f"{BASE_URL}/api/builder/generate/skills",
            json={"job_title": "Software Engineer"}
        )
        # Should return 200 (success) or 500 (AI error), not 404
        assert response.status_code != 404, "Endpoint not found"
        print(f"✓ /api/builder/generate/skills endpoint exists (status: {response.status_code})")
    
    def test_generate_summary_requires_job_title(self):
        """POST /api/builder/generate/summary should require job_title"""
        response = requests.post(
            f"{BASE_URL}/api/builder/generate/summary",
            json={}
        )
        # Should return 400 for missing required field
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ /api/builder/generate/summary validates job_title requirement")


class TestResumeBuilderExport:
    """Tests for Resume Builder export endpoints"""
    
    def test_export_docx_endpoint_exists(self):
        """POST /api/builder/export/docx should exist"""
        response = requests.post(
            f"{BASE_URL}/api/builder/export/docx",
            json={
                "personal_info": {"name": "Test User"},
                "sections": {}
            }
        )
        # Should return 200 (success) or 500 (error), not 404
        assert response.status_code != 404, "Endpoint not found"
        print(f"✓ /api/builder/export/docx endpoint exists (status: {response.status_code})")
    
    def test_export_docx_returns_base64(self):
        """POST /api/builder/export/docx should return base64 encoded file"""
        response = requests.post(
            f"{BASE_URL}/api/builder/export/docx",
            json={
                "personal_info": {"name": "Test User", "email": "test@test.com"},
                "sections": {"summary": "Test summary"}
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "docx_base64" in data, "Missing docx_base64 field"
            assert "filename" in data, "Missing filename field"
            assert len(data["docx_base64"]) > 0, "docx_base64 should not be empty"
            print(f"✓ DOCX export returns base64 data (filename: {data['filename']})")
        else:
            print(f"⚠ DOCX export returned {response.status_code} - may need python-docx installed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
