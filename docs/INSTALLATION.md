# AAVE Installation Guide

Autonomous AI Video Editor - Installation Instructions

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Author: Randi Sumitro (https://github.com/randisumitro)
License: MIT

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 20.0.0 | For plugin development |
| Python | >= 3.11.0 | For backend and companion |
| npm | >= 10.0.0 | Comes with Node.js |
| Docker & Docker Compose | Latest | Optional, for PostgreSQL/Redis |
| PostgreSQL | 16+ | Required for production |
| Redis | 7+ | Required for production |
| FFmpeg | 6.0+ | For video processing |
| Adobe Premiere Pro | 25.0+ | For plugin testing (optional) |
| Adobe After Effects | 25.0+ | For plugin testing (optional) |

## Step 1: Clone the Repository

```bash
git clone https://github.com/randisumitro/aave.git
cd aave
```

## Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs dependencies for the monorepo including plugin workspaces.

## Step 3: Set Up Python Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

## Step 4: Set Up Python Local Companion

```bash
cd ../apps/local-companion
python3 -m venv venv
source venv/bin/activate
pip install -e .
```

## Step 5: Configure Environment Variables

Create a `.env` file in the repository root:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://aave:aave_dev@localhost:5432/aave

# Redis
REDIS_URL=redis://localhost:6379/0

# Companion token (generate a secure random token)
AAVE_COMPANION_TOKEN=your-secure-random-token-here

# File access allowlist (comma-separated paths)
AAVE_FILE_ALLOWLIST=/Users/randisumitro/Documents,/Users/randisumitro/Movies,/tmp

# Model provider API keys (never hardcode these)
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
```

> **Important:** Never commit `.env` to version control. API keys are read from environment variables only and are never logged.

## Step 6: Start PostgreSQL and Redis

### Using Docker Compose

```bash
docker compose up -d postgres redis
```

### Using Homebrew (macOS)

```bash
brew services start postgresql@16
brew services start redis
```

### Verify Connections

```bash
# PostgreSQL
psql -h localhost -U aave -d aave

# Redis
redis-cli ping
```

## Step 7: Run Database Migrations

```bash
cd backend
# Apply the initial schema
psql -h localhost -U aave -d aave -f ../database/migrations/001_initial_schema.sql
```

## Step 8: Start the Services

### Backend (Port 8000)

```bash
cd backend
source venv/bin/activate
python main.py
```

### Local Companion (Port 8077)

```bash
cd apps/local-companion
source venv/bin/activate
python main.py
```

### Verify Services

```bash
# Backend health
curl http://localhost:8000/health

# Companion health
curl http://localhost:8077/health

# Backend API health
curl http://localhost:8000/api/v1/health

# Creator info
curl http://localhost:8000/api/v1/system/creator
```

## Step 9: Load Adobe Plugins (Optional)

Adobe applications are NOT required for Phase 1. All plugin tests are mocked.

To load plugins in actual Adobe applications:

1. Install Adobe UXP Developer Tool
2. Load `apps/premiere-plugin/manifest.json` into Premiere Pro
3. Load `apps/after-effects-plugin/manifest.json` into After Effects
4. Verify connection status indicators show "Connected"

## Running Tests

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Companion Tests

```bash
cd apps/local-companion
source ../backend/venv/bin/activate
pytest tests/ -v
```

### Plugin Tests

```bash
npm run test:plugins
```

### Plugin Type Check

```bash
npm run typecheck:plugins
```

### All Tests

```bash
pytest backend/tests/ -v
pytest apps/local-companion/tests/ -v
npm run test:plugins
```

## Docker Deployment

```bash
docker compose up --build
```

This builds and runs:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 8000)
- Local Companion (port 8077)

## Troubleshooting

### Backend fails to start

- Check that PostgreSQL is running or that in-memory fallback is acceptable
- Verify `DATABASE_URL` environment variable
- Check Python venv is activated

### Companion fails to start

- Verify port 8077 is not in use
- Check Python dependencies are installed

### Plugin typecheck fails

- Ensure Node.js >= 20 is installed
- Run `npm install` in the repository root

### Tests fail

- Backend: Ensure `pytest` and `pytest-asyncio` are installed
- Companion: Use the backend venv to run companion tests
- Plugins: Ensure `vitest` and `typescript` are installed

## Attribution

**Created by:** Randi Sumitro  
**GitHub:** https://github.com/randisumitro  
**Email:** 136390141+randisumitro@users.noreply.github.com  
**License:** MIT (Copyright 2026 Randi Sumitro)
