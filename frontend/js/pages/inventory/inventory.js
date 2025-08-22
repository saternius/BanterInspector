const { LoadItemChange, CreateFolderChange, DeleteItemChange, SaveEntityItemChange, RenameItemChange, RenameFolderChange, RemoveFolderChange, MoveItemDirectoryChange, CreateScriptItemChange, EditScriptItemChange} = await import(`${window.repoUrl}/change-types.js`);
// Import new modules
const { InventoryFirebase } = await import(`${window.repoUrl}/pages/inventory/inventory-firebase.js`);
const { InventoryUI } = await import(`${window.repoUrl}/pages/inventory/inventory-ui.js`);
const { InventoryFileHandler } = await import(`${window.repoUrl}/pages/inventory/inventory-file-handler.js`);

/**
 * Main Inventory class - orchestrates inventory functionality through specialized modules
 */
export class Inventory {
    constructor() {
        // DOM elements
        this.container = document.getElementById('inventory-page');
        this.previewPane = document.getElementById('previewPane');
        
        // State management
        this.items = this.loadItems();
        this.folders = this.loadFolders();
        this.selectedItem = null;
        this.currentFolder = null;
        
        // Always show preview pane on initialization
        if (this.previewPane) {
            this.previewPane.style.display = 'block';
        }
        
        // Listen for page switches to ensure preview pane is visible
        window.addEventListener('page-switched', (e) => {
            if (e.detail.pageId === 'inventory') {
                // Ensure preview pane is visible when switching to inventory
                if (this.previewPane) {
                    this.previewPane.style.display = 'block';
                }
                // Show empty preview if no item selected
                if (!this.selectedItem) {
                    this.ui.showEmptyPreview();
                }
                this.ui.render();
            }
        });
        this.expandedFolders = new Set();
        this.draggedItem = null;
        this.isRemote = false;
        this.sortBy = 'alphabetical'; // alphabetical, date, last_used
        this.sortDirection = 'asc'; // asc or desc
        
        // Initialize modules
        this.firebase = new InventoryFirebase(this);
        this.ui = new InventoryUI(this);
        this.fileHandler = new InventoryFileHandler(this);
        
        // Setup initial UI
        this.ui.setupDropZone();
        this.ui.render();
        this.ui.showEmptyPreview();
    }
    
    /**
     * Reload inventory
     */
    reload() {
        this.items = this.loadItems();
        this.folders = this.loadFolders();
        this.ui.render();
    }
    
    /**
     * Load items from localStorage
     */
    loadItems() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('inventory_') && !key.startsWith('inventory_folder_')) {
                try {
                    const itemKey = key.replace('inventory_', '');
                    const item = JSON.parse(localStorage.getItem(key));
                    
                    // Migrate script items to have startup and active properties
                    if (item.itemType === 'script') {
                        if (item.startup === undefined) item.startup = false;
                        if (item.active === undefined) item.active = false;
                    }
                    
                    items[itemKey] = item;
                } catch (error) {
                    console.error(`Failed to parse inventory item ${key}:`, error);
                }
            }
        }
        return items;
    }
    
    /**
     * Load folders from localStorage
     */
    loadFolders() {
        const folders = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('inventory_folder_')) {
                try {
                    const folderKey = key.replace('inventory_folder_', '');
                    folders[folderKey] = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.error(`Failed to parse folder ${key}:`, error);
                }
            }
        }
        return folders;
    }
    
    /**
     * Remove an item from inventory
     */
    removeItem(itemName) {
        this.ui.showConfirmModal(
            `Are you sure you want to remove "${itemName}" from your inventory?`,
            () => {
                let change = new DeleteItemChange(itemName, {source: 'ui'});
                changeManager.applyChange(change);
                this.ui.render();
                showNotification(`Removed "${itemName}" from inventory`);
            },
            'Remove Item'
        );
    }


    syncItem(itemName, item){
        this.items[itemName] = item;
        item.last_used = Date.now();
        const storageKey = `inventory_${itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(item));
        if (this.firebase.isItemInRemoteLocation(item)) {
            this.firebase.syncToFirebase(item);
        }
        this.ui.render();
    }
    
    /**
     * Get available scripts in current folder
     */
    getAvailableScripts() {
        return Object.values(this.items).filter(item => item.itemType === 'script');
    }

    
    /**
     * Select an item
     */
    selectItem(itemName) {
        if (this.selectedItem === itemName) {
            // Deselect if clicking the same item
            this.selectedItem = null;
            this.ui.showEmptyPreview();
        } else {
            this.selectedItem = itemName;
            this.ui.showPreview(itemName);
        }
        this.ui.render();
    }
    
    /**
     * Export selected item as JSON
     */
    exportSelectedItem() {
        if (!this.selectedItem) return;
        
        const item = this.items[this.selectedItem];
        if (!item) return;
        
        // Create a blob with the JSON data
        const jsonStr = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.name}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        // Show notification
        showNotification(`Exported "${item.name}" as JSON`);
    }
    
    /**
     * Update last used timestamp for an item
     */
    updateLastUsed(itemName) {
        const item = this.items[itemName];
        if (item) {
            item.lastUsed = Date.now();
        }
    }
    

    /**
     * Load entity to scene by name
     */
    async loadEntityToSceneByName(itemName) {
        this.updateLastUsed(itemName);
        let change = new LoadItemChange(itemName, SM.selectedEntity, null, {source: 'ui'});
        await window.changeManager.applyChange(change);
    }
    
    /**
     * Load by command
     */
    async loadByCMD(itemName) {
        let data = localStorage.getItem("inventory_" + itemName);
        if (!data) {
            log("inventory", "NO ITEM NAMED: ", itemName);
            return;
        }
        let item = JSON.parse(data);
        if (!item.history || !item.history.length) {
            log("inventory", "Item has no history");
            return;
        }
        
        for (let i = 0; i < item.history.length; i++) {
            let h = item.history[i];
            let command = "";
            Object.entries(h).forEach(([k, v]) => {
                if (k === "options") {
                    return;
                }
                if (typeof(v) === "object") {
                    command += JSON.stringify(v) + " ";
                } else {
                    command += v + " ";
                }
            });
            command = command.trim();
            if (window.RunCommand) {
                await window.RunCommand(command);
            }
        }
    }
    
    /**
     * Open script editor
     */
    openScriptEditor(itemName) {
        const item = this.items[itemName];
        if (!item || item.itemType !== 'script') return;
        
        // Update last_used timestamp
        this.updateLastUsed(itemName);
        
        // Create a custom event to open the script editor
        const event = new CustomEvent('open-script-editor', {
            detail: {
                name: itemName,
                content: item.data,
                author: item.author,
                created: item.created
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Create new script
     */
    async createNewScript() {
        // Show modal for script name input
        this.ui.showScriptNameModal();
    }
    
    
    /**
     * Finalize script creation
     */
    async finalizeScriptCreation(finalName) {
        let change = new CreateScriptItemChange(finalName, {source: 'ui'});
        window.changeManager.applyChange(change);

        this.ui.render();
        showNotification(`Created new script "${finalName}"`);
        this.openScriptEditor(finalName);
    }
    
    /**
     * Save script item
     */
    saveScriptFromUpload(fileName, content) {
        // Create script item
        const now = Date.now();
        const scriptItem = {
            author: SM.scene?.localUser?.name || 'Unknown',
            name: fileName,
            created: now,
            last_used: now,
            itemType: 'script',
            icon:"📜",
            description: '',
            data: content,
            startup: false,  // Script runs on scene startup
            active: false    // Script is active even without being attached to GameObject
        };
        
        // Only add folder property if we're in a folder
        if (this.currentFolder) {
            scriptItem.folder = this.currentFolder;
        }

        this.syncItem(fileName, scriptItem);
        showNotification(`Added script "${fileName}" to inventory`);
    }
    
    /**
     * Save inventory item
     */
    saveItemFromUpload(itemName, jsonData) {
        // Add folder property if we're in a folder
        if (this.currentFolder && !jsonData.folder) {
            jsonData.folder = this.currentFolder;
        }
        
        // Save to localStorage
        const storageKey = `inventory_${itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(jsonData));
        
        // Update local items
        this.items[itemName] = jsonData;
        
        // Sync to Firebase if in remote location
        if (this.firebase.isItemInRemoteLocation()) {
            this.firebase.syncToFirebase(jsonData);
        }
        
        // Select the imported item
        this.selectItem(itemName);
        
        // Show success message
        this.ui.notify(`Imported "${itemName}" to inventory`);
    }
    
    /**
     * Save image item
     */
    saveImageItem(fileName, imageItem) {
        // Only add folder property if we're in a folder
        if (this.currentFolder) {
            imageItem.folder = this.currentFolder;
        }
        
        // Save to localStorage
        const storageKey = `inventory_${fileName}`;
        localStorage.setItem(storageKey, JSON.stringify(imageItem));
        
        // Update items cache
        this.items[fileName] = imageItem;
        
        // Sync to Firebase if in remote location
        if (this.firebase.isItemInRemoteLocation()) {
            this.firebase.syncToFirebase(imageItem);
        }
        
        // Show success notification
        this.ui.notify(`Image "${fileName}" added to inventory`);
        
        // Re-render
        this.ui.render();
    }
    
    /**
     * Create new folder
     */
    createNewFolder() {
        this.ui.showFolderNameModal(async (folderName) => {
            if (!folderName || folderName.trim() === '') return;
            
            // Validate folder name for Firebase compliance
            if (!this.firebase.isValidFirebasePath(folderName)) {
                this.ui.notify('Folder name cannot contain: . $ # [ ] / or be empty');
                return;
            }
            
            // Sanitize the folder name
            const sanitizedName = this.firebase.sanitizeFirebasePath(folderName);
            
            let change = new CreateFolderChange(sanitizedName, this.currentFolder, {source: 'ui'});
            window.changeManager.applyChange(change);
            
            // Re-render
            this.ui.render();
            
            this.ui.notify(`Created folder "${sanitizedName}"`);
        });
    }
    
    /**
     * Open folder
     */
    openFolder(folderName) {
        this.currentFolder = folderName;
        // Don't deselect item when navigating folders
        // this.selectedItem = null;
        // this.ui.showEmptyPreview();
        this.updateFolderLastUsed(folderName);
        this.ui.render();
        // Re-show preview if item was selected
        if (this.selectedItem) {
            this.ui.showPreview(this.selectedItem);
        }
    }
    
    /**
     * Update folder last used timestamp
     */
    updateFolderLastUsed(folderName) {
        const folder = this.folders[folderName];
        if (folder) {
            folder.lastUsed = Date.now();
            const storageKey = `inventory_folder_${folderName}`;
            localStorage.setItem(storageKey, JSON.stringify(folder));
        }
    }
    
    /**
     * Navigate to folder path
     */
    navigateToFolder(folderPath) {
        // Handle empty string, '/', or falsy values as root navigation
        if (!folderPath || folderPath === '/' || folderPath === '') {
            this.currentFolder = null;
        } else {
            this.currentFolder = folderPath;
        }
        // Don't deselect item when navigating folders
        // this.selectedItem = null;
        // this.ui.showEmptyPreview();
        this.ui.render();
        // Re-show preview if item was selected
        if (this.selectedItem) {
            this.ui.showPreview(this.selectedItem);
        }
    }
    
    /**
     * Toggle folder expansion
     */
    toggleFolderExpansion(folderName) {
        if (this.expandedFolders.has(folderName)) {
            this.expandedFolders.delete(folderName);
        } else {
            this.expandedFolders.add(folderName);
        }
        this.ui.render();
    }
    
    /**
     * Move item to folder
     */
    async moveItemToFolder(itemName, folderName) {
        let change = new MoveItemDirectoryChange(itemName, folderName, {source: 'ui'});
        let outcome = await window.changeManager.applyChange(change);
        if (!outcome) return;
        
        this.ui.render();
        if (folderName) {
            this.ui.notify(`Moved "${itemName}" to folder "${folderName}"`);
        } else {
            this.ui.notify(`Moved "${itemName}" to root`);
        }
    }
    
    /**
     * Move folder to another folder
     */
    async moveFolderToFolder(sourceFolderName, targetFolderName) {
        const sourceFolder = this.folders[sourceFolderName];
        if (!sourceFolder) return;
        
        // Prevent moving a folder into itself or its descendants
        if (sourceFolderName === targetFolderName) return;
        
        // Check if target is a descendant of source
        if (targetFolderName && this.isFolderDescendant(targetFolderName, sourceFolderName)) {
            this.ui.notify(`Cannot move folder into its own subfolder`);
            return;
        }
        
        // Update the folder's parent
        sourceFolder.parent = targetFolderName || null;
        this.folders[sourceFolderName] = sourceFolder;
        
        // // Save to localStorage
        // this.saveToLocalStorage();
        
        // // Sync with Firebase if enabled
        // await this.firebase.syncFolder(sourceFolderName, sourceFolder);
        
        this.ui.render();
        if (targetFolderName) {
            showNotification(`Moved folder "${sourceFolder.name}" to "${this.folders[targetFolderName].name}"`);
        } else {
            showNotification(`Moved folder "${sourceFolder.name}" to root`);
        }
    }
    
    /**
     * Check if a folder is a descendant of another folder
     */
    isFolderDescendant(childFolderName, parentFolderName) {
        let current = this.folders[childFolderName];
        while (current && current.parent) {
            if (current.parent === parentFolderName) {
                return true;
            }
            current = this.folders[current.parent];
        }
        return false;
    }
    
    /**
     * Remove folder
     */
    removeFolder(folderName) {
        const folder = this.folders[folderName];
        if (!folder) return;
        
        // Check if folder has items or subfolders
        const hasItems = Object.values(this.items).some(item => item.folder === folderName);
        const hasSubfolders = Object.values(this.folders).some(f => f.parent === folderName);
        
        if (hasItems || hasSubfolders) {
            this.ui.showConfirmModal(
                `Folder "${folder.name}" contains ${hasItems ? 'items' : 'subfolders'}. All contents will be permanently deleted. Are you sure?`,
                () => {
                    this.finalizeRemoveFolder(folderName, folder);
                },
                'Delete Folder'
            );
            return;
        }
        
        // Empty folder, remove directly
        this.finalizeRemoveFolder(folderName, folder);
    }
    
    /**
     * Finalize remove folder
     */
    async finalizeRemoveFolder(folderName, folder) {
        let change = new RemoveFolderChange(folderName, {source: 'ui'});
        window.changeManager.applyChange(change);
        this.ui.render();
        this.ui.notify(`Removed folder "${folder.name}"`);
    }
    
    /**
     * Get current folder path
     */
    getCurrentFolderPath() {
        if (!this.currentFolder) return '/';
        
        const parts = [];
        let current = this.currentFolder;
        
        while (current) {
            parts.unshift(current);
            const folder = this.folders[current];
            current = folder?.parent;
        }
        
        return '/' + parts.join('/');
    }
    
    /**
     * Get item count in folder
     */
    getItemCountInFolder(folderKey) {
        let count = 0;
        
        // Count items
        Object.values(this.items).forEach(item => {
            if (item.folder === folderKey) count++;
        });
        
        // Count subfolders
        Object.values(this.folders).forEach(folder => {
            if (folder.parent === folderKey) count++;
        });
        
        return count;
    }
    
    /**
     * Sort items
     */
    sortItems(items, isFolder = false) {
        const sorted = [...items].sort((a, b) => {
            let compareValue = 0;
            
            switch (this.sortBy) {
                case 'alphabetical':
                    compareValue = (a.name || a.key).localeCompare(b.name || b.key);
                    break;
                case 'date':
                    compareValue = (a.created || 0) - (b.created || 0);
                    break;
                case 'last_used':
                    // If no last_used, fall back to created date
                    const aTime = a.last_used || a.lastUsed || a.created || 0;
                    const bTime = b.last_used || b.lastUsed || b.created || 0;
                    compareValue = aTime - bTime;
                    break;
            }
            
            // Apply sort direction
            return this.sortDirection === 'asc' ? compareValue : -compareValue;
        });
        
        return sorted;
    }
    
    /**
     * Check if data is inventory entity format
     */
    isInventoryEntityFormat(data) {
        return this.fileHandler.isInventoryEntityFormat(data);
    }
    
    /**
     * Check if item is in remote location
     */
    isItemInRemoteLocation() {
        return this.firebase.isItemInRemoteLocation();
    }
    
    /**
     * Calculate size of item or folder
     */
    calculateSize(itemOrFolderName, isFolder = false) {
        let totalSize = 0;
        
        if (isFolder) {
            // Calculate size of all items in this folder
            Object.entries(this.items).forEach(([key, item]) => {
                if (item.folder === itemOrFolderName) {
                    const itemData = JSON.stringify(item);
                    totalSize += new Blob([itemData]).size;
                }
            });
            
            // Calculate size of all subfolders
            Object.entries(this.folders).forEach(([key, folder]) => {
                if (folder.parent === itemOrFolderName) {
                    totalSize += this.calculateSize(key, true);
                }
            });
        } else {
            // Calculate size of single item
            const item = this.items[itemOrFolderName];
            if (item) {
                const itemData = JSON.stringify(item);
                totalSize = new Blob([itemData]).size;
            }
        }
        
        return totalSize;
    }
    
    /**
     * Get current view contents
     */
    getCurrentViewContents() {
        const contents = {
            folders: {},
            items: {}
        };
        
        // Get folders in current location
        Object.entries(this.folders).forEach(([key, folder]) => {
            if (folder.parent === this.currentFolder) {
                contents.folders[key] = folder;
            }
        });
        
        // Get items in current location
        Object.entries(this.items).forEach(([key, item]) => {
            if (item.folder === this.currentFolder) {
                contents.items[key] = item;
            }
        });
        
        return contents;
    }
    
    /**
     * Get folder contents recursively
     */
    getFolderContentsRecursive(folderName) {
        const contents = {
            items: {},
            folders: {}
        };
        
        // Get all items in this folder
        Object.entries(this.items).forEach(([key, item]) => {
            if (item.folder === folderName) {
                contents.items[key] = item;
            }
        });
        
        // Get all subfolders and their contents
        Object.entries(this.folders).forEach(([key, folder]) => {
            if (folder.parent === folderName) {
                contents.folders[key] = folder;
                // Recursively get subfolder contents
                const subContents = this.getFolderContentsRecursive(key);
                Object.assign(contents.items, subContents.items);
                Object.assign(contents.folders, subContents.folders);
            }
        });
        
        return contents;
    }
}