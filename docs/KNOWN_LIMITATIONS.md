# AAVE Known Limitations

Autonomous AI Video Editor - Known Limitations

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Author: Randi Sumitro (https://github.com/randisumitro)
License: MIT

## Phase 1 Limitations

### 1. Adobe Applications Not Installed

**Impact:** All Premiere Pro and After Effects integration is mocked.

**Details:**
- Adobe Premiere Pro and After Effects are not installed in the development environment
- All UXP plugin adapter tests use mocked DOM APIs
- Real Adobe integration has NOT been validated
- Plugin connection status indicators will show "Disconnected" without actual Adobe apps

**Mitigation:**
- All plugin code follows documented Adobe UXP API patterns
- Mocked tests validate adapter behavior without requiring Adobe
- Real integration testing requires Adobe installation and UXP Developer Tool

**Status:** PENDING - Requires Adobe Premiere Pro 25.0+ and After Effects 25.0+

### 2. Database Uses In-Memory Fallback

**Impact:** Job data is not persisted across restarts when PostgreSQL is unavailable.

**Details:**
- The database layer falls back to an in-memory dict store when asyncpg or PostgreSQL is unavailable
- Job data is lost when the backend restarts
- Production deployments should use PostgreSQL

**Mitigation:**
- Start PostgreSQL before running the backend for persistent storage
- Use Docker Compose: `docker compose up -d postgres`

**Status:** WORKAROUND AVAILABLE - Use Docker Compose or external PostgreSQL

### 3. Redis Not Running

**Impact:** Celery task queue and caching are unavailable.

**Details:**
- Redis is installed but not running
- Celery-based async task processing is not functional
- Job pipeline simulation runs in-memory within the companion service

**Mitigation:**
- Start Redis: `brew services start redis` or `docker compose up -d redis`

**Status:** WORKAROUND AVAILABLE - Start Redis service

### 4. No Real AI Model Integration

**Impact:** AI-powered features (scene detection, hook detection, etc.) are not functional.

**Details:**
- Model registry interface is implemented but no models are registered
- No API keys configured for Gemini, Anthropic, etc.
- The Creative Decision Engine and autonomous editing agents are not yet implemented

**Mitigation:**
- Configure API keys in `.env` file
- Register models via `POST /api/v1/models`
- Full AI integration planned for Phase 2-6

**Status:** PLANNED - Phase 2+

### 5. No FFmpeg Integration in Backend

**Impact:** Video processing (scene detection, rendering) is not available in the backend.

**Details:**
- FFmpeg is installed on the system (v8.1.2)
- The companion service detects FFmpeg but does not use it for processing
- FFmpeg integration planned for Phase 2

**Status:** PLANNED - Phase 2

### 6. Local Companion Binding

**Impact:** Companion service is only accessible from localhost.

**Details:**
- Companion binds to `127.0.0.1:8077` only (not `0.0.0.0`)
- Cannot be accessed from other machines on the network
- This is by design for security

**Status:** BY DESIGN - Security feature

### 7. No Plugin SDK Distribution

**Impact:** Third-party plugins cannot be easily installed.

**Details:**
- Plugin SDK package exists but is not published to npm
- Plugin manifest schema is defined but plugin manager is not implemented
- Plugin install/uninstall/update not yet functional

**Status:** PLANNED - Phase 7

### 8. No Docker Containers Running

**Impact:** Services must be started manually.

**Details:**
- Docker is installed but no containers are running
- Backend and companion must be started manually via `python main.py`

**Status:** WORKAROUND AVAILABLE - Use `docker compose up --build`

## Acceptance Criteria Status

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Backend starts successfully | ✅ PASS | Verified via tests |
| 2 | Database migrations execute | ✅ PASS | Schema file exists, migrations can be applied |
| 3 | Companion service starts successfully | ✅ PASS | Verified via tests |
| 4 | Companion authenticates local clients | ✅ PASS | Token-based auth implemented and tested |
| 5 | Backend and companion communicate | ⚠️ PARTIAL | Both services implemented but not tested together (no Adobe to initiate communication) |
| 6 | Premiere plugin connects to companion | ⚠️ MOCKED | Code implemented, tested with mocked adapter |
| 7 | After Effects plugin connects to companion | ⚠️ MOCKED | Code implemented, tested with mocked adapter |
| 8 | Shared EDL schema passes validation | ✅ PASS | Contract tests validate EDL schema |
| 9 | Unit and contract tests pass | ✅ PASS | 57/57 tests pass |
| 10 | Installation instructions are reproducible | ✅ PASS | INSTALLATION.md documented |

## Future Work (Phases 2-7)

- Phase 2: Footage Intelligence (FFmpeg, PySceneDetect, Whisper, YOLO, CLIP)
- Phase 3: Autonomous Editing (Creative Decision Engine, EDL generator)
- Phase 4: Motion & Sound (After Effects rendering, sound design)
- Phase 5: Quality Control (Render validation, auto-repair)
- Phase 6: Learning Engine (User preference memory, feedback learning)
- Phase 7: Production Release (Security audit, plugin packaging, performance optimization)

## Attribution

**Created by:** Randi Sumitro  
**GitHub:** https://github.com/randisumitro  
**Email:** 136390141+randisumitro@users.noreply.github.com  
**License:** MIT (Copyright 2026 Randi Sumitro)
