# MonoBehaviour Scripting Guide for Banter VR

A comprehensive guide for writing MonoBehaviour scripts in the Banter inspector environment.

**Last Updated**: 2025-10-14
**Purpose**: Define patterns and best practices for BanterScript MonoBehaviours

---

## Table of Contents

1. [Core Architecture](#core-architecture)
2. [Lifecycle Methods](#lifecycle-methods)
3. [Transform Manipulation (NEW Pattern)](#transform-manipulation-new-pattern)
4. [Variable System](#variable-system)
5. [Entity Navigation](#entity-navigation)
6. [Event Handling](#event-handling)
7. [Inter-Script Communication](#inter-script-communication)
8. [UI Extensions](#ui-extensions)
9. [Class-Based Architecture](#class-based-architecture)
10. [Common Patterns](#common-patterns)
11. [Best Practices](#best-practices)
12. [Quick Templates](#quick-templates)

---

## Core Architecture

### Script Context

Every MonoBehaviour script has access to:

```javascript
this._entity        // Parent entity (GameObject)
this._component     // The MonoBehavior component itself
this._scene         // BanterScript scene object
this._BS            // BanterScript library
this.vars           // Typed variables for inspector
this.ctx           // Script context (when using classes)
```

### Basic Script Structure

```javascript
// Define default variables
this.default = {
    speed: { type: "number", value: 1.0 },
    target: { type: "string", value: "" }
};

// Apply defaults
Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

// Lifecycle methods
this.onStart = () => {
    // Initialize once
};

this.onUpdate = () => {
    // Called every frame
};

this.onDestroy = () => {
    // Cleanup
};
```

---

## Lifecycle Methods

### Core Lifecycle

```javascript
this.onStart = () => {
    // Called once when script initializes
    // Set up event listeners, get references
};

this.onUpdate = () => {
    // Called every frame
    // Handle continuous updates, animations
};

this.onDestroy = () => {
    // Called when script is destroyed
    // CRITICAL: Clean up event listeners, intervals, etc.
};

this.onLoaded = async () => {
    // Called when entity is fully loaded in scene
    // Useful for entities loaded from inventory
};
```

### Input Events

```javascript
this.keyDown = (key) => {
    // Handle keyboard press
    console.log("Key pressed:", key);
};

this.keyUp = (key) => {
    // Handle keyboard release
    console.log("Key released:", key);
};
```

---

## Transform Manipulation (NEW Pattern)

### The Modern Get/Set Pattern

**IMPORTANT**: Recent scripts use `Get()` and `Set()` methods on entities for property access.

```javascript
// GET transform properties
let pos = this._entity.Get("localPosition");      // {x, y, z}
let rot = this._entity.Get("localRotation");      // {x, y, z, w} quaternion
let scale = this._entity.Get("localScale");       // {x, y, z}

// World space
let worldPos = this._entity.Get("position");      // {x, y, z}
let worldRot = this._entity.Get("rotation");      // {x, y, z, w} quaternion

// SET transform properties (auto-syncs across clients)
await this._entity.Set("localPosition", {x: 0, y: 1, z: 0});
await this._entity.Set("localScale", {x: 2, y: 2, z: 2});

// Rotation accepts BOTH Euler angles (Vector3) OR Quaternion (Vector4)
await this._entity.Set("localRotation", {x: 0, y: 90, z: 0});      // Euler (degrees)
await this._entity.Set("localRotation", {x: 0, y: 0, z: 0, w: 1}); // Quaternion

// Other entity properties
let name = this._entity.Get("name");
let isActive = this._entity.Get("active");
await this._entity.Set("active", false);
```

### Animation Example

```javascript
this.onUpdate = () => {
    // Rotation animation (WRONG - modifying quaternion directly!)
    let currentRot = this._entity.Get("localRotation");
    this._entity.Set("localRotation", {
        x: currentRot.x + 1,  // DON'T do this with quaternions!
        y: currentRot.y,
        z: currentRot.z,
        w: currentRot.w
    });
};

// CORRECT rotation animation
this.eulerY = 0;
this.onUpdate = () => {
    this.eulerY += 1;  // Track euler angles separately
    this._entity.Set("localRotation", {x: 0, y: this.eulerY, z: 0});
};
```

---

## Variable System

### Defining Typed Variables

Variables appear in the inspector UI and can be modified at runtime:

```javascript
// Define with defaults
this.default = {
    speed: { type: "number", value: 1.0 },
    targetName: { type: "string", value: "" },
    enabled: { type: "boolean", value: true },
    spawnPoint: { type: "Vector3", value: {x: 0, y: 1, z: 0} },
    tintColor: { type: "Color", value: {r: 1, g: 0, b: 0, a: 1} }
};

// Apply defaults
Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

// Helper function for clean access
let v = (varName) => {
    if (!this.vars[varName]) {
        console.log(`Variable [${varName}] not defined`);
        return this.default[varName]?.value;
    }
    return this.vars[varName].value;
};

// Usage
this.onUpdate = () => {
    let speed = v("speed");
    let pos = this._entity.Get("localPosition");
    pos.x += speed * 0.01;
    this._entity.Set("localPosition", pos);
};
```

---

## Entity Navigation

### Finding Entities

```javascript
// Get entity by relative path
let getEntity = (entityPath) => {
    let rel_path = this._entity.parentId + "/" + entityPath;
    return SM.getEntityById(rel_path);
};

// Get child entity
let getChildEntity = (childName) => {
    let path = this._entity.id + "/" + childName;
    return SM.getEntityById(path);
};

// Find by name (searches all entities)
let findEntityByName = (name) => {
    return SM.getAllEntities().find(e => e.name === name);
};

// Get parent
let parent = SM.getEntityById(this._entity.parentId);

// Access children directly
let children = this._entity.children;  // Array of child entities
```

### Parent-Child Operations

```javascript
// Change parent (moves entity in hierarchy)
await this._entity.SetParent("Scene/NewParent");

// Remember and restore parent
this.lastParent = this._entity.parentId;
// ... do something ...
await this._entity.SetParent(this.lastParent);
```

---

## Event Handling

### Click Events

```javascript
this.onStart = () => {
    // Register click handler
    this._entity._bs.On("click", async (e) => {
        console.log("Clicked at:", e.detail.point);
        // e.detail.point = world position of click
        await this.handleClick(e);
    });
};

this.handleClick = async (e) => {
    // Handle the click
    await this._entity.Set("localScale", {x: 2, y: 2, z: 2});
};

this.onDestroy = () => {
    // CRITICAL: Clean up listeners
    this._entity._bs.listeners.get("click").clear();
};
```

### Collision/Trigger Events

```javascript
this.onStart = () => {
    // Trigger events
    this._entity._bs.On("trigger-enter", (e) => {
        console.log("Something entered trigger:", e);
        this.onTriggerEnter(e);
    });

    this._entity._bs.On("trigger-exit", (e) => {
        console.log("Something left trigger:", e);
    });

    // Collision events
    this._entity._bs.On("collision-enter", (e) => {
        console.log("Collision detected:", e);
    });
};

this.onDestroy = () => {
    this._entity._bs.listeners.get("trigger-enter").clear();
    this._entity._bs.listeners.get("trigger-exit").clear();
    this._entity._bs.listeners.get("collision-enter").clear();
};
```

### Custom Window Events

```javascript
// Listen for global events
this.onEntitySelected = (event) => {
    if (event.detail.entityId === this._entity.id) {
        console.log("I was selected!");
    }
};

this.onStart = () => {
    window.addEventListener('entitySelected', this.onEntitySelected);
    window.addEventListener('button-clicked', this.handleButtonClick);
};

this.onDestroy = () => {
    window.removeEventListener('entitySelected', this.onEntitySelected);
    window.removeEventListener('button-clicked', this.handleButtonClick);
};
```

---

## Inter-Script Communication

### Getting Other Scripts

```javascript
// Get script from same entity
let otherScript = this._entity.GetScript("ScriptName");
if (otherScript) {
    otherScript.doSomething();
}

// Get script from specific entity
let getEntityScript = (entityPath, scriptName) => {
    let entity = SM.getEntityById(entityPath);
    if (!entity) return null;

    let component = entity.components.find(c =>
        c.type === "MonoBehavior" &&
        c.properties.name === scriptName
    );
    return component?.ctx;
};

// Find script by name globally
let findScriptByName = (scriptName) => {
    let mono = SM.getAllMonoBehaviors().find(m =>
        m.properties.name === scriptName
    );
    return mono?.ctx;
};
```

### Async Script Loading

Wait for a script to be available:

```javascript
let waitForScript = async (entityPath, scriptName) => {
    return new Promise(resolve => {
        const check = () => {
            const script = getEntityScript(entityPath, scriptName);
            if (script) {
                resolve(script);
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
};

// Usage
this.onStart = async () => {
    this.gameController = await waitForScript("Scene/GameController", "Main");
    this.gameController.registerPlayer(this);
};
```

---

## UI Extensions

### DOM Manipulation (Inspector UI)

```javascript
this.onStart = () => {
    // Add button to navigation bar
    let navControls = document.querySelector(".nav-controls");
    let btn = document.createElement("button");
    btn.classList.add("nav-control-btn");
    btn.innerHTML = "<span>🎮</span>";
    btn.id = "myCustomButton";

    btn.addEventListener("click", () => {
        this.toggleFeature();
    });

    navControls.appendChild(btn);
};

this.onDestroy = () => {
    // Clean up DOM elements
    let btn = document.getElementById("myCustomButton");
    if (btn) btn.remove();
};
```

### BanterUI Panels (In-World UI)

```javascript
this.onStart = async () => {
    // Create UI entity
    this.uiEntity = await AddEntity(this._entity.id, "UIPanel");

    // Add BanterUI component via BS
    this.doc = await this.uiEntity._bs.AddComponent(
        new BS.BanterUI(new BS.Vector2(512, 512), false)
    );

    // Set background
    this.doc.SetBackgroundColor(new BS.Vector4(0.1, 0.2, 0.3, 1));

    // Create elements
    this.createUI();
};

this.createUI = () => {
    // Container
    const container = this.doc.CreateVisualElement();
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.padding = "10px";

    // Title
    const title = this.doc.CreateLabel();
    title.text = "My Panel";
    title.style.fontSize = "24px";
    title.style.color = "#ffffff";

    // Button
    const button = this.doc.CreateButton();
    button.text = "Click Me";
    button.style.backgroundColor = "#4CAF50";
    button.OnClick(() => {
        console.log("Button clicked!");
        this.handleButtonClick();
    });

    // Build hierarchy
    container.AppendChild(title);
    container.AppendChild(button);
};

this.onDestroy = async () => {
    if (this.uiEntity) {
        await RemoveEntity(this.uiEntity.id);
    }
};
```

---

## Class-Based Architecture

For complex scripts, use classes for better organization:

```javascript
// Define the class
class GameController {
    constructor(ctx) {
        this.ctx = ctx;  // Store script context
        this.players = [];
        this.score = 0;
        this.isRunning = false;

        // Bind lifecycle methods
        this.ctx.onStart = () => this.onStart();
        this.ctx.onUpdate = () => this.onUpdate();
        this.ctx.onDestroy = () => this.onDestroy();
    }

    onStart() {
        console.log("Game starting...");
        this.setupGame();
    }

    onUpdate() {
        if (this.isRunning) {
            this.updateGame();
        }
    }

    onDestroy() {
        this.cleanup();
    }

    setupGame() {
        // Game setup logic
        this.isRunning = true;
    }

    updateGame() {
        // Game update logic
    }

    cleanup() {
        // Cleanup logic
        this.isRunning = false;
    }

    // Public methods for other scripts
    registerPlayer(player) {
        this.players.push(player);
    }

    addScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    }
}

// Instantiate the class
const controller = new GameController(this);

// Make it globally accessible if needed
window.gameController = controller;
```

---

## Common Patterns

### Grabbable Object

```javascript
this.held = false;
this.lastParent = "Scene";

this.onStart = () => {
    this._entity._bs.On("click", async (e) => {
        if (this.held) {
            // Drop
            await this._entity.SetParent(this.lastParent);
        } else {
            // Grab
            let holderPath = `People/${SM.myName()}/Trackers/RIGHT_HAND/Holder`;
            let holder = SM.getEntityById(holderPath);

            if (!holder) {
                showNotification("Hand tracker not found");
                return;
            }

            await holder.Set("position", e.detail.point);
            this.lastParent = this._entity.parentId;
            await this._entity.SetParent(holderPath);
        }
        this.held = !this.held;
    });
};

this.onDestroy = () => {
    this._entity._bs.listeners.get("click").clear();
};
```

### Spawning System

```javascript
this.spawnInterval = null;
this.spawnCount = 0;

this.onStart = () => {
    this.startSpawning();
};

this.startSpawning = () => {
    this.spawnInterval = setInterval(async () => {
        await this.spawnObject();
    }, 2000);
};

this.spawnObject = async () => {
    // Load from inventory
    let spawned = await LoadItem("MyPrefab", this._entity.id);

    // Position it
    if (spawned) {
        let offset = {
            x: Math.random() * 2 - 1,
            y: 0,
            z: Math.random() * 2 - 1
        };
        await spawned.Set("localPosition", offset);
        this.spawnCount++;
    }
};

this.stopSpawning = () => {
    if (this.spawnInterval) {
        clearInterval(this.spawnInterval);
        this.spawnInterval = null;
    }
};

this.onDestroy = () => {
    this.stopSpawning();
};
```

### State Machine

```javascript
this.states = {
    IDLE: "idle",
    RUNNING: "running",
    JUMPING: "jumping"
};

this.currentState = this.states.IDLE;
this.stateHandlers = {};

// Define state handlers
this.stateHandlers[this.states.IDLE] = () => {
    // Idle behavior
};

this.stateHandlers[this.states.RUNNING] = () => {
    // Running behavior
    let pos = this._entity.Get("localPosition");
    pos.x += 0.1;
    this._entity.Set("localPosition", pos);
};

this.stateHandlers[this.states.JUMPING] = () => {
    // Jumping behavior
};

this.setState = (newState) => {
    console.log(`State: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
};

this.onUpdate = () => {
    // Execute current state
    if (this.stateHandlers[this.currentState]) {
        this.stateHandlers[this.currentState]();
    }
};
```

---

## Best Practices

### 1. Always Clean Up

```javascript
this.intervals = [];
this.listeners = [];

this.onStart = () => {
    // Track everything you create
    let interval = setInterval(() => {}, 1000);
    this.intervals.push(interval);

    this._entity._bs.On("click", () => {});
    this.listeners.push("click");
};

this.onDestroy = () => {
    // Clean everything
    this.intervals.forEach(i => clearInterval(i));
    this.listeners.forEach(l => {
        this._entity._bs.listeners.get(l).clear();
    });
};
```

### 2. Error Handling

```javascript
this.onStart = () => {
    try {
        this.init();
    } catch (error) {
        console.error("Failed to initialize:", error);
        showNotification("Script error: " + error.message);
    }
};

this.safeGetEntity = (path) => {
    let entity = SM.getEntityById(path);
    if (!entity) {
        console.warn(`Entity not found: ${path}`);
    }
    return entity;
};
```

### 3. Performance Optimization

```javascript
// Cache references in onStart
this.onStart = () => {
    this.textComponent = this._entity.getComponent("BanterText");
    this.material = this._entity.getComponent("BanterMaterial");
};

// Use cached references in onUpdate
this.onUpdate = () => {
    if (this.textComponent) {
        SetComponentProp(this.textComponent.id, "text", "Updated");
    }
};
```

### 4. Singleton Pattern

```javascript
// Prevent multiple instances
this.onStart = () => {
    // Check for existing instance
    if (window.myGlobalController) {
        console.log("Controller already exists, destroying duplicate");
        RemoveEntity(this._entity.id);
        return;
    }

    // Register as singleton
    window.myGlobalController = this;
};

this.onDestroy = () => {
    if (window.myGlobalController === this) {
        delete window.myGlobalController;
    }
};
```

---

## Quick Templates

### Basic Interactive Object

```javascript
// Simple clickable object that changes color
this.default = {
    clickColor: { type: "Color", value: {r:1, g:0, b:0, a:1} }
};

Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

this.onStart = () => {
    this.material = this._entity.getComponent("BanterMaterial");
    this.originalColor = this.material?.properties?.color;

    this._entity._bs.On("click", () => {
        if (this.material) {
            SetComponentProp(
                this.material.id,
                "color",
                this.vars.clickColor.value
            );

            setTimeout(() => {
                SetComponentProp(
                    this.material.id,
                    "color",
                    this.originalColor
                );
            }, 1000);
        }
    });
};

this.onDestroy = () => {
    this._entity._bs.listeners.get("click").clear();
};
```

### Rotating Animation

```javascript
// Continuous rotation with configurable speed
this.default = {
    rotationSpeed: { type: "number", value: 45 }  // degrees per second
};

Object.entries(this.default).forEach(([key, val]) => {
    if (!this.vars[key]) this.vars[key] = val;
});

this.rotation = 0;

this.onUpdate = () => {
    this.rotation += this.vars.rotationSpeed.value * (1/60);  // Assume 60 FPS
    this._entity.Set("localRotation", {x: 0, y: this.rotation, z: 0});
};
```

### Simple Score Display

```javascript
// Text display that updates from global events
this.score = 0;

this.onStart = () => {
    this.textComponent = this._entity.getComponent("BanterText");
    this.updateDisplay();

    window.addEventListener("score-changed", (e) => {
        this.score = e.detail.score;
        this.updateDisplay();
    });
};

this.updateDisplay = () => {
    if (this.textComponent) {
        SetComponentProp(
            this.textComponent.id,
            "text",
            `Score: ${this.score}`
        );
    }
};

this.onDestroy = () => {
    window.removeEventListener("score-changed", this.updateDisplay);
};
```

---

## Important Reminders

1. **Use Get/Set Pattern**: Modern scripts use `entity.Get()` and `entity.Set()`
2. **Clean Up Everything**: Always implement `onDestroy()` properly
3. **Handle Async Operations**: Many operations return promises - use `await`
4. **Check Entity Existence**: Always verify entities exist before using them
5. **Use Global Functions**: `AddEntity`, `RemoveEntity`, `LoadItem`, etc. are available globally
6. **Track State**: For complex scripts, maintain clear state management
7. **Cache References**: Store component references in `onStart()` for performance
8. **Document Variables**: Use meaningful names in `this.vars` for inspector clarity

---

## Global Functions Reference

```javascript
// Entity operations
AddEntity(parentId, name, options)
RemoveEntity(entityId, options)

// Component operations
AddComponent(entityId, componentType, options)
RemoveComponent(componentId, options)
SetComponentProp(componentId, property, value, options)

// Inventory
LoadItem(itemName, parentId, position, options)
SaveEntityItem(entityId, itemName, folder, options)

// Scene Manager
SM.getEntityById(path)
SM.getAllEntities()
SM.getAllMonoBehaviors()
SM.myName()  // Current user name

// Notifications
showNotification(message)

// Logging
log(tag, ...args)  // Better than console.log
```

---

This guide provides the essential patterns for MonoBehaviour scripting in Banter. Scripts can range from simple animations to complex game systems, all following these established patterns.