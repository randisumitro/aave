/**
 * AAVE After Effects Plugin - Mocked Adapter Tests
 *
 * ⚠️ MOCKED TEST - These tests use mocked After Effects DOM API.
 * Adobe After Effects is NOT installed in this environment.
 * Real Adobe integration must be validated in actual Adobe applications.
 *
 * Copyright (c) 2026 Randi Sumitro. All rights reserved.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AfterEffectsAdapter } from "../src/adapters/AfterEffectsAdapter.js";

// Mock the After Effects UXP API
const mockAEAPI = {
  project: {
    items: {
      addComp: vi.fn(),
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-ignore - mocking globalThis.require for testing
  ;(globalThis as any).require = vi.fn(() => mockAEAPI);
});

describe("AfterEffectsAdapter (MOCKED)", () => {
  it("should connect to mocked After Effects API", async () => {
    const mockProject = { items: { addComp: vi.fn() } };
    mockAEAPI.project = mockProject;

    const adapter = new AfterEffectsAdapter();
    const result = await adapter.connect();

    expect(result).toBe(true);
    expect(adapter.isConnected).toBe(true);
    expect(adapter.project).toEqual(mockProject);
  });

  it("should throw when After Effects API is not available", async () => {
    // @ts-ignore
    ;(globalThis as any).require = vi.fn(() => undefined);

    const adapter = new AfterEffectsAdapter();
    await expect(adapter.connect()).rejects.toThrow(
      "After Effects DOM API not available"
    );
  });

  it("should create composition", async () => {
    const mockComp = {
      id: "comp_1",
      layers: { addText: vi.fn(), addShape: vi.fn() },
    };
    mockAEAPI.project.items.addComp.mockResolvedValue(mockComp);

    const adapter = new AfterEffectsAdapter();
    adapter.app = mockAEAPI;
    adapter.project = mockAEAPI.project;
    adapter.isConnected = true;

    const result = await adapter.createComposition({
      name: "Test Comp",
      width: 1080,
      height: 1920,
      duration: 4,
      fps: 30,
    });

    expect(result).toEqual(mockComp);
    expect(mockAEAPI.project.items.addComp).toHaveBeenCalledWith(
      "Test Comp",
      1080,
      1920,
      1.0,
      4,
      30
    );
  });

  it("should create text layer", async () => {
    const mockLayer = {
      property: vi.fn(() => ({ setValue: vi.fn() })),
    };
    const mockComp = {
      layers: { addText: vi.fn().mockResolvedValue(mockLayer) },
    };
    const adapter = new AfterEffectsAdapter();
    adapter.isConnected = true;

    const result = await adapter.createTextLayer(mockComp, "Hello World", {
      position: [540, 960],
      scale: [100, 100],
    });

    expect(result).toEqual(mockLayer);
    expect(mockComp.layers.addText).toHaveBeenCalledWith("Hello World");
  });

  it("should create shape layer", async () => {
    const mockLayer = {
      property: vi.fn(() => ({ setValue: vi.fn() })),
    };
    const mockComp = {
      layers: { addShape: vi.fn().mockResolvedValue(mockLayer) },
    };
    const adapter = new AfterEffectsAdapter();
    adapter.isConnected = true;

    const result = await adapter.createShapeLayer(mockComp, {
      position: [540, 960],
      scale: [1080, 60],
    });

    expect(result).toEqual(mockLayer);
    expect(mockComp.layers.addShape).toHaveBeenCalled();
  });

  it("should set keyframe", async () => {
    const mockProperty = { setValueAtTime: vi.fn() };
    const mockLayer = { property: vi.fn().mockResolvedValue(mockProperty) };
    const adapter = new AfterEffectsAdapter();
    adapter.isConnected = true;

    const result = await adapter.setKeyframe(
      mockLayer,
      "Opacity",
      0,
      0,
      "linear"
    );
    expect(result).toEqual(mockProperty);
    expect(mockProperty.setValueAtTime).toHaveBeenCalledWith(0, 0);
  });

  it("should throw when not connected", async () => {
    const adapter = new AfterEffectsAdapter();
    await expect(adapter.getProject()).rejects.toThrow(
      "Not connected to After Effects"
    );
  });

  it("should export alpha with ProRes 4444", async () => {
    const mockComp = {
      export: vi.fn().mockResolvedValue({ path: "/output/comp.mov" }),
    };
    const adapter = new AfterEffectsAdapter();
    adapter.isConnected = true;

    const result = await adapter.exportAlpha(mockComp, "/output/comp.mov", {
      codec: "ProRes 4444",
    });

    expect(result).toEqual({ path: "/output/comp.mov" });
    expect(mockComp.export).toHaveBeenCalledWith("/output/comp.mov", {
      format: "QuickTime",
      codec: "ProRes 4444",
      alpha: true,
    });
  });

  it("should filter compositions by type", async () => {
    const mockItems = [
      { type: "Composition", id: "comp_1" },
      { type: "Folder", id: "folder_1" },
      { type: "Composition", id: "comp_2" },
    ];
    const compositions = mockItems.filter(
      (item) => item.type === "Composition"
    );
    expect(compositions.length).toBe(2);
    expect(compositions[0].id).toBe("comp_1");
    expect(compositions[1].id).toBe("comp_2");
  });
});
