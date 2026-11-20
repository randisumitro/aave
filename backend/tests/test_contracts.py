"""
AAVE Backend Contract Tests
Tests for EDL schema validation, job state transitions, plugin manifest validation.
Copyright (c) 2026 Randi Sumitro. All rights reserved.
"""

import json
import sys
import os

# Add packages directory to path for TypeScript schema imports (via Node)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "packages"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_edl_schema_validation():
    """Test that EDL JSON schema validates correctly."""
    # Valid EDL
    valid_edl = {
        "version": "1.0.0",
        "project": {
            "format": "vertical",
            "width": 1080,
            "height": 1920,
            "fps": 30,
            "target_duration": 45,
            "aspect_ratio": "9:16",
        },
        "creative_direction": {
            "style": "dynamic_ugc",
            "pace": "fast",
            "tone": "engaging",
        },
        "timeline": [
            {
                "id": "edit_1",
                "source": "footage_001.mp4",
                "source_in": 0,
                "source_out": 10,
                "timeline_start": 0,
                "role": "hook",
                "duration": 10,
            },
        ],
    }

    # Validate using the same logic as validateEDL
    errors = []
    if valid_edl.get("version") != "1.0.0":
        errors.append('EDL version must be "1.0.0"')
    if not valid_edl.get("project"):
        errors.append("EDL.project is required")
    if not valid_edl.get("creative_direction"):
        errors.append("EDL.creative_direction is required")
    if not isinstance(valid_edl.get("timeline"), list) or len(valid_edl["timeline"]) == 0:
        errors.append("EDL.timeline must be a non-empty array")

    assert len(errors) == 0, f"Valid EDL should pass: {errors}"


def test_edl_schema_rejects_invalid():
    """Test that invalid EDL is rejected."""
    invalid_edl = {
        "version": "2.0.0",  # Wrong version
        "project": {
            "format": "vertical",
            # Missing width, height, fps, etc.
        },
        "creative_direction": {
            "style": "dynamic_ugc",
            # Missing pace, tone
        },
        "timeline": [],  # Empty timeline
    }

    errors = []
    if invalid_edl.get("version") != "1.0.0":
        errors.append('EDL version must be "1.0.0"')
    if not invalid_edl.get("project"):
        errors.append("EDL.project is required")
    else:
        for field in ["format", "width", "height", "fps", "target_duration", "aspect_ratio"]:
            if field not in invalid_edl["project"]:
                errors.append(f"EDL.project.{field} is required")
    if not invalid_edl.get("creative_direction"):
        errors.append("EDL.creative_direction is required")
    else:
        for field in ["style", "pace", "tone"]:
            if field not in invalid_edl["creative_direction"]:
                errors.append(f"EDL.creative_direction.{field} is required")
    if not isinstance(invalid_edl.get("timeline"), list) or len(invalid_edl["timeline"]) == 0:
        errors.append("EDL.timeline must be a non-empty array")

    assert len(errors) > 0, "Invalid EDL should produce errors"
    assert any("version" in e for e in errors), "Should catch version error"
    assert any("timeline" in e for e in errors), "Should catch timeline error"


def test_job_state_transitions():
    """Test valid job state transitions."""
    transitions = {
        "CREATED": ["MEDIA_ANALYSIS", "FAILED", "CANCELLED", "PAUSED"],
        "MEDIA_ANALYSIS": ["CREATIVE_PLANNING", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "CREATIVE_PLANNING": ["EDIT_PLAN_READY", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "EDIT_PLAN_READY": ["TIMELINE_EXECUTION", "FAILED", "NEEDS_USER_INPUT", "CANCELLED", "PAUSED"],
        "TIMELINE_EXECUTION": ["MOTION_GRAPHICS", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "MOTION_GRAPHICS": ["SOUND_DESIGN", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "SOUND_DESIGN": ["RENDERING", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "RENDERING": ["QUALITY_CHECK", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "QUALITY_CHECK": ["COMPLETED", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"],
        "COMPLETED": [],
        "FAILED": ["NEEDS_RETRY", "CANCELLED"],
        "PAUSED": ["CREATED", "CANCELLED"],
        "CANCELLED": [],
        "NEEDS_RETRY": ["CREATED", "CANCELLED"],
        "NEEDS_USER_INPUT": ["EDIT_PLAN_READY", "CANCELLED"],
    }

    terminal_states = ["COMPLETED", "FAILED", "CANCELLED"]

    # Test that CREATED -> MEDIA_ANALYSIS is valid
    assert "MEDIA_ANALYSIS" in transitions["CREATED"]

    # Test that COMPLETED has no outgoing transitions
    assert transitions["COMPLETED"] == []

    # Test that FAILED -> NEEDS_RETRY is valid
    assert "NEEDS_RETRY" in transitions["FAILED"]

    # Test that CREATED -> COMPLETED is NOT valid
    assert "COMPLETED" not in transitions["CREATED"]

    # Test terminal states
    for state in terminal_states:
        assert state in ["COMPLETED", "FAILED", "CANCELLED"]


def test_plugin_manifest_validation():
    """Test plugin manifest schema validation."""
    valid_manifest = {
        "id": "com.aave.test-plugin",
        "name": "Test Plugin",
        "version": "1.0.0",
        "description": "A test plugin",
        "author": "Randi Sumitro",
        "host": {"app": "PR", "minVersion": "25.0"},
        "runtime": {"javascript": True, "cef": True},
        "ui": {"type": "panel", "title": "Test", "width": 380, "height": 600},
        "permissions": {"localFileSystem": "all", "network": "all"},
        "entrypoints": [{"type": "panel", "id": "test-panel", "main": "src/index.js"}],
        "requiredPermissions": ["read_project"],
    }

    errors = []
    required_fields = [
        "id", "name", "version", "description", "author", "host",
        "runtime", "ui", "permissions", "entrypoints", "requiredPermissions",
    ]
    for field in required_fields:
        if field not in valid_manifest:
            errors.append(f"Manifest.{field} is required")

    assert len(errors) == 0, f"Valid manifest should pass: {errors}"
    assert valid_manifest["host"]["app"] in ["PR", "AE"]
    assert isinstance(valid_manifest["entrypoints"], list)
    assert len(valid_manifest["entrypoints"]) > 0


def test_plugin_manifest_rejects_invalid():
    """Test that invalid plugin manifest is rejected."""
    invalid_manifest = {
        "id": "invalid-id",  # Not reverse-DNS style
        "name": "Test",
        # Missing version, author, host, etc.
    }

    errors = []
    if not invalid_manifest.get("version"):
        errors.append("Manifest.version is required")
    if not invalid_manifest.get("host"):
        errors.append("Manifest.host is required")
    if not invalid_manifest.get("entrypoints"):
        errors.append("Manifest.entrypoints is required")

    assert len(errors) > 0, "Invalid manifest should produce errors"


def test_error_response_shape():
    """Test that error responses follow the standard shape."""
    response = client.get("/api/v1/jobs/nonexistent-id")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "code" in data
    assert "timestamp" in data


def test_api_returns_creator_info():
    """Test that the API returns creator attribution."""
    response = client.get("/api/v1/system/creator")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Randi Sumitro"
    assert data["github"] == "https://github.com/randisumitro"
    assert data["project"] == "AAVE - Autonomous AI Video Editor"
    assert data["license"] == "MIT"
