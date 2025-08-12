---
sidebar_position: 1
title: Scripting Guide
---

# Scripting Guide

Learn to write MonoBehavior scripts that bring your VR creations to life.

## Getting Started

MonoBehavior scripts in the Wraptor Inspector use JavaScript and run directly in Unity through the BanterScript bridge.

### Basic Script Structure

```javascript
// Define variables with types
this.vars = {
    "speed": {
        "type": "number",
        "value": 1
    },
    "message": {
        "type": "string",
        "value": "Hello VR!"
    }
}

// Called when script starts
this.onStart = () => {
    console.log("Script started!");
    this.transform = this._slot.getTransform();
}

// Called every frame
this.onUpdate = () => {
    // Animation logic here
}

// Called when script is destroyed
this.onDestroy = () => {
    // Cleanup here
}
```

## Lifecycle Methods

### onStart()
Called once when the script initializes. Use for setup.

### onUpdate()
Called every frame. Use for animations and continuous checks.

### onDestroy()
Called when the script is removed. Use for cleanup.

## Available Objects

Your scripts have access to:
- `this._slot` - The GameObject this script is attached to
- `this._scene` - The current scene
- `this._BS` - The BanterScript library
- `this._component` - The MonoBehavior component itself

## Common Patterns

### Transform Manipulation
```javascript
// Rotate continuously
this.transform.Add("localRotation", {x: 1, y: 2, z: 0});

// Set position
this.transform.Set("localPosition", {x: 0, y: 1, z: 0});

// Scale up
this.transform.Multiply("localScale", {x: 1.1, y: 1.1, z: 1.1});
```

### Event Handling
```javascript
// Click events
this._slot._bs.On("click", () => {
    console.log("Clicked!");
});

// Collision events
this._slot._bs.On("trigger-enter", (other) => {
    console.log("Collided with:", other);
});
```

More scripting documentation coming soon!