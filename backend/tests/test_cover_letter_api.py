"""
Cover Letter API Tests - Iteration 40
Tests for cover letter generation and job URL fetch functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCoverLetterAPI:
    """Cover Letter API endpoint tests"""
    
    def test_generate_cover_letter_full_data(self):
        """Test cover letter generation with all fields provided"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={
                "job_description": "Software Engineer at Google. Requirements: Python, JavaScript, 3+ years experience.",
                "job_title": "Software Engineer",
                "company_name": "Google",
                "tone": "professional"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "cover_letter" in data, "Response should contain cover_letter"
        assert "letter_id" in data, "Response should contain letter_id"
        assert len(data["cover_letter"]) > 100, "Cover letter should be substantial"
        assert data["job_title"] == "Software Engineer"
        assert data["company_name"] == "Google"
        assert data["tone"] == "professional"
    
    def test_generate_cover_letter_only_job_description(self):
        """Test cover letter generation with only job description"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={
                "job_description": "Marketing Manager position. Requirements: 5+ years marketing experience, SEO/SEM expertise."
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "cover_letter" in data
        assert len(data["cover_letter"]) > 100
    
    def test_generate_cover_letter_no_input_validation(self):
        """Test validation error when no input provided"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={},
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "resume" in data["detail"].lower() or "job description" in data["detail"].lower()
    
    def test_generate_cover_letter_different_tones(self):
        """Test cover letter generation with different tones"""
        tones = ["professional", "enthusiastic", "concise", "creative"]
        
        for tone in tones:
            response = requests.post(
                f"{BASE_URL}/api/cover-letter/generate",
                json={
                    "job_description": "Data Analyst position requiring SQL and Python skills.",
                    "tone": tone
                },
                timeout=60
            )
            
            assert response.status_code == 200, f"Failed for tone '{tone}': {response.text}"
            data = response.json()
            assert data["tone"] == tone
    
    def test_fetch_job_empty_url_validation(self):
        """Test validation error when URL is empty"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": ""},
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "url" in data["detail"].lower() or "required" in data["detail"].lower()
    
    def test_fetch_job_invalid_url(self):
        """Test error handling for invalid/inaccessible URL"""
        response = requests.post(
            f"{BASE_URL}/api/cover-letter/fetch-job",
            json={"url": "https://invalid-domain-that-does-not-exist-12345.com/job"},
            timeout=30
        )
        
        # Should return 400 or 500 with error message
        assert response.status_code in [400, 408, 500], f"Expected error status, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
    
    def test_get_cover_letter_not_found(self):
        """Test 404 for non-existent cover letter"""
        response = requests.get(
            f"{BASE_URL}/api/cover-letter/nonexistent_letter_id",
            timeout=30
        )
        
        assert response.status_code == 404


class TestCoverLetterIntegration:
    """Integration tests for cover letter workflow"""
    
    def test_generate_and_retrieve_cover_letter(self):
        """Test full workflow: generate and then retrieve cover letter"""
        # Generate
        gen_response = requests.post(
            f"{BASE_URL}/api/cover-letter/generate",
            json={
                "job_description": "TEST_Integration test job description for QA Engineer.",
                "job_title": "QA Engineer",
                "company_name": "TestCorp"
            },
            timeout=60
        )
        
        assert gen_response.status_code == 200
        gen_data = gen_response.json()
        letter_id = gen_data["letter_id"]
        
        # Retrieve
        get_response = requests.get(
            f"{BASE_URL}/api/cover-letter/{letter_id}",
            timeout=30
        )
        
        assert get_response.status_code == 200
        get_data = get_response.json()
        
        # Verify data matches
        assert get_data["letter_id"] == letter_id
        assert get_data["cover_letter"] == gen_data["cover_letter"]
        assert get_data["job_title"] == "QA Engineer"
        assert get_data["company_name"] == "TestCorp"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
