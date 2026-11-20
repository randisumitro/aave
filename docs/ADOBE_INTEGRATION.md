# AAVE Adobe Integration

Autonomous AI Video Editor - Adobe Premiere Pro & After Effects Integration

Copyright (c) 2026 Randi Sumitro. All rights reserved.
Author: Randi Sumitro (https://github.com/randisumitro)
License: MIT

## Overview

AAVE uses two independent Adobe UXP plugins - one for Premiere Pro and one for After Effects. The plugins communicate with a Local Companion service via WebSocket/IPC, which coordinates with the FastAPI backend.

**Critical:** Premiere Pro and After Effects use separate UXP runtimes. No shared DOM is assumed between them.

## Premiere Pro Plugin (`apps/premiere-plugin/`)

### UXP Manifest

**File:** `apps/premiere-plugin/manifest.json`

| Field | Value |
|-------|-------|
| id | `com.aave.premiere` |
| name | AAVE - Premiere Pro |
| version | 1.0.0 |
| host.app | PR |
| host.minVersion | 25.0 |
| ui.type | panel |
| ui.width | 380 |
| ui.height | 600 |
| permissions.localFileSystem | all |
| permissions.network | all |

### Implemented Capabilities

| Capability | Method | Status |
|------------|--------|--------|
| Active project detection | `premierePro.Project.getActiveProject()` | Implemented |
| Active sequence detection | `project.getActiveSequence()` | Implemented |
| Media import | `project.importMedia(filePath)` | Implemented |
| Timeline inspection | `project.getRootItem().getChildren()` | Implemented |
| Clip arrangement | `track.insertClip(clip, time)` | Implemented |
| Track management | `sequence.getTracks()` | Implemented |
| Smart cutting | CommandRegistry + EDL validation | Implemented |
| Track management | `sequence.getTrackAt(index)` | Implemented |
| Marker creation | `sequence.createMarker()` | Implemented |
| Subtitle placement | Timeline command via CommandRegistry | Implemented |
| Audio placement | `clip.setVolume(volume)` | Implemented |
| Effect application | `clip.applyEffect(effectName)` | Implemented |
| Export management | `sequence.export(outputPath, settings)` | Implemented |

### PremiereAdapter API

| Method | Description |
|--------|-------------|
| `connect()` | Connect to Premiere Pro UXP API |
| `getActiveProject()` | Get active project |
| `getActiveSequence()` | Get active sequence |
| `getProjectItems()` | Get project items |
| `importMedia(filePath)` | Import media file |
| `createSequence(settings)` | Create new sequence |
| `getTracks(sequence)` | Get sequence tracks |
| `insertClip(sequence, clip, trackIndex, time)` | Insert clip into track |
| `createMarker(sequence, time, comment, duration, color)` | Create timeline marker |
| `applyEffect(clip, effectName)` | Apply effect to clip |
| `setClipVolume(clip, volume)` | Set clip volume |
| `getExportSettings()` | Get default export settings |
| `exportSequence(sequence, outputPath, settings)` | Export sequence |

## After Effects Plugin (`apps/after-effects-plugin/`)

### UXP Manifest

**File:** `apps/after-effects-plugin/manifest.json`

| Field | Value |
|-------|-------|
| id | `com.aave.aftereffects` |
| name | AAVE - After Effects |
| version | 1.0.0 |
| host.app | AE |
| host.minVersion | 25.0 |
| ui.type | panel |
| ui.width | 380 |
| ui.height | 600 |
| permissions.localFileSystem | all |
| permissions.network | all |

### Implemented Capabilities

| Capability | Method | Status |
|------------|--------|--------|
| Project inspection | `app.project` | Implemented |
| Composition creation | `project.items.addComp()` | Implemented |
| Text animation | `composition.layers.addText()` | Implemented |
| Kinetic typography | CommandRegistry builder | Implemented |
| Shape animation | `composition.layers.addShape()` | Implemented |
| Keyframe generation | `property.setValueAtTime()` | Implemented |
| Motion graphics | CommandRegistry builders | Implemented |
| Lower thirds | CommandRegistry builder | Implemented |
| Animated captions | CommandRegistry builder | Implemented |
| Visual effects | CommandRegistry + AE DOM | Implemented |
| Alpha-channel export | `composition.export()` with alpha | Implemented |

### AfterEffectsAdapter API

| Method | Description |
|--------|-------------|
| `connect()` | Connect to After Effects UXP API |
| `getProject()` | Get project object |
| `createComposition(settings)` | Create new composition |
| `createTextLayer(composition, text, settings)` | Create text layer |
| `createShapeLayer(composition, settings)` | Create shape layer |
| `setKeyframe(layer, propertyPath, time, value, easing)` | Set keyframe |
| `applyEasing(property, keyframeIndex, easingType)` | Apply easing |
| `createUndoGroup(name, fn)` | Create undo group |
| `exportAlpha(composition, outputPath, settings)` | Export with alpha channel |
| `renderComposition(composition, outputPath, settings)` | Render composition |
| `getCompositions()` | Get all compositions |

## Local Companion Service

### Connection Details

- **URL:** `ws://127.0.0.1:8077/ws/{client_id}`
- **Binding:** Localhost only (127.0.0.1)
- **Authentication:** Token-based via `AAVE_COMPANION_TOKEN` env variable
- **WebSocket auth:** Token passed as query parameter `?token=`

### CompanionClient API

| Method | Description |
|--------|-------------|
| `connect()` | Connect to companion WebSocket |
| `send(message)` | Send raw message |
| `request(message, timeout)` | Send request and wait for response |
| `on(type, handler)` | Subscribe to message type |
| `off(type)` | Unsubscribe from message type |
| `disconnect()` | Disconnect from companion |

## Backend HTTP Client

### BackendClient API

| Method | Description |
|--------|-------------|
| `checkHealth()` | Check backend health |
| `createJob(project, creativeDirection, source)` | Create editing job |
| `getJob(jobId)` | Get job status |
| `cancelJob(jobId)` | Cancel job |
| `listModels()` | List registered models |
| `routeModel(taskType, preferredProvider)` | Route task to model |
| `getSystemStatus()` | Get system status |

## CEP Fallback Requirements

If a necessary capability is unavailable in the target UXP environment, the following CEP (Common Extensibility Platform) fallback is required:

| Capability | UXP Status | CEP Fallback |
|------------|------------|--------------|
| Deep timeline manipulation | Partial | CEP ExtendScript API |
| Advanced effect controls | Partial | CEP ExtendScript API |
| Precise marker placement | Partial | CEP ExtendScript API |
| Batch export with presets | Partial | CEP ExtendScript API |
| Project panel integration | Partial | CEP ExtendScript API |

**CEP Extension:** A companion CEP extension may be required for features not available in UXP. The CEP extension would communicate with the UXP plugin via local IPC or shared files.

## Mocked vs Real Integration

**⚠️ IMPORTANT:** Adobe Premiere Pro and After Effects are NOT installed in this development environment. All Adobe integration is **mocked**.

| Test Type | Status | Notes |
|-----------|--------|-------|
| PremiereAdapter tests | MOCKED | Uses mocked `premierepro` API |
| AfterEffectsAdapter tests | MOCKED | Uses mocked `aftereffects` API |
| CommandRegistry tests | REAL | Tests validation logic only |
| Plugin typecheck | REAL | TypeScript compilation |
| Real Adobe integration | PENDING | Requires actual Adobe installation |

**Real Adobe integration must be validated by:**
1. Installing Adobe Premiere Pro 25.0+
2. Installing Adobe After Effects 25.0+
3. Loading plugins via Adobe UXP Developer Tool
4. Verifying connection status indicators
5. Testing end-to-end editing workflow

## Security

- All plugin commands validated before execution via CommandRegistry
- No command executes without validation
- Edit Decision List (EDL) validated before timeline operations
- Source footage and original projects preserved
- Local Companion binds to 127.0.0.1 only (not publicly exposed)

## Attribution

**Created by:** Randi Sumitro  
**GitHub:** https://github.com/randisumitro  
**Email:** 136390141+randisumitro@users.noreply.github.com  
**License:** MIT (Copyright 2026 Randi Sumitro)
