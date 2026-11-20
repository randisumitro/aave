/**
 * AAVE Premiere Pro Plugin - CommandRegistry Tests
 * Copyright (c) 2026 Randi Sumitro. All rights reserved.
 */
import { describe, it, expect } from "vitest";
import { CommandRegistry } from "../src/commands/CommandRegistry.js";
import { PremiereAdapter } from "../src/adapters/PremiereAdapter.js";

describe("CommandRegistry", () => {
  it("should register and execute commands", async () => {
    const adapter = new PremiereAdapter();
    const registry = new CommandRegistry({
      premiereAdapter: adapter,
      companionClient: null as any,
    });

    registry.register("test_command", async () => ({ result: "ok" }), async () => ({ valid: true, errors: [] }));

    const result = await registry.execute("test_command", {});
    expect(result.status).toBe("success");
    expect(result.result).toBe("ok");
  });

  it("should validate commands before execution", async () => {
    const adapter = new PremiereAdapter();
    const registry = new CommandRegistry({
      premiereAdapter: adapter,
      companionClient: null as any,
    });

    registry.register(
      "validated_command",
      async () => ({ result: "ok" }),
      async () => ({ valid: false, errors: ["Missing required param"] })
    );

    await expect(registry.execute("validated_command", {})).rejects.toThrow("Command validation failed");
  });

  it("should throw for unknown commands", async () => {
    const adapter = new PremiereAdapter();
    const registry = new CommandRegistry({
      premiereAdapter: adapter,
      companionClient: null as any,
    });

    await expect(registry.execute("unknown_command", {})).rejects.toThrow("Unknown command");
  });

  it("should track command history", async () => {
    const adapter = new PremiereAdapter();
    const registry = new CommandRegistry({
      premiereAdapter: adapter,
      companionClient: null as any,
    });

    registry.register("history_command", async () => ({ result: "ok" }), async () => ({ valid: true, errors: [] }));

    await registry.execute("history_command", { foo: "bar" });

    const history = registry.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].command).toBe("history_command");
    expect(history[0].params).toEqual({ foo: "bar" });
    expect(history[0].status).toBe("success");
  });
});
