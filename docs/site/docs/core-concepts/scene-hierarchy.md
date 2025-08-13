---
sidebar_position: 1
title: Scene Hierarchy
---

# Understanding the Scene Hierarchy

The scene hierarchy is the foundation of how objects are organized in your VR space. Think of it as a family tree where every object can have parents and children.

<div style={{
  backgroundColor: '#f0f0f0',
  border: '2px dashed #999',
  borderRadius: '8px',
  padding: '20px',
  marginTop: '2rem',
  marginBottom: '2rem'
}}>
  <div style={{textAlign: 'center', color: '#666'}}>
    <p><strong>📊 Interactive Diagram Placeholder</strong></p>
    <p>Interactive tree visualization showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '500px', margin: '0 auto'}}>
      <li>Scene root at the top</li>
      <li>Parent objects branching down</li>
      <li>Child objects nested under parents</li>
      <li>Transform inheritance arrows</li>
      <li>Click to expand/collapse branches</li>
    </ul>
  </div>
</div>

## What are GameObjects (Entities)?

In the Unity Scene Inspector, every object in your scene is called a **Entity** (the BanterScript term for GameObject). Entities are containers that can hold components, which give them appearance and behavior.

### Key Properties of Entities:
- **Unique ID**: Every entity has a unique identifier
- **Name**: Human-readable name for organization
- **Transform**: Position, rotation, and scale in 3D space
- **Components**: List of attached components (mesh, collider, script, etc.)
- **Children**: Other entities nested beneath this one

## Parent-Child Relationships

When you nest one entity inside another, you create a parent-child relationship. This is powerful because:

### Transform Inheritance
Children inherit their parent's transform:
```javascript
// If parent is at position (10, 0, 0)
// And child is at local position (5, 0, 0)
// Child's world position is (15, 0, 0)
```

### Benefits of Hierarchies:
1. **Group Movement**: Move parent, all children follow
2. **Organization**: Keep related objects together
3. **Prefab Creation**: Save entire hierarchies as reusable prefabs
4. **Performance**: Unity can optimize rendering of grouped objects

## Transform System

Every entity has a Transform component that defines its position in 3D space:

### Transform Properties:
- **Position** (`Vector3`): Location in X, Y, Z coordinates
- **Rotation** (`Vector3`): Euler angles for rotation
- **Scale** (`Vector3`): Size multiplier in each axis

### Local vs World Space
- **Local Space**: Relative to parent
- **World Space**: Absolute position in scene

```javascript
// Local transform - relative to parent
transform.Set("localPosition", {x: 0, y: 1, z: 0});

// World transform - absolute position
transform.Set("position", {x: 10, y: 5, z: -3});
```

## Best Practices for Hierarchy Organization

### 1. Logical Grouping
Group related objects together:
```
Scene
├── Environment
│   ├── Terrain
│   ├── Buildings
│   └── Vegetation
├── Lighting
│   ├── Sun
│   └── PointLights
└── Interactive
    ├── Buttons
    └── Doors
```

### 2. Naming Conventions
Use clear, descriptive names:
- ✅ `Player_Spawn_Point`
- ✅ `Door_Trigger_Zone`
- ❌ `GameObject (1)`
- ❌ `New Cube`

### 3. Depth Management
Keep hierarchy shallow when possible:
- Deep nesting can impact performance
- Maximum recommended depth: 5-7 levels
- Use empty GameObjects as organizers

### 4. Transform Zeroing
Reset transforms when organizing:
```javascript
// Create organizer at origin
Position: {x: 0, y: 0, z: 0}
Rotation: {x: 0, y: 0, z: 0}
Scale: {x: 1, y: 1, z: 1}
```

## Common Hierarchy Patterns

### UI Layout Pattern
```
Canvas
├── Header
│   ├── Title_Text
│   └── Menu_Button
├── Content
│   ├── ScrollView
│   └── Items
└── Footer
    └── Navigation
```

### Interactive Object Pattern
```
InteractiveObject
├── Visual_Mesh
├── Collider_Trigger
├── Audio_Source
└── Particle_Effects
```

### Spawner Pattern
```
Spawner_Manager
├── Spawn_Points
│   ├── Point_1
│   ├── Point_2
│   └── Point_3
└── Spawned_Objects
    └── [Dynamically created]
```

## Working with the Hierarchy Panel

### Keyboard Shortcuts
- `F2` - Rename selected object
- `Delete` - Delete selected object
- `Ctrl+D` - Duplicate selected object
- `Alt+Click` - Expand/collapse all children

### Drag and Drop Operations
- **Reparenting**: Drag object onto new parent
- **Reordering**: Drag between siblings
- **To Inventory**: Drag to save as prefab
- **From Inventory**: Drag prefab into hierarchy

### Search and Filter
The hierarchy panel includes search functionality:
- Search by name
- Filter by component type
- Show only modified objects

## Performance Considerations

### Object Count Impact
- **< 100 objects**: Negligible impact
- **100-500 objects**: Smooth for most devices
- **500-1000 objects**: May need optimization
- **> 1000 objects**: Consider batching or LOD

### Optimization Techniques
1. **Static Batching**: Mark non-moving objects as static
2. **Object Pooling**: Reuse objects instead of creating/destroying
3. **LOD Groups**: Use simpler models at distance
4. **Occlusion Culling**: Don't render hidden objects

## Troubleshooting Common Issues

### Lost Objects
If objects disappear:
1. Check if hidden in hierarchy
2. Verify transform position (might be far away)
3. Check if parent is disabled
4. Use search to find by name

### Transform Problems
If transforms behave unexpectedly:
1. Check parent transform
2. Verify local vs world space
3. Look for conflicting scripts
4. Reset transform to defaults

### Performance Issues
If hierarchy operations are slow:
1. Reduce nesting depth
2. Use fewer root objects
3. Disable complex objects while editing
4. Clear search filters

## Next Steps

Now that you understand the hierarchy, learn about:
- [Components System](./components-system) - Adding functionality to objects
- [Transform Manipulation](./transform-manipulation) - Advanced positioning
- [Prefabs and Inventory](./prefabs-inventory) - Reusable object templates