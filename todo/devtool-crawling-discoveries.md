# Banter Inspector Runtime Exploration Guide

A practical guide for exploring and debugging the Banter Inspector runtime environment using Chrome DevTools.

**Last Updated**: 2025-10-10

---

## Table of Contents

1. [Quick Access Reference](#quick-access-reference)
2. [Inspection Code Snippets](#inspection-code-snippets)
3. [Runtime Architecture](#runtime-architecture)
4. [Data Structures](#data-structures)
5. [Patterns & Conventions](#patterns--conventions)
6. [Console Logging System](#console-logging-system)
7. [Investigation Techniques](#investigation-techniques)
8. [Known Gaps & Questions](#known-gaps--questions)

---

## Quick Access Reference

### Global Objects

All accessible from the browser console (F12):

```javascript
// Core Scene Management
scene                    // Main scene instance with entities/components
scene.objects           // Object containing all entities (use this, NOT BS.BanterScene.entities)
scene.components        // Map of all components
scene.users             // Connected users
scene.spaceState        // Public/protected space properties
scene.localUser         // Current user

// Systems
changeManager           // Undo/redo system with stacks
ChangeTypes             // All Change class types with metadata and helpers
ComponentRegistry       // All Component classes with metadata and helpers
LifecycleAPI            // MonoBehavior script tracking and inspection
inventory               // Asset management (scripts, prefabs)
networking              // Multi-user sync via Firebase
propertiesPanel         // Properties UI controller
lifecyclePanel          // Script lifecycle tracking

// BS Library
BS                      // BanterScript library (56 component classes, 118 methods)
BS.BanterScene          // Scene class (use 'scene' global instead)

// Command Functions
SetEntityProp()         // Set entity property
AddEntity()             // Add new entity
RemoveEntity()          // Remove entity
MoveEntity()            // Move entity in hierarchy
CloneEntity()           // Clone entity
SaveEntityItem()        // Save to inventory

// Firebase (if initialized)
firebase                // Firebase SDK

// Logging
logger                  // Logger instance with tag filter configuration
log(tag, ...args)       // Tagged logging function
err(tag, ...args)       // Tagged error logging function
```

### Module Exposure

**Exposed as globals:**
- ✅ `changeManager`
- ✅ `ChangeTypes` (NEW - all change classes with metadata)
- ✅ `ComponentRegistry` (NEW - all component classes with metadata)
- ✅ `LifecycleAPI` (NEW - MonoBehavior script tracking and inspection)
- ✅ `propertiesPanel`
- ✅ `inventory`
- ✅ `networking`
- ✅ `scene`
- ✅ `lifecyclePanel`
- ✅ `lifecycle` (LifecycleManager instance, for debugging)

**NOT exposed (encapsulated in module scope):**
- ❌ `sceneManager`
- ❌ `hierarchyPanel`

---

## Inspection Code Snippets

Copy-paste these into Chrome DevTools console to inspect runtime state.

### Entity Inspection

```javascript
// Get all entity IDs
Object.keys(scene.objects)

// Count entities
Object.keys(scene.objects).length

// Get entity by path
scene.FindByPath("Scene/MyEntity")

// List all entity names and paths
Object.keys(scene.objects).map(id => ({
  id,
  name: scene.objects[id].name,
  path: scene.objects[id].path,
  active: scene.objects[id].active
}))

// Get root entities (no parent)
Object.keys(scene.objects).filter(id => {
  return !scene.objects[id].parent
}).map(id => scene.objects[id].name)

// Get entity details
const entity = scene.objects[Object.keys(scene.objects)[0]];
console.log({
  id: entity.id,
  name: entity.name,
  path: entity.path,
  active: entity.active,
  layer: entity.layer,
  componentCount: Object.keys(entity.components || {}).length,
  childCount: entity.children?.length || 0
})

// Find entities by name
Object.values(scene.objects).filter(e => e.name.includes("searchTerm"))
```

### Component Inspection

```javascript
// List all BS component classes
Object.keys(BS).filter(k => k.startsWith('Banter'))

// Count BS components
Object.keys(BS).filter(k => k.startsWith('Banter')).length

// Get component details for an entity
const entity = scene.objects["<entityId>"];
Object.keys(entity.components).map(compId => {
  const comp = entity.components[compId];
  return {
    id: compId,
    type: comp.type,
    componentType: comp.componentType
  };
})

// Inspect component properties (stored with _ prefix)
const comp = scene.objects["<entityId>"].components["<compId>"];
Object.keys(comp).filter(k => k.startsWith('_'))

// Get all entities with specific component type
Object.values(scene.objects).filter(e =>
  Object.values(e.components || {}).some(c => c.type === 'BanterRigidbody')
)

// Sample component class structure
const sampleClass = BS.BanterBox;
console.log({
  static: Object.getOwnPropertyNames(sampleClass),
  prototype: Object.getOwnPropertyNames(sampleClass.prototype)
})
```

### Component Registry System

```javascript
// List all available components
ComponentRegistry.list()

// Get statistics about components
ComponentRegistry.getStats()
// Returns: { total: 38, byCategory: { core: 3, meshes: 11, ... }, layers: 24 }

// Get all categories
ComponentRegistry.getCategories()
// Returns: ['core', 'meshes', 'materials', 'physics', 'media', 'behaviors', 'misc', 'scripting']

// Get components by category
ComponentRegistry.getByCategory('meshes')
// Returns: ['BanterGeometryComponent', 'BanterBoxComponent', 'BanterSphereComponent', ...]

// Get component info
ComponentRegistry.getInfo('BanterBoxComponent')
// Returns: { category: 'meshes', description: 'Box/cube primitive', icon: '◼️' }

// Get component class by name
const BoxComponent = ComponentRegistry.getByName('BanterBox')

// Check if component is supported
ComponentRegistry.isSupported('BanterBox')  // true
ComponentRegistry.isSupported(BS.ComponentType.BanterBox)  // true

// Layer utilities
ComponentRegistry.getLayerName(5)  // 'UI'
ComponentRegistry.getLayerNumber('UI')  // 5
ComponentRegistry.layers  // Full layer definitions

// Check bundled components
ComponentRegistry.getBundledComponents('BanterGeometry')
// Returns: ['BanterMaterial'] (auto-includes material)
```

### Lifecycle & Script Tracking

```javascript
// List all running scripts
LifecycleAPI.list()

// Get all scripts with metadata
LifecycleAPI.getAllScripts()
// Returns: Array of { id, scriptFile, entity, running, initialized, owner, vars, instance }

// Get statistics
LifecycleAPI.getStats()
// Returns: { total: 3, running: 3, fps: 30, isRunning: true, byFile: {...}, byOwner: {...}, files: [...], owners: [...] }

// Find scripts by entity name
LifecycleAPI.getByEntity("Penny")
// Returns: Array of MonoBehavior instances on that entity

// Find scripts by file name
LifecycleAPI.getByFile("Grabbable.js")
// Returns: Array of MonoBehavior instances using that script

// Get running scripts only
LifecycleAPI.getRunning()

// Get scripts by owner
LifecycleAPI.getByOwner("Technocrat")

// Get detailed info about a specific script
LifecycleAPI.getInfo("MonoBehavior_85004")
// Returns: { id, scriptFile, entity, running, vars, lifecycleMethods, customMethods, inventoryItem }

// Get lifecycle methods for a script
LifecycleAPI.getLifecycleMethods("MonoBehavior_85004")
// Returns: { onStart: true, onUpdate: true, onDestroy: true, onLoaded: false, ... }

// Get custom methods (non-lifecycle)
LifecycleAPI.getCustomMethods("MonoBehavior_85004")
// Returns: ['flip', 'customMethod', ...] - array of custom method names

// Call a custom method on a script
LifecycleAPI.callMethod("MonoBehavior_86282", "flip")
// Calls the flip() method on the Flipable.js script

// Control lifecycle manager
LifecycleAPI.setFPS(60)  // Set update FPS
LifecycleAPI.stop()      // Stop all onUpdate calls
LifecycleAPI.start()     // Resume lifecycle

// Access lifecycle manager directly
LifecycleAPI.manager
lifecycle  // Same instance
```

### Inventory Inspection

```javascript
// List all inventory items
Object.keys(inventory.items)

// Count inventory items
Object.keys(inventory.items).length

// Get item details
inventory.items["itemName"]

// List folders
Object.keys(inventory.folders || {})

// Filter by item type
Object.values(inventory.items).filter(item => item.itemType === 'script')

// Get scripts with metadata
Object.values(inventory.items)
  .filter(item => item.itemType === 'script')
  .map(item => ({
    name: item.name,
    author: item.author,
    folder: item.folder,
    startup: item.startup,
    imported: item.imported
  }))

// Check current folder
inventory.currentFolder
```

### Change Manager / Undo-Redo

```javascript
// Check undo stack
changeManager.undoStack.length
changeManager.undoStack

// Check redo stack
changeManager.redoStack.length
changeManager.redoStack

// Is processing a change?
changeManager.isProcessing
changeManager.isApplying

// Max undo stack size
changeManager.maxSize
```

### Change Types System

```javascript
// List all available change types
ChangeTypes.list()

// Get statistics about change types
ChangeTypes.getStats()
// Returns: { total: 24, byCategory: {...}, undoable: 13, withCommands: 19 }

// Get all categories
ChangeTypes.getCategories()
// Returns: ['base', 'entity', 'component', 'space', 'script', 'inventory']

// Get change types by category
ChangeTypes.getByCategory('entity')
// Returns: ['EntityPropertyChange', 'EntityAddChange', 'EntityRemoveChange', 'EntityMoveChange', 'CloneEntityChange']

// Get info about specific change type
ChangeTypes.getInfo('EntityPropertyChange')
// Returns: { category: 'entity', description: '...', parameters: [...], undoable: true, command: 'set_entity_property' }

// Get all undoable change types
ChangeTypes.getUndoable()

// Get map of shell commands to change types
ChangeTypes.getCommands()
// Returns: { 'add_entity': 'EntityAddChange', ... }

// Access change class directly
const EntityPropChange = ChangeTypes.classes.EntityPropertyChange

// Create a change instance programmatically
const change = new ChangeTypes.classes.EntityPropertyChange(
  'Scene/MyEntity',
  'name',
  'NewName',
  { source: 'script' }
)
await change.apply()
```

### Space Properties

```javascript
// Get all public properties
Object.keys(scene.spaceState.public)
scene.spaceState.public

// Get all protected properties
Object.keys(scene.spaceState.protected)
scene.spaceState.protected

// Get specific property
scene.spaceState.public["propertyName"]

// Count properties
Object.keys(scene.spaceState.public).length
Object.keys(scene.spaceState.protected).length
```

### Networking & Users

```javascript
// Check connection status
networking.connected

// Firebase status
firebase.apps.length > 0
typeof networking.db

// Current user
scene.localUser

// Connected users
scene.users
```

### Scene Methods

```javascript
// List all scene methods
Object.getOwnPropertyNames(Object.getPrototypeOf(scene))

// Find entities
scene.Find(name)
scene.FindByPath(path)

// Query components
scene.QueryComponents(componentType)

// Check if Unity loaded
scene.unityLoaded

// Get Unity platform
scene.GetPlatform()
```

### Logging Control

```javascript
// View current log filter settings
window.logger.include

// Quick configs for common debugging scenarios

// Errors only (quiet mode)
window.logger.include = { error: true }

// Debug initialization
window.logger.include = { error: true, init: true, scene: true, loadEntity: true }

// Debug networking
window.logger.include = { error: true, net: true }

// Debug scripts
window.logger.include = { error: true, lifecycle: true, monobehavior: true, script: true }

// Debug inventory
window.logger.include = { error: true, inventory: true, net: true }

// Enable specific tag
window.logger.include.net = true

// Disable specific tag
window.logger.include.init = false

// Disable all logging
window.logger.active = false

// Re-enable logging
window.logger.active = true
```

### Diagnostics

```javascript
// Full runtime snapshot
{
  entities: Object.keys(scene.objects).length,
  components: scene.components?.size || 'N/A',
  users: Object.keys(scene.users || {}).length,
  inventoryItems: Object.keys(inventory.items).length,
  inventoryFolders: Object.keys(inventory.folders || {}).length,
  publicProps: Object.keys(scene.spaceState?.public || {}).length,
  protectedProps: Object.keys(scene.spaceState?.protected || {}).length,
  undoStack: changeManager.undoStack.length,
  redoStack: changeManager.redoStack.length,
  bsComponentClasses: Object.keys(BS).filter(k => k.startsWith('Banter')).length,
  bsMethods: Object.keys(BS).length,
  unityLoaded: scene.unityLoaded,
  networkingConnected: networking?.connected || false
}

// List loaded scripts from network
Array.from(document.scripts).map(s => s.src).filter(s => s.includes('.js'))

// Check for errors
console.log('Check console for errors above')
```

---

## Runtime Architecture

### Core Systems

#### 1. Scene Management (`scene` global)

The main scene instance manages all entities, components, and scene state.

**Key Properties:**
- `objects` - Object (NOT Map) containing all entities by ID
- `components` - Map of all component instances
- `users` - Connected users object
- `spaceState` - Public/protected properties
  - `spaceState.public` - Shared properties accessible to all
  - `spaceState.protected` - Admin-only properties
- `localUser` - Current user object
- `unityLoaded` - Boolean indicating Unity connection

**Key Methods:**
```javascript
// Entity operations
AddObject(), RemoveObject(), Instantiate()
Find(name), FindByPath(path)
SetActive(), SetName(), SetTag(), SetLayer()
SetParent(), Serialise(), Deserialise()

// Component operations
AddComponent(), RemoveComponent()
SetComponent(), SetComponents()
QueryComponents(type)

// Transform
SetTransform(), WatchTransform()

// Communication
OneShot(), Send(), Emit(), CallMethod()

// Space properties
SetPublicSpaceProps(), SetProtectedSpaceProps()
SetUserProps(), SetProp()

// Player control
TeleportTo(), AddPlayerForce()
SetCanMove(), SetCanRotate(), SetCanCrouch(), etc.
SendHapticImpulse()

// Special features
AiImage(), AiModel()
StartTTS(), StopTTS()
YtInfo(), Base64ToCDN()
Raycast()
```

#### 2. BS (BanterScript) Library

Unity bridge library with component classes and helper methods.

**Component Classes (56 total):**
- Primitives: BanterBox, BanterSphere, BanterCylinder, BanterPlane, etc.
- Advanced Geometry: BanterMobius, BanterKlein, BanterTorus, etc.
- Media: BanterAudioSource, BanterVideoPlayer, BanterGLTF, BanterTexture
- Physics: BanterRigidbody, BanterPhysicMaterial
- Materials: BanterMaterial
- Behaviors: BanterGrabHandle, BanterSyncedObject, BanterColliderEvents, etc.
- Special: BanterMonoBehaviour, BanterAssetBundle, BanterMirror, BanterPortal, etc.

**Important Note:**
- Use `scene.objects` to access entities, NOT `BS.BanterScene.entities` (legacy/unused)

#### 3. Change Manager (`changeManager` global)

Undo/redo system for tracking modifications.

**Structure:**
```javascript
{
  changeListeners: [],
  isProcessing: boolean,
  undoStack: [],          // Array of reversible changes
  redoStack: [],          // Array of undone changes
  maxSize: number,
  isApplying: boolean
}
```

**Notes:**
- Stacks populate as changes are made during session
- All change types are exposed via `ChangeTypes` global

#### 3a. Change Types System (`ChangeTypes` global)

Comprehensive registry of all change classes with metadata and helper methods.

**Structure:**
```javascript
{
  // All change class constructors
  classes: {
    Change,                    // Base class
    EntityPropertyChange,      // Entity modifications
    ComponentPropertyChange,   // Component modifications
    SpacePropertyChange,       // Space property changes
    // ... 20+ more change types
  },

  // Metadata for each change type
  metadata: {
    EntityPropertyChange: {
      category: 'entity',
      description: 'Change a property of an entity',
      parameters: ['entityId', 'property', 'newValue', 'options'],
      undoable: true,
      command: 'set_entity_property'
    },
    // ... metadata for all types
  }
}
```

**Helper Methods:**
- `getInfo(typeName)` - Get metadata about a specific change type
- `getByCategory(category)` - Get all change types in a category
- `getCategories()` - Get all available categories
- `getUndoable()` - Get all undoable change types
- `getCommands()` - Get map of shell commands to change types
- `list()` - List all change types with basic info
- `getStats()` - Get statistics about change types

**Categories:**
- `base` - Base Change class
- `entity` - Entity operations (add, remove, move, property changes)
- `component` - Component operations (add, remove, reorder, property changes)
- `space` - Space property changes
- `script` - MonoBehavior variable changes
- `inventory` - Inventory operations (load, save, delete, folder management)

#### 3b. Component Registry System (`ComponentRegistry` global)

Comprehensive registry of all component classes with metadata and helper methods.

**Structure:**
```javascript
{
  // All component class constructors (38 total)
  classes: {
    Entity, EntityComponent,
    TransformComponent,
    MonoBehaviorComponent,
    // Meshes (11): BanterBox, BanterSphere, BanterCylinder, etc.
    // Materials (2): BanterMaterial, BanterPhysicMaterial
    // Physics (6): BanterRigidbody, colliders, joints
    // Media (3): BanterAudioSource, BanterVideoPlayer, BanterGLTF
    // Behaviors (5): BanterGrabHandle, BanterSyncedObject, etc.
    // Misc (8): BanterMirror, BanterPortal, BanterBrowser, etc.
  },

  // Rich metadata for each component
  metadata: {
    BanterBoxComponent: {
      category: 'meshes',
      description: 'Box/cube primitive',
      icon: '◼️'
    },
    // ... metadata for all components
  },

  // Unity layer definitions (24 layers)
  layers: {
    Default: 0, UI: 5, Grabbable: 20, NetworkPlayer: 17, ...
  },

  // Component type mappings
  typeMap: {},      // String name → Component class
  bsTypeMap: {},    // BS.ComponentType → Component class
  textMap: {},      // BS.ComponentType → String name
  bundleMap: {},    // Component → Auto-included components
  supportedComponents: Set  // Set of supported BS.ComponentType values
}
```

**Helper Methods:**
- `getByName(name)` - Get component class by name
- `getByCategory(category)` - Get all components in a category
- `getCategories()` - Get all available categories
- `getInfo(name)` - Get metadata about a specific component
- `list()` - List all components with metadata
- `getStats()` - Get statistics about components
- `isSupported(type)` - Check if a component type is supported
- `getLayerName(num)` - Convert layer number to name
- `getLayerNumber(name)` - Convert layer name to number
- `getBundledComponents(name)` - Get auto-included components

**Categories:**
- `core` - Entity, EntityComponent, Transform
- `meshes` - Geometry primitives (Box, Sphere, Cylinder, Text, etc.)
- `materials` - BanterMaterial, BanterPhysicMaterial
- `physics` - Rigidbody, colliders, joints
- `media` - Audio, video, GLTF models
- `behaviors` - Grabbable, synced objects, events
- `misc` - Mirror, portal, browser, asset bundles
- `scripting` - MonoBehavior script execution

#### 3c. Lifecycle System (`LifecycleAPI` global)

Comprehensive API for tracking and inspecting running MonoBehavior scripts.

**Structure:**
```javascript
{
  // Access to lifecycle manager
  manager: <LifecycleManager>,

  // Query methods
  getAllScripts(),        // Get all MonoBehavior instances
  getByEntity(name),      // Find scripts on specific entity
  getByFile(fileName),    // Find scripts using specific file
  getRunning(),           // Get only running scripts
  getByOwner(owner),      // Find scripts by owner

  // Inspection methods
  getInfo(scriptId),              // Detailed info about a script
  getLifecycleMethods(scriptId),  // Which lifecycle methods are defined
  getCustomMethods(scriptId),     // Custom methods (non-lifecycle)

  // Execution
  callMethod(scriptId, methodName, ...args),  // Call a custom method

  // Statistics
  getStats(),             // Script statistics
  list(),                 // Console table of all scripts

  // Control
  setFPS(fps),           // Set update frequency (1-120 FPS)
  start(),               // Start lifecycle manager
  stop()                 // Stop all onUpdate calls
}
```

**Underlying Data:**
- Scripts tracked in `lifecycle.monoBehaviors` Map
- Key format: `"MonoBehavior_{id}"` (e.g., "MonoBehavior_85004")
- Each entry contains:
  - `_entity` - Reference to the entity
  - `ctx` - Script execution context with lifecycle methods
  - `properties` - File name, vars, owner
  - `inventoryItem` - Full inventory item metadata
  - `_initialized` - Initialization state

**Example Usage:**
```javascript
// Find all scripts on an entity
const scripts = LifecycleAPI.getByEntity("Penny");

// Get custom methods
const methods = LifecycleAPI.getCustomMethods(scripts[0].id);

// Call a custom method
LifecycleAPI.callMethod(scripts[0].id, "flip");

// Control update rate
LifecycleAPI.setFPS(60);  // Set to 60 FPS
```

#### 4. Inventory System (`inventory` global)

Asset management for scripts and GameObjects.

**Structure:**
```javascript
{
  container: DOMElement,
  previewPane: DOMElement,
  items: {},              // All inventory items by name
  folders: {},            // Folder organization
  selectedItem: string|null,
  currentFolder: string|null,
  expandedFolders: [],
  draggedItem: string|null,
  isRemote: boolean,
  sortBy: string,
  sortDirection: string,
  firebase: {},           // Firebase integration
  ui: {},                 // UI module
  fileHandler: {}         // File operations
}
```

**Features:**
- Cloud sync via Firebase
- Folder organization
- Author tracking
- Import/export
- Startup script support

#### 5. Networking (`networking` global)

Multi-user synchronization via Firebase.

**Structure:**
```javascript
{
  db: FirebaseDatabase,
  storage: FirebaseStorage,
  secret: string,
  globalProps: object,
  auth: FirebaseAuth,

  // Methods
  setData(), getData()
  updateData(), deleteData(), addData()
}
```

**Properties:**
- `connected` - Boolean connection status
- May be false in local development mode

#### 6. Lifecycle Panel (`lifecyclePanel` global)

UI panel for script execution tracking.

**Structure:**
```javascript
{
  selectedLogs: [],
  shellBuffer: [],
  maxShellLines: number
}
```

**Note:** This is the UI controller. For programmatic access to running scripts, use `LifecycleAPI` instead.

---

## Data Structures

### Entity Structure

```javascript
{
  id: "numeric_string",           // Unique ID
  name: "EntityName",              // Display name
  path: "Scene/Parent/Child",      // Full hierarchy path
  active: true,                    // Visibility/enabled state
  layer: "0",                      // Unity layer (0-31)
  components: {                    // Components by ID
    "compId": { /* component */ }
  },
  children: [],                    // Array of child entity references
  parent: <entity_ref>             // Parent entity reference (or null/undefined)
}
```

**Access Patterns:**
- By ID: `scene.objects[entityId]`
- By path: `scene.FindByPath("Scene/Entity")`
- By name: `scene.Find("EntityName")`

### Component Structure

```javascript
{
  id: "component_id",              // Unique ID (may include type prefix)
  scene: <ref>,                    // Scene reference
  service: <ref>,
  componentType: "TypeName",       // E.g., "SphereCollider"
  type: "BanterTypeName",          // E.g., "BanterSphereCollider"
  oid: number,                     // Unity object ID
  unityId: number,
  hasUnity: boolean,

  // Component-specific properties (with _ prefix)
  _property1: value,
  _property2: value,
  // ...
}
```

**Key Patterns:**
- Properties stored directly on component with `_` prefix
- NOT in a separate `properties` object
- Component IDs may be numeric or include type: `"BanterRigidbody_37354"`

### Inventory Item Structure

```javascript
{
  name: "itemName",
  itemType: "script" | "gameobject",
  author: "AuthorName",
  folder: "FolderName",
  icon: "emoji",

  // Content
  data: "script_code_or_json",
  description: "text",

  // Metadata
  created: timestamp,
  lastUsed: timestamp,
  last_used: timestamp,

  // Flags
  active: boolean,
  global: boolean,
  startup: boolean,
  startupSequence: "onSceneLoaded" | other,

  // Import tracking
  imported: boolean,
  remote: boolean,
  importedFrom: "path/to/source",
  importedAt: timestamp
}
```

### Space Property Encoding

Some properties use special encoding for component-specific state:

**Pattern:** `__<EntityName>/<PropertyPath>:<ComponentId>`

**Examples:**
- `__BanterMaterial_9677/color:component`
- `__MonoBehavior_2905/file:component`
- `__Gravestone/Transform/localScale:50546_Transform`

This allows component properties to be synced via the space property system.

---

## Patterns & Conventions

### 1. Path-Based Entity Identification

Entities use hierarchical paths similar to file systems:
- Format: `"Scene/Parent/Child/Entity"`
- Root entities typically: `"Scene"`, `"People"`
- Use `scene.FindByPath(path)` for lookups

### 2. Component ID Conventions

Components have unique IDs with two patterns:
- Pure numeric: `"48096"`
- Type-prefixed: `"BanterRigidbody_37354"`, `"BoxCollider_94547"`

### 3. Property Naming

- **Underscore prefix** (`_property`): Internal/private component properties
- **Double underscore prefix** (`__entity/prop:comp`): Encoded space properties
- **No prefix**: Public API properties

### 4. Module Organization

Sub-modules accessed via dot notation:
- `inventory.ui` - UI rendering
- `inventory.fileHandler` - File operations
- `inventory.firebase` - Cloud sync

### 5. Firebase Integration

Items can be synced to cloud:
- `remote: true` - Item stored in Firebase
- `imported: true` - Item imported from remote
- `importedFrom` - Source path tracking

---

## Console Logging System

The inspector uses a custom logging system similar to Android's LogCat that allows filtering by event tags. This makes it easy to focus on specific subsystems without being overwhelmed by verbose logging.

### How It Works

The logging system is exposed via two global functions:
- `window.log(tag, ...args)` - Standard logging
- `window.err(tag, ...args)` - Error logging

All log messages are tagged with a category (e.g., "init", "net", "lifecycle") and can be filtered based on enabled tags.

### Logger Configuration

Access the logger configuration via:
```javascript
window.logger.include
```

**Default enabled tags:**
```javascript
{
  error: true,      // Always show errors
  command: true,    // Shell command execution
  script: true,     // Script-related logs
  oneShot: false,   // Network sync events (DISABLED - very verbose)
  spaceProps: false // Space property changes (DISABLED - very verbose)
}
```

### Enabling/Disabling Tags

```javascript
// Enable a specific tag
window.logger.include.init = true

// Disable a tag
window.logger.include.net = false

// Enable multiple tags at once
Object.assign(window.logger.include, {
  init: true,
  lifecycle: true,
  inventory: true
})

// Disable all except errors
window.logger.include = { error: true }

// Enable everything (very verbose!)
window.logger.include = Object.fromEntries(
  ['error', 'command', 'script', 'oneShot', 'spaceProps', 'init', 'net',
   'lifecycle', 'inventory', 'scene', 'entity', 'monobehavior', 'loadEntity',
   'fallback', 'startup', 'inspector'].map(tag => [tag, true])
)

// Completely disable logging
window.logger.active = false

// Re-enable logging
window.logger.active = true
```

### Available Log Tags

**Core System Tags:**
- `init` - Application initialization and scene loading (very verbose during startup)
- `net` - Network communication and Firebase operations (verbose)
- `lifecycle` - MonoBehavior script lifecycle events
- `command` - Shell command execution (enabled by default)
- `script` - Script-related operations (enabled by default)

**Entity & Component Tags:**
- `entity` - Entity operations (creation, deletion, modification)
- `scene` - Scene management operations
- `loadEntity` - Entity loading details
- `monobehavior` - MonoBehavior component operations
- `fallback` - Fallback entity/component lookup operations

**Asset & Data Tags:**
- `inventory` - Inventory system operations (items, folders, sync)
- `glb_loader` - GLB/GLTF model loading
- `gltf` - GLTF processing

**Event & Sync Tags:**
- `oneShot` - Network broadcast events (VERY VERBOSE - disabled by default)
- `spaceProps` - Space property changes (VERY VERBOSE - disabled by default)

**UI & Misc Tags:**
- `inspector` - UI operations and user interactions
- `startup` - Startup script execution
- `fallback` - Fallback search operations
- `info` - General informational messages
- `warn` - Warning messages

### Useful Logging Configurations

**Debug initialization issues:**
```javascript
window.logger.include = {
  error: true,
  init: true,
  scene: true,
  loadEntity: true
}
```

**Debug networking/sync issues:**
```javascript
window.logger.include = {
  error: true,
  net: true,
  oneShot: true,  // Warning: very verbose!
  spaceProps: true // Warning: very verbose!
}
```

**Debug script execution:**
```javascript
window.logger.include = {
  error: true,
  lifecycle: true,
  monobehavior: true,
  script: true,
  startup: true
}
```

**Debug inventory issues:**
```javascript
window.logger.include = {
  error: true,
  inventory: true,
  net: true
}
```

**Quiet mode (errors only):**
```javascript
window.logger.include = { error: true }
```

### Log Output Features

**Each log includes:**
- **Tag coloring** - Each tag gets a unique color for easy visual scanning
- **Source location** - File name and line number where log was called
- **Stack traces** - Click to expand for full stack trace
- **Shell integration** - Logs also appear in the Lifecycle Shell panel (if tag is enabled)

**Example log output:**
```
[INIT] @ scene-manager.js:148 setting up inspector
[NET] @ networking.js:101 Testing Firebase Realtime Database connection...
[LIFECYCLE] @ lifecycle-manager.js:78 LifecycleManager started with 30 FPS
```

### Performance Considerations

**Very Verbose Tags (use sparingly):**
- `oneShot` - Logs every network sync event (can be hundreds per second)
- `spaceProps` - Logs every space property change
- `init` - Extremely verbose during scene loading
- `loadEntity` - Logs every entity load operation

**Recommended for everyday use:**
- `error` - Always keep enabled
- `command` - Useful for debugging shell commands
- `script` - Useful for script development

### Programmatic Tag Colors

The logger automatically assigns consistent colors to tags using a hash function:

```javascript
// Get the color for a tag
window.logger.getTagColor('init')

// All tags maintain their color across sessions
```

### Clear Console

```javascript
// Clear browser console
console.clear()

// Clear lifecycle shell panel
document.getElementById('lifecycleShell').innerHTML = ''
```

---

## Investigation Techniques

### Using Chrome DevTools MCP

If you have the chrome-devtools MCP server available:

```javascript
// Take page snapshot (UI element tree)
mcp__chrome-devtools__take_snapshot()

// List console messages
mcp__chrome-devtools__list_console_messages()

// List network requests
mcp__chrome-devtools__list_network_requests({ resourceTypes: ["script"] })

// Execute script
mcp__chrome-devtools__evaluate_script({
  function: "() => { return Object.keys(scene.objects).length }"
})

// Take screenshot
mcp__chrome-devtools__take_screenshot()
```

### Finding Module Exports

Modules may not be exposed as globals. To find them:

```javascript
// Check window for module-related keys
Object.keys(window).filter(k =>
  k.toLowerCase().includes('scene') ||
  k.toLowerCase().includes('manager') ||
  k.toLowerCase().includes('panel')
)

// Check for change-related exports
Object.keys(window).filter(k => k.toLowerCase().includes('change'))

// Look for component registry
Object.keys(window).filter(k => k.toLowerCase().includes('component'))
```

### Testing Command Execution

```javascript
// Execute a simple command
SetEntityProp("Scene/MyEntity", "active", false)

// Check if it populated the undo stack
changeManager.undoStack.length

// Try undo
// (Would need to call the undo function - not exposed as simple global)
```

### Inspecting Network Loaded Resources

```javascript
// Get all loaded script URLs
Array.from(document.scripts)
  .map(s => s.src)
  .filter(s => s)
  .forEach(url => console.log(url))

// Check specific module loaded
Array.from(document.scripts).some(s => s.src.includes('change-types.js'))
```

### Exploring Component Properties

```javascript
// Get a component instance
const entity = Object.values(scene.objects)[0];
const comp = Object.values(entity.components || {})[0];

// List all properties (including private _props)
Object.keys(comp)

// Filter to just _ prefixed properties
Object.keys(comp).filter(k => k.startsWith('_'))

// Get property values
Object.keys(comp)
  .filter(k => k.startsWith('_'))
  .reduce((acc, k) => ({ ...acc, [k]: comp[k] }), {})
```

---

## Known Gaps & Questions

### Critical Unknowns

1. **Change Types System** ✅ **RESOLVED**
   - Now exposed globally as `window.ChangeTypes`
   - Includes 24 change types across 6 categories
   - Comprehensive metadata and helper methods available
   - See [Change Types System](#change-types-system) section for usage

2. **Component Registry** ✅ **RESOLVED**
   - Now exposed globally as `window.ComponentRegistry`
   - Includes 38 component types across 8 categories
   - Unity layer definitions (24 layers)
   - Component type mappings and bundle information
   - See [Component Registry System](#component-registry-system) section for usage

3. **MonoBehavior Tracking** ✅ **RESOLVED**
   - Now exposed globally as `window.LifecycleAPI`
   - Tracks running scripts via `lifecycle.monoBehaviors` Map
   - Scripts tracked by MonoBehavior component ID (e.g., "MonoBehavior_85004")
   - Comprehensive API for querying by entity, file, owner
   - Can call custom methods, get lifecycle info, control FPS
   - See [Lifecycle & Script Tracking](#lifecycle--script-tracking) section for usage

4. **Module Exposure Pattern**
   - Inconsistent: some modules global, others not
   - **Investigate:** Check which modules are intentionally private

5. **Entity Storage Duality**
   - Why both `BS.BanterScene.entities` and `scene.objects`?
   - Is `BS.BanterScene.entities` legacy code?
   - **Investigate:** Search codebase for usage patterns

### Minor Unknowns

6. **Space Property Decoding**
   - How to parse `__EntityName/Property:ComponentId` format?
   - Is there a decoder function?

7. **Asset Reference Format**
   - How are Texture, Material, Audio references stored?
   - Check entities with media components

8. **Layer Definitions** ✅ **RESOLVED**
   - Now available via `ComponentRegistry.layers`
   - 24 defined layers including: Default (0), UI (5), Grabbable (20), NetworkPlayer (17), etc.
   - Use `ComponentRegistry.getLayerName(num)` or `ComponentRegistry.getLayerNumber(name)`

9. **Network Sync Behavior**
   - How does OneShot work when `networking.connected = false`?
   - Local mode behavior?

10. **Console Logging Volume**
    - Why heavy console activity?
    - Debug mode enabled?

---

## Code File Locations

Quick reference for reading source code:

### Core Modules
```
frontend/js/app.js                          - Main application entry
frontend/js/scene-manager.js                - Scene state management
frontend/js/entity.js                       - Entity class definition
frontend/js/utils.js                        - Shared utilities
```

### Systems
```
frontend/js/change-manager.js               - Undo/redo system
frontend/js/change-types.js                 - Change type definitions
frontend/js/networking.js                   - Multi-user sync
frontend/js/lifecycle-manager.js            - Script execution
frontend/js/input-handler.js                - Input handling
frontend/js/firebase-auth-helper.js         - Authentication
```

### UI Panels
```
frontend/js/pages/world-inspector/
  ├── hierarchy-panel.js                    - Entity tree
  ├── properties-panel.js                   - Component properties
  ├── space-props-panel.js                  - Space properties
  ├── component-menu.js                     - Add component menu
  └── lifecycle-panel.js                    - Script lifecycle UI
```

### Inventory
```
frontend/js/pages/inventory/
  ├── inventory.js                          - Main coordinator
  ├── inventory-ui.js                       - UI rendering
  ├── inventory-firebase.js                 - Cloud sync
  └── inventory-file-handler.js             - File operations
```

### Components
```
frontend/js/entity-components/
  ├── index.js                              - Component registry
  ├── entity-component.js                   - Base class
  ├── transform.js                          - Transform component
  ├── monobehavior.js                       - Script component
  ├── meshes/                               - Geometry components
  ├── materials/                            - Material components
  ├── physics/                              - Physics components
  ├── media/                                - Audio/video/GLTF
  ├── behaviors/                            - Interaction behaviors
  └── misc/                                 - Special components
```

---

## External Dependencies

Loaded from CDNs:

1. **Firebase** (v10.7.1)
   - firebase-app-compat.js
   - firebase-auth-compat.js
   - firebase-database-compat.js
   - firebase-storage-compat.js

2. **Microsoft Cognitive Services**
   - Speech SDK (latest)

3. **Vanilla JS Dropdown**
   - From jsDelivr CDN

4. **CodeMirror** (v5.65.13)
   - For script editor (inferred)

---

## Quick Command Reference

### Shell Commands

The inspector shell supports these command types:

```
Entity Management:
  add_entity <parentPath> <name>
  remove_entity <entityPath>
  move_entity <entityPath> <newParentPath>
  clone_entity <entityPath>
  set_entity_property <entityPath> <property> <value>

Component Management:
  add_component <entityPath> <ComponentType> <properties_json>
  remove_component <componentId>
  set_component_property <componentId> <property> <value>

Inventory:
  load_item <itemName> <parentPath> <position>
  save_item <entityPath> <itemName> <folder>
  delete_item <itemName>

Syntax:
  - Paths: "Scene/Parent/Child"
  - Parent can be "null" for root
  - Properties: JSON format {}
  - Values: primitives or JSON objects {"x":0,"y":1,"z":0}
```

---

## Best Practices for Runtime Debugging

1. **Start with entity count:** `Object.keys(scene.objects).length`
2. **List entity names:** `Object.values(scene.objects).map(e => e.name)`
3. **Check selected entity:** Look at properties panel in UI
4. **Inspect components:** Get entity → list components → examine properties
5. **Monitor undo stack:** `changeManager.undoStack` after operations
6. **Check console errors:** May reveal issues not visible in UI
7. **Use snapshot for UI state:** MCP snapshot shows actual rendered state
8. **Network tab:** See what scripts/resources are loaded

---

## Summary

This guide provides reusable inspection techniques for the Banter Inspector runtime. The key architectural points:

- **Entities:** Stored in `scene.objects` (not `BS.BanterScene.entities`)
- **Components:** 56 types in BS library, properties use `_` prefix
- **Inventory:** Cloud-synced asset management
- **Change System:** Full undo/redo for collaborative editing
- **Networking:** Firebase-based multi-user sync

For specific implementation details, refer to the source code files listed above. For runtime state, use the inspection snippets provided.
