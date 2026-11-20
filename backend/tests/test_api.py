"""
AAVE Backend API Tests
Copyright (c) 2026 Randi Sumitro. All rights reserved.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AAVE Backend"
    assert data["author"] == "Randi Sumitro"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["author"] == "Randi Sumitro"


def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_system_creator():
    response = client.get("/api/v1/system/creator")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Randi Sumitro"
    assert data["github"] == "https://github.com/randisumitro"


def test_create_job():
    response = client.post("/api/v1/jobs", json={
        "project": {
            "format": "vertical",
            "width": 1080,
            "height": 1920,
            "fps": 30,
            "target_duration": 45
        },
        "creative_direction": {
            "style": "dynamic_ugc",
            "pace": "fast",
            "tone": "engaging"
        },
        "source": "premiere_active_project"
    })
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "CREATED"


def test_get_job():
    # Create a job first
    create_response = client.post("/api/v1/jobs", json={
        "project": {
            "format": "vertical",
            "width": 1080,
            "height": 1920,
            "fps": 30,
            "target_duration": 45
        },
        "creative_direction": {
            "style": "dynamic_ugc",
            "pace": "fast",
            "tone": "engaging"
        }
    })
    job_id = create_response.json()["job_id"]

    # Get the job
    response = client.get(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json()["job_id"] == job_id


def test_get_nonexistent_job():
    response = client.get("/api/v1/jobs/nonexistent-id")
    assert response.status_code == 404
