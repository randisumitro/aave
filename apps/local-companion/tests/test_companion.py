"""
AAVE Local Companion Service Tests
Copyright (c) 2026 Randi Sumitro. All rights reserved.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_companion_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AAVE Local Companion"
    assert data["author"] == "Randi Sumitro"


def test_companion_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["author"] == "Randi Sumitro"


def test_companion_websocket():
    with client.websocket_connect("/ws/test-plugin") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_json()
        assert data["type"] == "ack"
        assert data["client_id"] == "test-plugin"
        assert data["received"] == "ping"
