# Inventory.js Refactoring Plan

## Overview
The `inventory.js` file has grown to 3,245 lines, making it difficult to maintain and understand. This refactoring plan breaks it into logical, focused modules that follow the Single Responsibility Principle.

## Current Issues
- **File Size**: 3,245 lines is too large for effective maintenance
- **Mixed Concerns**: UI rendering, data management, Firebase operations, and file handling are all in one class
- **Testing Difficulty**: Large monolithic class is hard to unit test
- **Code Duplication**: Similar patterns repeated across different item types
- **Tight Coupling**: All functionality tightly coupled within single class

## Final File Structure

```
frontend/js/pages/inventory/
├── inventory.js                    # Main orchestrator class (~300 lines)
├── modules/
│   ├── core/
│   │   ├── storage-manager.js      # LocalStorage operations
│   │   ├── inventory-constants.js  # Shared constants & config
│   │   └── notification-manager.js # User notification system   //COMMENT: I made a importable notification system in frontend/utils.showNotification that should replace this
│   ├── sync/
│   │   └── firebase-sync.js        # Firebase/remote storage operations
│   ├── ui/
│   │   ├── inventory-renderer.js   # Main UI rendering        //COMMENT: Consolidate all the UI functions into 1 file
│   │   ├── preview-manager.js      # Preview pane management  //COMMENT: Consolidate all the UI functions into 1 file
│   │   └── drag-drop-handler.js    # Drag & drop operations   //COMMENT: Consolidafte all the UI functions into 1 file
│   ├── operations/
│   │   ├── item-operations.js      # Item CRUD operations
│   │   ├── folder-operations.js    # Folder management
│   │   ├── script-manager.js       # Script-specific operations
│   │   └── entity-loader.js        # Entity loading to scene
│   ├── handlers/
│   │   └── file-handler.js         # File upload & processing
│   └── utils/
│       └── sorting-utils.js        # Sorting utilities
└── styles/
    └── inventory.css                # Inventory-specific styles (if extracted) //We dont need this since all styles are handled in a global css on frontend/
```

## Proposed Module Structure

### Core Module: `inventory.js` (~300 lines)
**Purpose**: Main orchestrator that coordinates between modules
```javascript
// Main class that ties everything together
class Inventory {
    constructor()
    init()
    destroy()
    // Delegation methods to sub-modules
}
```

### 1. Storage Module: `storage-manager.js` (~400 lines)
**Purpose**: Handle all localStorage and data persistence
- `loadItems()`
- `loadFolders()`
- `saveItem(itemName, data)`
- `saveFolder(folderName, data)`
- `removeItem(itemName)`
- `removeFolder(folderName)`
- `getItemKey(itemName)`
- `getFolderKey(folderName)`
- `clearAll()`
- `exportData()`
- `importData()`

### 2. Firebase Module: `firebase-sync.js` (~600 lines)
**Purpose**: Handle all Firebase/remote storage operations
- `setupFirebaseListeners()`
- `clearFirebaseListeners()`
- `setupFolderListener(folderName, folder)`
- `setupRootListener()`
- `handleFirebaseItemAdded(snapshot, folderName)`
- `handleFirebaseItemRemoved(snapshot, folderName)`
- `handleFirebaseItemChanged(snapshot, folderName)`
- `syncToFirebase(inventoryItem)`
- `uploadToFirebase(contents, userName)`
- `importFromFirebase(firebaseRef)`
- `importFolderContents(data, parentFolderName, firebaseRef)`
- `makeRemote()`
- `checkRemoteStatus()`
- `copyFirebaseRef()`
- `uploadImageToFirebase(file)`
- `sanitizeFirebasePath(path)`
- `getCurrentFirebasePath()`

### 3. UI Renderer Module: `inventory-renderer.js` (~500 lines)
**Purpose**: Handle all UI rendering and DOM manipulation
- `render()`
- `renderBreadcrumb()`
- `renderFoldersAndItems()`
- `renderFolder(key, folder)`
- `renderFolderContents(folderKey)`
- `renderItem(key, item)`
- `renderEmptyState()`
- `updateSortIndicators()`
- `highlightSelectedItem()`
- `updateItemCounts()`

### 4. Preview Module: `preview-manager.js` (~400 lines)
**Purpose**: Handle preview pane generation and management
- `showPreview(itemName)`
- `hidePreview()`
- `generatePreviewContent(item)`
- `generateEntityPreview(item)`
- `generateScriptPreview(item)`
- `generateImagePreview(item)`
- `updatePreviewDescription(itemName, description)`
- `renderComponentTree(entity, level)`
- `setupPreviewEventListeners()`

### 5. File Handler Module: `file-handler.js` (~350 lines)
**Purpose**: Handle file uploads and processing
- `handleFileUpload(event)`
- `readFile(file)`
- `handleScriptUpload(fileName, content)`
- `handleJsonUpload(fileName, content)`
- `handleImageUpload(file)`
- `processEntityData(data)`
- `isInventoryEntityFormat(data)`
- `validateFileType(file)`
- `generateUniqueFileName(baseName)`

### 6. Drag & Drop Module: `drag-drop-handler.js` (~200 lines)
**Purpose**: Handle all drag and drop operations
- `setupDropZone()`
- `handleDragEnter(e)`
- `handleDragOver(e)`
- `handleDragLeave(e)`
- `handleDrop(e)`
- `handleItemDrag(itemElement)`
- `handleFolderDrop(folderElement)`
- `moveItemToFolder(itemName, folderName)`

### 7. Item Operations Module: `item-operations.js` (~400 lines)
**Purpose**: CRUD operations for items
- `createItem(itemData)`
- `deleteItem(itemName)`
- `renameItem(oldName, newName)`
- `duplicateItem(itemName)`
- `moveItem(itemName, targetFolder)`
- `updateItemDescription(itemName, description)`
- `getItemByName(itemName)`
- `getItemsInFolder(folderName)`
- `searchItems(query)`

### 8. Folder Operations Module: `folder-operations.js` (~300 lines)
**Purpose**: Folder management operations
- `createFolder(folderName, parentFolder)`
- `deleteFolder(folderName)`
- `renameFolder(oldName, newName)`
- `moveFolder(folderName, targetParent)`
- `toggleFolder(folderName)`
- `getItemCountInFolder(folderKey)`
- `getFolderHierarchy()`
- `getFolderPath(folderName)`

### 9. Script Manager Module: `script-manager.js` (~250 lines)
**Purpose**: Script-specific operations
- `createNewScript()`
- `editScript(scriptName)`
- `saveScriptItem(fileName, content)`
- `openScriptEditor(scriptName)`
- `getAvailableScripts()`
- `validateScriptSyntax(content)`
- `updateScriptInEditors(scriptName, content)`

### 10. Entity Loader Module: `entity-loader.js` (~300 lines)
**Purpose**: Handle loading entities to scene
- `loadEntityToSceneByName(itemName)`
- `loadByCMD(itemName)`
- `instantiateEntity(entityData, parent, prefix)`
- `buildEntityHierarchy(entity, parent)`
- `applyComponentData(entity, components)`
- `resolveAssetReferences(data)`

### 11. Sorting Module: `sorting-utils.js` (~100 lines)
**Purpose**: Item sorting utilities
- `sortItems(items, sortBy, direction)`
- `sortByAlphabetical(items)`
- `sortByDate(items)`
- `sortByLastUsed(items)`
- `sortByType(items)`
- `applySortDirection(items, direction)`

### 12. Notification Module: `notification-manager.js` (~50 lines)
**Purpose**: User notification system
- `showNotification(message, type)`
- `showError(message)`
- `showSuccess(message)`
- `showWarning(message)`
- `clearNotifications()`

### 13. Constants Module: `inventory-constants.js` (~50 lines)
**Purpose**: Shared constants and configuration
```javascript
export const STORAGE_KEYS = {
    ITEM_PREFIX: 'inventory_',
    FOLDER_PREFIX: 'inventory_folder_',
    // ...
}

export const ITEM_TYPES = {
    ENTITY: 'entity',
    SCRIPT: 'script',
    IMAGE: 'image'
}

export const SORT_OPTIONS = {
    ALPHABETICAL: 'alphabetical',
    DATE: 'date',
    LAST_USED: 'last_used'
}
```

## Import Structure Example

### Main inventory.js imports:
```javascript
// Core modules
import StorageManager from './modules/core/storage-manager.js';
import { STORAGE_KEYS, ITEM_TYPES, SORT_OPTIONS } from './modules/core/inventory-constants.js';
import NotificationManager from './modules/core/notification-manager.js';

// Sync modules
import FirebaseSync from './modules/sync/firebase-sync.js';

// UI modules
import InventoryRenderer from './modules/ui/inventory-renderer.js';
import PreviewManager from './modules/ui/preview-manager.js';
import DragDropHandler from './modules/ui/drag-drop-handler.js';

// Operation modules
import ItemOperations from './modules/operations/item-operations.js';
import FolderOperations from './modules/operations/folder-operations.js';
import ScriptManager from './modules/operations/script-manager.js';
import EntityLoader from './modules/operations/entity-loader.js';

// Handler modules
import FileHandler from './modules/handlers/file-handler.js';

// Utility modules
import SortingUtils from './modules/utils/sorting-utils.js';
```

## Implementation Strategy

### Phase 1: Setup Infrastructure (Week 1)
1. Create new module files with basic structure
2. Set up module exports/imports
3. Create inventory-constants.js with shared constants
4. Update main inventory.js to import modules

### Phase 2: Extract Non-UI Logic (Week 2)
1. Move storage operations to storage-manager.js
2. Move Firebase operations to firebase-sync.js
3. Move file handling to file-handler.js
4. Move sorting utilities to sorting-utils.js
5. Test each extraction thoroughly

### Phase 3: Extract UI Components (Week 3)
1. Move rendering logic to inventory-renderer.js
2. Move preview logic to preview-manager.js
3. Move drag-drop logic to drag-drop-handler.js
4. Move notifications to notification-manager.js

### Phase 4: Extract Business Logic (Week 4)
1. Move item operations to item-operations.js
2. Move folder operations to folder-operations.js
3. Move script operations to script-manager.js
4. Move entity loading to entity-loader.js

### Phase 5: Refactor & Optimize (Week 5)
1. Remove duplicated code
2. Optimize module interfaces
3. Add JSDoc comments
4. Create unit tests for each module
5. Update documentation

## Benefits of This Refactoring

### Maintainability
- Each module has a single, clear responsibility
- Easier to locate and fix bugs
- Simplified code navigation

### Testability
- Each module can be unit tested independently
- Mocking dependencies becomes straightforward
- Better test coverage possible

### Reusability
- Modules can be reused in other parts of the application
- Firebase sync could be used for other features
- Preview system could be extended for other content types

### Performance
- Lazy loading of modules when needed
- Smaller initial bundle size
- Better tree-shaking opportunities

### Developer Experience
- Clear separation of concerns
- Easier onboarding for new developers
- Parallel development possible on different modules

## Migration Path

### Step 1: Create Module Skeleton
Create all new module files with basic exports, maintaining backward compatibility.

### Step 2: Gradual Migration
Move functionality one module at a time, testing after each migration.

### Step 3: Update Imports
Update all references to use new module structure.

### Step 4: Deprecate Old Code
Remove migrated code from original file.

### Step 5: Integration Testing
Comprehensive testing of all inventory features.

## Risk Mitigation

1. **Version Control**: Create feature branch for refactoring
2. **Testing**: Write tests before refactoring when possible
3. **Incremental Changes**: Small, reviewable PRs for each module
4. **Backward Compatibility**: Maintain API compatibility during transition
5. **Documentation**: Update docs as modules are created

## Success Metrics

- **Code Reduction**: Main inventory.js reduced from 3,245 to ~300 lines
- **Module Size**: No module exceeds 600 lines
- **Test Coverage**: Each module has >80% test coverage
- **Performance**: No degradation in runtime performance
- **Developer Velocity**: Faster feature development post-refactoring

## Next Steps

1. Review and approve this plan
2. Create feature branch: `refactor/inventory-modularization`
3. Begin Phase 1 implementation
4. Schedule weekly review meetings
5. Update progress tracking in project management tool