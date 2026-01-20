import requests
import sys
import json
from datetime import datetime

class DioCreationsAPITester:
    def __init__(self, base_url="https://diocreations-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "api/seed", 200)

    def test_register_user(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "name": "Test User"
        }
        success, response = self.run_test("User Registration", "POST", "api/auth/register", 200, test_user_data)
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            self.test_user_email = test_user_data['email']
            return True
        return False

    def test_login_user(self):
        """Test user login"""
        if not hasattr(self, 'test_user_email'):
            print("❌ Cannot test login - no registered user")
            return False
            
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        success, response = self.run_test("User Login", "POST", "api/auth/login", 200, login_data)
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "api/auth/me", 200)

    def test_get_services(self):
        """Test getting services"""
        return self.run_test("Get Services", "GET", "api/services", 200)

    def test_get_active_services(self):
        """Test getting active services only"""
        return self.run_test("Get Active Services", "GET", "api/services?active_only=true", 200)

    def test_create_service(self):
        """Test creating a new service"""
        service_data = {
            "title": "Test Service",
            "slug": "test-service",
            "short_description": "A test service",
            "description": "This is a test service for API testing",
            "icon": "Code",
            "features": ["Feature 1", "Feature 2"],
            "order": 99
        }
        success, response = self.run_test("Create Service", "POST", "api/services", 200, service_data)
        if success and 'service_id' in response:
            self.test_service_id = response['service_id']
            return True
        return False

    def test_get_products(self):
        """Test getting products"""
        return self.run_test("Get Products", "GET", "api/products", 200)

    def test_get_active_products(self):
        """Test getting active products only"""
        return self.run_test("Get Active Products", "GET", "api/products?active_only=true", 200)

    def test_create_product(self):
        """Test creating a new product"""
        product_data = {
            "title": "Test Product",
            "slug": "test-product",
            "short_description": "A test product",
            "description": "This is a test product for API testing",
            "icon": "Package",
            "price": "99.99",
            "price_unit": "per month",
            "features": ["Feature 1", "Feature 2"],
            "order": 99
        }
        success, response = self.run_test("Create Product", "POST", "api/products", 200, product_data)
        if success and 'product_id' in response:
            self.test_product_id = response['product_id']
            return True
        return False

    def test_get_testimonials(self):
        """Test getting testimonials"""
        return self.run_test("Get Testimonials", "GET", "api/testimonials", 200)

    def test_get_active_testimonials(self):
        """Test getting active testimonials only"""
        return self.run_test("Get Active Testimonials", "GET", "api/testimonials?active_only=true", 200)

    def test_submit_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test Contact",
            "email": "test@example.com",
            "phone": "+1234567890",
            "subject": "Test Subject",
            "message": "This is a test message from API testing"
        }
        success, response = self.run_test("Submit Contact Form", "POST", "api/contact", 200, contact_data)
        if success and 'submission_id' in response:
            self.test_contact_id = response['submission_id']
            return True
        return False

    def test_get_contact_submissions(self):
        """Test getting contact submissions (admin only)"""
        return self.run_test("Get Contact Submissions", "GET", "api/contact", 200)

    def test_get_stats(self):
        """Test getting dashboard stats (admin only)"""
        return self.run_test("Get Dashboard Stats", "GET", "api/stats", 200)

    def test_get_settings(self):
        """Test getting site settings"""
        return self.run_test("Get Site Settings", "GET", "api/settings", 200)

    def test_get_portfolio(self):
        """Test getting portfolio items"""
        return self.run_test("Get Portfolio", "GET", "api/portfolio", 200)

    def test_get_blog_posts(self):
        """Test getting blog posts"""
        return self.run_test("Get Blog Posts", "GET", "api/blog", 200)

    def test_logout(self):
        """Test user logout"""
        return self.run_test("User Logout", "POST", "api/auth/logout", 200)

def main():
    print("🚀 Starting DioCreations API Tests...")
    print("=" * 50)
    
    tester = DioCreationsAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Seed Data", tester.test_seed_data),
        ("User Registration", tester.test_register_user),
        ("User Login", tester.test_login_user),
        ("Get Current User", tester.test_get_current_user),
        ("Get Services", tester.test_get_services),
        ("Get Active Services", tester.test_get_active_services),
        ("Create Service", tester.test_create_service),
        ("Get Products", tester.test_get_products),
        ("Get Active Products", tester.test_get_active_products),
        ("Create Product", tester.test_create_product),
        ("Get Testimonials", tester.test_get_testimonials),
        ("Get Active Testimonials", tester.test_get_active_testimonials),
        ("Submit Contact Form", tester.test_submit_contact_form),
        ("Get Contact Submissions", tester.test_get_contact_submissions),
        ("Get Dashboard Stats", tester.test_get_stats),
        ("Get Site Settings", tester.test_get_settings),
        ("Get Portfolio", tester.test_get_portfolio),
        ("Get Blog Posts", tester.test_get_blog_posts),
        ("User Logout", tester.test_logout),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('actual', 'Unknown error'))}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())