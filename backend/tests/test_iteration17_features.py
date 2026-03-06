"""
Iteration 17 Backend Tests - Testing new features:
1. GET /api/resume/pricing - returns pricing with currency EUR
2. POST /api/resume/upload - accepts PDF, returns resume_id, text_preview, word_count
3. POST /api/resume/analyze - returns analysis with scores and suggestions
4. POST /api/resume/quick-fix - returns fixed_text
5. POST /api/resume/improve - returns improved_text
6. GET /api/resume/get-text/{resume_id} - returns text and filename (new endpoint)
7. GET /api/resume/get-text/nonexistent - returns 404
8. POST /api/resume/linkedin - returns headlines, about, keywords
9. GET /api/resume/templates - returns available templates
10. POST /api/resume/checkout - creates Stripe checkout
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestResumePricing:
    """Test resume pricing endpoint"""
    
    def test_get_pricing_returns_valid_data(self):
        """GET /api/resume/pricing returns pricing with currency EUR"""
        response = requests.get(f"{BASE_URL}/api/resume/pricing")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "price" in data, "Missing 'price' in response"
        assert "currency" in data, "Missing 'currency' in response"
        assert "product_name" in data, "Missing 'product_name' in response"
        assert "features" in data, "Missing 'features' in response"
        
        # Verify currency is EUR
        assert data["currency"] == "EUR", f"Expected currency EUR, got {data['currency']}"
        assert isinstance(data["price"], (int, float)), "Price should be numeric"
        assert data["price"] > 0, "Price should be positive"
        
        print(f"PASS: Pricing endpoint returns valid data with EUR currency: {data}")


class TestResumeUpload:
    """Test resume upload endpoint"""
    
    def test_upload_pdf_returns_resume_data(self):
        """POST /api/resume/upload accepts PDF and returns resume_id, text_preview, word_count"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "resume_id" in data, "Missing 'resume_id' in response"
        assert "text_preview" in data, "Missing 'text_preview' in response"
        assert "word_count" in data, "Missing 'word_count' in response"
        
        # Verify data types
        assert data["resume_id"].startswith("resume_"), f"resume_id should start with 'resume_', got {data['resume_id']}"
        assert isinstance(data["word_count"], int), "word_count should be integer"
        assert data["word_count"] > 0, "word_count should be positive"
        assert len(data["text_preview"]) > 0, "text_preview should not be empty"
        
        print(f"PASS: Upload returns resume_id={data['resume_id']}, word_count={data['word_count']}")
        return data["resume_id"]
    
    def test_upload_invalid_format_rejected(self):
        """POST /api/resume/upload rejects invalid file formats"""
        files = {"file": ("test.txt", b"This is plain text content", "text/plain")}
        response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 400, f"Expected 400 for invalid format, got {response.status_code}"
        print("PASS: Invalid file format correctly rejected with 400")


class TestResumeAnalysis:
    """Test resume analysis endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_analyze_returns_scores_and_suggestions(self, uploaded_resume_id):
        """POST /api/resume/analyze returns analysis with overall_score, ats_score, strengths, weaknesses, missing_keywords, suggestions"""
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "overall_score" in data, "Missing 'overall_score' in response"
        assert "ats_score" in data, "Missing 'ats_score' in response"
        assert "strengths" in data, "Missing 'strengths' in response"
        assert "weaknesses" in data, "Missing 'weaknesses' in response"
        assert "missing_keywords" in data, "Missing 'missing_keywords' in response"
        assert "suggestions" in data, "Missing 'suggestions' in response"
        
        # Verify score ranges
        assert 0 <= data["overall_score"] <= 100, f"overall_score out of range: {data['overall_score']}"
        assert 0 <= data["ats_score"] <= 100, f"ats_score out of range: {data['ats_score']}"
        
        # Verify arrays
        assert isinstance(data["strengths"], list), "strengths should be a list"
        assert isinstance(data["weaknesses"], list), "weaknesses should be a list"
        assert isinstance(data["suggestions"], list), "suggestions should be a list"
        
        print(f"PASS: Analysis returns overall_score={data['overall_score']}, ats_score={data['ats_score']}")
    
    def test_analyze_nonexistent_resume_404(self):
        """POST /api/resume/analyze with nonexistent resume_id returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": "resume_nonexistent12345"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Nonexistent resume analysis returns 404")


class TestResumeQuickFix:
    """Test resume quick-fix endpoint"""
    
    @pytest.fixture
    def analyzed_resume_id(self):
        """Upload and analyze a resume, return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Analyze to prepare for quick-fix
        requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        return resume_id
    
    def test_quick_fix_returns_fixed_text(self, analyzed_resume_id):
        """POST /api/resume/quick-fix returns fixed_text"""
        response = requests.post(
            f"{BASE_URL}/api/resume/quick-fix",
            json={"resume_id": analyzed_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "fixed_text" in data, "Missing 'fixed_text' in response"
        assert len(data["fixed_text"]) > 100, "fixed_text should contain substantial content"
        assert "resume_id" in data, "Missing 'resume_id' in response"
        
        print(f"PASS: Quick-fix returns fixed_text with {len(data['fixed_text'])} characters")


class TestResumeImprove:
    """Test resume improve endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_improve_returns_improved_text(self, uploaded_resume_id):
        """POST /api/resume/improve returns improved_text"""
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "improved_text" in data, "Missing 'improved_text' in response"
        assert len(data["improved_text"]) > 100, "improved_text should contain substantial content"
        assert "resume_id" in data, "Missing 'resume_id' in response"
        
        print(f"PASS: Improve returns improved_text with {len(data['improved_text'])} characters")


class TestResumeGetText:
    """Test the new get-text endpoint for copy-from-comparison feature"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_get_text_returns_text_and_filename(self, uploaded_resume_id):
        """GET /api/resume/get-text/{resume_id} returns text and filename"""
        response = requests.get(f"{BASE_URL}/api/resume/get-text/{uploaded_resume_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "text" in data, "Missing 'text' in response"
        assert "filename" in data, "Missing 'filename' in response"
        assert len(data["text"]) > 0, "text should not be empty"
        
        print(f"PASS: get-text returns text ({len(data['text'])} chars) and filename={data['filename']}")
    
    def test_get_text_nonexistent_returns_404(self):
        """GET /api/resume/get-text/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/resume/get-text/nonexistent_resume_12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Nonexistent resume get-text returns 404")


class TestResumeLinkedIn:
    """Test LinkedIn optimization endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_linkedin_returns_optimization_data(self, uploaded_resume_id):
        """POST /api/resume/linkedin returns headlines, about, keywords"""
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={
                "resume_id": uploaded_resume_id,
                "headline": "Software Engineer",
                "about": "Passionate developer",
                "experience": "Tech Corp"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "headlines" in data, "Missing 'headlines' in response"
        assert "about" in data, "Missing 'about' in response"
        assert "keywords" in data, "Missing 'keywords' in response"
        
        assert isinstance(data["headlines"], list), "headlines should be a list"
        assert isinstance(data["keywords"], list), "keywords should be a list"
        assert len(data["headlines"]) > 0, "headlines should not be empty"
        
        print(f"PASS: LinkedIn returns {len(data['headlines'])} headlines and {len(data['keywords'])} keywords")


class TestResumeTemplates:
    """Test resume templates endpoint"""
    
    def test_get_templates_returns_list(self):
        """GET /api/resume/templates returns available templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list of templates"
        # Templates may be seeded or empty initially
        print(f"PASS: Templates endpoint returns {len(data)} templates")


class TestResumeCheckout:
    """Test resume checkout endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_checkout_creates_stripe_session(self, uploaded_resume_id):
        """POST /api/resume/checkout creates Stripe checkout session"""
        response = requests.post(
            f"{BASE_URL}/api/resume/checkout",
            json={
                "resume_id": uploaded_resume_id,
                "origin_url": "https://ai-resume-platform.preview.emergentagent.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "checkout_url" in data, "Missing 'checkout_url' in response"
        assert "session_id" in data, "Missing 'session_id' in response"
        assert "stripe.com" in data["checkout_url"] or data["checkout_url"].startswith("http"), \
            f"checkout_url should be a valid URL, got {data['checkout_url']}"
        
        print(f"PASS: Checkout returns session_id and checkout_url")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
