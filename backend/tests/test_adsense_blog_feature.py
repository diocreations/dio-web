"""
Test AdSense Blog Feature - Iteration 45
Tests the ability to save and retrieve adsense_code and adsense_position fields in blog posts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdSenseBlogFeature:
    """Tests for AdSense integration in blog posts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@diocreations.com", "password": "adminpassword"}
        )
        if login_response.status_code == 200:
            self.auth_token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
        
        yield
        
        # Cleanup: Delete test posts
        try:
            posts = self.session.get(f"{BASE_URL}/api/blog").json()
            for post in posts:
                if post.get("title", "").startswith("TEST_ADSENSE"):
                    self.session.delete(f"{BASE_URL}/api/blog/{post['post_id']}")
        except:
            pass
    
    def test_blog_api_health(self):
        """Test that blog API is accessible"""
        response = self.session.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Blog API returned {len(data)} posts")
    
    def test_create_blog_post_with_adsense_code(self):
        """Test creating a blog post with AdSense code"""
        adsense_code = '''<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-1234567890123456"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>'''
        
        post_data = {
            "title": "TEST_ADSENSE_Post_With_Ads",
            "slug": "test-adsense-post-with-ads",
            "excerpt": "Test post with AdSense code",
            "content": "<p>This is a test blog post with AdSense integration.</p><p>Second paragraph here.</p>",
            "category": "Test",
            "author": "Test Author",
            "tags": ["test", "adsense"],
            "is_published": True,
            "adsense_code": adsense_code,
            "adsense_position": "after_first_paragraph"
        }
        
        response = self.session.post(f"{BASE_URL}/api/blog", json=post_data)
        assert response.status_code == 200, f"Failed to create post: {response.text}"
        
        created_post = response.json()
        assert created_post["title"] == post_data["title"]
        assert created_post.get("adsense_code") == adsense_code
        assert created_post.get("adsense_position") == "after_first_paragraph"
        print(f"Created blog post with AdSense: {created_post['post_id']}")
        
        # Verify by fetching the post
        get_response = self.session.get(f"{BASE_URL}/api/blog/{post_data['slug']}")
        assert get_response.status_code == 200
        fetched_post = get_response.json()
        assert fetched_post.get("adsense_code") == adsense_code
        assert fetched_post.get("adsense_position") == "after_first_paragraph"
        print("Verified AdSense code persisted correctly")
    
    def test_create_blog_post_with_different_positions(self):
        """Test creating blog posts with different AdSense positions"""
        positions = ["before_content", "after_first_paragraph", "middle_content", "after_content"]
        
        for position in positions:
            post_data = {
                "title": f"TEST_ADSENSE_Position_{position}",
                "slug": f"test-adsense-position-{position}",
                "excerpt": f"Test post with AdSense at {position}",
                "content": "<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p>",
                "category": "Test",
                "author": "Test Author",
                "is_published": True,
                "adsense_code": '<ins class="adsbygoogle" data-ad-client="ca-pub-test" data-ad-slot="123"></ins>',
                "adsense_position": position
            }
            
            response = self.session.post(f"{BASE_URL}/api/blog", json=post_data)
            assert response.status_code == 200, f"Failed to create post with position {position}"
            
            created_post = response.json()
            assert created_post.get("adsense_position") == position
            print(f"Created post with position: {position}")
    
    def test_update_blog_post_adsense_code(self):
        """Test updating AdSense code on existing blog post"""
        # First create a post without AdSense
        post_data = {
            "title": "TEST_ADSENSE_Update_Test",
            "slug": "test-adsense-update-test",
            "excerpt": "Test post for updating AdSense",
            "content": "<p>Content here.</p>",
            "category": "Test",
            "author": "Test Author",
            "is_published": True
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/blog", json=post_data)
        assert create_response.status_code == 200
        post_id = create_response.json()["post_id"]
        
        # Now update with AdSense code
        update_data = {
            "adsense_code": '<ins class="adsbygoogle" data-ad-client="ca-pub-updated" data-ad-slot="999"></ins>',
            "adsense_position": "middle_content"
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/blog/{post_id}", json=update_data)
        assert update_response.status_code == 200
        
        updated_post = update_response.json()
        assert updated_post.get("adsense_code") == update_data["adsense_code"]
        assert updated_post.get("adsense_position") == "middle_content"
        print(f"Successfully updated AdSense code on post {post_id}")
    
    def test_blog_post_without_adsense(self):
        """Test that blog posts without AdSense still work correctly"""
        post_data = {
            "title": "TEST_ADSENSE_No_Ads",
            "slug": "test-adsense-no-ads",
            "excerpt": "Test post without AdSense",
            "content": "<p>Regular content without ads.</p>",
            "category": "Test",
            "author": "Test Author",
            "is_published": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/blog", json=post_data)
        assert response.status_code == 200
        
        created_post = response.json()
        # adsense_code should be None or not present
        assert created_post.get("adsense_code") is None or "adsense_code" not in created_post
        print("Blog post without AdSense created successfully")
    
    def test_get_existing_blog_posts(self):
        """Test fetching existing blog posts to verify API structure"""
        response = self.session.get(f"{BASE_URL}/api/blog")
        assert response.status_code == 200
        
        posts = response.json()
        assert len(posts) > 0, "No blog posts found"
        
        # Check first post structure
        first_post = posts[0]
        required_fields = ["title", "slug", "content", "post_id"]
        for field in required_fields:
            assert field in first_post, f"Missing required field: {field}"
        
        print(f"Found {len(posts)} blog posts with correct structure")


class TestBlogPostPageAPI:
    """Test blog post retrieval by slug"""
    
    def test_get_blog_post_by_slug(self):
        """Test fetching a specific blog post by slug"""
        session = requests.Session()
        
        # First get list of posts
        list_response = session.get(f"{BASE_URL}/api/blog")
        assert list_response.status_code == 200
        posts = list_response.json()
        
        if len(posts) > 0:
            slug = posts[0]["slug"]
            response = session.get(f"{BASE_URL}/api/blog/{slug}")
            assert response.status_code == 200
            
            post = response.json()
            assert post["slug"] == slug
            print(f"Successfully fetched blog post: {post['title']}")
    
    def test_get_nonexistent_blog_post(self):
        """Test fetching a non-existent blog post returns 404"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/blog/nonexistent-slug-12345")
        assert response.status_code == 404
        print("Correctly returned 404 for non-existent post")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
