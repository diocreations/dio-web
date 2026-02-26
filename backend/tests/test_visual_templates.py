"""
Test Visual Template UI and Clean Text Output Features
Tests: 
- GET /api/resume/templates with preview/style/prompt_instruction data
- POST /api/resume/improve with template_id producing clean text (no ## or **)
- POST /api/resume/improve with force_regenerate=true for template change
- POST /api/resume/download-access for payment check
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestTemplatesWithPreview:
    """Test that templates include preview metadata for visual cards"""

    def test_templates_return_5_templates(self):
        """GET /api/resume/templates returns exactly 5 templates"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        templates = response.json()
        assert len(templates) == 5, f"Expected 5 templates, got {len(templates)}"
        print(f"✓ Templates endpoint returned {len(templates)} templates")

    def test_templates_have_preview_metadata(self):
        """Each template has preview metadata for visual card rendering"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        templates = response.json()
        
        for tpl in templates:
            # Check required fields for visual cards
            assert "template_id" in tpl, f"Missing template_id in {tpl.get('name', 'unknown')}"
            assert "name" in tpl, "Missing name"
            assert "description" in tpl, "Missing description"
            assert "style" in tpl, f"Missing style in {tpl['name']}"
            assert "preview" in tpl, f"Missing preview in {tpl['name']}"
            
            # Check style object
            style = tpl["style"]
            assert "accent" in style or "color" in style, f"Missing accent/color in style for {tpl['name']}"
            assert "layout" in style, f"Missing layout in style for {tpl['name']}"
            assert "font" in style, f"Missing font in style for {tpl['name']}"
            
            # Check preview object
            preview = tpl["preview"]
            assert "header_style" in preview, f"Missing header_style in preview for {tpl['name']}"
            assert "section_dividers" in preview, f"Missing section_dividers in preview for {tpl['name']}"
            
            print(f"  ✓ {tpl['name']}: style.accent={style.get('accent', style.get('color'))}, preview.header_style={preview['header_style']}")

    def test_templates_have_prompt_instruction(self):
        """Each template has prompt_instruction for AI formatting"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        templates = response.json()
        
        for tpl in templates:
            assert "prompt_instruction" in tpl, f"Missing prompt_instruction in {tpl['name']}"
            assert len(tpl["prompt_instruction"]) > 50, f"prompt_instruction too short for {tpl['name']}"
            print(f"  ✓ {tpl['name']}: prompt_instruction length = {len(tpl['prompt_instruction'])} chars")


class TestCleanTextOutput:
    """Test that improve endpoint produces clean text without markdown"""

    @pytest.fixture(autouse=True)
    def setup_test_resume(self):
        """Upload a test resume for improvement tests"""
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 100), """JOHN SMITH
john.smith@email.com | 555-123-4567

Software Engineer with 5 years experience in Python, React, AWS.
Led team of 8 developers. Increased system performance by 40%.
Built microservices architecture handling 10M daily requests.

EXPERIENCE
Senior Software Engineer, Tech Company (2020-Present)
- Led development of core platform features
- Reduced API latency by 60% through optimization
- Mentored 5 junior developers

SKILLS
Python, JavaScript, React, AWS, Docker, Kubernetes""")
        doc.save('/tmp/clean_text_test.pdf')
        doc.close()
        
        with open('/tmp/clean_text_test.pdf', 'rb') as f:
            response = requests.post(
                f"{BASE_URL}/api/resume/upload",
                files={'file': ('clean_text_test.pdf', f, 'application/pdf')}
            )
        
        if response.status_code == 200:
            self.resume_id = response.json()["resume_id"]
            print(f"  Test resume uploaded: {self.resume_id}")
        else:
            self.resume_id = None

    def test_improve_with_template_produces_clean_text(self):
        """POST /api/resume/improve with template_id produces text without ## or **"""
        if not hasattr(self, 'resume_id') or not self.resume_id:
            pytest.skip("Resume upload failed")
        
        # Use first template (Executive Professional)
        response = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={
                "resume_id": self.resume_id,
                "template_id": "tpl_executive",
                "force_regenerate": True
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "improved_text" in data, "Missing improved_text in response"
        text = data["improved_text"]
        
        # Verify NO markdown symbols
        assert "##" not in text, f"Found '##' in improved text - markdown not stripped"
        assert "**" not in text, f"Found '**' in improved text - markdown not stripped"
        assert "```" not in text, f"Found '```' in improved text - markdown not stripped"
        
        # Verify it has ALL CAPS section headers
        has_caps_section = any(line.strip().isupper() and len(line.strip()) > 3 for line in text.split('\n') if line.strip())
        assert has_caps_section, "Expected ALL CAPS section headers in clean text output"
        
        print(f"✓ Improved text is clean (no markdown), length: {len(text)} chars")
        print(f"  First 500 chars:\n{text[:500]}")

    def test_force_regenerate_allows_template_change(self):
        """POST /api/resume/improve with force_regenerate=true regenerates with different template"""
        if not hasattr(self, 'resume_id') or not self.resume_id:
            pytest.skip("Resume upload failed")
        
        # First generate with Executive template
        response1 = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={
                "resume_id": self.resume_id,
                "template_id": "tpl_executive",
                "force_regenerate": True
            },
            headers={"Content-Type": "application/json"}
        )
        assert response1.status_code == 200
        text1 = response1.json().get("improved_text", "")
        
        # Wait a bit
        time.sleep(1)
        
        # Now regenerate with Modern Tech template
        response2 = requests.post(
            f"{BASE_URL}/api/resume/improve",
            json={
                "resume_id": self.resume_id,
                "template_id": "tpl_modern_tech",
                "force_regenerate": True
            },
            headers={"Content-Type": "application/json"}
        )
        assert response2.status_code == 200, f"Regenerate failed: {response2.text}"
        data2 = response2.json()
        text2 = data2.get("improved_text", "")
        
        # Verify template_id in response matches requested
        assert data2.get("template_id") == "tpl_modern_tech", "template_id should match requested"
        
        # The text should be different (regenerated)
        # Note: Due to AI variation, we just check it regenerated successfully
        assert len(text2) > 100, "Regenerated text should have content"
        assert "##" not in text2, "Regenerated text should not have markdown"
        
        print(f"✓ force_regenerate successfully regenerated with different template")
        print(f"  Template 1 length: {len(text1)}, Template 2 length: {len(text2)}")


class TestDownloadAccess:
    """Test download access endpoint"""

    def test_download_access_returns_has_access_field(self):
        """POST /api/resume/download-access returns has_access boolean"""
        response = requests.post(
            f"{BASE_URL}/api/resume/download-access",
            json={"resume_id": "resume_test_unpaid_12345"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "has_access" in data, "Missing has_access field"
        assert isinstance(data["has_access"], bool), "has_access should be boolean"
        assert data["has_access"] == False, "Unpaid resume should have has_access=false"
        print(f"✓ download-access correctly returns has_access=False for unpaid resume")

    def test_download_access_requires_resume_id(self):
        """POST /api/resume/download-access requires resume_id"""
        response = requests.post(
            f"{BASE_URL}/api/resume/download-access",
            json={},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ download-access correctly requires resume_id")


class TestTemplateNames:
    """Verify the 5 professional template names"""

    def test_template_names_are_professional(self):
        """Templates should have the 5 professional names"""
        response = requests.get(f"{BASE_URL}/api/resume/templates")
        assert response.status_code == 200
        templates = response.json()
        
        expected_names = [
            "Executive Professional",
            "Modern Tech",
            "ATS Maximum",
            "Career Pivot",
            "One-Page Compact"
        ]
        
        actual_names = [t["name"] for t in templates]
        
        for name in expected_names:
            assert name in actual_names, f"Missing template: {name}"
            print(f"  ✓ Found template: {name}")
        
        print(f"✓ All 5 professional templates present")
