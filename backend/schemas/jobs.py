# AAVE Backend Pydantic Schemas — Jobs
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Pydantic schemas for editing job requests/responses."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectSettingsIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    format: str = Field(default="vertical", pattern="^(vertical|square|horizontal)$")
    width: int = Field(default=1080, ge=1)
    height: int = Field(default=1920, ge=1)
    fps: int = Field(default=30, ge=1)
    target_duration: int = Field(default=45, ge=15, le=90)
    aspect_ratio: str = Field(default="9:16", pattern="^(9:16|1:1|16:9)$")


class CreativeDirectionIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    style: str = Field(default="dynamic_ugc")
    pace: str = Field(default="fast", pattern="^(slow|medium|fast)$")
    tone: str = Field(default="engaging")
    hook_strength_threshold: Optional[float] = Field(default=None, ge=0, le=1)


class JobCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project: ProjectSettingsIn = Field(default_factory=ProjectSettingsIn)
    creative_direction: CreativeDirectionIn = Field(default_factory=CreativeDirectionIn)
    source: str = Field(default="premiere_active_project")


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: str
    message: str
    created_at: datetime


class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: str
    progress: int = 0
    message: str
    output_path: Optional[str] = None
    project_path: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class JobCancelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: str


class JobListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: str
    progress: int
    created_at: datetime


class JobListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    jobs: List[JobListItem]
    total: int
