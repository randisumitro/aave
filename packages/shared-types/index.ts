// AAVE Shared Types - TypeScript
// Shared type definitions between Premiere plugin, After Effects plugin, and companion service
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

export interface JobStatus {
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

export const JobStatus: JobStatus = {
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
};

export interface ProjectSettings {
  format: "vertical" | "square" | "horizontal";
  width: number;
  height: number;
  fps: number;
  target_duration: number;
}

export interface CreativeDirection {
  style: string;
  pace: string;
  tone: string;
}

export interface HookCandidate {
  start: number;
  end: number;
  score: number;
  reason: string;
  recommended: boolean;
}

export interface EditDecision {
  source: string;
  source_in: number;
  source_out: number;
  timeline_start: number;
  role: "hook" | "context" | "b_roll" | "ending";
}

export interface EditDecisionList {
  project: ProjectSettings;
  creative_direction: CreativeDirection;
  timeline: EditDecision[];
  audio?: {
    music?: string;
    ducking?: boolean;
  };
  graphics?: {
    captions?: boolean;
    motion_titles?: boolean;
  };
}

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
  initialize(context: PluginContext): Promise<void>;
  execute(input: PluginInput, context: PluginContext): Promise<PluginResult>;
  validate?(input: PluginInput): Promise<PluginValidationResult>;
  dispose?(): Promise<void>;
}

export interface JobProgress {
  job_id: string;
  status: string;
  progress: number;
  message: string;
}

export interface TimelineOperation {
  id: string;
  type: "insert_clip" | "create_marker" | "apply_effect" | "set_volume" | "create_sequence";
  params: any;
  status: "pending" | "executed" | "failed";
  error?: string;
}

export interface MediaAsset {
  id: string;
  filePath: string;
  duration: number;
  resolution: { width: number; height: number };
  fps: number;
  codec: string;
  importedAt: string;
}
