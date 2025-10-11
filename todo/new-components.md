# New Banter Components & Missing Properties

**Analysis Date:** 2025-10-11
**BS Components Total:** 56
**Wrapped Components Total:** 39
**Unwrapped Components:** 26

---

## Summary

This document identifies:
1. **New components that need wrapping** (22 total)
2. **Existing components with missing properties** (3 components)
3. **Non-component classes** that don't need wrapping (9 utility/enum classes)

---

## 1. New Components That Need Wrapping

### 1.1 Parametric Surface Meshes (14 components)

All parametric surfaces share the same property structure:
- `stacks: number` - Number of vertical segments
- `slices: number` - Number of horizontal segments

**Components to wrap:**

1. **BanterApple** - Apple-shaped parametric surface
2. **BanterCatenoid** - Catenoid minimal surface
3. **BanterFermet** - Fermat's spiral surface
4. **BanterHelicoid** - Helicoid minimal surface
5. **BanterHorn** - Horn/trumpet shaped surface
6. **BanterKlein** - Klein bottle surface
7. **BanterMobius** - Möbius strip
8. **BanterMobius3d** - 3D Möbius surface
9. **BanterNatica** - Seashell-like surface
10. **BanterPillow** - Pillow-shaped surface
11. **BanterScherk** - Scherk minimal surface
12. **BanterSnail** - Snail shell surface
13. **BanterSpiral** - Spiral surface
14. **BanterSpring** - Spring/helix surface

**Implementation Notes:**
- All inherit from mesh component base
- Can create a shared `BanterParametricSurfaceComponent` base class
- Default values: `stacks: 20, slices: 20`

---

### 1.2 Special Mesh Component

**BanterTorusKnot** - Torus knot geometry

**Properties:**
```javascript
{
  radius: 0.5,           // Major radius
  tube: 0.2,             // Tube radius
  radialSegments: 64,    // Segments around tube
  tubularSegments: 128,  // Segments along knot path
  p: 2,                  // Number of times winds around torus interior
  q: 3                   // Number of times winds around torus exterior
}
```

---

### 1.3 Interactive Components

#### BanterGrababble
Complex grab interaction component with VR controller integration.

**Properties:**
```javascript
{
  grabType: 0,                    // GrabType enum (TRIGGER, GRIP, etc.)
  grabRadius: 0.1,                // Distance for grab detection
  gunTriggerSensitivity: 0.5,    // Trigger press threshold
  gunTriggerFireRate: 0.1,        // Time between trigger fires
  gunTriggerAutoFire: false,      // Auto-fire on hold

  // Input blocking flags
  blockLeftPrimary: false,
  blockLeftSecondary: false,
  blockRightPrimary: false,
  blockRightSecondary: false,
  blockLeftThumbstick: false,
  blockLeftThumbstickClick: false,
  blockRightThumbstick: false,
  blockRightThumbstickClick: false,
  blockLeftTrigger: false,
  blockRightTrigger: false
}
```

**Implementation Notes:**
- More advanced than existing `BanterGrabHandle`
- May supersede or complement grab handle functionality
- Includes VR gun/trigger mechanics

---

#### BanterAvatarPedestal
Displays Ready Player Me avatars.

**Properties:**
```javascript
{
  avatarId: ''  // Ready Player Me avatar ID or URL
}
```

---

#### BanterUIPanel
UI panel with haptics and sound feedback.

**Properties:**
```javascript
{
  resolution: { x: 1024, y: 1024 },  // Panel texture resolution
  screenSpace: false,                 // Screen space vs world space
  enableHaptics: true,                // Enable haptic feedback
  clickHaptic: 0.5,                   // Click haptic strength
  enterHaptic: 0.2,                   // Hover enter haptic strength
  exitHaptic: 0.1,                    // Hover exit haptic strength
  enableSounds: true,                 // Enable audio feedback
  clickSoundUrl: '',                  // Click sound URL
  enterSoundUrl: '',                  // Hover enter sound URL
  exitSoundUrl: ''                    // Hover exit sound URL
}
```

**Methods:**
```javascript
SetBackgroundColor(color)  // Set panel background color
```

---

## 2. Existing Components - Missing Properties

### 2.1 ConfigurableJoint
**Location:** `frontend/js/entity-components/physics/configurable-joint.js`

**Currently wrapped:**
- targetPosition, autoConfigureConnectedAnchor
- xMotion, yMotion, zMotion

**Missing properties:**
```javascript
// Angular motion constraints
angularXMotion: 0,           // ConfigurableJointMotion enum
angularYMotion: 0,
angularZMotion: 0,

// Joint anchors and axes
anchor: { x: 0, y: 0, z: 0 },           // Local anchor point
axis: { x: 1, y: 0, z: 0 },             // Primary axis
secondaryAxis: { x: 0, y: 1, z: 0 },    // Secondary axis
connectedAnchor: { x: 0, y: 0, z: 0 },  // Connected body anchor

// Target values for drives
targetRotation: { x: 0, y: 0, z: 0, w: 1 },  // Quaternion
targetVelocity: { x: 0, y: 0, z: 0 },
targetAngularVelocity: { x: 0, y: 0, z: 0 },

// Collision and breaking
enableCollision: false,      // Enable collision between connected bodies
enablePreprocessing: true,   // Enable preprocessing
breakForce: Infinity,        // Force required to break joint
breakTorque: Infinity,       // Torque required to break joint

// Mass and physics
connectedMassScale: 1,       // Scale applied to connected body mass
massScale: 1,                // Scale applied to this body mass

// Configuration
rotationDriveMode: 0,        // Rotation drive mode
configuredInWorldSpace: false, // Use world space coordinates
swapBodies: false            // Swap which body is primary
```

**Impact:** ConfigurableJoint is severely limited without these properties. Cannot configure angular constraints, drives, breaking forces, or advanced joint behavior.

---

### 2.2 BanterVideoPlayer
**Location:** `frontend/js/entity-components/media/video-player.js`

**Currently wrapped:**
- url, volume, loop, playOnAwake, skipOnDrop, waitForFirstFrame, time

**Missing read-only properties:**
```javascript
isPlaying: boolean,   // Is video currently playing (read-only)
isLooping: boolean,   // Is video looping (read-only)
isPrepared: boolean,  // Is video ready to play (read-only)
isMuted: boolean,     // Is video muted (read-only)
duration: number      // Total video duration in seconds (read-only)
```

**Missing methods:**
```javascript
PlayToggle()  // Toggle play/pause
MuteToggle()  // Toggle mute
Stop()        // Stop playback
```

**Impact:** Cannot read video state or use convenience methods for playback control.

---

### 2.3 BanterMirror
**Location:** `frontend/js/entity-components/misc/mirror.js`

**Currently wrapped:**
- renderTextureSize, cameraClear, backgroundColor

**Missing methods:**
```javascript
SetCullingLayer(layer)   // Set culling mask to single layer
AddCullingLayer(layer)   // Add layer to culling mask
```

**Impact:** Cannot control which layers are reflected in the mirror.

---

## 3. Physics Joints (4 components)

Unity physics joints for constraining rigidbody motion. All share common properties but have specific behaviors.

### 3.1 CharacterJoint
Specialized joint for character ragdolls with swing and twist limits.

**Properties:**
```javascript
{
  // Anchors and axes
  anchor: { x: 0, y: 0, z: 0 },
  axis: { x: 1, y: 0, z: 0 },
  swingAxis: { x: 0, y: 1, z: 0 },
  connectedAnchor: { x: 0, y: 0, z: 0 },
  autoConfigureConnectedAnchor: true,

  // Projection (for joint stability)
  enableProjection: false,
  projectionDistance: 0.1,
  projectionAngle: 180,

  // Breaking
  breakForce: Infinity,
  breakTorque: Infinity,

  // Collision and physics
  enableCollision: false,
  enablePreprocessing: true,
  connectedMassScale: 1,
  massScale: 1
}
```

---

### 3.2 FixedJoint
Constrains two rigidbodies to maintain their relative position and rotation.

**Properties:**
```javascript
{
  // Anchors
  anchor: { x: 0, y: 0, z: 0 },
  connectedAnchor: { x: 0, y: 0, z: 0 },
  autoConfigureConnectedAnchor: true,

  // Breaking
  breakForce: Infinity,
  breakTorque: Infinity,

  // Collision and physics
  enableCollision: false,
  enablePreprocessing: true,
  connectedMassScale: 1,
  massScale: 1
}
```

**Use Cases:** Welding objects together, creating compound objects, attachment points

---

### 3.3 HingeJoint
Rotational joint around a single axis (like a door hinge).

**Properties:**
```javascript
{
  // Anchors and axis
  anchor: { x: 0, y: 0, z: 0 },
  axis: { x: 0, y: 1, z: 0 },        // Rotation axis
  connectedAnchor: { x: 0, y: 0, z: 0 },
  autoConfigureConnectedAnchor: true,

  // Limits, motor, and spring
  useLimits: false,      // Enable angle limits
  useMotor: false,       // Enable motor drive
  useSpring: false,      // Enable spring force

  // Breaking
  breakForce: Infinity,
  breakTorque: Infinity,

  // Collision and physics
  enableCollision: false,
  enablePreprocessing: true,
  connectedMassScale: 1,
  massScale: 1
}
```

**Use Cases:** Doors, wheels, rotating platforms, pendulums

---

### 3.4 SpringJoint
Maintains a spring-like connection between two rigidbodies.

**Properties:**
```javascript
{
  // Anchors
  anchor: { x: 0, y: 0, z: 0 },
  connectedAnchor: { x: 0, y: 0, z: 0 },
  autoConfigureConnectedAnchor: true,

  // Spring behavior
  spring: 0,            // Spring force constant
  damper: 0,            // Damping force constant
  minDistance: 0,       // Minimum distance before spring activates
  maxDistance: 0,       // Maximum distance (0 = no max)
  tolerance: 0.025,     // Distance tolerance

  // Breaking
  breakForce: Infinity,
  breakTorque: Infinity,

  // Collision and physics
  enableCollision: false,
  enablePreprocessing: true,
  connectedMassScale: 1,
  massScale: 1
}
```

**Use Cases:** Bungee cords, suspension systems, elastic connections, vehicle suspension

---

## 4. Non-Component Classes (Don't Need Wrapping)

These are utility classes, enums, or singletons that don't represent Unity components:

1. **BanterGrabType** - Enum for grab types (TRIGGER=0, GRIP=1, PRIMARY=2, SECONDARY=3, THUMBSTICKCLICK=4)
2. **BanterLayers** - Enum for Unity layers (UserLayer1-12, NetworkPlayer, Grabbable, etc.)
3. **ConfigurableJointMotion** - Enum for joint motion constraints (Locked=0, Limited=1, Free=2)
4. **BanterScene** - Scene singleton class (use global `scene` object instead)
5. **BanterMonoBehaviour** - Already wrapped as `MonoBehaviorComponent`
6. **BanterUI** - UI factory with methods (CreateButton, CreateLabel, CreateElement, etc.)
7. **BanterAudioClip** - Asset loader class with callbacks (onAssetLoaded, onAssetFailed)
8. **BanterMesh** - Asset loader class with callbacks
9. **BanterTexture** - Asset loader class with callbacks

---

## 5. Implementation Priority

### High Priority (Core Functionality Gaps)
1. **ConfigurableJoint** - Add missing properties (severely limited currently)
2. **Physics Joints** (CharacterJoint, FixedJoint, HingeJoint, SpringJoint) - Essential for physics interactions
3. **BanterVideoPlayer** - Add read-only state properties and control methods

### Medium Priority (New Interactive Features)
4. **BanterGrababble** - Advanced grab mechanics
5. **BanterUIPanel** - Enhanced UI with haptics/sounds
6. **BanterAvatarPedestal** - Avatar display
7. **BanterTorusKnot** - Additional mesh primitive

### Low Priority (Artistic/Decorative)
8. **Parametric Surfaces** (14 components) - Artistic geometry
   - Create shared base class for efficiency
   - Can be wrapped as a batch

### Nice to Have
9. **BanterMirror** - Add culling layer methods (edge case functionality)

---

## 6. Implementation Notes

### Parametric Surface Base Class Pattern
```javascript
// base: parametric-surface.js
export class BanterParametricSurfaceComponent extends BanterMeshComponent {
    defaultProperties() {
        return {
            stacks: 20,
            slices: 20
        };
    }

    extractProperties(sceneComponent) {
        return {
            stacks: parseBest(sceneComponent.stacks) || 20,
            slices: parseBest(sceneComponent.slices) || 20
        };
    }

    _set(property, value) {
        if (!this._bs) return;
        value = parseBest(value);
        this.properties[property] = value;

        if (this._bs[property] !== undefined) {
            this._bs[property] = value;
        }
    }
}

// example: apple.js
export class BanterAppleComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterApple;
        this.type = 'BanterApple';
    }
}
```

### Read-Only Properties Pattern
For BanterVideoPlayer read-only properties, only include in `extractProperties()` for display, not in `_set()`:

```javascript
extractProperties(sceneComponent) {
    const properties = { /* writable props */ };

    // Read-only properties
    if (sceneComponent.isPlaying !== undefined) {
        properties.isPlaying = parseBest(sceneComponent.isPlaying);
    }
    // ... other read-only props

    return properties;
}
```

### Method Exposure Pattern
For component methods (PlayToggle, Stop, SetCullingLayer), expose them on the wrapper:

```javascript
export class BanterVideoPlayerComponent extends EntityComponent {
    // ... existing code ...

    PlayToggle() {
        if (this._bs && typeof this._bs.PlayToggle === 'function') {
            this._bs.PlayToggle();
        }
    }

    Stop() {
        if (this._bs && typeof this._bs.Stop === 'function') {
            this._bs.Stop();
        }
    }
}
```

---

## 6. Component Registry Updates

After wrapping new components, update:

1. **`frontend/js/entity-components/index.js`**
   - Add new component imports and exports
   - Register in ComponentRegistry with metadata

2. **Category Assignments:**
   - Parametric surfaces → `meshes` category
   - BanterTorusKnot → `meshes` category
   - Physics joints → `physics` category
   - BanterGrababble → `behaviors` category
   - BanterAvatarPedestal → `misc` category
   - BanterUIPanel → `misc` category

3. **Icons & Descriptions:**
   - Parametric surfaces: 🎨 or 🌀
   - BanterTorusKnot: 🍩
   - CharacterJoint: 🦴 "Character ragdoll joint"
   - FixedJoint: 🔗 "Fixed connection between rigidbodies"
   - HingeJoint: 🚪 "Rotational joint around axis"
   - SpringJoint: 🪃 "Elastic spring connection"
   - BanterGrababble: 🤲
   - BanterAvatarPedestal: 🧍
   - BanterUIPanel: 📱

### Joint Component Base Class Pattern
All joints share common properties. Create a base class to reduce duplication:

```javascript
// base: joint-component.js
export class JointComponent extends EntityComponent {
    defaultJointProperties() {
        return {
            anchor: { x: 0, y: 0, z: 0 },
            connectedAnchor: { x: 0, y: 0, z: 0 },
            autoConfigureConnectedAnchor: true,
            breakForce: Infinity,
            breakTorque: Infinity,
            enableCollision: false,
            enablePreprocessing: true,
            connectedMassScale: 1,
            massScale: 1
        };
    }

    extractJointProperties(sceneComponent) {
        const properties = {};

        // Vector3 properties
        ['anchor', 'connectedAnchor'].forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = {
                    x: sceneComponent[prop].x || 0,
                    y: sceneComponent[prop].y || 0,
                    z: sceneComponent[prop].z || 0
                };
            }
        });

        // Boolean and numeric properties
        ['autoConfigureConnectedAnchor', 'breakForce', 'breakTorque',
         'enableCollision', 'enablePreprocessing', 'connectedMassScale', 'massScale'].forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        return properties;
    }

    _setJointProperty(property, value) {
        const vector3Props = ['anchor', 'connectedAnchor', 'axis', 'swingAxis', 'secondaryAxis'];

        if (vector3Props.includes(property) && typeof value === 'object') {
            this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
        } else if (this._bs[property] !== undefined) {
            this._bs[property] = value;
        }
    }
}

// example: fixed-joint.js
export class FixedJointComponent extends JointComponent {
    constructor() {
        super();
        this._bsRef = BS.FixedJoint;
        this.type = 'FixedJoint';
    }

    defaultProperties() {
        return this.defaultJointProperties();
    }

    extractProperties(sceneComponent) {
        return this.extractJointProperties(sceneComponent);
    }

    _set(property, value) {
        if (!this._bs) return;
        value = parseBest(value);
        this.properties[property] = value;
        this._setJointProperty(property, value);
    }
}
```

---

## 7. Testing Checklist

After implementing new wrappers:

- [ ] Component appears in Add Component menu
- [ ] Component can be added to entities
- [ ] Properties display in Properties Panel
- [ ] Properties can be edited and update Unity in real-time
- [ ] Component serializes/deserializes correctly
- [ ] Undo/redo works for all property changes
- [ ] Component can be removed
- [ ] Multi-user sync works (properties broadcast via OneShot)

### Joint Testing Checklist

Joints require special testing with rigidbodies:

- [ ] Joint can be added to entity with rigidbody
- [ ] Connected body can be assigned
- [ ] Anchor points update in real-time
- [ ] Breaking forces work correctly
- [ ] Joint constraints behave as expected
- [ ] Multi-user sync works for all joint properties
- [ ] Joint survives scene save/load

---

## 8. Questions for Clarification

1. **BanterGrababble vs BanterGrabHandle:** Should Grabbable replace GrabHandle, or do they serve different purposes?
    - Replace GrabHandle with Grabbable
2. **BanterUI factory methods:** Should we expose these in the inspector somehow, or are they script-only?
    - They are currently script only - ignore them for now
3. **Asset loaders (BanterAudioClip, BanterMesh, BanterTexture):** Are these used by scripts, or should they be inspector-accessible?
    - We will deal with these later.
4. **Parametric surfaces:** Are all 14 surfaces actually used, or should we prioritize a subset?
    - We should include them all

---

## 9. Related Documentation

- Runtime exploration guide: `todo/devtool-crawling-guide.md`
- Component system: `frontend/js/entity-components/`
- BS Component API: Check `BS` global object in browser console
- ComponentRegistry: `ComponentRegistry.list()` in browser console
