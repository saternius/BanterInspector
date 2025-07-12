# Unity Scene Inspector - Usage Guide

## Getting Started

### Prerequisites
1. Unity with BanterScript library loaded
2. Modern web browser (Chrome, Firefox, Safari, Edge)
3. JavaScript enabled

### Loading the Inspector
1. Open `inspector/index.html` in your browser
2. The inspector will attempt to connect to Unity via BS library
3. If no Unity connection, mock data will be loaded

## User Interface Overview

### Layout
```
┌─────────────────┬──────────────────────┬─────────────────┐
│                 │                      │                 │
│   Hierarchy     │     Properties       │  Space Props    │
│     Panel       │       Panel          │     Panel       │
│                 │                      │                 │
│  - Search       │  - Slot Info         │  - Public       │
│  - Tree View    │  - Components        │  - Protected    │
│  - Actions      │  - Add Component     │                 │
│                 │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
```

## Hierarchy Panel

### Viewing the Scene
- **Tree Structure**: Shows parent-child relationships
- **Expand/Collapse**: Click arrows to show/hide children
- **Icons**: Visual indicators for slot state
  - Yellow text: Selected slot
  - Orange text: Non-persistent slot
  - Gray/italic: Inactive slot

### Searching
1. Type in the search box
2. Searches slot names and component types
3. Tree automatically filters to show matches

### Selecting Slots
- Click any slot to select it
- Selected slot shows in properties panel
- Yellow highlight indicates selection

### Adding Slots
1. Select parent slot (or none for root)
2. Click "Add Child" button
3. New slot created with default name
4. Edit name in properties panel

### Deleting Slots
1. Select slot to delete
2. Click "Delete" button
3. Confirm deletion
4. Slot and all children removed

## Properties Panel

### Slot Properties
- **Name**: Click to edit inline
- **Active**: Toggle slot visibility
- **Persistent**: Toggle persistence flag

### Component Properties

#### Boolean Properties
- Checkbox input
- Click to toggle

#### Number Properties
- Number input field
- Type or use arrows
- Supports decimals

#### Vector3 Properties
- Three inputs for X, Y, Z
- Tab between fields
- Auto-updates on change

#### Color Properties
- Visual color preview
- Click preview for picker
- RGBA sliders
- Values 0-1 range

#### String Properties
- Text input field
- Multi-line for long text

### Adding Components
1. Click "Add Component" button
2. Browse categories or search
3. Click component to add
4. Component appears in list

## Space Properties Panel

### Viewing Properties
- **Public**: Visible to all users
- **Protected**: Admin-only properties
- Count badge shows total

### Adding Properties
1. Enter key name
2. Enter value (auto-detects type)
3. Click "Add" or press Enter

### Editing Properties
1. Click edit button (pencil icon)
2. Modify value
3. Click save (checkmark) or press Enter
4. Press Escape to cancel

### Deleting Properties
1. Click delete button (X icon)
2. Confirm deletion

### Value Types
- **String**: `"hello"`
- **Number**: `42` or `3.14`
- **Boolean**: `true` or `false`
- **JSON**: `{"x": 1, "y": 2}`
- **Vector3**: `{"x": 0, "y": 0, "z": 0}`

## Component Menu

### Opening Menu
- Click "Add Component" on selected slot
- Modal overlay appears

### Finding Components
1. Browse by category:
   - Physics
   - Rendering
   - Media
   - Interaction
   - Loading

2. Or search by name/description

### Adding Components
- Click component to add
- Some components are unique (one per slot)
- Component added with defaults

## Keyboard Shortcuts

| Shortcut | Action |
|----------|---------|
| Ctrl/Cmd + F | Focus search |
| Delete | Delete selected slot |
| Ctrl/Cmd + N | Add new child slot |
| Escape | Close dialogs |
| Enter | Confirm edits |
| Tab | Next field |

## Working with Unity

### Connection Status
- Automatic connection on load
- Falls back to mock data if unavailable
- Check console for connection status

### Real-time Updates
- Changes apply immediately to Unity
- Debounced for performance
- Bi-directional sync

### Component Types

#### Transform
- Position, rotation, scale
- Always present on slots

#### Physics
- **BanterRigidbody**: Physics simulation
- **Colliders**: Box, Sphere, Capsule, Mesh

#### Rendering
- **BanterGeometry**: 3D shapes
- **BanterMaterial**: Surface appearance
- **BanterText**: 3D text

#### Media
- **BanterAudioSource**: Sounds
- **BanterVideoPlayer**: Videos
- **BanterBrowser**: Web content

#### Interaction
- **BanterGrabHandle**: Make grabbable
- **BanterSyncedObject**: Network sync
- **BanterAttachedObject**: Attach to users

## Tips and Tricks

### Performance
- Use search to find slots quickly
- Collapse unused sections
- Batch similar edits

### Organization
- Use descriptive slot names
- Group related objects
- Keep hierarchy shallow

### Debugging
- Check browser console for errors
- Verify Unity connection
- Use mock data for testing

## Common Tasks

### Creating Interactive Objects
1. Add new slot
2. Add BanterGeometry component
3. Add BanterMaterial for appearance
4. Add BanterGrabHandle for interaction
5. Add BanterRigidbody for physics

### Setting Up UI Text
1. Create slot at desired position
2. Add BanterText component
3. Set text and styling
4. Add BanterBillboard to face camera

### Making Synced Objects
1. Add BanterSyncedObject component
2. Enable position/rotation sync
3. Set ownership options

### Creating Triggers
1. Add collider component
2. Set isTrigger to true
3. Handle trigger events in code

## Troubleshooting

### Inspector Won't Load
- Check browser console
- Verify file paths
- Ensure JavaScript enabled

### Can't Connect to Unity
- Verify BS library loaded
- Check Unity is running
- Try refreshing page

### Changes Not Applying
- Check Unity connection
- Verify component compatibility
- Look for console errors

### Slow Performance
- Reduce open tree nodes
- Clear search when not needed
- Close unused panels

## Best Practices

### Naming Conventions
- Use clear, descriptive names
- Avoid special characters
- Follow project standards

### Component Usage
- Add only needed components
- Remove unused components
- Understand component interactions

### Property Management
- Document space properties
- Use consistent naming
- Protect sensitive data