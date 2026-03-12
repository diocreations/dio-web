"""
Test AI Builder Feature - Backend API Tests
Tests the AI Website Builder endpoints:
- GET /api/ai-builder/business-types
- POST /api/ai-builder/generate
- GET /api/ai-builder/website/{website_id}
- PUT /api/ai-builder/website/{website_id}
- PUT /api/ai-builder/website/{website_id}/theme
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIBuilderBusinessTypes:
    """Test business types endpoint"""
    
    def test_get_business_types_returns_list(self):
        """GET /api/ai-builder/business-types returns list of business types"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/business-types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify expected business types are present
        expected_types = ["Restaurant & Food", "Professional Services", "Technology & IT", "Other"]
        for expected in expected_types:
            assert expected in data, f"Expected '{expected}' in business types"
    
    def test_business_types_contains_all_15_types(self):
        """Verify all 15 business types are returned"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/business-types")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 15, f"Expected 15 business types, got {len(data)}"


class TestAIBuilderGenerate:
    """Test website generation endpoint"""
    
    def test_generate_website_success(self):
        """POST /api/ai-builder/generate creates a website with valid input"""
        payload = {
            "business_name": "TEST_AI_Builder_Cafe",
            "business_type": "Restaurant & Food",
            "description": "A cozy coffee shop serving artisan coffee and pastries",
            "location": "San Francisco, CA"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload,
            timeout=60  # AI generation can take 10-15 seconds
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "website_id" in data
        assert "content" in data
        assert "generated_at" in data
        
        # Verify website_id format
        assert data["website_id"].startswith("site_")
        
        # Verify content structure
        content = data["content"]
        assert "brand" in content
        assert "homepage" in content
        assert "about" in content
        assert "services" in content
        assert "contact" in content
        assert "blog" in content
        assert "footer" in content
        
        # Verify brand info
        assert content["brand"]["name"] == "TEST_AI_Builder_Cafe"
        
        # Verify homepage has required fields
        assert "headline" in content["homepage"]
        assert "subheadline" in content["homepage"]
        assert "features" in content["homepage"]
        
        # Store website_id for other tests
        TestAIBuilderGenerate.generated_website_id = data["website_id"]
        TestAIBuilderGenerate.generated_content = content
        
        return data["website_id"]
    
    def test_generate_website_missing_required_fields(self):
        """POST /api/ai-builder/generate fails with missing required fields"""
        # Missing business_type
        payload = {
            "business_name": "Test Business",
            "description": "Test description"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload
        )
        
        # Should fail validation
        assert response.status_code == 422
    
    def test_generate_website_empty_name(self):
        """POST /api/ai-builder/generate with empty business name"""
        payload = {
            "business_name": "",
            "business_type": "Technology & IT",
            "description": "Test description",
            "location": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload,
            timeout=60
        )
        
        # The API should still work but generate with empty name
        # or return validation error - either is acceptable
        assert response.status_code in [200, 422]


class TestAIBuilderWebsiteOperations:
    """Test website CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Generate a website for testing if not already done"""
        if not hasattr(TestAIBuilderGenerate, 'generated_website_id'):
            # Generate a website first
            payload = {
                "business_name": "TEST_Website_Ops",
                "business_type": "Professional Services",
                "description": "Professional consulting services",
                "location": "New York, NY"
            }
            response = requests.post(
                f"{BASE_URL}/api/ai-builder/generate",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                data = response.json()
                TestAIBuilderGenerate.generated_website_id = data["website_id"]
                TestAIBuilderGenerate.generated_content = data["content"]
    
    def test_get_website_by_id(self):
        """GET /api/ai-builder/website/{website_id} returns website data"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.get(f"{BASE_URL}/api/ai-builder/website/{website_id}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["website_id"] == website_id
        assert "content" in data
        assert "theme" in data
        assert "generated_at" in data
    
    def test_get_website_not_found(self):
        """GET /api/ai-builder/website/{website_id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/website/site_nonexistent123")
        
        assert response.status_code == 404
    
    def test_update_website_content(self):
        """PUT /api/ai-builder/website/{website_id} updates content"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        # Get current content
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{website_id}")
        current_content = get_response.json()["content"]
        
        # Modify headline
        current_content["homepage"]["headline"] = "TEST_Updated_Headline"
        
        # Update
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}",
            json=current_content
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{website_id}")
        assert verify_response.json()["content"]["homepage"]["headline"] == "TEST_Updated_Headline"
    
    def test_update_website_not_found(self):
        """PUT /api/ai-builder/website/{website_id} returns 404 for invalid ID"""
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/site_nonexistent123",
            json={"homepage": {"headline": "Test"}}
        )
        
        assert response.status_code == 404


class TestAIBuilderTheme:
    """Test theme update endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure website exists for testing"""
        if not hasattr(TestAIBuilderGenerate, 'generated_website_id'):
            payload = {
                "business_name": "TEST_Theme_Test",
                "business_type": "Creative & Design",
                "description": "Creative design agency",
                "location": "Los Angeles, CA"
            }
            response = requests.post(
                f"{BASE_URL}/api/ai-builder/generate",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                data = response.json()
                TestAIBuilderGenerate.generated_website_id = data["website_id"]
    
    def test_update_theme_modern(self):
        """PUT /api/ai-builder/website/{website_id}/theme updates to modern theme"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}/theme",
            json="modern"
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        assert response.json()["theme"] == "modern"
    
    def test_update_theme_corporate(self):
        """PUT /api/ai-builder/website/{website_id}/theme updates to corporate theme"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}/theme",
            json="corporate"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"] == "corporate"
    
    def test_update_theme_startup(self):
        """PUT /api/ai-builder/website/{website_id}/theme updates to startup theme"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}/theme",
            json="startup"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"] == "startup"
    
    def test_update_theme_minimal(self):
        """PUT /api/ai-builder/website/{website_id}/theme updates to minimal theme"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}/theme",
            json="minimal"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"] == "minimal"
    
    def test_update_theme_invalid(self):
        """PUT /api/ai-builder/website/{website_id}/theme rejects invalid theme"""
        website_id = getattr(TestAIBuilderGenerate, 'generated_website_id', None)
        if not website_id:
            pytest.skip("No website generated to test")
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/{website_id}/theme",
            json="invalid_theme"
        )
        
        assert response.status_code == 400
    
    def test_update_theme_not_found(self):
        """PUT /api/ai-builder/website/{website_id}/theme returns 404 for invalid ID"""
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/website/site_nonexistent123/theme",
            json="modern"
        )
        
        assert response.status_code == 404


class TestAIBuilderContentStructure:
    """Test the structure of generated content"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure website exists for testing"""
        if not hasattr(TestAIBuilderGenerate, 'generated_content'):
            payload = {
                "business_name": "TEST_Content_Structure",
                "business_type": "Healthcare & Wellness",
                "description": "Wellness center offering yoga and meditation",
                "location": "Austin, TX"
            }
            response = requests.post(
                f"{BASE_URL}/api/ai-builder/generate",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                data = response.json()
                TestAIBuilderGenerate.generated_website_id = data["website_id"]
                TestAIBuilderGenerate.generated_content = data["content"]
    
    def test_homepage_has_features_array(self):
        """Homepage content has features array with proper structure"""
        content = getattr(TestAIBuilderGenerate, 'generated_content', None)
        if not content:
            pytest.skip("No content generated to test")
        
        features = content.get("homepage", {}).get("features", [])
        assert isinstance(features, list)
        assert len(features) >= 1
        
        for feature in features:
            assert "title" in feature
            assert "description" in feature
    
    def test_services_has_services_array(self):
        """Services content has services array with proper structure"""
        content = getattr(TestAIBuilderGenerate, 'generated_content', None)
        if not content:
            pytest.skip("No content generated to test")
        
        services = content.get("services", {}).get("services", [])
        assert isinstance(services, list)
        assert len(services) >= 1
        
        for service in services:
            assert "title" in service
            assert "description" in service
    
    def test_blog_has_articles_array(self):
        """Blog content has articles array with proper structure"""
        content = getattr(TestAIBuilderGenerate, 'generated_content', None)
        if not content:
            pytest.skip("No content generated to test")
        
        articles = content.get("blog", {}).get("articles", [])
        assert isinstance(articles, list)
        assert len(articles) >= 1
        
        for article in articles:
            assert "title" in article
            assert "summary" in article
    
    def test_contact_has_required_fields(self):
        """Contact content has required contact information"""
        content = getattr(TestAIBuilderGenerate, 'generated_content', None)
        if not content:
            pytest.skip("No content generated to test")
        
        contact = content.get("contact", {})
        assert "headline" in contact or "title" in contact
        assert "email" in contact
        assert "phone" in contact
    
    def test_about_has_content(self):
        """About content has main content text"""
        content = getattr(TestAIBuilderGenerate, 'generated_content', None)
        if not content:
            pytest.skip("No content generated to test")
        
        about = content.get("about", {})
        assert "content" in about
        assert len(about["content"]) > 50  # Should have substantial content


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
