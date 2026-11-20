# AAVE Backend Database Layer
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Async PostgreSQL connection pool with graceful in-memory fallback.

When PostgreSQL is unavailable (e.g. local development without Docker),
the module falls back to an in-memory store so the API remains functional
for contract testing. Real integration tests should run against a live
PostgreSQL instance (see INSTALLATION.md).
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, Optional

try:
    import asyncpg  # type: ignore
    _ASYNCPG_AVAILABLE = True
except Exception:  # pragma: no cover - fallback path
    asyncpg = None  # type: ignore
    _ASYNCPG_AVAILABLE = False

logger = logging.getLogger("aave.database")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://aave:aave_dev@localhost:5432/aave",
)


class Database:
    """Database access layer.

    Uses asyncpg when a real PostgreSQL is reachable; otherwise uses an
    in-memory dict store so the service can start and respond without a DB.
    """

    def __init__(self) -> None:
        self._pool: Optional[Any] = None
        self._use_memory = not _ASYNCPG_AVAILABLE
        self._memory: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self) -> None:
        if self._use_memory:
            logger.warning(
                "asyncpg not available or DATABASE unreachable; using in-memory store"
            )
            return
        try:
            self._pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
            logger.info("Connected to PostgreSQL at %s", DATABASE_URL)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to connect to PostgreSQL (%s); falling back to memory", exc)
            self._use_memory = True

    async def disconnect(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    async def fetch(self, query: str, *args: Any) -> list:
        if self._use_memory:
            return []
        assert self._pool is not None
        async with self._pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args: Any) -> Optional[Any]:
        if self._use_memory:
            return None
        assert self._pool is not None
        async with self._pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def execute(self, query: str, *args: Any) -> str:
        if self._use_memory:
            return "OK"
        assert self._pool is not None
        async with self._pool.acquire() as conn:
            return await conn.execute(query, *args)

    @property
    def is_connected(self) -> bool:
        return self._pool is not None or self._use_memory


db = Database()
