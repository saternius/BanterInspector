---
sidebar_position: 3
title: BanterScript Bridge
---

# The BanterScript Bridge

The BanterScript (BS) Bridge is the real-time communication channel between your web browser and Unity. It's what makes live editing possible.

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>🔄 Architecture Diagram Placeholder</strong></p>
    <p>Diagram showing data flow:</p>
    <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
      <li>Browser Inspector (left)</li>
      <li>BanterScript Bridge (center, bidirectional arrows)</li>
      <li>Unity Runtime (right)</li>
      <li>WebSocket connection indicators</li>
      <li>Message queue visualization</li>
    </ul>
  </div>
</div>

## How It Works

### Connection Flow
1. **Initialization**: Inspector loads in browser
2. **Library Loading**: BanterScript library injected
3. **Handshake**: Browser establishes connection with Unity
4. **Sync**: Initial scene state transferred
5. **Ready**: Real-time editing enabled

### Communication Protocol
The bridge uses a message-based protocol:

```javascript
// Browser → Unity
{
  type: "SET_PROPERTY",
  target: "entity_123",
  component: "transform",
  property: "position",
  value: {x: 10, y: 5, z: 0}
}

// Unity → Browser  
{
  type: "PROPERTY_CHANGED",
  target: "entity_123",
  component: "transform",
  property: "position",
  value: {x: 10, y: 5, z: 0}
}
```

## Core Bridge Functions

### Scene Operations

#### Getting Scene Data
```javascript
// Get entire scene hierarchy
const scene = await BS.getScene();

// Get specific entity
const entity = await BS.getEntity(entityId);

// Get all entities with component
const boxes = await BS.getEntitiesWithComponent("BanterBox");
```

#### Creating Objects
```javascript
// Create new entity
const newEntity = await BS.createEntity({
  type: "GameObject",
  name: "MyObject",
  parent: parentId
});

// Add component
await BS.addComponent(entityId, "BanterBox", {
  width: 2,
  height: 2,
  depth: 2
});
```

#### Modifying Objects
```javascript
// Set property
await BS.setProperty(entityId, componentId, "color", {
  r: 1, g: 0, b: 0, a: 1
});

// Remove component
await BS.removeComponent(componentId);

// Delete entity
await BS.deleteEntity(entityId);
```

### Event System

#### Listening to Events
```javascript
// Scene events
BS.on("entity-created", (data) => {
  console.log("New entity:", data.entityId);
});

BS.on("component-added", (data) => {
  console.log("Component added:", data.componentType);
});

// Interaction events
BS.on("user-clicked", (data) => {
  console.log("User clicked:", data.entityId);
});
```

#### Triggering Events
```javascript
// Send custom event to Unity
BS.emit("custom-event", {
  type: "achievement",
  value: "first_object_created"
});
```

## Message Types

### Outgoing (Browser → Unity)

| Message Type | Description | Payload |
|--------------|-------------|---------|
| `CREATE_SLOT` | Create new GameObject | `{type, name, parent}` |
| `DELETE_SLOT` | Remove GameObject | `{entityId}` |
| `SET_PROPERTY` | Change component property | `{entityId, componentId, property, value}` |
| `ADD_COMPONENT` | Add component to entity | `{entityId, componentType, properties}` |
| `REMOVE_COMPONENT` | Remove component | `{componentId}` |
| `EXECUTE_METHOD` | Call Unity method | `{target, method, args}` |

### Incoming (Unity → Browser)

| Message Type | Description | Payload |
|--------------|-------------|---------|
| `SCENE_STATE` | Full scene hierarchy | `{entities, components}` |
| `SLOT_CREATED` | New GameObject created | `{entityId, parentId, data}` |
| `PROPERTY_CHANGED` | Property value updated | `{componentId, property, value}` |
| `COMPONENT_ADDED` | Component attached | `{entityId, componentId, type}` |
| `ERROR` | Operation failed | `{message, code, details}` |

## Synchronization

### Initial Sync
When the inspector connects, it receives the complete scene state:

```javascript
{
  type: "SCENE_STATE",
  data: {
    rootEntity: "scene_root",
    entities: {
      "entity_1": {
        name: "Cube",
        parent: "scene_root",
        components: ["transform_1", "box_1", "material_1"]
      }
    },
    components: {
      "transform_1": {
        type: "Transform",
        properties: {
          position: {x: 0, y: 0, z: 0},
          rotation: {x: 0, y: 0, z: 0},
          scale: {x: 1, y: 1, z: 1}
        }
      }
    }
  }
}
```

### Delta Updates
After initial sync, only changes are transmitted:

```javascript
// Efficient property update
{
  type: "PROPERTY_CHANGED",
  componentId: "transform_1",
  property: "position.x",
  value: 5,
  timestamp: 1634567890123
}
```

### Conflict Resolution
When multiple users edit simultaneously:

1. **Last Write Wins**: Most recent change takes precedence
2. **Optimistic Updates**: Apply locally, reconcile if conflict
3. **Operation Transform**: Complex edits merged intelligently

## Performance Optimization

### Message Batching
Multiple changes are grouped:

```javascript
// Instead of sending 3 messages
BS.batchOperations(() => {
  entity.setPosition({x: 10, y: 0, z: 0});
  entity.setRotation({x: 0, y: 45, z: 0});
  entity.setScale({x: 2, y: 2, z: 2});
}); // Sends 1 batched message
```

### Throttling
High-frequency updates are throttled:

```javascript
// Mouse drag updates throttled to 30fps
let throttleTimer;
function onMouseMove(e) {
  if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      BS.setProperty(entityId, "transform", "position", mouseToWorld(e));
      throttleTimer = null;
    }, 33); // ~30fps
  }
}
```

### Compression
Large payloads are compressed:

```javascript
// Automatically compressed if > 1KB
const largeModel = await loadGLTF("model.gltf");
BS.createEntity({
  type: "GLTFModel",
  data: largeModel // Compressed before sending
});
```

## Error Handling

### Connection Errors
```javascript
BS.on("connection-lost", () => {
  console.error("Lost connection to Unity");
  // Show reconnection UI
  showReconnectDialog();
});

BS.on("connection-restored", () => {
  console.log("Connection restored");
  // Resync scene state
  BS.requestSceneSync();
});
```

### Operation Errors
```javascript
try {
  await BS.setProperty(entityId, componentId, "invalid", value);
} catch (error) {
  if (error.code === "INVALID_PROPERTY") {
    console.error("Property does not exist");
  } else if (error.code === "PERMISSION_DENIED") {
    console.error("Not authorized to modify");
  }
}
```

## Security

### Authentication
The bridge validates user permissions:

```javascript
// Permission levels
{
  viewer: ["read"],
  editor: ["read", "write"],
  admin: ["read", "write", "delete", "admin"]
}
```

### Input Validation
All inputs are sanitized:

```javascript
// Bridge validates before sending to Unity
BS.setProperty(entityId, componentId, property, value);
// ↓ Validates ↓
// - entityId exists
// - componentId belongs to entity
// - property is valid for component
// - value matches expected type
```

### Rate Limiting
Prevents abuse:
- Max 100 operations/second per user
- Max 10 create operations/second
- Max message size: 1MB

## Debugging

### Enable Debug Mode
```javascript
BS.debug = true; // Logs all messages

// Custom logging
BS.on("message", (msg) => {
  console.log(`[BS ${msg.direction}]`, msg.type, msg.data);
});
```

### Message Inspector
Monitor bridge traffic:

```javascript
// Log outgoing messages
BS.onSend = (message) => {
  console.log("→ Unity:", message);
};

// Log incoming messages
BS.onReceive = (message) => {
  console.log("← Unity:", message);
};
```

### Performance Metrics
```javascript
BS.getMetrics();
// Returns:
{
  messagesent: 1234,
  messagesReceived: 5678,
  averageLatency: 12, // ms
  connectionUptime: 3600, // seconds
  pendingOperations: 3
}
```

## Advanced Features

### Custom Bridge Extensions
```javascript
// Register custom message handler
BS.registerHandler("MY_CUSTOM_TYPE", (data) => {
  console.log("Received custom message:", data);
  return {success: true, processed: Date.now()};
});

// Send custom message
BS.sendCustom("MY_CUSTOM_TYPE", {
  customData: "value"
});
```

### Direct Unity Calls
```javascript
// Call Unity method directly
const result = await BS.callUnityMethod(
  "GameManager",
  "GetHighScore",
  []
);
```

### Bridge Plugins
```javascript
// Load bridge plugin
BS.loadPlugin("physics-extension", {
  gravity: -9.81,
  timeScale: 1.0
});
```

## Common Issues

### Bridge Not Loading
1. Check if BS library is included
2. Verify Unity is running
3. Check browser console for errors
4. Ensure WebSocket port is open

### Sync Issues
1. Force resync: `BS.requestSceneSync()`
2. Clear cache: `BS.clearCache()`
3. Reconnect: `BS.reconnect()`

### Performance Problems
1. Reduce message frequency
2. Batch operations
3. Use delta updates
4. Enable compression

## Next Steps

Learn more about:
- [Change Management](./change-management) - How changes are tracked
- [Multiplayer Sync](./multiplayer-sync) - Multi-user collaboration
- [API Reference](/docs/api/) - Complete BS API documentation