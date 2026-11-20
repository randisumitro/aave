# AAVE Backend Model Registry Interface
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

"""Model registry interface.

Supports multiple cloud model providers and local inference models without
hardcoding a single provider. Providers are registered dynamically and the
router selects a model by task type with priority/fallback support.

API keys and credentials are never stored in plaintext in code; they are
read from environment variables or a secrets manager.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from aave_logging import get_logger
from schemas.models import ModelIn, ModelOut, ModelRouterRequest, ModelRouterResponse

logger = get_logger("aave.model_registry")


class ModelRegistryError(Exception):
    """Raised when the model registry cannot satisfy a request."""


class ModelRegistry:
    """In-memory model registry backed by the `models` table.

    Providers supported: gemini, anthropic, ollama, groq, openai, azure.
    Credentials are read from environment variables (e.g. GEMINI_API_KEY)
    and never written to logs or the database.
    """

    def __init__(self) -> None:
        # model_id -> model config
        self._models: Dict[str, Dict[str, Any]] = {}
        # provider -> list of model_ids
        self._by_provider: Dict[str, List[str]] = {}
        # task_type -> list of model_ids (sorted by priority)
        self._by_task: Dict[str, List[str]] = {}

    # ------------------------------------------------------------------ #
    # Registration
    # ------------------------------------------------------------------ #
    def register(self, model: ModelIn) -> ModelOut:
        if model.model_id in self._models:
            raise ModelRegistryError(f"Model {model.model_id} already registered")
        config = model.model_dump()
        # Resolve credential from env without logging it
        config["credential_env"] = self._credential_env_for_provider(model.provider)
        self._models[model.model_id] = config
        self._by_provider.setdefault(model.provider, []).append(model.model_id)
        for task in model.task_types:
            self._by_task.setdefault(task, []).append(model.model_id)
        logger.info(
            "model_registered",
            extra={"model_id": model.model_id, "provider": model.provider, "task_types": model.task_types},
        )
        return ModelOut(
            id=model.model_id,
            created_at="",
            updated_at="",
            **config,
        )

    def list_models(self) -> List[ModelOut]:
        out: List[ModelOut] = []
        for mid, cfg in self._models.items():
            out.append(ModelOut(id=mid, created_at="", updated_at="", **cfg))
        return out

    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        return self._models.get(model_id)

    # ------------------------------------------------------------------ #
    # Routing
    # ------------------------------------------------------------------ #
    def route(self, request: ModelRouterRequest) -> ModelRouterResponse:
        """Select the best model for a task.

        Selection order:
          1. Models matching task_type, enabled, sorted by priority desc
          2. If preferred_provider given, prefer that provider first
          3. Fallback to any enabled model
        """
        candidates = self._by_task.get(request.task_type, [])
        enabled = [m for m in candidates if self._models[m].get("enabled", True)]

        if request.preferred_provider:
            preferred = [
                m for m in enabled if self._models[m]["provider"] == request.preferred_provider
            ]
            if preferred:
                enabled = preferred

        if not enabled:
            # Last-resort fallback: any enabled model
            enabled = [m for m, c in self._models.items() if c.get("enabled", True)]

        if not enabled:
            raise ModelRegistryError(
                f"No enabled model available for task_type={request.task_type}"
            )

        # Pick highest priority
        chosen = max(enabled, key=lambda m: self._models[m].get("priority", 1))
        cfg = self._models[chosen]

        logger.info(
            "model_routed",
            extra={
                "task_type": request.task_type,
                "chosen_model": chosen,
                "provider": cfg["provider"],
            },
        )

        return ModelRouterResponse(
            model_id=chosen,
            provider=cfg["provider"],
            model_name=cfg["model_name"],
            selected_reason=(
                f"selected by task_type={request.task_type}, "
                f"provider={cfg['provider']}, priority={cfg.get('priority', 1)}"
            ),
        )

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _credential_env_for_provider(provider: str) -> str:
        mapping = {
            "gemini": "GEMINI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "groq": "GROQ_API_KEY",
            "openai": "OPENAI_API_KEY",
            "azure": "AZURE_OPENAI_API_KEY",
            "ollama": "",  # local, no credential
        }
        return mapping.get(provider, f"{provider.upper()}_API_KEY")

    @staticmethod
    def get_credential(provider: str) -> Optional[str]:
        """Read a provider credential from the environment. Never logs the value."""
        env_name = ModelRegistry._credential_env_for_provider(provider)
        if not env_name:
            return None
        return os.getenv(env_name)


# Singleton instance
model_registry = ModelRegistry()
