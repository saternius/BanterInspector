# Unity Scene Inspector - Documentation for Claude Code

## Overview
The Unity Scene Inspector is a web-based tool for inspecting and modifying Unity scenes in real-time via the BanterScript (BS) library. It provides a hierarchical view of scene objects, component properties editing, and space state management.

## Project Structure
```
inspector/
├── index.html           # Main HTML structure
├── styles.css          # All CSS styles
├── js/
│   ├── app.js          # Main application entry point
│   ├── scene-manager.js # Core scene state and Unity connection
│   ├── hierarchy-panel.js # Scene hierarchy tree display
│   ├── properties-panel.js # Component properties editor
│   ├── space-props-panel.js # Space properties management
│   ├── component-menu.js # Component selection menu
│   ├── mock-data.js    # Mock data for development
│   └── utils.js        # Utility functions
└── docs/
    ├── BanterScript-API-Reference.md
    └── BanterScript-Quick-Start.md
```

## Architecture

### Module System
The inspector uses ES6 modules for clean separation of concerns:

1. **SceneManager** (`scene-manager.js`)
   - Singleton that manages all scene state
   - Handles Unity connection via BS library
   - Manages slot hierarchy and component data
   - Handles space properties (public/protected)

2. **HierarchyPanel** (`hierarchy-panel.js`)
   - Renders the scene hierarchy tree
   - Handles slot selection and expansion state
   - Provides search functionality
   - Manages add/delete slot operations

3. **PropertiesPanel** (`properties-panel.js`)
   - Displays selected slot's components and properties
   - Handles property editing with type-specific inputs
   - Manages component data updates
   - Provides inline slot name editing

4. **SpacePropsPanel** (`space-props-panel.js`)
   - Manages public and protected space properties
   - Handles property CRUD operations
   - Provides inline editing capabilities

5. **ComponentMenu** (`component-menu.js`)
   - Modal overlay for adding components
   - Categorized component list with search
   - Creates Unity components via BS library

6. **Utils** (`utils.js`)
   - Common utility functions
   - Type checking helpers
   - Value parsing and formatting

## Key Features

### 1. Unity Integration
- Connects to Unity via BS.BanterScene
- Falls back to mock data if Unity unavailable
- Real-time bi-directional updates
- Component creation and modification

### 2. Hierarchy Management
- Tree view with expand/collapse
- Slot selection and highlighting
- Add/delete slots
- Search functionality
- Active/inactive state display

### 3. Property Editing
- Type-specific input controls:
  - Checkbox for booleans
  - Number inputs for numeric values
  - Vector3 inputs with X/Y/Z fields
  - Color picker with RGBA controls
  - Text inputs for strings
- Debounced updates to Unity
- Property persistence via space state

### 4. Component System
- Add components via categorized menu
- Support for all major BS component types:
  - Physics (Rigidbody, Colliders)
  - Rendering (Geometry, Material, Text)
  - Media (Audio, Video, Browser)
  - Interaction (Grab, Sync, Attach)
  - Loading (GLTF, AssetBundle, Portal)

### 5. Space Properties
- Public properties (visible to all users)
- Protected properties (admin only)
- Add/edit/delete operations
- JSON value support
- Vector3 property support

## Data Flow

1. **Scene Loading**
   ```
   Unity → BS Library → SceneManager → UI Panels
   ```

2. **Property Updates**
   ```
   User Input → Panel → SceneManager → Unity (via BS)
                    ↓
                Space State (persistence)
   ```

3. **Event System**
   - Custom events for cross-module communication
   - Unity events forwarded through SceneManager
   - Debounced updates for performance

## Development Notes

### Adding New Component Types
1. Add default config in `scene-manager.js` → `getDefaultComponentConfig()`
2. Add Unity creation in `component-menu.js` → `createUnityComponent()`
3. Add icon in `utils.js` → `getComponentIcon()`
4. Add to component menu HTML in `index.html`

### Property Type Support
To add a new property type:
1. Add type check in `utils.js`
2. Add rendering logic in `properties-panel.js` → `renderProperty()`
3. Add parsing logic if needed

### Mock Data
- Use `mock-data.js` for development without Unity
- Provides realistic scene hierarchy
- Includes various component types
- Simulates space properties

## Performance Considerations
- Debounced property updates (100ms)
- Efficient DOM updates
- Minimal re-renders
- Event delegation where possible

## Browser Compatibility
- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge
- Requires JavaScript enabled

## Security Notes
- No direct file system access
- All Unity operations through BS library
- Input validation for property values
- XSS protection via proper escaping

## Future Enhancements
1. Undo/redo system
2. Multi-select operations
3. Copy/paste components
4. Property animation
5. Scene export/import
6. Performance profiling
7. Collaborative editing
8. Custom component templates