# AAVE Plugin Manifest Schema
# Copyright (c) 2026 Randi Sumitro. All rights reserved.
# Author: Randi Sumitro (https://github.com/randisumitro)
# License: MIT

// JSON Schema (draft-07) for AAVE plugin manifests (Premiere & After Effects UXP plugins).
// Used by the Plugin Manager to validate third-party plugin packages before installation.

export const PLUGIN_MANIFEST_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://aave.randisumitro.dev/schemas/plugin-manifest/v1",
  title: "AAVE Plugin Manifest",
  description: "Manifest for an AAVE UXP plugin package",
  type: "object",
  required: ["id", "name", "version", "description", "author", "host", "runtime", "ui", "permissions", "entrypoints", "requiredPermissions"],
  properties: {
    id: {
      type: "string",
      pattern: "^com\\.aave\\.[a-z0-9_-]+$|^[a-z0-9_-]+\\.[a-z0-9_-]+$",
      description: "Reverse-DNS style plugin identifier",
    },
    name: { type: "string", minLength: 1, maxLength: 100 },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "SemVer version string",
    },
    description: { type: "string", maxLength: 500 },
    author: { type: "string", minLength: 1 },
    host: {
      type: "object",
      required: ["app", "minVersion"],
      properties: {
        app: { type: "string", enum: ["PR", "AE"] },
        minVersion: { type: "string", pattern: "^\\d+\\.\\d+$" },
      },
      additionalProperties: false,
    },
    runtime: {
      type: "object",
      required: ["javascript", "cef"],
      properties: {
        javascript: { type: "boolean" },
        cef: { type: "boolean" },
        commonPlugins: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
    ui: {
      type: "object",
      required: ["type", "title", "width", "height"],
      properties: {
        type: { type: "string", const: "panel" },
        title: { type: "string" },
        width: { type: "integer", minimum: 200 },
        height: { type: "integer", minimum: 200 },
        minWidth: { type: "integer", minimum: 100 },
        minHeight: { type: "integer", minimum: 100 },
      },
      additionalProperties: false,
    },
    permissions: {
      type: "object",
      properties: {
        localFileSystem: { type: "string", enum: ["none", "read", "all"] },
        network: { type: "string", enum: ["none", "all"] },
      },
      additionalProperties: false,
    },
    entrypoints: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["type", "id", "main"],
        properties: {
          type: { type: "string", const: "panel" },
          id: { type: "string" },
          main: { type: "string" },
          panel: {
            type: "object",
            properties: {
              title: { type: "string" },
              width: { type: "integer" },
              height: { type: "integer" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
    icons: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "size"],
        properties: {
          path: { type: "string" },
          size: { type: "integer" },
        },
        additionalProperties: false,
      },
    },
    requiredPermissions: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
    },
  },
  additionalProperties: false,
};

export function validatePluginManifest(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== "object") {
    errors.push("Manifest must be an object");
    return { valid: false, errors };
  }

  for (const field of [
    "id", "name", "version", "description", "author", "host", "runtime",
    "ui", "permissions", "entrypoints", "requiredPermissions",
  ]) {
    if (!(field in manifest)) {
      errors.push(`Manifest.${field} is required`);
    }
  }

  if (manifest.id && !/^com\.aave\.[a-z0-9_-]+$|^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(manifest.id)) {
    errors.push('Manifest.id must be reverse-DNS style (e.g. com.aave.smart-cut)');
  }

  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('Manifest.version must be SemVer (e.g. 1.0.0)');
  }

  if (manifest.host) {
    if (!manifest.host.app || !["PR", "AE"].includes(manifest.host.app)) {
      errors.push('Manifest.host.app must be "PR" or "AE"');
    }
    if (!manifest.host.minVersion || !/^\d+\.\d+$/.test(manifest.host.minVersion)) {
      errors.push('Manifest.host.minVersion must be like "25.0"');
    }
  }

  if (manifest.runtime) {
    if (typeof manifest.runtime.javascript !== "boolean") {
      errors.push('Manifest.runtime.javascript must be boolean');
    }
    if (typeof manifest.runtime.cef !== "boolean") {
      errors.push('Manifest.runtime.cef must be boolean');
    }
  }

  if (manifest.ui) {
    if (manifest.ui.type !== "panel") {
      errors.push('Manifest.ui.type must be "panel"');
    }
    if (typeof manifest.ui.width !== "number" || manifest.ui.width < 200) {
      errors.push('Manifest.ui.width must be >= 200');
    }
    if (typeof manifest.ui.height !== "number" || manifest.ui.height < 200) {
      errors.push('Manifest.ui.height must be >= 200');
    }
  }

  if (!Array.isArray(manifest.entrypoints) || manifest.entrypoints.length === 0) {
    errors.push("Manifest.entrypoints must be a non-empty array");
  }

  if (!Array.isArray(manifest.requiredPermissions)) {
    errors.push("Manifest.requiredPermissions must be an array");
  }

  return { valid: errors.length === 0, errors };
}

export { PLUGIN_MANIFEST_SCHEMA as default };
