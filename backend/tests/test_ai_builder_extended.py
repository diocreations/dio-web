"""
Test AI Builder Extended Features - Iteration 47
Tests the new AI Website Builder features:
- Email collection before generation (customer_email field)
- Two publishing options (Host with Diocreations vs Download)
- Admin management panel with stats, website list, and configurable settings
- GET /api/ai-builder/settings (public)
- GET /api/ai-builder/admin/stats
- GET /api/ai-builder/admin/websites
- PUT /api/ai-builder/admin/settings
- POST /api/ai-builder/website/{id}/submit-domain
- POST /api/ai-builder/website/{id}/select-hosting
- POST /api/ai-builder/website/{id}/confirm-payment
- GET /api/ai-builder/website/{id}/download (ZIP export)
"""
import pytest
import requests
import os
import time
import zipfile
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Store generated website ID for tests
generated_website_id = None
generated_content = None


class TestAIBuilderSettings:
    """Test public settings endpoint"""
    
    def test_get_settings_returns_config(self):
        """GET /api/ai-builder/settings returns configuration"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/settings")
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "domain_registration_url" in data
        assert "waas_price" in data
        assert "ewaas_price" in data
        assert "download_price" in data
        assert "support_email" in data
        
        # Verify default values
        assert data["waas_price"] == 29.99
        assert data["ewaas_price"] == 49.99
        assert data["download_price"] == 19.99


class TestAIBuilderEmailCollection:
    """Test email collection during website generation"""
    
    def test_generate_requires_email(self):
        """POST /api/ai-builder/generate requires customer_email"""
        payload = {
            "business_name": "TEST_No_Email_Business",
            "business_type": "Technology & IT",
            "description": "A tech company without email"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload
        )
        
        # Should fail validation - email is required
        assert response.status_code == 422
    
    def test_generate_validates_email_format(self):
        """POST /api/ai-builder/generate validates email format"""
        payload = {
            "business_name": "TEST_Invalid_Email",
            "business_type": "Technology & IT",
            "description": "A tech company with invalid email",
            "customer_email": "not-an-email"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload
        )
        
        # Should fail validation - invalid email format
        assert response.status_code == 422
    
    def test_generate_with_valid_email(self):
        """POST /api/ai-builder/generate succeeds with valid email"""
        global generated_website_id, generated_content
        
        payload = {
            "business_name": "TEST_Email_Collection_Biz",
            "business_type": "Professional Services",
            "description": "A professional services company for testing email collection",
            "location": "Test City, TC",
            "customer_email": "test_email_collection@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "website_id" in data
        assert "content" in data
        
        generated_website_id = data["website_id"]
        generated_content = data["content"]
        
        # Verify website was stored with email
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{generated_website_id}")
        assert get_response.status_code == 200
        website_data = get_response.json()
        assert website_data.get("customer_email") == "test_email_collection@example.com"


class TestAIBuilderHostingFlow:
    """Test hosting selection flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure website exists for testing"""
        global generated_website_id
        if not generated_website_id:
            payload = {
                "business_name": "TEST_Hosting_Flow_Biz",
                "business_type": "Retail & E-commerce",
                "description": "An e-commerce business for testing hosting flow",
                "customer_email": "test_hosting@example.com"
            }
            response = requests.post(
                f"{BASE_URL}/api/ai-builder/generate",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                data = response.json()
                generated_website_id = data["website_id"]
    
    def test_submit_domain_valid(self):
        """POST /api/ai-builder/website/{id}/submit-domain accepts valid domain"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/submit-domain",
            json={"website_id": generated_website_id, "domain": "testdomain.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["domain"] == "testdomain.com"
        
        # Verify domain was stored
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{generated_website_id}")
        website_data = get_response.json()
        assert website_data.get("domain") == "testdomain.com"
        assert website_data.get("hosting_status") == "pending_payment"
    
    def test_submit_domain_invalid_format(self):
        """POST /api/ai-builder/website/{id}/submit-domain rejects invalid domain"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/submit-domain",
            json={"website_id": generated_website_id, "domain": "invalid"}
        )
        
        assert response.status_code == 400
    
    def test_select_hosting_waas(self):
        """POST /api/ai-builder/website/{id}/select-hosting selects WaaS plan"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/select-hosting",
            json={"website_id": generated_website_id, "hosting_type": "waas"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["hosting_type"] == "waas"
    
    def test_select_hosting_ewaas(self):
        """POST /api/ai-builder/website/{id}/select-hosting selects e-WaaS plan"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/select-hosting",
            json={"website_id": generated_website_id, "hosting_type": "ewaas"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["hosting_type"] == "ewaas"
    
    def test_select_hosting_download(self):
        """POST /api/ai-builder/website/{id}/select-hosting selects download option"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/select-hosting",
            json={"website_id": generated_website_id, "hosting_type": "download"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["hosting_type"] == "download"
        
        # Verify status changed to pending_download_payment
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{generated_website_id}")
        website_data = get_response.json()
        assert website_data.get("hosting_status") == "pending_download_payment"
    
    def test_select_hosting_invalid_type(self):
        """POST /api/ai-builder/website/{id}/select-hosting rejects invalid type"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/select-hosting",
            json={"website_id": generated_website_id, "hosting_type": "invalid_type"}
        )
        
        assert response.status_code == 400
    
    def test_confirm_payment(self):
        """POST /api/ai-builder/website/{id}/confirm-payment confirms payment"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.post(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/confirm-payment"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] in ["deployed", "download_ready"]


class TestAIBuilderDownload:
    """Test website download/export functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Ensure website exists for testing"""
        global generated_website_id
        if not generated_website_id:
            payload = {
                "business_name": "TEST_Download_Biz",
                "business_type": "Creative & Design",
                "description": "A creative agency for testing download",
                "customer_email": "test_download@example.com"
            }
            response = requests.post(
                f"{BASE_URL}/api/ai-builder/generate",
                json=payload,
                timeout=60
            )
            if response.status_code == 200:
                data = response.json()
                generated_website_id = data["website_id"]
    
    def test_download_returns_zip(self):
        """GET /api/ai-builder/website/{id}/download returns ZIP file"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        # First confirm payment to allow download
        requests.post(f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/confirm-payment")
        
        response = requests.get(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/download"
        )
        
        assert response.status_code == 200
        assert "application/zip" in response.headers.get("Content-Type", "")
        
        # Verify it's a valid ZIP file
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            file_list = zf.namelist()
            
            # Verify required files exist
            assert "index.html" in file_list
            assert "about.html" in file_list
            assert "services.html" in file_list
            assert "blog.html" in file_list
            assert "contact.html" in file_list
            assert "assets/css/style.css" in file_list
            assert "assets/js/main.js" in file_list
            assert "README.md" in file_list
    
    def test_download_html_contains_branding(self):
        """Downloaded HTML contains Diocreations branding badge"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.get(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/download"
        )
        
        assert response.status_code == 200
        
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            # Read index.html
            index_html = zf.read("index.html").decode("utf-8")
            
            # Verify branding badge is present
            assert "diocreations" in index_html.lower()
            assert "butterfly" in index_html.lower()
    
    def test_download_css_contains_butterfly_animation(self):
        """Downloaded CSS contains butterfly animation"""
        global generated_website_id
        if not generated_website_id:
            pytest.skip("No website generated")
        
        response = requests.get(
            f"{BASE_URL}/api/ai-builder/website/{generated_website_id}/download"
        )
        
        assert response.status_code == 200
        
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as zf:
            # Read style.css
            css_content = zf.read("assets/css/style.css").decode("utf-8")
            
            # Verify butterfly animation is present
            assert "butterfly" in css_content.lower()
            assert "@keyframes" in css_content
    
    def test_download_not_found(self):
        """GET /api/ai-builder/website/{id}/download returns 404 for invalid ID"""
        response = requests.get(
            f"{BASE_URL}/api/ai-builder/website/site_nonexistent123/download"
        )
        
        assert response.status_code == 404


class TestAIBuilderAdminStats:
    """Test admin statistics endpoint"""
    
    def test_get_admin_stats(self):
        """GET /api/ai-builder/admin/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/admin/stats")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "total_websites" in data
        assert "preview" in data
        assert "deployed" in data
        assert "downloaded" in data
        assert "pending_payment" in data
        
        # All values should be integers
        assert isinstance(data["total_websites"], int)
        assert isinstance(data["preview"], int)
        assert isinstance(data["deployed"], int)


class TestAIBuilderAdminWebsites:
    """Test admin websites list endpoint"""
    
    def test_get_admin_websites(self):
        """GET /api/ai-builder/admin/websites returns websites list"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/admin/websites")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "websites" in data
        assert "total" in data
        assert isinstance(data["websites"], list)
        
        # If there are websites, verify structure
        if len(data["websites"]) > 0:
            website = data["websites"][0]
            assert "website_id" in website
            assert "business_name" in website
            assert "customer_email" in website
            assert "hosting_status" in website
            assert "generated_at" in website
    
    def test_get_admin_websites_pagination(self):
        """GET /api/ai-builder/admin/websites supports pagination"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/admin/websites?skip=0&limit=5")
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["websites"]) <= 5


class TestAIBuilderAdminSettings:
    """Test admin settings endpoints"""
    
    def test_get_admin_settings(self):
        """GET /api/ai-builder/admin/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/ai-builder/admin/settings")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "domain_registration_url" in data
        assert "waas_price" in data
        assert "waas_stripe_link" in data
        assert "ewaas_price" in data
        assert "ewaas_stripe_link" in data
        assert "download_price" in data
        assert "download_stripe_link" in data
        assert "dns_server_ip" in data
        assert "whatsapp_number" in data
        assert "support_email" in data
    
    def test_update_admin_settings(self):
        """PUT /api/ai-builder/admin/settings updates settings"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/admin/settings")
        current_settings = get_response.json()
        
        # Update settings
        update_payload = {
            "waas_price": 34.99,
            "dns_server_ip": "192.168.1.100",
            "whatsapp_number": "+1234567890"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ai-builder/admin/settings",
            json=update_payload
        )
        
        assert response.status_code == 200
        assert response.json()["success"] == True
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/ai-builder/admin/settings")
        updated_settings = verify_response.json()
        assert updated_settings["waas_price"] == 34.99
        assert updated_settings["dns_server_ip"] == "192.168.1.100"
        assert updated_settings["whatsapp_number"] == "+1234567890"
        
        # Restore original settings
        restore_payload = {
            "waas_price": current_settings.get("waas_price", 29.99),
            "dns_server_ip": current_settings.get("dns_server_ip", ""),
            "whatsapp_number": current_settings.get("whatsapp_number", "")
        }
        requests.put(f"{BASE_URL}/api/ai-builder/admin/settings", json=restore_payload)


class TestAIBuilderAdminWebsiteDelete:
    """Test admin website deletion"""
    
    def test_delete_website(self):
        """DELETE /api/ai-builder/admin/website/{id} deletes website"""
        # First create a website to delete
        payload = {
            "business_name": "TEST_Delete_Me_Biz",
            "business_type": "Other",
            "description": "A business to be deleted",
            "customer_email": "test_delete@example.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/ai-builder/generate",
            json=payload,
            timeout=60
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create website for deletion test")
        
        website_id = create_response.json()["website_id"]
        
        # Delete the website
        delete_response = requests.delete(
            f"{BASE_URL}/api/ai-builder/admin/website/{website_id}"
        )
        
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        
        # Verify website is deleted
        get_response = requests.get(f"{BASE_URL}/api/ai-builder/website/{website_id}")
        assert get_response.status_code == 404
    
    def test_delete_website_not_found(self):
        """DELETE /api/ai-builder/admin/website/{id} returns 404 for invalid ID"""
        response = requests.delete(
            f"{BASE_URL}/api/ai-builder/admin/website/site_nonexistent123"
        )
        
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
