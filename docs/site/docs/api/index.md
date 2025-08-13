---
sidebar_position: 1
title: API Reference
---

# API Reference

Complete API documentation for the Wraptor Inspector.

## SceneManager API

The main interface for scene manipulation.

### Methods

#### `getEntity(entityId)`
Returns a entity (GameObject) by its ID.

#### `createEntity(type, parentId)`
Creates a new entity of the specified type.

#### `removeEntity(entityId)`
Removes a entity from the scene.

## Component APIs

### Transform
```javascript
transform.Set(property, value)
transform.Add(property, value)
transform.Multiply(property, value)
```

### Material
```javascript
material.Set("shaderColor", {r, g, b, a})
material.Set("texture", textureUrl)
```

## Change System API

### Creating Changes
```javascript
new ComponentPropertyChange(componentId, property, value)
new AddComponentChange(entityId, componentType)
new RemoveComponentChange(componentId)
```

## Networking API

### Broadcasting
```javascript
networking.broadcast("event-type", data)
networking.on("event-type", handler)
```

## Inventory API

### Saving Items
```javascript
inventory.saveEntity(entity, name, folder)
inventory.saveScript(script, name, folder)
```

### Loading Items
```javascript
inventory.loadItem(itemId, parentEntityId)
inventory.getItems(folder)
```

Complete API documentation is being expanded. Check back for updates!