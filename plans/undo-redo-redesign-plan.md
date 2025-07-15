# Simplified Undo/Redo System Redesign Plan

## Current Issues
1. **Overengineered batching system** - Complex timeout-based batching that adds unnecessary complexity
2. **Circular dependencies** - History manager and change manager have complex interdependencies
3. **Complex change tracking** - Multiple layers of change recording and transformation
4. **Unclear separation of concerns** - History logic spread across multiple files

## Design Principles
1. **Simplicity first** - Remove batching complexity since changes come at modest pace
2. **Clear data flow** - Unidirectional flow from UI → Change Manager → History Manager
3. **Maintainable code** - Easy to understand and extend
4. **Type safety** - Clear interfaces for changes and history entries

## Simplified Architecture

### 1. Single History Entry per User Action
Instead of batching, each user action creates one history entry immediately:
```javascript
class SimpleHistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 100;
        this.isApplying = false;
    }
    
    recordChange(change, oldValue) {
        if (this.isApplying) return;
        
        const entry = {
            id: Date.now(),
            timestamp: Date.now(),
            description: this.describeChange(change),
            forward: { ...change },
            reverse: this.createReverseChange(change, oldValue)
        };
        
        this.undoStack.push(entry);
        this.redoStack = []; // Clear redo on new change
        
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        
        this.updateUI();
    }
}
```

### 2. Clear Change Types
Define explicit change types with clear data structures:
```javascript
// Change type definitions
const ChangeTypes = {
    PROPERTY: 'property',      // Component or slot property change
    COMPONENT_ADD: 'component_add',
    COMPONENT_REMOVE: 'component_remove',
    SLOT_ADD: 'slot_add',
    SLOT_REMOVE: 'slot_remove',
    SLOT_RENAME: 'slot_rename',
    SPACE_PROPERTY: 'space_property'
};

// Standard change format
interface Change {
    type: ChangeTypes,
    targetId: string,
    targetType: 'slot' | 'component' | 'space',
    property?: string,
    newValue: any,
    oldValue: any,
    metadata: {
        slotId?: string,
        componentType?: string,
        isProtected?: boolean,
        description: string
    }
}
```

### 3. Direct Integration with Change Manager
Remove complex hooks and callbacks:
```javascript
class ChangeManager {
    constructor(historyManager) {
        this.historyManager = historyManager;
        this.pendingChanges = new Map();
        this.flushTimer = null;
    }
    
    queueChange(change) {
        // Only track UI-initiated changes
        if (change.source !== 'inspector-ui') return;
        
        // Get old value before change
        const oldValue = this.getCurrentValue(change);
        
        // Queue the change
        const key = this.getChangeKey(change);
        this.pendingChanges.set(key, change);
        
        // Record in history immediately (no batching)
        this.historyManager.recordChange(change, oldValue);
        
        // Schedule flush
        this.scheduleFlush();
    }
}
```

### 4. Simplified Undo/Redo Operations
Direct application without complex event systems:
```javascript
async undo() {
    if (this.undoStack.length === 0) return;
    
    const entry = this.undoStack.pop();
    this.isApplying = true;
    
    try {
        // Apply reverse change directly
        await this.applyChange(entry.reverse);
        
        // Move to redo stack
        this.redoStack.push(entry);
        
        // Update UI
        this.showNotification(`Undone: ${entry.description}`);
    } finally {
        this.isApplying = false;
    }
}

async applyChange(change) {
    switch (change.type) {
        case ChangeTypes.PROPERTY:
            return this.applyPropertyChange(change);
        case ChangeTypes.COMPONENT_ADD:
            return this.applyComponentAdd(change);
        // ... other cases
    }
}
```

### 5. Cleaner State Capture
Simplified state capture for complex operations:
```javascript
captureComponentState(component) {
    return {
        id: component.id,
        type: component.type,
        properties: { ...component.properties }
    };
}

captureSlotState(slot) {
    return {
        id: slot.id,
        name: slot.name,
        active: slot.active,
        persistent: slot.persistent,
        parentId: slot.parentId,
        components: slot.components.map(c => this.captureComponentState(c))
    };
}
```

## Implementation Steps

### Phase 1: Core Refactor (Priority: High)
1. **Create new SimpleHistoryManager class**
   - Remove batching logic
   - Implement direct recording
   - Clean undo/redo methods

2. **Refactor ChangeManager**
   - Remove beforeFlush hook
   - Direct history recording
   - Simplify change processing

3. **Define clear change interfaces**
   - TypeScript-style interfaces in comments
   - Consistent change format
   - Clear metadata structure

### Phase 2: Integration (Priority: High)
1. **Update UI panels to use new format**
   - Consistent change creation
   - Always include source: 'inspector-ui'
   - Include descriptive metadata

2. **Implement reverse change creation**
   - Property changes: swap old/new values
   - Add/remove: inverse operations
   - Move operations: restore previous parent

3. **Test with existing UI**
   - Verify all operations work
   - Check memory usage
   - Ensure UI updates properly

### Phase 3: Enhancement (Priority: Medium)
1. **Add operation descriptions**
   - Human-readable change descriptions
   - Show in UI tooltips
   - Include in notifications

2. **Improve error handling**
   - Graceful failure for missing targets
   - Skip invalid operations
   - User-friendly error messages

3. **Add history visualization**
   - Simple list of recent changes
   - Click to jump to state
   - Clear history option

## Benefits of New Design

1. **Reduced Complexity**
   - No batching timeouts
   - Direct change recording
   - Clear data flow

2. **Better Maintainability**
   - Easy to understand code
   - Clear separation of concerns
   - Minimal interdependencies

3. **Improved Performance**
   - No unnecessary timers
   - Direct state application
   - Efficient memory usage

4. **Easier Extension**
   - Add new change types easily
   - Clear integration points
   - Modular design

## Migration Strategy

1. **Create new files alongside existing**
   - simple-history-manager.js
   - Keep existing files during transition

2. **Switch one panel at a time**
   - Start with properties panel
   - Then space properties
   - Finally hierarchy operations

3. **Remove old system once stable**
   - Delete history-manager.js
   - Clean up change-manager.js
   - Update imports

This simplified design will make the undo/redo system much more maintainable while providing the same functionality for users.