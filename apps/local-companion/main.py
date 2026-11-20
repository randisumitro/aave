"""
AAVE Local Companion Service
Coordinates between Adobe plugins, AI backend, filesystem, and render coordination.
Runs locally on the user's machine.

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Original Creator & Lead Architect: Randi Sumitro (https://github.com/randisumitro)
License: MIT
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Set
import asyncio
import hashlib
import logging
import os
import subprocess
import uuid
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aave-companion")

app = FastAPI(
    title="AAVE Local Companion",
    description="Local IPC and coordination service for AAVE Adobe plugins by Randi Sumitro",
    version="1.0.0",
    contact={
        "name": "Randi Sumitro",
        "url": "https://github.com/randisumitro",
    },
    license_info={
        "name": "MIT",
        "url": "https://github.com/randisumitro/aave/blob/main/LICENSE",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "http://127.0.0.1:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security configuration ---

# Companion token read from environment - never hardcoded
COMPANION_TOKEN = os.getenv("AAVE_COMPANION_TOKEN", "")
security = HTTPBearer(auto_error=False)

# File access allowlist - only these directories are accessible
DEFAULT_ALLOWLIST = [
    os.path.expanduser("~/Documents"),
    os.path.expanduser("~/Movies"),
    os.path.expanduser("~/Desktop"),
    "/tmp",
]
FILE_ALLOWLIST: Set[str] = set()

# Parse allowlist from env (comma-separated)
_allowlist_env = os.getenv("AAVE_FILE_ALLOWLIST", "")
if _allowlist_env:
    FILE_ALLOWLIST = {p.strip() for p in _allowlist_env.split(",") if p.strip()}
else:
    FILE_ALLOWLIST = set(DEFAULT_ALLOWLIST)


def _is_path_allowed(file_path: str) -> bool:
    """Check if a file path is within the allowlist."""
    try:
        resolved = os.path.realpath(file_path)
        for allowed in FILE_ALLOWLIST:
            allowed_resolved = os.path.realpath(allowed)
            if resolved == allowed_resolved or resolved.startswith(allowed_resolved + os.sep):
                return True
        return False
    except Exception:
        return False


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify bearer token for companion service access."""
    if not COMPANION_TOKEN:
        # No token configured - allow local connections only (development mode)
        return True
    if not credentials or credentials.scheme != "Bearer" or credentials.credentials != COMPANION_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing companion token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return True


# --- Models ---

class JobStatus(str):
    CREATED = "CREATED"
    MEDIA_ANALYSIS = "MEDIA_ANALYSIS"
    CREATIVE_PLANNING = "CREATIVE_PLANNING"
    EDIT_PLAN_READY = "EDIT_PLAN_READY"
    TIMELINE_EXECUTION = "TIMELINE_EXECUTION"
    MOTION_GRAPHICS = "MOTION_GRAPHICS"
    SOUND_DESIGN = "SOUND_DESIGN"
    RENDERING = "RENDERING"
    QUALITY_CHECK = "QUALITY_CHECK"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    NEEDS_RETRY = "NEEDS_RETRY"
    NEEDS_USER_INPUT = "NEEDS_USER_INPUT"


class StartEditingRequest(BaseModel):
    project: Dict[str, Any]
    creative_direction: Dict[str, Any]
    source: str = "premiere_active_project"


class MotionGraphicsRequest(BaseModel):
    type: str
    text: str
    duration: float
    composition: Dict[str, Any]
    export: Dict[str, Any]


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
    author: str
    ffmpeg: bool
    ffmpeg_version: Optional[str] = None
    jobs: int


# --- In-memory job store ---

jobs: Dict[str, Dict[str, Any]] = {}
websocket_connections: Dict[str, WebSocket] = {}


# --- WebSocket manager ---

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active.append(websocket)
        websocket_connections[client_id] = websocket
        logger.info("Client %s connected", client_id)

    def disconnect(self, client_id: str):
        if client_id in websocket_connections:
            del websocket_connections[client_id]
        self.active = [w for w in self.active if w not in websocket_connections.values()]
        logger.info("Client %s disconnected", client_id)

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        if client_id in websocket_connections:
            await websocket_connections[client_id].send_json(message)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active):
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


# --- Job helpers ---

async def update_job_status(job_id: str, status: str, message: str, progress: Optional[int] = None):
    if job_id in jobs:
        jobs[job_id]["status"] = status
        msg_list = jobs[job_id].get("message", [])
        if not isinstance(msg_list, list):
            msg_list = [msg_list] if msg_list else []
        msg_list.append({
            "status": status,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        jobs[job_id]["message"] = msg_list
        if progress is not None:
            jobs[job_id]["progress"] = progress

        await manager.broadcast({
            "type": "status",
            "job_id": job_id,
            "status": status,
            "progress": progress or 0,
            "message": message,
        })


async def simulate_editing_pipeline(job_id: str, request: StartEditingRequest):
    """Simulate the autonomous editing pipeline. In production, this calls the AI backend."""
    stages = [
        (JobStatus.MEDIA_ANALYSIS, "Analyzing footage metadata...", 10),
        (JobStatus.MEDIA_ANALYSIS, "Running scene detection...", 25),
        (JobStatus.MEDIA_ANALYSIS, "Processing speech recognition...", 40),
        (JobStatus.CREATIVE_PLANNING, "Detecting hook candidates...", 50),
        (JobStatus.CREATIVE_PLANNING, "Generating storytelling structure...", 60),
        (JobStatus.EDIT_PLAN_READY, "Creating Edit Decision List...", 70),
        (JobStatus.TIMELINE_EXECUTION, "Executing timeline operations in Premiere...", 80),
        (JobStatus.MOTION_GRAPHICS, "Generating motion graphics in After Effects...", 90),
        (JobStatus.QUALITY_CHECK, "Running quality control validation...", 95),
        (JobStatus.COMPLETED, "Editing complete!", 100),
    ]

    for status, message, progress in stages:
        if jobs.get(job_id, {}).get("status") == JobStatus.CANCELLED:
            return
        await update_job_status(job_id, status, message, progress)
        await asyncio.sleep(2)

    if jobs.get(job_id, {}).get("status") != JobStatus.CANCELLED:
        jobs[job_id]["output_path"] = f"/output/aave_{job_id}.mp4"
        jobs[job_id]["project_path"] = f"/projects/aave_{job_id}.prproj"


# --- FFmpeg detection ---

def detect_ffmpeg() -> Dict[str, Any]:
    """Detect FFmpeg installation and version."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            version_line = result.stdout.split("\n")[0] if result.stdout else "unknown"
            return {"available": True, "version": version_line}
        return {"available": False, "version": None, "error": "ffmpeg command failed"}
    except FileNotFoundError:
        return {"available": False, "version": None, "error": "ffmpeg not found"}
    except Exception as exc:
        return {"available": False, "version": None, "error": str(exc)}


FFMPEG_INFO = detect_ffmpeg()


# --- API Routes ---

@app.get("/")
async def root():
    return {
        "service": "AAVE Local Companion",
        "version": "1.0.0",
        "status": "running",
        "author": "Randi Sumitro",
        "repository": "https://github.com/randisumitro/aave",
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        author="Randi Sumitro",
        ffmpeg=FFMPEG_INFO["available"],
        ffmpeg_version=FFMPEG_INFO.get("version"),
        jobs=len(jobs),
    )


@app.post("/api/v1/jobs/editing", response_model=JobResponse)
async def start_editing_job(request: StartEditingRequest, _: bool = Depends(verify_token)):
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    jobs[job_id] = {
        "job_id": job_id,
        "status": JobStatus.CREATED,
        "message": [{
            "status": JobStatus.CREATED,
            "message": "Job created",
            "timestamp": now,
        }],
        "progress": 0,
        "request": request.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    asyncio.create_task(simulate_editing_pipeline(job_id, request))

    return JobResponse(
        job_id=job_id,
        status=JobStatus.CREATED,
        message="Editing job started",
    )


@app.get("/api/v1/jobs/{job_id}")
async def get_job(job_id: str, _: bool = Depends(verify_token)):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.post("/api/v1/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, _: bool = Depends(verify_token)):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    jobs[job_id]["status"] = JobStatus.CANCELLED
    await update_job_status(job_id, JobStatus.CANCELLED, "Job cancelled by user", jobs[job_id].get("progress", 0))
    return {"job_id": job_id, "status": JobStatus.CANCELLED}


@app.post("/api/v1/motion-graphics")
async def generate_motion_graphics(request: MotionGraphicsRequest, _: bool = Depends(verify_token)):
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    jobs[job_id] = {
        "job_id": job_id,
        "status": JobStatus.MOTION_GRAPHICS,
        "message": [{
            "status": JobStatus.MOTION_GRAPHICS,
            "message": "Motion graphics generation started",
            "timestamp": now,
        }],
        "progress": 0,
        "request": request.model_dump(),
        "created_at": now,
        "updated_at": now,
    }

    async def run_mg():
        await update_job_status(job_id, JobStatus.MOTION_GRAPHICS, "Creating composition...", 30)
        await asyncio.sleep(1)
        await update_job_status(job_id, JobStatus.MOTION_GRAPHICS, "Adding animation layers...", 60)
        await asyncio.sleep(1)
        await update_job_status(job_id, JobStatus.MOTION_GRAPHICS, "Applying keyframes...", 90)
        await asyncio.sleep(1)
        await update_job_status(job_id, JobStatus.COMPLETED, "Motion graphics complete!", 100)
        jobs[job_id]["output_path"] = f"/output/mg_{job_id}.mov"

    asyncio.create_task(run_mg())

    return JobResponse(job_id=job_id, status=JobStatus.MOTION_GRAPHICS, message="Motion graphics job started")


# --- File access validation endpoint ---

@app.post("/api/v1/files/validate")
async def validate_file_access(file_path: str, _: bool = Depends(verify_token)):
    """Validate that a file path is within the allowlist."""
    allowed = _is_path_allowed(file_path)
    return {"path": file_path, "allowed": allowed}


# --- WebSocket endpoint with auth ---

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    # Simple token check via query parameter for WebSocket (browsers can't send Bearer headers easily)
    token = websocket.query_params.get("token", "")
    if COMPANION_TOKEN and token != COMPANION_TOKEN:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "ack", "client_id": client_id, "received": data})
    except WebSocketDisconnect:
        manager.disconnect(client_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8077)
