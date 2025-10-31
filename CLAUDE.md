# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Unity Scene Inspector for the Banter VR platform. It provides a web-based interface for real-time inspection and modification of Unity scenes through the BanterScript (BS) bridge. The project is now organized into frontend and microservices components.

## Repository Structure

```
inspector/
├── frontend/          # Web-based inspector interface
│   ├── js/            # JavaScript modules
│   │   ├── pages/     # Page-specific modules organized by feature
│   │   │   ├── feedback/         # Feedback and statement blocks
│   │   │   ├── inventory/        # Inventory management
│   │   │   ├── script-editor/    # Script editing interface
│   │   │   └── world-inspector/  # Core inspector panels
│   │   ├── entity-components/    # Component definitions
│   │   └── *.js       # Core modules and utilities
│   ├── styles.css     # Global stylesheet
│   └── index.html     # Main application entry
├── microservices/     # Backend services
│   ├── statement-block-service/  # AI text processing service
│   └── file_server/   # File serving utilities for hosting app
├── prompts/           # Prompts and builder tools
│   └── builder/
│       └── extensions/    # Extensions and plugins
│           └── code_linker/   # Syncs in-game code to vscode
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

### Extensions
Extensions and plugins are located in the `prompts/builder/extensions/` directory:

- `code_linker/` - Syncs in-game inventory and game-state data to a local file so that users can dev on their IDE of choice instead of the built-in ScriptEditor

### Key Patterns
1. **Module Loading**: ES6 modules with dynamic imports based on environment (CDN for prod, local for dev)
2. **State Management**: Centralized through SceneManager with Firebase Realtime Database for persistence
3. **UI Updates**: Direct DOM manipulation with event delegation
4. **Unity Bridge**: All Unity communication goes through the BS library via SceneManager
5. **Firebase Integration**: Real-time synchronization and persistence through Firebase services

### Firebase Architecture
The project has migrated from Banter's built-in spaceState and OneShot networking to Firebase services:

#### Firebase Realtime Database Structure
State is stored under `/space/{spaceId}` with the following structure:
- `/vars` - Space variables (public and protected properties)
- `/People` - User entities in the space
- `/components` - Component data and properties
- `/scripts` - Stored JavaScript scripts

#### Key Services
- **Firebase Realtime Database**: Handles all state synchronization between clients
- **Firebase Storage**: Used for file uploads (inventory items, assets, GLB files)
- **Firebase Auth**: Optional authentication for inventory persistence

### Change Management System
The application is meant to be a powerful tool for users to create complex VR experiences while inside VR. Due to the runtime development nature, having a reliable undo/redo mechanism is vital. To solve this all actions that can be performed should have be atomized with corresponding sets of change classes.

There will eventually be agentic integration into the inspector, so as such every action that can be triggered via the UX has a corresponding Change class that can alternatively be triggered via a cli command. These are defined in the change-types classes.

When an action is generated that has effects that should be synced across clients, the change class creates or updates Firebase database references which automatically sync to all connected clients.
networking.js manages the Firebase connections and provides helper methods for database operations.
To abstract this complexity, capitalized methods in components, entities, etc ex: .Set() are to be the initiative method (the method that initiates the actions), while _ methods ex: ._set() are to be executive method (the method that actually performs the operation post sync)


### Component System
Components are defined in `frontend/js/entity-components/` with a common structure:
- Export a component definition object with `properties`, and optional `handlers`
- Properties define type, default values, and constraints
- Register in `frontend/js/entity-components/index.js`
- Each component automatically creates a Firebase reference at `/space/{spaceId}/components/{componentId}`
- Component updates are synchronized through Firebase listeners
- Organized into categories:
  - `behaviors/` - Interactive behaviors (grab handles, synced objects, etc.)
  - `materials/` - Material and physics material components
  - `media/` - Audio, video, and GLTF components
  - `meshes/` - 3D primitives and geometry components
  - `misc/` - Various utility components (portals, mirrors, browsers, etc.)
  - `physics/` - Colliders, rigidbodies, and joints

### Entity System
Entities (GameObjects) are managed through `frontend/js/entity.js`:
- Each entity creates a Firebase reference at `/space/{spaceId}/{entityId}`
- Entity hierarchy is maintained through Firebase parent-child relationships
- Real-time updates propagate through Firebase listeners
- Special entities like "Scene" and "People" have reserved paths in Firebase


### Undo/Redo System

The ChangeManager tracks all modifications:
- Property changes
- Component additions/removals
- GameObject (entity) operations

## Critical Considerations

1. **BS Library Dependency**: The inspector requires the BanterScript library to be loaded before initialization
2. **Firebase Services**: The application requires Firebase Realtime Database and Storage for state synchronization
3. **Property Types**: Supports primitives, Vector3, Color, and asset references (Texture, Material, Audio)
4. **Asset URLs**: Production uses CDN URLs, development uses local paths
5. **Migration Notes**: The project has migrated from Banter's native spaceState and OneShot networking to Firebase. Some legacy OneShot code remains for backward compatibility but is mostly commented out
6. **Space Identification**: Each space is identified by extracting the subdomain from `window.location.host` (e.g., `spaceId` from `spaceId.banter.fun`)


## Module Details

### Frontend Modules

#### Networking Module (`frontend/js/networking.js`)
Central hub for Firebase integration and state synchronization:
- **Firebase Initialization**: Manages Firebase app configuration and service connections
- **Database Operations**: Helper methods for CRUD operations on Firebase Realtime Database
- **State Management**: Maintains space state with `/vars`, `/components`, `/scripts`, `/People`
- **Host Management**: Tracks and manages the space host for admin operations
- **Legacy Support**: Contains commented-out OneShot code from the previous networking implementation
- **Key Methods**:
  - `initFirebase()` - Initializes Firebase services and sets up initial space state
  - `getVar()/setVar()` - Get/set space variables in Firebase
  - `setScript()` - Store scripts in Firebase
  - `getDatabase()/getStorage()` - Access Firebase services
  - `routeOneShot()` - Legacy routing function (partially active for backward compatibility)

#### Inventory System (`frontend/js/pages/inventory/`)
Modularized persistent storage for GameObjects and scripts:
- **`inventory.js`**: Main coordinator module
- **`inventory-ui.js`**: UI rendering and interaction handling
- **`inventory-file-handler.js`**: File upload/export operations
- **`inventory-firebase.js`**: Firebase cloud storage integration

Supports storing GameObject hierarchies and JavaScript files with drag & drop, file upload, and JSON export/import capabilities.

#### Space Properties Panel (`frontend/js/pages/world-inspector/space-props-panel.js`)
Manages space-level properties that persist across sessions via Firebase:
- **Public Properties**: Accessible by all users in the space (stored in Firebase `/space/{spaceId}/vars`)
- **Protected Properties**: Only modifiable by space admins
- Supports string, number, boolean, Vector3, and Color types
- Real-time synchronization through Firebase listeners
- Inline editing with type validation
- Properties are accessed via `net.getVar()` and `net.setVar()`

#### Script Editor (`frontend/js/pages/script-editor/script-editor.js`)
Full-featured code editor using CodeMirror v5.65.13:
- JavaScript syntax highlighting with Monokai theme
- Keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+F to search)
- Live console output from running scripts
- Play/Stop controls for script execution
- Integration with MonoBehavior components
- Modified indicator for unsaved changes

#### MonoBehavior Component (`frontend/js/entity-components/monobehavior.js`)
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
- Future integration with statement block microservice