// AAVE After Effects Plugin - Main Entry Point
// Adobe UXP Plugin for After Effects - Motion Graphics Engine
// Communicates with local companion service via WebSocket/HTTP
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import { Panel } from "./panels/AaveMotionPanel.js";
import { AfterEffectsAdapter } from "./adapters/AfterEffectsAdapter.js";
import { CompanionClient } from "./services/CompanionClient.js";
import { CommandRegistry } from "./commands/CommandRegistry.js";

async function initialize() {
  console.log("[AAVE After Effects] Initializing plugin...");

  // Initialize After Effects DOM adapter
  const aeAdapter = new AfterEffectsAdapter();

  // Initialize companion service client
  const companionClient = new CompanionClient({
    url: "ws://localhost:8077",
    reconnect: true,
    maxReconnectAttempts: 10,
  });

  // Initialize command registry
  const commandRegistry = new CommandRegistry({
    aeAdapter,
    companionClient,
  });

  // Register all commands
  commandRegistry.registerAll();

  // Initialize panel
  const panel = new Panel({
    aeAdapter,
    companionClient,
    commandRegistry,
  });

  // Store plugin context
  window.__aaveContext = {
    aeAdapter,
    companionClient,
    commandRegistry,
    panel,
    version: "1.0.0",
  };

  console.log("[AAVE After Effects] Plugin initialized successfully");
}

async function shutdown() {
  console.log("[AAVE After Effects] Shutting down plugin...");
  const context = window.__aaveContext;
  if (context && context.companionClient) {
    await context.companionClient.disconnect();
  }
  console.log("[AAVE After Effects] Plugin shutdown complete");
}

export { initialize, shutdown };
export const panel = Panel;
