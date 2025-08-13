---
sidebar_position: 1
title: SceneManager API
---

# SceneManager API

The SceneManager is the central interface for manipulating the Unity scene from the inspector. It manages all GameObjects (entities), components, and scene state.

## Core Methods

### Scene Queries

#### `getEntity(entityId)`
Returns a entity by its unique ID.

```javascript
const entity = sceneManager.getEntity("entity_123");
if (entity) {
    console.log("Found:", entity.name);
}
```

#### `getEntityByName(name)`
Finds the first entity with the specified name.

```javascript
const player = sceneManager.getEntityByName("Player");
```

#### `getAllEntities()`
Returns array of all entities in the scene.

```javascript
const allEntities = sceneManager.getAllEntities();
console.log(`Scene contains ${allEntities.length} objects`);
```

#### `getEntitiesWithComponent(componentType)`
Returns all entities that have a specific component type.

```javascript
const rigidbodies = sceneManager.getEntitiesWithComponent("BanterRigidbody");
rigidbodies.forEach(entity => {
    // Apply to all physics objects
});
```

#### `getEntitiesByTag(tag)`
Returns all entities with the specified tag.

```javascript
const enemies = sceneManager.getEntitiesByTag("enemy");
```

### Entity Creation

#### `createEntity(options)`
Creates a new GameObject in the scene.

```javascript
const newEntity = await sceneManager.createEntity({
    name: "MyObject",
    parent: parentId, // Optional parent entity ID
    position: {x: 0, y: 1, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    scale: {x: 1, y: 1, z: 1},
    components: [
        {type: "BanterBox", properties: {width: 1, height: 1, depth: 1}},
        {type: "BanterMaterial", properties: {shaderColor: {r: 1, g: 0, b: 0, a: 1}}}
    ]
});
```

#### `duplicateEntity(entityId, options)`
Creates a copy of an existing entity.

```javascript
const copy = await sceneManager.duplicateEntity(originalId, {
    name: "Copy",
    position: {x: 5, y: 0, z: 0}
});
```

### Entity Deletion

#### `removeEntity(entityId)`
Removes a entity and all its children from the scene.

```javascript
await sceneManager.removeEntity(entityId);
```

#### `removeAllEntities()`
Clears the entire scene.

```javascript
await sceneManager.removeAllEntities();
```

### Component Management

#### `addComponent(entityId, componentType, properties)`
Adds a component to a entity.

```javascript
const componentId = await sceneManager.addComponent(
    entityId,
    "BanterRigidbody",
    {mass: 1, useGravity: true}
);
```

#### `removeComponent(componentId)`
Removes a component from its entity.

```javascript
await sceneManager.removeComponent(componentId);
```

#### `getComponent(entityId, componentType)`
Gets a component from a entity.

```javascript
const rigidbody = sceneManager.getComponent(entityId, "BanterRigidbody");
```

### Property Modification

#### `setComponentProperty(componentId, property, value)`
Sets a property on a component.

```javascript
await sceneManager.setComponentProperty(
    materialId,
    "shaderColor",
    {r: 0, g: 1, b: 0, a: 1}
);
```

#### `setTransform(entityId, transform)`
Sets position, rotation, and scale.

```javascript
await sceneManager.setTransform(entityId, {
    position: {x: 10, y: 5, z: 0},
    rotation: {x: 0, y: 45, z: 0},
    scale: {x: 2, y: 2, z: 2}
});
```

### Hierarchy Management

#### `setParent(entityId, parentId)`
Changes the parent of a entity.

```javascript
await sceneManager.setParent(childId, newParentId);
```

#### `getChildren(entityId)`
Returns all direct children of a entity.

```javascript
const children = sceneManager.getChildren(parentId);
```

#### `getHierarchy()`
Returns the complete scene hierarchy.

```javascript
const hierarchy = sceneManager.getHierarchy();
// Returns tree structure of all entities
```

## Events

### Scene Events

```javascript
// Entity created
sceneManager.on("entity-created", (data) => {
    console.log("New entity:", data.entity);
});

// Entity removed
sceneManager.on("entity-removed", (data) => {
    console.log("Removed:", data.entityId);
});

// Component added
sceneManager.on("component-added", (data) => {
    console.log("Component added:", data.componentType);
});

// Property changed
sceneManager.on("property-changed", (data) => {
    console.log("Property updated:", data.property, data.value);
});
```

### Selection Events

```javascript
// Selection changed
sceneManager.on("selection-changed", (data) => {
    console.log("Selected:", data.selectedIds);
});

// Object focused
sceneManager.on("focus-object", (data) => {
    console.log("Focused on:", data.entityId);
});
```

## Batch Operations

### `batchUpdate(operations)`
Performs multiple operations as a single transaction.

```javascript
await sceneManager.batchUpdate([
    {type: "setProperty", componentId: id1, property: "color", value: red},
    {type: "setProperty", componentId: id2, property: "position", value: pos},
    {type: "addComponent", entityId: id3, componentType: "BanterBox"}
]);
```

## Utility Methods

### `getSceneStats()`
Returns statistics about the scene.

```javascript
const stats = sceneManager.getSceneStats();
console.log(`
    Entities: ${stats.entityCount}
    Components: ${stats.componentCount}
    Triangles: ${stats.triangleCount}
    Draw Calls: ${stats.drawCalls}
`);
```

### `saveScene()`
Exports the entire scene as JSON.

```javascript
const sceneData = sceneManager.saveScene();
localStorage.setItem("savedScene", JSON.stringify(sceneData));
```

### `loadScene(sceneData)`
Loads a scene from JSON data.

```javascript
const savedData = JSON.parse(localStorage.getItem("savedScene"));
await sceneManager.loadScene(savedData);
```

### `findPath(fromEntityId, toEntityId)`
Finds the path between two entities in the hierarchy.

```javascript
const path = sceneManager.findPath(startId, endId);
// Returns array of entity IDs from start to end
```

## Performance Methods

### `enableLOD(enabled)`
Toggles level-of-detail optimization.

```javascript
sceneManager.enableLOD(true);
```

### `setRenderDistance(distance)`
Sets maximum render distance.

```javascript
sceneManager.setRenderDistance(100); // Meters
```

### `pausePhysics(paused)`
Pauses or resumes physics simulation.

```javascript
sceneManager.pausePhysics(true); // Pause
sceneManager.pausePhysics(false); // Resume
```

## Error Handling

All async methods can throw errors:

```javascript
try {
    await sceneManager.createEntity({name: "Test"});
} catch (error) {
    if (error.code === "INVALID_PARENT") {
        console.error("Parent entity not found");
    } else if (error.code === "PERMISSION_DENIED") {
        console.error("Not authorized");
    }
}
```

## Example Usage

### Complete Scene Setup
```javascript
async function setupScene() {
    // Clear existing scene
    await sceneManager.removeAllEntities();
    
    // Create ground
    const ground = await sceneManager.createEntity({
        name: "Ground",
        position: {x: 0, y: 0, z: 0},
        components: [
            {type: "BanterBox", properties: {width: 20, height: 0.1, depth: 20}},
            {type: "BanterMaterial", properties: {shaderColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}}},
            {type: "BanterBoxCollider", properties: {size: {x: 20, y: 0.1, z: 20}}}
        ]
    });
    
    // Create player
    const player = await sceneManager.createEntity({
        name: "Player",
        position: {x: 0, y: 1, z: 0},
        tag: "player",
        components: [
            {type: "BanterCapsule"},
            {type: "BanterRigidbody", properties: {mass: 1}},
            {type: "BanterCapsuleCollider"},
            {type: "BanterMonoBehavior", properties: {script: "PlayerController.js"}}
        ]
    });
    
    // Create enemies
    for (let i = 0; i < 5; i++) {
        await sceneManager.createEntity({
            name: `Enemy_${i}`,
            position: {x: Math.random() * 10 - 5, y: 1, z: Math.random() * 10 - 5},
            tag: "enemy",
            components: [
                {type: "BanterSphere"},
                {type: "BanterMaterial", properties: {shaderColor: {r: 1, g: 0, b: 0, a: 1}}}
            ]
        });
    }
    
    console.log("Scene setup complete!");
}
```

## Related APIs

- [Entity API](./entity-api) - Individual GameObject manipulation
- [Component API](./component-api) - Component-specific methods
- [Change API](./change-api) - Undo/redo system
- [Networking API](./networking-api) - Multiplayer synchronization