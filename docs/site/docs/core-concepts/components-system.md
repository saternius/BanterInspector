---
sidebar_position: 2
title: Components System
---

# The Components System

Components are the building blocks that give GameObjects their appearance, behavior, and functionality. Think of them as modular pieces you can mix and match to create anything.

<div style={{
  backgroundColor: '#f0f4ff',
  border: '2px solid #667eea',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '2rem'
}}>
  <h3>🧩 Component Philosophy</h3>
  <p>Instead of having monolithic objects with fixed properties, Unity uses a component-based architecture where you add only the functionality you need.</p>
</div>

## Understanding Components

### What is a Component?
A component is a self-contained module that adds specific functionality to a GameObject (Entity). Every component serves a single purpose and can work independently or interact with other components.

### Component Anatomy
Every component has:
- **Type**: The kind of component (Box, Material, Rigidbody, etc.)
- **Properties**: Configurable values that control behavior
- **ID**: Unique identifier for reference
- **Owner**: The entity this component is attached to

## Component Categories

### 🎨 Geometry Components
Define the visual shape of objects:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Box** | Rectangular cuboid | Buildings, platforms, walls |
| **Sphere** | Perfect sphere | Balls, planets, bubbles |
| **Cylinder** | Cylindrical shape | Pillars, tubes, barrels |
| **Plane** | Flat surface | Floors, walls, screens |
| **Cone** | Conical shape | Trees, markers, hats |
| **Torus** | Donut shape | Rings, portals, wheels |

### ⚡ Physics Components
Add realistic physics behavior:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Rigidbody** | Enables physics | Falling objects, projectiles |
| **Box Collider** | Rectangular collision | Walls, triggers, platforms |
| **Sphere Collider** | Spherical collision | Balls, detection zones |
| **Mesh Collider** | Complex collision | Terrain, detailed objects |
| **Joints** | Connect objects | Doors, chains, ragdolls |

### 🎭 Rendering Components
Control visual appearance:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Material** | Surface properties | Colors, textures, shaders |
| **Light** | Illumination | Scene lighting, effects |
| **Billboard** | Always-facing sprite | UI elements, markers |
| **Portal Mesh** | See-through portals | Windows, teleports |

### 🎵 Media Components
Audio and visual media:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Audio Source** | Play sounds | Music, effects, ambience |
| **Video Player** | Display videos | Screens, tutorials |
| **GLTF Model** | 3D models | Complex geometry |

### 🚀 VR-Specific Components
Special VR interactions:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **Grab Handle** | Make grabbable | Interactive objects |
| **Portal** | Teleportation | Space transitions |
| **Mirror** | Reflective surface | Mirrors, water |
| **Browser** | Web content | Information displays |

## Working with Components

### Adding Components
```javascript
// Via UI
1. Select GameObject in Hierarchy
2. Click "Add Component" in Properties Panel
3. Choose category and component type

// Via Script
const newComponent = entity.addComponent("BanterBox");
```

### Configuring Properties
Each component has specific properties you can adjust:

```javascript
// Box Component Properties
{
  width: 1,      // Size in X axis
  height: 1,     // Size in Y axis  
  depth: 1,      // Size in Z axis
  color: {r: 1, g: 1, b: 1, a: 1}
}

// Rigidbody Properties
{
  mass: 1,              // Weight in kg
  drag: 0,              // Air resistance
  angularDrag: 0.05,    // Rotation resistance
  useGravity: true,     // Affected by gravity
  isKinematic: false    // Physics-driven
}
```

### Component Dependencies
Some components require others to function:

- **Rigidbody** needs a **Collider** for collision
- **Audio Source** needs **Audio Clip** to play
- **Mesh Renderer** needs **Mesh** and **Material**

<div style={{
  backgroundColor: '#fff5f5',
  border: '1px solid #feb2b2',
  borderRadius: '4px',
  padding: '15px',
  marginTop: '1rem'
}}>
  <strong>⚠️ Important:</strong> The inspector will automatically add required dependencies when possible, but understanding relationships helps avoid issues.
</div>

## Component Interactions

### Communication Between Components
Components on the same GameObject can reference each other:

```javascript
// In a MonoBehavior script
this.onStart = () => {
    // Get other components on same entity
    this.material = this._entity.getComponent("BanterMaterial");
    this.rigidbody = this._entity.getComponent("BanterRigidbody");
    
    // Modify their properties
    this.material.Set("shaderColor", {r: 1, g: 0, b: 0, a: 1});
    this.rigidbody.Set("mass", 10);
}
```

### Event System
Components can emit and listen to events:

```javascript
// Collision events from Collider
this._entity._bs.On("trigger-enter", (other) => {
    console.log("Triggered by:", other);
});

// Click events from Grab Handle
this._entity._bs.On("grab", () => {
    console.log("Object grabbed!");
});
```

## Component Patterns

### 1. Composite Pattern
Combine multiple components for complex behavior:

```
InteractiveButton
├── Box (Visual)
├── Box Collider (Click detection)
├── Material (Appearance)
├── Audio Source (Click sound)
└── MonoBehavior (Logic)
```

### 2. Decorator Pattern
Add components to enhance functionality:

```javascript
// Start with basic box
entity.addComponent("BanterBox");

// Enhance with physics
entity.addComponent("BanterRigidbody");
entity.addComponent("BanterBoxCollider");

// Add interactivity
entity.addComponent("BanterGrabHandle");

// Add behavior
entity.addComponent("BanterMonoBehavior");
```

### 3. Strategy Pattern
Swap components for different behaviors:

```javascript
// Daytime lighting
entity.removeComponent(nightLight);
entity.addComponent(dayLight);

// Different collision shapes
entity.removeComponent(boxCollider);
entity.addComponent(sphereCollider);
```

## Performance Optimization

### Component Count Guidelines
- **Rendering**: Limit materials per object (1-3)
- **Physics**: Minimize colliders (use simple shapes)
- **Scripts**: Avoid multiple MonoBehaviors per object
- **Audio**: Limit simultaneous audio sources (< 20)

### Best Practices
1. **Remove Unused Components**: Don't leave inactive components attached
2. **Simplify Colliders**: Use box/sphere over mesh when possible
3. **Batch Similar Objects**: Share materials between objects
4. **LOD Components**: Use simpler components at distance

## Common Component Recipes

### Interactive Object
```javascript
// Components needed:
- Mesh (Box/Sphere/Model)
- Material
- Collider (matching mesh shape)
- Grab Handle
- Audio Source (optional)
- MonoBehavior (for logic)
```

### UI Button
```javascript
// Components needed:
- Box (flat for button surface)
- Material (button appearance)
- Box Collider (click detection)
- Text (button label)
- MonoBehavior (click handler)
```

### Physics Prop
```javascript
// Components needed:
- Mesh (any shape)
- Material
- Rigidbody (physics simulation)
- Collider (matching shape)
- Audio Source (collision sounds)
```

### Portal Door
```javascript
// Components needed:
- Portal Mesh
- Portal component
- Box Collider (trigger)
- Audio Source (teleport sound)
- Particle System (effect)
```

## Troubleshooting Components

### Component Not Working
1. Check if all dependencies are present
2. Verify property values are valid
3. Ensure GameObject is active
4. Check for conflicting components

### Performance Issues
1. Too many components on single object
2. Complex mesh colliders
3. Multiple materials
4. Heavy scripts in Update

### Visual Problems
1. Missing Material component
2. Incorrect shader settings
3. Transform scale issues
4. Lighting not configured

## Advanced Component Concepts

### Component Pooling
Reuse components instead of creating/destroying:

```javascript
class ComponentPool {
    constructor(componentType, size) {
        this.pool = [];
        this.componentType = componentType;
        // Pre-create components
        for(let i = 0; i < size; i++) {
            this.pool.push(this.createComponent());
        }
    }
    
    get() {
        return this.pool.pop() || this.createComponent();
    }
    
    release(component) {
        component.reset();
        this.pool.push(component);
    }
}
```

### Custom Component Properties
Extend components with metadata:

```javascript
// Store custom data with components
component.metadata = {
    createdBy: "user123",
    createdAt: Date.now(),
    tags: ["interactive", "puzzle"],
    customProperties: {
        difficulty: 5,
        points: 100
    }
};
```

## Next Steps

Continue learning with:
- [BanterScript Bridge](./banterscript-bridge) - How components connect to Unity
- [Change Management](./change-management) - Tracking component modifications
- [Component Reference](/docs/components/) - Detailed component documentation