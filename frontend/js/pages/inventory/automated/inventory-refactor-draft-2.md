# Inventory.js Light-Touch Refactoring Plan (Draft 2)

## Overview
A pragmatic, minimal refactoring of `inventory.js` (3,245 lines) into manageable modules while maintaining existing functionality and minimizing risk.

## Key Principles
- **Minimal disruption**: Keep the main Inventory class largely intact
- **Use existing utilities**: Leverage `frontend/utils/showNotification.js` instead of creating new ones
- **Consolidate related UI**: Group UI rendering functions together
- **Only include existing functions**: No hypothetical or future functions
- **Light-touch approach**: Focus on the most impactful separations

## Proposed File Structure

```
frontend/js/pages/inventory/
├── inventory.js                    # Main Inventory class (~1,500 lines)
├── inventory-firebase.js           # Firebase sync operations (~800 lines)
├── inventory-ui.js                 # All UI rendering & modals (~1,200 lines)
└── inventory-file-handler.js       # File upload/processing (~300 lines)
```

## Module Breakdown

### 1. Main Module: `inventory.js` (~1,500 lines)
Retains core inventory logic and state management:

**Existing Functions to Keep:**
- `constructor()`
- `reload()`
- `loadItems()`
- `loadFolders()`
- `removeItem(itemName)`
- `getAvailableScripts()`
- `selectItem(itemName)`
- `exportSelectedItem()`
- `updateLastUsed(itemName)`
- `updateItemDescription(itemName, description)`
- `renameItem(oldName, newName)`
- `finalizeRename(oldName, newName)`
- `loadEntityToSceneByName(itemName)`
- `loadByCMD(itemName)`
- `openScriptEditor(itemName)`
- `createNewScript()`
- `finalizeScriptCreation(finalName)`
- `saveScriptItem(fileName, content)`
- `saveInventoryItem(itemName, jsonData)`
- `saveImageItem(fileName, imageItem)`
- `createNewFolder()`
- `openFolder(folderName)`
- `updateFolderLastUsed(folderName)`
- `navigateToFolder(folderPath)`
- `toggleFolderExpansion(folderName)`
- `moveItemToFolder(itemName, folderName)`
- `removeFolder(folderName)`
- `finalizeRemoveFolder(folderName, folder)`
- `getCurrentFolderPath()`
- `getItemCountInFolder(folderKey)`
- `sortItems(items, isFolder)`
- `isInventoryEntityFormat(data)`
- `isItemInRemoteLocation()`
- `calculateSize(itemOrFolderName, isFolder)`
- `getCurrentViewContents()`
- `getFolderContentsRecursive(folderName)`

**State Properties:**
- `items`
- `folders`
- `selectedItem`
- `currentFolder`
- `expandedFolders`
- `draggedItem`
- `isRemote`
- `sortBy`
- `sortDirection`

### 2. Firebase Module: `inventory-firebase.js` (~800 lines)
All Firebase/remote storage operations:

**Existing Functions to Move:**
- `setupFirebaseListeners()`
- `setupFolderListener(folderName, folder)`
- `setupRootListener()`
- `handleFirebaseItemAdded(snapshot, folderName)`
- `handleFirebaseItemRemoved(snapshot, folderName)`
- `handleFirebaseItemChanged(snapshot, folderName)`
- `clearFirebaseListeners()`
- `checkRemoteStatus()`
- `copyFirebaseRef()`
- `getCurrentFirebasePath()`
- `syncToFirebase(inventoryItem)`
- `makeRemote()`
- `uploadToFirebase(contents, userName)`
- `importFromFirebase(firebaseRef)`
- `importFolderContents(data, parentFolderName, firebaseRef)`
- `uploadImageToFirebase(file)`
- `sanitizeFirebasePath(str)`
- `isValidFirebasePath(str)`

**State to Manage:**
- `firebaseListeners` Map

### 3. UI Module: `inventory-ui.js` (~1,200 lines)
Consolidates ALL UI rendering, preview, drag-drop, and modal functions:

**Existing Rendering Functions:**
- `render()`
- `renderBreadcrumb()`
- `renderFoldersAndItems()`
- `renderFolder(key, folder)`
- `renderFolderContents(folderKey)`
- `renderItem(key, item)`
- `renderJsonTree(obj, path, level)`

**Preview Functions:**
- `showPreview(itemName)`
- `hidePreview()`
- `generatePreviewContent(item)`

**Drag & Drop Functions:**
- `setupDropZone()`

**Modal Functions:**
- `showNotification(message)` - Will be replaced with `import { showNotification } from '../../utils/showNotification.js'`
- `showScriptNameModal()`
- `showOverwriteModal(fileName, onConfirm)`
- `showRenameModal(originalName, onConfirm)`
- `showFolderNameModal(onConfirm)`
- `showRenameWarningModal(message, onConfirm, onCancel)`
- `showConfirmModal(message, onConfirm, title)`
- `showImportFirebaseModal()`

**Utility Functions:**
- `formatJsonValue(value)`
- `escapeHtml(text)`

### 4. File Handler Module: `inventory-file-handler.js` (~300 lines)
File upload and processing operations:

**Existing Functions to Move:**
- `handleFileUpload(event)`
- `readFile(file)`
- `handleScriptUpload(fileName, content)`
- `handleJsonUpload(fileName, content)`
- `handleImageUpload(file)`

## Implementation Strategy

### Phase 1: Setup (Day 1)
1. Create three new module files with ES6 module exports
2. Import showNotification from existing utils
3. Set up basic module structure with class exports

### Phase 2: Extract Firebase (Day 2-3)
1. Move all Firebase-related methods to `inventory-firebase.js`
2. Create `InventoryFirebase` class that accepts inventory instance
3. Update references in main inventory.js1
4. Test Firebase functionality thoroughly

### Phase 3: Extract UI (Day 4-5)
1. Move all rendering, preview, and modal methods to `inventory-ui.js`
2. Create `InventoryUI` class that accepts inventory instance
3. Replace `showNotification` with imported utility
4. Test all UI interactions

### Phase 4: Extract File Handler (Day 6)
1. Move file handling methods to `inventory-file-handler.js`
2. Create `InventoryFileHandler` class
3. Test file uploads

### Phase 5: Integration & Testing (Day 7)
1. Ensure all modules communicate properly
2. Test all inventory features end-to-end
3. Fix any integration issues

## Example Module Structure

### inventory.js
```javascript
import InventoryFirebase from './inventory-firebase.js';
import InventoryUI from './inventory-ui.js';
import InventoryFileHandler from './inventory-file-handler.js';

export class Inventory {
    constructor() {
        // ... existing initialization
        this.firebase = new InventoryFirebase(this);
        this.ui = new InventoryUI(this);
        this.fileHandler = new InventoryFileHandler(this);
    }
    
    // Core methods remain here
}
```

### inventory-firebase.js
```javascript
export default class InventoryFirebase {
    constructor(inventory) {
        this.inventory = inventory;
        this.firebaseListeners = new Map();
    }
    
    setupFirebaseListeners() {
        // ... existing implementation
    }
    
    // ... other firebase methods
}
```

### inventory-ui.js
```javascript
import { showNotification } from '../../utils/showNotification.js';

export default class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
    }
    
    render() {
        // ... existing implementation
    }
    
    // ... other UI methods
}
```

## Benefits of This Approach

### Immediate Wins
- **Manageable file sizes**: No file exceeds 1,500 lines
- **Clear separation**: Firebase, UI, and file handling are clearly separated
- **Minimal risk**: Main inventory logic stays intact
- **Uses existing utilities**: Leverages existing showNotification

### Maintainability
- Easier to locate specific functionality
- UI changes don't affect business logic
- Firebase operations isolated from core logic

### Future Flexibility
- Can further modularize if needed
- Sets foundation for unit testing
- Easier to swap Firebase for another backend

## Risk Mitigation

1. **Incremental approach**: One module at a time
2. **Preserve API**: No external interfaces change
3. **Maintain state**: Core state remains in main class
4. **Test continuously**: Test after each extraction
5. **Easy rollback**: Can revert module by module

## Success Criteria

- All existing functionality works unchanged
- File sizes: 
  - inventory.js: ~1,500 lines (from 3,245)
  - inventory-firebase.js: ~800 lines
  - inventory-ui.js: ~1,200 lines
  - inventory-file-handler.js: ~300 lines
- No performance degradation
- No breaking changes to external interfaces

## What This Doesn't Include

- No new abstractions or patterns
- No hypothetical functions that don't exist
- No separate style files (uses global CSS)
- No excessive modularization
- No changes to how the inventory is instantiated or used

## Next Steps

1. Review and approve this light-touch approach
2. Create feature branch
3. Implement Phase 1 (setup modules)
4. Proceed with incremental extraction
5. Test thoroughly at each phase