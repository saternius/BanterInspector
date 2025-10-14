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
8. [Resolved Discoveries](#resolved-discoveries)
9. [Known Gaps & Questions](#known-gaps--questions)

---

## Quick Access Reference

### Global Objects

All accessible from the browser console (F12):

```javascript
// Core Scene Management
scene                    // BanterScript's official scene object (same as SM.scene)
scene.objects           // All BanterScript GameObjects in the scene (native Unity objects)
scene.components        // Map of all components
scene.users             // Connected users
scene.spaceState        // Public/protected space properties
scene.localUser         // Current user

// Entity Scene Manager (Inspector's wrapper layer)
SM                      // Scene Manager singleton (NOW EXPOSED GLOBALLY!)
SM.scene                // Reference to BanterScript's scene (same as global 'scene')
SM.entityData.entities  // Inspector's Entity wrappers (indexed by numeric ID: "0", "1", etc.)
SM.entityData.entityMap // Entity lookup map
SM.entityData.componentMap // Component lookup map
SM.getEntityById(path)  // Get Entity wrapper by path
entities()              // Global function returning top-level entities (Scene, People)

// Systems
changeManager           // Undo/redo system with stacks
ChangeTypes             // All Change class types with metadata and helpers
ComponentRegistry       // All Component classes with metadata and helpers
LifecycleAPI            // MonoBehavior script tracking and inspection
inventory               // Asset management (scripts, prefabs)
networking              // Multi-user sync via Firebase
lifecyclePanel          // Script lifecycle tracking

// Inspector Panels (via inspector object)
inspector               // Main inspector object containing all panels
inspector.hierarchyPanel      // Hierarchy tree UI
inspector.propertiesPanel     // Properties editor UI
inspector.spacePropsPanel     // Space properties UI
inspector.componentMenu       // Component add menu UI
inspector.lifecyclePanel      // Lifecycle tracking UI (same as global lifecyclePanel)
inspector.inventory           // Inventory UI (same as global inventory)
inspector.scriptEditors       // Map of open script editors
inspector.feedback            // Feedback system with voice input
inspector.navigation          // Navigation and page management

// Utility Systems
inputHandler            // VR input handling with color picker
TransformOps            // Vector3 utilities (Add, Subtract, Multiply, Divide)
loadingScreen           // Loading progress tracking
componentBSTypeMap      // Maps BS.ComponentType enum integers to Component classes
componentTextMap        // Maps BS.ComponentType enum integers to string names

// BS Library
BS                      // BanterScript library (56 component classes, 118 methods)
BS.BanterScene          // Scene class (use 'scene' global instead)

// Command Functions (28 total)
// Entity operations
SetEntityProp(entityId, property, newValue, options)
AddEntity(parentId, entityName, options)
RemoveEntity(entityId, options)
MoveEntity(entityId, newParentId, options)
CloneEntity(entityId, options)

// Component operations
AddComponent(entityId, componentType, options)
RemoveComponent(componentId, options)
SetComponentProp(componentId, property, newValue, options)

// Space properties
SetSpaceProp(property, newValue, protect, options)
addPublicProp()         // Add public space property (UI helper)
addProtectedProp()      // Add protected space property (UI helper)

// Inventory operations
LoadItem(itemName, parentId, options)
SaveEntityItem(entityId, itemName, folder, options)
DeleteItem(itemName, options)
CreateFolder()
RemoveFolder()
MoveItemDirectory()

// Script operations
CreateScript()
EditScript(scriptName, scriptContent, options)
SetMonoBehaviorVar()

// Utility
RunCommand(execString, options)  // Execute shell command
GetTracker(name)        // Get VR tracker entity

// Firebase (if initialized)
firebase                // Firebase SDK

// Logging
logger                  // Logger instance with tag filter configuration
log(tag, ...args)       // Tagged logging function
err(tag, ...args)       // Tagged error logging function

// Space Property Utilities
decodeSpacePropertyKey(key)    // Decode __EntityName/Property:ComponentId format
encodeSpacePropertyKey(entityName, propertyPath, componentId)  // Encode space property key
isEncodedSpacePropertyKey(key) // Check if key is in encoded format
```

### Module Exposure

**Exposed as globals (48 module-related objects found):**

**Core Systems:**
- ✅ `SM` - Scene Manager singleton (NOW EXPOSED! 🎉)
- ✅ `scene` - BanterScript scene object
- ✅ `BS` - BanterScript library
- ✅ `inspector` - Main inspector object (contains all panels)

**Registries & APIs:**
- ✅ `ChangeTypes` - All change classes with metadata
- ✅ `ComponentRegistry` - All component classes with metadata
- ✅ `LifecycleAPI` - MonoBehavior script tracking and inspection
- ✅ `componentBSTypeMap` - BS.ComponentType enum → Component class mapping
- ✅ `componentTextMap` - BS.ComponentType enum → string name mapping

**Managers:**
- ✅ `changeManager` - Undo/redo system
- ✅ `lifecycle` - LifecycleManager instance
- ✅ `networking` - Firebase multi-user sync
- ✅ `inputHandler` - VR input handling with color picker

**Panels (accessible via inspector object):**
- ✅ `inspector.hierarchyPanel` - Hierarchy tree UI
- ✅ `inspector.propertiesPanel` - Properties editor UI
- ✅ `inspector.spacePropsPanel` - Space properties UI (also global `spacePropsPanel`)
- ✅ `inspector.componentMenu` - Component add menu UI
- ✅ `inspector.lifecyclePanel` - Lifecycle tracking UI (also global `lifecyclePanel`)
- ✅ `inspector.inventory` - Inventory UI (also global `inventory`)
- ✅ `inspector.scriptEditors` - Map of open script editors
- ✅ `inspector.feedback` - Feedback system
- ✅ `inspector.navigation` - Navigation and page management

**Direct Panel Globals (for backward compatibility):**
- ✅ `lifecyclePanel`
- ✅ `spacePropsPanel`
- ✅ `inventory`

**Utilities:**
- ✅ `TransformOps` - Vector3 math utilities
- ✅ `loadingScreen` - Loading progress tracking
- ✅ `scriptEditors` - Script editor Map (same as inspector.scriptEditors)
- ✅ `logger` - Logging system

**External Libraries:**
- ✅ `firebase` - Firebase SDK
- ✅ `SpeechSDK` - Microsoft Speech SDK

---

## Inspection Code Snippets

Copy-paste these into Chrome DevTools console to inspect runtime state.

### Entity Inspection

```javascript
// BanterScript GameObjects (native Unity objects)
// scene.objects contains ALL BanterScript GameObjects

// Get all GameObject IDs
Object.keys(scene.objects)

// Count GameObjects
Object.keys(scene.objects).length

// Get GameObject by path (BanterScript method)
scene.FindByPath("Scene/MyEntity")

// List all GameObject names and paths
Object.keys(scene.objects).map(id => ({
  id,
  name: scene.objects[id].name,
  path: scene.objects[id].path,
  active: scene.objects[id].active
}))

// Find GameObjects by name
Object.values(scene.objects).filter(e => e.name.includes("searchTerm"))

// Inspector's Entity Wrappers (adds MonoBehavior, sync, items, extensions)
// SM.entityData.entities contains Inspector's Entity wrapper layer

// Get all Entity wrappers
SM.entityData.entities

// Count Entity wrappers
Object.keys(SM.entityData.entities).length

// Get top-level entities (Scene, People)
entities()

// IMPORTANT: SM.entityData.entities is indexed by NUMERIC ID ("0", "1"), not by path!
// Get a specific Entity wrapper by numeric index
SM.entityData.entities["0"]  // Usually the Scene entity
SM.entityData.entities["1"]  // Usually the People entity

// Find Entity wrapper by path (recommended method)
SM.getEntityById("Scene/MyEntity")
SM.getEntityById("Scene/Ground")

// List all Entity wrapper numeric indices
Object.keys(SM.entityData.entities)  // Returns: ["0", "1"]

// Entity vs GameObject comparison
const entityId = "Scene/MyEntity";
const entity = SM.entityData.entities[entityId];  // Inspector's Entity wrapper
const gameObject = scene.objects[entity.id];      // Underlying BanterScript GameObject

// Entity wrappers add:
// - JS MonoBehavior script attachment
// - Automatic oneShot broadcasting for sync
// - Storing and loading items
// - Building extensions
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
  Object.values(e.components || {}).some(c => c.type === 'Rigidbody')
)

// Sample component class structure
const sampleClass = BS.Box;
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
// Returns: ['GeometryComponent', 'BoxComponent', 'SphereComponent', ...]

// Get component info
ComponentRegistry.getInfo('BoxComponent')
// Returns: { category: 'meshes', description: 'Box/cube primitive', icon: '◼️' }

// Get component class by name
const BoxComponent = ComponentRegistry.getByName('Box')

// Check if component is supported
ComponentRegistry.isSupported('Box')  // true
ComponentRegistry.isSupported(BS.ComponentType.Box)  // true

// Layer utilities
ComponentRegistry.getLayerName(5)  // 'UI'
ComponentRegistry.getLayerNumber('UI')  // 5
ComponentRegistry.layers  // Full layer definitions

// Check bundled components
ComponentRegistry.getBundledComponents('Geometry')
// Returns: ['Material'] (auto-includes material)
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

// Decode encoded space property keys
// Pattern: __<EntityName>/<PropertyPath>:<ComponentId>
decodeSpacePropertyKey("__Material_9677/color:component")
// Returns: { isEncoded: true, entityName: "Material_9677", propertyPath: "color", componentId: "component", malformed: false }

// Find all encoded properties
Object.keys(scene.spaceState.public)
  .filter(key => isEncodedSpacePropertyKey(key))

// Decode all encoded properties
Object.keys(scene.spaceState.public)
  .filter(key => isEncodedSpacePropertyKey(key))
  .map(key => ({ key, decoded: decodeSpacePropertyKey(key), value: scene.spaceState.public[key] }))

// Find properties for a specific entity
Object.keys(scene.spaceState.public)
  .map(key => ({ key, decoded: decodeSpacePropertyKey(key), value: scene.spaceState.public[key] }))
  .filter(item => item.decoded.isEncoded && item.decoded.entityName === "MyEntity")

// Create an encoded property key
encodeSpacePropertyKey("MyEntity", "Transform/localScale", "12345_Transform")
// Returns: "__MyEntity/Transform/localScale:12345_Transform"
```

### Scene Manager (SM) Inspection

```javascript
// Access Scene Manager (NOW EXPOSED GLOBALLY!)
SM

// Get all Entity wrapper methods
Object.getOwnPropertyNames(Object.getPrototypeOf(SM)).filter(m => m !== 'constructor')

// EntityData structure
SM.entityData.entities  // Indexed by numeric ID: "0", "1", etc.
SM.entityData.entityMap
SM.entityData.componentMap

// Get entity by path (recommended)
SM.getEntityById("Scene/Ground")

// Scene Manager properties
SM.iamHost           // Am I the host?
SM.loaded            // Is scene fully loaded?
SM.selectedEntity    // Currently selected entity
SM.expandedNodes     // Expanded hierarchy nodes

// Utility methods
SM.getAllEntities()  // Get all entity wrappers
SM.getAllMonoBehaviors()  // Get all MonoBehavior components
```

### Inspector Panels Inspection

```javascript
// Access all panels via inspector object
inspector

// Hierarchy panel
inspector.hierarchyPanel.treeContainer
inspector.hierarchyPanel.searchTerm
inspector.hierarchyPanel.draggedEntityId

// Properties panel
inspector.propertiesPanel.propertiesContent
inspector.propertiesPanel.collapseAllComponents()
inspector.propertiesPanel.render()

// Component menu
inspector.componentMenu.overlay
inspector.componentMenu.searchInput

// Navigation
inspector.navigation.currentPage  // Current page name
inspector.navigation.pages         // All registered pages

// Feedback system
inspector.feedback.recording       // Is recording voice?
inspector.feedback.tickets         // All feedback tickets
inspector.feedback.statementBlockEditor  // AI text processing
```

### Component Type Mapping

```javascript
// Map BS.ComponentType enum integers to classes/names
componentBSTypeMap
componentTextMap

// Get component class from BS.ComponentType enum
const enumVal = BS.ComponentType.Box;  // e.g., 7
const ComponentClass = componentBSTypeMap[enumVal]
const componentName = componentTextMap[enumVal]  // "Box"

// List all mapped types
Object.keys(componentBSTypeMap)  // Array of enum integers
Object.entries(componentTextMap).slice(0, 10)  // Sample mappings
```

### TransformOps (Vector3 Utilities)

```javascript
// Vector3 math operations
const v1 = { x: 1, y: 2, z: 3 };
const v2 = { x: 4, y: 5, z: 6 };

TransformOps.Add(v1, v2)       // { x: 5, y: 7, z: 9 }
TransformOps.Subtract(v1, v2)  // { x: -3, y: -3, z: -3 }
TransformOps.Multiply(v1, 2)   // { x: 2, y: 4, z: 6 }
TransformOps.Divide(v1, 2)     // { x: 0.5, y: 1, z: 1.5 }
```

### Input Handler (VR & Color Picker)

```javascript
// VR input handling
inputHandler.initialized
inputHandler.currentInput     // Currently focused input element
inputHandler.tolerance        // Input precision tolerance

// VR controller
inputHandler.getRightControllerRot()  // Get right controller rotation
inputHandler.radialCrown      // Radial menu data
inputHandler.radialCrownTol   // Radial menu tolerance

// Color picker
inputHandler.getColorValue()  // Get current color
inputHandler.setColorValue(color)  // Set color
inputHandler.rgbToHsv(r, g, b)  // Convert RGB to HSV
inputHandler.hsvToRgb(h, s, v)  // Convert HSV to RGB
inputHandler.rgbToHex(r, g, b)  // Convert RGB to hex
inputHandler.hexToRgb(hex)      // Convert hex to RGB
```

### Loading Screen

```javascript
// Loading progress tracking
loadingScreen.stages          // All loading stages
loadingScreen.currentStageIndex  // Current stage index
loadingScreen.subProgress     // Sub-progress within stage
loadingScreen.errorState      // Is there an error?
loadingScreen.startTime       // Load start timestamp

// DOM elements
loadingScreen.element         // Main loading screen element
loadingScreen.progressFillElement
loadingScreen.percentageElement
loadingScreen.statusElement
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

#### 1. BanterScript Scene (`scene` global, `SM.scene`)

The BanterScript library's official scene object that bridges Unity and JavaScript.

**Key Properties:**
- `objects` - Object containing all BanterScript GameObjects by ID (native Unity objects)
- `components` - **Object** (not a Map!) of all component instances, indexed by component ID
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

#### 1a. Entity Scene Manager (Inspector's Wrapper Layer)

The inspector's Entity system that wraps BanterScript GameObjects with additional functionality.

**Architecture:**
```
┌─────────────────────────────────────────┐
│  Entity Scene Manager (Inspector)       │
│  - Entity wrappers in SM.entityData     │
│  - JS MonoBehavior scripts              │
│  - Automatic sync via oneShot           │
│  - Store/load items                     │
│  - Extensions & plugins                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  BanterScript Library (BS)              │
│  - GameObjects in scene.objects         │
│  - Unity ↔ JavaScript bridge            │
│  - Component system                     │
│  - Native Unity features                │
└─────────────────────────────────────────┘
```

**Key Components:**
- `SM` - Scene Manager singleton (**NOW EXPOSED GLOBALLY!**)
- `SM.scene` - Reference to BanterScript's scene object
- `SM.entityData.entities` - **Object indexed by numeric ID** ("0", "1", etc.), NOT by path
- `SM.entityData.entityMap` - Entity lookup map
- `SM.entityData.componentMap` - Component lookup map
- `entities()` - Global function returning top-level entities (Scene, People)
- `SM.getEntityById(path)` - Find Entity wrapper by path (**recommended access method**)

**Entity Wrapper Features:**
- Wraps BanterScript GameObjects with inspector-specific functionality
- Enables JS MonoBehavior script attachment
- Provides automatic oneShot broadcasting for client synchronization
- Supports storing and loading items from inventory
- Extensible architecture for building custom features

**Important Distinction:**
- `scene.objects[id]` = BanterScript GameObject (native Unity object)
- `SM.entityData.entities[path]` = Inspector's Entity wrapper (adds sync, scripts, items)
- Entity wrappers reference underlying GameObjects but add inspector functionality

#### 2. BanterScript Library (BS)

Unity bridge library with component classes and helper methods.

**Component Classes (56 total):**
- Primitives: Box, Sphere, Cylinder, Plane, etc.
- Advanced Geometry: Mobius, Klein, Torus, etc.
- Media: AudioSource, VideoPlayer, GLTF, Texture
- Physics: Rigidbody, PhysicMaterial
- Materials: Material
- Behaviors: GrabHandle, SyncedObject, ColliderEvents, etc.
- Special: MonoBehavior, AssetBundle, Mirror, Portal, etc.

**Important Notes:**
- `scene.objects` contains BanterScript GameObjects (native Unity layer)
- For Inspector's Entity wrappers, use `SM.entityData.entities`
- The inspector builds on top of BanterScript, not replacing it

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
    // Meshes (11): Box, Sphere, Cylinder, etc.
    // Materials (2): Material, PhysicMaterial
    // Physics (6): Rigidbody, colliders, joints
    // Media (3): AudioSource, VideoPlayer, GLTF
    // Behaviors (5): GrabHandle, SyncedObject, etc.
    // Misc (8): Mirror, Portal, Browser, etc.
  },

  // Rich metadata for each component
  metadata: {
    BoxComponent: {
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
- `materials` - Material, PhysicMaterial
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

### BanterScript GameObject Structure

BanterScript GameObjects are native Unity objects accessed via `scene.objects`:

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
  children: [],                    // Array of child GameObject references
  parent: <gameObject_ref>         // Parent GameObject reference (or null/undefined)
}
```

**Access Patterns:**
- By ID: `scene.objects[gameObjectId]`
- By path: `scene.FindByPath("Scene/Entity")`
- By name: `scene.Find("EntityName")`

### Inspector Entity Wrapper Structure

Entity wrappers extend GameObjects with inspector-specific features, accessed via `SM.entityData.entities`:

```javascript
{
  id: "numeric_string",           // References the underlying GameObject ID
  eid: "path_string",             // Entity ID (hierarchical path: "Scene/Parent/Child")
  name: "EntityName",              // Display name
  path: "Scene/Parent/Child",      // Full hierarchy path (same as eid)
  active: true,                    // Visibility/enabled state
  layer: "0",                      // Unity layer

  // Inspector-specific features
  components: [],                  // Array of component references
  children: [],                    // Array of child Entity wrappers
  parent: <entity_ref>,           // Parent Entity wrapper
  parentId: "Scene/Parent",       // Parent entity path

  // Enhanced functionality
  _bs: <BanterScriptGameObject>,  // Reference to underlying BS GameObject

  // Methods (examples)
  Set(property, value),           // Set property with sync
  SetParent(parentPath),          // Change parent with sync
  getComponent(type)              // Get component by type
}
```

**Access Patterns:**
- ❌ ~~By path: `SM.entityData.entities["Scene/Parent/Child"]`~~ (WRONG - not indexed by path!)
- ✅ By numeric ID: `SM.entityData.entities["0"]` (Scene), `SM.entityData.entities["1"]` (People)
- ✅ By path (method): `SM.getEntityById("Scene/Parent/Child")` (**recommended**)
- ✅ Top-level: `entities()` returns Scene and People entities

**Key Distinction:**
- GameObject (in `scene.objects`): Native BanterScript/Unity layer
- Entity (in `SM.entityData.entities`): Inspector's wrapper adding sync, scripts, items, extensions
- **IMPORTANT**: Entity wrappers stored by numeric ID, not by path. Use `SM.getEntityById(path)` for path lookup.

### Component Structure

```javascript
{
  id: "component_id",              // Unique ID (may include type prefix)
  scene: <ref>,                    // Scene reference
  service: <ref>,
  componentType: "TypeName",       // E.g., "SphereCollider"
  type: "BanterTypeName",          // E.g., "SphereCollider"
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
- Component IDs may be numeric or include type: `"Rigidbody_37354"`

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
- `__Material_9677/color:component`
- `__MonoBehavior_2905/file:component`
- `__Gravestone/Transform/localScale:50546_Transform`

This allows component properties to be synced via the space property system.

**Decoding Utilities:**

Use the global decoder functions to parse these encoded keys:

```javascript
// Decode an encoded space property key
const decoded = decodeSpacePropertyKey("__Material_9677/color:component");
// Returns: {
//   isEncoded: true,
//   raw: "__Material_9677/color:component",
//   entityName: "Material_9677",
//   propertyPath: "color",
//   componentId: "component",
//   malformed: false
// }

// Check if a key is encoded
isEncodedSpacePropertyKey("__Material_9677/color:component")  // true
isEncodedSpacePropertyKey("normalProperty")  // false

// Create an encoded key
const encoded = encodeSpacePropertyKey("MyEntity", "Transform/localScale", "12345_Transform");
// Returns: "__MyEntity/Transform/localScale:12345_Transform"

// Decode all encoded space properties
Object.keys(scene.spaceState.public)
  .filter(key => isEncodedSpacePropertyKey(key))
  .map(key => decodeSpacePropertyKey(key))

// Find all space properties for a specific entity
Object.keys(scene.spaceState.public)
  .map(key => decodeSpacePropertyKey(key))
  .filter(decoded => decoded.isEncoded && decoded.entityName === "MyEntity")
```

---

## Patterns & Conventions

### 1. Path-Based Identification

Both GameObjects and Entity wrappers use hierarchical paths similar to file systems:
- Format: `"Scene/Parent/Child/Entity"`
- Root entities typically: `"Scene"`, `"People"`
- BanterScript: Use `scene.FindByPath(path)` for GameObject lookups
- Inspector: Use `SM.getEntityById(path)` for Entity wrapper lookups
- Top-level: Use `entities()` to get Scene and People Entity wrappers

### 2. Component ID Conventions

Components have unique IDs with two patterns:
- Pure numeric: `"48096"`
- Type-prefixed: `"Rigidbody_37354"`, `"BoxCollider_94547"`

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

## Common Gotchas & Non-Obvious Behaviors

**⚠️ CRITICAL: SM.entityData.entities Indexing**
```javascript
// ❌ WRONG - entities NOT indexed by path
SM.entityData.entities["Scene/MyEntity"]  // undefined!

// ✅ CORRECT - indexed by numeric ID
SM.entityData.entities["0"]  // Scene entity
SM.entityData.entities["1"]  // People entity

// ✅ CORRECT - use helper method for path lookup
SM.getEntityById("Scene/MyEntity")
```

**⚠️ scene.components is an Object, not a Map**
```javascript
// ❌ WRONG
scene.components.get(componentId)

// ✅ CORRECT
scene.components[componentId]
```

**⚠️ BS.BanterScene.entities does NOT exist**
- Use `scene.objects` for BanterScript GameObjects (native Unity layer)
- Use `SM.entityData.entities` for Inspector's Entity wrappers (adds sync, scripts, items)
- Two-layer architecture: BS (native) → Inspector (wrapper)

**💡 Discovery Helper Methods**
All registries provide self-documentation:
```javascript
ComponentRegistry.list()      // List all components
ComponentRegistry.getStats()  // Get statistics
ChangeTypes.list()            // List all change types
LifecycleAPI.list()           // List all running scripts
```

**💡 Container Object Pattern**
Related modules grouped in `inspector` object for better organization:
```javascript
Object.keys(inspector)  // Discover all panels
inspector.hierarchyPanel.render()  // Direct access
```

**💡 Component Type Conversion**
```javascript
// Convert BS.ComponentType enum to class/name
const enumVal = BS.ComponentType.Box;
const ComponentClass = componentBSTypeMap[enumVal];
const componentName = componentTextMap[enumVal];
```


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

- **Two-Layer Architecture:**
  - **BanterScript Library (BS)**: Unity ↔ JavaScript bridge, GameObjects in `scene.objects`
  - **Entity Scene Manager (Inspector)**: Extension layer, Entity wrappers in `SM.entityData.entities`
- **GameObjects vs Entities:**
  - GameObjects: Native BanterScript/Unity objects (`scene.objects`)
  - Entities: Inspector wrappers adding sync, scripts, items, extensions (`SM.entityData.entities`)
- **Components:** 56 types in BanterScript library, properties use `_` prefix
- **Inventory:** Cloud-synced asset management with items and extensions
- **Change System:** Full undo/redo for collaborative editing
- **Networking:** Firebase-based multi-user sync via oneShot broadcasting
- **Scripts:** JS MonoBehavior system with lifecycle management

For specific implementation details, refer to the source code files listed above. For runtime state, use the inspection snippets provided.
