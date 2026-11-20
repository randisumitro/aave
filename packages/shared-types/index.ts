# AAVE Shared Contracts — TypeScript Interfaces
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

// Shared type definitions between Premiere plugin, After Effects plugin,
// Local Companion, and FastAPI backend.

// ---------------------------------------------------------------------------
// Job state definitions (mirrors backend JobStatus enum)
// ---------------------------------------------------------------------------
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

export interface JobStatusMap {
  CREATED: "CREATED";
  MEDIA_ANALYSIS: "MEDIA_ANALYSIS";
  CREATIVE_PLANNING: "CREATIVE_PLANNING";
  EDIT_PLAN_READY: "EDIT_PLAN_READY";
  TIMELINE_EXECUTION: "TIMELINE_EXECUTION";
  MOTION_GRAPHICS: "MOTION_GRAPHICS";
  SOUND_DESIGN: "SOUND_DESIGN";
  RENDERING: "RENDERING";
  QUALITY_CHECK: "QUALITY_CHECK";
  COMPLETED: "COMPLETED";
  FAILED: "FAILED";
  PAUSED: "PAUSED";
  CANCELLED: "CANCELLED";
  NEEDS_RETRY: "NEEDS_RETRY";
  NEEDS_USER_INPUT: "NEEDS_USER_INPUT";
}

export const JobStatus: JobStatusMap = {
  CREATED: "CREATED",
  MEDIA_ANALYSIS: "MEDIA_ANALYSIS",
  CREATIVE_PLANNING: "CREATIVE_PLANNING",
  EDIT_PLAN_READY: "EDIT_PLAN_READY",
  TIMELINE_EXECUTION: "TIMELINE_EXECUTION",
  MOTION_GRAPHICS: "MOTION_GRAPHICS",
  SOUND_DESIGN: "SOUND_DESIGN",
  RENDERING: "RENDERING",
  QUALITY_CHECK: "QUALITY_CHECK",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
  NEEDS_RETRY: "NEEDS_RETRY",
  NEEDS_USER_INPUT: "NEEDS_USER_INPUT",
} as const;

// ---------------------------------------------------------------------------
// Project & creative direction
// ---------------------------------------------------------------------------
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface ProjectSettings {
  format: "vertical" | "square" | "horizontal";
  width: number;
  height: number;
  fps: number;
  target_duration: number;
  aspect_ratio: AspectRatio;
}

export interface CreativeDirection {
  style: string;
  pace: "slow" | "medium" | "fast";
  tone: string;
  hook_strength_threshold?: number;
}

// ---------------------------------------------------------------------------
// Edit Decision List (EDL)
// ---------------------------------------------------------------------------
export type EDLRole = "hook" | "context" | "b_roll" | "ending";

export interface HookCandidate {
  start: number;
  end: number;
  score: number;
  reason: string;
  recommended: boolean;
}

export interface EditDecision {
  id: string;
  source: string;
  source_in: number;
  source_out: number;
  timeline_start: number;
  role: EDLRole;
  transition?: string;
  duration: number;
}

export interface EDLAudio {
  music?: string;
  ducking?: boolean;
  sound_effects?: Array<{
    timestamp: number;
    type: string;
    volume: number;
  }>;
}

export interface EDLGraphics {
  captions?: boolean;
  motion_titles?: boolean;
  lower_thirds?: boolean;
  kinetic_typography?: boolean;
}

export interface EDLMetadata {
  generated_by: string;
  generated_at: string;
  source_footage: string[];
  total_duration: number;
}

export interface EditDecisionList {
  version: string;
  project: ProjectSettings;
  creative_direction: CreativeDirection;
  timeline: EditDecision[];
  audio?: EDLAudio;
  graphics?: EDLGraphics;
  metadata?: EDLMetadata;
}

export interface ValidatedEditDecisionList extends EditDecisionList {
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    checked_at: string;
  };
}

// ---------------------------------------------------------------------------
// Media asset
// ---------------------------------------------------------------------------
export interface MediaAsset {
  id: string;
  project_id: string;
  file_path: string;
  file_name: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  file_size_bytes?: number;
  imported_at: string;
}

// ---------------------------------------------------------------------------
// Timeline / motion graphics commands
// ---------------------------------------------------------------------------
export type TimelineCommandType =
  | "create_sequence"
  | "import_media"
  | "insert_clip"
  | "create_marker"
  | "apply_effect"
  | "set_volume"
  | "export_sequence";

export type MotionGraphicsCommandType =
  | "create_composition"
  | "create_text_layer"
  | "create_shape_layer"
  | "set_keyframe"
  | "create_kinetic_typography"
  | "create_lower_thirds"
  | "create_animated_captions"
  | "export_alpha";

export interface TimelineCommand {
  id: string;
  type: TimelineCommandType;
  params: Record<string, any>;
  validated: boolean;
  execution_order: number;
  status: "pending" | "executed" | "failed";
  error?: string;
}

export interface MotionGraphicsCommand {
  id: string;
  type: MotionGraphicsCommandType;
  params: Record<string, any>;
  validated: boolean;
  status: "pending" | "executed" | "failed";
  error?: string;
}

// ---------------------------------------------------------------------------
// Companion / plugin communication
// ---------------------------------------------------------------------------
export interface CompanionMessage {
  type: string;
  data: any;
  id?: number;
  error?: string;
}

export interface PluginContext {
  premiereAdapter?: any;
  aeAdapter?: any;
  companionClient: any;
  commandRegistry: any;
  version: string;
}

export interface PluginInput {
  [key: string]: any;
}

export interface PluginResult {
  [key: string]: any;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AAVEPlugin {
  id: string;
  version: string;
  author?: string;
  initialize(context: PluginContext): Promise<void>;
  execute(input: PluginInput, context: PluginContext): Promise<PluginResult>;
  validate?(input: PluginInput): Promise<PluginValidationResult>;
  dispose?(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Job progress / status
// ---------------------------------------------------------------------------
export interface JobProgress {
  job_id: string;
  status: JobStatusValue;
  progress: number;
  message: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Standard error response
// ---------------------------------------------------------------------------
export interface AAVEError {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
  request_id?: string;
}
