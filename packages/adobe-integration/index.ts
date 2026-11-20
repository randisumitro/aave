// AAVE Adobe Integration Package
// Abstractions for Adobe Premiere Pro and After Effects integration
// Provides typed adapters and contract definitions
//
// Copyright (c) 2026 Randi Sumitro. All rights reserved.
// Author: Randi Sumitro (https://github.com/randisumitro)
// License: MIT

export interface AdobeAppInfo {
  name: "premierepro" | "aftereffects";
  version: string;
  isConnected: boolean;
}

export interface AdobeSequence {
  id: string;
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export interface AdobeClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  trackIndex: number;
}

export interface AdobeMarker {
  id: string;
  time: number;
  comment: string;
  duration: number;
  color: string;
}

export interface AdobeEffect {
  name: string;
  parameters: Record<string, any>;
}

export class AdobeIntegrationError extends Error {
  constructor(
    message: string,
    public app: "premierepro" | "aftereffects",
    public operation: string
  ) {
    super(message);
    this.name = "AdobeIntegrationError";
  }
}

export interface AdobeAdapter {
  connect(): Promise<void>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
}

export class PremiereAdapter implements AdobeAdapter {
  private connected = false;

  async connect(): Promise<void> {
    // Implementation in plugin source
    this.connected = true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export class AfterEffectsAdapter implements AdobeAdapter {
  private connected = false;

  async connect(): Promise<void> {
    // Implementation in plugin source
    this.connected = true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}

export function createPremiereAdapter(): AdobeAdapter {
  return new PremiereAdapter();
}

export function createAfterEffectsAdapter(): AdobeAdapter {
  return new AfterEffectsAdapter();
}
