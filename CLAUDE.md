# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Unity Scene Inspector for the Banter VR platform. It provides a web-based interface for real-time inspection and modification of Unity scenes through the BanterScript (BS) bridge. The project is now organized into frontend and microservices components.

## Repository Structure

```
inspector/
├── frontend/          # Web-based inspector interface
│   ├── js/            # JavaScript modules
│   ├── styles.css     # Global stylesheet
│   ├── index.html     # Main application entry
│   └── tests/         # Frontend tests
├── microservices/     # Backend services
│   └── statement-blocks/  # Text processing service
└── todo/              # Task specifications and planning docs
```

## Architecture

### Frontend Modules
All frontend code is now located in the `frontend/` directory:

- `frontend/js/inspector.js` - Application initialization and BS library loading
- `frontend/js/navigation.js` - Header navigation menu responsible for page transitions
- `frontend/js/scene-manager.js` - Unity scene state management and BS bridge communication
- `frontend/js/networking.js` - Manages state syncing commands between clients
- `frontend/js/change-types.js` - List of all the change actions that can be performed
- `frontend/js/hierarchy-panel.js` - GameObject hierarchy tree rendering
- `frontend/js/properties-panel.js` - Component property editing interface
- `frontend/js/change-manager.js` - Undo/redo system and change tracking
- `frontend/js/inventory.js` - Persistent storage for reusable GameObjects and scripts
- `frontend/js/space-props-panel.js` - Public and protected space properties management
- `frontend/js/script-editor.js` - CodeMirror-based JavaScript editor for BanterScript files
- `frontend/js/feedback.js` - User feedback system with voice input support

### Microservices
Backend services are located in the `microservices/` directory:

- `microservices/statement-blocks/` - Flask service using Claude API for text processing
  - Converts unstructured speech/text into organized statement blocks
  - General-purpose design for reuse across different contexts

### Key Patterns
1. **Module Loading**: ES6 modules with dynamic imports based on environment (CDN for prod, local for dev)
2. **State Management**: Centralized through SceneManager with event-based updates
3. **UI Updates**: Direct DOM manipulation with event delegation
4. **Unity Bridge**: All Unity communication goes through the BS library via SceneManager


### Change Managment System
The application is meant to be a powerful tool for users to create complex VR experiences while inside VR. Due to the runtime development nature, having a reliable undo/redo mechanism is vital. To solve this all actions that can be performed should have be atomized with corresponsing sets of change classes.
There will eventually be agentic integration into the inspector, so as such every action that can be triggered via the UX has a corresponding Change class that can alternatively be triggered via a cli command. These are defined in the change-types classes.

When an action is generated that has effects that should be synced across clients, the change class would trigger a OneShot broadcast call that will send to all clients.
networking.js is responsible for broadcasting events, and recieving/routing incoming broadcasts.
To abstract this complexity, capitalized methods in components/slots/etc ex: .Set() are to be the intiative method ( the method that initiates the actions ), while _ methods ex: ._set() are to be executive method ( the method that actually performs the operation post sync )


### Component System
Components are defined in `frontend/js/components/` with a common structure:
- Export a component definition object with `properties`, and optional `handlers`
- Properties define type, default values, and constraints
- Register in `frontend/js/components/index.js`


### Undo/Redo System

The ChangeManager tracks all modifications:
- Property changes
- Component additions/removals
- GameObject (slot) operations

## Critical Considerations

1. **BS Library Dependency**: The inspector requires the BanterScript library to be loaded before initialization
2. **Property Types**: Supports primitives, Vector3, Color, and asset references (Texture, Material, Audio)
3. **Asset URLs**: Production uses CDN URLs, development uses local paths


## Module Details

### Frontend Modules

#### Inventory System (`frontend/js/inventory.js`)
The inventory provides persistent storage using localStorage for:
- **Slots**: GameObject hierarchies exported from Unity scenes
- **Scripts**: JavaScript files for use with MonoBehavior components

Key features:
- Drag & drop GameObjects from hierarchy to save them
- Upload `.js` and `.json` files via file picker
- Export items as JSON for sharing/backup
- Script preview and editing integration

#### Space Properties Panel (`frontend/js/space-props-panel.js`)
Manages Banter space-level properties that persist across sessions:
- **Public Properties**: Accessible by all users in the space
- **Protected Properties**: Only modifiable by space admins
- Supports string, number, boolean, Vector3, and Color types
- Real-time synchronization across connected clients
- Inline editing with type validation

#### Script Editor (`frontend/js/script-editor.js`)
Full-featured code editor using CodeMirror v5.65.13:
- JavaScript syntax highlighting with Monokai theme
- Keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+F to search)
- Live console output from running scripts
- Play/Stop controls for script execution
- Integration with MonoBehavior components
- Modified indicator for unsaved changes

#### MonoBehavior Component (`frontend/js/components/monobehavior.js`)
BanterScript runtime component that:
- Loads scripts from inventory by filename
- Provides lifecycle methods: `onStart()`, `onUpdate()`, `onDestroy()`
- Supports custom variables (`vars`) with type definitions
- Script context includes references to `_slot`, `_scene`, `_BS`, and `_component`
- Hot-reload support via refresh functionality

#### Feedback System (`frontend/js/feedback.js`)
User feedback collection system with:
- Voice input using Azure Speech SDK
- Support for bug reports, feature requests, and improvements
- Firebase integration for ticket storage
- Ticket tracking and comment system
- Future integration with statement block microservice

### Microservices

#### Statement Blocks Service (`microservices/statement-blocks/`)
Flask-based text processing service:
- Uses Claude Sonnet 3.5 API for natural language processing
- Converts stream-of-consciousness text into organized statements
- General-purpose API design for reuse across contexts
- Input: `{text: string, existing_blocks: string[]}`
- Output: `{blocks: string[], processing_time_ms: number}`
