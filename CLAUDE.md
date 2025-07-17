# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Unity Scene Inspector for the Banter VR platform. It provides a web-based interface for real-time inspection and modification of Unity scenes through the BanterScript (BS) bridge.

## Development Commands

From the parent directory (`/Injection/`):
- `npm run serve` - Start webpack dev server with hot reload
- `npm run dist` - Build production bundle

The inspector is served as part of the larger Injection bundle. Access it at `http://localhost:8080/inspector/` during development.

## Architecture

### Core Modules
- `app.js` - Application initialization and BS library loading
- `scene-manager.js` - Unity scene state management and BS bridge communication
- `hierarchy-panel.js` - GameObject hierarchy tree rendering
- `properties-panel.js` - Component property editing interface
- `change-manager.js` - Undo/redo system and change tracking

### Key Patterns
1. **Module Loading**: ES6 modules with dynamic imports based on environment (CDN for prod, local for dev)
2. **State Management**: Centralized through SceneManager with event-based updates
3. **UI Updates**: Direct DOM manipulation with event delegation
4. **Unity Bridge**: All Unity communication goes through the BS library via SceneManager

### Component System
Components are defined in `js/components/` with a common structure:
- Export a component definition object with `displayName`, `properties`, and optional `handlers`
- Properties define type, default values, and constraints
- Register in `components/index.js`

### Undo/Redo System
The ChangeManager tracks all modifications:
- Property changes
- Component additions/removals
- GameObject (slot) operations
- Supports batching related changes

## Critical Considerations

1. **BS Library Dependency**: The inspector requires the BanterScript library to be loaded before initialization
2. **Mock Mode**: When Unity connection fails, the app falls back to mock data for development
3. **Property Types**: Supports primitives, Vector3, Color, and asset references (Texture, Material, Audio)
4. **Networking**: Some objects are "synced" - changes broadcast to all connected clients
5. **Asset URLs**: Production uses CDN URLs, development uses local paths

## Common Tasks

### Adding a New Component Type
1. Create component definition in `js/components/[component-name].js`
2. Register in `js/components/index.js`
3. Component will automatically appear in the Add Component menu

### Modifying Property Editors
Property rendering logic is in `properties-panel.js` - look for `createPropertyEditor()` and type-specific handlers.

### Debugging Unity Connection
Check console for BS library initialization and `scene.initialized` events. Mock mode is indicated by "Failed to initialize scene" message.