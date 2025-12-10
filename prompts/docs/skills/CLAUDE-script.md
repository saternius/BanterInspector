# BanterScript Inspector Scripting Guide

## Overview
This guide outlines the design principles, data structures, and patterns for scripting with the Banter Inspector. Scripts run in a JavaScript runtime that bridges Unity and web content, enabling real-time scene manipulation and interactive VR experiences.

## Core Design Principles

### 1. Component Lifecycle Pattern
Every script follows a consistent lifecycle with specific methods:
- `onStart()` - Called when the script initializes
- `onUpdate()` - Called every frame for continuous updates
- `onDestroy()` - Called when the script is destroyed (cleanup)
- `onLoaded()` - Optional callback triggered when the entity containing the script is fully loaded
- `keyDown(key)` / `keyUp(key)` - Optional keyboard event handlers

### 2. Entity-Component Architecture
Scripts operate within an entity-component system that mirrors Unity's GameObject/Component model:
- Scripts are attached to entities (GameObjects)
- Access the parent entity via `this._entity`
- Components are accessed through the entity
- Hierarchical relationships with parent/child entities

### 3. State Management
Scripts maintain state through:
- Instance variables (e.g., `this.speed`, `this.started`)
- Custom variables system (`this.vars`) with type definitions11
- Default values pattern (`this.default`)

## Data Structures and Patterns

### Variable System
Scripts can define typed variables that appear in the inspector UI:

```javascript
this.vars = {
    "rotationSpeed": {
        "type": "number",
        "value": 1
    },
    "entityRef": {
        "type": "string",
        "value": ""
    }
}

// Helper pattern for accessing variables
let v = (str) => {
    if(!this.vars[str]) {
        console.log(`VARIABLE [${str}] not defined`)
    }
    return this.vars[str].value
}
```

### Default Values Pattern
Initialize default values and merge with existing vars:

```javascript
this.default = {
    gravity: { type: "number", value: 0.05 },
    jumpStrength: { type: "number", value: -0.3 }
}

Object.entries(this.default).forEach(([key, val]) => {
    if(!this.vars[key]) this.vars[key] = val
})
```

### Transform Manipulation
Transform properties are accessed and modified through the entity's `Get()` and `Set()` methods:

```javascript
// Read transform properties using Get()
let pos = this._entity.Get("localPosition")    // {x, y, z}
let rot = this._entity.Get("localRotation")    // {x, y, z, w} - quaternion
let scale = this._entity.Get("localScale")     // {x, y, z}

// World space properties
let worldPos = this._entity.Get("position")
let worldRot = this._entity.Get("rotation")

// Modify transforms using Set() (automatically syncs across all clients)
await this._entity.Set("localPosition", {x: 0, y: 1, z: 0})
await this._entity.Set("localScale", {x: 2, y: 2, z: 2})

// Rotation can be set using EITHER Euler angles (Vector3) OR Quaternion (Vector4)
await this._entity.Set("localRotation", {x: 0, y: 90, z: 0})           // Euler angles (degrees)
await this._entity.Set("localRotation", {x: 0, y: 0, z: 0, w: 1})      // Quaternion

// World space modifications
await this._entity.Set("position", {x: 5, y: 0, z: 5})
await this._entity.Set("rotation", {x: 0, y: 180, z: 0})               // Euler angles
await this._entity.Set("rotation", {x: 0, y: 0, z: 0, w: 1})          // Quaternion

// Other entity properties can also use Get/Set
let entityName = this._entity.Get("name")
let isActive = this._entity.Get("active")
await this._entity.Set("active", false)
```

## Common Utility Functions

### Entity Navigation
```javascript
// Get entity by path relative to parent
let getEntity = (entityPath) => {
    let rel_path = this._entity.parentId + "/" + entityPath
    return SM.getEntityById(rel_path)
}

// Get child entity
let getChildEntity = (entityPath) => {
    let rel_path = this._entity.id + "/" + entityPath
    return SM.getEntityById(rel_path)
}

// Find entity by name
let getEntityByName = (entityName) => {
    return SM.getAllEntities().find(x => x.name === entityName)
}
```

### Asset Loading
```javascript
// Load item from inventory
let loadItem = async (itemRef, target) => {
    if(target === "_self") target = this._entity.id
    if(target === undefined) target = "Scene"
    return await LoadItem(itemRef, target)
}

// Delete entity
let deleteEntity = async (entity) => {
    if(typeof(entity) === "object") {
        entity = entity.id
    }
    RemoveEntity(entity)
}
```

### Component Manipulation
```javascript
// Get component from entity
let material = entity.getComponent("Material")

// Set component property
SetComponentProp(material.id, "color", {r: 1, g: 0, b: 0, a: 1})

// Add component to entity
await AddComponent(entity.id, "AttachedObject", {
    componentProperties: {
        uid: scene.localUser.uid,
        attachmentPoint: 3 // right hand
    }
})
```

## Event Handling Patterns

### Click Events
```javascript
this._entity._bs.On("click", (e) => {
    console.log("Clicked at:", e.detail.point)
    // Handle click
})

// Cleanup in onDestroy
this.onDestroy = () => {
    this._entity._bs.listeners.get("click").clear()
}
```

### Collision/Trigger Events
```javascript
this._entity._bs.On("trigger-enter", (e) => {
    console.log("Trigger entered:", e)
    // Handle collision
})
```

### Custom Window Events
```javascript
// Listen for custom events
window.addEventListener('entitySelected', onEntitySelected)
window.addEventListener('script-refreshed', handleScriptUpdates)

// Cleanup
this.onDestroy = () => {
    window.removeEventListener('entitySelected', onEntitySelected)
}
```

## Advanced Patterns

### Inter-Script Communication
```javascript
// Get script from another entity
let getScriptByName = (scriptName) => {
    let mono = SM.getAllMonoBehaviors().find(m => m.properties.name === scriptName)
    return mono.ctx
}

// Call method on another script
let bird = getScriptByName("Bird")
bird.score()
```

### Async Script Loading
```javascript
let getScript = async (entityPath, scriptName) => {
    return new Promise(resolve => {
        const check = () => {
            const script = getEntityScript(entityPath, scriptName)
            if (script !== undefined) {
                resolve(script.ctx)
            } else {
                setTimeout(check, 100)
            }
        }
        check()
    })
}
```

### UI Extension Pattern
Scripts can extend the inspector UI:

```javascript
// Add button to navigation
let navControls = document.querySelector(".nav-controls")
let customBtn = document.createElement("button")
customBtn.classList.add("nav-control-btn")
customBtn.innerHTML = "<span>🎮</span>"
navControls.appendChild(customBtn)

// Show notifications
showNotification("Action completed")
```

### Tooltip/Overlay System
Create interactive overlays and tooltips:

```javascript
// Create overlay element
let overlayElement = document.createElement('div')
overlayElement.style.position = 'fixed'
overlayElement.style.backgroundColor = 'purple'
overlayElement.style.opacity = '0.5'
overlayElement.style.zIndex = '999999'

// Position based on element bounds
const rect = element.getBoundingClientRect()
overlayElement.style.left = rect.left + 'px'
overlayElement.style.top = rect.top + 'px'
```

## Scene Manager (SM) API

The Scene Manager provides global access to scene state:

- `SM.getEntityById(path)` - Get entity by ID/path
- `SM.getAllEntities()` - Get all entities in scene
- `SM.getAllMonoBehaviors()` - Get all MonoBehavior scripts
- `SM.myName()` - Get current user's name
- `scene.localUser.uid` - Current user's UID
- `scene.SendToVisualScripting(command, params)` - Send commands to Unity

## Networking and Multiplayer

### Synced Objects
```javascript
// Create synced object
let syncedComponent = entity.getComponent("SyncedObject")

// Attach to user
let attachComponent = entity.getComponent("AttachedObject")
await attachComponent.Set("uid", scene.localUser.uid)
```

### Space Properties
Access persistent space-level data:

```javascript
// Read space properties
let publicProps = scene.publicSpaceProperties
let protectedProps = scene.protectedSpaceProperties

// Write (if authorized)
scene.SetPublicSpaceProperty("score", 100)
```

## Best Practices

1. **Always clean up event listeners** in `onDestroy()`
2. **Cache component references** in `onStart()` for performance
3. **Use async/await** for operations that modify scene state
4. **Validate entity existence** before accessing components
5. **Handle errors gracefully** with try/catch blocks
6. **Use meaningful variable names** in `this.vars` for inspector clarity
7. **Implement cooldown mechanisms** for spawning/intensive operations
8. **Clear timeouts/intervals** in `onDestroy()`
9. **Use relative paths** for entity navigation when possible
10. **Prefix custom properties** to avoid conflicts

## Common Use Cases

### Rotating Object
```javascript
this.onUpdate = () => {
    // Get current rotation (returns quaternion)
    let currentRot = this._entity.Get("localRotation")

    // Option 1: Use Euler angles (simpler, more intuitive)
    // Note: You'll need to track euler angles separately or convert from quaternion
    this.eulerY = (this.eulerY || 0) + this.rotationSpeed
    this._entity.Set("localRotation", {x: 0, y: this.eulerY, z: 0})

    // Option 2: Modify quaternion directly (if you understand quaternion math)
    this._entity.Set("localRotation", {
        x: currentRot.x + this.rotationSpeed,
        y: currentRot.y + this.rotationSpeed,
        z: currentRot.z + this.rotationSpeed,
        w: currentRot.w
    })
}
```

### Spawning System
```javascript
this.spawnerTimeout = setInterval(async () => {
    let item = await loadItem('ItemName', "_self")
    // Configure spawned item
}, 2000)
```

### Interactive Button
```javascript
this._entity._bs.On("click", e => {
    this.counter++
    let textComponent = getChildEntity("Display").getComponent("Text")
    textComponent.Set("text", `Count: ${this.counter}`)
})
```

### Following Player
```javascript
let attachComponent = this._entity.getComponent("AttachedObject")
await attachComponent.Set("uid", scene.localUser.uid)
await attachComponent.Set("attachmentPoint", 3) // right hand
```

Final Tips:
In order to get continual updates of a banter gameobject's component propertie values you need to use .WatchProperties([BS.PropertyName.prop,..]) on the component

This guide provides the foundational patterns and practices for creating interactive scripts in the Banter Inspector. Scripts can range from simple animations to complex game logic, all while maintaining clean, maintainable code that integrates seamlessly with the VR environment.