---
sidebar_position: 5
title: MonoBehavior Component
---

# MonoBehavior Component

The MonoBehavior component allows you to write JavaScript code that runs directly in Unity, enabling custom behaviors, game logic, and interactivity.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>💻 Scripting Power</h3>
  <ul>
    <li>Full JavaScript runtime in Unity</li>
    <li>Lifecycle methods (Start, Update, Destroy)</li>
    <li>Access to all components and scene</li>
    <li>Event handling and input</li>
    <li>Custom variables with UI exposure</li>
  </ul>
</div>

## Script Structure

### Basic Template
```javascript
// Define typed variables exposed in UI
this.vars = {
    "speed": {
        "type": "number",
        "value": 1
    },
    "message": {
        "type": "string",
        "value": "Hello"
    },
    "active": {
        "type": "boolean",
        "value": true
    },
    "color": {
        "type": "color",
        "value": {r: 1, g: 0, b: 0, a: 1}
    }
}

// Called once when script starts
this.onStart = () => {
    console.log("Script initialized");
    // Setup code here
}

// Called every frame (~60 times/second)
this.onUpdate = () => {
    // Animation and continuous logic
}

// Called when script is removed
this.onDestroy = () => {
    // Cleanup code here
}
```

## Lifecycle Methods

### onStart()
Initialization when script activates:
```javascript
this.onStart = () => {
    // Cache component references
    this.transform = this._entity.getTransform();
    this.rigidbody = this._entity.getComponent("BanterRigidbody");
    
    // Initialize state
    this.score = 0;
    this.startTime = Date.now();
    
    // Setup event listeners
    this._entity._bs.On("click", () => this.handleClick());
    
    // Log startup
    this.log("Script started on " + this._entity.name);
}
```

### onUpdate()
Called every frame:
```javascript
this.onUpdate = () => {
    // Get delta time (approximation)
    const deltaTime = 0.016; // ~60fps
    
    // Movement
    this.transform.Add("localPosition", {
        x: this.vars.speed.value * deltaTime,
        y: 0,
        z: 0
    });
    
    // Animation
    const time = (Date.now() - this.startTime) / 1000;
    const wave = Math.sin(time * 2);
    this.transform.Set("localScale", {
        x: 1 + wave * 0.1,
        y: 1 + wave * 0.1,
        z: 1 + wave * 0.1
    });
}
```

### onDestroy()
Cleanup when removed:
```javascript
this.onDestroy = () => {
    // Remove event listeners
    this._entity._bs.Off("click");
    this._entity._bs.Off("collision-enter");
    
    // Clear timers
    if (this.updateTimer) {
        clearInterval(this.updateTimer);
    }
    
    // Save state if needed
    this.saveProgress();
    
    this.log("Script destroyed");
}
```

## Available Context

### Built-in Objects
```javascript
// this._entity - The GameObject this script is attached to
const myName = this._entity.name;
const myId = this._entity.id;

// this._scene - The current scene
const allEntities = this._scene.getAllEntities();

// this._BS - BanterScript library
this._BS.LoadItem("prefab_id", parentId);

// this._component - The MonoBehavior component itself
const scriptId = this._component.id;
```

### Helper Methods
```javascript
// Logging
this.log("Debug message");
this.warn("Warning message");
this.error("Error message");

// Variable updates
this.updateVars(); // Sync variables from UI
this.getVar("speed"); // Get variable value
this.setVar("speed", 10); // Set variable value
```

## Variables System

### Variable Types
```javascript
this.vars = {
    // Number
    "health": {
        "type": "number",
        "value": 100,
        "min": 0,
        "max": 100
    },
    
    // String
    "playerName": {
        "type": "string",
        "value": "Player 1"
    },
    
    // Boolean
    "invincible": {
        "type": "boolean",
        "value": false
    },
    
    // Vector3
    "spawnPoint": {
        "type": "vector3",
        "value": {x: 0, y: 1, z: 0}
    },
    
    // Color
    "teamColor": {
        "type": "color",
        "value": {r: 0, g: 0, b: 1, a: 1}
    },
    
    // Asset Reference
    "soundEffect": {
        "type": "asset",
        "value": "audio/jump.wav"
    }
}
```

### Using Variables
```javascript
this.onUpdate = () => {
    // Access variable
    const speed = this.vars.speed.value;
    
    // Modify variable
    this.vars.health.value -= 1;
    
    // Use in calculations
    const finalSpeed = speed * this.vars.multiplier.value;
}
```

## Event Handling

### Input Events
```javascript
// Keyboard
document.addEventListener("keydown", (e) => {
    switch(e.key) {
        case "w": this.moveForward(); break;
        case "s": this.moveBack(); break;
        case "a": this.moveLeft(); break;
        case "d": this.moveRight(); break;
        case " ": this.jump(); break;
    }
});

// Mouse
document.addEventListener("mousedown", (e) => {
    if (e.button === 0) this.fire(); // Left click
    if (e.button === 2) this.aim();  // Right click
});
```

### Component Events
```javascript
// Click on this object
this._entity._bs.On("click", () => {
    this.vars.clickCount.value++;
    this.log("Clicked " + this.vars.clickCount.value + " times");
});

// Hover
this._entity._bs.On("hover-enter", () => {
    this.highlight(true);
});

this._entity._bs.On("hover-exit", () => {
    this.highlight(false);
});

// Grab (VR)
this._entity._bs.On("grab", (hand) => {
    this.log("Grabbed by " + hand);
});
```

### Collision Events
```javascript
// Collision
this._entity._bs.On("collision-enter", (collision) => {
    const other = collision.otherEntity;
    
    if (other.tag === "enemy") {
        this.takeDamage(10);
    } else if (other.tag === "powerup") {
        this.collectPowerup(other);
    }
});

// Trigger
this._entity._bs.On("trigger-enter", (other) => {
    if (other.name === "FinishLine") {
        this.completeLevel();
    }
});
```

## Inter-Script Communication

### Finding Other Scripts
```javascript
// Get script on same object
const otherScript = this._entity.getComponent("BanterMonoBehavior", "ScriptName");

// Get script on another object
const targetEntity = this._scene.getEntity("TargetObject");
const targetScript = targetEntity.getComponent("BanterMonoBehavior");

// Call method on other script
if (targetScript && targetScript.publicMethod) {
    targetScript.publicMethod(parameters);
}
```

### Global Events
```javascript
// Broadcast event
window.dispatchEvent(new CustomEvent("game-over", {
    detail: { score: this.score }
}));

// Listen for events
window.addEventListener("game-over", (e) => {
    this.log("Game over! Score: " + e.detail.score);
});
```

## Common Patterns

### Timer/Interval
```javascript
this.onStart = () => {
    // One-time delay
    setTimeout(() => {
        this.spawnEnemy();
    }, 5000);
    
    // Repeating interval
    this.spawnTimer = setInterval(() => {
        this.spawnWave();
    }, 10000);
}

this.onDestroy = () => {
    clearInterval(this.spawnTimer);
}
```

### State Machine
```javascript
this.states = {
    IDLE: "idle",
    MOVING: "moving",
    ATTACKING: "attacking"
};

this.currentState = this.states.IDLE;

this.onUpdate = () => {
    switch(this.currentState) {
        case this.states.IDLE:
            this.updateIdle();
            break;
        case this.states.MOVING:
            this.updateMoving();
            break;
        case this.states.ATTACKING:
            this.updateAttacking();
            break;
    }
}

this.changeState = (newState) => {
    this.log(`State: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
}
```

### Object Pooling
```javascript
this.onStart = () => {
    this.bulletPool = [];
    this.poolSize = 20;
    
    // Pre-create bullets
    for (let i = 0; i < this.poolSize; i++) {
        const bullet = this.createBullet();
        bullet.SetActive(false);
        this.bulletPool.push(bullet);
    }
}

this.fire = () => {
    let bullet = this.bulletPool.find(b => !b.active);
    
    if (!bullet) {
        bullet = this.createBullet();
        this.bulletPool.push(bullet);
    }
    
    bullet.SetActive(true);
    bullet.reset(this.transform.Get("position"));
}
```

## Performance Tips

### Optimize onUpdate
```javascript
// Cache references
this.onStart = () => {
    this.transform = this._entity.getTransform();
    this.material = this._entity.getComponent("BanterMaterial");
}

// Throttle expensive operations
this.frameCount = 0;
this.onUpdate = () => {
    this.frameCount++;
    
    // Only update every 10 frames
    if (this.frameCount % 10 === 0) {
        this.expensiveCalculation();
    }
}
```

### Memory Management
```javascript
// Clean up references
this.onDestroy = () => {
    this.enemies = null;
    this.particles = null;
    this.largeData = null;
}

// Reuse objects
const tempVector = {x: 0, y: 0, z: 0};
this.onUpdate = () => {
    // Reuse tempVector instead of creating new
    tempVector.x = Math.random();
    tempVector.y = Math.random();
    tempVector.z = Math.random();
    this.transform.Set("position", tempVector);
}
```

## Debugging

### Console Output
```javascript
// Different log levels
this.log("Info message");
this.warn("Warning: " + issue);
this.error("Error: " + error.message);

// Formatted output
console.table(this.vars);
console.group("Update Cycle");
console.log("Position:", position);
console.log("Velocity:", velocity);
console.groupEnd();
```

### Debug Visualization
```javascript
// Draw debug info (if supported)
this.debugDraw = () => {
    Debug.DrawLine(start, end, color);
    Debug.DrawRay(origin, direction, color);
    Debug.DrawSphere(center, radius, color);
}
```

## Advanced Examples

### Complete Enemy AI
```javascript
this.vars = {
    "speed": {"type": "number", "value": 2},
    "detectionRange": {"type": "number", "value": 10},
    "attackRange": {"type": "number", "value": 2},
    "health": {"type": "number", "value": 100}
}

this.onStart = () => {
    this.transform = this._entity.getTransform();
    this.target = null;
    this.state = "patrol";
}

this.onUpdate = () => {
    this.findTarget();
    
    switch(this.state) {
        case "patrol":
            this.patrol();
            break;
        case "chase":
            this.chaseTarget();
            break;
        case "attack":
            this.attackTarget();
            break;
    }
}

this.findTarget = () => {
    const players = this._scene.getEntitiesByTag("player");
    const myPos = this.transform.Get("position");
    
    let closest = null;
    let minDist = this.vars.detectionRange.value;
    
    players.forEach(player => {
        const dist = this.getDistance(myPos, player.position);
        if (dist < minDist) {
            closest = player;
            minDist = dist;
        }
    });
    
    this.target = closest;
    
    if (this.target) {
        if (minDist < this.vars.attackRange.value) {
            this.state = "attack";
        } else {
            this.state = "chase";
        }
    } else {
        this.state = "patrol";
    }
}
```

## Troubleshooting

### Script Not Running
- Check if MonoBehavior component is attached
- Verify GameObject is active
- Look for syntax errors in console
- Ensure onStart/onUpdate are defined correctly

### Variables Not Updating
- Call `this.updateVars()` to sync
- Check variable name spelling
- Verify type matches expected format

### Events Not Firing
- Confirm event listeners are registered
- Check if BS library is loaded
- Verify cleanup in onDestroy

## Related Components

- [Transform](./transform) - Position and movement
- [Rigidbody](./rigidbody) - Physics control
- [Collider](./collider) - Collision detection
- [Audio Source](./audio-source) - Sound playback