# Adobe Integration Validation Guide

## ⚠️ Important: Adobe Software Not Available

Adobe Premiere Pro and After Effects are **not installed** on this development machine.
All UXP plugins are built following documented Adobe UXP patterns but require
installation on a machine with Adobe software for end-to-end validation.

## Validation Steps (when Adobe software is available)

### 1. Install UXP Developer Tool

Download and install the Adobe UXP Developer Tool from the Adobe Developer Portal.

### 2. Load Premiere Pro Plugin

```bash
# Navigate to the premiere-plugin directory
cd apps/premiere-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Load in UXP Developer Tool
# Point UXP Dev Tool to the plugin folder
# Launch Premiere Pro and open the AAVE panel from Window > Extensions
```

### 3. Load After Effects Plugin

```bash
# Navigate to the after-effects-plugin directory
cd apps/after-effects-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Load in UXP Developer Tool
# Launch After Effects and open the AAVE panel
```

### 4. Test Local Companion Service

```bash
# Start the companion service
cd apps/local-companion
pip install -e .
python main.py

# Verify WebSocket endpoint
# ws://localhost:8077/ws/test-client
```

### 5. Test Backend API

```bash
# Start the backend
cd backend
pip install -e .
python main.py

# Verify health endpoint
curl http://localhost:8000/health
```

### 6. End-to-End Test

1. Import video footage into Premiere Pro
2. Open AAVE panel in Premiere Pro
3. Click "Start Autonomous Editing"
4. Verify timeline is populated with clips
5. Open AAVE panel in After Effects
6. Verify motion graphics are generated
7. Verify final render output

## Known Limitations

1. After Effects UXP support is more limited than Premiere Pro
2. Some After Effects features may require CEP (Common Extensibility Platform) instead of UXP
3. UXP API methods vary by Premiere Pro/After Effects version
4. Alpha channel export support depends on After Effects version
