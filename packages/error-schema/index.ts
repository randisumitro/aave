# AAVE Standard Error Responses
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

// Standard error response shape used across the AAVE backend and local companion APIs.

export interface AAVEError {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  request_id?: string;
}

// Standard error codes used across the system
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_REQUEST: "INVALID_REQUEST",
  MISSING_FIELD: "MISSING_FIELD",
  // Job lifecycle
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  JOB_ALREADY_EXISTS: "JOB_ALREADY_EXISTS",
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  JOB_CANCELLED: "JOB_CANCELLED",
  // Adobe integration
  ADOBE_NOT_CONNECTED: "ADOBE_NOT_CONNECTED",
  ADOBE_API_ERROR: "ADOBE_API_ERROR",
  ADOBE_UNSUPPORTED_VERSION: "ADOBE_UNSUPPORTED_VERSION",
  // Companion / IPC
  COMPANION_NOT_CONNECTED: "COMPANION_NOT_CONNECTED",
  COMPANION_AUTH_FAILED: "COMPANION_AUTH_FAILED",
  IPC_AUTH_FAILED: "IPC_AUTH_FAILED",
  // Media / FFmpeg
  FFMPEG_NOT_FOUND: "FFMPEG_NOT_FOUND",
  MEDIA_NOT_FOUND: "MEDIA_NOT_FOUND",
  FILE_ACCESS_DENIED: "FILE_ACCESS_DENIED",
  // Model / AI
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  MODEL_PROVIDER_ERROR: "MODEL_PROVIDER_ERROR",
  // Plugin
  PLUGIN_NOT_FOUND: "PLUGIN_NOT_FOUND",
  PLUGIN_MANIFEST_INVALID: "PLUGIN_MANIFEST_INVALID",
  PLUGIN_PERMISSION_DENIED: "PLUGIN_PERMISSION_DENIED",
  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
} as const;

export function createError(
  code: string,
  message: string,
  details?: any,
  request_id?: string,
): AAVEError {
  return {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
    request_id,
  };
}

export { ERROR_CODES as default };
