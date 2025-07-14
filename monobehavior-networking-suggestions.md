# Additional Changes Required for Component Sync Strategy Implementation

## Overview
This document outlines the additional changes required across the codebase to implement the centralized component sync strategy described in `monobehavior-component-sync-strategy.md`.

## File-by-File Changes Required

### 1. app.js
**Current State:**
- Main application entry point that initializes all panels
- Handles global event coordination

**Required Changes:**
```javascript
// Import the new change manager
import { changeManager } from './change-manager.js';

// In initialize():
await changeManager.initialize();

// Replace the slotPropertiesChanged handler:
changeManager.onChangeFlushed((changes) => {
    // Update hierarchy panel if slot names changed
    const slotNameChanges = changes.filter(c => 
        c.type === 'slot' && c.property === 'name'
    );
    if (slotNameChanges.length > 0) {
        window.inspectorApp.hierarchyPanel.refresh();
    }
});

// Add Unity space state sync:
sceneManager.scene.addEventListener('space-state-changed', (event) => {
    // Sync external changes through change manager
    changeManager.handleExternalChanges(event.detail.changes);
});
```

### 2. component-menu.js
**Current State:**
- Creates new components with default properties
- Directly sets initial property values

**Required Changes:**
```javascript
// In createUnityComponent():
const component = await gameObject.AddComponent(componentInstance);

// Queue initial properties through change manager
const defaultProps = this.getDefaultComponentConfig(componentType);
for (const [prop, value] of Object.entries(defaultProps)) {
    changeManager.queueChange({
        type: 'component',
        targetId: component.id,
        property: prop,
        value: value,
        metadata: {
            slotId: gameObject.id,
            componentType: componentType,
            componentIndex: slot.components.length
        }
    });
}

// For MonoBehavior creation:
const monoBehavior = new MonoBehavior(slot, componentData);
changeManager.registerComponent(monoBehavior);
```

### 3. space-props-panel.js
**Current State:**
- Directly calls `sceneManager.setSpaceProperty()` in multiple places
- Manages property editing inline

**Required Changes:**
```javascript
// Replace all setSpaceProperty calls:
// OLD:
sceneManager.setSpaceProperty(key, value, isProtected);

// NEW:
changeManager.queueSpacePropertyChange({
    key: key,
    value: value,
    isProtected: isProtected
});

// In saveProperty():
changeManager.queueSpacePropertyChange({
    key: propKey,
    value: input.value.trim() || savedValue,
    isProtected: isProtected
});

// In saveVector3Prop():
changeManager.queueSpacePropertyChange({
    key: propKey,
    value: vector3Value,
    isProtected: isProtected
});
```

### 4. lifecycle-manager.js
**Current State:**
- Manages MonoBehavior lifecycle events
- No direct property management

**Required Changes:**
```javascript
// In registerMonoBehavior():
registerMonoBehavior(id, scriptContext) {
    this.monoBehaviors.set(id, scriptContext);
    
    // Register with change manager
    changeManager.registerComponent({
        id: id,
        type: 'MonoBehavior',
        context: scriptContext
    });
    
    // ... rest of registration
}

// In unregisterMonoBehavior():
unregisterMonoBehavior(id) {
    // ... existing unregistration
    
    // Unregister from change manager
    changeManager.unregisterComponent(id);
}

// In triggerDestroyForSlot():
triggerDestroyForSlot(slotId) {
    // ... existing destroy logic
    
    // Clean up any pending changes for this slot
    changeManager.clearPendingChangesForSlot(slotId);
}
```

### 5. scene-manager.js
**Current State:**
- Contains `updateUnityComponent()` and `setSpaceProperty()` methods
- Handles both Unity updates and space state sync

**Required Changes:**
```javascript
// Move update logic to change manager handlers
// Remove queueChange-related code from setSpaceProperty

// Subscribe to change manager events:
changeManager.onChangeFlushed(async (changes) => {
    // Process batched changes
    for (const change of changes) {
        if (change.requiresUnityUpdate) {
            await this.applyUnityChange(change);
        }
    }
});

// Simplify setSpaceProperty to just handle space state:
async setSpaceProperty(key, value, isProtected) {
    if (isProtected) {
        this.scene.SetProtectedSpaceProps({ [key]: value });
        this.scene.spaceState.protected[key] = value;
    } else {
        this.scene.SetPublicSpaceProps({ [key]: value });
        this.scene.spaceState.public[key] = value;
    }
}
```

### 6. properties-panel.js
**Current State:**
- Contains its own `queueChange()` and `flushPendingChanges()` methods
- Directly manages property updates

**Required Changes:**
```javascript
// Remove these methods entirely:
// - queueChange()
// - flushPendingChanges()
// - pendingChanges Map
// - updateTimer

// Replace all queueChange calls:
// OLD:
this.queueChange(sceneManager.selectedSlot, componentId, key, value, componentType, componentIndex);

// NEW:
changeManager.queueChange({
    type: 'component',
    targetId: componentId,
    property: key,
    value: value,
    metadata: {
        slotId: sceneManager.selectedSlot,
        componentType: componentType,
        componentIndex: componentIndex
    }
});

// For slot properties:
changeManager.queueChange({
    type: 'slot',
    targetId: slot.id,
    property: 'active',
    value: value,
    metadata: {
        slotId: slot.id
    }
});
```

## New Module: change-manager.js

```javascript
/**
 * Centralized Change Manager
 * Handles all property changes for slots and components
 */

import { sceneManager } from './scene-manager.js';

class ChangeManager {
    constructor() {
        this.pendingChanges = new Map();
        this.updateTimer = null;
        this.changeListeners = new Set();
        this.componentHandlers = new Map();
        this.registeredComponents = new Map();
        this.updateInterval = 100; // ms
    }

    async initialize() {
        // Register default component handlers
        this.registerDefaultHandlers();
    }

    registerDefaultHandlers() {
        // Transform handler
        this.registerComponentHandler('Transform', {
            validate: (property, value) => {
                // Validation logic
            },
            transform: (property, value) => {
                // Value transformation
            },
            apply: async (component, property, value) => {
                // Unity update logic
            }
        });
        
        // Add other component handlers...
    }

    queueChange(change) {
        const key = this.generateChangeKey(change);
        this.pendingChanges.set(key, {
            ...change,
            timestamp: Date.now()
        });
        this.scheduleFlush();
    }

    queueSpacePropertyChange(spaceChange) {
        // Special handling for space properties
        const change = {
            type: 'spaceProperty',
            targetId: spaceChange.key,
            property: 'value',
            value: spaceChange.value,
            metadata: {
                isProtected: spaceChange.isProtected,
                key: spaceChange.key
            }
        };
        this.queueChange(change);
    }

    generateChangeKey(change) {
        if (change.type === 'spaceProperty') {
            return `space_${change.metadata.key}`;
        }
        return `${change.type}_${change.targetId}_${change.property}`;
    }

    generateSpaceKey(change) {
        const slot = sceneManager.getSlotById(change.metadata.slotId);
        if (!slot) return null;
        
        const prefix = '__' + slot.name;
        
        if (change.type === 'component') {
            return `${prefix}/${change.metadata.componentType}/${change.property}:component_${change.targetId}`;
        } else if (change.type === 'slot') {
            return `${prefix}/${change.property}:slot_${change.targetId}`;
        }
        return null;
    }

    scheduleFlush() {
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.flushChanges(), this.updateInterval);
    }

    async flushChanges() {
        if (this.pendingChanges.size === 0) return;
        
        const changes = Array.from(this.pendingChanges.values());
        this.pendingChanges.clear();
        
        // Process changes
        await this.processChanges(changes);
        
        // Notify listeners
        this.notifyListeners(changes);
    }

    async processChanges(changes) {
        // Group changes by type
        const grouped = this.groupChangesByType(changes);
        
        // Process space property changes first
        for (const change of grouped.spaceProperties || []) {
            await this.processSpacePropertyChange(change);
        }
        
        // Process slot changes
        for (const change of grouped.slots || []) {
            await this.processSlotChange(change);
        }
        
        // Process component changes
        for (const change of grouped.components || []) {
            await this.processComponentChange(change);
        }
    }

    async processSpacePropertyChange(change) {
        await sceneManager.setSpaceProperty(
            change.metadata.key,
            change.value,
            change.metadata.isProtected
        );
    }

    async processSlotChange(change) {
        // Generate space key
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey) {
            await sceneManager.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Update Unity if needed
        if (change.property === 'active') {
            await sceneManager.updateUnityObject(change.targetId, change.property, change.value);
        }
    }

    async processComponentChange(change) {
        // Generate space key
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey) {
            await sceneManager.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Apply component-specific handler if available
        const handler = this.componentHandlers.get(change.metadata.componentType);
        if (handler && handler.apply) {
            const component = this.getComponentById(change.targetId);
            if (component) {
                await handler.apply(component, change.property, change.value);
            }
        } else {
            // Default Unity update
            await sceneManager.updateUnityComponent(change.targetId, change.property, change.value);
        }
    }

    groupChangesByType(changes) {
        return changes.reduce((groups, change) => {
            const type = change.type + 's'; // pluralize
            if (!groups[type]) groups[type] = [];
            groups[type].push(change);
            return groups;
        }, {});
    }

    registerComponent(component) {
        this.registeredComponents.set(component.id, component);
    }

    unregisterComponent(componentId) {
        this.registeredComponents.delete(componentId);
    }

    getComponentById(componentId) {
        return this.registeredComponents.get(componentId) || 
               sceneManager.sceneData.componentMap[componentId];
    }

    clearPendingChangesForSlot(slotId) {
        // Remove any pending changes for this slot
        for (const [key, change] of this.pendingChanges) {
            if (change.metadata.slotId === slotId) {
                this.pendingChanges.delete(key);
            }
        }
    }

    onChangeFlushed(callback) {
        this.changeListeners.add(callback);
    }

    notifyListeners(changes) {
        this.changeListeners.forEach(callback => {
            try {
                callback(changes);
            } catch (error) {
                console.error('Error in change listener:', error);
            }
        });
    }

    registerComponentHandler(componentType, handler) {
        this.componentHandlers.set(componentType, handler);
    }

    handleExternalChanges(externalChanges) {
        // Handle changes from external sources (e.g., other clients)
        // This prevents feedback loops when syncing
        console.log('Handling external changes:', externalChanges);
    }
}

// Export singleton instance
export const changeManager = new ChangeManager();
```

## Benefits of These Changes

1. **Centralized Control**: All property changes flow through a single point
2. **Consistent Behavior**: Same handling for all component types
3. **Better Performance**: Batched updates reduce API calls
4. **Easier Debugging**: Single place to log/monitor all changes
5. **Extensibility**: Easy to add new features like undo/redo
6. **Clean Separation**: UI components don't know about Unity/space state details

## Migration Order

1. Create `change-manager.js` module
2. Update `app.js` to initialize change manager
3. Update `properties-panel.js` to use change manager
4. Update `space-props-panel.js` to use change manager
5. Update `component-menu.js` for component creation
6. Update `lifecycle-manager.js` for component lifecycle
7. Refactor `scene-manager.js` to work with change manager
8. Test and debug the integrated system

## Testing Strategy

1. **Unit Tests**: Test change manager in isolation
2. **Integration Tests**: Test property updates end-to-end
3. **Performance Tests**: Ensure batching improves performance
4. **Regression Tests**: Ensure existing functionality still works
5. **Multi-client Tests**: Test synchronization between clients