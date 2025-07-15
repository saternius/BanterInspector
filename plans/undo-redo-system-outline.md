# Undo/Redo System Implementation Outline

## Overview
The undo/redo system will integrate with the existing Change Manager to provide comprehensive history tracking and state restoration for all property changes in the Unity Scene Inspector. The system will distinguish between user-initiated changes (which should be undoable) and automated/programmatic changes (which should not clutter the history).

## Architecture Design

### 1. Core Components

#### 1.1 History Manager
```javascript
class HistoryManager {
    constructor() {
        this.undoStack = [];      // Stack of change batches
        this.redoStack = [];      // Stack for redo operations
        this.maxHistorySize = 100; // Configurable limit
        this.currentBatch = null;  // Current batch being recorded
        this.isApplyingHistory = false; // Prevent recursion
        this.automatedSources = new Set([
            'monobehavior-update',
            'animation',
            'physics-simulation',
            'script-automation'
        ]); // Sources that shouldn't be tracked
    }
}
```

#### 1.2 Change Batch Structure
```javascript
{
    id: string,              // Unique batch ID
    timestamp: number,       // When the batch was created
    description: string,     // Human-readable description
    changes: [              // Array of atomic changes
        {
            type: 'property',
            forward: {      // Change to apply
                target: { type, id },
                property: string,
                newValue: any
            },
            reverse: {      // Change to undo
                target: { type, id },
                property: string,
                oldValue: any
            }
        }
    ],
    metadata: {
        user: string,       // Who made the change
        source: string,     // Where it originated (UI, script, etc.)
        isAutomated: boolean, // Flag for automated changes
        trackingMode: 'user' | 'automated' | 'all'
    }
}
```

### 2. Change Source Tracking

#### 2.1 Inspector-Only Change Tracking
The history system will ONLY track changes made through the inspector UI:
- **Tracked**: Manual property edits in properties panel
- **Tracked**: Space property modifications in space props panel
- **Tracked**: Hierarchy changes (add/delete/rename slots)
- **Tracked**: Component additions/deletions via UI
- **NOT Tracked**: MonoBehavior script updates
- **NOT Tracked**: Animation system changes
- **NOT Tracked**: Physics simulation updates
- **NOT Tracked**: Network synchronization
- **NOT Tracked**: Any programmatic API calls

#### 2.2 Change Source Identification
```javascript
// Enhanced change object to identify UI-originated changes
{
    type: 'component',
    targetId: string,
    property: string,
    value: any,
    metadata: {
        slotId: string,
        componentType: string,
        componentIndex: number,
        source: 'inspector-ui' | 'programmatic',  // Source identification
        uiContext?: {
            panelType: 'properties' | 'space-props' | 'hierarchy',
            inputElement?: string,  // ID of the input that triggered change
            eventType?: string      // 'change', 'blur', 'click', etc.
        }
    }
}
```

### 3. Integration Points

#### 3.1 UI-Specific Change Tracking
Each UI panel must explicitly mark changes as inspector-originated:

```javascript
// In properties-panel.js
changeManager.queueChange({
    type: 'component',
    targetId: componentId,
    property: key,
    value: newValue,
    metadata: {
        slotId: sceneManager.selectedSlot,
        componentType: componentType,
        componentIndex: componentIndex,
        source: 'inspector-ui',  // Mark as UI change
        uiContext: {
            panelType: 'properties',
            inputElement: input.id,
            eventType: 'change'
        }
    }
});

// In space-props-panel.js
changeManager.queueSpacePropertyChange({
    key: key,
    value: value,
    isProtected: isProtected,
    source: 'inspector-ui',  // Mark as UI change
    uiContext: {
        panelType: 'space-props',
        eventType: 'save'
    }
});
```

#### 3.2 Change Manager Filtering
```javascript
// In ChangeManager
queueChange(change) {
    const key = this.generateChangeKey(change);
    
    // Only record history for inspector UI changes
    if (change.metadata?.source === 'inspector-ui' && 
        !this.historyManager.isApplyingHistory) {
        this.historyManager.prepareChangeRecord(change);
    }
    
    this.pendingChanges.set(key, {
        ...change,
        timestamp: Date.now()
    });
    this.scheduleFlush();
}
```

#### 3.3 Programmatic Change Exclusion
```javascript
// Example: MonoBehavior updates are NOT tracked
// In monobehavior.js
updateVar(varName, value) {
    if (this.properties.vars.hasOwnProperty(varName)) {
        this.properties.vars[varName] = value;
        
        // Note: No source: 'inspector-ui' means this won't be tracked
        changeManager.queueChange({
            type: 'component',
            targetId: this.id,
            property: 'vars',
            value: this.properties.vars,
            metadata: {
                slotId: this.slot.id,
                componentType: 'MonoBehavior',
                source: 'programmatic'  // Explicitly programmatic
            }
        });
    }
}

### 4. Implementation Strategy

#### 4.1 Phase 1: Inspector-Only Undo/Redo
1. **Mark UI Changes at Source**
   - Update all UI input handlers to include `source: 'inspector-ui'`
   - Add context information (panel type, input element)
   - Ensure programmatic changes lack this marker

2. **Filter in Change Manager**
   - Check for `source: 'inspector-ui'` before recording
   - Ignore all changes without this marker
   - Prevent memory bloat from animation/script updates

3. **Implement Basic Undo/Redo**
   - Pop from undo stack
   - Apply reverse changes with `isApplyingHistory` flag
   - Push to redo stack

#### 3.2 Phase 2: Advanced Features
1. **Batch Operations**
   - Group related changes (e.g., multi-select edits)
   - Transaction-style API for complex operations
   - Named operations for clarity

2. **Selective Undo**
   - Undo specific changes without affecting others
   - Conflict resolution when changes overlap
   - Visual indication of what will be undone

3. **History Visualization**
   - Timeline view of all changes
   - Filter by component, property, or time
   - Preview changes before applying

### 4. State Management

#### 4.1 State Snapshots
```javascript
class StateSnapshot {
    constructor() {
        this.slots = new Map();      // Slot states
        this.components = new Map();  // Component states
        this.spaceProps = {
            public: {},
            protected: {}
        };
        this.timestamp = Date.now();
    }
    
    captureFromScene() {
        // Deep clone current scene state
    }
    
    restoreTo(sceneManager) {
        // Apply snapshot to scene
    }
}
```

#### 4.2 Incremental vs Full Snapshots
- Incremental: Store only changed properties
- Full: Complete state at specific points
- Hybrid: Full snapshots at intervals, incremental between

### 5. User Interface

#### 5.1 Keyboard Shortcuts
- Ctrl/Cmd + Z: Undo
- Ctrl/Cmd + Shift + Z: Redo
- Ctrl/Cmd + Y: Redo (alternative)

#### 5.2 UI Components
```html
<!-- History Panel -->
<div class="history-panel">
    <div class="history-controls">
        <button id="undoBtn" title="Undo (Ctrl+Z)">↶</button>
        <button id="redoBtn" title="Redo (Ctrl+Shift+Z)">↷</button>
        <button id="historyBtn" title="Show History">📜</button>
    </div>
    
    <div class="history-list">
        <!-- Dynamic list of recent changes -->
    </div>
</div>
```

#### 5.3 Visual Feedback
- Highlight changed properties
- Show preview of undo/redo effects
- Animate property changes

### 6. Implementation Details

#### 6.1 Change Recording
```javascript
class HistoryManager {
    recordChange(change, oldValue) {
        // Start new batch if needed
        if (!this.currentBatch || this.shouldStartNewBatch()) {
            this.commitCurrentBatch();
            this.currentBatch = this.createBatch();
        }
        
        // Add change to current batch
        this.currentBatch.changes.push({
            type: 'property',
            forward: {
                target: { type: change.type, id: change.targetId },
                property: change.property,
                newValue: this.cloneValue(change.value)
            },
            reverse: {
                target: { type: change.type, id: change.targetId },
                property: change.property,
                oldValue: this.cloneValue(oldValue)
            }
        });
    }
}
```

#### 6.2 Undo Implementation
```javascript
async undo() {
    if (this.undoStack.length === 0) return;
    
    const batch = this.undoStack.pop();
    this.isApplyingHistory = true;
    
    try {
        // Apply reverse changes in reverse order
        for (let i = batch.changes.length - 1; i >= 0; i--) {
            const change = batch.changes[i];
            await this.applyReverse(change);
        }
        
        // Move to redo stack
        this.redoStack.push(batch);
    } finally {
        this.isApplyingHistory = false;
    }
}
```

### 7. Special Considerations

#### 7.1 Memory Management Benefits
By tracking only inspector UI changes:
- **Drastically reduced memory usage** - No continuous animation data
- **Cleaner history** - Only meaningful user actions
- **Better performance** - Fewer changes to process
- **Predictable memory growth** - Only grows with user actions

Example memory savings:
```javascript
// NOT tracked (would be thousands of changes per minute):
// - MonoBehavior updating position every frame (30-60 fps)
// - Physics simulation updates
// - Network sync updates
// - Animation system transforms

// ONLY tracked (sparse, user-driven):
// - User changes position in inspector
// - User toggles a checkbox
// - User modifies space properties
```

#### 7.2 Component Creation/Deletion
- Store complete component data for recreation
- Handle parent-child relationships
- Preserve component IDs where possible
- Track only UI-initiated additions/deletions

#### 7.3 Complex Properties
- Vector3/Quaternion: Store all components
- Colors: Preserve alpha channel
- Arrays: Track additions, deletions, reordering
- Only when modified through inspector UI

#### 7.4 Performance Optimization
- Minimal processing overhead (only UI events)
- No need for aggressive compression
- History size limited by user actions, not time

### 8. Error Handling

#### 8.1 Conflict Resolution
```javascript
canApplyChange(change) {
    // Check if target still exists
    // Validate property is still applicable
    // Check for type compatibility
}

handleConflict(change, error) {
    // Skip if target deleted
    // Attempt value conversion
    // Log and notify user
}
```

#### 8.2 Recovery Mechanisms
- Checkpoint system for safe states
- Corruption detection
- Fallback to last known good state

### 9. Testing Strategy

#### 9.1 Unit Tests
- Test each atomic operation
- Verify state consistency
- Test edge cases (empty stacks, conflicts)

#### 9.2 Integration Tests
- Multi-step undo/redo sequences
- Concurrent changes
- Performance under load

#### 9.3 User Acceptance Tests
- Intuitive behavior
- Performance perception
- Error message clarity

### 10. Future Enhancements

#### 10.1 Collaborative Undo
- Track changes per user
- Selective undo by user
- Merge conflict resolution

#### 10.2 Smart Grouping
- AI-powered change grouping
- Semantic operation detection
- Natural language descriptions

#### 10.3 Time Travel Debugging
- Replay changes in real-time
- Breakpoints in history
- State comparison tools

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Create HistoryManager class
2. Integrate with ChangeManager
3. Implement basic undo/redo
4. Add keyboard shortcuts

### Phase 2: UI Integration (Week 3)
1. Add undo/redo buttons
2. Create history panel
3. Implement visual feedback
4. Add operation descriptions

### Phase 3: Advanced Features (Week 4-5)
1. Implement batch operations
2. Add complex property support
3. Create history visualization
4. Implement selective undo

### Phase 4: Polish & Testing (Week 6)
1. Performance optimization
2. Error handling improvements
3. Comprehensive testing
4. Documentation

## Code Example: Inspector-Only Integration

```javascript
// history-manager.js
export class HistoryManager {
    constructor(changeManager) {
        this.changeManager = changeManager;
        this.undoStack = [];
        this.redoStack = [];
        this.currentBatch = null;
        this.batchTimeout = null;
        this.setupIntegration();
    }
    
    setupIntegration() {
        // Hook into change manager - only UI changes
        this.changeManager.beforeFlush = (changes) => {
            if (!this.isApplyingHistory) {
                // Filter for inspector UI changes only
                const uiChanges = changes.filter(c => 
                    c.metadata?.source === 'inspector-ui'
                );
                
                if (uiChanges.length > 0) {
                    this.recordBatch(uiChanges);
                }
            }
        };
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
            }
        });
    }
    
    recordBatch(changes) {
        // Group changes within 500ms window
        if (this.currentBatch) {
            this.currentBatch.changes.push(...changes);
        } else {
            this.currentBatch = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                changes: changes,
                description: this.generateDescription(changes)
            };
        }
        
        // Reset batch timer
        clearTimeout(this.batchTimeout);
        this.batchTimeout = setTimeout(() => {
            if (this.currentBatch) {
                this.undoStack.push(this.currentBatch);
                this.redoStack = []; // Clear redo on new change
                
                // Show user feedback
                this.showHistoryNotification(
                    `Recorded: ${this.currentBatch.description}`
                );
                
                this.currentBatch = null;
                
                // Limit stack size
                if (this.undoStack.length > this.maxHistorySize) {
                    this.undoStack.shift();
                }
            }
        }, 500);
    }
    
    generateDescription(changes) {
        // Create human-readable description
        const panels = new Set(changes.map(c => 
            c.metadata?.uiContext?.panelType
        ));
        
        if (panels.has('properties')) {
            return `Modified ${changes.length} properties`;
        } else if (panels.has('space-props')) {
            return `Updated space properties`;
        } else if (panels.has('hierarchy')) {
            return `Changed hierarchy`;
        }
        return `Made ${changes.length} changes`;
    }
    
    async undo() {
        if (this.undoStack.length === 0) {
            this.showHistoryNotification('Nothing to undo');
            return;
        }
        
        const batch = this.undoStack.pop();
        this.isApplyingHistory = true;
        
        try {
            // Apply all reverse changes
            for (const entry of batch.changes.reverse()) {
                await this.applyReverse(entry);
            }
            
            this.redoStack.push(batch);
            this.showHistoryNotification(`Undone: ${batch.description}`);
        } finally {
            this.isApplyingHistory = false;
        }
    }
}

// Usage in properties-panel.js
input.onchange = () => {
    changeManager.queueChange({
        type: 'component',
        targetId: componentId,
        property: key,
        value: input.checked,
        metadata: {
            slotId: sceneManager.selectedSlot,
            componentType: componentType,
            componentIndex: componentIndex,
            source: 'inspector-ui',  // Critical: marks as UI change
            uiContext: {
                panelType: 'properties',
                inputElement: 'checkbox-' + key,
                eventType: 'change'
            }
        }
    });
};
```

## Conclusion

This inspector-focused undo/redo system provides an efficient and user-friendly foundation for state management in the Scene Inspector. By tracking only manual UI changes and excluding automated/programmatic updates, the system:

1. **Maintains minimal memory footprint** - No tracking of continuous animations or script updates
2. **Provides meaningful history** - Every entry represents an intentional user action
3. **Ensures predictable performance** - History grows only with user interactions, not time
4. **Simplifies implementation** - Clear distinction between UI and programmatic changes

This approach ensures that users can confidently undo/redo their manual edits without the system being overwhelmed by automated changes from MonoBehavior scripts, animations, or physics simulations.
