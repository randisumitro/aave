// AAVE Plugin SDK
// Provides the interface and utilities for building third-party AAVE plugins
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

import type {
  AAVEPlugin,
  PluginContext,
  PluginInput,
  PluginResult,
  PluginValidationResult,
} from "@aave/shared-types";

export interface PluginSDKConfig {
  pluginId: string;
  pluginVersion: string;
  permissions: string[];
  timeoutMs: number;
  maxMemoryMb: number;
}

export interface PluginCapability {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export class PluginSDK {
  private config: PluginSDKConfig;
  private context: PluginContext | null = null;
  private capabilities: Map<string, PluginCapability> = new Map();

  constructor(config: PluginSDKConfig) {
    this.config = config;
  }

  initialize(context: PluginContext): void {
    this.context = context;
  }

  getContext(): PluginContext | null {
    return this.context;
  }

  registerCapability(capability: PluginCapability): void {
    this.capabilities.set(capability.name, capability);
  }

  getCapabilities(): PluginCapability[] {
    return Array.from(this.capabilities.values());
  }

  async executeCommand(
    commandName: string,
    params: PluginInput
  ): Promise<PluginResult> {
    if (!this.context?.commandRegistry) {
      throw new Error("Command registry not available");
    }
    return this.context.commandRegistry.execute(commandName, params);
  }

  async sendToCompanion(message: any): Promise<any> {
    if (!this.context?.companionClient) {
      throw new Error("Companion client not available");
    }
    return this.context.companionClient.request(message);
  }

  validatePermissions(requiredPermissions: string[]): boolean {
    if (!this.context) return false;
    const granted = this.config.permissions;
    return requiredPermissions.every((p) => granted.includes(p));
  }

  getTimeoutMs(): number {
    return this.config.timeoutMs;
  }

  getMaxMemoryMb(): number {
    return this.config.maxMemoryMb;
  }
}

export function createPluginSDK(config: PluginSDKConfig): PluginSDK {
  return new PluginSDK(config);
}

export type { AAVEPlugin, PluginContext, PluginInput, PluginResult, PluginValidationResult };
