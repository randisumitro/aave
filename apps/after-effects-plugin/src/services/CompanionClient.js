// AAVE After Effects Plugin - Companion Service Client
// Secure WebSocket client for communication with local companion service
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

class CompanionClient {
  constructor({ url = "ws://localhost:8077", reconnect = true, maxReconnectAttempts = 10 }) {
    this.url = url;
    this.reconnect = reconnect;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log("[AAVE AE CompanionClient] Connected to companion service");
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (error) => {
          console.error("[AAVE AE CompanionClient] WebSocket error:", error);
          reject(error);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          if (this.reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message) {
    if (!this.isConnected || !this.socket) {
      throw new Error("Companion service not connected");
    }
    this.socket.send(JSON.stringify(message));
  }

  async request(message, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${message.action || "unknown"}`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.send({ ...message, id });
    });
  }

  handleMessage(data) {
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (error) {
      console.error("[AAVE AE CompanionClient] Invalid message:", error);
      return;
    }

    if (parsed.id && this.pendingRequests.has(parsed.id)) {
      const { resolve, reject, timer } = this.pendingRequests.get(parsed.id);
      clearTimeout(timer);
      this.pendingRequests.delete(parsed.id);
      if (parsed.error) {
        reject(new Error(parsed.error));
      } else {
        resolve(parsed.data);
      }
      return;
    }

    const handler = this.messageHandlers.get(parsed.type);
    if (handler) {
      handler(parsed.data);
    }
  }

  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  async disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export { CompanionClient };
