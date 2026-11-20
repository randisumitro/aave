// AAVE Premiere Pro Plugin - Main Entry Point
// Adobe UXP Plugin for Premiere Pro
// Communicates with local companion service via WebSocket/HTTP
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import { Panel } from "./panels/AavePanel.js";
import { PremiereAdapter } from "./adapters/PremiereAdapter.js";
import { CompanionClient } from "./services/CompanionClient.js";
import { CommandRegistry } from "./commands/CommandRegistry.js";

// Plugin lifecycle
async function initialize() {
  console.log("[AAVE Premiere] Initializing plugin...");

  // Initialize Premiere DOM adapter
  const premiereAdapter = new PremiereAdapter();

  // Initialize companion service client
  const companionClient = new CompanionClient({
    url: "ws://localhost:8077",
    reconnect: true,
    maxReconnectAttempts: 10,
  });

  // Initialize command registry
  const commandRegistry = new CommandRegistry({
    premiereAdapter,
    companionClient,
  });

  // Register all commands
  commandRegistry.registerAll();

  // Initialize panel
  const panel = new Panel({
    premiereAdapter,
    companionClient,
    commandRegistry,
  });

  // Store plugin context for other modules
  window.__aaveContext = {
    premiereAdapter,
    companionClient,
    commandRegistry,
    panel,
    version: "1.0.0",
  };

  console.log("[AAVE Premiere] Plugin initialized successfully");
}

async function shutdown() {
  console.log("[AAVE Premiere] Shutting down plugin...");
  const context = window.__aaveContext;
  if (context && context.companionClient) {
    await context.companionClient.disconnect();
  }
  console.log("[AAVE Premiere] Plugin shutdown complete");
}

// Export lifecycle functions for UXP host
export { initialize, shutdown };

// Register panel with UXP
export const panel = Panel;
