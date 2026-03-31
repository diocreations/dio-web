"""
Iteration 18 Backend Tests - Payment Gating Logic

Testing the new per-resume payment model:
1. POST /api/resume/upload - still returns resume_id, text_preview, word_count
2. POST /api/resume/analyze - still returns full analysis for FREE (scores, strengths, weaknesses)
3. POST /api/resume/quick-fix - returns is_preview: true with TRUNCATED fixed_text when NOT paid
4. POST /api/resume/improve - returns is_preview: true with TRUNCATED improved_text when NOT paid
5. POST /api/resume/linkedin - returns is_preview: true with partial data (1 headline, truncated about, 2 keywords, empty bullets/posts) when NOT paid
6. PAID FLOW: After inserting payment record, endpoints return full data with is_preview: false/absent
7. POST /api/resume/checkout - still creates Stripe checkout session
8. LinkedIn results are cached in 'linkedin_optimizations' collection
"""
import pytest
import requests
import os
from pymongo import MongoClient
from datetime import datetime, timezone
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

# MongoDB client for direct DB manipulation (to simulate payment)
mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]


class TestUploadStillWorks:
    """Test that upload endpoint still works as before"""
    
    def test_upload_returns_resume_id_text_preview_word_count(self):
        """POST /api/resume/upload still returns resume_id, text_preview, word_count"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "resume_id" in data, "Missing 'resume_id' in response"
        assert "text_preview" in data, "Missing 'text_preview' in response"
        assert "word_count" in data, "Missing 'word_count' in response"
        assert data["resume_id"].startswith("resume_"), f"resume_id should start with 'resume_'"
        
        print(f"PASS: Upload returns resume_id={data['resume_id']}, word_count={data['word_count']}")


class TestAnalysisStillFree:
    """Test that analysis endpoint is still FREE"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_analyze_returns_full_analysis_for_free(self, uploaded_resume_id):
        """POST /api/resume/analyze returns FULL analysis without payment (FREE feature)"""
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify full analysis fields are present (not truncated/preview)
        assert "overall_score" in data, "Missing 'overall_score'"
        assert "ats_score" in data, "Missing 'ats_score'"
        assert "strengths" in data, "Missing 'strengths'"
        assert "weaknesses" in data, "Missing 'weaknesses'"
        assert "missing_keywords" in data, "Missing 'missing_keywords'"
        assert "suggestions" in data, "Missing 'suggestions'"
        
        # Verify these are full arrays, not truncated
        assert isinstance(data["strengths"], list) and len(data["strengths"]) > 0, "strengths should have items"
        assert isinstance(data["weaknesses"], list) and len(data["weaknesses"]) > 0, "weaknesses should have items"
        
        # Analysis should NOT have is_preview flag (it's always free/full)
        assert "is_preview" not in data or data.get("is_preview") == False, "Analysis should not be a preview"
        
        print(f"PASS: Analyze returns FULL analysis for FREE - score={data['overall_score']}, {len(data['strengths'])} strengths, {len(data['weaknesses'])} weaknesses")


class TestQuickFixPreviewWhenUnpaid:
    """Test quick-fix returns preview when NOT paid"""
    
    @pytest.fixture
    def analyzed_resume_id(self):
        """Upload and analyze a resume, return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Ensure no payment exists for this resume
        db.resume_payments.delete_many({"resume_id": resume_id})
        
        # Analyze first
        requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        return resume_id
    
    def test_quick_fix_returns_preview_when_unpaid(self, analyzed_resume_id):
        """POST /api/resume/quick-fix returns is_preview: true with truncated fixed_text when NOT paid"""
        response = requests.post(
            f"{BASE_URL}/api/resume/quick-fix",
            json={"resume_id": analyzed_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Must have is_preview: true
        assert data.get("is_preview") == True, f"Expected is_preview: true, got {data.get('is_preview')}"
        
        # Must have fixed_text (but truncated)
        assert "fixed_text" in data, "Missing 'fixed_text' in response"
        assert len(data["fixed_text"]) > 0, "fixed_text should not be empty"
        
        # Verify truncation: text should be limited to ~8 lines (truncate_preview function)
        lines = data["fixed_text"].split("\n")
        assert len(lines) <= 10, f"Truncated preview should have <=10 lines, got {len(lines)}"
        
        print(f"PASS: Quick-fix returns preview (is_preview=True) with {len(lines)} lines when UNPAID")


class TestImprovePreviewWhenUnpaid:
    """Test improve returns preview when NOT paid"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Ensure no payment exists for this resume
        db.resume_payments.delete_many({"resume_id": resume_id})
        return resume_id
    
    def test_improve_returns_preview_when_unpaid(self, uploaded_resume_id):
        """POST /api/resume/improve returns is_preview: true with truncated improved_text when NOT paid"""
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Must have is_preview: true
        assert data.get("is_preview") == True, f"Expected is_preview: true, got {data.get('is_preview')}"
        
        # Must have improved_text (but truncated)
        assert "improved_text" in data, "Missing 'improved_text' in response"
        assert len(data["improved_text"]) > 0, "improved_text should not be empty"
        
        # Verify truncation: text should be limited to ~8 lines
        lines = data["improved_text"].split("\n")
        assert len(lines) <= 10, f"Truncated preview should have <=10 lines, got {len(lines)}"
        
        print(f"PASS: Improve returns preview (is_preview=True) with {len(lines)} lines when UNPAID")


class TestLinkedInPreviewWhenUnpaid:
    """Test LinkedIn returns preview when NOT paid"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Ensure no payment exists for this resume
        db.resume_payments.delete_many({"resume_id": resume_id})
        # Also clear cached linkedin results to test fresh call
        db.linkedin_optimizations.delete_many({"resume_id": resume_id})
        return resume_id
    
    def test_linkedin_returns_preview_when_unpaid(self, uploaded_resume_id):
        """POST /api/resume/linkedin returns is_preview: true with partial data when NOT paid"""
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={
                "resume_id": uploaded_resume_id,
                "headline": "Software Engineer at Tech Corp",
                "about": "Experienced developer with 5+ years in full-stack development",
                "experience": "Senior role at major tech company"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Must have is_preview: true
        assert data.get("is_preview") == True, f"Expected is_preview: true, got {data.get('is_preview')}"
        
        # Verify partial data:
        # - Only 1 headline (instead of 3)
        assert "headlines" in data, "Missing 'headlines'"
        assert isinstance(data["headlines"], list), "headlines should be a list"
        assert len(data["headlines"]) == 1, f"Preview should have only 1 headline, got {len(data['headlines'])}"
        
        # - Truncated about (just first sentence)
        assert "about" in data, "Missing 'about'"
        assert len(data["about"]) < 500, "About section should be truncated in preview"
        
        # - Only 2 keywords
        assert "keywords" in data, "Missing 'keywords'"
        assert isinstance(data["keywords"], list), "keywords should be a list"
        assert len(data["keywords"]) == 2, f"Preview should have only 2 keywords, got {len(data['keywords'])}"
        
        # - Empty experience_bullets
        assert "experience_bullets" in data, "Missing 'experience_bullets'"
        assert data["experience_bullets"] == [], f"experience_bullets should be empty in preview, got {data['experience_bullets']}"
        
        # - Empty post_ideas
        assert "post_ideas" in data, "Missing 'post_ideas'"
        assert data["post_ideas"] == [], f"post_ideas should be empty in preview, got {data['post_ideas']}"
        
        print(f"PASS: LinkedIn returns preview (is_preview=True) with 1 headline, 2 keywords, empty bullets/posts when UNPAID")


class TestLinkedInCaching:
    """Test LinkedIn results are stored in linkedin_optimizations collection"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Clear cached results
        db.linkedin_optimizations.delete_many({"resume_id": resume_id})
        return resume_id
    
    def test_linkedin_stores_in_linkedin_optimizations_collection(self, uploaded_resume_id):
        """POST /api/resume/linkedin stores full result in linkedin_optimizations collection"""
        # First call - should generate and store
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={
                "resume_id": uploaded_resume_id,
                "headline": "Software Engineer",
                "about": "Developer",
                "experience": "Tech Corp"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        
        # Check DB for cached result
        cached = db.linkedin_optimizations.find_one({"resume_id": uploaded_resume_id})
        assert cached is not None, "LinkedIn result should be stored in linkedin_optimizations collection"
        
        # Full data should be stored (not truncated preview)
        assert "headlines" in cached, "Cached result should have 'headlines'"
        assert "about" in cached, "Cached result should have 'about'"
        assert "keywords" in cached, "Cached result should have 'keywords'"
        assert "experience_bullets" in cached, "Cached result should have 'experience_bullets'"
        assert "post_ideas" in cached, "Cached result should have 'post_ideas'"
        
        # Full headlines (3 items typically)
        assert len(cached.get("headlines", [])) >= 1, "Cached should have headlines"
        
        print(f"PASS: LinkedIn results stored in linkedin_optimizations collection with resume_id={uploaded_resume_id}")


class TestPaidFlowQuickFix:
    """Test quick-fix returns FULL data AFTER marking payment as paid"""
    
    @pytest.fixture
    def analyzed_resume_id(self):
        """Upload, analyze, and call quick-fix once to cache result, return resume_id"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Clear any existing payment
        db.resume_payments.delete_many({"resume_id": resume_id})
        
        # Analyze
        requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        # Call quick-fix once to generate and cache full result
        requests.post(
            f"{BASE_URL}/api/resume/quick-fix",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        return resume_id
    
    def test_quick_fix_returns_full_text_after_payment(self, analyzed_resume_id):
        """After inserting payment record, POST /api/resume/quick-fix returns full fixed_text with is_preview: false/absent"""
        # Insert payment record in MongoDB to simulate paid user
        db.resume_payments.insert_one({
            "resume_id": analyzed_resume_id,
            "status": "paid",
            "amount": 19.99,
            "currency": "EUR",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Now call quick-fix again - should return full data
        response = requests.post(
            f"{BASE_URL}/api/resume/quick-fix",
            json={"resume_id": analyzed_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # is_preview should be False or absent
        assert data.get("is_preview") != True, f"Expected is_preview to be False/absent after payment, got {data.get('is_preview')}"
        
        # fixed_text should be full (more than 8 lines)
        assert "fixed_text" in data, "Missing 'fixed_text'"
        lines = data["fixed_text"].split("\n")
        assert len(lines) > 10, f"Full fixed_text should have >10 lines, got {len(lines)}"
        
        print(f"PASS: Quick-fix returns FULL text ({len(lines)} lines) AFTER payment is marked as paid")
        
        # Cleanup
        db.resume_payments.delete_many({"resume_id": analyzed_resume_id})


class TestPaidFlowImprove:
    """Test improve returns FULL data AFTER marking payment as paid"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and call improve once to cache result"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Clear any existing payment
        db.resume_payments.delete_many({"resume_id": resume_id})
        
        # Call improve once to generate and cache full result
        requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        return resume_id
    
    def test_improve_returns_full_text_after_payment(self, uploaded_resume_id):
        """After inserting payment record, POST /api/resume/improve returns full improved_text with is_preview: false/absent"""
        # Insert payment record
        db.resume_payments.insert_one({
            "resume_id": uploaded_resume_id,
            "status": "paid",
            "amount": 19.99,
            "currency": "EUR",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Now call improve again - should return full data
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # is_preview should be False or absent
        assert data.get("is_preview") != True, f"Expected is_preview to be False/absent after payment, got {data.get('is_preview')}"
        
        # improved_text should be full (more than 8 lines)
        assert "improved_text" in data, "Missing 'improved_text'"
        lines = data["improved_text"].split("\n")
        assert len(lines) > 10, f"Full improved_text should have >10 lines, got {len(lines)}"
        
        print(f"PASS: Improve returns FULL text ({len(lines)} lines) AFTER payment is marked as paid")
        
        # Cleanup
        db.resume_payments.delete_many({"resume_id": uploaded_resume_id})


class TestPaidFlowLinkedIn:
    """Test LinkedIn returns FULL data AFTER marking payment as paid"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and call linkedin once to cache result"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        resume_id = response.json()["resume_id"]
        
        # Clear any existing payment and cached linkedin
        db.resume_payments.delete_many({"resume_id": resume_id})
        db.linkedin_optimizations.delete_many({"resume_id": resume_id})
        
        # Call linkedin once to generate and cache full result
        requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={
                "resume_id": resume_id,
                "headline": "Software Engineer",
                "about": "Developer",
                "experience": "Tech Corp"
            },
            headers={"Content-Type": "application/json"}
        )
        
        return resume_id
    
    def test_linkedin_returns_full_data_after_payment(self, uploaded_resume_id):
        """After inserting payment record, POST /api/resume/linkedin returns full data with is_preview: false"""
        # Insert payment record
        db.resume_payments.insert_one({
            "resume_id": uploaded_resume_id,
            "status": "paid",
            "amount": 19.99,
            "currency": "EUR",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Now call linkedin again - should return full data
        response = requests.post(
            f"{BASE_URL}/api/resume/linkedin",
            json={"resume_id": uploaded_resume_id},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # is_preview should be False
        assert data.get("is_preview") == False, f"Expected is_preview: false after payment, got {data.get('is_preview')}"
        
        # Full data should be present
        assert "headlines" in data and len(data["headlines"]) >= 2, "Should have multiple headlines after payment"
        assert "about" in data and len(data["about"]) > 50, "Should have full about section after payment"
        assert "keywords" in data and len(data["keywords"]) >= 3, "Should have multiple keywords after payment"
        assert "experience_bullets" in data and len(data["experience_bullets"]) >= 1, "Should have experience bullets after payment"
        assert "post_ideas" in data and len(data["post_ideas"]) >= 1, "Should have post ideas after payment"
        
        print(f"PASS: LinkedIn returns FULL data (is_preview=False) with {len(data['headlines'])} headlines, {len(data['keywords'])} keywords AFTER payment")
        
        # Cleanup
        db.resume_payments.delete_many({"resume_id": uploaded_resume_id})


class TestCheckoutStillWorks:
    """Test checkout endpoint still creates Stripe session"""
    
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
        """POST /api/resume/checkout still creates Stripe checkout session"""
        response = requests.post(
            f"{BASE_URL}/api/resume/checkout",
            json={
                "resume_id": uploaded_resume_id,
                "origin_url": "https://builder-sandbox-5.preview.emergentagent.com"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "checkout_url" in data, "Missing 'checkout_url'"
        assert "session_id" in data, "Missing 'session_id'"
        
        print(f"PASS: Checkout creates Stripe session: session_id={data['session_id'][:30]}...")


class TestPaymentStatusEndpoint:
    """Test payment status check endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_pdf_path = "/tmp/test_resume_iteration17.pdf"
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_resume.pdf", f, "application/pdf")}
            response = requests.post(f"{BASE_URL}/api/resume/upload", files=files)
        assert response.status_code == 200
        return response.json()["resume_id"]
    
    def test_payment_status_returns_false_when_unpaid(self, uploaded_resume_id):
        """GET /api/resume/payment-status/{resume_id} returns paid: false when no payment"""
        # Ensure no payment
        db.resume_payments.delete_many({"resume_id": uploaded_resume_id})
        
        response = requests.get(f"{BASE_URL}/api/resume/payment-status/{uploaded_resume_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("paid") == False, f"Expected paid: false, got {data.get('paid')}"
        
        print("PASS: Payment status returns paid=false when unpaid")
    
    def test_payment_status_returns_true_when_paid(self, uploaded_resume_id):
        """GET /api/resume/payment-status/{resume_id} returns paid: true after payment"""
        # Insert payment
        db.resume_payments.insert_one({
            "resume_id": uploaded_resume_id,
            "status": "paid",
            "amount": 19.99
        })
        
        response = requests.get(f"{BASE_URL}/api/resume/payment-status/{uploaded_resume_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("paid") == True, f"Expected paid: true, got {data.get('paid')}"
        
        print("PASS: Payment status returns paid=true when paid")
        
        # Cleanup
        db.resume_payments.delete_many({"resume_id": uploaded_resume_id})


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
