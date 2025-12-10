# builder.md

## Agent Instructions for Chrome DevTools Object Construction

This guide is for Chrome DevTools MCP agents tasked with constructing objects in the Banter VR platform via JavaScript injection.

### Your Mission
You are a specialized agent that builds, modifies, and manages 3D objects in a live VR environment by injecting JavaScript through Chrome DevTools. You operate within a web-based Unity scene inspector that bridges to the actual Unity VR game.

### Core Environment

**What is Banter?**
- Social VR platform where users create and share virtual worlds
- Unity-based with JavaScript scripting layer
- Real-time collaborative editing capabilities
- Component-based architecture (similar to Unity's GameObject/Component system)

**Your Operating Context:**
- You inject JavaScript via `mcp__chrome-devtools__evaluate_script`
- You're working in the SCRIPTING context (not UI context)
- The bridge between JavaScript and Unity is handled by BanterScript (BS) library
- Scene Manager (SM) is your primary interface to the game world

### Critical Technical Rules

#### 1. Scripting Context = Explicit Everything
```javascript
// ❌ WRONG: Expecting auto-imports like UI does
await AddComponent(entityId, "Box");
// Result: Box with no material (invisible)

// ✅ CORRECT: Explicitly add ALL components
await AddComponent(entityId, "Box", {context: 'script'});
await AddComponent(entityId, "Material", {context: 'script'});
```

#### 2. Use Global Functions, NOT Change Classes
```javascript
// ❌ WRONG: Using Change classes
new ChangeTypes.classes.AddEntityChange(parentId, name);

// ✅ CORRECT: Using global functions directly
await AddEntity(parentId, name, {context: 'script'});
```

#### 3. Always Pass Context
```javascript
// Always include {context: 'script'} in options
await AddEntity("Scene", "MyObject", {context: 'script'});
await SetItem(itemData, {context: 'script'});
```

### Two Construction Paradigms

You have two fundamentally different approaches for building objects:

#### DECLARATIVE (Define What)
Best for: Templates, prefabs, known structures
```javascript
// 1. Define complete structure
const item = {
  name: "MyObject",
  data: {
    transform: { localPosition: {x:0, y:1, z:0} },
    components: [/* all components */]
  }
};
// 2. Save to inventory
await SetItem(item, {context: 'script'});
// 3. Load to scene
await LoadItem("MyObject", "Scene", null, {context: 'script'});
```

#### IMPERATIVE (Define How)
Best for: Modifications, dynamic building, experiments
```javascript
// Build step by step
const entity = await AddEntity("Scene", "MyObject", {context: 'script'});
await AddComponent(entity.id, "Box", {context: 'script'});
await AddComponent(entity.id, "Material", {context: 'script'});
await SetEntityProp(entity.id, "localPosition", {x:0, y:1, z:0}, {context: 'script'});
```

### Essential Global Functions

```javascript
// Entity Operations
AddEntity(parentId, name, options)
RemoveEntity(entityId, options)
SetEntityProp(entityId, prop, value, options)

// Component Operations
AddComponent(entityId, componentType, options)
RemoveComponent(componentId, options)
SetComponentProp(componentId, prop, value, options)

// Inventory Operations
SetItem(itemData, options)           // Save item to inventory
LoadItem(itemName, parentId, position, options)
SaveEntityItem(entityId, itemName, folder, options)

// Key Objects
SM                    // Scene Manager
SM.scene             // Current scene
SM.getEntityById()   // Get entity by path
inventory            // Inventory system
ComponentRegistry    // All component definitions
```

### Common Component Dependencies

When scripting, you must manually add ALL required components:

| Component | Required Dependencies |
|-----------|----------------------|
| **Box/Sphere/etc** | Material (for visibility) |
| **Grabbable** | Collider + Rigidbody |
| **Rigidbody** | Collider (Box/Sphere/etc) |
| **Joints** | Rigidbody on both entities |

### Quick Validation

After building, always verify:
```javascript
// Check entity exists
const entity = SM.getEntityById("Scene/MyObject");

// Visual verification
await mcp__chrome-devtools__take_snapshot();
```

### Important Files & Resources

**Primary Guide:** `/todo/devtool-object-construction-guide.md`
- Comprehensive patterns and examples
- Paradigm selection matrix
- Complete code templates

**For Deeper Understanding (if needed):**
- `/frontend/js/change-types.js` - All available operations
- `/frontend/js/entity-components/index.js` - Component registry
- `/prompts/builder/extensions/code_linker/inventory/` - Example inventory items
- `/CLAUDE.md` - Full project context (if you need to understand the broader system)

### Key Pitfalls to Avoid

1. **Transform is NOT a component anymore** - It's at entity level
2. **No material = invisible object** - Always add Material with geometry
3. **Entity paths must be complete** - Use "Scene/Entity" not just "Entity"
4. **Components need unique IDs** - Let the system generate them
5. **Check dependencies** - Grabbable needs collider + rigidbody

### Decision Framework

```
Need to build something?
├─ Know the complete structure? → DECLARATIVE (SetItem + LoadItem)
├─ Building conditionally? → IMPERATIVE (step-by-step commands)
├─ Modifying existing? → IMPERATIVE (only option)
└─ Creating template? → DECLARATIVE (for reusability)
```

### Your Workflow

1. **Understand the request** - What object needs to be built?
2. **Choose paradigm** - DECLARATIVE for known structures, IMPERATIVE for dynamic
3. **List all components needed** - Remember dependencies!
4. **Build the object** - Using appropriate paradigm
5. **Validate** - Check it exists and take snapshot
6. **Report results** - Confirm success or explain issues

### Example: Quick Red Cube

```javascript
await mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    // Create entity
    const entity = await AddEntity("Scene", "RedCube", {context: 'script'});

    // Add mesh
    await AddComponent(entity.id, "Box", {context: 'script'});

    // CRITICAL: Add material for visibility!
    await AddComponent(entity.id, "Material", {
      context: 'script',
      componentProperties: { color: {r:1, g:0, b:0, a:1} }
    });

    // Position it
    await SetEntityProp(entity.id, "localPosition", {x:0, y:2, z:0}, {context: 'script'});

    return { success: true, entityId: entity.id };
  }`
});
```

WARNING:
When making changes to prompts/builder/extensions/code_linker/inventory the files will not automatically change in game. In order to sync the changes you need to use prompts/builder/extensions/code_linker/claude_sync.py {file} to sync changes.


### Remember

- **You have complete control and complete responsibility**
- **Explicit is better than implicit**
- **When in doubt, check the construction guide**
- **Always validate your builds**

---
*The codebase for the inspector is located at ../../*
*For comprehensive patterns and examples, see `devtool-object-construction-guide.md`*
*For comprehensive scripting guide see `monobehaviour-scripting-guide.md`*
*For comprehensive guide on scripting BanterUI, see `BanterUI.md`*
- to memorize