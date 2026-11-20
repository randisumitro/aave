// AAVE Premiere Pro Plugin - Backend HTTP Client
// Communicates with FastAPI backend (http://localhost:8000) for job management
// and model registry.
//\
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

class BackendClient {
  constructor({ baseUrl = "http://localhost:8000", timeout = 30000 } = {}) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.isConnected = false;
  }

  async checkHealth() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Backend health check failed: ${response.status}`);
      const data = await response.json();
      this.isConnected = true;
      return data;
    } catch (error) {
      this.isConnected = false;
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async createJob(project, creativeDirection, source = "premiere_active_project") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          creative_direction: creativeDirection,
          source,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create job: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async getJob(jobId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Job not found");
        throw new Error(`Failed to get job: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async cancelJob(jobId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}/cancel`, {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to cancel job: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async listModels() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/models`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Failed to list models: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async routeModel(taskType, preferredProvider = null) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/models/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: taskType,
          preferred_provider: preferredProvider,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("No model available for this task");
        throw new Error(`Failed to route model: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async getSystemStatus() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/system/status`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Failed to get system status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export { BackendClient };
