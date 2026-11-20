# AAVE Backend Pydantic Schemas — Model Registry
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Pydantic schemas for the AI model registry."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ModelVersionIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version: str = Field(..., min_length=1)
    is_production: bool = Field(default=False)
    performance_metrics: Optional[Dict[str, Any]] = None


class ModelVersionOut(ModelVersionIn):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    model_id: UUID
    created_at: str


class ModelIn(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_id: str = Field(..., min_length=1, description="Unique model identifier")
    provider: str = Field(..., min_length=1, description="e.g. gemini, anthropic, ollama, groq")
    model_name: str = Field(..., min_length=1, description="Provider-specific model name")
    task_types: List[str] = Field(default_factory=list, description="e.g. video_understanding, scene_analysis")
    enabled: bool = Field(default=True)
    priority: int = Field(default=1, ge=1)
    max_tokens: int = Field(default=8000, ge=1)
    timeout_seconds: int = Field(default=120, ge=1)


class ModelOut(ModelIn):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: str
    updated_at: str


class ModelRouterRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_type: str = Field(..., min_length=1)
    preferred_provider: Optional[str] = None
    max_tokens: Optional[int] = Field(default=None, ge=1)
    timeout_seconds: Optional[int] = Field(default=None, ge=1)


class ModelRouterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_id: str
    provider: str
    model_name: str
    selected_reason: str
