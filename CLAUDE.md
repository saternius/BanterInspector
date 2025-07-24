# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Unity Scene Inspector for the Banter VR platform. It provides a web-based interface for real-time inspection and modification of Unity scenes through the BanterScript (BS) bridge.

## Architecture

### Core Modules
- `app.js` - Application initialization and BS library loading
- `scene-manager.js` - Unity scene state management and BS bridge communication
- `hierarchy-panel.js` - GameObject hierarchy tree rendering
- `properties-panel.js` - Component property editing interface
- `change-manager.js` - Undo/redo system and change tracking
- `inventory.js` - Persistent storage for reusable GameObjects and scripts
- `space-props-panel.js` - Public and protected space properties management
- `script-editor.js` - CodeMirror-based JavaScript editor for BanterScript files

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
4. **Asset URLs**: Production uses CDN URLs, development uses local paths


## Module Details

### Inventory System (`inventory.js`)
The inventory provides persistent storage using localStorage for:
- **Slots**: GameObject hierarchies exported from Unity scenes
- **Scripts**: JavaScript files for use with MonoBehavior components

Key features:
- Drag & drop GameObjects from hierarchy to save them
- Upload `.js` and `.json` files via file picker
- Export items as JSON for sharing/backup
- Script preview and editing integration
- Automatic duplicate name handling

### Space Properties Panel (`space-props-panel.js`)
Manages Banter space-level properties that persist across sessions:
- **Public Properties**: Accessible by all users in the space
- **Protected Properties**: Only modifiable by space admins
- Supports string, number, boolean, Vector3, and Color types
- Real-time synchronization across connected clients
- Inline editing with type validation

### Script Editor (`script-editor.js`)
Full-featured code editor using CodeMirror v5.65.13:
- JavaScript syntax highlighting with Monokai theme
- Keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+F to search)
- Live console output from running scripts
- Play/Stop controls for script execution
- Integration with MonoBehavior components
- Modified indicator for unsaved changes

### MonoBehavior Component (`components/monobehavior.js`)
BanterScript runtime component that:
- Loads scripts from inventory by filename
- Provides lifecycle methods: `onStart()`, `onUpdate()`, `onPause()`, `onResume()`, `onDestroy()`
- Supports custom variables (`vars`) with type definitions
- Variables persist in space properties with format `__[componentId]/[varName]:monobehavior`
- Script context includes references to `_slot`, `_scene`, `_BS`, and `_component`
- Hot-reload support via refresh functionality
