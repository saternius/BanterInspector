# Space Properties Struct View Implementation Plan

## Overview
Add a toggle button to the space properties popup window that switches between "flat" view (current implementation) and "struct" view (hierarchical tree representation). The struct view will parse dot-notation property keys and display them as a nested tree structure similar to the scene hierarchy panel.

## Goals
1. Provide a more organized view of complex nested properties
2. Allow collapsing/expanding of nested structures
3. Maintain full editing capabilities in struct view
4. Seamless switching between flat and struct views
5. Preserve user's expand/collapse state during session

## Technical Design

### 1. Data Structure Parsing

#### Key Parsing Strategy
Transform flat key-value pairs into a hierarchical tree structure:

**Input Example:**
```javascript
{
  "player.health": 100,
  "player.armor": 50,
  "player.inventory.sword": 1,
  "player.inventory.potion": 3,
  "player.position.x": 10,
  "player.position.y": 20,
  "player.position.z": 30,
  "game.score": 1000,
  "game.level": 5,
  "game.enemies[0].name": "goblin",
  "game.enemies[0].health": 50,
  "game.enemies[1].name": "orc",
  "game.enemies[1].health": 100
}
```

**Output Tree Structure:**
```javascript
{
  "player": {
    "_value": null,
    "_children": {
      "health": { "_value": 100, "_children": null },
      "armor": { "_value": 50, "_children": null },
      "inventory": {
        "_value": null,
        "_children": {
          "sword": { "_value": 1, "_children": null },
          "potion": { "_value": 3, "_children": null }
        }
      },
      "position": {
        "_value": null,
        "_children": {
          "x": { "_value": 10, "_children": null },
          "y": { "_value": 20, "_children": null },
          "z": { "_value": 30, "_children": null }
        }
      }
    }
  },
  "game": {
    "_value": null,
    "_children": {
      "score": { "_value": 1000, "_children": null },
      "level": { "_value": 5, "_children": null },
      "enemies": {
        "_value": null,
        "_children": {
          "0": {
            "_value": null,
            "_children": {
              "name": { "_value": "goblin", "_children": null },
              "health": { "_value": 50, "_children": null }
            }
          },
          "1": {
            "_value": null,
            "_children": {
              "name": { "_value": "orc", "_children": null },
              "health": { "_value": 100, "_children": null }
            }
          }
        }
      }
    }
  }
}
```

#### Parsing Algorithm
```javascript
function parseKeysToTree(props) {
  const tree = {};

  for (const [key, value] of Object.entries(props)) {
    const parts = key.split(/\.|\[|\]/g).filter(p => p);
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          _value: isLast ? value : null,
          _children: isLast ? null : {},
          _fullKey: parts.slice(0, i + 1).join('.')
        };
      }

      if (!isLast) {
        current = current[part]._children;
      }
    }
  }

  return tree;
}
```

### 2. UI Components

#### Toggle Button
- Location: In popup header, next to the title
- States: "Flat" | "Struct"
- Icon: 📋 (flat) | 🌳 (struct)
- Persists selection in localStorage

#### Tree Node Component
Each node in the struct view will have:
- **Expand/Collapse Arrow**: ▶ (collapsed) ▼ (expanded)
- **Node Name**: The property key segment
- **Value Display**: For leaf nodes
- **Edit Controls**: Edit/Delete buttons for leaf nodes
- **Indentation**: Based on depth level

#### HTML Structure
```html
<div class="struct-tree">
  <div class="tree-node" data-depth="0" data-expanded="true">
    <span class="tree-arrow">▼</span>
    <span class="tree-key">player</span>
    <div class="tree-children">
      <div class="tree-node leaf" data-depth="1">
        <span class="tree-arrow invisible"></span>
        <span class="tree-key">health</span>
        <span class="tree-value">100</span>
        <span class="tree-actions">
          <button class="edit-btn">✎</button>
          <button class="delete-btn">×</button>
        </span>
      </div>
      <div class="tree-node" data-depth="1" data-expanded="false">
        <span class="tree-arrow">▶</span>
        <span class="tree-key">inventory</span>
        <div class="tree-children" style="display: none;">
          <!-- Children nodes -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3. State Management

#### View State
```javascript
class StructViewState {
  constructor() {
    this.viewMode = 'flat'; // 'flat' | 'struct'
    this.expandedNodes = new Set(); // Track expanded node paths
    this.editingNodes = new Map(); // Track which nodes are being edited
  }

  toggleNode(path) {
    if (this.expandedNodes.has(path)) {
      this.expandedNodes.delete(path);
    } else {
      this.expandedNodes.add(path);
    }
  }

  isExpanded(path) {
    return this.expandedNodes.has(path);
  }
}
```

### 4. Features Implementation

#### Rendering Logic
1. **Flat Mode**: Use existing `renderPropsList` method
2. **Struct Mode**: New `renderStructView` method
   - Parse properties into tree structure
   - Recursively render tree nodes
   - Apply expand/collapse state
   - Handle indentation based on depth

#### Editing in Struct View
- **Leaf Nodes**: Direct inline editing like flat view
- **Branch Nodes**: Cannot be edited (only expanded/collapsed)
- **Adding Properties**:
  - In struct view, show "Add" button at each level
  - Allow adding child properties with dot notation
  - Example: Adding to "player.inventory" creates "player.inventory.newKey"

#### Value Type Detection
Automatically detect and preserve value types:
- **Primitives**: string, number, boolean
- **Vector3**: Objects with x, y, z properties
- **Arrays**: Detected from bracket notation in keys
- **Nested Objects**: Detected from dot notation

### 5. CSS Styling

```css
.struct-tree {
  padding: 10px;
}

.tree-node {
  display: flex;
  flex-direction: column;
  margin: 2px 0;
}

.tree-node > div:first-child {
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 3px;
  cursor: pointer;
}

.tree-node > div:first-child:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tree-arrow {
  width: 16px;
  display: inline-block;
  text-align: center;
  transition: transform 0.2s;
  user-select: none;
}

.tree-arrow.invisible {
  visibility: hidden;
}

.tree-key {
  font-weight: 600;
  color: #3b82c4;
  margin-right: 8px;
}

.tree-value {
  color: #e0e0e0;
  flex: 1;
}

.tree-children {
  margin-left: 20px;
  border-left: 1px solid #333;
}

.tree-node[data-depth="0"] .tree-children {
  margin-left: 16px;
}

.tree-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .tree-actions {
  opacity: 1;
}

.view-toggle-btn {
  background: #444;
  border: 1px solid #555;
  color: #e0e0e0;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-toggle-btn:hover {
  background: #555;
}

.view-toggle-btn.active {
  background: #3b82c4;
  border-color: #2563eb;
}
```

### 6. Implementation Steps

#### Phase 1: Core Infrastructure
1. Add view mode toggle button to popup header
2. Create `StructViewState` class for state management
3. Implement `parseKeysToTree` function
4. Add localStorage persistence for view mode preference

#### Phase 2: Tree Rendering
1. Create `renderStructView` method
2. Implement recursive tree node rendering
3. Add expand/collapse functionality
4. Apply proper indentation and styling

#### Phase 3: Interactivity
1. Implement inline editing for leaf nodes
2. Add delete functionality for properties
3. Create "Add child property" feature
4. Handle Vector3 and other special types

#### Phase 4: Polish & Edge Cases
1. Add smooth transitions for expand/collapse
2. Handle edge cases (empty objects, arrays, special characters in keys)
3. Add keyboard navigation (arrow keys for tree navigation)
4. Implement search/filter in struct view
5. Add "Expand All" / "Collapse All" buttons

### 7. Edge Cases & Considerations

#### Key Naming Conflicts
- Handle keys that contain dots: `"user.name": "John"` vs `"user": { "name": "John" }`
- Solution: Escape dots in actual key names with backslash

#### Array Handling
- Detect array patterns: `items[0]`, `items[1]`
- Display arrays with special styling/icons
- Allow array manipulation (add/remove items)

#### Performance
- For large property sets (100+ keys), implement virtual scrolling
- Lazy load children only when parent is expanded
- Debounce render updates

#### Data Integrity
- Ensure struct view changes correctly update the flat key-value structure
- Validate that switching views doesn't lose data
- Handle circular references gracefully

### 8. Testing Scenarios

1. **Basic Nesting**: Simple dot notation properties
2. **Deep Nesting**: Properties with 5+ levels of nesting
3. **Arrays**: Properties with array indices
4. **Mixed Types**: Combination of primitives, Vector3, objects
5. **Special Characters**: Keys with spaces, dots, brackets
6. **Performance**: 500+ properties
7. **State Persistence**: View mode and expanded nodes survive reload
8. **Edit Operations**: All CRUD operations work in both views

### 9. Future Enhancements

1. **JSON Import/Export**: Allow importing complex JSON structures
2. **Batch Operations**: Select multiple properties for bulk delete/edit
3. **Property Templates**: Save common property structures as templates
4. **Diff View**: Show changes between current and previous state
5. **Property Validation**: Add schema validation for property values
6. **Contextual Menus**: Right-click menus for advanced operations

## Summary

The struct view will provide a more intuitive way to work with hierarchically organized space properties. By parsing dot-notation keys into a tree structure and providing familiar expand/collapse interactions, users can better understand and manage complex property sets. The implementation will maintain full compatibility with the existing flat view while adding powerful new organizational capabilities.