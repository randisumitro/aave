"""
AAVE Backend - FastAPI Application
Autonomous AI Video Editor backend with REST API, WebSocket support, and agent orchestration.

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Original Creator & Lead Architect: Randi Sumitro (https://github.com/randisumitro)
License: MIT
"""

from contextlib import asynccontextmanager
from fastapi import APIRouter, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from typing import Any, Dict
import asyncio
import uuid
from datetime import datetime, timezone

from aave_logging import configure_logging, get_logger
from database import db
from schemas import (
    AAVEErrorResponse,
    JobCancelResponse,
    JobCreateRequest,
    JobListItem,
    JobListResponse,
    JobResponse,
    JobStatusResponse,
    ProjectSettingsIn,
    CreativeDirectionIn,
    ModelIn,
    ModelOut,
    ModelRouterRequest,
    ModelRouterResponse,
    ModelVersionIn,
    ModelVersionOut,
    ValidationErrorDetail,
    ValidationErrorResponse,
)
from model_registry import model_registry, ModelRegistryError

logger = get_logger("aave.backend")

CREATOR_INFO = {
    "name": "Randi Sumitro",
    "github": "https://github.com/randisumitro",
    "project": "AAVE - Autonomous AI Video Editor",
    "license": "MIT",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect database on startup, disconnect on shutdown."""
    configure_logging()
    logger.info("aave_backend_starting", extra={"version": "1.0.0", "author": "Randi Sumitro"})
    await db.connect()
    yield
    await db.disconnect()
    logger.info("aave_backend_shutdown")


app = FastAPI(
    title="AAVE Backend",
    description="Autonomous AI Video Editor API created by Randi Sumitro",
    version="1.0.0",
    contact={
        "name": "Randi Sumitro",
        "url": "https://github.com/randisumitro",
    },
    license_info={
        "name": "MIT",
        "url": "https://github.com/randisumitro/aave/blob/main/LICENSE",
    },
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)


# --- Standard error handlers ---

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=AAVEErrorResponse(
            error=str(exc.detail),
            code="HTTP_ERROR",
            details=None,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(),
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    errors = [
        ValidationErrorDetail(field=".".join(str(loc) for loc in err["loc"]), message=err["msg"])
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=ValidationErrorResponse(
            error="Request validation failed",
            code="VALIDATION_ERROR",
            errors=errors,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        ValidationErrorDetail(field=".".join(str(loc) for loc in err["loc"]), message=err["msg"])
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=ValidationErrorResponse(
            error="Request validation failed",
            code="VALIDATION_ERROR",
            errors=errors,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(),
    )


@app.exception_handler(ModelRegistryError)
async def model_registry_exception_handler(request: Request, exc: ModelRegistryError):
    return JSONResponse(
        status_code=404,
        content=AAVEErrorResponse(
            error=str(exc),
            code="MODEL_NOT_FOUND",
            details=None,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", extra={"error": str(exc), "path": request.url.path})
    return JSONResponse(
        status_code=500,
        content=AAVEErrorResponse(
            error="Internal server error",
            code="INTERNAL_ERROR",
            details=None,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(),
    )


# --- In-memory job store (fallback when PostgreSQL unavailable) ---

_jobs: Dict[str, Dict[str, Any]] = {}


async def _get_job(job_id: str) -> Dict[str, Any] | None:
    if db.is_connected and not db._use_memory:
        row = await db.fetchrow("SELECT * FROM editing_jobs WHERE id = $1", job_id)
        if row:
            return dict(row)
        return None
    return _jobs.get(job_id)


async def _create_job(job_data: Dict[str, Any]) -> None:
    if db.is_connected and not db._use_memory:
        await db.execute(
            """
            INSERT INTO editing_jobs (id, user_id, status, creative_direction, project_settings, progress, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            job_data["job_id"],
            job_data.get("user_id"),
            job_data["status"],
            job_data.get("creative_direction", {}),
            job_data.get("project_settings", {}),
            job_data.get("progress", 0),
            job_data["created_at"],
            job_data["updated_at"],
        )
    else:
        _jobs[job_data["job_id"]] = job_data


async def _update_job(job_id: str, updates: Dict[str, Any]) -> None:
    if db.is_connected and not db._use_memory:
        set_clauses = []
        values = []
        for i, (key, val) in enumerate(updates.items(), start=1):
            set_clauses.append(f"{key} = ${i}")
            values.append(val)
        values.append(job_id)
        query = f"UPDATE editing_jobs SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = ${len(values)}"
        await db.execute(query, *values)
    else:
        if job_id in _jobs:
            _jobs[job_id].update(updates)
            _jobs[job_id]["updated_at"] = datetime.now(timezone.utc).isoformat()


# --- Routes ---

@app.get("/", response_model=Dict[str, str])
async def root():
    return {
        "service": "AAVE Backend",
        "version": "1.0.0",
        "author": "Randi Sumitro",
        "repository": "https://github.com/randisumitro/aave",
    }


@app.get("/health")
async def health():
    db_status = "connected" if db.is_connected else "disconnected"
    return {
        "status": "healthy",
        "version": "1.0.0",
        "author": "Randi Sumitro",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
    }


@app.get("/api/v1/health")
async def api_health():
    return {"status": "healthy", "author": "Randi Sumitro"}


@app.post("/api/v1/jobs", response_model=JobResponse)
async def create_job(request: JobCreateRequest):
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    job_data = {
        "job_id": job_id,
        "user_id": None,
        "status": "CREATED",
        "creative_direction": request.creative_direction.model_dump(),
        "project_settings": request.project.model_dump(),
        "progress": 0,
        "created_at": now,
        "updated_at": now,
        "source": request.source,
    }
    await _create_job(job_data)
    logger.info("job_created", extra={"job_id": job_id, "source": request.source})
    return JobResponse(
        job_id=job_id,
        status="CREATED",
        message="Job created successfully",
        created_at=now,
    )


@app.get("/api/v1/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str):
    job = await _get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job.get("progress", 0),
        message=job.get("message", ""),
        output_path=job.get("output_path"),
        project_path=job.get("project_path"),
        error_message=job.get("error_message"),
        created_at=job["created_at"],
        updated_at=job["updated_at"],
        completed_at=job.get("completed_at"),
    )


@app.post("/api/v1/jobs/{job_id}/cancel", response_model=JobCancelResponse)
async def cancel_job(job_id: str):
    job = await _get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel job in state {job['status']}")
    await _update_job(job_id, {"status": "CANCELLED"})
    logger.info("job_cancelled", extra={"job_id": job_id})
    return JobCancelResponse(job_id=job_id, status="CANCELLED")


@app.get("/api/v1/jobs", response_model=JobListResponse)
async def list_jobs():
    if db.is_connected and not db._use_memory:
        rows = await db.fetch("SELECT id, status, progress, created_at FROM editing_jobs ORDER BY created_at DESC")
        items = [
            JobListItem(
                job_id=row["id"],
                status=row["status"],
                progress=row["progress"],
                created_at=row["created_at"],
            )
            for row in rows
        ]
        return JobListResponse(jobs=items, total=len(items))
    items = [
        JobListItem(
            job_id=j["job_id"],
            status=j["status"],
            progress=j.get("progress", 0),
            created_at=j["created_at"],
        )
        for j in _jobs.values()
    ]
    return JobListResponse(jobs=items, total=len(items))


# --- API v1 routers ---

api_router = APIRouter(prefix="/api/v1")

# Models routes
models_router = APIRouter(prefix="/models")


@models_router.post("", response_model=ModelOut)
async def register_model(model: ModelIn):
    try:
        return model_registry.register(model)
    except ModelRegistryError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@models_router.get("", response_model=list[ModelOut])
async def list_models():
    return model_registry.list_models()


@models_router.get("/{model_id}", response_model=ModelOut)
async def get_model(model_id: str):
    cfg = model_registry.get_model(model_id)
    if not cfg:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelOut(id=model_id, created_at="", updated_at="", **cfg)


@models_router.post("/route", response_model=ModelRouterResponse)
async def route_model(request: ModelRouterRequest):
    try:
        return model_registry.route(request)
    except ModelRegistryError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@models_router.post("/versions", response_model=ModelVersionOut)
async def create_model_version(version: ModelVersionIn):
    # Placeholder - full model versioning in Phase 6
    return ModelVersionOut(
        id=uuid.uuid4(),
        model_id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc).isoformat(),
        **version.model_dump(),
    )


# System routes
system_router = APIRouter(prefix="/system")


@system_router.get("/status")
async def system_status():
    return {"status": "operational", "author": "Randi Sumitro", "database": "connected" if db.is_connected else "memory_fallback"}


@system_router.get("/creator")
async def system_creator():
    return CREATOR_INFO


# Register routers
api_router.include_router(models_router)
api_router.include_router(system_router)

app.include_router(api_router)


@app.websocket("/api/v1/ws/jobs/{job_id}")
async def job_websocket(websocket: WebSocket, job_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "ack", "job_id": job_id, "received": data})
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
