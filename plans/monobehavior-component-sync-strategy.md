# Global Component Property Sync Strategy

## Overview
This document outlines a better strategy for handling component property changes in the Unity Scene Inspector, moving away from the current `queueChange` implementation in `properties-panel.js` to a more global, unified approach.

## Current Architecture Issues

### 1. Scattered Change Management
- `properties-panel.js` manages its own `pendingChanges` Map and `updateTimer`
- `scene-manager.js` has separate methods for updating Unity objects and components
- No central place to track or manage property changes

### 2. Inconsistent Property Syncing
- Different code paths for different component types
- MonoBehavior components handled differently than regular components
- Space property key generation logic duplicated

### 3. Tight Coupling
- UI components directly manage state synchronization
- Properties panel knows too much about Unity/space state implementation
- Hard to add new features like undo/redo or change history

## Proposed Solution: Centralized Change Manager

### Core Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   UI Layer  │────▶│Change Manager│────▶│Scene Manager │
└─────────────┘     └──────────────┘     └──────────────┘
                            │                      │
                            ▼                      ▼
                    ┌──────────────┐      ┌──────────────┐
                    │Change Events │      │Unity/BS API  │
                    └──────────────┘      └──────────────┘
```

### Key Components

#### 1. Change Manager (New Module)
A singleton service that handles all property changes:

```javascript
// change-manager.js
export class ChangeManager {
    constructor() {
        this.pendingChanges = new Map();
        this.updateTimer = null;
        this.changeListeners = new Set();
        this.componentHandlers = new Map();
        this.updateInterval = 100; // ms
    }

    queueChange(change) {
        const key = this.generateChangeKey(change);
        this.pendingChanges.set(key, change);
        this.scheduleFlush();
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
}
```

#### 2. Standardized Change Object
All changes follow a consistent format:

```javascript
{
    type: 'slot' | 'component',
    targetId: string,              // Slot ID or Component ID
    property: string,              // Property name
    value: any,                    // New value
    metadata: {
        slotId: string,            // Always present
        componentType?: string,    // For component changes
        componentIndex?: number,   // For component changes
        isProtected?: boolean      // For space properties
    }
}
```

#### 3. Component-Specific Handlers
Register handlers for different component types:

```javascript
// Example: Transform component handler
changeManager.registerComponentHandler('Transform', {
    validate(property, value) {
        if (property === 'position' || property === 'localScale') {
            return isVector3Object(value);
        }
        if (property === 'rotation') {
            return isQuaternion(value);
        }
        return false;
    },
    
    transform(property, value) {
        // Convert to Unity-compatible format
        if (property === 'position' || property === 'localScale') {
            return new BS.Vector3(value.x, value.y, value.z);
        }
        if (property === 'rotation') {
            return new BS.Quaternion(value.x, value.y, value.z, value.w);
        }
        return value;
    },
    
    async apply(component, property, value) {
        component[property] = value;
    }
});
```

### Implementation Details

#### 1. Space Property Key Generation
Centralized key generation for consistency:

```javascript
class ChangeManager {
    generateSpaceKey(change) {
        const slot = sceneManager.getSlotById(change.metadata.slotId);
        const prefix = '__' + slot.name;
        
        if (change.type === 'component') {
            return `${prefix}/${change.metadata.componentType}/${change.property}:component_${change.targetId}`;
        }
        return `${prefix}/${change.property}:slot_${change.targetId}`;
    }
}
```

#### 2. Batch Processing
Group changes for efficient processing:

```javascript
async processChanges(changes) {
    // Group by change type
    const grouped = {
        slots: changes.filter(c => c.type === 'slot'),
        components: changes.filter(c => c.type === 'component')
    };
    
    // Process slot changes
    for (const change of grouped.slots) {
        await this.processSlotChange(change);
    }
    
    // Process component changes (can be parallelized)
    await Promise.all(
        grouped.components.map(change => this.processComponentChange(change))
    );
}
```

#### 3. Integration with Existing Code

**Properties Panel Integration:**
```javascript
// Instead of this.queueChange(...)
changeManager.queueChange({
    type: 'component',
    targetId: componentId,
    property: propertyKey,
    value: newValue,
    metadata: {
        slotId: sceneManager.selectedSlot,
        componentType: componentType,
        componentIndex: componentIndex
    }
});
```

**Scene Manager Integration:**
```javascript
// Subscribe to change events
changeManager.onChangeFlushed(async (changes) => {
    for (const change of changes) {
        const spaceKey = changeManager.generateSpaceKey(change);
        await sceneManager.setSpaceProperty(spaceKey, change.value, change.metadata.isProtected);
    }
});
```

### Benefits

1. **Single Source of Truth**: All property changes go through one system
2. **Consistency**: Uniform handling of all component types
3. **Extensibility**: Easy to add new component types or features
4. **Performance**: Batched updates reduce Unity API calls
5. **Maintainability**: Clear separation of concerns
6. **Features**: Foundation for undo/redo, change history, etc.

### Migration Strategy

1. **Phase 1**: Create `change-manager.js` module
2. **Phase 2**: Update `properties-panel.js` to use change manager
3. **Phase 3**: Move space property sync logic to change manager
4. **Phase 4**: Add component-specific handlers
5. **Phase 5**: Remove old `queueChange` implementation

### Future Enhancements

- **Undo/Redo System**: Track change history
- **Change Validation**: Validate changes before applying
- **Conflict Resolution**: Handle concurrent changes
- **Performance Monitoring**: Track update times
- **Change Compression**: Merge rapid consecutive changes
- **Offline Support**: Queue changes when disconnected

## Conclusion

This centralized approach provides a cleaner, more maintainable architecture for handling component property changes. It separates concerns properly, makes the codebase more extensible, and provides a foundation for advanced features while maintaining compatibility with the existing Unity/BanterScript integration.