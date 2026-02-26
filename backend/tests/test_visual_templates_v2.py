"""
Test suite for Visual Template UI and Clean Text Output fixes (Iteration 13)
Tests: 
- POST /api/resume/improve produces clean text WITHOUT ## or ** markdown
- POST /api/resume/improve with force_regenerate=true works
- GET /api/resume/templates returns 5 professional templates with prompt_instruction
- POST /api/resume/upload with .docx file
- POST /api/resume/analyze returns scores
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestResumeTemplates:
    """Tests for resume templates API"""
    
    def test_templates_endpoint_returns_5_templates(self):
        """GET /api/resume/templates should return exactly 5 templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 5, f"Expected 5 templates, got {len(data)}"
        print(f"PASS: Templates endpoint returns {len(data)} templates")
    
    def test_templates_have_prompt_instruction(self):
        """Each template should have prompt_instruction field"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        
        templates = response.json()
        for tpl in templates:
            assert "prompt_instruction" in tpl, f"Template {tpl.get('name')} missing prompt_instruction"
            assert len(tpl.get("prompt_instruction", "")) > 50, f"Template {tpl.get('name')} has too short prompt_instruction"
        print("PASS: All templates have prompt_instruction field")
    
    def test_templates_have_style_and_preview(self):
        """Each template should have style and preview metadata for visual cards"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        
        templates = response.json()
        for tpl in templates:
            assert "style" in tpl, f"Template {tpl.get('name')} missing style"
            assert "preview" in tpl, f"Template {tpl.get('name')} missing preview"
            
            style = tpl.get("style", {})
            assert "accent" in style, f"Template {tpl.get('name')} missing style.accent"
            
            preview = tpl.get("preview", {})
            assert "header_style" in preview, f"Template {tpl.get('name')} missing preview.header_style"
        print("PASS: All templates have style and preview metadata")
    
    def test_template_names_are_professional(self):
        """Template names should be professional"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        
        templates = response.json()
        expected_names = ["Executive Professional", "Modern Tech", "ATS Maximum", "Career Pivot", "One-Page Compact"]
        actual_names = [t.get("name") for t in templates]
        
        for name in expected_names:
            assert name in actual_names, f"Missing template: {name}"
        print(f"PASS: All 5 professional template names present: {actual_names}")


class TestResumeUploadAndAnalyze:
    """Tests for resume upload and analysis"""
    
    @pytest.fixture
    def test_resume_path(self):
        return "/tmp/test_resume.docx"
    
    def test_upload_resume_docx(self, test_resume_path):
        """POST /api/resume/upload should accept .docx files"""
        if not os.path.exists(test_resume_path):
            pytest.skip(f"Test resume not found at {test_resume_path}")
        
        with open(test_resume_path, "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={"file": ("test_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )
        
        assert response.status_code == 200, f"Upload failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "resume_id" in data, "Response missing resume_id"
        assert "text_preview" in data, "Response missing text_preview"
        print(f"PASS: Resume uploaded, ID: {data.get('resume_id')}")
        return data.get("resume_id")
    
    def test_analyze_resume_returns_scores(self, test_resume_path):
        """POST /api/resume/analyze should return overall_score and ats_score"""
        # First upload
        if not os.path.exists(test_resume_path):
            pytest.skip(f"Test resume not found at {test_resume_path}")
        
        with open(test_resume_path, "rb") as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={"file": ("test_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )
        
        assert upload_response.status_code == 200
        resume_id = upload_response.json().get("resume_id")
        
        # Then analyze
        response = requests.post(
            f"{BASE_URL}/api/resume/analyze",
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Analysis failed: {response.status_code}"
        data = response.json()
        assert "overall_score" in data, "Response missing overall_score"
        assert "ats_score" in data, "Response missing ats_score"
        assert isinstance(data.get("overall_score"), (int, float)), "overall_score should be numeric"
        print(f"PASS: Analysis returned scores - Overall: {data.get('overall_score')}, ATS: {data.get('ats_score')}")


class TestResumeImprove:
    """Tests for resume improvement endpoint"""
    
    @pytest.fixture
    def uploaded_resume_id(self):
        """Upload a resume and return its ID"""
        test_resume_path = "/tmp/test_resume.docx"
        if not os.path.exists(test_resume_path):
            pytest.skip(f"Test resume not found at {test_resume_path}")
        
        with open(test_resume_path, "rb") as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={"file": ("test_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )
        
        if response.status_code != 200:
            pytest.skip(f"Upload failed: {response.text}")
        
        return response.json().get("resume_id")
    
    def test_improve_produces_clean_text_no_markdown(self, uploaded_resume_id):
        """POST /api/resume/improve should return clean text without ## or ** markdown"""
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id, "force_regenerate": True}
        )
        
        assert response.status_code == 200, f"Improve failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "improved_text" in data, "Response missing improved_text"
        
        improved_text = data.get("improved_text", "")
        assert len(improved_text) > 100, "Improved text too short"
        
        # Check for markdown artifacts
        assert "##" not in improved_text, "improved_text contains ## markdown"
        assert "**" not in improved_text, "improved_text contains ** markdown"
        assert "```" not in improved_text, "improved_text contains ``` markdown"
        
        print(f"PASS: Improved text is clean (length: {len(improved_text)} chars), no markdown artifacts")
        print(f"First 200 chars: {improved_text[:200]}")
    
    def test_improve_with_template_id(self, uploaded_resume_id):
        """POST /api/resume/improve with template_id should use template style"""
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id, "template_id": "tpl_executive", "force_regenerate": True}
        )
        
        assert response.status_code == 200, f"Improve failed: {response.status_code}"
        data = response.json()
        assert data.get("template_id") == "tpl_executive", "Response should include template_id"
        print("PASS: Improve with template_id works")
    
    def test_force_regenerate_overwrites_cached(self, uploaded_resume_id):
        """POST /api/resume/improve with force_regenerate=true should regenerate"""
        # First improve without template
        response1 = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id, "force_regenerate": True}
        )
        assert response1.status_code == 200
        text1 = response1.json().get("improved_text", "")[:100]
        
        # Without force_regenerate, should return cached
        response2 = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id}
        )
        assert response2.status_code == 200
        text2 = response2.json().get("improved_text", "")[:100]
        
        # Cached should be same
        assert text1 == text2, "Without force_regenerate, should return cached version"
        
        # With force_regenerate and different template, should generate new
        response3 = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={"resume_id": uploaded_resume_id, "template_id": "tpl_compact", "force_regenerate": True}
        )
        assert response3.status_code == 200
        assert response3.json().get("template_id") == "tpl_compact"
        
        print("PASS: force_regenerate=true properly triggers regeneration")


class TestDownloadAccess:
    """Tests for download access check"""
    
    def test_download_access_requires_resume_id(self):
        """POST /api/resume/download-access should require resume_id"""
        response = requests.post(
            f"{BASE_URL}/api/resume/download-access",
            json={}
        )
        
        # Should return 400 for missing resume_id
        assert response.status_code == 400, f"Expected 400 for missing resume_id, got {response.status_code}"
        print("PASS: download-access validates required resume_id")
    
    def test_download_access_returns_has_access(self):
        """POST /api/resume/download-access should return has_access boolean"""
        # Upload a resume first
        test_resume_path = "/tmp/test_resume.docx"
        if not os.path.exists(test_resume_path):
            pytest.skip(f"Test resume not found")
        
        with open(test_resume_path, "rb") as f:
            upload_response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={"file": ("test_resume.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            )
        
        resume_id = upload_response.json().get("resume_id")
        
        response = requests.post(
            f"{BASE_URL}/api/resume/download-access",
            json={"resume_id": resume_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "has_access" in data, "Response should include has_access field"
        assert isinstance(data.get("has_access"), bool), "has_access should be boolean"
        print(f"PASS: download-access returns has_access={data.get('has_access')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
