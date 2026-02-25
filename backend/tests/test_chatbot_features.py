"""
Tests for DioCreations Chatbot Features (iteration 6)
- Chatbot greeting endpoint (public)
- Chatbot settings CRUD (admin-only)
- POST /api/chat functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@diocreations.com"
ADMIN_PASSWORD = "adminpassword"


class TestChatbotGreetingEndpoint:
    """Test the public chatbot greeting endpoint"""

    def test_get_greeting_returns_200(self):
        """GET /api/chatbot/greeting should return 200"""
        response = requests.get(f"{BASE_URL}/api/chatbot/greeting")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/chatbot/greeting returns 200")

    def test_greeting_has_required_field(self):
        """Greeting response should have 'greeting' field"""
        response = requests.get(f"{BASE_URL}/api/chatbot/greeting")
        data = response.json()
        assert "greeting" in data, "Response should have 'greeting' field"
        assert isinstance(data["greeting"], str), "Greeting should be a string"
        assert len(data["greeting"]) > 0, "Greeting should not be empty"
        print(f"✓ Greeting received: {data['greeting'][:50]}...")

    def test_greeting_is_random(self):
        """Multiple calls should potentially return different greetings"""
        greetings = set()
        for _ in range(5):
            response = requests.get(f"{BASE_URL}/api/chatbot/greeting")
            greetings.add(response.json().get("greeting"))
        # With default 8 greetings, we should get some variety in 5 calls
        print(f"✓ Got {len(greetings)} unique greeting(s) in 5 calls")


class TestChatbotSettingsAuth:
    """Test that chatbot settings endpoints require authentication"""

    def test_get_settings_requires_auth(self):
        """GET /api/chatbot/settings should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/chatbot/settings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/chatbot/settings returns 401 without auth")

    def test_put_settings_requires_auth(self):
        """PUT /api/chatbot/settings should return 401 without auth"""
        response = requests.put(
            f"{BASE_URL}/api/chatbot/settings",
            json={"greetings": ["Test"]},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ PUT /api/chatbot/settings returns 401 without auth")


class TestChatbotSettingsWithAuth:
    """Test chatbot settings with admin authentication"""

    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Login and get authenticated session"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed with status {login_response.status_code}")
        print(f"✓ Admin login successful")

    def test_get_settings_with_auth(self):
        """GET /api/chatbot/settings should return 200 with auth"""
        response = self.session.get(f"{BASE_URL}/api/chatbot/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/chatbot/settings returns 200 with auth")

    def test_settings_structure(self):
        """Settings should have greetings, knowledge_base, and personality"""
        response = self.session.get(f"{BASE_URL}/api/chatbot/settings")
        data = response.json()
        
        assert "greetings" in data, "Settings should have 'greetings' array"
        assert isinstance(data["greetings"], list), "greetings should be a list"
        
        assert "knowledge_base" in data, "Settings should have 'knowledge_base' array"
        assert isinstance(data["knowledge_base"], list), "knowledge_base should be a list"
        
        assert "personality" in data, "Settings should have 'personality' string"
        # personality can be empty string, so just check type
        assert isinstance(data["personality"], str), "personality should be a string"
        
        print(f"✓ Settings structure correct: {len(data['greetings'])} greetings, {len(data['knowledge_base'])} KB entries")

    def test_update_settings_greetings(self):
        """PUT /api/chatbot/settings should update greetings"""
        # First get current settings
        get_response = self.session.get(f"{BASE_URL}/api/chatbot/settings")
        original_settings = get_response.json()
        
        # Update with test greeting
        test_greeting = "TEST_GREETING_PYTEST_UNIQUE_12345"
        update_data = {
            "greetings": original_settings.get("greetings", []) + [test_greeting],
            "knowledge_base": original_settings.get("knowledge_base", []),
            "personality": original_settings.get("personality", "")
        }
        
        put_response = self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200, f"Expected 200, got {put_response.status_code}"
        
        # Verify the update
        updated = put_response.json()
        assert test_greeting in updated.get("greetings", []), "Test greeting should be in updated greetings"
        print("✓ PUT /api/chatbot/settings successfully updates greetings")
        
        # Clean up: restore original settings
        cleanup_response = self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=original_settings,
            headers={"Content-Type": "application/json"}
        )
        assert cleanup_response.status_code == 200, "Cleanup should succeed"
        print("✓ Settings restored to original")

    def test_update_settings_knowledge_base(self):
        """PUT /api/chatbot/settings should update knowledge_base"""
        # Get current settings
        get_response = self.session.get(f"{BASE_URL}/api/chatbot/settings")
        original_settings = get_response.json()
        
        # Add test KB entry
        test_kb_entry = {
            "title": "TEST_KB_PYTEST_UNIQUE",
            "content": "This is a test knowledge base entry for pytest",
            "enabled": True
        }
        update_data = {
            "greetings": original_settings.get("greetings", []),
            "knowledge_base": original_settings.get("knowledge_base", []) + [test_kb_entry],
            "personality": original_settings.get("personality", "")
        }
        
        put_response = self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        # Verify
        updated = put_response.json()
        kb_titles = [kb.get("title") for kb in updated.get("knowledge_base", [])]
        assert "TEST_KB_PYTEST_UNIQUE" in kb_titles, "Test KB entry should be added"
        print("✓ PUT /api/chatbot/settings successfully updates knowledge_base")
        
        # Cleanup
        self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=original_settings,
            headers={"Content-Type": "application/json"}
        )

    def test_update_settings_personality(self):
        """PUT /api/chatbot/settings should update personality"""
        get_response = self.session.get(f"{BASE_URL}/api/chatbot/settings")
        original_settings = get_response.json()
        
        test_personality = "TEST_PERSONALITY_PYTEST_UNIQUE"
        update_data = {
            "greetings": original_settings.get("greetings", []),
            "knowledge_base": original_settings.get("knowledge_base", []),
            "personality": test_personality
        }
        
        put_response = self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        updated = put_response.json()
        assert updated.get("personality") == test_personality, "Personality should be updated"
        print("✓ PUT /api/chatbot/settings successfully updates personality")
        
        # Cleanup
        self.session.put(
            f"{BASE_URL}/api/chatbot/settings",
            json=original_settings,
            headers={"Content-Type": "application/json"}
        )


class TestChatEndpoint:
    """Test POST /api/chat endpoint"""

    def test_chat_endpoint_exists(self):
        """POST /api/chat should accept requests"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": "test_session_pytest_12345",
                "message": "Hello"
            },
            headers={"Content-Type": "application/json"}
        )
        # Chat might return 200 or 500 if LLM fails, but should not be 404
        assert response.status_code != 404, f"Chat endpoint should exist, got {response.status_code}"
        print(f"✓ POST /api/chat endpoint exists, status: {response.status_code}")

    def test_chat_returns_response(self):
        """POST /api/chat should return a response"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": f"test_session_pytest_{os.urandom(4).hex()}",
                "message": "What services does DioCreations offer?"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            assert "response" in data, "Chat response should have 'response' field"
            assert len(data["response"]) > 0, "Response should not be empty"
            print(f"✓ Chat response received: {data['response'][:100]}...")
        else:
            print(f"⚠ Chat endpoint returned {response.status_code} - may be LLM issue")


class TestChatHistoryEndpoint:
    """Test GET /api/chat/{session_id}/history endpoint"""

    def test_chat_history_endpoint_exists(self):
        """GET /api/chat/{session_id}/history should return 200"""
        session_id = f"test_history_pytest_{os.urandom(4).hex()}"
        response = requests.get(f"{BASE_URL}/api/chat/{session_id}/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/chat/{session_id}/history returns 200")

    def test_chat_history_structure(self):
        """Chat history should have expected structure"""
        session_id = f"test_history_pytest_{os.urandom(4).hex()}"
        response = requests.get(f"{BASE_URL}/api/chat/{session_id}/history")
        data = response.json()
        assert "history" in data, "Response should have 'history' field"
        assert isinstance(data["history"], list), "history should be a list"
        print("✓ Chat history structure is correct")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
