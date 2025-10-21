# Struct View - Real Data Analysis & Updated Implementation

## Actual Space Properties Structure

After inspecting the real space properties using Chrome DevTools, I discovered the actual data structure is quite different from my initial assumptions:

### Key Patterns Found

1. **Entity Properties** ($ prefix):
   - Format: `$EntityPath:PropertyName`
   - Example: `$Scene/Table_90695/Penny:active`
   - Path separator: `/`
   - Property separator: `:`
   - Common properties: `active`, `layer`, `position`, `rotation`, `scale`, `components`, `children`

2. **Component Properties** (__ prefix):
   - Format: `__ComponentType_ID:PropertyName`
   - Example: `__BoxCollider_87459:isTrigger`
   - Component separator: `_`
   - Property separator: `:`

3. **Simple Properties** (no prefix):
   - Format: `propertyName`
   - Examples: `passcode`, `hostUser`

### Data Statistics from Live Scene

- **Total Keys**: 529 properties
- **Value Types**:
  - Strings: 307 (58%)
  - Vector3: 162 (31%)
  - Arrays: 54 (10%)
  - Objects: 6 (1%)
- **Max Depth**: 1 (most properties are flat with `:` separator)

### Sample Real Properties

```javascript
{
  // Simple properties
  "passcode": "RTQPMG",
  "hostUser": "Technocrat",

  // Entity properties
  "$Scene:children": ["Scene/Ground", "Scene/PhysicsButtonKin_VS"],
  "$Scene/Ground:active": "true",
  "$Scene/Ground:position": {"x": 0, "y": 0, "z": 0},
  "$Scene/Ground:components": ["Grabbable_15280"],

  // Component properties
  "__BoxCollider_87459:isTrigger": "false",
  "__BoxCollider_87459:center": {"x": 0, "y": -0.95, "z": 0},
  "__BoxCollider_87459:size": {"x": 5, "y": 2, "z": 5},

  // Deep entity paths
  "$Scene/Table_90695/Penny/sfx/flip:active": "true",
  "$People/Technocrat/Trackers/HEAD:position": {"x": 0, "y": 0, "z": 0}
}
```

## Updated Struct View Implementation Plan

### 1. Revised Parsing Strategy

Instead of splitting by `.`, we need to handle three different separators:

```javascript
function parseKeysToTree(props) {
  const tree = {
    simple: {},      // Properties with no prefix
    entities: {},    // $ prefixed (entity properties)
    components: {}   // __ prefixed (component properties)
  };

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('$')) {
      // Entity property: $Scene/Ground:position
      parseEntityProperty(tree.entities, key, value);
    } else if (key.startsWith('__')) {
      // Component property: __BoxCollider_87459:center
      parseComponentProperty(tree.components, key, value);
    } else {
      // Simple property: passcode
      tree.simple[key] = value;
    }
  }

  return tree;
}
```

### 2. Entity Property Parsing

```javascript
function parseEntityProperty(tree, key, value) {
  // Remove $ prefix
  const cleanKey = key.substring(1);

  // Split by : to separate path from property
  const colonIndex = cleanKey.lastIndexOf(':');

  if (colonIndex === -1) {
    // No property part, just entity path
    tree[cleanKey] = { _value: value };
  } else {
    const entityPath = cleanKey.substring(0, colonIndex);
    const propertyName = cleanKey.substring(colonIndex + 1);

    // Split entity path by /
    const pathParts = entityPath.split('/');

    // Build nested structure
    let current = tree;
    for (const part of pathParts) {
      if (!current[part]) {
        current[part] = { _properties: {} };
      }
      current = current[part];
    }

    // Add property
    current._properties[propertyName] = value;
  }
}
```

### 3. Component Property Parsing

```javascript
function parseComponentProperty(tree, key, value) {
  // Remove __ prefix
  const cleanKey = key.substring(2);

  // Split by : to separate component from property
  const colonIndex = cleanKey.indexOf(':');

  if (colonIndex === -1) {
    tree[cleanKey] = { _value: value };
  } else {
    const componentName = cleanKey.substring(0, colonIndex);
    const propertyName = cleanKey.substring(colonIndex + 1);

    // Extract component type and ID
    const lastUnderscore = componentName.lastIndexOf('_');
    const componentType = componentName.substring(0, lastUnderscore);
    const componentId = componentName.substring(lastUnderscore + 1);

    // Group by component type
    if (!tree[componentType]) {
      tree[componentType] = {};
    }
    if (!tree[componentType][componentId]) {
      tree[componentType][componentId] = {};
    }

    tree[componentType][componentId][propertyName] = value;
  }
}
```

### 4. Updated Tree Structure

The resulting tree would look like:

```javascript
{
  simple: {
    passcode: "RTQPMG",
    hostUser: "Technocrat"
  },
  entities: {
    Scene: {
      _properties: {
        active: "true",
        children: ["Scene/Ground", "Scene/PhysicsButtonKin_VS"]
      },
      Ground: {
        _properties: {
          active: "true",
          position: {x: 0, y: 0, z: 0}
        },
        Sigil: {
          _properties: {
            active: "true"
          }
        }
      }
    },
    People: {
      Technocrat: {
        Trackers: {
          HEAD: {
            _properties: {
              position: {x: 0, y: 0, z: 0}
            }
          }
        }
      }
    }
  },
  components: {
    BoxCollider: {
      "87459": {
        isTrigger: "false",
        center: {x: 0, y: -0.95, z: 0}
      },
      "60249": {
        isTrigger: "false",
        center: {x: 0, y: 0.05, z: 0}
      }
    },
    Rigidbody: {
      "80504": {
        velocity: {x: 0, y: 0, z: 0},
        mass: "0"
      }
    }
  }
}
```

### 5. Updated UI Rendering

The struct view should now have three main sections:

1. **Simple Properties** - Flat list at the top
2. **Entity Hierarchy** - Tree view of entity properties
3. **Components** - Grouped by component type, then by instance

### 6. Visual Improvements

- **Icons for different types**:
  - 📦 for entities
  - ⚙️ for components
  - 📝 for simple properties
  - 📍 for Vector3 values

- **Color coding**:
  - Blue for entity names
  - Green for component types
  - Gray for property names
  - White for values

### 7. Key Benefits of This Approach

1. **Logical Grouping**: Properties are organized by their semantic meaning
2. **Entity Hierarchy**: Clear visualization of scene structure
3. **Component Organization**: Easy to find all properties of a specific component
4. **Performance**: Efficient parsing with single pass through properties
5. **Scalability**: Handles hundreds of properties without clutter

## Implementation Updates Needed

1. **Update parseKeysToTree()** - Handle `:` and `/` separators correctly
2. **Create separate parsers** - For entities and components
3. **Update renderStructView()** - Render three sections
4. **Add visual indicators** - Icons and colors for different types
5. **Improve expand/collapse** - Remember state per section

## Testing Scenarios

1. **Entity Properties**: Test with deep paths like `$Scene/Table_90695/Penny/sfx/flip:active`
2. **Component Properties**: Test with various component types and IDs
3. **Mixed Values**: Test Vector3, arrays, strings, objects
4. **Large Dataset**: Test with 500+ properties (current scene has 529)
5. **Special Characters**: Handle spaces, special chars in values

## Conclusion

The real data structure reveals that Banter's space properties use a specific convention:
- `:` separator for property access
- `/` separator for entity hierarchy
- `$` prefix for entities
- `__` prefix for components

This requires a complete reimplementation of the parsing logic but will result in a much more intuitive and organized struct view that matches the actual data structure of the Banter platform.