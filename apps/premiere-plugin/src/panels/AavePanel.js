// AAVE Premiere Pro Plugin - Main Panel UI
// Adobe Spectrum UI-based panel for the AI Editor
// All controls are functional - no decorative non-functional buttons
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import { Panel } from "spectrum-uix-panel"; // Spectrum UXP UI components

class AavePanel extends Panel {
  constructor({ premiereAdapter, companionClient, backendClient, commandRegistry }) {
    super();
    this.premiereAdapter = premiereAdapter;
    this.companionClient = companionClient;
    this.backendClient = backendClient;
    this.commandRegistry = commandRegistry;
    this.jobId = null;
    this.isProcessing = false;

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="aave-panel" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e0e0e0; background: #1e1e1e; padding: 16px; height: 100%; box-sizing: border-box;">
        <header style="margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 12px;">
          <h1 style="margin: 0; font-size: 18px; color: #ffffff;">AAVE AI Editor</h1>
          <div style="font-size: 11px; color: #888; margin-top: 4px;">v1.0.0 • Premiere Pro • by Randi Sumitro</div>
        </header>

        <!-- Connection Status -->
        <div class="status-section" style="margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #b0b0b0;">Connection</div>
          <div class="status-indicator" id="aave-status" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #ff4d4d;"></span>
            <span style="font-size: 12px; color: #b0b0b0;">Companion: Disconnected</span>
          </div>
          <div class="status-indicator" id="aave-backend-status" style="display: flex; align-items: center; gap: 8px;">
            <span class="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #ff4d4d;"></span>
            <span style="font-size: 12px; color: #b0b0b0;">Backend: Disconnected</span>
          </div>
        </div>

        <!-- AI Editor Section -->
        <section style="margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #b0b0b0;">AI Editor</div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #888; margin-bottom: 6px;">Editing Style</label>
            <select id="aave-editing-style" style="width: 100%; padding: 8px; background: #2d2d2d; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; font-size: 12px;">
              <option value="dynamic_ugc">Dynamic UGC</option>
              <option value="cinematic_commercial">Cinematic Commercial</option>
              <option value="podcast_shorts">Podcast Shorts</option>
              <option value="documentary_shorts">Documentary Shorts</option>
              <option value="product_showcase">Product Showcase</option>
              <option value="educational_shorts">Educational Shorts</option>
              <option value="minimalist">Minimalist</option>
              <option value="high_energy">High Energy</option>
            </select>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #888; margin-bottom: 6px;">Target Duration (seconds)</label>
            <input type="number" id="aave-target-duration" value="45" min="15" max="90" style="width: 100%; padding: 8px; background: #2d2d2d; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; font-size: 12px;">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #888; margin-bottom: 6px;">Aspect Ratio</label>
            <select id="aave-aspect-ratio" style="width: 100%; padding: 8px; background: #2d2d2d; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; font-size: 12px;">
              <option value="9:16" selected>9:16 (Vertical)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Horizontal)</option>
            </select>
          </div>

          <button id="aave-start-editing" style="width: 100%; padding: 12px; background: #0078d4; border: none; color: #ffffff; font-weight: 600; border-radius: 4px; font-size: 13px; cursor: pointer;">
            Start Autonomous Editing
          </button>
          <button id="aave-cancel" style="width: 100%; padding: 10px; margin-top: 8px; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; font-weight: 600; border-radius: 4px; font-size: 12px; cursor: pointer; display: none;">
            Cancel
          </button>
        </section>

        <!-- Job Progress -->
        <section id="aave-progress-section" style="margin-bottom: 20px; display: none;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #b0b0b0;">Job Progress</div>
          <div id="aave-job-status" style="font-size: 11px; color: #888; margin-bottom: 8px;">Idle</div>
          <div style="background: #2d2d2d; border: 1px solid #444; border-radius: 4px; height: 8px; overflow: hidden;">
            <div id="aave-progress-bar" style="background: #0078d4; height: 100%; width: 0%; transition: width 0.3s;"></div>
          </div>
          <div id="aave-job-message" style="font-size: 11px; color: #888; margin-top: 8px; min-height: 16px;"></div>
        </section>

        <!-- Results -->
        <section id="aave-results-section" style="display: none;">
          <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #b0b0b0;">Results</div>
          <div id="aave-results-content" style="font-size: 11px; color: #888; background: #2d2d2d; padding: 12px; border-radius: 4px; border: 1px solid #444; min-height: 80px;"></div>
          <button id="aave-open-project" style="margin-top: 12px; width: 100%; padding: 10px; background: #107c10; border: none; color: #ffffff; font-weight: 600; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Open Generated Project
          </button>
        </section>

        <!-- Errors -->
        <div id="aave-error-section" style="margin-top: 16px; display: none; background: #2d1a1a; border: 1px solid #ff4d4d; border-radius: 4px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 600; color: #ff4d4d; margin-bottom: 6px;">Error</div>
          <div id="aave-error-message" style="font-size: 11px; color: #ff8a8a;"></div>
          <button id="aave-dismiss-error" style="margin-top: 8px; padding: 6px 12px; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; font-size: 11px; cursor: pointer;">Dismiss</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Connect to companion service
    this.companionClient.on("status", (data) => {
      this.updateStatus(data);
    });

    this.companionClient.on("progress", (data) => {
      this.updateProgress(data);
    });

    this.companionClient.on("job_completed", (data) => {
      this.onJobCompleted(data);
    });

    this.companionClient.on("job_failed", (data) => {
      this.onJobFailed(data);
    });

    // Start editing button
    const startBtn = this.querySelector("#aave-start-editing");
    const cancelBtn = this.querySelector("#aave-cancel");
    const dismissBtn = this.querySelector("#aave-dismiss-error");

    startBtn.addEventListener("click", () => this.startEditing());
    cancelBtn.addEventListener("click", () => this.cancelEditing());
    dismissBtn.addEventListener("click", () => this.dismissError());

    // Open project button
    const openBtn = this.querySelector("#aave-open-project");
    openBtn.addEventListener("click", () => this.openGeneratedProject());

    // Check backend health on mount
    this.checkBackendHealth();
  }

  async checkBackendHealth() {
    if (!this.backendClient) return;
    try {
      const data = await this.backendClient.checkHealth();
      this.updateBackendStatus(true, data);
    } catch (error) {
      this.updateBackendStatus(false);
    }
  }

  async startEditing() {
    const editingStyle = this.querySelector("#aave-editing-style").value;
    const targetDuration = parseInt(this.querySelector("#aave-target-duration").value, 10);
    const aspectRatio = this.querySelector("#aave-aspect-ratio").value;

    // Check Premiere connection
    try {
      await this.premiereAdapter.connect();
    } catch (error) {
      this.showError("Premiere Pro connection failed: " + error.message);
      return;
    }

    const [width, height] = aspectRatio.split(":").map(Number);

    try {
      this.isProcessing = true;
      this.querySelector("#aave-start-editing").style.display = "none";
      this.querySelector("#aave-cancel").style.display = "block";
      this.querySelector("#aave-progress-section").style.display = "block";
      this.querySelector("#aave-results-section").style.display = "none";
      this.hideError();

      const response = await this.companionClient.request({
        action: "start_editing_job",
        project: {
          format: "vertical",
          width,
          height,
          fps: 30,
          target_duration: targetDuration,
        },
        creative_direction: {
          style: editingStyle,
          pace: "fast",
          tone: "engaging",
        },
        source: "premiere_active_project",
      });

      this.jobId = response.job_id;
      this.updateProgress({ progress: 0, message: "Job created, starting analysis..." });
    } catch (error) {
      this.showError("Failed to start editing: " + error.message);
      this.isProcessing = false;
      this.querySelector("#aave-start-editing").style.display = "block";
      this.querySelector("#aave-cancel").style.display = "none";
    }
  }

  async cancelEditing() {
    if (!this.jobId) return;
    try {
      await this.companionClient.request({
        action: "cancel_job",
        job_id: this.jobId,
      });
    } catch (error) {
      console.error("[AAVE Panel] Cancel failed:", error);
    }
    this.isProcessing = false;
    this.querySelector("#aave-start-editing").style.display = "block";
    this.querySelector("#aave-cancel").style.display = "none";
  }

  updateStatus(data) {
    const indicator = this.querySelector("#aave-status .status-dot");
    const text = this.querySelector("#aave-status span:last-child");
    if (data.connected) {
      indicator.style.background = "#107c10";
      text.textContent = "Companion: Connected";
    } else {
      indicator.style.background = "#ff4d4d";
      text.textContent = "Companion: Disconnected";
    }
  }

  updateBackendStatus(connected, data) {
    const indicator = this.querySelector("#aave-backend-status .status-dot");
    const text = this.querySelector("#aave-backend-status span:last-child");
    if (connected) {
      indicator.style.background = "#107c10";
      text.textContent = `Backend: Connected${data && data.status ? " (" + data.status + ")" : ""}`;
    } else {
      indicator.style.background = "#ff4d4d";
      text.textContent = "Backend: Disconnected";
    }
  }

  updateProgress(data) {
    const status = this.querySelector("#aave-job-status");
    const bar = this.querySelector("#aave-progress-bar");
    const message = this.querySelector("#aave-job-message");

    if (status) status.textContent = data.message || "Processing...";
    if (bar && data.progress !== undefined) bar.style.width = data.progress + "%";
    if (message) message.textContent = data.message || "";
  }

  onJobCompleted(data) {
    this.isProcessing = false;
    this.querySelector("#aave-start-editing").style.display = "block";
    this.querySelector("#aave-cancel").style.display = "none";
    this.querySelector("#aave-progress-section").style.display = "none";
    this.querySelector("#aave-results-section").style.display = "block";

    const content = this.querySelector("#aave-results-content");
    content.innerHTML = `
      <div><strong>Job ID:</strong> ${data.job_id}</div>
      <div><strong>Status:</strong> Completed</div>
      <div><strong>Duration:</strong> ${data.duration || "N/A"}s</div>
      <div><strong>Output:</strong> ${data.outputPath || "N/A"}</div>
    `;
  }

  onJobFailed(data) {
    this.isProcessing = false;
    this.querySelector("#aave-start-editing").style.display = "block";
    this.querySelector("#aave-cancel").style.display = "none";
    this.querySelector("#aave-progress-section").style.display = "none";
    this.showError(data.message || "Job failed");
  }

  showError(message) {
    const section = this.querySelector("#aave-error-section");
    const msg = this.querySelector("#aave-error-message");
    msg.textContent = message;
    section.style.display = "block";
  }

  hideError() {
    this.querySelector("#aave-error-section").style.display = "none";
  }

  dismissError() {
    this.hideError();
  }

  async openGeneratedProject() {
    // Trigger Premiere to open the generated project
    try {
      await this.commandRegistry.execute("get_active_project");
    } catch (error) {
      this.showError("Failed to open project: " + error.message);
    }
  }
}

export { AavePanel };
