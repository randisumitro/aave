# AAVE Plugin SDK Documentation

## Overview

The AAVE Plugin SDK enables third-party developers to build plugins that extend the
Autonomous AI Video Editor. Plugins run in isolated execution with permission-based
access to the host application.

## Creating a Plugin

```typescript
import { createPluginSDK, type AAVEPlugin, type PluginContext } from "@aave/plugin-sdk";

const sdk = createPluginSDK({
  pluginId: "com.example.my-plugin",
  pluginVersion: "1.0.0",
  permissions: ["read_project", "read_media"],
  timeoutMs: 30000,
  maxMemoryMb: 512,
});

const myPlugin: AAVEPlugin = {
  id: "com.example.my-plugin",
  version: "1.0.0",
  async initialize(context: PluginContext) {
    sdk.initialize(context);
    console.log("Plugin initialized");
  },
  async execute(input, context) {
    // Plugin logic here
    return { result: "success" };
  },
  async validate(input) {
    return { valid: true, errors: [] };
  },
};

export default myPlugin;
```

## Security

- Plugins run in isolated workers
- Permission allowlists are enforced
- No direct filesystem or network access without explicit permission
- Plugin packages must be signed

## API Reference

### PluginSDK

- `initialize(context)` - Set plugin context
- `executeCommand(commandName, params)` - Execute a registered command
- `sendToCompanion(message)` - Send message to local companion
- `validatePermissions(required)` - Check if plugin has required permissions
- `getCapabilities()` - List registered capabilities
- `registerCapability(capability)` - Register a new capability
