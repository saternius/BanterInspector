---
sidebar_position: 2
title: Material Component
---

# Material Component

The Material component controls the visual appearance of objects, defining color, texture, transparency, and surface properties like metallic and smoothness.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🎨 Key Features</h3>
  <ul>
    <li>Color and transparency control</li>
    <li>Texture mapping</li>
    <li>Metallic and smoothness properties</li>
    <li>Emission for glowing effects</li>
    <li>Multiple shader options</li>
  </ul>
</div>

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shaderColor` | Color | `{r:1, g:1, b:1, a:1}` | Base color and alpha |
| `texture` | string | null | Texture URL or asset ID |
| `metallic` | number | 0 | Metallic reflection (0-1) |
| `smoothness` | number | 0.5 | Surface smoothness (0-1) |
| `emission` | Color | `{r:0, g:0, b:0, a:1}` | Glow color |
| `tiling` | Vector2 | `{x:1, y:1}` | Texture repeat |
| `offset` | Vector2 | `{x:0, y:0}` | Texture offset |

## Basic Usage

### Adding a Material

```javascript
// Via Inspector UI
1. Select GameObject with mesh component
2. Add Component → Rendering → Material
3. Adjust properties in panel

// Via Script
const material = entity.addComponent("BanterMaterial", {
    shaderColor: {r: 0.5, g: 0.8, b: 0.3, a: 1},
    metallic: 0.3,
    smoothness: 0.7
});
```

## Color and Transparency

### Setting Colors
```javascript
// Solid color
material.Set("shaderColor", {r: 1, g: 0, b: 0, a: 1}); // Red

// With transparency
material.Set("shaderColor", {r: 1, g: 1, b: 1, a: 0.5}); // 50% transparent

// Random color
material.Set("shaderColor", {
    r: Math.random(),
    g: Math.random(),
    b: Math.random(),
    a: 1
});
```

### Color Animation
```javascript
this.animateColor = () => {
    const time = Date.now() * 0.001;
    const hue = (time * 0.1) % 1;
    const color = this.hslToRgb(hue, 1, 0.5);
    
    this.material.Set("shaderColor", {
        r: color.r,
        g: color.g,
        b: color.b,
        a: 1
    });
}

this.hslToRgb = (h, s, l) => {
    // HSL to RGB conversion
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    if (h < 1/6) { r = c; g = x; b = 0; }
    else if (h < 2/6) { r = x; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x; }
    else if (h < 4/6) { r = 0; g = x; b = c; }
    else if (h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return {
        r: r + m,
        g: g + m,
        b: b + m
    };
}
```

## Surface Properties

### Metallic and Smoothness
```javascript
// Shiny metal
{
    shaderColor: {r: 0.7, g: 0.7, b: 0.8, a: 1},
    metallic: 1,
    smoothness: 0.9
}

// Rough plastic
{
    shaderColor: {r: 0.8, g: 0.2, b: 0.2, a: 1},
    metallic: 0,
    smoothness: 0.3
}

// Brushed metal
{
    shaderColor: {r: 0.6, g: 0.6, b: 0.6, a: 1},
    metallic: 0.8,
    smoothness: 0.4
}
```

## Emission and Glow

### Creating Glowing Objects
```javascript
// Neon glow
material.Set("emission", {r: 0, g: 1, b: 1, a: 1}); // Cyan glow

// Pulsing glow
this.pulseGlow = () => {
    const intensity = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
    material.Set("emission", {
        r: intensity,
        g: intensity * 0.5,
        b: 0,
        a: 1
    });
}
```

## Textures

### Applying Textures
```javascript
// URL texture
material.Set("texture", "https://example.com/texture.jpg");

// Local asset
material.Set("texture", "assets/wood.png");

// With tiling
material.Set("texture", "assets/tile.png");
material.Set("tiling", {x: 4, y: 4}); // Repeat 4x4
```

### Texture Animation
```javascript
// Scrolling texture
this.scrollTexture = () => {
    const offset = material.Get("offset");
    material.Set("offset", {
        x: (offset.x + 0.01) % 1,
        y: offset.y
    });
}

// Rotating texture (requires shader support)
this.rotateTexture = () => {
    const time = Date.now() * 0.001;
    const rotation = time % (Math.PI * 2);
    // Apply rotation via shader property if available
}
```

## Material Presets

### Common Materials
```javascript
const materials = {
    gold: {
        shaderColor: {r: 1, g: 0.843, b: 0, a: 1},
        metallic: 1,
        smoothness: 0.8
    },
    glass: {
        shaderColor: {r: 0.9, g: 0.9, b: 1, a: 0.2},
        metallic: 0,
        smoothness: 1
    },
    rubber: {
        shaderColor: {r: 0.1, g: 0.1, b: 0.1, a: 1},
        metallic: 0,
        smoothness: 0.2
    },
    wood: {
        shaderColor: {r: 0.6, g: 0.4, b: 0.2, a: 1},
        metallic: 0,
        smoothness: 0.3,
        texture: "wood_texture.jpg"
    },
    neon: {
        shaderColor: {r: 1, g: 0, b: 1, a: 1},
        emission: {r: 1, g: 0, b: 1, a: 1},
        metallic: 0,
        smoothness: 0.8
    }
};
```

## Performance Optimization

### Material Batching
```javascript
// Share materials between objects for batching
const sharedMaterial = createMaterial({
    shaderColor: {r: 0.5, g: 0.5, b: 0.5, a: 1}
});

// Apply to multiple objects
objects.forEach(obj => {
    obj.addComponent("BanterMaterial", sharedMaterial);
});
```

### LOD Materials
```javascript
this.setMaterialLOD = (distance) => {
    if (distance > 50) {
        // Far - simple color
        material.Set("texture", null);
        material.Set("metallic", 0);
    } else if (distance > 20) {
        // Medium - basic texture
        material.Set("texture", "low_res_texture.jpg");
    } else {
        // Close - full quality
        material.Set("texture", "high_res_texture.jpg");
        material.Set("metallic", 0.5);
    }
}
```

## Advanced Techniques

### Material Transitions
```javascript
class MaterialTransition {
    constructor(material) {
        this.material = material;
        this.transitioning = false;
    }
    
    transitionTo(targetProps, duration = 1000) {
        const startProps = {
            color: this.material.Get("shaderColor"),
            metallic: this.material.Get("metallic"),
            smoothness: this.material.Get("smoothness")
        };
        
        const startTime = Date.now();
        this.transitioning = true;
        
        const update = () => {
            if (!this.transitioning) return;
            
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            
            // Easing
            const eased = this.easeInOutCubic(t);
            
            // Interpolate properties
            this.material.Set("shaderColor", this.lerpColor(
                startProps.color, 
                targetProps.shaderColor, 
                eased
            ));
            
            this.material.Set("metallic", 
                startProps.metallic + (targetProps.metallic - startProps.metallic) * eased
            );
            
            if (t < 1) {
                requestAnimationFrame(update);
            } else {
                this.transitioning = false;
            }
        };
        
        update();
    }
    
    lerpColor(a, b, t) {
        return {
            r: a.r + (b.r - a.r) * t,
            g: a.g + (b.g - a.g) * t,
            b: a.b + (b.b - a.b) * t,
            a: a.a + (b.a - a.a) * t
        };
    }
    
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}
```

## Troubleshooting

### Material Not Showing
- Ensure mesh component exists
- Check if texture URL is valid
- Verify alpha value is not 0
- Confirm GameObject is active

### Transparency Issues
- Set rendering queue appropriately
- Check alpha channel in texture
- Ensure shader supports transparency

### Performance Problems
- Reduce texture resolution
- Share materials between objects
- Limit emission on mobile devices
- Use simpler shaders at distance

## Related Components

- [Box](./box) - Common mesh to apply materials to
- [Sphere](./sphere) - Another mesh type
- [Light](./light) - Works with emission
- [Texture](./texture) - Texture management