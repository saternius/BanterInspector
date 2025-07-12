# BanterScript API Reference

## Overview

BanterScript is a JavaScript API that runs in a browser context embedded within Unity, providing Unity-like functionality for creating interactive VR spaces through JavaScript. This documentation serves as a comprehensive reference for generating BanterScript code.

## Architecture

### Unity-JavaScript Bridge
- **Communication**: Message-based system using delimiters
- **Batching**: Updates are batched and sent every 11ms for performance
- **Async Operations**: All Unity operations return Promises
- **Request/Response**: Each API call has a unique request ID for tracking

### Core Concepts
1. **GameObjects**: Basic building blocks of the scene
2. **Components**: Attachable behaviors and properties
3. **Events**: Event-driven architecture for interactivity
4. **Scene Management**: Central hub for managing the virtual space

## Getting Started

```javascript
// Get the scene instance
const scene = BS.BanterScene.GetInstance();

// Wait for scene to load
await scene.SetLoadPromise(yourLoadPromise);

// Create a GameObject
const gameObject = new BS.GameObject("MyObject");

// Add components
const transform = await gameObject.AddComponent(new BS.Transform());
```

## Core Classes

### BS.BanterScene

The main scene management class. Access via singleton pattern.

```javascript
const scene = BS.BanterScene.GetInstance();
```

#### Methods

##### Scene Configuration
```javascript
// Configure scene settings
await scene.SetSettings(new BS.SceneSettings({
    EnableDevTools: true,
    EnableTeleport: true,
    EnableForceGrab: false,
    EnableSpiderMan: false,
    EnableHandHold: true,
    EnableRadar: true,
    EnableNametags: true,
    EnablePortals: true,
    EnableGuests: true,
    EnableQuaternionPose: false,
    EnableControllerExtras: false,
    EnableFriendPositionJoin: true,
    EnableDefaultTextures: true,
    EnableAvatars: true,
    MaxOccupancy: 20,
    RefreshRate: 72,
    ClippingPlane: new BS.Vector2(0.02, 1500),
    SpawnPoint: new BS.Vector4(),
    PhysicsMoveSpeed: 4,
    PhysicsMoveAcceleration: 4.6,
    PhysicsAirControlSpeed: 3.8,
    PhysicsAirControlAcceleration: 6,
    PhysicsDrag: 0,
    PhysicsFreeFallAngularDrag: 6,
    PhysicsJumpStrength: 1,
    PhysicsHandPositionStrength: 1,
    PhysicsHandRotationStrength: 1,
    PhysicsHandSpringiness: 10,
    PhysicsGrappleRange: 512,
    PhysicsGrappleReelSpeed: 1,
    PhysicsGrappleSpringiness: 10,
    PhysicsGorillaMode: false,
    SettingsLocked: false,
    PhysicsSettingsLocked: false
}));
```

##### Navigation & Physics
```javascript
// Open a web page
await scene.OpenPage("https://example.com");

// Deep link with message
await scene.DeepLink("banter://space/123", "Join me!");

// Set gravity
await scene.Gravity(new BS.Vector3(0, -9.81, 0));

// Set time scale
await scene.TimeScale(0.5); // Half speed

// Teleport player
await scene.TeleportTo(
    new BS.Vector3(10, 0, 10), // position
    90,                        // rotation in degrees
    true,                      // stop velocity
    false                      // is spawn point
);

// Apply force to player
await scene.AddPlayerForce(
    new BS.Vector3(0, 10, 0),
    BS.ForceMode.Impulse
);

// Set player speed
await scene.PlayerSpeed(true); // Fast mode
```

##### Object Management
```javascript
// Find objects
const found = await scene.Find("ObjectName");
const foundByPath = await scene.FindByPath("Parent/Child/Object");

// Instantiate a copy
const copy = await scene.Instantiate(gameObject);

// Raycast
const hit = await scene.Raycast(
    origin,      // Vector3
    direction,   // Vector3
    distance,    // number
    layerMask    // number
);
```

##### AI & Media
```javascript
// Generate AI image
await scene.AiImage("A beautiful sunset", BS.AiImageRatio.Square);

// Generate AI 3D model
await scene.AiModel(base64Data, BS.AiModelSimplify.Medium, 1024);

// Text-to-speech
await scene.StartTTS(true); // with voice detection
await scene.StopTTS(id);

// File selection
await scene.SelectFile(BS.SelectFileType.Image);

// Convert to CDN
await scene.Base64ToCDN(base64Data, "filename.png");
```

##### Space State
```javascript
// Set public properties (visible to all)
scene.SetPublicSpaceProps({
    "gameScore": "100",
    "currentLevel": "5"
});

// Set protected properties (admin only)
scene.SetProtectedSpaceProps({
    "adminPassword": "secret123"
});

// Set user properties
scene.SetUserProps({
    "status": "playing"
}, userId);
```

#### Events

```javascript
// Scene loaded
scene.addEventListener("loaded", (event) => {
    console.log("Scene loaded");
});

// Unity loaded
scene.addEventListener("unity-loaded", (event) => {
    console.log("Unity ready");
});

// User events
scene.addEventListener("user-joined", (event) => {
    console.log("User joined:", event.detail.name);
    console.log("User ID:", event.detail.id);
    console.log("Is local:", event.detail.isLocal);
});

scene.addEventListener("user-left", (event) => {
    console.log("User left:", event.detail.name);
});

// Input events
scene.addEventListener("button-pressed", (event) => {
    console.log("Button:", event.detail.button); // ButtonType enum
    console.log("Hand:", event.detail.side);     // HandSide enum
});

scene.addEventListener("button-released", (event) => {
    // Same as button-pressed
});

scene.addEventListener("key-press", (event) => {
    console.log("Key:", event.detail.key); // KeyCode enum
});

// AI events
scene.addEventListener("ai-image", (event) => {
    console.log("AI image URL:", event.detail.message);
});

scene.addEventListener("ai-model", (event) => {
    console.log("AI model data:", event.detail.message);
});

// Other events
scene.addEventListener("transcription", (event) => {
    console.log("Speech:", event.detail.message);
    console.log("ID:", event.detail.id);
});

scene.addEventListener("select-file-recv", (event) => {
    console.log("File data:", event.detail.data);
});

scene.addEventListener("space-state-changed", (event) => {
    event.detail.changes.forEach(change => {
        console.log(`Property ${change.property} changed from ${change.oldValue} to ${change.newValue}`);
    });
});
```

### BS.GameObject

Represents an object in the scene.

```javascript
// Create new GameObject
const gameObject = new BS.GameObject("MyObject");

// Create and wait for Unity link
const gameObject = await BS.CreateGameObject("MyObject");
```

#### Properties
- `name: string` - Object name
- `id: string` - Unique identifier
- `active: boolean` - Active state
- `layer: number` - Rendering layer
- `parent: string | number` - Parent object ID
- `path: string` - Full hierarchy path

#### Methods

```javascript
// Lifecycle
await gameObject.SetActive(true);
await gameObject.SetLayer(5);
await gameObject.SetParent(parentObject, true); // worldPositionStays
await gameObject.Destroy();

// Components
const component = await gameObject.AddComponent(new BS.Transform());
const existing = gameObject.GetComponent(BS.ComponentType.Transform);

// Hierarchy
gameObject.Traverse((child) => {
    console.log("Child:", child.name);
});
```

#### Events

```javascript
// Interaction events
gameObject.addEventListener("click", (event) => {
    console.log("Clicked at:", event.detail.point);
    console.log("Normal:", event.detail.normal);
});

gameObject.addEventListener("grab", (event) => {
    console.log("Grabbed at:", event.detail.point);
    console.log("Hand:", event.detail.side); // HandSide.Left or Right
});

gameObject.addEventListener("drop", (event) => {
    console.log("Dropped by:", event.detail.side);
});

// Collision events
gameObject.addEventListener("collision-enter", (event) => {
    console.log("Collided with:", event.detail.collider);
    console.log("Point:", event.detail.point);
    console.log("Normal:", event.detail.normal);
    console.log("User:", event.detail.user); // If player collision
});

gameObject.addEventListener("collision-exit", (event) => {
    console.log("Collision ended with:", event.detail.collider);
});

// Trigger events
gameObject.addEventListener("trigger-enter", (event) => {
    console.log("Entered trigger:", event.detail.collider);
});

gameObject.addEventListener("trigger-exit", (event) => {
    console.log("Exited trigger:", event.detail.collider);
});
```

## Components

### Transform

Controls position, rotation, and scale.

```javascript
const transform = new BS.Transform();

// Properties
transform.position = new BS.Vector3(1, 2, 3);
transform.localPosition = new BS.Vector3(1, 2, 3);
transform.rotation = new BS.Quaternion(0, 0, 0, 1);
transform.localRotation = new BS.Quaternion(0, 0, 0, 1);
transform.localScale = new BS.Vector3(1, 1, 1);
transform.eulerAngles = new BS.Vector3(0, 90, 0);
transform.localEulerAngles = new BS.Vector3(0, 90, 0);

// Direction vectors (read-only)
const forward = transform.forward;
const up = transform.up;
const right = transform.right;

// Interpolation
transform.lerpPosition = true; // Smooth position
transform.lerpRotation = true; // Smooth rotation
```

### BanterRigidbody

Physics body for dynamics.

```javascript
const rigidbody = new BS.BanterRigidbody();

// Properties
rigidbody.mass = 1.0;
rigidbody.drag = 0.5;
rigidbody.angularDrag = 0.05;
rigidbody.useGravity = true;
rigidbody.isKinematic = false;
rigidbody.velocity = new BS.Vector3(0, 0, 0);
rigidbody.angularVelocity = new BS.Vector3(0, 0, 0);
rigidbody.centerOfMass = new BS.Vector3(0, 0, 0);
rigidbody.collisionDetectionMode = BS.CollisionDetectionMode.Discrete;

// Constraints
rigidbody.freezePositionX = false;
rigidbody.freezePositionY = false;
rigidbody.freezePositionZ = false;
rigidbody.freezeRotationX = false;
rigidbody.freezeRotationY = false;
rigidbody.freezeRotationZ = false;

// Methods
await rigidbody.AddForce(new BS.Vector3(0, 10, 0), BS.ForceMode.Impulse);
await rigidbody.AddExplosionForce(100, explosionPos, 10, 3, BS.ForceMode.Impulse);
await rigidbody.MovePosition(new BS.Vector3(5, 0, 5));
await rigidbody.MoveRotation(new BS.Quaternion(0, 0, 0, 1));
await rigidbody.Sleep();
```

### Colliders

#### BoxCollider
```javascript
const collider = new BS.BoxCollider(
    false,                      // isTrigger
    new BS.Vector3(0, 0, 0),   // center
    new BS.Vector3(1, 1, 1)    // size
);
```

#### SphereCollider
```javascript
const collider = new BS.SphereCollider(
    false,  // isTrigger
    0.5     // radius
);
```

#### CapsuleCollider
```javascript
const collider = new BS.CapsuleCollider(
    false,                      // isTrigger
    new BS.Vector3(0, 0, 0),   // center
    0.5,                       // radius
    2,                         // height
    0                          // direction (0=X, 1=Y, 2=Z)
);
```

#### MeshCollider
```javascript
const collider = new BS.MeshCollider(
    true,   // convex
    false   // isTrigger
);
```

### BanterGeometry

Create procedural shapes.

```javascript
// Box
const geometry = new BS.BanterGeometry(
    BS.GeometryType.BoxGeometry,
    null,           // parametricType
    1, 1, 1,       // width, height, depth
    1, 1, 1        // widthSegments, heightSegments, depthSegments
);

// Sphere
const geometry = new BS.BanterGeometry(
    BS.GeometryType.SphereGeometry,
    null,           // parametricType
    0.5,           // radius
    16, 16         // widthSegments, heightSegments
);

// Cylinder
const geometry = new BS.BanterGeometry(
    BS.GeometryType.CylinderGeometry,
    null,           // parametricType
    0.5, 0.5,      // radiusTop, radiusBottom
    2,             // height
    16,            // radialSegments
    1,             // heightSegments
    false,         // openEnded
    0, 360         // thetaStart, thetaLength
);

// Plane
const geometry = new BS.BanterGeometry(
    BS.GeometryType.PlaneGeometry,
    null,           // parametricType
    1, 1,          // width, height
    1, 1           // widthSegments, heightSegments
);
```

### BanterMaterial

Control appearance.

```javascript
const material = new BS.BanterMaterial(
    "Unlit/Diffuse",                    // shaderName
    "https://example.com/texture.png",  // texture URL
    new BS.Vector4(1, 0, 0, 1),        // color (RGBA)
    BS.MaterialSide.Front,              // side
    true                                // generateMipMaps
);

// Shader options:
// - "Unlit/Diffuse" (no lighting)
// - "Standard" (PBR lighting)
// - "Standard (Specular setup)"
// - "Banter/Diffuse" (optimized)
```

### BanterText

Display text in 3D space.

```javascript
const text = new BS.BanterText(
    "Hello World",                      // text
    new BS.Vector4(1, 1, 1, 1),        // color (RGBA)
    BS.HorizontalAlignment.Center,      // horizontal alignment
    BS.VerticalAlignment.Middle,        // vertical alignment
    2,                                  // font size
    true,                               // rich text enabled
    true,                               // word wrapping
    new BS.Vector2(20, 5)              // size delta
);

// Update text
text.text = "New text";
text.color = new BS.Vector4(1, 0, 0, 1); // Red
```

### BanterAudioSource

Play sounds and music.

```javascript
const audio = new BS.BanterAudioSource(
    0.8,    // volume (0-1)
    1.0,    // pitch
    false,  // mute
    true,   // loop
    false,  // playOnAwake
    1.0     // spatialBlend (0=2D, 1=3D)
);

// Properties
audio.minDistance = 1;
audio.maxDistance = 500;
audio.rolloffMode = BS.AudioRolloffMode.Logarithmic;

// Methods
await audio.PlayOneShotFromUrl("https://example.com/sound.mp3");
await audio.Play();
await audio.Stop();
await audio.Pause();
await audio.UnPause();
```

### BanterVideoPlayer

Play videos on surfaces.

```javascript
const video = new BS.BanterVideoPlayer(
    "https://example.com/video.mp4",   // url
    1.0,                                // volume
    true,                               // loop
    true                                // playOnAwake
);

// Properties
video.time = 30;         // Seek to 30 seconds
video.playbackSpeed = 2; // 2x speed
video.skipOnDrop = true; // Skip frames if needed

// Methods
await video.PlayToggle();
await video.MuteToggle();
await video.Stop();

// Read-only properties
console.log(video.duration);
console.log(video.isPlaying);
console.log(video.isPrepared);
```

### BanterBrowser

Embed web content.

```javascript
const browser = new BS.BanterBrowser(
    "https://example.com",  // url
    2,                      // mipMaps
    100,                    // pixelsPerUnit
    1920,                   // pageWidth
    1080                    // pageHeight
);

// Methods
await browser.ToggleInteraction(true);
await browser.ToggleKeyboard(true);
await browser.RunActions("click(100,200);type('Hello')");

// Browser message events
gameObject.addEventListener("browser-message", (event) => {
    console.log("Message from browser:", event.detail);
});
```

### BanterGLTF

Load 3D models.

```javascript
const gltf = new BS.BanterGLTF(
    "https://example.com/model.glb",   // url
    true,                               // generateMipMaps
    true,                               // addColliders
    false,                              // nonConvexColliders
    false,                              // slippery
    false,                              // climbable
    false                               // legacyRotate
);

// Events
gameObject.addEventListener("loaded", () => {
    console.log("Model loaded");
});
```

### BanterAssetBundle

Load Unity asset bundles.

```javascript
const bundle = new BS.BanterAssetBundle(
    "https://example.com/windows.bundle",  // windowsUrl
    null,                                   // windowsHash
    null,                                   // windowsSize
    "https://example.com/android.bundle",  // androidUrl
    null,                                   // androidHash
    null,                                   // androidSize
    true,                                   // autoLoad
    false                                   // legacyShaderFixes
);

// Platform-specific URLs
bundle.osxUrl = "https://example.com/osx.bundle";
bundle.linuxUrl = "https://example.com/linux.bundle";
bundle.iosUrl = "https://example.com/ios.bundle";
bundle.vosUrl = "https://example.com/vos.bundle";
```

### Interactive Components

#### BanterGrabHandle
Make objects grabbable.

```javascript
const grabHandle = new BS.BanterGrabHandle(
    BS.BanterGrabType.TRIGGER,  // grabType
    0.1                          // grabRadius
);

// Grab types:
// - TRIGGER: Trigger button
// - GRIP: Grip button
// - PRIMARY: Primary button
// - SECONDARY: Secondary button
```

#### BanterHeldEvents
Configure input while holding.

```javascript
const heldEvents = new BS.BanterHeldEvents(
    1.0,    // sensitivity
    10,     // fireRate
    false   // auto fire
);

// Block specific inputs
heldEvents.blockPrimary = true;
heldEvents.blockSecondary = false;
heldEvents.blockTrigger = false;
heldEvents.blockGrip = false;
```

#### BanterAttachedObject
Attach objects to users.

```javascript
const attached = new BS.BanterAttachedObject(
    "user-id-123",                          // uid
    new BS.Vector3(0, 0.1, 0),             // position offset
    new BS.Quaternion(0, 0, 0, 1),         // rotation offset
    BS.AttachmentType.Physics,              // attachment type
    BS.AvatarAttachmentType.Bone,           // avatar attachment type
    BS.AvatarBoneName.Head,                 // bone name
    BS.PhysicsAttachmentPoint.Head          // physics point
);

// Methods
await attached.Attach("user-id-456");
await attached.Detach("user-id-456");
```

#### BanterSyncedObject
Network synchronization.

```javascript
const synced = new BS.BanterSyncedObject(
    true,   // syncPosition
    true,   // syncRotation
    true,   // takeOwnershipOnCollision
    true,   // takeOwnershipOnGrab
    true    // kinematicIfNotOwned
);

// Methods
await synced.TakeOwnership();
const isOwner = await synced.DoIOwn();
```

### Special Effects

#### BanterBillboard
Face camera behavior.

```javascript
const billboard = new BS.BanterBillboard(
    0.1,    // smoothing
    false,  // enableXAxis
    true,   // enableYAxis
    false   // enableZAxis
);
```

#### BanterMirror
Reflective surfaces.

```javascript
const mirror = new BS.BanterMirror(
    2048,                           // textureSize
    new BS.Vector4(0, 0, 1, 1),    // color tint
    0                              // reflectLayers
);
```

#### BanterPortal
Portals to other spaces.

```javascript
const portal = new BS.BanterPortal(
    "space-id-123",     // spaceId
    "Space Name",       // name
    1                   // priority
);
```

## Utility Classes

### Vector Types

```javascript
// Vector2
const vec2 = new BS.Vector2(x, y);
vec2.magnitude;       // Length
vec2.normalized;      // Unit vector
vec2.x = 10;         // Set component

// Vector3
const vec3 = new BS.Vector3(x, y, z);
vec3.magnitude;
vec3.normalized;
vec3.x = 10;

// Static methods
const distance = BS.Vector3.Distance(vec1, vec2);
const dot = BS.Vector3.Dot(vec1, vec2);
const cross = BS.Vector3.Cross(vec1, vec2);
const lerped = BS.Vector3.Lerp(vec1, vec2, 0.5);

// Vector4
const vec4 = new BS.Vector4(x, y, z, w);
```

### Quaternion

```javascript
const quat = new BS.Quaternion(x, y, z, w);

// Static methods
const identity = BS.Quaternion.identity;
const angle = BS.Quaternion.Angle(quat1, quat2);
const dot = BS.Quaternion.Dot(quat1, quat2);
const slerped = BS.Quaternion.Slerp(quat1, quat2, 0.5);
const fromEuler = BS.Quaternion.Euler(0, 90, 0);
const lookRot = BS.Quaternion.LookRotation(forward, up);
```

## Enumerations

### ButtonType
```javascript
BS.ButtonType = {
    None: 0,
    Trigger: 1,
    Grip: 2,
    Menu: 3,
    Primary: 4,
    Secondary: 5,
    Tertiary: 6,
    Quaternary: 7
};
```

### HandSide
```javascript
BS.HandSide = {
    Left: 0,
    Right: 1
};
```

### KeyCode
Unity KeyCode enumeration for keyboard input.

### ForceMode
```javascript
BS.ForceMode = {
    Force: 0,           // Continuous force
    Impulse: 1,         // Instant force
    VelocityChange: 2,  // Instant velocity change
    Acceleration: 3     // Continuous acceleration
};
```

### GeometryType
```javascript
BS.GeometryType = {
    BoxGeometry: 0,
    CircleGeometry: 1,
    ConeGeometry: 2,
    CylinderGeometry: 3,
    DodecahedronGeometry: 4,
    IcosahedronGeometry: 5,
    OctahedronGeometry: 6,
    PlaneGeometry: 7,
    RingGeometry: 8,
    SphereGeometry: 9,
    TetrahedronGeometry: 10,
    TorusGeometry: 11,
    TorusKnotGeometry: 12,
    TriangleGeometry: 13,
    ParametricGeometry: 14
};
```

### MaterialSide
```javascript
BS.MaterialSide = {
    Front: 0,
    Back: 1,
    Double: 2
};
```

### CollisionDetectionMode
```javascript
BS.CollisionDetectionMode = {
    Discrete: 0,
    Continuous: 1,
    ContinuousDynamic: 2,
    ContinuousSpeculative: 3
};
```

## User Management

```javascript
// Access users
const localUser = scene.localUser;
const allUsers = scene.users; // Dictionary by user ID

// User properties
console.log(user.name);
console.log(user.id);
console.log(user.uid);
console.log(user.color);
console.log(user.isLocal);

// User events
user.addEventListener("state-changed", (event) => {
    event.detail.changes.forEach(change => {
        console.log(`${change.key}: ${change.oldValue} -> ${change.newValue}`);
    });
});

// Collision with user
user.addEventListener("collision-enter", (event) => {
    console.log("User collided with:", event.detail.collider);
});
```

## Best Practices

### 1. Always Wait for Components
```javascript
// Always await component creation
const component = await gameObject.AddComponent(new BS.Transform());
```

### 2. Use SetLoadPromise
```javascript
// Ensure scene is ready
async function init() {
    const scene = BS.BanterScene.GetInstance();
    await scene.SetLoadPromise(Promise.resolve());
    // Now safe to create objects
}
```

### 3. Clean Up Resources
```javascript
// Remove event listeners
gameObject.removeEventListener("click", handler);

// Destroy objects
await gameObject.Destroy();
```

### 4. Handle Async Operations
```javascript
try {
    const result = await scene.Raycast(origin, direction);
    if (result) {
        console.log("Hit:", result);
    }
} catch (error) {
    console.error("Raycast failed:", error);
}
```

### 5. Batch Updates
```javascript
// The system automatically batches updates every 11ms
// But you can optimize by updating multiple properties at once
transform.position = new BS.Vector3(1, 2, 3);
transform.rotation = BS.Quaternion.Euler(0, 90, 0);
transform.localScale = new BS.Vector3(2, 2, 2);
```

## Loading Assets

```javascript
// Helper function for scene bundles
await BS.LoadSceneBundles(
    "android.bundle",  // Android bundle
    "windows.bundle"   // Windows bundle
);
```

## Legacy Support

BanterScript maintains compatibility with legacy AFRAME-based spaces:

```javascript
// Enable legacy mode
scene.EnableLegacy();

// Legacy attachment
await scene.LegacyAttachObject(object, "all", BS.LegacyAttachmentPosition.Head);

// Legacy player control
await scene.LegacyLockPlayer();
await scene.LegacyUnlockPlayer();
```

## Performance Considerations

1. **Batching**: Updates are automatically batched every 11ms
2. **Object Pooling**: Reuse objects instead of creating/destroying
3. **LOD**: Use lower polygon models for distant objects
4. **Texture Optimization**: Use appropriate texture sizes and compression
5. **Component Queries**: Query multiple components in one call

```javascript
// Efficient component querying
const query = new BS.ComponentQuery();
query.Add(transform, [BS.PropertyName.position, BS.PropertyName.rotation]);
query.Add(rigidbody, [BS.PropertyName.velocity]);
await scene.QueryComponents(query);
```

## Debugging

```javascript
// Enable dev tools in settings
const settings = new BS.SceneSettings();
settings.EnableDevTools = true;
await scene.SetSettings(settings);

// Log Unity version
scene.addEventListener("banter-version", (event) => {
    console.log("Banter Version:", window.VERSION_NAME);
    console.log("Unity Version:", window.UNITY_VERSION);
});
```

## Common Patterns

### Creating Interactive Objects
```javascript
async function createInteractiveBox() {
    const box = new BS.GameObject("InteractiveBox");
    
    // Add visual representation
    await box.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.BoxGeometry,
        null, 1, 1, 1, 1, 1, 1
    ));
    
    // Add material
    await box.AddComponent(new BS.BanterMaterial(
        "Standard",
        null,
        new BS.Vector4(1, 0, 0, 1)
    ));
    
    // Add physics
    await box.AddComponent(new BS.BanterRigidbody());
    await box.AddComponent(new BS.BoxCollider());
    
    // Make grabbable
    await box.AddComponent(new BS.BanterGrabHandle(
        BS.BanterGrabType.TRIGGER,
        0.1
    ));
    
    // Add interaction
    box.addEventListener("grab", (event) => {
        console.log("Grabbed by", event.detail.side);
    });
    
    return box;
}
```

### Loading and Positioning Models
```javascript
async function loadModel(url, position) {
    const model = new BS.GameObject("Model");
    
    // Add transform
    const transform = await model.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Load GLTF
    await model.AddComponent(new BS.BanterGLTF(
        url,
        true,  // generateMipMaps
        true,  // addColliders
        false  // nonConvexColliders
    ));
    
    return model;
}
```

### Creating UI Elements
```javascript
async function createFloatingText(message, position) {
    const textObj = new BS.GameObject("FloatingText");
    
    // Position
    const transform = await textObj.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Text
    await textObj.AddComponent(new BS.BanterText(
        message,
        new BS.Vector4(1, 1, 1, 1),
        BS.HorizontalAlignment.Center,
        BS.VerticalAlignment.Middle,
        0.5
    ));
    
    // Billboard behavior
    await textObj.AddComponent(new BS.BanterBillboard(
        0.1, false, true, false
    ));
    
    return textObj;
}
```

## Conclusion

BanterScript provides a comprehensive JavaScript API for creating interactive VR experiences. By leveraging familiar Unity concepts and patterns, developers can create rich, multiplayer virtual spaces with physics, interactivity, and multimedia content.

For the latest updates and additional examples, refer to the official Banter documentation and community resources.