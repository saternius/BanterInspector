---
sidebar_position: 3
title: Transform Component
---

# Transform Component

The Transform component defines an object's position, rotation, and scale in 3D space. Every GameObject has a Transform - it's the most fundamental component.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>📍 Core Concepts</h3>
  <ul>
    <li><strong>Position:</strong> Where the object is located</li>
    <li><strong>Rotation:</strong> How the object is oriented</li>
    <li><strong>Scale:</strong> The size of the object</li>
    <li><strong>Local vs World:</strong> Relative to parent or absolute</li>
  </ul>
</div>

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `localPosition` | Vector3 | `{x:0, y:0, z:0}` | Position relative to parent |
| `localRotation` | Vector3 | `{x:0, y:0, z:0}` | Euler angles relative to parent |
| `localScale` | Vector3 | `{x:1, y:1, z:1}` | Scale relative to parent |
| `position` | Vector3 | `{x:0, y:0, z:0}` | World position |
| `rotation` | Vector3 | `{x:0, y:0, z:0}` | World rotation |

## Basic Usage

### Accessing Transform
```javascript
// Every entity has a transform
const transform = entity.getTransform();

// In MonoBehavior scripts
this.onStart = () => {
    this.transform = this._entity.getTransform();
}
```

### Setting Position
```javascript
// Absolute positioning
transform.Set("position", {x: 10, y: 5, z: -3});

// Relative to parent
transform.Set("localPosition", {x: 0, y: 1, z: 0});

// Move to another object's position
const targetPos = targetEntity.getTransform().Get("position");
transform.Set("position", targetPos);
```

### Setting Rotation
```javascript
// Euler angles (degrees)
transform.Set("rotation", {x: 0, y: 45, z: 0}); // 45° around Y axis

// Face a direction
this.lookAt = (target) => {
    const myPos = transform.Get("position");
    const targetPos = target.Get("position");
    
    // Calculate direction
    const dx = targetPos.x - myPos.x;
    const dz = targetPos.z - myPos.z;
    
    // Convert to rotation
    const angleY = Math.atan2(dx, dz) * (180 / Math.PI);
    transform.Set("rotation", {x: 0, y: angleY, z: 0});
}
```

### Setting Scale
```javascript
// Uniform scale
transform.Set("localScale", {x: 2, y: 2, z: 2}); // Double size

// Non-uniform scale
transform.Set("localScale", {x: 1, y: 2, z: 0.5}); // Stretched

// Reset to normal
transform.Set("localScale", {x: 1, y: 1, z: 1});
```

## Transform Methods

### Add (Incremental Changes)
```javascript
// Move relative to current position
transform.Add("localPosition", {x: 1, y: 0, z: 0}); // Move right 1 unit

// Rotate continuously
transform.Add("localRotation", {x: 0, y: 1, z: 0}); // Spin around Y

// Grow over time
transform.Add("localScale", {x: 0.01, y: 0.01, z: 0.01});
```

### Multiply (Scaling Operations)
```javascript
// Scale by factor
transform.Multiply("localScale", {x: 1.1, y: 1.1, z: 1.1}); // 10% bigger

// Shrink
transform.Multiply("localScale", {x: 0.9, y: 0.9, z: 0.9}); // 10% smaller
```

## Animation Patterns

### Smooth Movement
```javascript
this.moveToPosition = (targetPos, speed = 1) => {
    const currentPos = this.transform.Get("position");
    
    // Calculate direction
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const dz = targetPos.z - currentPos.z;
    
    // Calculate distance
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance > 0.01) {
        // Normalize and apply speed
        const moveX = (dx / distance) * speed * 0.016;
        const moveY = (dy / distance) * speed * 0.016;
        const moveZ = (dz / distance) * speed * 0.016;
        
        this.transform.Add("position", {x: moveX, y: moveY, z: moveZ});
    }
}
```

### Orbiting
```javascript
this.orbit = () => {
    this.orbitAngle = (this.orbitAngle || 0) + 1;
    const radius = 5;
    const height = 2;
    
    const x = Math.cos(this.orbitAngle * Math.PI / 180) * radius;
    const z = Math.sin(this.orbitAngle * Math.PI / 180) * radius;
    
    this.transform.Set("position", {x: x, y: height, z: z});
    
    // Look at center
    this.transform.Set("rotation", {x: 0, y: -this.orbitAngle, z: 0});
}
```

### Bobbing Motion
```javascript
this.bob = () => {
    this.bobTime = (this.bobTime || 0) + 0.05;
    const baseY = 1;
    const amplitude = 0.5;
    
    const y = baseY + Math.sin(this.bobTime) * amplitude;
    this.transform.Set("localPosition", {
        x: this.transform.Get("localPosition").x,
        y: y,
        z: this.transform.Get("localPosition").z
    });
}
```

## Coordinate Systems

### Local Space
Position relative to parent:
```javascript
// Child at local (1, 0, 0)
// If parent is at world (10, 5, 0)
// Child's world position is (11, 5, 0)
```

### World Space
Absolute position in scene:
```javascript
// Convert local to world
const worldPos = this.localToWorld(localPos);

// Convert world to local
const localPos = this.worldToLocal(worldPos);
```

### Screen Space
For UI positioning:
```javascript
// Position UI element at screen coordinates
uiElement.transform.Set("position", {
    x: screenWidth / 2,   // Center X
    y: screenHeight / 2,  // Center Y
    z: 0                  // UI layer
});
```

## Parent-Child Relationships

### Setting Parent
```javascript
// Make child of another object
childEntity.setParent(parentEntity.id);

// Remove from parent (become root)
childEntity.setParent(null);
```

### Transform Inheritance
```javascript
// Parent scale affects children
parentTransform.Set("localScale", {x: 2, y: 2, z: 2});
// All children are now twice as large

// Parent rotation affects children
parentTransform.Set("localRotation", {x: 0, y: 45, z: 0});
// All children rotate with parent
```

## Advanced Techniques

### Smooth Follow
```javascript
class SmoothFollow {
    constructor(transform, target, smoothness = 0.1) {
        this.transform = transform;
        this.target = target;
        this.smoothness = smoothness;
    }
    
    update() {
        const currentPos = this.transform.Get("position");
        const targetPos = this.target.Get("position");
        
        // Lerp position
        const newPos = {
            x: currentPos.x + (targetPos.x - currentPos.x) * this.smoothness,
            y: currentPos.y + (targetPos.y - currentPos.y) * this.smoothness,
            z: currentPos.z + (targetPos.z - currentPos.z) * this.smoothness
        };
        
        this.transform.Set("position", newPos);
    }
}
```

### Bezier Curve Movement
```javascript
this.bezierMove = (p0, p1, p2, p3, duration) => {
    const startTime = Date.now();
    
    const update = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        // Cubic bezier formula
        const pos = this.cubicBezier(p0, p1, p2, p3, t);
        this.transform.Set("position", pos);
        
        if (t < 1) {
            requestAnimationFrame(update);
        }
    };
    
    update();
}

this.cubicBezier = (p0, p1, p2, p3, t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
        z: mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t3 * p3.z
    };
}
```

## Performance Tips

### Batch Transform Updates
```javascript
// Instead of multiple calls
transform.Set("position", pos);
transform.Set("rotation", rot);
transform.Set("scale", scale);

// Use single update
transform.SetMultiple({
    position: pos,
    rotation: rot,
    scale: scale
});
```

### Cache Transform References
```javascript
// Good - cache reference
this.onStart = () => {
    this.transform = this._entity.getTransform();
}
this.onUpdate = () => {
    this.transform.Add("rotation", {y: 1});
}

// Bad - lookup every frame
this.onUpdate = () => {
    this._entity.getTransform().Add("rotation", {y: 1});
}
```

## Common Issues

### Object Not Moving
- Check if parent is static
- Verify position values are changing
- Ensure object isn't constrained
- Look for conflicting scripts

### Rotation Problems
- Remember Euler angles can gimbal lock
- Use quaternions for complex rotations
- Check rotation order (default: YXZ)

### Scale Issues
- Non-uniform parent scale can distort children
- Negative scale flips normals
- Scale affects physics colliders

## Related Components

- [Rigidbody](./rigidbody) - Physics-based movement
- [Box Collider](./box-collider) - Collision detection
- [Parent Constraint](./parent-constraint) - Advanced parenting
- [Animation](./animation) - Keyframe animation