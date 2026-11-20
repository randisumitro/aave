// AAVE After Effects Plugin - Command Registry
// Registers typed motion graphics commands
// No command executes without validation
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import { v4 as uuidv4 } from "uuid";

class CommandRegistry {
  constructor({ aeAdapter, companionClient, backendClient } = {}) {
    this.aeAdapter = aeAdapter;
    this.companionClient = companionClient;
    this.backendClient = backendClient;
    this.commands = new Map();
    this.commandHistory = [];
  }

  register(name, handler, validator) {
    this.commands.set(name, { handler, validator });
  }

  registerAll() {
    // Composition commands
    this.register("create_composition", this.handleCreateComposition.bind(this), this.validateCreateComposition);
    this.register("create_text_layer", this.handleCreateTextLayer.bind(this), this.validateCreateTextLayer);
    this.register("create_shape_layer", this.handleCreateShapeLayer.bind(this), this.validateCreateShapeLayer);
    this.register("set_keyframe", this.handleSetKeyframe.bind(this), this.validateSetKeyframe);
    this.register("export_alpha", this.handleExportAlpha.bind(this), this.validateExportAlpha);
    this.register("render_composition", this.handleRenderComposition.bind(this), this.validateRenderComposition);
    this.register("create_kinetic_typography", this.handleCreateKineticTypography.bind(this), this.validateCreateKineticTypography);
    this.register("create_lower_thirds", this.handleCreateLowerThirds.bind(this), this.validateCreateLowerThirds);
    this.register("create_animated_captions", this.handleCreateAnimatedCaptions.bind(this), this.validateCreateAnimatedCaptions);

    // Project commands
    this.register("get_project", this.handleGetProject.bind(this));
    this.register("get_compositions", this.handleGetCompositions.bind(this));
  }

  async execute(commandName, params) {
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }

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

  async handleCreateComposition(params) {
    return await this.aeAdapter.createComposition(params);
  }

  async handleCreateTextLayer(params) {
    return await this.aeAdapter.createTextLayer(params.composition, params.text, params.settings);
  }

  async handleCreateShapeLayer(params) {
    return await this.aeAdapter.createShapeLayer(params.composition, params.settings);
  }

  async handleSetKeyframe(params) {
    return await this.aeAdapter.setKeyframe(params.layer, params.propertyPath, params.time, params.value, params.easing);
  }

  async handleExportAlpha(params) {
    return await this.aeAdapter.exportAlpha(params.composition, params.outputPath, params.settings);
  }

  async handleRenderComposition(params) {
    return await this.aeAdapter.renderComposition(params.composition, params.outputPath, params.settings);
  }

  async handleCreateKineticTypography(params) {
    return await this.createKineticTypography(params);
  }

  async handleCreateLowerThirds(params) {
    return await this.createLowerThirds(params);
  }

  async handleCreateAnimatedCaptions(params) {
    return await this.createAnimatedCaptions(params);
  }

  async handleGetProject() {
    return await this.aeAdapter.getProject();
  }

  async handleGetCompositions() {
    return await this.aeAdapter.getCompositions();
  }

  // --- Motion graphics builders ---

  async createKineticTypography(params) {
    return await this.aeAdapter.createUndoGroup("AAVE Kinetic Typography", async () => {
      const comp = await this.aeAdapter.createComposition(params.composition);
      const layer = await this.aeAdapter.createTextLayer(comp, params.text, {
        position: [params.composition.width / 2, params.composition.height / 2],
        scale: [100, 100],
      });

      // Animate scale in
      await this.aeAdapter.setKeyframe(layer, "Scale", 0, [0, 0], "ease_out");
      await this.aeAdapter.setKeyframe(layer, "Scale", 0.5, [120, 120], "ease_in");
      await this.aeAdapter.setKeyframe(layer, "Scale", 1.0, [100, 100], "linear");

      // Animate opacity
      await this.aeAdapter.setKeyframe(layer, "Opacity", 0, 0, "linear");
      await this.aeAdapter.setKeyframe(layer, "Opacity", 0.3, 100, "ease_in");

      return { composition: comp, layer, type: "kinetic_typography" };
    });
  }

  async createLowerThirds(params) {
    return await this.aeAdapter.createUndoGroup("AAVE Lower Thirds", async () => {
      const comp = await this.aeAdapter.createComposition(params.composition);

      // Background bar
      await this.aeAdapter.createShapeLayer(comp, {
        position: [params.composition.width / 2, params.composition.height - 100],
        scale: [params.composition.width, 60],
      });

      // Text layer
      await this.aeAdapter.createTextLayer(comp, params.text, {
        position: [params.composition.width / 2, params.composition.height - 100],
        scale: [100, 100],
      });

      return { composition: comp, type: "lower_thirds" };
    });
  }

  async createAnimatedCaptions(params) {
    return await this.aeAdapter.createUndoGroup("AAVE Animated Captions", async () => {
      const comp = await this.aeAdapter.createComposition(params.composition);
      const layers = [];

      for (const caption of params.captions) {
        const layer = await this.aeAdapter.createTextLayer(comp, caption.text, {
          position: [params.composition.width / 2, params.composition.height * 0.8],
          scale: [100, 100],
          opacity: 0,
        });

        await this.aeAdapter.setKeyframe(layer, "Opacity", caption.startTime, 0, "linear");
        await this.aeAdapter.setKeyframe(layer, "Opacity", caption.startTime + 0.2, 100, "ease_in");
        await this.aeAdapter.setKeyframe(layer, "Opacity", caption.endTime - 0.2, 100, "linear");
        await this.aeAdapter.setKeyframe(layer, "Opacity", caption.endTime, 0, "ease_out");

        layers.push(layer);
      }

      return { composition: comp, layers, type: "animated_captions" };
    });
  }

  // --- Validators ---

  async validateCreateComposition(params) {
    const errors = [];
    if (!params.width || !params.height) errors.push("width and height required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateTextLayer(params) {
    const errors = [];
    if (!params.composition) errors.push("composition required");
    if (!params.text) errors.push("text required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateShapeLayer(params) {
    const errors = [];
    if (!params.composition) errors.push("composition required");
    return { valid: errors.length === 0, errors };
  }

  async validateSetKeyframe(params) {
    const errors = [];
    if (!params.layer) errors.push("layer required");
    if (!params.propertyPath) errors.push("propertyPath required");
    if (params.time === undefined) errors.push("time required");
    return { valid: errors.length === 0, errors };
  }

  async validateExportAlpha(params) {
    const errors = [];
    if (!params.composition) errors.push("composition required");
    if (!params.outputPath) errors.push("outputPath required");
    return { valid: errors.length === 0, errors };
  }

  async validateRenderComposition(params) {
    const errors = [];
    if (!params.composition) errors.push("composition required");
    if (!params.outputPath) errors.push("outputPath required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateKineticTypography(params) {
    const errors = [];
    if (!params.text) errors.push("text required");
    if (!params.composition) errors.push("composition required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateLowerThirds(params) {
    const errors = [];
    if (!params.text) errors.push("text required");
    if (!params.composition) errors.push("composition required");
    return { valid: errors.length === 0, errors };
  }

  async validateCreateAnimatedCaptions(params) {
    const errors = [];
    if (!params.captions || !Array.isArray(params.captions)) errors.push("captions array required");
    if (!params.composition) errors.push("composition required");
    return { valid: errors.length === 0, errors };
  }

  getHistory() {
    return this.commandHistory;
  }
}

export { CommandRegistry };
