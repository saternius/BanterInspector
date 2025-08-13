---
sidebar_position: 4
title: Rigidbody Component
---

# Rigidbody Component

The Rigidbody component enables physics simulation, allowing objects to fall with gravity, bounce, and interact realistically with other physics objects.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>⚡ Physics Features</h3>
  <ul>
    <li>Gravity simulation</li>
    <li>Collision response</li>
    <li>Force and torque application</li>
    <li>Drag and angular drag</li>
    <li>Kinematic and dynamic modes</li>
  </ul>
</div>

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mass` | number | 1 | Weight in kilograms |
| `drag` | number | 0 | Air resistance (0-infinity) |
| `angularDrag` | number | 0.05 | Rotation resistance |
| `useGravity` | boolean | true | Affected by gravity |
| `isKinematic` | boolean | false | Controlled by animation/script |
| `constraints` | object | none | Freeze position/rotation axes |
| `velocity` | Vector3 | {0,0,0} | Current velocity |
| `angularVelocity` | Vector3 | {0,0,0} | Current rotation speed |

## Basic Usage

### Adding Physics
```javascript
// Via Inspector
1. Select GameObject with mesh
2. Add Component → Physics → Rigidbody
3. Add Component → Physics → Collider (required)

// Via Script
const rb = entity.addComponent("BanterRigidbody", {
    mass: 1,
    useGravity: true,
    drag: 0.5
});

// Must have collider for physics to work
entity.addComponent("BanterBoxCollider", {
    size: {x: 1, y: 1, z: 1}
});
```

## Physics Modes

### Dynamic (Default)
Full physics simulation:
```javascript
{
    isKinematic: false,
    useGravity: true,
    mass: 1
}
// Object falls, bounces, can be pushed
```

### Kinematic
Animated but affects other objects:
```javascript
{
    isKinematic: true,
    useGravity: false
}
// Moving platforms, animated obstacles
```

### Static (No Rigidbody)
Immovable collision geometry:
```javascript
// Just add collider without rigidbody
entity.addComponent("BanterBoxCollider");
// Walls, floors, static environment
```

## Applying Forces

### Add Force
```javascript
this.jump = () => {
    // Impulse upward
    this.rigidbody.AddForce({x: 0, y: 10, z: 0}, "Impulse");
}

this.push = (direction) => {
    // Continuous force
    this.rigidbody.AddForce({
        x: direction.x * 5,
        y: 0,
        z: direction.z * 5
    }, "Force");
}

// Force modes:
// "Force" - Continuous force (considers mass)
// "Impulse" - Instant force (considers mass)
// "VelocityChange" - Instant velocity (ignores mass)
// "Acceleration" - Continuous (ignores mass)
```

### Add Torque
```javascript
// Spin object
this.spin = () => {
    this.rigidbody.AddTorque({x: 0, y: 10, z: 0}, "Impulse");
}

// Continuous rotation
this.rotateContinuously = () => {
    this.rigidbody.AddTorque({x: 1, y: 2, z: 0}, "Force");
}
```

## Velocity Control

### Direct Velocity
```javascript
// Set velocity directly
this.rigidbody.Set("velocity", {x: 5, y: 0, z: 0}); // Move right at 5m/s

// Stop completely
this.rigidbody.Set("velocity", {x: 0, y: 0, z: 0});
this.rigidbody.Set("angularVelocity", {x: 0, y: 0, z: 0});
```

### Velocity Clamping
```javascript
this.clampVelocity = (maxSpeed) => {
    const vel = this.rigidbody.Get("velocity");
    const speed = Math.sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
    
    if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        this.rigidbody.Set("velocity", {
            x: vel.x * scale,
            y: vel.y * scale,
            z: vel.z * scale
        });
    }
}
```

## Constraints

### Freeze Position/Rotation
```javascript
// Freeze Y position (no jumping/falling)
rigidbody.Set("constraints", {
    freezePositionY: true
});

// Freeze all rotation
rigidbody.Set("constraints", {
    freezeRotationX: true,
    freezeRotationY: true,
    freezeRotationZ: true
});

// 2D-style movement (X/Y only, no rotation)
rigidbody.Set("constraints", {
    freezePositionZ: true,
    freezeRotationX: true,
    freezeRotationY: true
});
```

## Collision Detection

### Collision Events
```javascript
this.onStart = () => {
    this.rigidbody = this._entity.getComponent("BanterRigidbody");
    
    // Collision enter
    this._entity._bs.On("collision-enter", (collision) => {
        console.log("Hit:", collision.otherEntity.name);
        const impact = collision.relativeVelocity.magnitude;
        
        if (impact > 5) {
            // High speed collision
            this.playImpactSound(impact);
        }
    });
    
    // Collision stay
    this._entity._bs.On("collision-stay", (collision) => {
        // Continuous contact
    });
    
    // Collision exit
    this._entity._bs.On("collision-exit", (collision) => {
        console.log("Stopped touching:", collision.otherEntity.name);
    });
}
```

### Trigger Events
With `isTrigger` colliders:
```javascript
this._entity._bs.On("trigger-enter", (other) => {
    // Entered trigger zone
    if (other.tag === "pickup") {
        this.collectItem(other);
    }
});
```

## Common Physics Patterns

### Character Controller
```javascript
class CharacterController {
    constructor(entity) {
        this.entity = entity;
        this.rigidbody = entity.getComponent("BanterRigidbody");
        this.moveSpeed = 5;
        this.jumpForce = 8;
        this.grounded = false;
        
        // Setup
        this.rigidbody.Set("constraints", {
            freezeRotationX: true,
            freezeRotationZ: true
        });
    }
    
    move(direction) {
        const vel = this.rigidbody.Get("velocity");
        this.rigidbody.Set("velocity", {
            x: direction.x * this.moveSpeed,
            y: vel.y, // Preserve vertical velocity
            z: direction.z * this.moveSpeed
        });
    }
    
    jump() {
        if (this.grounded) {
            this.rigidbody.AddForce({
                x: 0, 
                y: this.jumpForce, 
                z: 0
            }, "Impulse");
            this.grounded = false;
        }
    }
    
    checkGrounded() {
        // Raycast or collision check
        // Set this.grounded accordingly
    }
}
```

### Projectile
```javascript
class Projectile {
    constructor(entity, direction, speed) {
        this.entity = entity;
        this.rigidbody = entity.getComponent("BanterRigidbody");
        
        // Launch
        this.rigidbody.Set("velocity", {
            x: direction.x * speed,
            y: direction.y * speed,
            z: direction.z * speed
        });
        
        // Cleanup after time
        setTimeout(() => {
            this.destroy();
        }, 5000);
    }
    
    destroy() {
        this.entity.remove();
    }
}
```

### Floating Object
```javascript
this.float = () => {
    const time = Date.now() * 0.001;
    const floatForce = Math.sin(time * 2) * 2;
    
    this.rigidbody.AddForce({
        x: 0,
        y: floatForce,
        z: 0
    }, "Force");
}
```

## Performance Optimization

### Sleep Settings
```javascript
// Let physics engine sleep idle objects
rigidbody.Set("sleepThreshold", 0.5); // Velocity below this = sleep

// Force wake
rigidbody.WakeUp();

// Force sleep
rigidbody.Sleep();
```

### Collision Layers
```javascript
// Set collision layer
rigidbody.Set("layer", "Player");

// Configure what layers collide
Physics.IgnoreLayerCollision("Player", "PlayerProjectiles");
```

### Continuous vs Discrete
```javascript
// Fast objects need continuous collision
rigidbody.Set("collisionDetection", "Continuous");

// Slow objects can use discrete (default, faster)
rigidbody.Set("collisionDetection", "Discrete");
```

## Advanced Techniques

### Explosion Force
```javascript
this.explode = (center, radius, force) => {
    // Find all rigidbodies in radius
    const affected = this.findRigidbodiesInRadius(center, radius);
    
    affected.forEach(rb => {
        const pos = rb.entity.getTransform().Get("position");
        
        // Calculate direction and distance
        const dx = pos.x - center.x;
        const dy = pos.y - center.y;
        const dz = pos.z - center.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance > 0 && distance < radius) {
            // Falloff with distance
            const falloff = 1 - (distance / radius);
            const impulse = falloff * force;
            
            // Apply explosion force
            rb.AddForce({
                x: (dx / distance) * impulse,
                y: (dy / distance) * impulse + impulse * 0.5, // Extra upward
                z: (dz / distance) * impulse
            }, "Impulse");
        }
    });
}
```

### Ragdoll Physics
```javascript
class Ragdoll {
    constructor(skeleton) {
        this.parts = [];
        
        // Create rigidbody for each bone
        skeleton.bones.forEach(bone => {
            const rb = bone.addComponent("BanterRigidbody", {
                mass: 1,
                drag: 0.5,
                angularDrag: 2
            });
            
            // Add appropriate collider
            bone.addComponent("BanterCapsuleCollider");
            
            this.parts.push(rb);
        });
        
        // Connect with joints
        this.setupJoints();
    }
    
    activate() {
        // Switch from animated to physics
        this.parts.forEach(rb => {
            rb.Set("isKinematic", false);
        });
    }
}
```

## Troubleshooting

### Object Falls Through Floor
- Add collider to floor
- Check collider sizes
- Use continuous collision for fast objects
- Increase physics timestep

### Jittery Movement
- Increase drag values
- Check for conflicting forces
- Use interpolation
- Verify mass values

### Not Responding to Forces
- Check isKinematic = false
- Verify rigidbody is active
- Ensure mass > 0
- Check constraints

## Related Components

- [Box Collider](./box-collider) - Required for physics
- [Transform](./transform) - Position and rotation
- [Joint](./joint) - Connect rigidbodies
- [Physics Material](./physics-material) - Bounce and friction