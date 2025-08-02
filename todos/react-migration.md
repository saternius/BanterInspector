# React Migration Plan for Unity Scene Inspector

## Overview
This document outlines a step-by-step migration plan to gradually convert the Unity Scene Inspector from vanilla JavaScript to React, using CDN imports for React and Babel.

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Add React Dependencies via CDN
Create `react-loader.js` to manage CDN imports:
```javascript
// Development versions with helpful warnings
const REACT_VERSION = '18.2.0';
const scripts = [
  `https://unpkg.com/react@${REACT_VERSION}/umd/react.development.js`,
  `https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.development.js`,
  'https://unpkg.com/@babel/standalone/babel.min.js'
];
```

### 1.2 Create React Bootstrap Module
- [ ] Create `js/react/react-bootstrap.js` to initialize React
- [ ] Set up Babel configuration for JSX transformation
- [ ] Create root React mount points in existing HTML
- [ ] Implement `renderReactComponent()` helper for gradual migration

### 1.3 Update Module Loader
- [ ] Modify `app.js` to load React before other modules
- [ ] Add support for `.jsx` modules with Babel transformation
- [ ] Create development/production switch for React CDN versions

### 1.4 Create Base React Components
- [ ] `js/react/components/BaseComponent.jsx` - Common component patterns
- [ ] `js/react/hooks/useUnityBridge.js` - Hook for Unity communication
- [ ] `js/react/hooks/useChangeManager.js` - Hook for undo/redo integration

## Phase 2: Leaf Component Migration (Week 2-3)

### 2.1 Create Reusable Input Components
Start with the most reused UI elements:

- [ ] `ColorPicker.jsx` - Replace inline color picker implementations
- [ ] `Vector3Input.jsx` - X/Y/Z input groups
- [ ] `NumberInput.jsx` - Numeric inputs with validation
- [ ] `SelectDropdown.jsx` - Option selects for enums
- [ ] `AssetPicker.jsx` - Texture/Material/Audio asset selection
- [ ] `SliderInput.jsx` - Range sliders with numeric display

### 2.2 Property Type Components
- [ ] `PropertyField.jsx` - Generic property wrapper
- [ ] `PropertyGroup.jsx` - Collapsible property sections
- [ ] `ArrayProperty.jsx` - Dynamic array editing
- [ ] `ObjectProperty.jsx` - Nested object editing

### 2.3 Integration Strategy
- [ ] Create `ReactPropertyRenderer` class to bridge with existing system
- [ ] Update `properties-panel.js` to use React components for rendering
- [ ] Maintain backward compatibility with non-React components

## Phase 3: Panel Component Migration (Week 4-5)

### 3.1 Properties Panel Migration
- [ ] Create `PropertiesPanel.jsx` main component
- [ ] Implement `ComponentEditor.jsx` for each component type
- [ ] Create `ComponentHeader.jsx` with expand/collapse/remove
- [ ] Migrate component-specific UI from `components/*.js`
- [ ] Preserve Change class integration

### 3.2 Hierarchy Panel Migration
- [ ] Create `HierarchyPanel.jsx` with virtual scrolling
- [ ] Implement `TreeNode.jsx` with drag-and-drop
- [ ] Create `SearchBar.jsx` with real-time filtering
- [ ] Implement `ContextMenu.jsx` for right-click actions
- [ ] Maintain selection state synchronization

### 3.3 Space Properties Panel
- [ ] Create `SpacePropertiesPanel.jsx`
- [ ] Implement `PropertyRow.jsx` with inline editing
- [ ] Create `PropertyTypeSelector.jsx`
- [ ] Preserve Firebase synchronization

## Phase 4: Complex Component Migration (Week 6-7)

### 4.1 Script Editor Migration
- [ ] Create `ScriptEditor.jsx` wrapper for CodeMirror
- [ ] Implement `ConsoleOutput.jsx` for script logs
- [ ] Create `ScriptControls.jsx` for play/stop/save
- [ ] Maintain script execution context

### 4.2 Inventory Panel Migration
- [ ] Create `InventoryPanel.jsx` with tabs
- [ ] Implement `InventoryItem.jsx` with drag source
- [ ] Create `FileUploader.jsx` for imports
- [ ] Preserve localStorage integration

### 4.3 Navigation System
- [ ] Create `NavigationTabs.jsx` to replace navigation.js
- [ ] Implement `TabContent.jsx` with lazy loading
- [ ] Maintain URL hash routing

## Phase 5: State Management Migration (Week 8)

### 5.1 Create React Context Providers
- [ ] `SceneContext` - Unity scene state
- [ ] `SelectionContext` - Selected GameObjects/components
- [ ] `UIStateContext` - Panel states, expanded items
- [ ] `NetworkContext` - Firebase synchronization

### 5.2 Migrate State Logic
- [ ] Move selection tracking to React state
- [ ] Convert expansion states to React
- [ ] Implement state persistence hooks
- [ ] Create state debugging tools

## Phase 6: Integration & Optimization (Week 9-10)

### 6.1 Performance Optimization
- [ ] Implement React.memo for expensive components
- [ ] Add virtualization to hierarchy tree
- [ ] Optimize re-renders with useCallback/useMemo
- [ ] Profile and fix performance bottlenecks

### 6.2 Final Integration
- [ ] Remove old vanilla JS UI code
- [ ] Update event system to use React synthetic events
- [ ] Migrate remaining helper functions
- [ ] Update documentation

### 6.3 Testing & Validation
- [ ] Test all undo/redo operations
- [ ] Verify network synchronization
- [ ] Test Unity bridge communication
- [ ] Validate all component types

## Implementation Guidelines

### Module Structure
```
js/
├── react/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ColorPicker.jsx
│   │   │   ├── Vector3Input.jsx
│   │   │   └── ...
│   │   ├── panels/
│   │   │   ├── PropertiesPanel.jsx
│   │   │   ├── HierarchyPanel.jsx
│   │   │   └── ...
│   │   └── unity/
│   │       ├── ComponentEditor.jsx
│   │       └── ...
│   ├── hooks/
│   ├── contexts/
│   └── utils/
```

### Babel Configuration
```html
<script type="text/babel" data-presets="react">
  // JSX code here
</script>
```

### Component Template
```jsx
// js/react/components/common/PropertyField.jsx
const PropertyField = ({ property, value, onChange, onChangeComplete }) => {
  const handleChange = (newValue) => {
    onChange(newValue);
  };

  const handleChangeComplete = (finalValue) => {
    // Trigger Change class for undo/redo
    const change = new PropertyChange(/* ... */);
    window.changeManager.addChange(change);
    onChangeComplete?.(finalValue);
  };

  return (
    <div className="property-field">
      {/* Render based on property type */}
    </div>
  );
};
```

### Migration Checklist Per Component
1. [ ] Create React component file
2. [ ] Implement UI with React patterns
3. [ ] Add Change class integration
4. [ ] Test with existing system
5. [ ] Update parent component to use React version
6. [ ] Remove old vanilla JS code
7. [ ] Update documentation

## Risk Mitigation

### Gradual Migration Strategy
- Keep both systems running in parallel
- Use feature flags to toggle between old/new
- Migrate one panel at a time
- Maintain backward compatibility

### Performance Considerations
- Monitor bundle size with CDN imports
- Use React production builds in production
- Implement code splitting where possible
- Profile before and after migration

### Rollback Plan
- Tag releases before each major migration
- Keep vanilla JS code in separate branch
- Document any breaking changes
- Test rollback procedures

## Success Metrics
- [ ] Reduced code complexity (target: 40% less UI code)
- [ ] Improved render performance (target: 60% faster updates)
- [ ] Better developer experience (easier to add new features)
- [ ] Maintained feature parity with vanilla JS version
- [ ] No regressions in undo/redo system
- [ ] Preserved real-time synchronization

## Notes
- Prioritize most complex/frequently updated UI first
- Keep Change classes and core systems unchanged
- Focus on UI layer only - no business logic changes
- Document React patterns for team consistency