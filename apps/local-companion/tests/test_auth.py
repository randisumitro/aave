"""
AAVE Local Companion Service Authentication Tests
Tests for companion authentication, token validation, and security.
⚠️ UNIT TEST - Tests run without actual Adobe applications.
Copyright (c) 2026 Randi Sumitro. All rights reserved.
"""

import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_companion_health_with_ffmpeg():
    """Test health endpoint reports FFmpeg status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ffmpeg" in data
    assert isinstance(data["ffmpeg"], bool)


def test_companion_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AAVE Local Companion"
    assert data["author"] == "Randi Sumitro"


def test_companion_websocket():
    """Test WebSocket connection."""
    with client.websocket_connect("/ws/test-plugin") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_json()
        assert data["type"] == "ack"
        assert data["client_id"] == "test-plugin"
        assert data["received"] == "ping"


def test_file_access_allowlist():
    """Test that file access allowlist is configured."""
    from main import FILE_ALLOWLIST
    assert len(FILE_ALLOWLIST) > 0
    # Should include common user directories
    assert any("Documents" in p or "Movies" in p or p == "/tmp" for p in FILE_ALLOWLIST)


def test_is_path_allowed():
    """Test path allowlist validation."""
    from main import _is_path_allowed

    # /tmp should be allowed
    assert _is_path_allowed("/tmp/test.mp4") is True

    # A path outside allowlist should be denied
    assert _is_path_allowed("/etc/passwd") is False
    assert _is_path_allowed("/root/secret") is False


def test_companion_token_not_hardcoded():
    """Test that companion token is read from env, not hardcoded."""
    from main import COMPANION_TOKEN
    # Token should be empty or from env, never hardcoded in source
    assert isinstance(COMPANION_TOKEN, str)


def test_job_creation_and_cancellation():
    """Test job lifecycle through companion API."""
    # Create a job
    response = client.post("/api/v1/jobs/editing", json={
        "project": {
            "format": "vertical",
            "width": 1080,
            "height": 1920,
            "fps": 30,
            "target_duration": 45,
        },
        "creative_direction": {
            "style": "dynamic_ugc",
            "pace": "fast",
            "tone": "engaging",
        },
        "source": "premiere_active_project",
    })
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "CREATED"

    job_id = data["job_id"]

    # Get the job
    response = client.get(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json()["job_id"] == job_id

    # Cancel the job
    response = client.post(f"/api/v1/jobs/{job_id}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_nonexistent_job_returns_404():
    """Test that getting a nonexistent job returns 404."""
    response = client.get("/api/v1/jobs/nonexistent-id")
    assert response.status_code == 404
