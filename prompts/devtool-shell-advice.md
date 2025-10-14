# Shell Command Guide for World Modification

## Quick Start

Modify world state using the command shell:

```javascript
await RunCommand("action_name arg1 arg2 arg3");
```

All commands automatically:
- Sync across all clients
- Support undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- Log to the lifecycle shell
- Parse arguments intelligently

---

## Command Syntax

### Argument Types

| Type | Example | Result |
|------|---------|--------|
| String | `MyEntity` or `"My Entity"` | String value |
| Number | `42` or `3.14` | Numeric value |
| Boolean | `true` or `false` | Boolean value |
| Vector3 | `[1,2,3]` or `{x:1,y:2,z:3}` | Position/scale |
| Quaternion | `[0,0,0,1]` | Rotation |
| Color | `#FF0000` or `{r:1,g:0,b:0}` | Color value |

**Note:** Use quotes for strings with spaces: `"My Entity Name"`

### Entity IDs
- Path-based: `Scene`, `Scene/MyEntity`, `Scene/Parent/Child`
- Root entities: `Scene` (world root), `People` (players)

### Component IDs
- Format: `TypeName_RandomNumber`
- Examples: `Box_12345`, `Material_67890`, `MonoBehavior_11223`

---

## Essential Commands

### Entities

```javascript
// Create entity
await RunCommand("add_entity Scene MyEntity");

// Delete entity
await RunCommand("remove_entity Scene/MyEntity");

// Move entity to new parent
await RunCommand("move_entity Scene/Child Scene/NewParent");

// Set entity properties
await RunCommand("set_entity_property Scene/MyEntity active false");
await RunCommand("set_entity_property Scene/MyEntity localPosition [0,5,0]");
await RunCommand("set_entity_property Scene/MyEntity localRotation [0,45,0]");

// Clone entity
await RunCommand("clone_entity Scene/Template");
```

### Components

```javascript
// Add component (use correct names from list below!)
await RunCommand("add_component Scene/MyEntity Box");
await RunCommand("add_component Scene/Light PointLight");

// Remove component
await RunCommand("remove_component Box_12345");

// Set component properties
await RunCommand("set_component_property Box_12345 size [2,2,2]");
await RunCommand("set_component_property Material_67890 color #FF0000");
```

**⚠️ CRITICAL: Component Type Names**

Most components are prefixed with `Banter`. Here are the **correct** names:

**Meshes (ALL have Banter prefix):**
- `Box`, `Sphere`, `Cylinder`, `Plane`
- `Cone`, `Circle`, `Ring`, `Torus`
- `Text`, `TorusKnot`, `InvertedMesh`

**Materials:**
- `Material` (NOT StandardMaterial!)
- `PhysicMaterial`

**Physics Colliders (NO Banter prefix!):**
- `BoxCollider`, `SphereCollider`, `CapsuleCollider`, `MeshCollider`

**Physics:**
- `Rigidbody`

**Joints:**
- `ConfigurableJoint`, `CharacterJoint`, `FixedJoint`, `HingeJoint`, `SpringJoint`

**Media:**
- `AudioSource`, `VideoPlayer`, `GLTF`

**Behaviors:**
- `Grabbable`, `GrabHandle`, `SyncedObject`
- `HeldEvents`, `AttachedObject`, `ColliderEvents`

**Misc:**
- `Billboard`, `Mirror`, `Browser`, `Portal`
- `UIPanel`, `AvatarPedestal`, `MonoBehavior`

### Discovering Available Components

Use the ComponentRegistry to find all available component types:

```javascript
// List all components with descriptions
ComponentRegistry.list();

// Get components by category
ComponentRegistry.getByCategory("meshes");
ComponentRegistry.getByCategory("physics");
ComponentRegistry.getByCategory("behaviors");

// Get all categories
ComponentRegistry.getCategories();

// Search for a specific component
ComponentRegistry.getInfo("Box");

// Check if a component is supported
ComponentRegistry.isSupported("Box");
```

### Validating Commands Before Execution

Use the ChangeTypes validation helpers to catch errors before running commands:

```javascript
// Validate component names before adding
const validation = ChangeTypes.validateComponent("Box");
if (validation.valid) {
    await RunCommand("add_component Scene/MyEntity Box");
} else {
    console.error(validation.message);
    console.log("Suggestions:", validation.suggestions);
}

// Get fuzzy-matched suggestions for typos
const suggestions = ChangeTypes.suggestComponent("cube");
console.log(suggestions);
// ["Box", "Cube", ...] - sorted by relevance

// Validate full command syntax
const cmdValidation = ChangeTypes.validateCommand("add_component Scene/Box Box");
if (!cmdValidation.valid) {
    console.error(cmdValidation.message);
    if (cmdValidation.suggestions.length > 0) {
        console.log("Did you mean:", cmdValidation.suggestions);
    }
}

// Get help for specific commands or components
console.log(ChangeTypes.getHelp("add_component"));
console.log(ChangeTypes.getHelp("Box"));

// Or use runSafe() to validate and execute in one step (throws on error)
try {
    await ChangeTypes.runSafe("add_component Scene/Box Box");
} catch (error) {
    console.error("Command failed:", error.message);
}
```

**Validation Benefits:**
- Catch typos before execution (e.g., "Cube" → suggests "Box")
- Get helpful suggestions for misspelled component names
- Verify command syntax is correct
- Validate property names exist before setting them
- Access command/component documentation in console
- Use `ChangeTypes.runSafe()` for automatic validation + execution (throws errors)

### Inventory

```javascript
// Load item from inventory
await RunCommand("load_item MyPrefab Scene");

// Save entity to inventory
await RunCommand("save_item Scene/MyEntity SavedPrefab MyFolder");

// Delete item
await RunCommand("delete_item OldItem");

// Create script
await RunCommand("create_script MyScript.js");
```

### Space Properties

```javascript
// Set public property
await RunCommand("set_space_property gameMode freeplay false");

// Set protected property (admin only)
await RunCommand("set_space_property maxPlayers 16 true");
```

### Help

```javascript
// Show all commands
await RunCommand("help");
```

---

## Querying World State

Before executing commands, inspect the world:

```javascript
// Get entity
const entity = SM.getEntityById("Scene/MyEntity");

// Get component
const component = SM.getEntityComponentById("Box_12345");

// Get all entities
const allEntities = SM.getAllEntities();

// Get selected entity
const selected = SM.getSelectedEntity();
```

### Entity Properties

```javascript
entity.id           // "Scene/MyEntity"
entity.name         // "MyEntity"
entity.active       // true/false
entity.components   // Array of components
entity.children     // Array of child entities
entity.transform.localPosition   // {x, y, z}

// Get component by type
const box = entity.getComponent("Box");
const materials = entity.getComponents("Material");
```

### Component Properties

```javascript
component.id          // "Box_12345"
component.type        // "Box"
component.properties  // All properties object
component._entity     // Parent entity
```

---

## Common Workflows

### Create Complete GameObject

```javascript
// Create entity
await RunCommand("add_entity Scene Box");

// Add components
await RunCommand("add_component Scene/Box Box");
await RunCommand("add_component Scene/Box Material");

// ⚠️ ALWAYS query for component IDs after creation
const entity = SM.getEntityById("Scene/Box");
const box = entity.getComponent("Box");
const material = entity.getComponent("Material");

// Verify components exist before using them
if (!box || !material) {
    console.error("Failed to create components!");
    return;
}

// Now configure
await RunCommand(`set_component_property ${box.id} size [2,2,2]`);
await RunCommand(`set_component_property ${material.id} color #FF5500`);
await RunCommand("set_entity_property Scene/Box localPosition [0,5,0]");
```

### Batch Modify Entities

```javascript
// Get all entities
const entities = SM.getAllEntities();

// Filter by criteria
const boxes = entities.filter(e =>
    e.components.some(c => c.type === "Box")
);

console.log(`Found ${boxes.length} boxes`);

// Modify each
for (const box of boxes) {
    await RunCommand(`set_entity_property ${box.id} active false`);
}
```

### Create Hierarchy

```javascript
// Parent
await RunCommand("add_entity Scene Environment");

// Children
await RunCommand("add_entity Scene/Environment Lights");
await RunCommand("add_entity Scene/Environment Geometry");

// Grandchildren
await RunCommand("add_entity Scene/Environment/Lights MainLight");
await RunCommand("add_entity Scene/Environment/Lights FillLight");
```

### Find and Modify Components

```javascript
const allEntities = SM.getAllEntities();
const spheres = [];

// Collect all Sphere components
for (const entity of allEntities) {
    spheres.push(...entity.getComponents("Sphere"));
}

console.log(`Found ${spheres.length} spheres`);

// Modify them
for (const sphere of spheres) {
    await RunCommand(`set_component_property ${sphere.id} radius 2`);
}
```

---

## Best Practices

### 1. Always Validate Entity Existence

```javascript
// Check entity exists before operating
const entity = SM.getEntityById("Scene/MyEntity");
if (!entity) {
    console.error("Entity not found");
    return;
}

await RunCommand("set_entity_property Scene/MyEntity active false");
```

### 2. Query Component IDs After Creation & VERIFY

Components get random IDs when created. **Always verify they exist:**

```javascript
await RunCommand("add_entity Scene Box");
await RunCommand("add_component Scene/Box Box");

// Query to get the ID
const entity = SM.getEntityById("Scene/Box");
const box = entity.getComponent("Box");

// ⚠️ VERIFY component was created successfully
if (!box) {
    console.error("Failed to add Box component!");
    console.log("Check component name spelling and try again");
    return;
}

// Now safe to use
await RunCommand(`set_component_property ${box.id} size [2,2,2]`);
```

### 3. Handle Protected Entities

```javascript
// Cannot modify Scene or People entities
if (entity.id === "Scene" || entity.id === "People") {
    console.error("Cannot delete protected entity");
    return;
}

if (entity.parentId === "People") {
    console.error("Cannot delete player entities");
    return;
}
```

### 4. Validate Component Names Before Adding

Always validate component names to catch typos:

```javascript
// Validate component exists before adding
const validation = ChangeTypes.validateComponent("Box");
if (!validation.valid) {
    console.error(validation.message);
    console.log("Try one of these:", validation.suggestions);
    return;
}

await RunCommand("add_component Scene/MyEntity Box");
```

### 5. Use runSafe() with Error Handling

Always wrap `runSafe()` in try/catch to handle validation failures:

```javascript
try {
    // This will throw if component doesn't exist or property is invalid
    await ChangeTypes.runSafe("add_component Scene/Box Box");
    await ChangeTypes.runSafe("set_component_property Box_123 width 2");
} catch (error) {
    console.error("Command failed:", error.message);
    // Error message includes suggestions for corrections
    // Agent can see this and adjust approach
    return; // Exit early on failure
}
```

### 6. Check Component Compatibility

Some components auto-add others (bundles):

```javascript
// Check what gets bundled
const bundles = ComponentRegistry.getBundledComponents("Box");
console.log("Box auto-adds:", bundles); // ['Material']

// When you add Box, Material is auto-added
```

---

## Validation Rules

Commands are validated before execution:

- ❌ Cannot rename or delete `Scene` or `People`
- ❌ Cannot move or delete entities under `People`
- ❌ Cannot add duplicate unique components (Transform, Rigidbody)
- ❌ Entity names must be unique within parent
- ❌ Component IDs must be globally unique
- ❌ Wrong component names will fail silently - component won't be created

---

## Troubleshooting

### Component Name Typo or Misspelling

**Problem:** You typed "Cube" instead of "Box" or misspelled a component name

**Solution:**
```javascript
// Use validation to catch typos BEFORE execution
const validation = ChangeTypes.validateComponent("Cube");
if (!validation.valid) {
    console.error(validation.message);
    console.log("Suggestions:", validation.suggestions);
    // Suggestions: ["Box", "Cube", ...]
}

// Or use fuzzy matching to find the right name
const suggestions = ChangeTypes.suggestComponent("cube");
console.log("Did you mean:", suggestions[0]); // "Box"
```

### Component Not Found After Adding

**Problem:** Component doesn't exist after `add_component`

**Solution:**
```javascript
// 1. Validate BEFORE adding to catch errors early
const validation = ChangeTypes.validateComponent("Box");
if (!validation.valid) {
    console.error(validation.message);
    console.log("Try:", validation.suggestions);
    return;
}

// 2. Add component
await RunCommand("add_component Scene/MyEntity Box");

// 3. Query and verify
const entity = SM.getEntityById("Scene/MyEntity");
const box = entity.getComponent("Box");

if (!box) {
    console.error("Component not created!");
    console.log("Available mesh components:");
    console.log(ComponentRegistry.getByCategory("meshes"));
}
```

### Property Set Command Fails

**Problem:** `set_component_property` command runs but nothing changes

**Causes:**
1. Wrong component ID (component doesn't exist)
2. Wrong property name
3. Invalid property value type

**Solution:**
```javascript
// Verify component exists
const component = SM.getEntityComponentById("Box_12345");
if (!component) {
    console.error("Component doesn't exist with that ID");
    return;
}

// Check component properties
console.log("Available properties:", Object.keys(component.properties));

// Set with correct type
await RunCommand(`set_component_property ${component.id} size [1,1,1]`);
```

### Entity Has No Components

**Problem:** Entity exists but `entity.components` is empty

**Causes:**
1. Used wrong component names (e.g., `Cube` instead of `Box`)
2. Components failed to add

**Solution:**
```javascript
// Check what components were supposed to be added
const entity = SM.getEntityById("Scene/MyEntity");
console.log("Component count:", entity.components.length);

// List them
entity.components.forEach(c => {
    console.log(`- ${c.type} (${c.id})`);
});

// Add components with CORRECT names
await RunCommand("add_component Scene/MyEntity Box");
await RunCommand("add_component Scene/MyEntity Material");
```

---

## Debugging Utilities

### Inspect Entity

```javascript
function inspect(entityId) {
    const entity = SM.getEntityById(entityId);
    if (!entity) {
        console.error(`Entity not found: ${entityId}`);
        return;
    }

    console.log(`Entity: ${entity.name} (${entity.id})`);
    console.log(`Active: ${entity.active}, Layer: ${entity.layer}`);
    console.log(`Position:`, entity.transform.localPosition);
    console.log(`Components (${entity.components.length}):`);
    entity.components.forEach(c => {
        console.log(`  - ${c.type} (${c.id})`);
        console.log(`    Properties:`, Object.keys(c.properties));
    });
}

inspect("Scene/MyEntity");
```

### List All Entities

```javascript
function listAll() {
    SM.getAllEntities().forEach(e => {
        const comps = e.components.map(c => c.type).join(", ");
        console.log(`${e.id} [${comps}]`);
    });
}

listAll();
```

### Find Components of Type

```javascript
function findComponentType(typeName) {
    const found = [];
    SM.getAllEntities().forEach(entity => {
        const comps = entity.getComponents(typeName);
        found.push(...comps.map(c => ({
            entity: entity.id,
            component: c.id,
            properties: c.properties
        })));
    });
    return found;
}

// Find all Box components
const boxes = findComponentType("Box");
console.log(`Found ${boxes.length} Box components:`, boxes);
```

### Verify Component Was Created

```javascript
async function addComponentSafe(entityId, componentType) {
    console.log(`Adding ${componentType} to ${entityId}...`);

    await RunCommand(`add_component ${entityId} ${componentType}`);

    // Wait a moment for component to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    const entity = SM.getEntityById(entityId);
    if (!entity) {
        console.error("Entity not found!");
        return null;
    }

    const component = entity.getComponent(componentType);
    if (!component) {
        console.error(`Failed to add ${componentType}!`);
        console.log("Check component name spelling");
        console.log(`Available ${componentType.includes("Banter") ? "Banter" : ""} components:`);
        console.log(ComponentRegistry.list().filter(c =>
            c.name.toLowerCase().includes(componentType.toLowerCase())
        ));
        return null;
    }

    console.log(`✓ Successfully added ${componentType} (${component.id})`);
    return component;
}

// Usage
const box = await addComponentSafe("Scene/MyEntity", "Box");
if (box) {
    await RunCommand(`set_component_property ${box.id} size [2,2,2]`);
}
```

### Safely Execute Commands with Validation

Use `ChangeTypes.runSafe()` to validate and execute commands with automatic error checking:

```javascript
// Validate and execute command - throws error if validation fails
await ChangeTypes.runSafe("add_component Scene/Box Box");

// If component name is wrong, THROWS ERROR with suggestions
try {
    await ChangeTypes.runSafe("add_component Scene/Box Cube");
} catch (error) {
    console.error(error.message);
    // ❌ Component "Cube" not found. Did you mean one of these?
    //
    // Did you mean:
    //   - Box
    //   - Cube
}

// Handles property validation too
try {
    await ChangeTypes.runSafe("set_component_property Box_123 invalidProp value");
} catch (error) {
    console.error(error.message);
    // ❌ Property "invalidProp" does not exist in component "Box".
    // Valid properties: width, height, depth, ...
}

// You can still pass options as second parameter
await ChangeTypes.runSafe("add_component Scene/Box Box", { source: 'script' });
```

**Important**: `runSafe()` throws an Error if validation fails, so wrap it in try/catch if you want to handle errors gracefully.

---

## Quick Reference

```javascript
// ENTITIES
await RunCommand("add_entity <parentId> <name>");
await RunCommand("remove_entity <entityId>");
await RunCommand("move_entity <entityId> <newParentId>");
await RunCommand("set_entity_property <entityId> <property> <value>");
await RunCommand("clone_entity <entityId>");

// COMPONENTS (use correct names!)
await RunCommand("add_component <entityId> Box");  // NOT Cube
await RunCommand("add_component <entityId> Material");  // NOT StandardMaterial
await RunCommand("remove_component <componentId>");
await RunCommand("set_component_property <componentId> <property> <value>");

// INVENTORY
await RunCommand("load_item <itemName> <parentId>");
await RunCommand("save_item <entityId> <itemName> <folder>");

// QUERYING
SM.getEntityById(id)
SM.getEntityComponentById(id)
SM.getAllEntities()
entity.getComponent(type)

// DISCOVERING COMPONENTS
ComponentRegistry.list()
ComponentRegistry.getByCategory("meshes")
ComponentRegistry.getInfo("Box")

// VALIDATION HELPERS
ChangeTypes.validateComponent("Box")
ChangeTypes.suggestComponent("cube")
ChangeTypes.validateCommand("add_component Scene/Box Box")
ChangeTypes.getHelp("add_component")

// SAFE EXECUTION (validates before running)
await ChangeTypes.runSafe("add_component Scene/Box Box")
```

---

## Common Mistakes

❌ **WRONG:** `await RunCommand("add_component Scene/Box Cube");`
✅ **CORRECT:** `await RunCommand("add_component Scene/Box Box");`

❌ **WRONG:** `await RunCommand("add_component Scene/Box StandardMaterial");`
✅ **CORRECT:** `await RunCommand("add_component Scene/Box Material");`

❌ **WRONG:** `entity.getComponent("Cube")`
✅ **CORRECT:** `entity.getComponent("Box")`

❌ **WRONG:** Using component without verifying it exists
```javascript
await RunCommand("add_component Scene/Box Box");
const box = entity.getComponent("Box");
await RunCommand(`set_component_property ${box.id} size [2,2,2]`); // Crash if box is null!
```

✅ **CORRECT:** Always verify before using
```javascript
await RunCommand("add_component Scene/Box Box");
const box = entity.getComponent("Box");
if (!box) {
    console.error("Component not created!");
    return;
}
await RunCommand(`set_component_property ${box.id} size [2,2,2]`);
```

---

## Tips

- Use `Ctrl+Z` / `Ctrl+Shift+Z` for undo/redo
- Press `Up` arrow to recall previous commands
- Type `help` to see all available commands
- Use `ComponentRegistry.list()` to discover component names
- Use `ChangeTypes.validateComponent(name)` to validate component names before adding
- Use `ChangeTypes.suggestComponent(partialName)` to get fuzzy-matched suggestions
- Use `ChangeTypes.validateCommand(cmdString)` to validate commands before execution
- Use `await ChangeTypes.runSafe(cmdString)` to validate and execute (throws error on failure)
- Wrap `runSafe()` in try/catch to handle validation errors gracefully
- ALWAYS verify components exist after creation
- Most components have `Banter` prefix (except colliders)
- Use `sel()` shortcut to get selected entity
- Use `entities()` shortcut to get all root entities
- All commands are logged to lifecycle shell for audit
