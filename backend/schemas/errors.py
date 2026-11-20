# AAVE Backend Pydantic Schemas — Errors
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Pydantic schemas for standard error responses."""

from __future__ import annotations

from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AAVEErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    error: str = Field(..., description="Human-readable error message")
    code: str = Field(..., description="Machine-readable error code")
    details: Optional[Any] = Field(default=None, description="Additional error context")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    request_id: Optional[UUID] = Field(default=None, description="Correlation request id")


class ValidationErrorDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    field: str
    message: str


class ValidationErrorResponse(AAVEErrorResponse):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "error": "Request validation failed",
                "code": "VALIDATION_ERROR",
                "errors": [
                    {"field": "project.width", "message": "must be a positive integer"}
                ],
                "timestamp": "2026-11-21T05:00:00+07:00",
            }
        },
    )

    code: str = Field(default="VALIDATION_ERROR")
    errors: List[ValidationErrorDetail] = Field(default_factory=list)


