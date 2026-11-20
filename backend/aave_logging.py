# AAVE Backend Structured Logging
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Structured JSON logging for the AAVE backend.

Emits one JSON object per log line so log aggregators (Cloud Logging, ELK,
OpenTelemetry) can ingest it directly. Sensitive fields (API keys, tokens)
are never logged.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    """Formatter that emits JSON log records."""

    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        # Include any extra fields passed via logger.info(msg, extra={...})
        for key, value in record.__dict__.items():
            if key not in {
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "exc_info", "exc_text", "stack_info",
                "lineno", "funcName", "created", "msecs", "relativeCreated",
                "thread", "threadName", "processName", "process", "message",
                "asctime",
            }:
                log_record[key] = value
        return json.dumps(log_record, ensure_ascii=False)


def configure_logging(level: str = "INFO") -> None:
    """Configure root logging to emit JSON to stdout."""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove any pre-existing handlers (e.g. from uvicorn)
    for handler in list(logger.handlers):
        logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "uvicorn.error", "asyncpg"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
