// AAVE After Effects Plugin - After Effects DOM Adapter
// Wraps Adobe After Effects DOM API with typed, validated operations
// Uses documented After Effects UXP API patterns
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

class AfterEffectsAdapter {
  constructor() {
    this.app = null;
    this.project = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // After Effects UXP entry point
      // eslint-disable-next-line no-undef
      const afterEffects = globalThis.require && globalThis.require("aftereffects");
      if (!afterEffects) {
        throw new Error("After Effects DOM API not available");
      }

      this.app = afterEffects;
      this.project = this.app.project;
      this.isConnected = true;

      console.log("[AAVE AfterEffectsAdapter] Connected to After Effects");
      return true;
    } catch (error) {
      console.error("[AAVE AfterEffectsAdapter] Connection failed:", error.message);
      throw error;
    }
  }

  async getProject() {
    if (!this.app) throw new Error("Not connected to After Effects");
    return this.app.project;
  }

  async createComposition(settings) {
    if (!this.project) throw new Error("No project available");
    return await this.project.items.addComp(
      settings.name || "AAVE Composition",
      settings.width || 1080,
      settings.height || 1920,
      settings.pixelAspect || 1.0,
      settings.duration || 4,
      settings.fps || 30
    );
  }

  async createTextLayer(composition, text, settings = {}) {
    const layer = await composition.layers.addText(text);
    if (settings.position) layer.property("Position").setValue(settings.position);
    if (settings.scale) layer.property("Scale").setValue(settings.scale);
    if (settings.opacity !== undefined) layer.property("Opacity").setValue(settings.opacity);
    return layer;
  }

  async createShapeLayer(composition, settings = {}) {
    const layer = await composition.layers.addShape();
    if (settings.position) layer.property("Position").setValue(settings.position);
    if (settings.scale) layer.property("Scale").setValue(settings.scale);
    return layer;
  }

  async setKeyframe(layer, propertyPath, time, value, easing = "linear") {
    const property = await layer.property(propertyPath);
    await property.setValueAtTime(time, value);
    return property;
  }

  async applyEasing(property, keyframeIndex, easingType) {
    // Apply easing to a keyframe
    return await property.applyEasing(keyframeIndex, easingType);
  }

  async createUndoGroup(name, fn) {
    this.app.beginUndoGroup(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.app.endUndoGroup();
    }
  }

  async exportAlpha(composition, outputPath, settings = {}) {
    // Export composition with alpha channel (MOV with ProRes 4444 or Animation codec)
    return await composition.export(outputPath, {
      format: "QuickTime",
      codec: settings.codec || "ProRes 4444",
      alpha: true,
      ...settings,
    });
  }

  async renderComposition(composition, outputPath, settings = {}) {
    return await composition.render(outputPath, {
      format: settings.format || "H.264",
      ...settings,
    });
  }

  async getCompositions() {
    const items = await this.project.items;
    return items.filter((item) => item.type === "Composition");
  }
}

export { AfterEffectsAdapter };
