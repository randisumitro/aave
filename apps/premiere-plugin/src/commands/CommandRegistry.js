// AAVE Premiere Pro Plugin - Command Registry
// Registers typed editing commands that translate EDL into Premiere operations
// No command executes without validation
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import { v4 as uuidv4 } from "uuid";

class CommandRegistry {
  constructor({ premiereAdapter, companionClient, backendClient } = {}) {
    this.premiereAdapter = premiereAdapter;
    this.companionClient = companionClient;
    this.backendClient = backendClient;
    this.commands = new Map();
    this.commandHistory = [];
  }

  register(name, handler, validator) {
    this.commands.set(name, { handler, validator });
  }

  registerAll() {
    // Timeline commands
    this.register("create_sequence", this.handleCreateSequence.bind(this), this.validateCreateSequence);
    this.register("import_media", this.handleImportMedia.bind(this), this.validateImportMedia);
    this.register("insert_clip", this.handleInsertClip.bind(this), this.validateInsertClip);
    this.register("create_marker", this.handleCreateMarker.bind(this), this.validateCreateMarker);
    this.register("apply_effect", this.handleApplyEffect.bind(this), this.validateApplyEffect);
    this.register("set_volume", this.handleSetVolume.bind(this), this.validateSetVolume);
    this.register("export_sequence", this.handleExportSequence.bind(this), this.validateExportSequence);

    // Project commands
    this.register("get_active_project", this.handleGetActiveProject.bind(this));
    this.register("get_active_sequence", this.handleGetActiveSequence.bind(this));
    this.register("get_tracks", this.handleGetTracks.bind(this));
  }

  async execute(commandName, params) {
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Validate before execution
    if (command.validator) {
      const validation = await command.validator(params);
      if (!validation.valid) {
        throw new Error(`Command validation failed: ${validation.errors.join(", ")}`);
      }
    }

    const id = uuidv4();
    const startTime = Date.now();

    try {
      const result = await command.handler(params);
      this.commandHistory.push({
        id,
        command: commandName,
        params,
        result,
        status: "success",
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return { id, ...result, status: "success" };
    } catch (error) {
      this.commandHistory.push({
        id,
        command: commandName,
        params,
        error: error.message,
        status: "failed",
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  // --- Command handlers ---

  async handleCreateSequence(params) {
    return await this.premiereAdapter.createSequence(params);
  }

  async handleImportMedia(params) {
    return await this.premiereAdapter.importMedia(params.filePath);
  }

  async handleInsertClip(params) {
    const sequence = await this.premiereAdapter.getActiveSequence();
    return await this.premiereAdapter.insertClip(
      sequence,
      params.clip,
      params.trackIndex,
      params.time
    );
  }

  async handleCreateMarker(params) {
    const sequence = await this.premiereAdapter.getActiveSequence();
    return await this.premiereAdapter.createMarker(
      sequence,
      params.time,
      params.comment,
      params.duration,
      params.color
    );
  }

  async handleApplyEffect(params) {
    return await this.premiereAdapter.applyEffect(params.clip, params.effectName);
  }

  async handleSetVolume(params) {
    return await this.premiereAdapter.setClipVolume(params.clip, params.volume);
  }

  async handleExportSequence(params) {
    const sequence = await this.premiereAdapter.getActiveSequence();
    return await this.premiereAdapter.exportSequence(sequence, params.outputPath, params.settings);
  }

  async handleGetActiveProject() {
    return await this.premiereAdapter.getActiveProject();
  }

  async handleGetActiveSequence() {
    return await this.premiereAdapter.getActiveSequence();
  }

  async handleGetTracks(params) {
    const sequence = await this.premiereAdapter.getActiveSequence();
    return await this.premiereAdapter.getTracks(sequence);
  }

  // --- Validators ---

  async validateCreateSequence(params) {
    const errors = [];
    if (!params.width || !params.height) errors.push("width and height required");
    if (!params.fps) errors.push("fps required");
    return { valid: errors.length === 0, errors };
  }

  async validateImportMedia(params) {
    const errors = [];
    if (!params.filePath) errors.push("filePath required");
    return { valid: errors.length === 0, errors };
  }

  async validateInsertClip(params) {
    const errors = [];
    if (!params.clip) errors.push("clip required");
    if (params.trackIndex === undefined) errors.push("trackIndex required");
    if (params.time === undefined) errors.push("time required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateMarker(params) {
    const errors = [];
    if (params.time === undefined) errors.push("time required");
    return { valid: errors.length === 0, errors };
  }

  async validateApplyEffect(params) {
    const errors = [];
    if (!params.clip) errors.push("clip required");
    if (!params.effectName) errors.push("effectName required");
    return { valid: errors.length === 0, errors };
  }

  async validateSetVolume(params) {
    const errors = [];
    if (!params.clip) errors.push("clip required");
    if (params.volume === undefined) errors.push("volume required");
    return { valid: errors.length === 0, errors };
  }

  async validateExportSequence(params) {
    const errors = [];
    if (!params.outputPath) errors.push("outputPath required");
    return { valid: errors.length === 0, errors };
  }

  getHistory() {
    return this.commandHistory;
  }
}

export { CommandRegistry };
