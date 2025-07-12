# BanterScript Quick Start Guide

This guide provides essential patterns and examples for generating BanterScript code quickly.

## Basic Setup

```javascript
// Initialize scene
const scene = BS.BanterScene.GetInstance();
await scene.SetLoadPromise(Promise.resolve());

// Configure scene settings
await scene.SetSettings(new BS.SceneSettings({
    EnableTeleport: true,
    EnableForceGrab: true,
    MaxOccupancy: 20
}));
```

## Common Code Patterns

### 1. Create a Simple Cube

```javascript
async function createCube(position = new BS.Vector3(0, 1, 0)) {
    const cube = new BS.GameObject("Cube");
    
    // Add transform and position
    const transform = await cube.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Add geometry
    await cube.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.BoxGeometry,
        null, 1, 1, 1, 1, 1, 1
    ));
    
    // Add material
    await cube.AddComponent(new BS.BanterMaterial(
        "Standard",
        null,
        new BS.Vector4(1, 0, 0, 1), // Red color
        BS.MaterialSide.Front,
        true
    ));
    
    return cube;
}
```

### 2. Create an Interactive Object

```javascript
async function createInteractiveObject() {
    const obj = new BS.GameObject("InteractiveObject");
    
    // Basic components
    const transform = await obj.AddComponent(new BS.Transform());
    transform.position = new BS.Vector3(0, 1, -2);
    
    // Visual
    await obj.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.SphereGeometry,
        null, 0.5, 16, 16
    ));
    
    // Physics
    const rb = await obj.AddComponent(new BS.BanterRigidbody());
    rb.mass = 1;
    rb.useGravity = true;
    
    await obj.AddComponent(new BS.SphereCollider(false, 0.5));
    
    // Make grabbable
    await obj.AddComponent(new BS.BanterGrabHandle(
        BS.BanterGrabType.TRIGGER,
        0.1
    ));
    
    // Add interaction events
    obj.addEventListener("grab", (event) => {
        console.log(`Grabbed by ${event.detail.side === BS.HandSide.Left ? "left" : "right"} hand`);
    });
    
    obj.addEventListener("drop", (event) => {
        console.log("Dropped!");
    });
    
    obj.addEventListener("click", (event) => {
        console.log("Clicked at:", event.detail.point);
    });
    
    return obj;
}
```

### 3. Load a 3D Model

```javascript
async function load3DModel(url, position = new BS.Vector3(0, 0, 0)) {
    const model = new BS.GameObject("3DModel");
    
    // Position the model
    const transform = await model.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Load GLTF/GLB file
    const gltf = await model.AddComponent(new BS.BanterGLTF(
        url,
        true,   // generateMipMaps
        true,   // addColliders
        false,  // nonConvexColliders
        false,  // slippery
        false,  // climbable
        false   // legacyRotate
    ));
    
    // Listen for load complete
    model.addEventListener("loaded", () => {
        console.log("Model loaded successfully");
    });
    
    return model;
}
```

### 4. Create Text Display

```javascript
async function createText(message, position = new BS.Vector3(0, 2, 0)) {
    const textObj = new BS.GameObject("Text");
    
    // Position
    const transform = await textObj.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Text component
    const text = await textObj.AddComponent(new BS.BanterText(
        message,
        new BS.Vector4(1, 1, 1, 1),        // White color
        BS.HorizontalAlignment.Center,
        BS.VerticalAlignment.Middle,
        1,                                  // Font size
        true,                               // Rich text
        true,                               // Word wrap
        new BS.Vector2(10, 2)              // Size
    ));
    
    // Make it face the camera
    await textObj.AddComponent(new BS.BanterBillboard(
        0.1,    // smoothing
        false,  // X axis
        true,   // Y axis
        false   // Z axis
    ));
    
    return textObj;
}
```

### 5. Play Audio

```javascript
async function createAudioSource(audioUrl, position = new BS.Vector3(0, 1, 0)) {
    const audioObj = new BS.GameObject("AudioSource");
    
    // Position
    const transform = await audioObj.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Audio component
    const audio = await audioObj.AddComponent(new BS.BanterAudioSource(
        0.8,    // volume
        1.0,    // pitch
        false,  // mute
        true,   // loop
        true,   // playOnAwake
        1.0     // spatialBlend (3D sound)
    ));
    
    // Play from URL
    await audio.PlayOneShotFromUrl(audioUrl);
    
    return audioObj;
}
```

### 6. Create a Portal

```javascript
async function createPortal(spaceId, position = new BS.Vector3(0, 1, -5)) {
    const portal = new BS.GameObject("Portal");
    
    // Position
    const transform = await portal.AddComponent(new BS.Transform());
    transform.position = position;
    
    // Visual representation (optional)
    await portal.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.RingGeometry,
        null, 0.5, 2, 32, 1
    ));
    
    // Portal component
    await portal.AddComponent(new BS.BanterPortal(
        spaceId,
        "Portal to Another Space",
        1  // priority
    ));
    
    return portal;
}
```

### 7. Video Player

```javascript
async function createVideoPlayer(videoUrl, position = new BS.Vector3(0, 2, -3)) {
    const videoObj = new BS.GameObject("VideoPlayer");
    
    // Position and scale
    const transform = await videoObj.AddComponent(new BS.Transform());
    transform.position = position;
    transform.localScale = new BS.Vector3(4, 2.25, 1); // 16:9 aspect ratio
    
    // Create a plane for the video
    await videoObj.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.PlaneGeometry,
        null, 1, 1, 1, 1
    ));
    
    // Video player component
    const video = await videoObj.AddComponent(new BS.BanterVideoPlayer(
        videoUrl,
        0.5,    // volume
        true,   // loop
        true    // playOnAwake
    ));
    
    // Add interaction
    videoObj.addEventListener("click", async () => {
        await video.PlayToggle();
    });
    
    return videoObj;
}
```

### 8. Physics Objects

```javascript
async function createPhysicsBall() {
    const ball = new BS.GameObject("PhysicsBall");
    
    // Transform
    const transform = await ball.AddComponent(new BS.Transform());
    transform.position = new BS.Vector3(0, 5, 0);
    
    // Visual
    await ball.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.SphereGeometry,
        null, 0.25, 16, 16
    ));
    
    await ball.AddComponent(new BS.BanterMaterial(
        "Standard",
        null,
        new BS.Vector4(0, 1, 0, 1) // Green
    ));
    
    // Physics
    const rb = await ball.AddComponent(new BS.BanterRigidbody());
    rb.mass = 0.5;
    rb.drag = 0.1;
    rb.angularDrag = 0.1;
    rb.useGravity = true;
    
    // Bouncy physics material
    const physMat = await ball.AddComponent(new BS.BanterPhysicMaterial());
    physMat.bounciness = 0.8;
    physMat.frictionCombine = BS.PhysicMaterialCombine.Average;
    physMat.bounceCombine = BS.PhysicMaterialCombine.Maximum;
    
    // Collider
    await ball.AddComponent(new BS.SphereCollider(false, 0.25));
    
    return ball;
}
```

### 9. Synced Multiplayer Object

```javascript
async function createSyncedObject() {
    const obj = new BS.GameObject("SyncedObject");
    
    // Basic setup
    const transform = await obj.AddComponent(new BS.Transform());
    transform.position = new BS.Vector3(0, 1, 0);
    
    // Visual
    await obj.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.BoxGeometry,
        null, 0.5, 0.5, 0.5
    ));
    
    // Physics
    await obj.AddComponent(new BS.BanterRigidbody());
    await obj.AddComponent(new BS.BoxCollider());
    
    // Syncing
    const synced = await obj.AddComponent(new BS.BanterSyncedObject(
        true,   // syncPosition
        true,   // syncRotation
        true,   // takeOwnershipOnCollision
        true,   // takeOwnershipOnGrab
        true    // kinematicIfNotOwned
    ));
    
    // Grabbable
    await obj.AddComponent(new BS.BanterGrabHandle());
    
    return obj;
}
```

### 10. Browser Display

```javascript
async function createBrowserDisplay(url, position = new BS.Vector3(0, 2, -3)) {
    const browser = new BS.GameObject("Browser");
    
    // Position and scale
    const transform = await browser.AddComponent(new BS.Transform());
    transform.position = position;
    transform.localScale = new BS.Vector3(4, 3, 1);
    
    // Browser component
    const browserComp = await browser.AddComponent(new BS.BanterBrowser(
        url,
        2,      // mipMaps
        100,    // pixelsPerUnit
        1920,   // pageWidth
        1080    // pageHeight
    ));
    
    // Enable interaction
    await browserComp.ToggleInteraction(true);
    
    return browser;
}
```

## Event Handling

### Scene Events

```javascript
const scene = BS.BanterScene.GetInstance();

// User events
scene.addEventListener("user-joined", (event) => {
    console.log(`${event.detail.name} joined the space`);
    if (event.detail.isLocal) {
        console.log("That's you!");
    }
});

// Input events
scene.addEventListener("button-pressed", (event) => {
    if (event.detail.button === BS.ButtonType.Trigger) {
        console.log("Trigger pressed on", event.detail.side === BS.HandSide.Left ? "left" : "right");
    }
});

// AI events
scene.addEventListener("ai-image", async (event) => {
    // Create object with AI-generated texture
    const obj = await createCube();
    const material = obj.GetComponent(BS.ComponentType.BanterMaterial);
    material.texture = event.detail.message;
});
```

### Object Events

```javascript
// Collision detection
gameObject.addEventListener("collision-enter", (event) => {
    console.log("Hit:", event.detail.collider.name);
    if (event.detail.user) {
        console.log("Player collision:", event.detail.user.name);
    }
});

// Trigger zones
gameObject.addEventListener("trigger-enter", (event) => {
    console.log("Entered trigger zone");
});

gameObject.addEventListener("trigger-exit", (event) => {
    console.log("Left trigger zone");
});
```

## Utility Functions

### Smooth Movement

```javascript
async function smoothMove(object, targetPosition, duration = 1000) {
    const transform = object.GetComponent(BS.ComponentType.Transform);
    const startPos = transform.position;
    const startTime = Date.now();
    
    const update = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        transform.position = BS.Vector3.Lerp(startPos, targetPosition, t);
        
        if (t < 1) {
            requestAnimationFrame(update);
        }
    };
    
    update();
}
```

### Spawn Objects in Circle

```javascript
async function spawnInCircle(count, radius, height = 1) {
    const objects = [];
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const obj = await createCube(new BS.Vector3(x, height, z));
        objects.push(obj);
    }
    
    return objects;
}
```

### Raycast Interaction

```javascript
async function performRaycast(origin, direction) {
    const scene = BS.BanterScene.GetInstance();
    const result = await scene.Raycast(
        origin,
        direction,
        100,    // max distance
        ~0      // all layers
    );
    
    if (result) {
        console.log("Hit object at:", result);
    }
}
```

## Complete Example: Interactive Room

```javascript
async function createInteractiveRoom() {
    const scene = BS.BanterScene.GetInstance();
    await scene.SetLoadPromise(Promise.resolve());
    
    // Room settings
    await scene.SetSettings(new BS.SceneSettings({
        EnableTeleport: true,
        EnableForceGrab: true,
        EnableNametags: true,
        MaxOccupancy: 10
    }));
    
    // Floor
    const floor = new BS.GameObject("Floor");
    const floorTransform = await floor.AddComponent(new BS.Transform());
    floorTransform.position = new BS.Vector3(0, 0, 0);
    floorTransform.localScale = new BS.Vector3(20, 0.1, 20);
    
    await floor.AddComponent(new BS.BanterGeometry(
        BS.GeometryType.BoxGeometry,
        null, 1, 1, 1
    ));
    
    await floor.AddComponent(new BS.BanterMaterial(
        "Standard",
        null,
        new BS.Vector4(0.5, 0.5, 0.5, 1)
    ));
    
    await floor.AddComponent(new BS.BoxCollider());
    
    // Spawn interactive objects
    for (let i = 0; i < 5; i++) {
        const obj = await createInteractiveObject();
        const transform = obj.GetComponent(BS.ComponentType.Transform);
        transform.position = new BS.Vector3(
            (Math.random() - 0.5) * 10,
            2,
            (Math.random() - 0.5) * 10
        );
    }
    
    // Welcome text
    await createText("Welcome to BanterScript!", new BS.Vector3(0, 3, -5));
    
    // User join message
    scene.addEventListener("user-joined", async (event) => {
        const welcomeText = await createText(
            `${event.detail.name} joined!`,
            new BS.Vector3(0, 4, 0)
        );
        
        // Remove after 3 seconds
        setTimeout(() => welcomeText.Destroy(), 3000);
    });
    
    console.log("Interactive room created!");
}

// Run the example
createInteractiveRoom();
```

## Tips for Code Generation

1. **Always await component creation**: Components must be awaited before use
2. **Use proper types**: Vector3 for positions, Quaternion for rotations
3. **Check enums**: Use BS.EnumName.Value format
4. **Handle events**: Add event listeners for interactivity
5. **Clean up**: Call Destroy() on objects when done
6. **Error handling**: Wrap async operations in try-catch
7. **Performance**: Reuse materials and geometries when possible

## Common Mistakes to Avoid

```javascript
// ❌ Wrong - not awaiting
const transform = gameObject.AddComponent(new BS.Transform());

// ✅ Correct
const transform = await gameObject.AddComponent(new BS.Transform());

// ❌ Wrong - incorrect vector creation
transform.position = {x: 1, y: 2, z: 3};

// ✅ Correct
transform.position = new BS.Vector3(1, 2, 3);

// ❌ Wrong - not using proper enum
const audio = new BS.BanterAudioSource();
audio.rolloffMode = "Logarithmic";

// ✅ Correct
audio.rolloffMode = BS.AudioRolloffMode.Logarithmic;
```