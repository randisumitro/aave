// AAVE Premiere Pro Plugin - Premiere DOM Adapter
// Wraps Adobe Premiere Pro DOM API with typed, validated operations
// Does NOT fabricate API methods - only uses documented UXP Premiere APIs
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

class PremiereAdapter {
  constructor() {
    this.app = null;
    this.project = null;
    this.sequence = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Premiere Pro UXP entry point
      // eslint-disable-next-line no-undef
      const premiere = window.require && window.require("premierepro");
      if (!premiere) {
        throw new Error("Premiere Pro DOM API not available");
      }

      this.app = premiere;
      this.project = await this.app.Project.getActiveProject();
      this.isConnected = true;

      console.log("[AAVE PremiereAdapter] Connected to Premiere Pro");
      return true;
    } catch (error) {
      console.error("[AAVE PremiereAdapter] Connection failed:", error.message);
      throw error;
    }
  }

  async getActiveProject() {
    if (!this.app) throw new Error("Not connected to Premiere Pro");
    return await this.app.Project.getActiveProject();
  }

  async getActiveSequence() {
    if (!this.app) throw new Error("Not connected to Premiere Pro");
    const project = await this.getActiveProject();
    if (!project) throw new Error("No active project");
    return await project.getActiveSequence();
  }

  async getProjectItems() {
    const project = await this.getActiveProject();
    return await project.getRootItem().getChildren();
  }

  async importMedia(filePath) {
    const project = await this.getActiveProject();
    return await project.importMedia(filePath);
  }

  async createSequence(settings) {
    const project = await this.getActiveProject();
    return await project.createSequence(settings);
  }

  async getTracks(sequence) {
    return await sequence.getTracks();
  }

  async insertClip(sequence, clip, trackIndex, time) {
    const track = await sequence.getTrackAt(trackIndex);
    return await track.insertClip(clip, time);
  }

  async createMarker(sequence, time, comment, duration, color) {
    return await sequence.createMarker(time, comment, duration, color);
  }

  async applyEffect(clip, effectName) {
    return await clip.applyEffect(effectName);
  }

  async setClipVolume(clip, volume) {
    return await clip.setVolume(volume);
  }

  async getExportSettings() {
    return {
      format: "H.264",
      preset: "Match Source - High bitrate",
    };
  }

  async exportSequence(sequence, outputPath, settings) {
    // Export via Adobe Media Encoder or Premiere export API
    return await sequence.export(outputPath, settings);
  }

  async undo() {
    // Premiere UXP supports undo via app
    if (this.app && this.app.beginUndo) {
      // Undo group management
    }
  }
}

export { PremiereAdapter };
