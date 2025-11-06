# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tippy is the Unity Scene Editor for the Banter VR platform. It provides a web-based interface for real-time inspection and modification of Unity scenes through the BanterScript (BS) bridge. The project is now organized into frontend and microservices components.

## Repository Structure

```
tippy/
├── frontend/          # Tippy web interface
│   ├── js/            # JavaScript modules
│   │   ├── pages/     # Page-specific modules organized by feature
│   │   │   ├── feedback/         # Feedback and statement blocks
│   │   │   ├── inventory/        # Inventory management
│   │   │   ├── script-editor/    # Script editing interface
│   │   │   └── world-inspector/  # Core Tippy panels
│   │   ├── entity-components/    # Component definitions
│   │   └── *.js       # Core modules and utilities
│   ├── styles.css     # Global stylesheet
│   └── index.html     # Main application entry
├── microservices/     # Backend services
│   ├── statement-block-service/  # AI text processing service
│   └── file_server/   # File serving utilities for hosting app
│   └── linker/        # Syncs in-game code to vscode
├── docs/              # Documentation and examples
│   ├── examples/      # Example scenes and scripts
│   └── site/          # Docusaurus documentation site
└── todo/              # Task specifications and planning docs
```

## Architecture

### Frontend Modules
The frontend code is organized hierarchically in the `frontend/` directory:

#### Core Modules (`frontend/js/`)
- `app.js` - Main application entry point and module loader
- `navigation.js` - Header navigation menu responsible for page transitions
- `scene-manager.js` - Unity scene state management and BS bridge communication
- `networking.js` - Manages state syncing commands between clients
- `change-types.js` - List of all the change actions that can be performed
- `change-manager.js` - Undo/redo system and change tracking
- `lifecycle-manager.js` - Manages component lifecycle events
- `entity.js` - Entity (GameObject) management
- `utils.js` - Shared utility functions

#### Page Modules (`frontend/js/pages/`)
Organized by feature area:

**World Inspector** (`world-inspector/`)
- `hierarchy-panel.js` - GameObject hierarchy tree rendering
- `properties-panel.js` - Component property editing interface
- `space-props-panel.js` - Public and protected space properties management
- `component-menu.js` - Component selection and addition menu
- `lifecycle-panel.js` - Lifecycle management UI
- `loading-screen.js` - Application loading progress display

**Inventory** (`inventory/`)
- `inventory.js` - Main inventory module coordinating all inventory functionality
- `inventory-ui.js` - UI rendering and interaction handling for inventory interface
- `inventory-file-handler.js` - File upload, export, and processing operations
- `inventory-firebase.js` - Firebase integration for cloud storage and synchronization

**Script Editor** (`script-editor/`)
- `script-editor.js` - CodeMirror-based JavaScript editor for BanterScript files

**Feedback** (`feedback/`)
- `feedback.js` - User feedback system with voice input support
- `statement-block-editor.js` - Statement block editing interface

### Microservices
Backend services are located in the `microservices/` directory:

- `statement-block-service/` - Flask service using Claude/Gemini API for text processing
  - Converts unstructured speech/text into organized statement blocks
  - General-purpose design for reuse across different contexts
- `file_server/` - File serving utilities for development
- `linker/` - Syncs in-game inventory and game-state data to a local file so that users can dev on their IDE of choice instead of the build in ScriptEditor

### Key Patterns
1. **Module Loading**: ES6 modules with dynamic imports based on environment (CDN for prod, local for dev)
2. **State Management**: Centralized through SceneManager with event-based updates
3. **UI Updates**: Direct DOM manipulation with event delegation
4. **Unity Bridge**: All Unity communication goes through the BS library via SceneManager


### Change Managment System
Tippy is meant to be a powerful tool for users to create complex VR experiences while inside VR. Due to the runtime development nature, having a reliable undo/redo mechanism is vital. To solve this all actions that can be performed should have be atomized with corresponsing sets of change classes.
There will eventually be agentic integration into Tippy, so as such every action that can be triggered via the UX has a corresponding Change class that can alternatively be triggered via a cli command. These are defined in the change-types classes.

When an action is generated that has effects that should be synced across clients, the change class would trigger a OneShot broadcast call that will send to all clients.
networking.js is responsible for broadcasting events, and recieving/routing incoming broadcasts.
To abstract this complexity, capitalized methods in components,entites,etc ex: .Set() are to be the intiative method ( the method that initiates the actions ), while _ methods ex: ._set() are to be executive method ( the method that actually performs the operation post sync )


### Component System
Components are defined in `frontend/js/entity-components/` with a common structure:
- Export a component definition object with `properties`, and optional `handlers`
- Properties define type, default values, and constraints
- Register in `frontend/js/entity-components/index.js`
- Organized into categories:
  - `behaviors/` - Interactive behaviors (grab handles, synced objects, etc.)
  - `materials/` - Material and physics material components
  - `media/` - Audio, video, and GLTF components
  - `meshes/` - 3D primitives and geometry components
  - `misc/` - Various utility components (portals, mirrors, browsers, etc.)
  - `physics/` - Colliders, rigidbodies, and joints


### Undo/Redo System

The ChangeManager tracks all modifications:
- Property changes
- Component additions/removals
- GameObject (entity) operations

## Critical Considerations

1. **BS Library Dependency**: Tippy requires the BanterScript library to be loaded before initialization
2. **Property Types**: Supports primitives, Vector3, Color, and asset references (Texture, Material, Audio)
3. **Asset URLs**: Production uses CDN URLs, development uses local paths


## Module Details

### Frontend Modules

#### Inventory System (`frontend/js/pages/inventory/`)
Modularized persistent storage for GameObjects and scripts:
- **`inventory.js`**: Main coordinator module
- **`inventory-ui.js`**: UI rendering and interaction handling
- **`inventory-file-handler.js`**: File upload/export operations
- **`inventory-firebase.js`**: Firebase cloud storage integration

Supports storing GameObject hierarchies and JavaScript files with drag & drop, file upload, and JSON export/import capabilities.

#### Space Properties Panel (`frontend/js/pages/world-inspector/space-props-panel.js`)
Manages Banter space-level properties that persist across sessions:
- **Public Properties**: Accessible by all users in the space
- **Protected Properties**: Only modifiable by space admins
- Supports string, number, boolean, Vector3, and Color types
- Real-time synchronization across connected clients
- Inline editing with type validation

#### Script Editor (`frontend/js/pages/script-editor/script-editor.js`)
Full-featured code editor using CodeMirror v5.65.13:
- JavaScript syntax highlighting with Monokai theme
- Keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+F to search)
- Live console output from running scripts
- Play/Stop controls for script execution
- Integration with ScriptRunner components
- Modified indicator for unsaved changes

#### ScriptRunner Component (`frontend/js/entity-components/scriptrunner.js`)
BanterScript runtime component that:
- Loads scripts from inventory by filename
- Provides lifecycle methods: `onStart()`, `onUpdate()`, `onDestroy()`
- Supports custom variables (`vars`) with type definitions
- Script context includes references to `_entity`, `_scene`, `_BS`, and `_component`
- Hot-reload support via refresh functionality

#### Feedback System (`frontend/js/pages/feedback/feedback.js`)
User feedback collection system with:
- Voice input using Azure Speech SDK
- Support for bug reports, feature requests, and improvements
- Firebase integration for ticket storage
- Ticket tracking and comment system
- Integration with statement block microservice at https://refine.tippy.dev

## Production Deployment

Tippy is deployed to production with the following infrastructure:

### Live Services
- **Main Application**: https://app.tippy.dev (File server and frontend hosting)
- **Authentication Service**: https://auth.tippy.dev (Firebase auth with custom claims)
- **Refine Service**: https://refine.tippy.dev (AI-powered text processing for statement blocks)

### Infrastructure
- **Hosting**: Google Cloud VM Instance (IP: 34.123.64.240)
- **Web Server**: Nginx with reverse proxy configuration
- **SSL/TLS**: Let's Encrypt certificates with auto-renewal
- **Process Management**: Systemd services for automatic startup and restart
- **Python Environment**: Virtual environment at `/home/jason/BanterInspector/microservices/venv/`

### Service Details
1. **File Server** (`tippy-fileserver.service`)
   - Serves the Tippy frontend application
   - Handles GLB file storage (up to 20MB)
   - Firebase integration for metadata
   - Proxies requests to other microservices

2. **Auth Server** (`tippy-auth.service`)
   - Node.js/Express application
   - Firebase Admin SDK integration
   - Custom user claims management
   - Stores user secrets in Firebase Realtime Database

3. **Statement Block Service** (`tippy-refine.service`)
   - Flask application with Gemini/Claude API integration
   - Processes unstructured text into organized statement blocks
   - Rate limiting enabled with in-memory Redis
   - CORS configured for cross-origin requests

### Development vs Production
- **Development**: Services run locally on ports 3303, 5000, 9909
- **Production**: All services accessed via HTTPS through Nginx reverse proxy
- **Asset URLs**: Production uses CDN URLs, development uses local paths
- **Environment Variables**: Production services run with NODE_ENV=production and FLASK_ENV=production