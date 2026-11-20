/**
 * AAVE Premiere Pro Plugin - Mocked Adapter Tests
 *
 * ⚠️ MOCKED TEST - These tests use mocked Premiere Pro DOM API.
 * Adobe Premiere Pro is NOT installed in this environment.
 * Real Adobe integration must be validated in actual Adobe applications.
 *
 * Copyright (c) 2026 Randi Sumitro. All rights reserved.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PremiereAdapter } from "../src/adapters/PremiereAdapter.js";

// Mock the Premiere Pro UXP API
const mockPremiereAPI = {
  Project: {
    getActiveProject: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-ignore - mocking globalThis.require for testing
  ;(globalThis as any).require = vi.fn(() => mockPremiereAPI);
});

describe("PremiereAdapter (MOCKED)", () => {
  it("should connect to mocked Premiere Pro API", async () => {
    const mockProject = {
      getRootItem: vi.fn(() => ({
        getChildren: vi.fn(() => []),
      })),
    };
    mockPremiereAPI.Project.getActiveProject.mockResolvedValue(mockProject);

    const adapter = new PremiereAdapter();
    const result = await adapter.connect();

    expect(result).toBe(true);
    expect(adapter.isConnected).toBe(true);
    expect(mockPremiereAPI.Project.getActiveProject).toHaveBeenCalled();
  });

  it("should throw when Premiere API is not available", async () => {
    // @ts-ignore
    ;(globalThis as any).require = vi.fn(() => undefined);

    const adapter = new PremiereAdapter();
    await expect(adapter.connect()).rejects.toThrow(
      "Premiere Pro DOM API not available"
    );
  });

  it("should get active project", async () => {
    const mockProject = { id: "proj_1" };
    mockPremiereAPI.Project.getActiveProject.mockResolvedValue(mockProject);

    const adapter = new PremiereAdapter();
    adapter.app = mockPremiereAPI;
    adapter.isConnected = true;

    const project = await adapter.getActiveProject();
    expect(project).toEqual(mockProject);
  });

  it("should throw when not connected", async () => {
    const adapter = new PremiereAdapter();
    await expect(adapter.getActiveProject()).rejects.toThrow(
      "Not connected to Premiere Pro"
    );
  });

  it("should import media", async () => {
    const mockProject = {
      importMedia: vi.fn().mockResolvedValue({ id: "media_1" }),
    };
    const adapter = new PremiereAdapter();
    adapter.app = {
      Project: { getActiveProject: vi.fn().mockResolvedValue(mockProject) },
    };
    adapter.isConnected = true;

    const result = await adapter.importMedia("/path/to/video.mp4");
    expect(result).toEqual({ id: "media_1" });
    expect(mockProject.importMedia).toHaveBeenCalledWith("/path/to/video.mp4");
  });

  it("should create sequence", async () => {
    const mockProject = {
      createSequence: vi.fn().mockResolvedValue({ id: "seq_1" }),
    };
    const adapter = new PremiereAdapter();
    adapter.app = {
      Project: { getActiveProject: vi.fn().mockResolvedValue(mockProject) },
    };
    adapter.isConnected = true;

    const result = await adapter.createSequence({
      width: 1080,
      height: 1920,
      fps: 30,
    });
    expect(result).toEqual({ id: "seq_1" });
  });

  it("should create marker", async () => {
    const mockSequence = {
      createMarker: vi.fn().mockResolvedValue({ id: "marker_1" }),
    };
    const adapter = new PremiereAdapter();
    adapter.isConnected = true;

    const result = await adapter.createMarker(
      mockSequence,
      5.0,
      "Hook point",
      2,
      "green"
    );
    expect(result).toEqual({ id: "marker_1" });
    expect(mockSequence.createMarker).toHaveBeenCalledWith(
      5.0,
      "Hook point",
      2,
      "green"
    );
  });

  it("should apply effect", async () => {
    const mockClip = {
      applyEffect: vi.fn().mockResolvedValue({ id: "effect_1" }),
    };
    const adapter = new PremiereAdapter();
    adapter.isConnected = true;

    const result = await adapter.applyEffect(mockClip, "Lumetri Color");
    expect(result).toEqual({ id: "effect_1" });
    expect(mockClip.applyEffect).toHaveBeenCalledWith("Lumetri Color");
  });

  it("should export sequence with H.264 settings", async () => {
    const adapter = new PremiereAdapter();
    const settings = await adapter.getExportSettings();
    expect(settings.format).toBe("H.264");
    expect(settings.preset).toContain("High bitrate");
  });
});
