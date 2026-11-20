-- AAVE Database Migration 001 - Initial Schema
-- Creates all core tables for the Autonomous AI Video Editor
-- Uses UUID primary keys, foreign keys, timestamps, and appropriate constraints
--
-- Copyright (c) 2026 Randi Sumitro. All rights reserved.
-- Author: Randi Sumitro (https://github.com/randisumitro)
-- License: MIT

-- Enable pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences (Layer A - User Memory)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    editing_style VARCHAR(100) DEFAULT 'dynamic_ugc',
    cut_speed VARCHAR(50) DEFAULT 'fast',
    caption_style VARCHAR(100) DEFAULT 'bold_animated',
    motion_intensity VARCHAR(50) DEFAULT 'medium',
    transition_preference VARCHAR(100) DEFAULT 'minimal',
    sound_design VARCHAR(100) DEFAULT 'cinematic',
    color_preference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    format VARCHAR(50) DEFAULT 'vertical',
    width INTEGER DEFAULT 1080,
    height INTEGER DEFAULT 1920,
    fps INTEGER DEFAULT 30,
    target_duration INTEGER DEFAULT 45,
    status VARCHAR(50) DEFAULT 'draft',
    premiere_project_path TEXT,
    after_effects_project_path TEXT,
    output_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media assets table
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    duration_seconds FLOAT,
    width INTEGER,
    height INTEGER,
    fps INTEGER,
    codec VARCHAR(100),
    file_size_bytes BIGINT,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media analysis results
CREATE TABLE media_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    result JSONB NOT NULL,
    model_used VARCHAR(255),
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes detected in footage
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    scene_type VARCHAR(100),
    visual_description TEXT,
    emotional_intensity FLOAT,
    hook_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcripts from speech recognition
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    speaker_id VARCHAR(100),
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Editing jobs
CREATE TABLE editing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'CREATED',
    creative_direction JSONB,
    project_settings JSONB,
    output_path TEXT,
    render_output_path TEXT,
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Agent runs
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES editing_jobs(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL,
    model_used VARCHAR(255),
    input_schema JSONB,
    output_schema JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Edit decisions
CREATE TABLE edit_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES editing_jobs(id) ON DELETE CASCADE,
    decision_type VARCHAR(100) NOT NULL,
    decision_data JSONB NOT NULL,
    validated BOOLEAN DEFAULT FALSE,
    executed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline operations
CREATE TABLE timeline_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES editing_jobs(id) ON DELETE CASCADE,
    operation_type VARCHAR(100) NOT NULL,
    params JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model registry
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    task_types JSONB NOT NULL DEFAULT '[]',
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    max_tokens INTEGER DEFAULT 8000,
    timeout_seconds INTEGER DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model versions
CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    is_production BOOLEAN DEFAULT FALSE,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugins registry
CREATE TABLE plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '[]',
    capabilities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin versions
CREATE TABLE plugin_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    download_url TEXT,
    checksum VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plugin permissions
CREATE TABLE plugin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plugin_id, permission_name)
);

-- Feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES editing_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback events (manual user changes)
CREATE TABLE feedback_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning datasets
CREATE TABLE learning_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    size INTEGER DEFAULT 0,
    validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training runs
CREATE TABLE training_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES learning_datasets(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    metrics JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Render jobs
CREATE TABLE render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editing_job_id UUID NOT NULL REFERENCES editing_jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    output_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Render outputs
CREATE TABLE render_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_job_id UUID NOT NULL REFERENCES render_jobs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    format VARCHAR(100),
    resolution VARCHAR(50),
    file_size_bytes BIGINT,
    duration_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    token_count INTEGER,
    cost_estimate FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_media_assets_project_id ON media_assets(project_id);
CREATE INDEX idx_media_analysis_media_asset_id ON media_analysis(media_asset_id);
CREATE INDEX idx_scenes_media_asset_id ON scenes(media_asset_id);
CREATE INDEX idx_transcripts_media_asset_id ON transcripts(media_asset_id);
CREATE INDEX idx_editing_jobs_user_id ON editing_jobs(user_id);
CREATE INDEX idx_editing_jobs_project_id ON editing_jobs(project_id);
CREATE INDEX idx_agent_runs_job_id ON agent_runs(job_id);
CREATE INDEX idx_edit_decisions_job_id ON edit_decisions(job_id);
CREATE INDEX idx_timeline_operations_job_id ON timeline_operations(job_id);
CREATE INDEX idx_feedback_job_id ON feedback(job_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_render_jobs_editing_job_id ON render_jobs(editing_job_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);

-- Comments for documentation
COMMENT ON TABLE user_preferences IS 'Layer A: User editing memory and preferences';
COMMENT ON TABLE edit_decisions IS 'Creative Decision Engine output - validated before execution';
COMMENT ON TABLE timeline_operations IS 'Typed timeline commands executed in Premiere Pro';
COMMENT ON TABLE models IS 'Model registry - supports multiple providers with fallback';
