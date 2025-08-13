---
sidebar_position: 4
title: Change Management
---

# Change Management System

The Change Management system provides comprehensive undo/redo functionality and tracks all modifications to your VR scene. Every action is reversible, giving you confidence to experiment.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>💡 Key Concept</h3>
  <p>Every action in the inspector is encapsulated as a Change object that knows how to apply itself and how to reverse itself. This enables unlimited undo/redo and multiplayer synchronization.</p>
</div>

## Understanding Changes

### What is a Change?
A Change is an atomic, reversible operation that modifies the scene. Each Change contains:
- **Forward operation**: How to apply the change
- **Reverse operation**: How to undo the change
- **Metadata**: Timestamp, user, description

### The Command Pattern
The system uses the Command design pattern:

```javascript
class Change {
  constructor() {
    this.timestamp = Date.now();
    this.userId = currentUser.id;
  }
  
  async apply() {
    // Implement forward operation
  }
  
  async undo() {
    // Implement reverse operation
  }
  
  async redo() {
    // Re-apply after undo
    return this.apply();
  }
}
```

## Types of Changes

### Property Changes
Modify component properties:

```javascript
class ComponentPropertyChange extends Change {
  constructor(componentId, property, newValue) {
    super();
    this.componentId = componentId;
    this.property = property;
    this.newValue = newValue;
    this.oldValue = this.captureOldValue();
  }
  
  async apply() {
    await setComponentProperty(this.componentId, this.property, this.newValue);
  }
  
  async undo() {
    await setComponentProperty(this.componentId, this.property, this.oldValue);
  }
}
```

### Structural Changes
Modify scene hierarchy:

```javascript
class AddEntityChange extends Change {
  constructor(entityType, parentId, properties) {
    super();
    this.entityType = entityType;
    this.parentId = parentId;
    this.properties = properties;
    this.createdEntityId = null;
  }
  
  async apply() {
    this.createdEntityId = await createEntity(this.entityType, this.parentId, this.properties);
    return this.createdEntityId;
  }
  
  async undo() {
    if (this.createdEntityId) {
      await deleteEntity(this.createdEntityId);
    }
  }
}
```

### Component Changes
Add/remove components:

```javascript
class AddComponentChange extends Change {
  constructor(entityId, componentType, properties) {
    super();
    this.entityId = entityId;
    this.componentType = componentType;
    this.properties = properties;
    this.componentId = null;
  }
  
  async apply() {
    this.componentId = await addComponent(this.entityId, this.componentType, this.properties);
  }
  
  async undo() {
    if (this.componentId) {
      await removeComponent(this.componentId);
    }
  }
}
```

## Change History

### History Stack
The ChangeManager maintains two stacks:

```javascript
class ChangeManager {
  constructor() {
    this.undoStack = [];  // Completed changes
    this.redoStack = [];  // Undone changes
    this.maxHistory = 100; // Limit memory usage
  }
  
  async executeChange(change) {
    await change.apply();
    this.undoStack.push(change);
    this.redoStack = []; // Clear redo stack
    this.limitHistory();
    this.notifyListeners();
  }
}
```

### Undo/Redo Operations

```javascript
// Undo last change
async undo() {
  if (this.undoStack.length === 0) return;
  
  const change = this.undoStack.pop();
  await change.undo();
  this.redoStack.push(change);
  this.notifyListeners();
}

// Redo last undone change
async redo() {
  if (this.redoStack.length === 0) return;
  
  const change = this.redoStack.pop();
  await change.redo();
  this.undoStack.push(change);
  this.notifyListeners();
}
```

## Batch Changes

### Grouping Related Changes
Multiple changes can be grouped as one undo/redo operation:

```javascript
class BatchChange extends Change {
  constructor(changes, description) {
    super();
    this.changes = changes;
    this.description = description;
  }
  
  async apply() {
    for (const change of this.changes) {
      await change.apply();
    }
  }
  
  async undo() {
    // Undo in reverse order
    for (let i = this.changes.length - 1; i >= 0; i--) {
      await this.changes[i].undo();
    }
  }
}

// Usage
const batch = new BatchChange([
  new ComponentPropertyChange(id1, "position", {x: 10}),
  new ComponentPropertyChange(id2, "rotation", {y: 45}),
  new ComponentPropertyChange(id3, "scale", {x: 2, y: 2, z: 2})
], "Transform multiple objects");
```

## Multiplayer Synchronization

### Broadcasting Changes
Changes are automatically broadcast to other users:

```javascript
class NetworkedChange extends Change {
  async apply() {
    const result = await super.apply();
    
    // Broadcast to other users
    network.broadcast({
      type: "CHANGE_APPLIED",
      change: this.serialize(),
      userId: this.userId
    });
    
    return result;
  }
  
  serialize() {
    return {
      type: this.constructor.name,
      data: this.getChangeData(),
      timestamp: this.timestamp
    }
  }
}
```

### Receiving Remote Changes
Handle changes from other users:

```javascript
network.on("CHANGE_APPLIED", async (data) => {
  // Don't add to undo stack (not our change)
  const change = deserializeChange(data.change);
  await change.apply();
  
  // Update UI to reflect change
  updateUI(change);
});
```

### Conflict Resolution

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>📊 Conflict Resolution Diagram</strong></p>
    <p>Flowchart showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
      <li>User A and User B making simultaneous changes</li>
      <li>Conflict detection</li>
      <li>Resolution strategies (Last Write Wins, Merge, Priority)</li>
      <li>Final synchronized state</li>
    </ul>
  </div>
</div>

## Change Validation

### Pre-Change Validation
Validate before applying:

```javascript
class ValidatedChange extends Change {
  async validate() {
    // Override in subclasses
    return true;
  }
  
  async apply() {
    if (!await this.validate()) {
      throw new Error("Change validation failed");
    }
    return super.apply();
  }
}

class SetPositionChange extends ValidatedChange {
  async validate() {
    // Check bounds
    if (Math.abs(this.newValue.x) > 1000) return false;
    if (Math.abs(this.newValue.y) > 1000) return false;
    if (Math.abs(this.newValue.z) > 1000) return false;
    return true;
  }
}
```

## Persistence

### Saving History
Save change history for recovery:

```javascript
// Save to localStorage
function saveHistory() {
  const history = {
    undoStack: changeManager.undoStack.map(c => c.serialize()),
    timestamp: Date.now()
  };
  localStorage.setItem("changeHistory", JSON.stringify(history));
}

// Restore on page reload
function restoreHistory() {
  const saved = localStorage.getItem("changeHistory");
  if (saved) {
    const history = JSON.parse(saved);
    changeManager.restoreFromSerialized(history);
  }
}
```

### Exporting Changes
Export as replayable script:

```javascript
function exportChanges() {
  const script = changeManager.undoStack.map(change => {
    return `await ${change.toCode()};`;
  }).join('\n');
  
  return `
// Replay script generated ${new Date().toISOString()}
async function replay() {
  ${script}
}
`;
}
```

## Performance Optimization

### Memory Management
Limit history size:

```javascript
limitHistory() {
  if (this.undoStack.length > this.maxHistory) {
    // Remove oldest changes
    const toRemove = this.undoStack.length - this.maxHistory;
    this.undoStack.splice(0, toRemove);
  }
}
```

### Lazy Loading
Load change details on demand:

```javascript
class LazyChange extends Change {
  constructor(changeId) {
    super();
    this.changeId = changeId;
    this.loaded = false;
    this.data = null;
  }
  
  async load() {
    if (!this.loaded) {
      this.data = await fetchChangeData(this.changeId);
      this.loaded = true;
    }
  }
  
  async apply() {
    await this.load();
    // Apply using loaded data
  }
}
```

## Custom Change Types

### Creating Custom Changes
Extend the base Change class:

```javascript
class PlaySoundChange extends Change {
  constructor(soundUrl, volume) {
    super();
    this.soundUrl = soundUrl;
    this.volume = volume;
    this.audio = null;
  }
  
  async apply() {
    this.audio = new Audio(this.soundUrl);
    this.audio.volume = this.volume;
    await this.audio.play();
  }
  
  async undo() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}
```

### Registering Change Types
Register for deserialization:

```javascript
ChangeManager.registerChangeType("PlaySoundChange", PlaySoundChange);

// Now can deserialize
const data = {type: "PlaySoundChange", soundUrl: "beep.mp3", volume: 0.5};
const change = ChangeManager.deserialize(data);
```

## Debugging Changes

### Change Logging
Track all changes:

```javascript
changeManager.on("change-applied", (change) => {
  console.log(`[CHANGE] ${change.constructor.name}`, {
    timestamp: new Date(change.timestamp),
    user: change.userId,
    data: change.getDebugInfo()
  });
});
```

### History Visualization
Display change history:

```javascript
function renderHistory() {
  const history = changeManager.getHistory();
  return `
    <div class="history">
      <h3>Recent Changes (${history.length})</h3>
      ${history.map(change => `
        <div class="change-item">
          <span class="type">${change.type}</span>
          <span class="time">${formatTime(change.timestamp)}</span>
          <button onclick="revert('${change.id}')">Revert</button>
        </div>
      `).join('')}
    </div>
  `;
}
```

## Best Practices

### 1. Atomic Changes
Keep changes small and focused:
- ✅ One property per change
- ✅ Clear description
- ❌ Multiple unrelated modifications

### 2. Validation
Always validate before applying:
- Check permissions
- Verify data integrity
- Validate bounds/limits

### 3. Error Handling
Handle failures gracefully:
```javascript
try {
  await change.apply();
} catch (error) {
  console.error("Change failed:", error);
  // Rollback if needed
  await change.undo();
}
```

### 4. Documentation
Document custom changes:
```javascript
/**
 * Changes the material color with animation
 * @param {string} entityId - Target entity
 * @param {Color} newColor - Target color
 * @param {number} duration - Animation duration in ms
 */
class AnimatedColorChange extends Change {
  // Implementation
}
```

## Next Steps

Continue with:
- [Multiplayer Sync](./multiplayer-sync) - Real-time collaboration
- [Scripting Guide](/docs/scripting/) - Creating behaviors
- [API Reference](/docs/api/) - Complete Change API