# Unity Scene Inspector - Architecture Guide

## Overview
The Unity Scene Inspector is a modular web application that provides real-time inspection and modification of Unity scenes through the BanterScript (BS) library.

## Core Architecture Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility:
- **SceneManager**: State management and Unity communication
- **UI Panels**: Presentation and user interaction
- **Utils**: Shared functionality

### 2. Event-Driven Communication
Modules communicate through custom DOM events:
```javascript
// Panel emits event
document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
    detail: { slotId: selectedSlot }
}));

// Another panel listens
document.addEventListener('slotSelectionChanged', (event) => {
    this.render(event.detail.slotId);
});
```

### 3. Reactive Updates
- UI updates in response to state changes
- Debounced Unity updates for performance
- Optimistic UI updates with eventual consistency

## Module Breakdown

### SceneManager (Singleton)
Central state management and Unity bridge.

**Responsibilities:**
- Maintain scene hierarchy state
- Handle Unity communication
- Manage space properties
- Coordinate component updates

**Key Methods:**
```javascript
initialize()              // Connect to Unity or load mock data
gatherSceneHierarchy()    // Fetch scene data from Unity
updateUnityComponent()    // Send updates to Unity
setSpaceProperty()        // Update space state
```

### HierarchyPanel
Displays scene structure as a tree.

**Features:**
- Expandable/collapsible nodes
- Search/filter functionality
- Add/delete operations
- Visual state indicators

**State Management:**
- Expanded nodes tracked in SceneManager
- Selection state shared globally
- Search term local to panel

### PropertiesPanel
Component and property editing interface.

**Features:**
- Type-specific input controls
- Inline editing
- Debounced updates
- Component management

**Property Types:**
- Boolean → Checkbox
- Number → Number input
- Vector3 → X/Y/Z inputs
- Color → Color picker + RGBA
- String → Text input
- Object → JSON editor

### SpacePropsPanel
Manages public and protected space properties.

**Features:**
- CRUD operations
- Inline editing
- Type auto-detection
- JSON support

### ComponentMenu
Modal for adding components to slots.

**Features:**
- Categorized components
- Search functionality
- Unity component creation
- Validation

## Data Flow Patterns

### 1. Scene Loading
```
Unity Scene
    ↓ (BS.BanterScene)
SceneManager.gatherSceneHierarchy()
    ↓ (builds hierarchy)
SceneManager.sceneData
    ↓ (render)
UI Panels
```

### 2. Property Updates
```
User Input (PropertiesPanel)
    ↓ (onChange)
PropertiesPanel.queueChange()
    ↓ (debounce 100ms)
PropertiesPanel.flushPendingChanges()
    ↓
SceneManager.updateUnityComponent()
    ↓ (BS API)
Unity GameObject
    ↓
Space State (persistence)
```

### 3. Slot Operations
```
User Action (Add/Delete)
    ↓
HierarchyPanel handler
    ↓
SceneManager.addNewSlot/deleteSlot()
    ↓
Update hierarchyMap
    ↓
Emit slotSelectionChanged
    ↓
All panels re-render
```

## State Management

### Global State (SceneManager)
```javascript
{
    scene: BS.BanterScene,        // Unity connection
    sceneData: {
        slots: [],                // Hierarchy data
        hierarchyMap: {}          // ID lookup map
    },
    selectedSlot: string,         // Current selection
    expandedNodes: Set,           // Expanded tree nodes
    spaceState: {
        public: {},               // Public properties
        protected: {}             // Protected properties
    }
}
```

### Local State (Panels)
- Search terms
- Edit modes
- Pending changes
- UI state

## Performance Optimizations

### 1. Debouncing
Property updates are debounced to prevent overwhelming Unity:
```javascript
this.updateTimer = setTimeout(() => {
    this.flushPendingChanges();
}, 100);
```

### 2. Batch Updates
Multiple property changes are grouped:
```javascript
const changesBySlot = new Map();
changes.forEach(change => {
    changesBySlot.get(change.slotId).push(change);
});
```

### 3. Minimal Re-renders
- Only affected components re-render
- Virtual scrolling for large hierarchies (future)
- Memoization of expensive operations

## Error Handling

### Connection Failures
- Graceful fallback to mock data
- Clear error messages
- Retry mechanisms

### Invalid Data
- Type validation
- Safe parsing with fallbacks
- User-friendly error display

## Security Considerations

### Input Validation
- All user inputs sanitized
- Type checking before Unity calls
- XSS prevention

### Unity Bridge Security
- No direct code execution
- Limited to BS API calls
- Validated component types

## Extension Points

### Adding New Component Types
1. Define in `getDefaultComponentConfig()`
2. Add creation logic in `createUnityComponent()`
3. Add UI in component menu
4. Define property rendering

### Custom Property Types
1. Add type check in utils
2. Create custom renderer
3. Add update handler
4. Define serialization

### New Panels
1. Create panel class
2. Register in app.js
3. Set up event listeners
4. Define render logic

## Best Practices

### Code Organization
- One class per file
- Clear method naming
- Comprehensive JSDoc comments
- Consistent code style

### Event Naming
- Descriptive event names
- Include relevant data in detail
- Document event contracts
- Avoid event loops

### State Updates
- Immutable updates where possible
- Clear state ownership
- Predictable update patterns
- Optimistic UI updates

## Future Architecture Considerations

### 1. State Management Library
Consider Redux/MobX for complex state

### 2. Virtual DOM
React/Vue for efficient rendering

### 3. WebSocket Connection
Real-time Unity updates

### 4. Plugin System
Extensible architecture for custom features

### 5. Testing Framework
Unit and integration tests