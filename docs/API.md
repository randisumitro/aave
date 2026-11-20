# AAVE API Reference

Autonomous AI Video Editor - REST API Documentation

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Author: Randi Sumitro (https://github.com/randisumitro)
License: MIT

## Base URL

- Development: `http://localhost:8000`
- Production: Configured via deployment

## Authentication

Phase 1 does not require authentication for the backend API. The Local Companion service uses token-based authentication via `AAVE_COMPANION_TOKEN` environment variable.

## Response Format

All API responses are JSON. Error responses follow the standard `AAVEErrorResponse` format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": null,
  "timestamp": "2026-11-21T05:00:00+07:00",
  "request_id": null
}
```

## Standard Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `INVALID_REQUEST` | Invalid request format |
| `MISSING_FIELD` | Required field missing |
| `JOB_NOT_FOUND` | Job not found |
| `JOB_ALREADY_EXISTS` | Job already exists |
| `INVALID_STATE_TRANSITION` | Invalid job state transition |
| `JOB_CANCELLED` | Job is cancelled |
| `ADOBE_NOT_CONNECTED` | Adobe application not connected |
| `ADOBE_API_ERROR` | Adobe API error |
| `ADOBE_UNSUPPORTED_VERSION` | Unsupported Adobe version |
| `COMPANION_NOT_CONNECTED` | Companion service not connected |
| `COMPANION_AUTH_FAILED` | Companion authentication failed |
| `IPC_AUTH_FAILED` | IPC authentication failed |
| `FFMPEG_NOT_FOUND` | FFmpeg not found |
| `MEDIA_NOT_FOUND` | Media file not found |
| `FILE_ACCESS_DENIED` | File access denied by allowlist |
| `MODEL_NOT_FOUND` | Model not found |
| `MODEL_PROVIDER_ERROR` | Model provider error |
| `PLUGIN_NOT_FOUND` | Plugin not found |
| `PLUGIN_MANIFEST_INVALID` | Invalid plugin manifest |
| `PLUGIN_PERMISSION_DENIED` | Plugin permission denied |
| `INTERNAL_ERROR` | Internal server error |
| `NOT_IMPLEMENTED` | Feature not implemented |

## Endpoints

### Root

**GET /**

Returns service information.

```json
{
  "service": "AAVE Backend",
  "version": "1.0.0",
  "author": "Randi Sumitro",
  "repository": "https://github.com/randisumitro/aave"
}
```

### Health

**GET /health**

Returns detailed health status including database connection.

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "author": "Randi Sumitro",
  "timestamp": "2026-11-21T05:00:00+07:00",
  "database": "connected"
}
```

**GET /api/v1/health**

Returns basic health status.

```json
{
  "status": "healthy",
  "author": "Randi Sumitro"
}
```

### Jobs

**POST /api/v1/jobs**

Create a new editing job.

**Request Body:**
```json
{
  "project": {
    "format": "vertical",
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "target_duration": 45,
    "aspect_ratio": "9:16"
  },
  "creative_direction": {
    "style": "dynamic_ugc",
    "pace": "fast",
    "tone": "engaging",
    "hook_strength_threshold": 0.7
  },
  "source": "premiere_active_project"
}
```

**Response (200):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CREATED",
  "message": "Job created successfully",
  "created_at": "2026-11-21T05:00:00+07:00"
}
```

**GET /api/v1/jobs/{job_id}**

Get job status and details.

**Response (200):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "MEDIA_ANALYSIS",
  "progress": 25,
  "message": "Running scene detection...",
  "output_path": null,
  "project_path": null,
  "error_message": null,
  "created_at": "2026-11-21T05:00:00+07:00",
  "updated_at": "2026-11-21T05:00:00+07:00",
  "completed_at": null
}
```

**POST /api/v1/jobs/{job_id}/cancel**

Cancel a running job.

**Response (200):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CANCELLED"
}
```

**GET /api/v1/jobs**

List all jobs.

**Response (200):**
```json
{
  "jobs": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "CREATED",
      "progress": 0,
      "created_at": "2026-11-21T05:00:00+07:00"
    }
  ],
  "total": 1
}
```

### Model Registry

**POST /api/v1/models**

Register a new AI model.

**Request Body:**
```json
{
  "model_id": "gemini-pro-video",
  "provider": "gemini",
  "model_name": "gemini-pro",
  "task_types": ["video_understanding", "scene_analysis"],
  "enabled": true,
  "priority": 1,
  "max_tokens": 8000,
  "timeout_seconds": 120
}
```

**GET /api/v1/models**

List all registered models.

**GET /api/v1/models/{model_id}**

Get a specific model by ID.

**POST /api/v1/models/route**

Route a task to the best available model.

**Request Body:**
```json
{
  "task_type": "video_understanding",
  "preferred_provider": null
}
```

**Response (200):**
```json
{
  "model_id": "gemini-pro-video",
  "provider": "gemini",
  "model_name": "gemini-pro",
  "selected_reason": "selected by task_type=video_understanding, provider=gemini, priority=1"
}
```

**POST /api/v1/models/versions**

Create a model version (placeholder for Phase 6).

### System

**GET /api/v1/system/status**

Get system status.

```json
{
  "status": "operational",
  "author": "Randi Sumitro",
  "database": "connected"
}
```

**GET /api/v1/system/creator**

Get creator attribution.

```json
{
  "name": "Randi Sumitro",
  "github": "https://github.com/randisumitro",
  "project": "AAVE - Autonomous AI Video Editor",
  "license": "MIT"
}
```

### WebSocket

**WS /api/v1/ws/jobs/{job_id}**

WebSocket endpoint for job progress updates.

## Pydantic Schemas

### JobCreateRequest

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| project | ProjectSettingsIn | No | Default vertical 1080x1920 | Project settings |
| creative_direction | CreativeDirectionIn | No | Default dynamic_ugc | Creative direction |
| source | string | No | "premiere_active_project" | Job source |

### ProjectSettingsIn

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| format | string | No | "vertical" | vertical\|square\|horizontal |
| width | integer | No | 1080 | >= 1 |
| height | integer | No | 1920 | >= 1 |
| fps | integer | No | 30 | >= 1 |
| target_duration | integer | No | 45 | 15-90 |
| aspect_ratio | string | No | "9:16" | 9:16\|1:1\|16:9 |

### CreativeDirectionIn

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| style | string | No | "dynamic_ugc" | - |
| pace | string | No | "fast" | slow\|medium\|fast |
| tone | string | No | "engaging" | - |
| hook_strength_threshold | float | No | null | 0-1 |

### ModelIn

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| model_id | string | Yes | Min length 1 |
| provider | string | Yes | Min length 1 |
| model_name | string | Yes | Min length 1 |
| task_types | string[] | No | Default [] |
| enabled | boolean | No | Default true |
| priority | integer | No | Default 1, >= 1 |
| max_tokens | integer | No | Default 8000, >= 1 |
| timeout_seconds | integer | No | Default 120, >= 1 |

## Attribution

**Created by:** Randi Sumitro  
**GitHub:** https://github.com/randisumitro  
**Email:** 136390141+randisumitro@users.noreply.github.com  
**License:** MIT (Copyright 2026 Randi Sumitro)
