const { LoadItemChange, CreateFolderChange, DeleteItemChange, SaveEntityItemChange, RenameItemChange, RenameFolderChange, RemoveFolderChange, MoveItemDirectoryChange, CreateScriptItemChange, EditScriptItemChange} = await import(`${window.repoUrl}/change-types.js`);
const { showNotification } = await import(`${window.repoUrl}/utils.js`);
// Import new modules
import InventoryFirebase from './inventory-firebase.js';
import InventoryUI from './inventory-ui.js';
import InventoryFileHandler from './inventory-file-handler.js';

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
                const itemName = key.replace('inventory_', '');
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.itemType) {
                        items[itemName] = data;
                    }
                } catch (e) {
                    console.error('Failed to parse inventory item:', key, e);
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
                const folderName = key.replace('inventory_folder_', '');
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data) {
                        folders[folderName] = data;
                    }
                } catch (e) {
                    console.error('Failed to parse folder:', key, e);
                }
            }
        }
        return folders;
    }
    
    /**
     * Remove an item from inventory
     */
    removeItem(itemName) {
        const storageKey = `inventory_${itemName}`;
        localStorage.removeItem(storageKey);
        delete this.items[itemName];
        
        if (this.selectedItem === itemName) {
            this.selectedItem = null;
            this.ui.hidePreview();
        }
        
        this.ui.render();
    }
    
    /**
     * Get available scripts in current folder
     */
    getAvailableScripts() {
        const scripts = [];
        
        // Check current folder
        if (this.currentFolder) {
            Object.entries(this.items).forEach(([name, item]) => {
                if (item.itemType === 'script' && item.folder === this.currentFolder) {
                    scripts.push(name);
                }
            });
        } else {
            // Root level scripts
            Object.entries(this.items).forEach(([name, item]) => {
                if (item.itemType === 'script' && !item.folder) {
                    scripts.push(name);
                }
            });
        }
        
        return scripts;
    }
    
    /**
     * Select an item
     */
    selectItem(itemName) {
        if (this.selectedItem === itemName) {
            this.selectedItem = null;
            this.ui.hidePreview();
        } else {
            this.selectedItem = itemName;
            this.ui.showPreview(itemName);
        }
        this.ui.render();
    }
    
    /**
     * Export selected item as JSON for download
     */
    downloadSelectedItem() {
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
        this.ui.notify(`Exported "${item.name}" as JSON`);
    }
    
    /**
     * Update last used timestamp for an item
     */
    updateLastUsed(itemName) {
        const item = this.items[itemName];
        if (item) {
            item.last_used = Date.now();
            const storageKey = `inventory_${itemName}`;
            localStorage.setItem(storageKey, JSON.stringify(item));
            this.items[itemName] = item;
        }
        this.ui.render();
    }
    
    /**
     * Update item description
     */
    updateItemDescription(itemName, description) {
        const item = this.items[itemName];
        if (item) {
            item.description = description || '';
            const storageKey = `inventory_${itemName}`;
            localStorage.setItem(storageKey, JSON.stringify(item));
            this.items[itemName] = item;
            showNotification(`Description updated for "${itemName}"`);
        }
    }
    
    /**
     * Rename an item
     */
    renameItem(oldName, newName) {
        const item = this.items[oldName];
        if (!item) return;
        
        // Show warning about broken references for entities
        const warningMessage = item.itemType === 'entity' 
            ? `<strong>Warning:</strong> Renaming "${oldName}" to "${newName}" may break existing references in scripts or other entities that depend on this name.<br><br>Any code using <code>SM.findEntityByName("${oldName}")</code> or similar references will need to be updated.<br><br>Do you want to continue?`
            : `<strong>Warning:</strong> Renaming "${oldName}" to "${newName}" may affect other items that reference this script.<br><br>Do you want to continue?`;
        
        this.ui.showRenameWarningModal(
            warningMessage,
            () => {
                // User confirmed, now check for naming conflicts
                if (this.items[newName] && newName !== oldName) {
                    this.ui.showConfirmModal(
                        `An item named "${newName}" already exists. Do you want to overwrite it?`,
                        () => {
                            // Delete the existing item
                            const existingStorageKey = `inventory_${newName}`;
                            localStorage.removeItem(existingStorageKey);
                            delete this.items[newName];
                            
                            // Proceed with rename
                            this.finalizeRename(oldName, newName);
                        },
                        'Overwrite Item'
                    );
                } else {
                    // No conflict, proceed with rename
                    this.finalizeRename(oldName, newName);
                }
            },
            () => {
                // User cancelled, restore original name in the UI
                const editableName = this.previewPane.querySelector('.editable-name');
                if (editableName) {
                    editableName.textContent = oldName;
                }
            }
        );
    }
    
    /**
     * Finalize rename operation
     */
    finalizeRename(oldName, newName) {
        const item = this.items[oldName];
        if (!item) return;
        
        // For scripts, ensure .js extension
        if (item.itemType === 'script' && !newName.endsWith('.js')) {
            newName = newName + '.js';
        }
        
        // Update item name
        item.name = newName;
        
        // Remove old storage key
        const oldStorageKey = `inventory_${oldName}`;
        localStorage.removeItem(oldStorageKey);
        
        // Save with new key
        const newStorageKey = `inventory_${newName}`;
        localStorage.setItem(newStorageKey, JSON.stringify(item));
        
        // Update items object
        delete this.items[oldName];
        this.items[newName] = item;
        
        // Update selected item reference
        if (this.selectedItem === oldName) {
            this.selectedItem = newName;
        }
        
        // If this is a script, update any open script editor tabs
        if (item.itemType === 'script' && window.inspector && window.inspector.scriptEditors) {
            // Find and update the script editor with the old name
            for (const [key, editor] of window.inspector.scriptEditors) {
                if (editor.currentScript.name === oldName) {
                    // Update the script editor's internal reference
                    editor.currentScript.name = newName;
                    editor.currentScript.data = item.data;
                    
                    // Update the navigation tab text
                    if (editor.navElement) {
                        // Store the old close button handler before updating innerHTML
                        const oldCloseBtn = editor.navElement.querySelector('.close-tab-btn');
                        
                        editor.navElement.innerHTML = `
                            <span class="nav-icon">📜</span>
                            ${newName}
                            <span class="close-tab-btn" data-close-script="${editor.pageId}">×</span>
                        `;
                        
                        // Re-attach close button handler
                        const newCloseBtn = editor.navElement.querySelector('.close-tab-btn');
                        if (newCloseBtn && editor.closeBtnHandler) {
                            newCloseBtn.addEventListener('click', editor.closeBtnHandler);
                        }
                    }
                    
                    // Update the editor page title
                    const editorTitle = document.querySelector(`#${editor.pageId}-page .editor-title h2`);
                    if (editorTitle) {
                        editorTitle.textContent = `Editing: ${newName}`;
                    }
                    
                    // Update the scriptEditors map key
                    window.inspector.scriptEditors.delete(key);
                    window.inspector.scriptEditors.set(newName, editor);
                    
                    // Update localStorage for opened editors
                    localStorage.setItem(`openedEditors`, Array.from(window.inspector.scriptEditors.keys()).join(","));
                    
                    break;
                }
            }
        }
        
        // Re-render and show updated preview
        this.ui.render();
        this.ui.showPreview(newName);
        showNotification(`Renamed "${oldName}" to "${newName}"`);
    }
    
    /**
     * Load entity to scene by name
     */
    async loadEntityToSceneByName(itemName) {
        // Update last_used timestamp
        this.updateLastUsed(itemName);
        let change = new LoadItemChange(itemName, SM.selectedEntity, null, {source: 'ui'})
        await changeManager.applyChange(change);
        showNotification(`Adding "${itemName}" to scene..`);
    }
    
    /**
     * Load by command
     */
    async loadByCMD(itemName) {
        let data = localStorage.getItem("inventory_"+itemName)
        if(!data){
            console.log(" NO ITEM NAMED:  ", itemName)
            return;
        }
        let item = JSON.parse(data)
        console.log(item.history, item.history.length)
        for(let i=0; i<item.history.length; i++){
            let h = item.history[i]
            let command = ""
            Object.entries(h).forEach(([k,v])=>{
                if(k === "options"){
                    return
                }
                if(typeof(v) === "object"){
                    command += JSON.stringify(v)+" "
                }else{
                    command += v + " "
                }
            })
            command = command.trim()
            console.log(i, command)
            await RunCommand(command)
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
        this.ui.showScriptNameModal();
    }
    
    /**
     * Finalize script creation
     */
    async finalizeScriptCreation(finalName) {
        // Default script template
        let change = new CreateScriptItemChange(finalName, {source: 'ui'});
        changeManager.applyChange(change);

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
            description: '',  // Initialize with empty description
            data: content
        };
        
        // Only add folder property if we're in a folder
        if (this.currentFolder) {
            scriptItem.folder = this.currentFolder;
        }
        
        // Save to localStorage
        const storageKey = `inventory_${fileName}`;
        localStorage.setItem(storageKey, JSON.stringify(scriptItem));
        
        // Update local items
        this.items[fileName] = scriptItem;
        
        // Re-render
        this.ui.render();

        // Sync to Firebase if in remote location
        if (this.firebase.isItemInRemoteLocation()) {
            this.firebase.syncToFirebase(scriptItem);
        }
        
        // Show success message
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
        showNotification(`Imported "${itemName}" to inventory`);
        this.ui.render();
    }
    
    
    /**
     * Create new folder
     */
    createNewFolder() {
        this.ui.showFolderNameModal((folderName) => {
            if (!folderName || folderName.trim() === '') return;
     
            if (!this.firebase.isValidFirebasePath(folderName)) {
                showNotification('Folder name cannot contain: . $ # [ ] / or be empty');
                return;
            }
            
            const sanitizedName = this.firebase.sanitizeFirebasePath(folderName);
            let change = new CreateFolderChange(sanitizedName, this.currentFolder, {source: 'ui'});
            changeManager.applyChange(change);
            
            // Re-render
            this.ui.render();
            
            showNotification(`Created folder "${sanitizedName}"`);
        });
    }
    
    /**
     * Open folder
     */
    openFolder(folderName) {
        this.updateFolderLastUsed(folderName);
        this.currentFolder = folderName;
        this.selectedItem = null;
        this.ui.hidePreview();
        this.ui.render();
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
        this.selectedItem = null;
        this.ui.hidePreview();
        this.ui.render();
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
        let outcome = await changeManager.applyChange(change);
        if(!outcome) return;
        this.ui.render();
        if (folderName) {
            showNotification(`Moved "${itemName}" to folder "${this.folders[folderName].name}"`);
        } else {
            showNotification(`Moved "${itemName}" to root`);
        }
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
        changeManager.applyChange(change);
        this.ui.render();
        showNotification(`Removed folder "${folder.name}"`);
    }
    
    /**
     * Get current folder path
     */
    getCurrentFolderPath() {
        if (!this.currentFolder) return null;
        return this.currentFolder;
    }
    
    /**
     * Get item count in folder
     */
    getItemCountInFolder(folderKey) {
        let count = 0;
        
        // Count direct items
        Object.values(this.items).forEach(item => {
            if (item.folder === folderKey) count++;
        });
        
        // Count items in subfolders
        Object.entries(this.folders).forEach(([key, folder]) => {
            if (folder.parent === folderKey) {
                count += this.getItemCountInFolder(key);
            }
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
                    const aTime = a.last_used || a.created || 0;
                    const bTime = b.last_used || b.created || 0;
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