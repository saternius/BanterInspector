---
sidebar_position: 2
title: Core Concepts
---

# Core Concepts

Understanding these fundamental concepts will help you use the Wraptor Inspector effectively.

## The Scene Hierarchy

The scene hierarchy represents all GameObjects (called "Entities" in BanterScript) in your VR space. Think of it as a family tree where objects can have parent-child relationships.

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
    <p>Interactive diagram showing:</p>
    <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
      <li>Scene scene object</li>
      <li>Parent-child relationships</li>
      <li>Transform inheritance flow</li>
      <li>Component attachment points</li>
    </ul>
  </div>
</div>

### Key Concepts:
- **GameObjects (Entities)**: Basic building blocks of your scene
- **Parent-Child Relationships**: Children inherit transforms from parents
- **Transform Inheritance**: Position, rotation, and scale cascade down
- **Component System**: Add functionality through components

## Components System

Components add functionality to GameObjects. Think of them as LEGO blocks - each adds a specific capability.

### Component Categories:
- **Geometry**: Box, Sphere, Cylinder, etc.
- **Physics**: Rigidbody, Colliders, Joints
- **Rendering**: Materials, Textures
- **Media**: Audio, Video, Images
- **VR-Specific**: Portals, Mirrors, Grab Handles

## The BanterScript Bridge

The bridge connects your web browser to Unity in real-time. All changes flow through this connection.

### How It Works:
1. You make a change in the Inspector
2. Change is sent via BanterScript Bridge
3. Unity receives and applies the change
4. Other users see the update (if multiplayer)

## Change Management

Every action is tracked and reversible through our comprehensive undo/redo system.

### Features:
- **Unlimited Undo/Redo**: Never lose work
- **Change History**: See all modifications
- **Multiplayer Sync**: Changes propagate to all users
- **Conflict Resolution**: Automatic handling of simultaneous edits

## Next Steps

- [Tutorials](/docs/tutorials/) - Hands-on learning
- [Quick Start](/docs/quick-start) - Get started quickly
- [Examples](/docs/examples/) - See complete projects