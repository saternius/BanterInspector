# Agent Execution Guide: RunCommand for Console DevTools

## Overview

Agents operating in the console devtool environment should use **RunCommand(execString)** to modify world state. This provides a consistent, parseable interface for all operations.

```javascript
await RunCommand("action_name arg1 arg2 arg3");
```

All commands:
- ✅ Sync automatically across all clients
- ✅ Support undo/redo when executed
- ✅ Are logged to the lifecycle shell for audit
- ✅ Parse arguments intelligently (strings, numbers, vectors, colors, etc.)
- ✅ Provide consistent error handling

---

## Core Concepts

### Command Structure

Every command follows this pattern:
```
action_name <required_arg1> <required_arg2> [optional_arg3]
```

### Argument Parsing

The system automatically parses arguments using `parseBest()`:

| Type | Example | Parsed Result |
|------|---------|---------------|
| String | `MyEntity` or `"My Entity"` | `"MyEntity"` or `"My Entity"` |
| Number | `42` or `3.14` | `42` or `3.14` |
| Boolean | `true` or `false` | `true` or `false` |
| Vector3 | `[1,2,3]` or `{x:1,y:2,z:3}` | `{x:1, y:2, z:3}` |
| Vector4/Quaternion | `[0,0,0,1]` or `{x:0,y:0,z:0,w:1}` | `{x:0, y:0, z:0, w:1}` |
| Color | `#FF0000` or `{r:1,g:0,b:0}` | `{r:1, g:0, b:0}` |
| JSON Object | `{"key":"value"}` | `{key: "value"}` |

**Note:** Spaces in strings require quotes: `"My Entity Name"`

### Entity and Component IDs

- **Entity IDs** follow a path structure: `Scene`, `Scene/MyEntity`, `Scene/Parent/Child`
- **Component IDs** use type + random number: `Cube_12345`, `Material_67890`, `MonoBehavior_11223`
- Root entities: `Scene` (world root), `People` (player avatars)

---

## Complete Command Reference

### Entity Commands

#### add_entity
Create a new entity as a child of parent.

**Syntax:**
```javascript
await RunCommand("add_entity <parentId> <entityName>");
```

**Examples:**
```javascript
await RunCommand("add_entity Scene MyGameObject");
await RunCommand("add_entity Scene/Parent ChildObject");
await RunCommand('add_entity Scene "My Object With Spaces"');
```

**Returns:** The new entity via the Change system

---

#### remove_entity
Remove an entity and all its children.

**Syntax:**
```javascript
await RunCommand("remove_entity <entityId>");
```

**Examples:**
```javascript
await RunCommand("remove_entity Scene/MyGameObject");
await RunCommand("remove_entity Scene/Parent/Child");
```

**Validation:**
- ❌ Cannot remove `Scene` or `People`
- ❌ Cannot remove entities under `People`

---

#### move_entity
Move an entity to a new parent (reparent).

**Syntax:**
```javascript
await RunCommand("move_entity <entityId> <newParentId>");
```

**Examples:**
```javascript
await RunCommand("move_entity Scene/MyEntity Scene/NewParent");
await RunCommand("move_entity Scene/Parent/Child Scene");
```

**Validation:**
- ❌ Cannot move `People` or entities under `People`

---

#### set_entity_property
Set a property on an entity.

**Syntax:**
```javascript
await RunCommand("set_entity_property <entityId> <property> <value>");
```

**Properties:**
- `name` - Entity name (string)
- `active` - Active state (boolean)
- `persistent` - Persistent across sessions (boolean)
- `layer` - Layer number (integer)
- `localPosition` - Local position (Vector3)
- `localRotation` - Local rotation (Quaternion/Euler)
- `localScale` - Local scale (Vector3)

**Examples:**
```javascript
await RunCommand("set_entity_property Scene/MyEntity name NewName");
await RunCommand("set_entity_property Scene/MyEntity active false");
await RunCommand("set_entity_property Scene/MyEntity persistent true");
await RunCommand("set_entity_property Scene/MyEntity layer 5");
await RunCommand("set_entity_property Scene/MyEntity localPosition [0,5,0]");
await RunCommand("set_entity_property Scene/MyEntity localRotation [0,45,0]");
await RunCommand("set_entity_property Scene/MyEntity localScale [2,2,2]");
```

**Validation:**
- ❌ Cannot rename `Scene` or `People`
- ❌ Entity names must be unique within parent

---

#### clone_entity
Clone an entity and all its children/components.

**Syntax:**
```javascript
await RunCommand("clone_entity <entityId>");
```

**Examples:**
```javascript
await RunCommand("clone_entity Scene/MyPrefab");
```

**Note:** Clone is created as sibling with `_XXXXX` suffix

---

### Component Commands

#### add_component
Add a component to an entity.

**Syntax:**
```javascript
await RunCommand("add_component <entityId> <componentType>");
```

**Common Component Types:**
- **Meshes:** `Cube`, `Sphere`, `Cylinder`, `Plane`, `Capsule`, `Quad`
- **Lights:** `PointLight`, `SpotLight`, `DirectionalLight`
- **Materials:** `StandardMaterial`, `PhysicsMaterial`
- **Physics:** `BoxCollider`, `SphereCollider`, `CapsuleCollider`, `MeshCollider`
- **Physics Bodies:** `Rigidbody`
- **Media:** `AudioSource`, `VideoPlayer`, `GltfModel`
- **Behaviors:** `Grabbable`, `SyncedObject`, `MonoBehavior`
- **Misc:** `Browser`, `Mirror`, `Portal`, `UIPanel`

**Examples:**
```javascript
await RunCommand("add_component Scene/MyEntity Cube");
await RunCommand("add_component Scene/Light PointLight");
await RunCommand("add_component Scene/Player Rigidbody");
```

**Validation:**
- ❌ Cannot add duplicate unique components (Transform, Rigidbody, SyncedObject)

---

#### remove_component
Remove a component from its entity.

**Syntax:**
```javascript
await RunCommand("remove_component <componentId>");
```

**Examples:**
```javascript
await RunCommand("remove_component Cube_12345");
await RunCommand("remove_component Material_67890");
```

**Note:** Use component ID, not type. Get component ID from entity inspection.

---

#### set_component_property
Set a property on a component.

**Syntax:**
```javascript
await RunCommand("set_component_property <componentId> <property> <value>");
```

**Common Properties by Component Type:**

**Cube/Sphere/Capsule/Cylinder:**
- `size` - Dimensions (Vector3)

**StandardMaterial:**
- `color` - Base color (Color)
- `metallic` - Metallic value (0-1)
- `smoothness` - Smoothness value (0-1)
- `emissionColor` - Emission color (Color)

**PointLight/SpotLight:**
- `intensity` - Light intensity (number)
- `range` - Light range (number)
- `color` - Light color (Color)

**AudioSource:**
- `url` - Audio file URL (string)
- `volume` - Volume (0-1)
- `loop` - Loop playback (boolean)

**GltfModel:**
- `url` - Model URL (string)
- `castShadows` - Cast shadows (boolean)

**Examples:**
```javascript
await RunCommand("set_component_property Cube_12345 size [2,2,2]");
await RunCommand("set_component_property Material_67890 color #FF0000");
await RunCommand("set_component_property PointLight_11223 intensity 5");
await RunCommand("set_component_property AudioSource_44556 volume 0.8");
await RunCommand('set_component_property GltfModel_77889 url "https://example.com/model.glb"');
```

---

#### reorder_component
Reorder a component in the entity's component list.

**Syntax:**
```javascript
await RunCommand("reorder_component <entityId> <fromIndex> <toIndex>");
```

**Examples:**
```javascript
await RunCommand("reorder_component Scene/MyEntity 2 0");
```

**Note:** Index 0 is typically Transform (cannot be moved)

---

### Space Property Commands

Space properties persist across sessions and sync to all clients.

#### set_space_property
Set a public or protected space property.

**Syntax:**
```javascript
await RunCommand("set_space_property <property> <value> <protected>");
```

**Parameters:**
- `property` - Property name (string)
- `value` - Property value (any type)
- `protected` - `true` for admin-only, `false` for public (boolean)

**Examples:**
```javascript
await RunCommand("set_space_property gameMode freeplay false");
await RunCommand("set_space_property maxPlayers 16 true");
await RunCommand("set_space_property spawnPoint [0,10,0] false");
await RunCommand("set_space_property welcomeMessage \"Welcome to my world!\" false");
```

---

### Inventory Commands

The inventory stores reusable entities, scripts, and other assets.

#### load_item
Load an item from inventory into the scene.

**Syntax:**
```javascript
await RunCommand("load_item <itemName> <parentId>");
```

**Examples:**
```javascript
await RunCommand("load_item MyPrefab Scene");
await RunCommand("load_item PlayerSpawnPoint Scene/Spawns");
await RunCommand("load_item MyScript Scene/ScriptRunner");
```

**Note:** Loaded entities get unique IDs with random suffix

---

#### save_item
Save an entity as an inventory item.

**Syntax:**
```javascript
await RunCommand("save_item <entityId> <itemName> <folderPath>");
```

**Examples:**
```javascript
await RunCommand("save_item Scene/MyPrefab SavedPrefab");
await RunCommand("save_item Scene/ComplexObject MyObject MyFolder");
```

**Note:** If item exists, user will be prompted to confirm overwrite

---

#### delete_item
Delete an item from inventory.

**Syntax:**
```javascript
await RunCommand("delete_item <itemName>");
```

**Examples:**
```javascript
await RunCommand("delete_item OldPrefab");
await RunCommand("delete_item UnusedScript.js");
```

---

#### create_script
Create a new script item in inventory.

**Syntax:**
```javascript
await RunCommand("create_script <scriptName>");
```

**Examples:**
```javascript
await RunCommand("create_script MyBehavior.js");
await RunCommand("create_script Utils.js");
```

**Note:** Creates with default MonoBehavior template

---

#### edit_script
Edit the content of a script item.

**Syntax:**
```javascript
await RunCommand("edit_script <scriptName> <scriptContent>");
```

**Examples:**
```javascript
await RunCommand('edit_script MyScript.js "console.log(\"Hello World\")"');
```

**Note:** For multi-line scripts, use escaped newlines or template literals in your agent code

---

#### create_folder
Create a folder in inventory.

**Syntax:**
```javascript
await RunCommand("create_folder <folderName> <parentFolderPath>");
```

**Examples:**
```javascript
await RunCommand("create_folder Prefabs");
await RunCommand("create_folder Weapons Prefabs");
```

---

#### remove_folder
Remove a folder and all its contents from inventory.

**Syntax:**
```javascript
await RunCommand("remove_folder <folderPath>");
```

**Examples:**
```javascript
await RunCommand("remove_folder OldFolder");
await RunCommand("remove_folder Prefabs/Deprecated");
```

**Warning:** Deletes all items in folder recursively

---

#### move_item_directory
Move an item to a different folder.

**Syntax:**
```javascript
await RunCommand("move_item_directory <itemName> <targetFolderPath>");
```

**Examples:**
```javascript
await RunCommand("move_item_directory MyPrefab Weapons");
await RunCommand("move_item_directory OldScript Archive");
```

---

### MonoBehavior Commands

#### set_mono_behavior_var
Set a variable on a MonoBehavior component.

**Syntax:**
```javascript
await RunCommand("set_mono_behavior_var <componentId> <varName> <value>");
```

**Examples:**
```javascript
await RunCommand("set_mono_behavior_var MonoBehavior_12345 speed 10");
await RunCommand("set_mono_behavior_var MonoBehavior_67890 enabled true");
await RunCommand("set_mono_behavior_var MonoBehavior_11223 targetPosition [5,0,5]");
```

---

### Utility Commands

#### help
Display all available commands.

**Syntax:**
```javascript
await RunCommand("help");
```

**Output:** Displays formatted command reference in the shell

---

## Querying World State

Before executing commands, agents need to inspect the world state. Use these global functions:

### Scene Manager (SM)

```javascript
// Get entity by ID
const entity = SM.getEntityById("Scene/MyEntity");

// Get component by ID
const component = SM.getEntityComponentById("Cube_12345");

// Get all entities
const allEntities = SM.getAllEntities();

// Get selected entity
const selected = SM.getSelectedEntity();

// Get scene root
const sceneRoot = SM.getSceneEntity();

// Get entity by name (first match)
const entity = SM.getEntityByName("MyEntity");

// Get all MonoBehaviors
const scripts = SM.getAllMonoBehaviors();
```

### Entity Object Properties

```javascript
const entity = SM.getEntityById("Scene/MyEntity");

// Properties
entity.id           // "Scene/MyEntity"
entity.name         // "MyEntity"
entity.parentId     // "Scene"
entity.active       // true/false
entity.persistent   // true/false
entity.layer        // 0-31
entity.components   // Array of components
entity.children     // Array of child entities

// Transform
entity.transform.localPosition   // {x, y, z}
entity.transform.localRotation   // {x, y, z, w}
entity.transform.localScale      // {x, y, z}

// Methods
entity.getComponent("Cube")      // Get first component of type
entity.getComponents("Material") // Get all components of type
```

### Component Object Properties

```javascript
const component = SM.getEntityComponentById("Cube_12345");

// Properties
component.id          // "Cube_12345"
component.type        // "Cube"
component.properties  // Object with all properties
component._entity     // Parent entity reference

// Access specific property
component.properties.size  // {x: 1, y: 1, z: 1}
```

### Shortcuts

```javascript
// Get all root entities
const roots = entities();

// Get selected entity
const sel = sel();

// Debug hierarchy visualization
const tree = crawl();
```

---

## Agent Workflow Patterns

### Pattern 1: Query → Validate → Execute

```javascript
// 1. Query
const entity = SM.getEntityById("Scene/MyEntity");

// 2. Validate
if (!entity) {
    console.error("Entity not found: Scene/MyEntity");
    return;
}

// 3. Execute
await RunCommand("set_entity_property Scene/MyEntity active false");
console.log("✓ Entity deactivated");
```

### Pattern 2: Batch Operations

```javascript
// Get all entities
const entities = SM.getAllEntities();

// Filter by criteria
const cubes = entities.filter(e =>
    e.components.some(c => c.type === "Cube")
);

console.log(`Found ${cubes.length} cubes to process`);

// Execute command for each
let processed = 0;
for (const cube of cubes) {
    await RunCommand(`set_entity_property ${cube.id} active false`);
    processed++;

    if (processed % 10 === 0) {
        console.log(`Progress: ${processed}/${cubes.length}`);
    }
}

console.log(`✓ Deactivated ${processed} cubes`);
```

### Pattern 3: Multi-Step Construction

```javascript
console.log("Building light rig...");

// Step 1: Create entities
await RunCommand("add_entity Scene MainLight");
console.log("  ✓ Created MainLight");

await RunCommand("add_entity Scene FillLight");
console.log("  ✓ Created FillLight");

await RunCommand("add_entity Scene BackLight");
console.log("  ✓ Created BackLight");

// Step 2: Add components
await RunCommand("add_component Scene/MainLight PointLight");
await RunCommand("add_component Scene/FillLight PointLight");
await RunCommand("add_component Scene/BackLight PointLight");
console.log("  ✓ Added light components");

// Step 3: Get component IDs (need to query after creation)
const mainLight = SM.getEntityById("Scene/MainLight");
const mainLightComp = mainLight.getComponent("PointLight");

const fillLight = SM.getEntityById("Scene/FillLight");
const fillLightComp = fillLight.getComponent("PointLight");

const backLight = SM.getEntityById("Scene/BackLight");
const backLightComp = backLight.getComponent("PointLight");

// Step 4: Configure lights
await RunCommand(`set_component_property ${mainLightComp.id} intensity 10`);
await RunCommand(`set_component_property ${mainLightComp.id} color #FFFFFF`);

await RunCommand(`set_component_property ${fillLightComp.id} intensity 5`);
await RunCommand(`set_component_property ${fillLightComp.id} color #8888FF`);

await RunCommand(`set_component_property ${backLightComp.id} intensity 3`);
await RunCommand(`set_component_property ${backLightComp.id} color #FF8888`);
console.log("  ✓ Configured light properties");

// Step 5: Position lights
await RunCommand("set_entity_property Scene/MainLight localPosition [5,10,5]");
await RunCommand("set_entity_property Scene/FillLight localPosition [-5,5,5]");
await RunCommand("set_entity_property Scene/BackLight localPosition [0,3,-5]");
console.log("  ✓ Positioned lights");

console.log("✓ Light rig complete");
```

### Pattern 4: Conditional Modifications

```javascript
// Get all entities
const entities = SM.getAllEntities();

console.log(`Scanning ${entities.length} entities...`);

let modified = 0;
for (const entity of entities) {
    // Check for material component
    const hasMaterial = entity.components.some(c =>
        c.type === "StandardMaterial"
    );

    if (hasMaterial) {
        const material = entity.getComponent("StandardMaterial");

        // Check if material is red
        const color = material.properties.color;
        if (color.r > 0.8 && color.g < 0.2 && color.b < 0.2) {
            // Change to blue
            await RunCommand(`set_component_property ${material.id} color #0000FF`);
            modified++;
            console.log(`  ✓ Changed ${entity.name} from red to blue`);
        }
    }
}

console.log(`✓ Modified ${modified} materials`);
```

### Pattern 5: Hierarchical Operations

```javascript
// Recursive function to process entity tree
async function processEntityTree(entityId, operation) {
    const entity = SM.getEntityById(entityId);
    if (!entity) return;

    // Apply operation to this entity
    await operation(entity);

    // Recursively process children
    for (const child of entity.children) {
        await processEntityTree(child.id, operation);
    }
}

// Example: Hide entire tree
console.log("Hiding entity tree...");
await processEntityTree("Scene/MyParent", async (entity) => {
    await RunCommand(`set_entity_property ${entity.id} active false`);
    console.log(`  ✓ Hid ${entity.name}`);
});
console.log("✓ Tree hidden");
```

### Pattern 6: Safe Deletion with Validation

```javascript
// Get entity to delete
const entityId = "Scene/ToDelete";
const entity = SM.getEntityById(entityId);

if (!entity) {
    console.error(`Entity not found: ${entityId}`);
} else if (entity.id === "Scene" || entity.id === "People") {
    console.error("Cannot delete protected entity");
} else if (entity.parentId === "People") {
    console.error("Cannot delete player entities");
} else {
    console.log(`Deleting ${entity.name} and ${entity.children.length} children...`);
    await RunCommand(`remove_entity ${entityId}`);
    console.log("✓ Deleted");
}
```

---

## Error Handling

### Command Validation

Commands are validated before execution. Invalid commands will:
1. Not execute
2. Display an error notification to user
3. Log error to console

**Common Validation Errors:**
- Entity/component not found
- Protected entity operation (Scene, People)
- Duplicate entity name in parent
- Invalid property name or value
- Duplicate unique component

### Checking for Success

After executing a command, verify the result:

```javascript
// Before
const entityBefore = SM.getEntityById("Scene/MyEntity");
console.log("Active before:", entityBefore?.active);

// Execute
await RunCommand("set_entity_property Scene/MyEntity active false");

// After
const entityAfter = SM.getEntityById("Scene/MyEntity");
console.log("Active after:", entityAfter?.active);

if (entityAfter?.active === false) {
    console.log("✓ Command succeeded");
} else {
    console.error("✗ Command failed or was voided");
}
```

### Handling Missing Entities/Components

Always validate existence before operating:

```javascript
const entityId = "Scene/MyEntity";
const entity = SM.getEntityById(entityId);

if (!entity) {
    console.error(`Cannot operate on ${entityId} - entity does not exist`);
    // Either create it or abort
    console.log("Creating entity instead...");
    await RunCommand(`add_entity Scene MyEntity`);
}
```

---

## Best Practices for Agents

### 1. Always Provide Context

```javascript
// ❌ Bad - no context
await RunCommand("add_entity Scene obj1");

// ✅ Good - explains what and why
console.log("Creating player spawn point at origin...");
await RunCommand("add_entity Scene PlayerSpawn");
console.log("✓ Spawn point created");
```

### 2. Validate Before Operating

```javascript
// ❌ Bad - assumes entity exists
await RunCommand("set_entity_property Scene/Unknown active false");

// ✅ Good - checks first
const entity = SM.getEntityById("Scene/MyEntity");
if (entity) {
    await RunCommand("set_entity_property Scene/MyEntity active false");
    console.log("✓ Entity deactivated");
} else {
    console.error("Entity not found: Scene/MyEntity");
}
```

### 3. Use Descriptive Names

```javascript
// ❌ Bad - cryptic names
await RunCommand("add_entity Scene obj1");
await RunCommand("add_entity Scene obj2");

// ✅ Good - self-documenting
await RunCommand("add_entity Scene PlayerSpawnPoint");
await RunCommand("add_entity Scene EnemySpawnPoint");
```

### 4. Provide Progress Updates

```javascript
// ❌ Bad - silent operation
const entities = SM.getAllEntities();
for (const entity of entities) {
    await RunCommand(`set_entity_property ${entity.id} active false`);
}

// ✅ Good - shows progress
console.log("Deactivating entities...");
const entities = SM.getAllEntities();
let count = 0;
for (const entity of entities) {
    await RunCommand(`set_entity_property ${entity.id} active false`);
    count++;
    if (count % 10 === 0) {
        console.log(`  Progress: ${count}/${entities.length}`);
    }
}
console.log(`✓ Deactivated ${count} entities`);
```

### 5. Use Structured Output

```javascript
// Use clear formatting for agent reasoning
console.log("=".repeat(50));
console.log("TASK: Build light rig");
console.log("=".repeat(50));

console.log("\nStep 1: Creating entities...");
await RunCommand("add_entity Scene MainLight");
await RunCommand("add_entity Scene FillLight");
console.log("✓ Entities created");

console.log("\nStep 2: Adding components...");
await RunCommand("add_component Scene/MainLight PointLight");
await RunCommand("add_component Scene/FillLight PointLight");
console.log("✓ Components added");

console.log("\nStep 3: Configuring properties...");
// ... configuration commands
console.log("✓ Properties configured");

console.log("\n" + "=".repeat(50));
console.log("TASK COMPLETE");
console.log("=".repeat(50));
```

### 6. Handle Component ID Discovery

Components get random IDs when created. Query after creation:

```javascript
// Create entity and add component
await RunCommand("add_entity Scene MyEntity");
await RunCommand("add_component Scene/MyEntity Cube");

// Query to get component ID
const entity = SM.getEntityById("Scene/MyEntity");
const cubeComponent = entity.getComponent("Cube");

// Now use the component ID
await RunCommand(`set_component_property ${cubeComponent.id} size [2,2,2]`);
console.log(`✓ Configured cube ${cubeComponent.id}`);
```

### 7. Use Meaningful Grouping

```javascript
// Group related operations with comments
console.log("Setting up game environment...");

// Lighting
console.log("  Configuring lighting...");
await RunCommand("add_entity Scene MainLight");
await RunCommand("add_component Scene/MainLight DirectionalLight");
// ... more light setup

// Ground
console.log("  Creating ground plane...");
await RunCommand("add_entity Scene Ground");
await RunCommand("add_component Scene/Ground Plane");
// ... more ground setup

// Spawn points
console.log("  Placing spawn points...");
await RunCommand("add_entity Scene SpawnPoint1");
await RunCommand("set_entity_property Scene/SpawnPoint1 localPosition [0,1,0]");
// ... more spawn setup

console.log("✓ Environment setup complete");
```

### 8. Verify Critical Operations

```javascript
// For critical operations, verify success
console.log("Saving current scene state...");

const entityId = SM.getSelectedEntity()?.id;
if (!entityId) {
    console.error("No entity selected to save");
} else {
    await RunCommand(`save_item ${entityId} BackupState Backups`);

    // Verify it was saved
    if (inventory.items["BackupState"]) {
        console.log("✓ State saved successfully");
    } else {
        console.error("✗ Failed to save state");
    }
}
```

---

## Common Tasks & Solutions

### Task: Create a Complete GameObject

```javascript
console.log("Creating complete game object...");

// 1. Create entity
await RunCommand("add_entity Scene MyGameObject");

// 2. Add components
await RunCommand("add_component Scene/MyGameObject Cube");
await RunCommand("add_component Scene/MyGameObject StandardMaterial");
await RunCommand("add_component Scene/MyGameObject BoxCollider");
await RunCommand("add_component Scene/MyGameObject Rigidbody");

// 3. Query for component IDs
const entity = SM.getEntityById("Scene/MyGameObject");
const cube = entity.getComponent("Cube");
const material = entity.getComponent("StandardMaterial");
const collider = entity.getComponent("BoxCollider");

// 4. Configure components
await RunCommand(`set_component_property ${cube.id} size [2,2,2]`);
await RunCommand(`set_component_property ${material.id} color #FF5500`);
await RunCommand(`set_component_property ${collider.id} isTrigger false`);

// 5. Position
await RunCommand("set_entity_property Scene/MyGameObject localPosition [0,5,0]");

console.log("✓ Game object created and configured");
```

### Task: Duplicate an Entity Multiple Times

```javascript
const sourceId = "Scene/Template";
const count = 5;
const spacing = 2;

console.log(`Duplicating ${sourceId} ${count} times...`);

for (let i = 0; i < count; i++) {
    // Clone the entity
    await RunCommand(`clone_entity ${sourceId}`);

    // Get the newly created clone (it has a random suffix)
    const entities = SM.getAllEntities();
    const clones = entities.filter(e =>
        e.name.startsWith("Template_") &&
        e.parentId === "Scene"
    );
    const newClone = clones[clones.length - 1];

    // Position it
    await RunCommand(`set_entity_property ${newClone.id} localPosition [${i * spacing},0,0]`);

    console.log(`  ✓ Created clone ${i + 1}: ${newClone.name}`);
}

console.log("✓ Duplication complete");
```

### Task: Find and Modify All Components of Type

```javascript
const targetType = "PointLight";
console.log(`Finding all ${targetType} components...`);

const allEntities = SM.getAllEntities();
const componentsToModify = [];

// Find all matching components
for (const entity of allEntities) {
    const comps = entity.getComponents(targetType);
    componentsToModify.push(...comps);
}

console.log(`Found ${componentsToModify.length} ${targetType} components`);

// Modify them
for (const comp of componentsToModify) {
    await RunCommand(`set_component_property ${comp.id} intensity 5`);
    await RunCommand(`set_component_property ${comp.id} color #FFFFFF`);
    console.log(`  ✓ Modified ${comp.id} on ${comp._entity.name}`);
}

console.log("✓ All components modified");
```

### Task: Create Entity Hierarchy from Data

```javascript
const hierarchyData = {
    name: "Environment",
    children: [
        { name: "Lighting", children: [
            { name: "MainLight" },
            { name: "FillLight" }
        ]},
        { name: "Geometry", children: [
            { name: "Ground" },
            { name: "Walls" }
        ]}
    ]
};

async function createHierarchy(data, parentId = "Scene") {
    const entityPath = `${parentId}/${data.name}`;

    console.log(`Creating ${entityPath}...`);
    await RunCommand(`add_entity ${parentId} ${data.name}`);

    if (data.children) {
        for (const child of data.children) {
            await createHierarchy(child, entityPath);
        }
    }
}

await createHierarchy(hierarchyData);
console.log("✓ Hierarchy created");
```

### Task: Clean Up Unused Components

```javascript
console.log("Scanning for unused components...");

const entities = SM.getAllEntities();
let removed = 0;

for (const entity of entities) {
    // Check for StandardMaterial components with default values
    const materials = entity.getComponents("StandardMaterial");

    for (const material of materials) {
        const props = material.properties;

        // If material is default white, remove it
        if (props.color?.r === 1 &&
            props.color?.g === 1 &&
            props.color?.b === 1) {

            console.log(`  Removing default material from ${entity.name}`);
            await RunCommand(`remove_component ${material.id}`);
            removed++;
        }
    }
}

console.log(`✓ Removed ${removed} unused components`);
```

---

## Debugging Commands

### Inspect Entity

```javascript
function inspectEntity(entityId) {
    const entity = SM.getEntityById(entityId);
    if (!entity) {
        console.error(`Entity not found: ${entityId}`);
        return;
    }

    console.log("=".repeat(50));
    console.log(`ENTITY: ${entity.name}`);
    console.log("=".repeat(50));
    console.log(`ID: ${entity.id}`);
    console.log(`Parent: ${entity.parentId}`);
    console.log(`Active: ${entity.active}`);
    console.log(`Layer: ${entity.layer}`);
    console.log(`Position: [${entity.transform.localPosition.x}, ${entity.transform.localPosition.y}, ${entity.transform.localPosition.z}]`);
    console.log(`Children: ${entity.children.length}`);
    console.log(`\nComponents (${entity.components.length}):`);

    entity.components.forEach((comp, i) => {
        console.log(`  ${i}. ${comp.type} (${comp.id})`);
        if (Object.keys(comp.properties || {}).length > 0) {
            console.log(`     Properties:`, comp.properties);
        }
    });

    if (entity.children.length > 0) {
        console.log(`\nChildren (${entity.children.length}):`);
        entity.children.forEach((child, i) => {
            console.log(`  ${i}. ${child.name} (${child.id})`);
        });
    }
    console.log("=".repeat(50));
}

// Usage
inspectEntity("Scene/MyEntity");
```

### List All Entities

```javascript
function listAllEntities() {
    const entities = SM.getAllEntities();

    console.log("=".repeat(50));
    console.log(`ALL ENTITIES (${entities.length})`);
    console.log("=".repeat(50));

    entities.forEach((entity, i) => {
        const indent = entity.id.split("/").length - 1;
        const prefix = "  ".repeat(indent);
        console.log(`${prefix}${entity.name} (${entity.id})`);
        console.log(`${prefix}  └─ Components: ${entity.components.map(c => c.type).join(", ")}`);
    });

    console.log("=".repeat(50));
}

// Usage
listAllEntities();
```

### Find Entities by Criteria

```javascript
function findEntities(criteria) {
    const entities = SM.getAllEntities();
    const matches = entities.filter(criteria);

    console.log(`Found ${matches.length} matching entities:`);
    matches.forEach(e => {
        console.log(`  - ${e.name} (${e.id})`);
    });

    return matches;
}

// Usage examples
findEntities(e => !e.active);  // Find inactive entities
findEntities(e => e.components.some(c => c.type === "PointLight"));  // Find entities with lights
findEntities(e => e.children.length > 0);  // Find parent entities
```

---

## Quick Reference Card

```javascript
// ENTITY OPERATIONS
await RunCommand("add_entity <parentId> <name>");
await RunCommand("remove_entity <entityId>");
await RunCommand("move_entity <entityId> <newParentId>");
await RunCommand("set_entity_property <entityId> <prop> <value>");
await RunCommand("clone_entity <entityId>");

// COMPONENT OPERATIONS
await RunCommand("add_component <entityId> <type>");
await RunCommand("remove_component <componentId>");
await RunCommand("set_component_property <componentId> <prop> <value>");

// INVENTORY
await RunCommand("load_item <itemName> <parentId>");
await RunCommand("save_item <entityId> <itemName> <folder>");
await RunCommand("delete_item <itemName>");

// QUERYING
SM.getEntityById(id)              // Get entity
SM.getEntityComponentById(id)     // Get component
SM.getAllEntities()                // All entities
SM.getSelectedEntity()             // Selected entity
entity.getComponent(type)          // Get component by type
entity.getComponents(type)         // Get all components of type

// VALIDATION
if (!entity) { console.error("Not found"); }
if (entity.id === "Scene" || entity.id === "People") { console.error("Protected"); }

// FORMATTING
console.log("=".repeat(50));
console.log("✓ Success");
console.log("✗ Failed");
console.log(`Progress: ${count}/${total}`);
```

---

## Summary

**Core Principle:** Use `RunCommand("action arg1 arg2 ...")` for all state modifications.

**Agent Workflow:**
1. **Query** world state using SM functions
2. **Validate** entities/components exist
3. **Execute** commands with RunCommand
4. **Verify** results by re-querying
5. **Communicate** progress and results clearly

**Key Advantages for Agent Inference:**
- ✅ Predictable string-based command format
- ✅ Automatic argument parsing (no manual JSON)
- ✅ Built-in undo/redo support
- ✅ Automatic client synchronization
- ✅ Clear audit trail in shell
- ✅ Easy to parse agent behavior from logs

**Remember:**
- Always validate before operating
- Provide clear progress updates
- Query for component IDs after creation
- Use descriptive names
- Structure output for readability
- Verify critical operations

This approach gives you maximum control over agent behavior while maintaining simplicity and consistency.
