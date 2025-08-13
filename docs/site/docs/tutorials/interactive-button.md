---
sidebar_position: 2
title: Interactive Button
---

# Tutorial: Interactive Button

Learn to create a fully functional button that responds to clicks, changes appearance on hover, and triggers actions. Perfect for UI elements and interactive controls.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎯 What You'll Learn</h3>
  <ul>
    <li>Creating clickable UI elements</li>
    <li>Handling user input events</li>
    <li>Visual feedback with hover states</li>
    <li>Playing sounds on interaction</li>
    <li>Triggering complex actions</li>
  </ul>
</div>

## Prerequisites

- Completed [Hello VR World](./hello-vr-world) tutorial
- Basic understanding of components
- Familiarity with the Properties Panel

## Step 1: Create the Button Structure

### Create Button Container
1. Right-click in Hierarchy → **Create Empty**
2. Name it `InteractiveButton`
3. Set Transform:
   ```javascript
   Position: {x: 0, y: 1.5, z: -2}  // Eye level
   Rotation: {x: 0, y: 0, z: 0}
   Scale: {x: 1, y: 1, z: 1}
   ```

### Add Button Surface
1. With `InteractiveButton` selected, add child: **3D Object** → **Box**
2. Name it `ButtonSurface`
3. Configure Transform:
   ```javascript
   Scale: {x: 0.5, y: 0.2, z: 0.1}  // Wide, flat button
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
    <p><strong>📸 Screenshot Placeholder</strong></p>
    <p>Image showing button hierarchy:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>InteractiveButton parent object</li>
      <li>ButtonSurface child (highlighted)</li>
      <li>Transform properties in Properties Panel</li>
    </ul>
  </div>
</div>

## Step 2: Style the Button

### Add Material
1. Select `ButtonSurface`
2. Add Component → **Rendering** → **Material**
3. Set properties:
   ```javascript
   shaderColor: {r: 0.4, g: 0.5, b: 0.9, a: 1}  // Blue
   metallic: 0.3
   smoothness: 0.8
   ```

### Add Button Label
1. Add child to `InteractiveButton`: **UI** → **Text**
2. Name it `ButtonLabel`
3. Configure Text component:
   ```javascript
   text: "CLICK ME"
   fontSize: 36
   alignment: "Center"
   color: {r: 1, g: 1, b: 1, a: 1}  // White
   ```
4. Position text:
   ```javascript
   Position: {x: 0, y: 0, z: -0.06}  // In front of button
   ```

## Step 3: Add Click Detection

### Add Collider
1. Select `ButtonSurface`
2. Add Component → **Physics** → **Box Collider**
3. Enable trigger mode:
   ```javascript
   isTrigger: true
   size: {x: 1, y: 1, z: 1}  // Matches box scale
   ```

### Create Click Handler Script
1. Select `InteractiveButton`
2. Add Component → **Scripting** → **MonoBehavior**
3. Click **Edit Script** and add:

```javascript
// Button state
this.vars = {
    "clickCount": {
        "type": "number",
        "value": 0
    },
    "hoverColor": {
        "type": "color",
        "value": {r: 0.6, g: 0.7, b: 1, a: 1}
    },
    "normalColor": {
        "type": "color",
        "value": {r: 0.4, g: 0.5, b: 0.9, a: 1}
    },
    "clickColor": {
        "type": "color",
        "value": {r: 0.2, g: 0.3, b: 0.7, a: 1}
    }
}

this.onStart = () => {
    // Get references
    this.buttonSurface = this.getChildEntity("ButtonSurface");
    this.buttonLabel = this.getChildEntity("ButtonLabel");
    this.material = this.buttonSurface.getComponent("BanterMaterial");
    this.textComponent = this.buttonLabel.getComponent("BanterText");
    
    // Set up click handler
    this._entity._bs.On("click", () => {
        this.handleClick();
    });
    
    // Set up hover handlers
    this._entity._bs.On("hover-enter", () => {
        this.handleHoverEnter();
    });
    
    this._entity._bs.On("hover-exit", () => {
        this.handleHoverExit();
    });
}

this.handleClick = () => {
    // Increment counter
    this.vars.clickCount.value++;
    
    // Update label
    this.textComponent.Set("text", `Clicked: ${this.vars.clickCount.value}`);
    
    // Visual feedback
    this.material.Set("shaderColor", this.vars.clickColor.value);
    
    // Reset color after delay
    setTimeout(() => {
        this.material.Set("shaderColor", this.vars.normalColor.value);
    }, 200);
    
    // Log to console
    console.log(`Button clicked! Count: ${this.vars.clickCount.value}`);
}

this.handleHoverEnter = () => {
    // Change to hover color
    this.material.Set("shaderColor", this.vars.hoverColor.value);
    
    // Scale up slightly
    this.buttonSurface.getTransform().Set("localScale", {
        x: 0.52, y: 0.22, z: 0.11
    });
}

this.handleHoverExit = () => {
    // Reset to normal color
    this.material.Set("shaderColor", this.vars.normalColor.value);
    
    // Reset scale
    this.buttonSurface.getTransform().Set("localScale", {
        x: 0.5, y: 0.2, z: 0.1
    });
}

this.onDestroy = () => {
    // Clean up event listeners
    this._entity._bs.Off("click");
    this._entity._bs.Off("hover-enter");
    this._entity._bs.Off("hover-exit");
}

// Helper function to get child entities
this.getChildEntity = (name) => {
    const children = this._entity.getChildren();
    return children.find(child => child.name === name);
}
```

## Step 4: Add Sound Effects

### Add Audio Component
1. Select `InteractiveButton`
2. Add Component → **Audio** → **Audio Source**
3. Configure:
   ```javascript
   volume: 0.5
   spatial: true  // 3D sound
   minDistance: 1
   maxDistance: 10
   ```

### Update Script for Sound
Add to your click handler:

```javascript
this.handleClick = () => {
    // Previous click code...
    
    // Play click sound
    this.audioSource = this._entity.getComponent("BanterAudioSource");
    if (this.audioSource) {
        // Play a beep sound (you'd load your own audio file)
        this.audioSource.Play("click.wav");
    }
}
```

## Step 5: Create Action System

### Define Button Actions
Extend your script to trigger different actions:

```javascript
// Add to vars
this.vars.actionType = {
    "type": "string",
    "value": "counter"  // counter, toggle, spawn
}

// Add action handlers
this.executeAction = () => {
    switch(this.vars.actionType.value) {
        case "counter":
            this.incrementCounter();
            break;
        case "toggle":
            this.toggleObject();
            break;
        case "spawn":
            this.spawnObject();
            break;
    }
}

this.incrementCounter = () => {
    // Already implemented above
}

this.toggleObject = () => {
    // Find target object and toggle visibility
    const target = this._scene.getEntity("TargetObject");
    if (target) {
        const isActive = target.Get("active");
        target.Set("active", !isActive);
    }
}

this.spawnObject = () => {
    // Create new object at spawn point
    const spawnPoint = {x: 0, y: 2, z: -3};
    this._scene.createEntity({
        type: "Box",
        position: spawnPoint,
        color: {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
            a: 1
        }
    });
}
```

## Step 6: Advanced Features

### Animation on Click
Add smooth animation:

```javascript
this.animatePress = () => {
    let progress = 0;
    const duration = 300; // ms
    const startScale = {x: 0.5, y: 0.2, z: 0.1};
    const pressScale = {x: 0.48, y: 0.18, z: 0.12};
    
    const animate = () => {
        progress += 16; // ~60fps
        const t = Math.min(progress / duration, 1);
        
        // Ease in-out
        const eased = t < 0.5 
            ? 2 * t * t 
            : -1 + (4 - 2 * t) * t;
        
        // Interpolate scale
        const scale = {
            x: startScale.x + (pressScale.x - startScale.x) * eased,
            y: startScale.y + (pressScale.y - startScale.y) * eased,
            z: startScale.z + (pressScale.z - startScale.z) * eased
        };
        
        this.buttonSurface.getTransform().Set("localScale", scale);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}
```

### Particle Effect on Click
Add visual feedback:

```javascript
this.createClickParticles = () => {
    // Create particle system at button position
    const particles = this._scene.createEntity({
        type: "ParticleSystem",
        parent: this._entity.id,
        position: {x: 0, y: 0, z: -0.1}
    });
    
    // Configure burst
    particles.addComponent("BanterParticles", {
        emission: 20,
        lifetime: 0.5,
        startSpeed: 2,
        startSize: 0.05,
        startColor: this.vars.hoverColor.value
    });
    
    // Remove after effect
    setTimeout(() => {
        this._scene.removeEntity(particles.id);
    }, 1000);
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
    <p>30-second demo video showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Button responding to hover</li>
      <li>Click animation and sound</li>
      <li>Counter incrementing</li>
      <li>Different action types in action</li>
    </ul>
  </div>
</div>

## Challenge Extensions

Try these enhancements to level up your button:

### 1. Button States
- **Disabled state**: Gray out and ignore clicks
- **Loading state**: Show spinner while processing
- **Success/Error states**: Color feedback for results

### 2. Button Variants
- **Icon buttons**: Add images/symbols
- **Toggle buttons**: On/off states
- **Radio buttons**: Multiple choice selection

### 3. Advanced Interactions
- **Long press**: Different action on hold
- **Double click**: Special action
- **Drag and drop**: Moveable buttons

### 4. Visual Polish
- **Gradient colors**: More sophisticated look
- **Shadow/glow effects**: Depth and emphasis
- **Custom animations**: Unique transitions

## Complete Button Prefab

Save your completed button:
1. Select `InteractiveButton` in Hierarchy
2. Drag to Inventory panel
3. Name it "Interactive Button Prefab"
4. Now reusable in any scene!

## Troubleshooting

### Button Not Responding
- Check collider is set to `isTrigger: true`
- Verify MonoBehavior script is attached
- Ensure button is not behind other objects

### Events Not Firing
- Confirm BS library is loaded
- Check event listener syntax
- Look for console errors

### Visual Issues
- Verify material component exists
- Check color values are 0-1 range
- Ensure text is positioned correctly

## What You've Learned

✅ Creating complex UI elements with multiple components
✅ Handling various user input events (click, hover)
✅ Providing visual and audio feedback
✅ Implementing state management in scripts
✅ Creating reusable interactive prefabs

## Next Steps

Ready for more? Try:
- [Rotating Gallery](./rotating-gallery) - Multiple synchronized objects
- [Spawn System](/docs/examples/) - Dynamic object creation
- [Component Reference](/docs/entity-components/) - Explore all components