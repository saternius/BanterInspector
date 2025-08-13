---
sidebar_position: 3
title: Rotating Gallery
---

# Tutorial: Rotating Gallery

Create an animated gallery of objects that rotate in synchronization. Perfect for showcasing items, creating ambient animations, or building interactive displays.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎯 What You'll Learn</h3>
  <ul>
    <li>Working with multiple objects</li>
    <li>Synchronizing animations</li>
    <li>Using mathematical patterns</li>
    <li>Creating prefabs and instances</li>
    <li>Performance optimization</li>
  </ul>
</div>

## Prerequisites

- Completed [Interactive Button](./interactive-button) tutorial
- Understanding of transforms and scripting
- Basic math concepts (sine, cosine)

## Step 1: Create the Gallery Structure

### Gallery Container
1. Create Empty GameObject → Name it `RotatingGallery`
2. Set Transform:
   ```javascript
   Position: {x: 0, y: 1.5, z: 0}
   Rotation: {x: 0, y: 0, z: 0}
   Scale: {x: 1, y: 1, z: 1}
   ```

### Center Pivot
1. Add child Empty → Name it `CenterPivot`
2. This will be our rotation center
3. Keep at origin (0, 0, 0)

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>📊 Diagram Placeholder</strong></p>
    <p>Top-down view showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Center pivot point</li>
      <li>Circular arrangement of 8 objects</li>
      <li>Rotation direction arrows</li>
      <li>Radius measurement</li>
    </ul>
  </div>
</div>

## Step 2: Create Display Items

### Item Prefab
Create a reusable display item:

1. Create child of `CenterPivot` → **3D Object** → **Box**
2. Name it `DisplayItem_Template`
3. Add components:
   - **Material** (different color)
   - **Light** (point light for glow)
4. Configure:
   ```javascript
   Scale: {x: 0.3, y: 0.3, z: 0.3}
   Material: {
     shaderColor: {r: 0.8, g: 0.3, b: 0.3, a: 1},
     emission: {r: 0.2, g: 0, b: 0, a: 1}
   }
   ```

### Duplicate and Arrange
Create 8 items in a circle:

```javascript
// Pseudo-code for arrangement
const itemCount = 8;
const radius = 2; // meters

for (let i = 0; i < itemCount; i++) {
    const angle = (i / itemCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Position each item
    item.position = {x: x, y: 0, z: z};
}
```

## Step 3: Gallery Rotation Script

### Main Rotation Controller
1. Select `RotatingGallery`
2. Add **MonoBehavior** component
3. Add this script:

```javascript
// Gallery configuration
this.vars = {
    "rotationSpeed": {
        "type": "number",
        "value": 10  // degrees per second
    },
    "radius": {
        "type": "number",
        "value": 2
    },
    "itemCount": {
        "type": "number",
        "value": 8
    },
    "autoArrange": {
        "type": "boolean",
        "value": true
    },
    "itemRotationSpeed": {
        "type": "number",
        "value": 30  // Individual item spin
    },
    "waveAnimation": {
        "type": "boolean",
        "value": true
    },
    "waveHeight": {
        "type": "number",
        "value": 0.3
    },
    "waveSpeed": {
        "type": "number",
        "value": 1
    }
}

this.onStart = () => {
    console.log("Gallery starting...");
    
    // Get references
    this.centerPivot = this.getChildByName("CenterPivot");
    this.displayItems = [];
    this.time = 0;
    
    // Auto-arrange items if enabled
    if (this.vars.autoArrange.value) {
        this.arrangeItems();
    }
    
    // Collect all display items
    this.collectDisplayItems();
}

this.onUpdate = () => {
    // Update time
    this.time += 0.016; // ~60fps
    
    // Rotate entire gallery
    this.rotateGallery();
    
    // Rotate individual items
    this.rotateItems();
    
    // Apply wave animation
    if (this.vars.waveAnimation.value) {
        this.animateWave();
    }
}

this.rotateGallery = () => {
    // Rotate the center pivot
    const speed = this.vars.rotationSpeed.value;
    this.centerPivot.getTransform().Add("localRotation", {
        x: 0,
        y: speed * 0.016,  // Convert to frame time
        z: 0
    });
}

this.rotateItems = () => {
    // Rotate each item on its own axis
    const itemSpeed = this.vars.itemRotationSpeed.value;
    
    this.displayItems.forEach((item, index) => {
        item.getTransform().Add("localRotation", {
            x: itemSpeed * 0.016,
            y: itemSpeed * 0.016 * 1.5,  // Different speed for variety
            z: 0
        });
    });
}

this.animateWave = () => {
    // Create wave effect
    const waveSpeed = this.vars.waveSpeed.value;
    const waveHeight = this.vars.waveHeight.value;
    
    this.displayItems.forEach((item, index) => {
        // Calculate wave offset for each item
        const offset = (index / this.displayItems.length) * Math.PI * 2;
        const wave = Math.sin(this.time * waveSpeed + offset) * waveHeight;
        
        // Apply vertical movement
        const transform = item.getTransform();
        const currentPos = transform.Get("localPosition");
        transform.Set("localPosition", {
            x: currentPos.x,
            y: wave,
            z: currentPos.z
        });
    });
}

this.arrangeItems = () => {
    // Automatically arrange items in a circle
    const children = this.centerPivot.getChildren();
    const radius = this.vars.radius.value;
    const count = Math.min(children.length, this.vars.itemCount.value);
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        children[i].getTransform().Set("localPosition", {
            x: x,
            y: 0,
            z: z
        });
    }
}

this.collectDisplayItems = () => {
    // Get all child items for animation
    const children = this.centerPivot.getChildren();
    this.displayItems = children.filter(child => 
        child.name.includes("DisplayItem")
    );
    console.log(`Found ${this.displayItems.length} display items`);
}

// Helper function
this.getChildByName = (name) => {
    const children = this._entity.getChildren();
    return children.find(child => child.name === name);
}
```

## Step 4: Enhance Individual Items

### Item Interaction Script
Add to each display item:

```javascript
// Item-specific behavior
this.vars = {
    "glowIntensity": {
        "type": "number",
        "value": 0.5
    },
    "selected": {
        "type": "boolean",
        "value": false
    }
}

this.onStart = () => {
    this.material = this._entity.getComponent("BanterMaterial");
    this.originalColor = this.material.Get("shaderColor");
    this.light = this._entity.getComponent("BanterLight");
    
    // Set up interaction
    this._entity._bs.On("click", () => {
        this.toggleSelection();
    });
    
    this._entity._bs.On("hover-enter", () => {
        this.highlight(true);
    });
    
    this._entity._bs.On("hover-exit", () => {
        this.highlight(false);
    });
}

this.toggleSelection = () => {
    this.vars.selected.value = !this.vars.selected.value;
    
    if (this.vars.selected.value) {
        // Scale up when selected
        this._entity.getTransform().Set("localScale", {
            x: 0.4, y: 0.4, z: 0.4
        });
        
        // Brighten color
        this.material.Set("emission", {
            r: this.vars.glowIntensity.value,
            g: this.vars.glowIntensity.value * 0.5,
            b: 0,
            a: 1
        });
    } else {
        // Reset
        this._entity.getTransform().Set("localScale", {
            x: 0.3, y: 0.3, z: 0.3
        });
        
        this.material.Set("emission", {
            r: 0.2, g: 0, b: 0, a: 1
        });
    }
}

this.highlight = (active) => {
    if (active) {
        // Brighten on hover
        this.light.Set("intensity", 2);
    } else {
        // Reset
        this.light.Set("intensity", 1);
    }
}
```

## Step 5: Advanced Patterns

### Spiral Pattern
Alternative arrangement pattern:

```javascript
this.arrangeSpiralPattern = () => {
    const items = this.displayItems;
    const spiralTurns = 2;
    
    items.forEach((item, i) => {
        const t = i / items.length;
        const angle = t * Math.PI * 2 * spiralTurns;
        const radius = this.vars.radius.value * (0.5 + t * 0.5);
        const height = t * 1; // Spiral upward
        
        item.getTransform().Set("localPosition", {
            x: Math.cos(angle) * radius,
            y: height,
            z: Math.sin(angle) * radius
        });
    });
}
```

### DNA Helix Pattern
Double helix arrangement:

```javascript
this.arrangeDNAPattern = () => {
    const items = this.displayItems;
    const halfCount = Math.floor(items.length / 2);
    
    items.forEach((item, i) => {
        const strand = i < halfCount ? 0 : 1;
        const index = strand === 0 ? i : i - halfCount;
        const t = index / halfCount;
        
        const angle = t * Math.PI * 4; // Two full rotations
        const radius = this.vars.radius.value;
        const height = t * 3 - 1.5; // Center vertically
        const offset = strand * Math.PI; // Opposite strands
        
        item.getTransform().Set("localPosition", {
            x: Math.cos(angle + offset) * radius,
            y: height,
            z: Math.sin(angle + offset) * radius
        });
    });
}
```

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>🎥 Video Placeholder</strong></p>
    <p>1-minute demo showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Gallery rotating smoothly</li>
      <li>Individual items spinning</li>
      <li>Wave animation effect</li>
      <li>Click interaction on items</li>
      <li>Pattern switching (circle → spiral → DNA)</li>
    </ul>
  </div>
</div>

## Step 6: Performance Optimization

### Object Pooling
Reuse objects instead of creating/destroying:

```javascript
class ItemPool {
    constructor(prefab, poolSize) {
        this.prefab = prefab;
        this.available = [];
        this.inUse = [];
        
        // Pre-create pool
        for (let i = 0; i < poolSize; i++) {
            const item = this.createItem();
            item.SetActive(false);
            this.available.push(item);
        }
    }
    
    get() {
        let item = this.available.pop();
        if (!item) {
            item = this.createItem();
        }
        item.SetActive(true);
        this.inUse.push(item);
        return item;
    }
    
    release(item) {
        item.SetActive(false);
        const index = this.inUse.indexOf(item);
        if (index > -1) {
            this.inUse.splice(index, 1);
            this.available.push(item);
        }
    }
    
    createItem() {
        return this.prefab.instantiate();
    }
}
```

### LOD (Level of Detail)
Reduce complexity at distance:

```javascript
this.updateLOD = () => {
    const cameraDistance = this.getDistanceToCamera();
    
    if (cameraDistance > 10) {
        // Far - simple rotation only
        this.disableWaveAnimation();
        this.setItemDetail("low");
    } else if (cameraDistance > 5) {
        // Medium - some effects
        this.enableWaveAnimation();
        this.setItemDetail("medium");
    } else {
        // Close - all effects
        this.enableWaveAnimation();
        this.setItemDetail("high");
    }
}
```

## Challenge Extensions

### 1. Dynamic Content
- Load images/textures onto items
- Display user inventory items
- Show achievement badges

### 2. Interactive Controls
- Speed control slider
- Pattern selector buttons
- Color theme switcher

### 3. Advanced Animations
- Particle trails on items
- Morphing between patterns
- Audio-reactive movement

### 4. Multi-Gallery System
- Multiple galleries at different heights
- Nested rotating systems
- Interconnected galleries

## Complete Gallery Package

Your finished gallery includes:
- Configurable rotation speeds
- Multiple arrangement patterns
- Interactive items with feedback
- Performance optimization
- Reusable prefab system

Save as "Rotating Gallery System" in your inventory!

## Troubleshooting

### Items Not Rotating
- Check script is attached to correct object
- Verify `onUpdate` is being called
- Look for transform conflicts

### Performance Issues
- Reduce item count
- Simplify materials
- Disable shadows on lights
- Use object pooling

### Arrangement Problems
- Check child-parent relationships
- Verify position calculations
- Ensure correct coordinate space

## What You've Learned

✅ Managing multiple synchronized objects
✅ Mathematical patterns for arrangements
✅ Performance optimization techniques
✅ Complex animation systems
✅ Prefab and instance management

## Next Steps

Continue exploring with:
- [Spawn System](/docs/examples/) - Dynamic object creation
- [Physics Playground](/docs/tutorials/) - Advanced physics
- [Multiplayer Features](/docs/core-concepts/) - Shared experiences