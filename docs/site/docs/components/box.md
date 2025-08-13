---
sidebar_position: 1
title: Box Component
---

# Box Component

The Box component creates a rectangular cuboid mesh - one of the most fundamental building blocks in 3D scenes.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎯 Common Use Cases</h3>
  <ul>
    <li>Walls and floors</li>
    <li>Platforms and stairs</li>
    <li>UI buttons and panels</li>
    <li>Building blocks</li>
    <li>Trigger zones</li>
  </ul>
</div>

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | number | 1 | Size along the X axis |
| `height` | number | 1 | Size along the Y axis |
| `depth` | number | 1 | Size along the Z axis |

## Basic Usage

### Creating a Box

```javascript
// Via Inspector UI
1. Select GameObject in Hierarchy
2. Add Component → Geometry → Box
3. Adjust width, height, depth in Properties

// Via Script
const box = entity.addComponent("BanterBox", {
    width: 2,
    height: 1,
    depth: 0.5
});
```

### Common Configurations

#### Wall
```javascript
{
    width: 4,    // Wide
    height: 3,   // Tall
    depth: 0.1   // Thin
}
```

#### Floor/Platform
```javascript
{
    width: 10,   // Large area
    height: 0.1, // Thin
    depth: 10    // Large area
}
```

#### Cube
```javascript
{
    width: 1,    // Equal dimensions
    height: 1,
    depth: 1
}
```

## Scripting Examples

### Dynamic Resizing
```javascript
this.onStart = () => {
    this.box = this._entity.getComponent("BanterBox");
    this.time = 0;
}

this.onUpdate = () => {
    this.time += 0.016;
    // Pulsing effect
    const scale = 1 + Math.sin(this.time * 2) * 0.2;
    this.box.Set("width", scale);
    this.box.Set("height", scale);
    this.box.Set("depth", scale);
}
```

### Procedural Generation
```javascript
// Create a staircase
for (let i = 0; i < 10; i++) {
    const step = scene.createEntity({
        name: `Step_${i}`,
        position: {
            x: i * 0.3,
            y: i * 0.15,
            z: 0
        }
    });
    
    step.addComponent("BanterBox", {
        width: 1,
        height: 0.15,
        depth: 0.3
    });
}
```

## Combining with Other Components

### Box with Physics
```javascript
// Solid physics object
entity.addComponent("BanterBox", {width: 1, height: 1, depth: 1});
entity.addComponent("BanterRigidbody", {mass: 1, useGravity: true});
entity.addComponent("BanterBoxCollider", {size: {x: 1, y: 1, z: 1}});
```

### Box with Material
```javascript
// Colored box
entity.addComponent("BanterBox", {width: 2, height: 2, depth: 2});
entity.addComponent("BanterMaterial", {
    shaderColor: {r: 0.5, g: 0.8, b: 0.3, a: 1},
    metallic: 0.3,
    smoothness: 0.7
});
```

## Performance Considerations

- **Batching**: Boxes with same material can be batched
- **Colliders**: Match collider size to box size
- **LOD**: Use simpler geometry at distance
- **Instances**: Reuse box prefabs when possible

## Tips and Tricks

### Perfect Cube
Set all dimensions equal:
```javascript
const size = 1.5;
box.Set("width", size);
box.Set("height", size);
box.Set("depth", size);
```

### Flat Panel
Make one dimension very small:
```javascript
// Vertical panel
{width: 2, height: 3, depth: 0.01}

// Horizontal panel
{width: 2, height: 0.01, depth: 3}
```

### Hollow Box (Room)
Create 6 boxes for walls:
```javascript
// Floor
{width: 10, height: 0.1, depth: 10, position: {y: 0}}

// Ceiling
{width: 10, height: 0.1, depth: 10, position: {y: 3}}

// Walls (4x)
// Adjust position and rotation for each wall
```

## Common Issues

### Box Not Visible
- Check if material is attached
- Verify position is in view
- Ensure scale is not zero
- Check if parent is active

### Incorrect Size
- Remember: size is in world units (meters)
- Check parent scale influence
- Verify property values are positive

### Z-Fighting
When two surfaces overlap:
- Slightly offset positions
- Adjust depth values
- Use different render order

## Advanced Techniques

### Morphing Box
Smoothly transition between shapes:
```javascript
class MorphingBox {
    constructor(box) {
        this.box = box;
        this.targetWidth = 1;
        this.targetHeight = 1;
        this.targetDepth = 1;
        this.morphSpeed = 0.1;
    }
    
    morphTo(width, height, depth) {
        this.targetWidth = width;
        this.targetHeight = height;
        this.targetDepth = depth;
    }
    
    update() {
        const currentWidth = this.box.Get("width");
        const currentHeight = this.box.Get("height");
        const currentDepth = this.box.Get("depth");
        
        // Lerp to target
        this.box.Set("width", 
            currentWidth + (this.targetWidth - currentWidth) * this.morphSpeed);
        this.box.Set("height",
            currentHeight + (this.targetHeight - currentHeight) * this.morphSpeed);
        this.box.Set("depth",
            currentDepth + (this.targetDepth - currentDepth) * this.morphSpeed);
    }
}
```

### Box Grid System
Create aligned grid of boxes:
```javascript
function createBoxGrid(rows, cols, spacing) {
    const boxes = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const box = scene.createEntity({
                name: `Box_${r}_${c}`,
                position: {
                    x: c * spacing - (cols * spacing) / 2,
                    y: 0,
                    z: r * spacing - (rows * spacing) / 2
                }
            });
            box.addComponent("BanterBox", {
                width: 0.8,
                height: 0.8,
                depth: 0.8
            });
            boxes.push(box);
        }
    }
    return boxes;
}
```

## Related Components

- [Box Collider](./box-collider) - Add collision detection
- [Material](./material) - Control appearance
- [Rigidbody](./rigidbody) - Add physics
- [Transform](./transform) - Position and rotate