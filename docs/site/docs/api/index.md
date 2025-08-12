---
sidebar_position: 1
title: API Reference
---

# API Reference

Complete API documentation for the Wraptor Inspector.

## SceneManager API

The main interface for scene manipulation.

### Methods

#### `getSlot(slotId)`
Returns a slot (GameObject) by its ID.

#### `createSlot(type, parentId)`
Creates a new slot of the specified type.

#### `removeSlot(slotId)`
Removes a slot from the scene.

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
new AddComponentChange(slotId, componentType)
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
inventory.saveSlot(slot, name, folder)
inventory.saveScript(script, name, folder)
```

### Loading Items
```javascript
inventory.loadItem(itemId, parentSlotId)
inventory.getItems(folder)
```

Complete API documentation is being expanded. Check back for updates!