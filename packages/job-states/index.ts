# AAVE Job State Definitions
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

// Central job state machine used by the backend, local companion, and plugins.
// States are shared between TypeScript and Python implementations.

export type JobStatusValue =
  | "CREATED"
  | "MEDIA_ANALYSIS"
  | "CREATIVE_PLANNING"
  | "EDIT_PLAN_READY"
  | "TIMELINE_EXECUTION"
  | "MOTION_GRAPHICS"
  | "SOUND_DESIGN"
  | "RENDERING"
  | "QUALITY_CHECK"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "CANCELLED"
  | "NEEDS_RETRY"
  | "NEEDS_USER_INPUT";

// Allowed transitions: from -> set of allowed to states
export const JOB_STATE_TRANSITIONS: Record<JobStatusValue, Set<JobStatusValue>> = {
  CREATED: new Set(["MEDIA_ANALYSIS", "FAILED", "CANCELLED", "PAUSED"]),
  MEDIA_ANALYSIS: new Set(["CREATIVE_PLANNING", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  CREATIVE_PLANNING: new Set(["EDIT_PLAN_READY", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  EDIT_PLAN_READY: new Set(["TIMELINE_EXECUTION", "FAILED", "NEEDS_USER_INPUT", "CANCELLED", "PAUSED"]),
  TIMELINE_EXECUTION: new Set(["MOTION_GRAPHICS", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  MOTION_GRAPHICS: new Set(["SOUND_DESIGN", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  SOUND_DESIGN: new Set(["RENDERING", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  RENDERING: new Set(["QUALITY_CHECK", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  QUALITY_CHECK: new Set(["COMPLETED", "FAILED", "NEEDS_RETRY", "CANCELLED", "PAUSED"]),
  COMPLETED: new Set([]),
  FAILED: new Set(["NEEDS_RETRY", "CANCELLED"]),
  PAUSED: new Set(["CREATED", "CANCELLED"]),
  CANCELLED: new Set([]),
  NEEDS_RETRY: new Set(["CREATED", "CANCELLED"]),
  NEEDS_USER_INPUT: new Set(["EDIT_PLAN_READY", "CANCELLED"]),
} as const;

export function isValidTransition(
  from: JobStatusValue,
  to: JobStatusValue,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allowed = JOB_STATE_TRANSITIONS[from];
  if (!allowed) {
    errors.push(`Unknown source state: ${from}`);
    return { valid: false, errors };
  }
  if (!allowed.has(to)) {
    errors.push(`Invalid transition from ${from} to ${to}`);
  }
  return { valid: errors.length === 0, errors };
}

export function isTerminalState(status: JobStatusValue): boolean {
  return ["COMPLETED", "FAILED", "CANCELLED"].includes(status);
}

export function isRetryableState(status: JobStatusValue): boolean {
  return status === "FAILED" || status === "NEEDS_RETRY";
}

export { JOB_STATE_TRANSITIONS as default };
