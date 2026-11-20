// AAVE After Effects Plugin - Motion Graphics Panel UI
// Adobe Spectrum UI-based panel for motion graphics
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

class AaveMotionPanel extends HTMLElement {
  constructor({ aeAdapter, companionClient, backendClient, commandRegistry }) {
    super();
    this.aeAdapter = aeAdapter;
    this.companionClient = companionClient;
    this.backendClient = backendClient;
    this.commandRegistry = commandRegistry;
    this.jobId = null;
    this.isProcessing = false;

    this.attachShadow({ mode: "open" });
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e0e0e0; background: #1e1e1e; padding: 16px; height: 100%; box-sizing: border-box; }
        h1 { margin: 0 0 8px 0; font-size: 18px; color: #ffffff; }
        .subtitle { font-size: 11px; color: #888; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #b0b0b0; }
        select, input { width: 100%; padding: 8px; background: #2d2d2d; border: 1px solid #444; color: #e0e0e0; border-radius: 4px; font-size: 12px; margin-bottom: 12px; box-sizing: border-box; }
        label { display: block; font-size: 11px; color: #888; margin-bottom: 6px; }
        button.primary { width: 100%; padding: 12px; background: #0078d4; border: none; color: #ffffff; font-weight: 600; border-radius: 4px; font-size: 13px; cursor: pointer; }
        button.secondary { width: 100%; padding: 10px; margin-top: 8px; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; font-weight: 600; border-radius: 4px; font-size: 12px; cursor: pointer; display: none; }
        button.success { width: 100%; padding: 10px; margin-top: 8px; background: #107c10; border: none; color: #ffffff; font-weight: 600; border-radius: 4px; font-size: 12px; cursor: pointer; display: none; }
        .status { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #b0b0b0; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff4d4d; }
        .progress { background: #2d2d2d; border: 1px solid #444; border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 8px; }
        .progress-bar { background: #0078d4; height: 100%; width: 0%; transition: width 0.3s; }
        .error { background: #2d1a1a; border: 1px solid #ff4d4d; border-radius: 4px; padding: 12px; margin-top: 16px; display: none; }
        .error-title { font-size: 11px; font-weight: 600; color: #ff4d4d; margin-bottom: 6px; }
        .results { background: #2d2d2d; border: 1px solid #444; border-radius: 4px; padding: 12px; min-height: 80px; font-size: 11px; color: #888; display: none; }
        .hidden { display: none !important; }
      </style>

      <div class="aave-ae-panel">
        <header>
          <h1>AAVE Motion Graphics</h1>
          <div class="subtitle">v1.0.0 • After Effects • by Randi Sumitro</div>
        </header>

        <div class="status" id="aave-status">
          <span class="status-dot" style="background: #ff4d4d;"></span>
          <span>Companion: Disconnected</span>
        </div>
        <div class="status" id="aave-backend-status">
          <span class="status-dot" style="background: #ff4d4d;"></span>
          <span>Backend: Disconnected</span>
        </div>

        <div class="section">
          <div class="section-title">Motion Graphics</div>
          <label for="ae-motion-type">Type</label>
          <select id="ae-motion-type">
            <option value="kinetic_typography">Kinetic Typography</option>
            <option value="lower_thirds">Lower Thirds</option>
            <option value="animated_captions">Animated Captions</option>
            <option value="animated_title">Animated Title</option>
            <option value="logo_animation">Logo Animation</option>
            <option value="product_showcase">Product Showcase</option>
            <option value="social_overlay">Social Media Overlay</option>
            <option value="transition">Transition</option>
          </select>

          <label for="ae-text-content">Text Content</label>
          <input type="text" id="ae-text-content" value="STOP SCROLLING" placeholder="Enter text...">

          <label for="ae-duration">Duration (seconds)</label>
          <input type="number" id="ae-duration" value="4" min="1" max="30">

          <button class="primary" id="ae-generate">Generate Motion Graphics</button>
          <button class="secondary" id="ae-cancel">Cancel</button>
        </div>

        <div class="section" id="ae-progress-section" style="display: none;">
          <div class="section-title">Progress</div>
          <div id="ae-job-status" style="font-size: 11px; color: #888; margin-bottom: 8px;">Idle</div>
          <div class="progress"><div class="progress-bar" id="ae-progress-bar"></div></div>
          <div id="ae-job-message" style="font-size: 11px; color: #888; min-height: 16px;"></div>
        </div>

        <div class="results" id="ae-results-section">
          <div class="section-title">Results</div>
          <div id="ae-results-content"></div>
          <button class="success" id="ae-export-alpha">Export with Alpha</button>
        </div>

        <div class="error" id="ae-error-section">
          <div class="error-title">Error</div>
          <div id="ae-error-message"></div>
          <button id="ae-dismiss-error" style="margin-top: 8px; padding: 6px 12px; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; font-size: 11px; cursor: pointer;">Dismiss</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.companionClient.on("status", (data) => this.updateStatus(data));
    this.companionClient.on("progress", (data) => this.updateProgress(data));
    this.companionClient.on("job_completed", (data) => this.onJobCompleted(data));
    this.companionClient.on("job_failed", (data) => this.onJobFailed(data));

    this.querySelector("#ae-generate").addEventListener("click", () => this.generateMotionGraphics());
    this.querySelector("#ae-cancel").addEventListener("click", () => this.cancelGeneration());
    this.querySelector("#ae-dismiss-error").addEventListener("click", () => this.dismissError());
    this.querySelector("#ae-export-alpha").addEventListener("click", () => this.exportAlpha());

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

  async generateMotionGraphics() {
    const type = this.querySelector("#ae-motion-type").value;
    const text = this.querySelector("#ae-text-content").value;
    const duration = parseFloat(this.querySelector("#ae-duration").value);

    try {
      await this.aeAdapter.connect();
    } catch (error) {
      this.showError("After Effects connection failed: " + error.message);
      return;
    }

    this.isProcessing = true;
    this.querySelector("#ae-generate").style.display = "none";
    this.querySelector("#ae-cancel").style.display = "block";
    this.querySelector("#ae-progress-section").style.display = "block";
    this.querySelector("#ae-results-section").style.display = "none";
    this.hideError();

    try {
      const response = await this.companionClient.request({
        action: "generate_motion_graphics",
        type,
        text,
        duration,
        composition: {
          width: 1080,
          height: 1920,
          fps: 30,
          duration,
        },
        export: {
          format: "mov",
          alpha: true,
        },
      });

      this.jobId = response.job_id;
      this.updateProgress({ progress: 0, message: "Motion graphics generation started..." });
    } catch (error) {
      this.showError("Failed to generate motion graphics: " + error.message);
      this.isProcessing = false;
      this.querySelector("#ae-generate").style.display = "block";
      this.querySelector("#ae-cancel").style.display = "none";
    }
  }

  async cancelGeneration() {
    if (!this.jobId) return;
    try {
      await this.companionClient.request({ action: "cancel_job", job_id: this.jobId });
    } catch (error) {
      console.error("[AAVE AE Panel] Cancel failed:", error);
    }
    this.isProcessing = false;
    this.querySelector("#ae-generate").style.display = "block";
    this.querySelector("#ae-cancel").style.display = "none";
  }

  updateStatus(data) {
    const dot = this.querySelector("#aave-status .status-dot");
    const text = this.querySelector("#aave-status span:last-child");
    if (data.connected) {
      dot.style.background = "#107c10";
      text.textContent = "Companion: Connected";
    } else {
      dot.style.background = "#ff4d4d";
      text.textContent = "Companion: Disconnected";
    }
  }

  updateBackendStatus(connected, data) {
    const dot = this.querySelector("#aave-backend-status .status-dot");
    const text = this.querySelector("#aave-backend-status span:last-child");
    if (connected) {
      dot.style.background = "#107c10";
      text.textContent = `Backend: Connected${data && data.status ? " (" + data.status + ")" : ""}`;
    } else {
      dot.style.background = "#ff4d4d";
      text.textContent = "Backend: Disconnected";
    }
  }

  updateProgress(data) {
    const status = this.querySelector("#ae-job-status");
    const bar = this.querySelector("#ae-progress-bar");
    const message = this.querySelector("#ae-job-message");
    if (status) status.textContent = data.message || "Processing...";
    if (bar && data.progress !== undefined) bar.style.width = data.progress + "%";
    if (message) message.textContent = data.message || "";
  }

  onJobCompleted(data) {
    this.isProcessing = false;
    this.querySelector("#ae-generate").style.display = "block";
    this.querySelector("#ae-cancel").style.display = "none";
    this.querySelector("#ae-progress-section").style.display = "none";
    this.querySelector("#ae-results-section").style.display = "block";

    const content = this.querySelector("#ae-results-content");
    content.innerHTML = `
      <div><strong>Job ID:</strong> ${data.job_id}</div>
      <div><strong>Type:</strong> ${data.type}</div>
      <div><strong>Status:</strong> Completed</div>
      <div><strong>Output:</strong> ${data.outputPath || "N/A"}</div>
    `;
  }

  onJobFailed(data) {
    this.isProcessing = false;
    this.querySelector("#ae-generate").style.display = "block";
    this.querySelector("#ae-cancel").style.display = "none";
    this.querySelector("#ae-progress-section").style.display = "none";
    this.showError(data.message || "Job failed");
  }

  showError(message) {
    const section = this.querySelector("#ae-error-section");
    const msg = this.querySelector("#ae-error-message");
    msg.textContent = message;
    section.style.display = "block";
  }

  hideError() {
    this.querySelector("#ae-error-section").style.display = "none";
  }

  dismissError() {
    this.hideError();
  }

  async exportAlpha() {
    if (!this.jobId) return;
    try {
      await this.companionClient.request({
        action: "export_alpha",
        job_id: this.jobId,
      });
    } catch (error) {
      this.showError("Export failed: " + error.message);
    }
  }
}

customElements.define("aave-motion-panel", AaveMotionPanel);

export { AaveMotionPanel };
