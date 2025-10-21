const { LoadItemChange, CreateFolderChange, DeleteItemChange, SaveEntityItemChange, RenameItemChange, RenameFolderChange, RemoveFolderChange, MoveItemDirectoryChange, CreateScriptItemChange, EditScriptItemChange} = await import(`${window.repoUrl}/change-types.js`);
const {emojiCategories} = await import(`${window.repoUrl}/pages/inventory/emoji_categories.js`);
/**
 * InventoryUI - Handles all UI rendering, preview, drag-drop, and modal functions
 */
export class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.container = inventory.container;
        this.previewPane = inventory.previewPane;
        this.containerEventListenerAdded = false;

    }

    /**
     * Main render function
     */
    async render() {
        // Check remote status
        await this.inventory.firebase.checkRemoteStatus();
        const inventoryContainer = this.container.querySelector('.inventory-container');
        
        // Show empty preview if no item is selected
        if (!this.inventory.selectedItem && this.previewPane) {
            this.showEmptyPreview();
        }
        
        if (Object.keys(this.inventory.items).length === 0 && Object.keys(this.inventory.folders).length === 0) {
            this.renderEmptyState(inventoryContainer);    
            return;
        }
        
        const totalItems = Object.keys(this.inventory.items).length;
        const folderPath = this.inventory.getCurrentFolderPath();
        let makeRemoteBtn = this.renderMakeRemoteBtn();
        inventoryContainer.innerHTML = `
            <div class="inventory-header">
                <h2>${folderPath ? `📁 ${folderPath}` : `Saved Items (${totalItems})`}</h2>
                <div class="inventory-sorting">
                    <select id="sortDropdown" class="sort-dropdown">
                        <option value="alphabetical" ${this.inventory.sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
                        <option value="date" ${this.inventory.sortBy === 'date' ? 'selected' : ''}>Creation Date</option>
                        <option value="last_used" ${this.inventory.sortBy === 'last_used' ? 'selected' : ''}>Last Used</option>
                    </select>
                    <button id="sortDirectionBtn" class="sort-direction-btn" title="${this.inventory.sortDirection === 'asc' ? 'Ascending' : 'Descending'}">
                        ${this.inventory.sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
                <div class="inventory-actions">
                    ${this.inventory.selectedItem ? `
                        <button class="export-button" id="exportBtn">
                            <span class="export-icon">⬆️</span>
                            Export
                        </button>
                    ` : ''}
                    <button class="new-folder-button" id="newFolderBtn">
                        <span class="folder-icon">📁</span>
                        New Folder
                    </button>
                    <button class="new-script-button" id="newScriptBtn">
                        <span class="new-icon">📜</span>
                        New Script
                    </button>
                    <button class="upload-button" id="uploadFileBtn">
                        <span class="upload-icon">⬇️</span>
                        Import
                    </button>
                    <button class="import-firebase-button" id="importFirebaseBtn" title="Import from Firebase">
                        <span class="import-firebase-icon">☁️⬇️</span>
                        Import Remote
                    </button>
                    ${makeRemoteBtn}
                    <input type="file" id="fileInput" accept=".js,.md,.json,.png,.jpg,.jpeg,.bmp,.gif" style="display: none;">
                </div>
            </div>
            ${this.inventory.currentFolder ? `
                <div class="folder-breadcrumb">
                    <span class="breadcrumb-item" data-folder="">Home</span>
                    ${this.renderBreadcrumb()}
                </div>
            ` : ''}
            <div class="inventory-grid">
                ${this.renderFoldersAndItems()}
            </div>
        `;
        
        
        // Add event listeners
        this.attachEventListeners(inventoryContainer);
    }

    trailName(name){
        if(name.length > 15){
            return name.slice(0, 14) + "...";
        }
        return name;
    }

    renderMakeRemoteBtn(){
        if(!this.inventory.currentFolder){
            return ``;
        }

        if(this.inventory.isRemote){
            return `<button class="make-remote-button remote-status" id="remoteStatusBtn" disabled>
                <span class="remote-icon">☁️</span>
                Remote
            </button>
            <button class="force-sync-button" id="forceSyncBtn" title="Force sync all items to Firebase">
                <span class="sync-icon">🔄</span>
                Force Sync
            </button>
            <button class="link-button" id="copyLinkBtn" title="Copy Firebase path">
                <span class="link-icon">🔗</span>
            </button>`
        }

        return `
            <button class="make-remote-button" id="makeRemoteBtn">
                <span class="remote-icon">☁️</span>
                Make Remote
            </button>
        `
    }



    renderEmptyState(inventoryContainer) {
            inventoryContainer.innerHTML = `
            <div class="inventory-header">
                <h2>Saved Items (0)</h2>
                <div class="inventory-sorting">
                    <select id="sortDropdown" class="sort-dropdown">
                        <option value="alphabetical" ${this.inventory.sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
                        <option value="date" ${this.inventory.sortBy === 'date' ? 'selected' : ''}>Creation Date</option>
                        <option value="last_used" ${this.inventory.sortBy === 'last_used' ? 'selected' : ''}>Last Used</option>
                    </select>
                    <button id="sortDirectionBtn" class="sort-direction-btn" title="${this.inventory.sortDirection === 'asc' ? 'Ascending' : 'Descending'}">
                        ${this.inventory.sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
                <div class="inventory-actions">
                    <button class="upload-button" id="uploadFileBtn">
                        <span class="upload-icon">⬇️</span>
                        Import
                    </button>
                    <input type="file" id="fileInput" accept=".js,.md,.json,.png,.jpg,.jpeg,.bmp,.gif" style="display: none;">
                </div>
            </div>
            <div class="inventory-empty">
                <div class="empty-icon">📦</div>
                <h3>Your inventory is empty</h3>
                <p>Drag entities from the World Inspector or upload files to save them here</p>
            </div>
        `;
        
        // Add event listeners for file upload even in empty state
        const uploadBtn = inventoryContainer.querySelector('#uploadFileBtn');
        const fileInput = inventoryContainer.querySelector('#fileInput');
        const sortDropdown = inventoryContainer.querySelector('#sortDropdown');
        const newFolderBtn = inventoryContainer.querySelector('#newFolderBtn');
        const sortDirectionBtn = inventoryContainer.querySelector('#sortDirectionBtn');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('mousedown', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.inventory.fileHandler.handleFileUpload(e));
        }

        if (newFolderBtn) {
            newFolderBtn.addEventListener('mousedown', () => this.createNewFolder());
        }
        
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.inventory.sortBy = e.target.value;
                this.render();
            });
        }
        
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('mousedown', () => {
                this.inventory.sortDirection = this.inventory.sortDirection === 'asc' ? 'desc' : 'asc';
                this.render();
            });
        }
    }

    /**
     * Attach event listeners to rendered elements
     */
    attachEventListeners(container) {
        // Sort controls
        const sortDropdown = container.querySelector('#sortDropdown');
        const sortDirectionBtn = container.querySelector('#sortDirectionBtn');
        const inventoryContainer = this.container.querySelector('.inventory-container');

        // Add click handler to inventory container for deselecting items - only once
        if (!this.containerEventListenerAdded && inventoryContainer) {
            this.containerEventListenerAdded = true;
            inventoryContainer.addEventListener('mousedown', (e) => {
                // Check if click is on empty space (not on items, folders, or buttons)
                const clickedOnItem = e.target.closest('.inventory-item');
                const clickedOnFolder = e.target.closest('.folder-item');
                const clickedOnButton = e.target.closest('button');
                const clickedOnInput = e.target.closest('input, select');
                const clickedOnBreadcrumb = e.target.closest('.folder-breadcrumb');
                const clickedOnPreviewPane = e.target.closest('.inventory-preview-pane')
                // Removed debug log that was firing multiple times
                if (!clickedOnItem && !clickedOnFolder && !clickedOnButton && !clickedOnInput && !clickedOnBreadcrumb && !clickedOnPreviewPane) {
                    // Clicked on empty space - deselect item
                    if (this.inventory.selectedItem) {
                        this.inventory.selectedItem = null;
                        this.showEmptyPreview();
                        this.render();
                    }
                }
            });
        }

        
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.inventory.sortBy = e.target.value;
                this.render();
            });
        }
        
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('mousedown', () => {
                this.inventory.sortDirection = this.inventory.sortDirection === 'asc' ? 'desc' : 'asc';
                this.render();
            });
        }
        
        // Breadcrumb navigation
        inventoryContainer.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('mousedown', () => {
                const folder = item.dataset.folder;
                this.inventory.navigateToFolder(folder);
            });
        });

        // Folder operations
        
        // Add event listeners for inventory items
        inventoryContainer.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                if (!e.target.closest('.remove-item-btn') && !e.target.closest('.action-btn')) {
                    this.inventory.selectItem(item.dataset.itemName);
                }
            });
        });
        
        // Add event listeners for remove buttons
        inventoryContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.removeItem(itemName);
            });
        });
        
        // Add event listeners for remove folder buttons
        inventoryContainer.querySelectorAll('.remove-folder-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.inventory.removeFolder(folderName);
            });
        });
        
        // Add event listeners for edit script buttons
        inventoryContainer.querySelectorAll('.edit-script-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                const item = this.inventory.items[itemName];
                if (item && item.itemType === 'markdown') {
                    this.inventory.openMarkdownEditor(itemName);
                } else {
                    this.inventory.openScriptEditor(itemName);
                }
            });
        });
        
        // Add event listeners for add to scene buttons
        inventoryContainer.querySelectorAll('.add-to-scene-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.loadEntityToSceneByName(itemName);
            });
        });
        
        // Add event listeners for view image buttons
        inventoryContainer.querySelectorAll('.view-image-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.selectItem(itemName);
            });
        });
        
        // Add event listeners for copy URL buttons
        inventoryContainer.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                const item = this.inventory.items[itemName];
                if (item && item.itemType === 'image' && item.data.url) {
                    navigator.clipboard.writeText(item.data.url).then(() => {
                        showNotification('Image URL copied to clipboard');
                    }).catch(err => {
                        console.error('Failed to copy URL:', err);
                        showNotification('Failed to copy URL');
                    });
                }
            });
        });
        
        // Add event listeners for import folderRef buttons
        inventoryContainer.querySelectorAll('.import-folderref-btn').forEach(btn => {
            btn.addEventListener('mousedown', async (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                const folderRef = this.inventory.items[itemName];
                
                if (folderRef && folderRef.itemType === 'folderRef' && folderRef.importedFrom) {
                    btn.disabled = true;
                    btn.textContent = '⏳';
                    
                    try {
                        // Import the actual folder from Firebase
                        const success = await this.inventory.firebase.importFromFirebase(
                            folderRef.importedFrom,
                            folderRef.folder // Import into the same parent folder
                        );
                        
                        if (success) {
                            // Remove the folderRef item now that it's been imported
                            delete this.inventory.items[itemName];
                            localStorage.removeItem(`inventory_${itemName}`);
                            
                            // Re-render
                            this.render();
                            showNotification(`Imported folder "${folderRef.name}"`);
                        } else {
                            btn.disabled = false;
                            btn.textContent = '📥';
                            showNotification('Failed to import folder');
                        }
                    } catch (error) {
                        console.error('Error importing folderRef:', error);
                        btn.disabled = false;
                        btn.textContent = '📥';
                        showNotification('Error importing folder');
                    }
                }
            });
        });
        
        // Add event listeners for file upload
        const uploadBtn = inventoryContainer.querySelector('#uploadFileBtn');
        const fileInput = inventoryContainer.querySelector('#fileInput');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('mousedown', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.inventory.fileHandler.handleFileUpload(e));
        }
        
        // Add event listener for export button
        const exportBtn = inventoryContainer.querySelector('#exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('mousedown', () => this.inventory.downloadSelectedItem());
        }
        
        // Add event listener for new script button
        const newScriptBtn = inventoryContainer.querySelector('#newScriptBtn');
        if (newScriptBtn) {
            newScriptBtn.addEventListener('mousedown', () => this.inventory.createNewScript());
        }
        
        // Add event listener for new folder button
        const newFolderBtn = inventoryContainer.querySelector('#newFolderBtn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('mousedown', () => this.inventory.createNewFolder());
        }
        
        // Add event listener for make remote button
        const makeRemoteBtn = inventoryContainer.querySelector('#makeRemoteBtn');
        if (makeRemoteBtn) {
            makeRemoteBtn.addEventListener('mousedown', () => this.inventory.firebase.makeRemote());
        }
        
        // Add event listener for copy link button
        const copyLinkBtn = inventoryContainer.querySelector('#copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('mousedown', () => this.inventory.firebase.copyFirebaseRef());
        }

        // Add event listener for force sync button
        const forceSyncBtn = inventoryContainer.querySelector('#forceSyncBtn');
        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('mousedown', () => this.inventory.firebase.forceSyncAll());
        }

        // Add event listener for import from Firebase button
        const importFirebaseBtn = inventoryContainer.querySelector('#importFirebaseBtn');
        if (importFirebaseBtn) {
            importFirebaseBtn.addEventListener('mousedown', () => this.showImportFirebaseModal());
        }
        
        // Add event listeners for folder items
        inventoryContainer.querySelectorAll('.folder-item').forEach(folder => {
            const folderName = folder.dataset.folderName;
            
            // Add drag handlers for the folder itself
            folder.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                this.draggedFolder = folderName;
                e.dataTransfer.setData('text/inventory-folder', folderName);
                e.dataTransfer.effectAllowed = 'move';
                folder.classList.add('dragging');
            });
            
            folder.addEventListener('dragend', (e) => {
                e.stopPropagation();
                folder.classList.remove('dragging');
                this.draggedFolder = null;
            });
            
            // Only add click handler to the folder header, not the entire folder
            const folderHeader = folder.querySelector('.folder-header');
            if (folderHeader) {
                folderHeader.addEventListener('mousedown', (e) => {
                    if (!e.target.closest('.folder-expand-btn') && !e.target.closest('.remove-folder-btn')) {
                        const folderName = folder.dataset.folderName;
                        this.inventory.openFolder(folderName);
                    }
                });
            }
            
            // Setup drag and drop for folders - only on the header to avoid conflicts
            if (folderHeader) {
                folderHeader.addEventListener('dragover', (e) => {
                    // Accept both items and folders (but not a folder into itself)
                    if ((this.draggedItem || this.draggedFolder) && this.draggedFolder !== folderName) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        folder.classList.add('drag-over');
                    }
                });
                
                folderHeader.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    folder.classList.remove('drag-over');
                });
                
                folderHeader.addEventListener('drop', async(e) => {
                    if ((this.draggedItem || this.draggedFolder) && this.draggedFolder !== folderName) {
                        e.preventDefault();
                        e.stopPropagation();
                        folder.classList.remove('drag-over');
                        
                        // Check if we're dropping an item or a folder
                        const itemName = e.dataTransfer.getData('text/inventory-item');
                        const draggedFolderName = e.dataTransfer.getData('text/inventory-folder');
                        
                        if (itemName) {
                            await this.inventory.moveItemToFolder(itemName, folderName);
                        } else if (draggedFolderName) {
                            await this.inventory.moveFolderToFolder(draggedFolderName, folderName);
                        }
                    }
                });
            }
            
            // Folder contents drops are handled by the main grid drop zone
            // to ensure consistent behavior when dragging items out of folders
        });
        
        // Add event listeners for expand/collapse buttons
        inventoryContainer.querySelectorAll('.folder-expand-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.inventory.toggleFolderExpansion(folderName);
            });
        });
        
        // Make inventory items draggable (including items in expanded folders)
        inventoryContainer.querySelectorAll('.inventory-item').forEach(item => {
            // The draggable attribute is already set in the HTML
            item.addEventListener('dragstart', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.draggedItem = item.dataset.itemName;
                e.dataTransfer.setData('text/inventory-item', this.draggedItem);
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                item.classList.remove('dragging');
                this.draggedItem = null;
            });
        });
        
      
        
        // Add drop zone for inventory grid to move items to root or current folder
        const inventoryGrid = inventoryContainer.querySelector('.inventory-grid');
        if (inventoryGrid) {
            inventoryGrid.addEventListener('dragover', (e) => {
                // Handle internal drags (both items and folders)
                if (this.draggedItem || this.draggedFolder) {
                    const isOverFolderHeader = e.target.closest('.folder-header');
                    const isOverSameFolder = this.draggedFolder && e.target.closest(`.folder-item[data-folder-name="${this.draggedFolder}"]`);
                    
                    // Always prevent default to allow dropping, unless over a folder header or same folder
                    if (!isOverFolderHeader && !isOverSameFolder) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        inventoryGrid.classList.add('drag-over-grid');
                    } else {
                        inventoryGrid.classList.remove('drag-over-grid');
                    }
                }
            });
            
            inventoryGrid.addEventListener('dragleave', (e) => {
                // Only remove class if we're leaving the grid entirely
                if (!inventoryGrid.contains(e.relatedTarget)) {
                    inventoryGrid.classList.remove('drag-over-grid');
                }
            });
            
            inventoryGrid.addEventListener('drop', async (e) => {
                inventoryGrid.classList.remove('drag-over-grid');
                
                // Handle drops anywhere except on folder headers
                if (this.draggedItem || this.draggedFolder) {
                    const isOverFolderHeader = e.target.closest('.folder-header');
                    const isOverSameFolder = this.draggedFolder && e.target.closest(`.folder-item[data-folder-name="${this.draggedFolder}"]`);
                    
                    if (!isOverFolderHeader && !isOverSameFolder) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const itemName = e.dataTransfer.getData('text/inventory-item');
                        const folderName = e.dataTransfer.getData('text/inventory-folder');
                        
                        if (itemName) {
                            // Move item to current folder (or root if no current folder)
                            await this.inventory.moveItemToFolder(itemName, this.inventory.currentFolder);
                        } else if (folderName) {
                            // Move folder to current folder (or root if no current folder)
                            await this.inventory.moveFolderToFolder(folderName, this.inventory.currentFolder);
                        }
                    }
                }
            });
        }
    }

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb() {
        if (!this.inventory.currentFolder) return '';
        const parts = this.inventory.currentFolder.split('/');
        let path = '';
        return parts.map((part, index) => {
            path += (index > 0 ? '/' : '') + part;
            return `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item" data-folder="${path}">${part}</span>`;
        }).join('');
    }

    /**
     * Render folders and items
     */
    renderFoldersAndItems() {
        const foldersHtml = [];
        const itemsHtml = [];
        
        // Get folders in current directory
        let foldersArray = Object.entries(this.inventory.folders)
            .filter(([key, folder]) => folder.parent === this.inventory.currentFolder)
            .map(([key, folder]) => ({key, ...folder}));
        
        // Sort folders
        foldersArray = this.inventory.sortItems(foldersArray, true);
        
        // Render sorted folders
        foldersArray.forEach(folder => {
            foldersHtml.push(this.renderFolder(folder.key, folder));
        });
        
        // Get items in current directory
        let itemsArray = Object.entries(this.inventory.items)
            .filter(([key, item]) => (item.folder || null) === this.inventory.currentFolder)
            .map(([key, item]) => ({key, ...item}));
        
        // Sort items
        itemsArray = this.inventory.sortItems(itemsArray, false);
        
        // Render sorted items
        itemsArray.forEach(item => {
            itemsHtml.push(this.renderItem(item.key, item));
        });
        
        return foldersHtml.join('') + itemsHtml.join('');
    }

    /**
     * Render a single folder
     */
    renderFolder(key, folder) {
        const itemCount = this.inventory.getItemCountInFolder(key);
        const isExpanded = this.inventory.expandedFolders.has(key);
        // <span class="folder-count">${itemCount} items</span>
        return `
            <div class="folder-item" data-folder-name="${key}" draggable="true">
                <div class="folder-header">
                    <button class="folder-expand-btn" data-folder-name="${key}">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                    <span class="folder-icon">📁</span>
                    <h3 class="folder-name">${this.trailName(folder.name)}</h3>
                    <button class="remove-folder-btn" data-folder-name="${key}">×</button>
                </div>
                ${isExpanded ? `
                    <div class="folder-contents">
                        ${this.renderFolderContents(key)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render folder contents
     */
    renderFolderContents(folderKey) {
        const items = [];
        const subfolders = [];
        
        // Get subfolders
        Object.entries(this.inventory.folders).forEach(([key, folder]) => {
            if (folder.parent === folderKey) {
                subfolders.push(this.renderFolder(key, folder));
            }
        });
        
        // Get items
        Object.entries(this.inventory.items).forEach(([key, item]) => {
            if (item.folder === folderKey) {
                items.push(this.renderItem(key, item, true)); // Pass true to indicate item is in folder
            }
        });
        
        if (subfolders.length === 0 && items.length === 0) {
            return '<div class="folder-empty">Empty folder</div>';
        }
        
        return subfolders.join('') + items.join('');
    }

    /**
     * Render a single item
     */
    renderItem(key, item, isInFolder = false) {
        const dateStr = new Date(item.created).toLocaleDateString();
        const itemType = item.itemType || 'entity';
        // Use item's custom icon if available, otherwise use defaults
        const itemIcon = item.icon || (itemType === 'script' ? '📜' : itemType === 'markdown' ? '📝' : itemType === 'image' ? '🖼️' : '📦');
        const isSelected = this.inventory.selectedItem === key;
        
        


        // Different actions based on item type
        let itemActions = '';
        if (itemType === 'folderRef') {
            // Special handling for folder references
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn import-folderref-btn" data-item-name="${key}" title="Import this folder">
                        📥
                    </button>
                </div>
            `;
        } else if (itemType === 'script' || itemType === 'markdown') {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn edit-script-btn" data-item-name="${key}">
                        ✏️
                    </button>
                </div>
            `;
        } else if (itemType === 'image') {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn copy-url-btn" data-item-name="${key}">
                        📋
                    </button>
                </div>
            `;
        } else {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn add-to-scene-btn" data-item-name="${key}">
                        ➕
                    </button>
                </div>
            `;
        }
        
        // Add draggable attribute - items are draggable whether in folder or not
        const draggableAttr = 'draggable="true"';
        
        return `
        <div class="inventory-item ${isSelected ? 'selected' : ''}" data-item-name="${key}" ${draggableAttr}>
            <div class="item-header">
                <div class="item-title">
                    <span class="item-type-icon" title="${itemType}">${itemIcon}</span>
                    <h3 class="item-name">${this.trailName(item.name)}</h3>
                </div>
                ${itemActions}
                <button class="remove-item-btn" data-item-name="${key}">×</button>
            </div>
        </div>
    `;
    }

    /**
     * Show preview pane
     */
    showPreview(itemName) {
        const item = this.inventory.items[itemName];
        if (!item || !this.previewPane) return;
        
        // Generate preview content
        const previewContent = this.generatePreviewContent(item, itemName);
        this.previewPane.innerHTML = previewContent;
        this.previewPane.style.display = 'block';
        
        // Add event listeners for preview interactions
        this.attachPreviewEventListeners(itemName, item);
    }

    /**
     * Attach event listeners for preview pane
     */
    attachPreviewEventListeners(itemName, item) {
        // Move here button
        const moveHereBtn = this.previewPane.querySelector('.move-here-btn');
        if (moveHereBtn) {
            moveHereBtn.addEventListener('mousedown', async () => {
                await this.inventory.moveItemToFolder(itemName, this.inventory.currentFolder);
                // Re-show the preview to update the button visibility
                this.showPreview(itemName);
            });
        }
        
        // Close button
        const closeBtn = this.previewPane.querySelector('.preview-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('mousedown', () => {
                this.inventory.selectedItem = null;
                this.showEmptyPreview();
                this.render();
            });
        }
        
        // Icon button
        const iconBtn = this.previewPane.querySelector('.preview-icon-btn');
        if (iconBtn) {
            iconBtn.addEventListener('mousedown', () => {
                this.showEmojiPicker(itemName, item);
            });
        }
        
        // Edit script button
        const editBtn = this.previewPane.querySelector('.edit-script-preview-btn');
        if (editBtn) {
            editBtn.addEventListener('mousedown', () => {
                if (item.itemType === 'markdown') {
                    this.inventory.openMarkdownEditor(itemName);
                } else {
                    this.inventory.openScriptEditor(itemName);
                }
            });
        }
        
        // Copy image URL button
        const copyUrlBtn = this.previewPane.querySelector('.copy-image-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('mousedown', () => {
                const url = copyUrlBtn.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    this.notify('Image URL copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy URL:', err);
                    this.notify('Failed to copy URL');
                });
            });
        }
        
        // Open image button
        const openImageBtn = this.previewPane.querySelector('.open-image-btn');
        if (openImageBtn) {
            openImageBtn.addEventListener('mousedown', () => {
                const url = openImageBtn.dataset.url;
                window.open(url, '_blank');
            });
        }


        
        // Script startup toggle
        const startupToggle = this.previewPane.querySelector('.script-startup-toggle');
        if (startupToggle) {
            startupToggle.addEventListener('change', () => {
                const item = this.inventory.items[itemName];
                if(item){
                    item.startup = startupToggle.checked;
                    this.inventory.syncItem(itemName, item);
                    showNotification(`Updated startup setting for "${itemName}"`);
                    // Re-render preview to show/hide startup sequence dropdown
                    this.showPreview(itemName);
                }
            });
        }

        // Startup sequence dropdown
        const startupSequenceSelect = this.previewPane.querySelector('.script-startup-sequence');
        if (startupSequenceSelect) {
            startupSequenceSelect.addEventListener('change', () => {
                const item = this.inventory.items[itemName];
                if (!item) return;

                const value = startupSequenceSelect.value;
                const afterInput = this.previewPane.querySelector('.script-after-input');

                if (value === 'after') {
                    // Show the input field
                    if (afterInput) {
                        afterInput.style.display = 'inline-block';
                        const scriptName = afterInput.value || 'ScriptName';
                        item.startupSequence = `after:${scriptName}`;
                    }
                } else {
                    // Hide the input field and set the simple value
                    if (afterInput) {
                        afterInput.style.display = 'none';
                    }
                    item.startupSequence = value;
                }

                this.inventory.syncItem(itemName, item);
                showNotification(`Updated startup sequence for "${itemName}"`);
            });
        }

        // After script input field
        const afterInput = this.previewPane.querySelector('.script-after-input');
        if (afterInput) {
            afterInput.addEventListener('input', () => {
                const item = this.inventory.items[itemName];
                if (!item) return;

                const scriptName = afterInput.value || 'ScriptName';
                item.startupSequence = `after:${scriptName}`;
                this.inventory.syncItem(itemName, item);
            });

            afterInput.addEventListener('blur', () => {
                showNotification(`Updated startup sequence for "${itemName}"`);
            });
        }
        
        // Script active toggle
        const activeToggle = this.previewPane.querySelector('.script-active-toggle');
        if (activeToggle) {
            activeToggle.addEventListener('change', () => {
                const item = this.inventory.items[itemName];
                if(item){
                    item.active = activeToggle.checked;
                    this.inventory.syncItem(itemName, item);
                    showNotification(`Updated active setting for "${itemName}"`);
                }
            });
        }

        // Script global toggle
        const globalToggle = this.previewPane.querySelector('.script-global-toggle');
        if (globalToggle) {
            globalToggle.addEventListener('change', () => {
                const item = this.inventory.items[itemName];
                if(item){
                    item.global = globalToggle.checked;
                    this.inventory.syncItem(itemName, item);
                    showNotification(`Updated global setting for "${itemName}"`);
                }
            });
        }

        const autoUpdateToggle = this.previewPane.querySelector('.script-auto-update-toggle');
        if (autoUpdateToggle) {
            autoUpdateToggle.addEventListener('change', () => {
                const item = this.inventory.items[itemName];
                if(item){
                    item.autoUpdate = autoUpdateToggle.checked;
                    this.inventory.syncItem(itemName, item);
                    showNotification(`Updated auto update setting for "${itemName}"`);
                }
            });
        }
        
        
        // Description textarea
        const descriptionTextarea = this.previewPane.querySelector('.description-textarea');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('blur', () => {
                const item = this.inventory.items[itemName];
                if(item){
                    item.description = descriptionTextarea.value;
                    this.inventory.syncItem(itemName, item);
                    showNotification(`Updated description for "${itemName}"`);
                }
            });
            
            descriptionTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    descriptionTextarea.blur();
                }
            });
        }
        
        // Handle import button for folderRef in preview
        const importFolderRefBtn = this.previewPane.querySelector('.import-folderref-preview-btn');
        if (importFolderRefBtn) {
            importFolderRefBtn.addEventListener('click', async () => {
                const folderRef = item;
                if (folderRef && folderRef.itemType === 'folderRef' && folderRef.importedFrom) {
                    importFolderRefBtn.disabled = true;
                    importFolderRefBtn.textContent = '⏳ Importing...';
                    
                    try {
                        const success = await this.inventory.firebase.importFromFirebase(
                            folderRef.importedFrom,
                            folderRef.folder
                        );
                        
                        if (success) {
                            delete this.inventory.items[itemName];
                            localStorage.removeItem(`inventory_${itemName}`);
                            this.render();
                            this.showEmptyPreview();
                            showNotification(`Imported folder "${folderRef.name}"`);
                        } else {
                            importFolderRefBtn.disabled = false;
                            importFolderRefBtn.textContent = '📥 Import Folder';
                            showNotification('Failed to import folder');
                        }
                    } catch (error) {
                        console.error('Error importing folderRef from preview:', error);
                        importFolderRefBtn.disabled = false;
                        importFolderRefBtn.textContent = '📥 Import Folder';
                        showNotification('Error importing folder');
                    }
                }
            });
        }
        
        // Editable name
        const editableName = this.previewPane.querySelector('.editable-name');
        if (editableName) {
            const originalName = itemName;
            
            editableName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    editableName.blur();
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    editableName.textContent = originalName;
                    editableName.blur();
                }
            });
            
            editableName.addEventListener('blur', () => {
                const newName = editableName.textContent.trim();
                if (newName && newName !== originalName) {
                    let change = new RenameItemChange(originalName, newName, {source: 'ui'});
                    changeManager.applyChange(change);
                } else if (!newName) {
                    editableName.textContent = originalName;
                }
            });
            
            editableName.addEventListener('focus', () => {
                const range = document.createRange();
                range.selectNodeContents(editableName);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
        }
    }

    /**
     * Hide preview pane
     */
    hidePreview() {
        if (this.previewPane) {
            this.previewPane.style.display = 'none';
            this.previewPane.innerHTML = '';
        }
    }
    
    /**
     * Show empty preview pane or folder details
     */
    showEmptyPreview() {
        if (!this.previewPane) return;
        
        // If we're in a folder, show folder details
        if (this.inventory.currentFolder) {
            const folder = this.inventory.folders[this.inventory.currentFolder];
            if (folder) {
                this.showFolderDetails(this.inventory.currentFolder, folder);
                return;
            }
        }
        
        // Show root inventory overview
        this.showInventoryOverview();
    }
    
    /**
     * Show inventory overview when at root level with no selection
     */
    showInventoryOverview() {
        if (!this.previewPane) return;
        
        const totalItems = Object.keys(this.inventory.items).length;
        const totalFolders = Object.keys(this.inventory.folders).length;
        
        // Count items by type
        let scripts = 0, entities = 0, images = 0, markdown = 0;
        Object.values(this.inventory.items).forEach(item => {
            switch(item.itemType) {
                case 'script': scripts++; break;
                case 'image': images++; break;
                case 'markdown': markdown++; break;
                default: entities++; break;
            }
        });
        
        // Count remote vs local items
        let remoteItems = 0;
        Object.values(this.inventory.items).forEach(item => {
            if (this.inventory.firebase.isItemInRemoteLocation(item)) {
                remoteItems++;
            }
        });
        
        this.previewPane.innerHTML = `
            <div class="preview-header">
                <div class="preview-title">
                    <span class="preview-icon-btn" style="cursor: default;">📦</span>
                    <h2>Inventory Overview</h2>
                </div>
            </div>
            <div class="preview-meta">
                <div class="meta-item">
                    <span class="meta-label">Total Items:</span>
                    <span class="meta-value">${totalItems}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Total Folders:</span>
                    <span class="meta-value">${totalFolders}</span>
                </div>
            </div>
            <div class="preview-content" style="padding: 20px;">
                <h3>Item Breakdown</h3>
                <div style="margin: 15px 0;">
                    ${entities > 0 ? `<div style="margin: 5px 0;">📦 Entities: ${entities}</div>` : ''}
                    ${scripts > 0 ? `<div style="margin: 5px 0;">📜 Scripts: ${scripts}</div>` : ''}
                    ${images > 0 ? `<div style="margin: 5px 0;">🖼️ Images: ${images}</div>` : ''}
                    ${markdown > 0 ? `<div style="margin: 5px 0;">📝 Markdown: ${markdown}</div>` : ''}
                </div>
                <h3>Storage</h3>
                <div style="margin: 15px 0;">
                    <div style="margin: 5px 0;">💾 Local Items: ${totalItems - remoteItems}</div>
                    ${remoteItems > 0 ? `<div style="margin: 5px 0;">☁️ Remote Items: ${remoteItems}</div>` : ''}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
                    <p style="color: #888; font-size: 0.9em;">Select an item to view its details, or navigate into a folder to see folder information.</p>
                </div>
            </div>
        `;
        this.previewPane.style.display = 'block';
    }
    
    /**
     * Show folder details in preview pane
     */
    showFolderDetails(folderKey, folder) {
        if (!this.previewPane) return;
        
        const itemCount = this.inventory.getItemCountInFolder(folderKey);
        const dateStr = folder.created ? new Date(folder.created).toLocaleString() : 'Unknown';
        const isRemote = folder.remote || false;
        const folderPath = this.inventory.getCurrentFolderPath();
        const description = folder._description || '';
        const isPublic = folder.public || false;
        
        // Count subfolders
        let subfolderCount = 0;
        Object.entries(this.inventory.folders).forEach(([key, subfolder]) => {
            if (subfolder.parent === folderKey) {
                subfolderCount++;
            }
        });
        
        this.previewPane.innerHTML = `
            <div class="preview-header">
                <div class="preview-title">
                    <span class="preview-icon-btn" style="cursor: default;">📁</span>
                    <h2 ${this.inventory.firebase.folderIsMine(folder) ? `contenteditable="true" class="editable-folder-name"` : `class="folder-name-readonly"`} data-folder-key="${folderKey}">${folder.name}</h2>
                </div>
            </div>
            <div class="preview-meta">
                <div class="meta-item">
                    <span class="meta-label">Type:</span>
                    <span class="meta-value">Folder</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Path:</span>
                    <span class="meta-value">${folderPath}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Items:</span>
                    <span class="meta-value">${itemCount}</span>
                </div>
                ${subfolderCount > 0 ? `
                    <div class="meta-item">
                        <span class="meta-label">Subfolders:</span>
                        <span class="meta-value">${subfolderCount}</span>
                    </div>
                ` : ''}
                <div class="meta-item">
                    <span class="meta-label">Storage:</span>
                    <span class="meta-value">${isRemote ? '☁️ Remote' : '💾 Local'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span class="meta-value">${dateStr}</span>
                </div>
            </div>
            ${this.inventory.firebase.folderIsMine(folder) ? `
                <div class="preview-meta">
                    <div class="meta-item" style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="folder-public-checkbox" class="folder-public-checkbox" data-folder-key="${folderKey}" 
                                ${isPublic ? 'checked' : ''} style="cursor: pointer;">
                            <label for="folder-public-checkbox" style="cursor: pointer;">Public Folder</label>
                        </div>
                        <span style="color: #888; font-size: 0.9em;">${isPublic ? 'Contents in this folder are public' : 'Contents in this folder are private'}</span>
                    </div>
                </div>
            ` : ''}
            <div class="preview-meta">
                <div class="meta-label">Description:</div>
                ${this.inventory.firebase.folderIsMine(folder) ? 
                    `<textarea class="description-textarea" data-folder-key="${folderKey}" placeholder="Enter a description for this folder...">${this.escapeHtml(description)}</textarea>` :
                    `<div class="description-readonly" style="padding: 8px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #ccc; min-height: 60px; white-space: pre-wrap;">${this.escapeHtml(description) || '<span style="color: #666;">No description provided</span>'}</div>`
                }
            </div>
            <div class="preview-content" style="padding: 20px;">
                <h3>Folder Information</h3>
                <p style="color: #888; margin: 10px 0;">This folder contains ${itemCount} item${itemCount !== 1 ? 's' : ''} and ${subfolderCount} subfolder${subfolderCount !== 1 ? 's' : ''}.</p>
                ${isRemote ? `
                    <p style="color: #6bb6ff; margin: 10px 0;" onclick="inventory.firebase.copyFirebaseRef()">🔗 Synced</p>
                ` : `
                    <p style="color: #888; margin: 10px 0;">This folder is stored locally.</p>
                `}
            </div>
        `;
        this.previewPane.style.display = 'block';
        
        // Add event listeners for folder renaming
        this.attachFolderPreviewEventListeners(folderKey, folder);
    }
    
    /**
     * Attach event listeners for folder preview
     */
    attachFolderPreviewEventListeners(folderKey, folder) {
        // Only allow editing folder name if user owns it
        if (this.inventory.firebase.folderIsMine(folder)) {
            const editableName = this.previewPane.querySelector('.editable-folder-name');
            if (editableName) {
                const originalName = folder.name;
                
                editableName.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        editableName.blur();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        editableName.textContent = originalName;
                        editableName.blur();
                    }
                });
                
                editableName.addEventListener('blur', () => {
                    const newName = editableName.textContent.trim();
                    if (newName && newName !== originalName) {
                        // Show warning about renaming consequences
                        const isRemote = folder.remote || false;
                        let warningMessage = `<strong>Warning:</strong> Renaming this folder may break existing references and scripts that depend on it.`;
                        
                        if (isRemote) {
                            warningMessage += `<br><br><strong>Important:</strong> This folder is currently synchronized with Firebase. After renaming, it will become a local-only folder and lose its remote connection.`;
                        }
                        
                        warningMessage += `<br><br>Are you sure you want to rename "${originalName}" to "${newName}"?`;
                        
                        this.showWarningConfirm(
                            'Folder Rename Warning',
                            warningMessage,
                            () => {
                                // User confirmed - proceed with rename
                                this.inventory.handleFolderRename(folderKey, newName);
                            },
                            () => {
                                // User cancelled - revert name
                                editableName.textContent = originalName;
                            }
                        );
                    } else if (!newName) {
                        editableName.textContent = originalName;
                    }
                });
                
                editableName.addEventListener('focus', () => {
                    const range = document.createRange();
                    range.selectNodeContents(editableName);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
            }
        }
        
        // Description textarea - only if user owns the folder
        if (this.inventory.firebase.folderIsMine(folder)) {
            const descriptionTextarea = this.previewPane.querySelector('.description-textarea');
            if (descriptionTextarea) {
                descriptionTextarea.addEventListener('blur', () => {
                    const updatedFolder = this.inventory.folders[folderKey];
                    if (updatedFolder) {
                        updatedFolder._description = descriptionTextarea.value;
                        this.inventory.syncFolder(folderKey, updatedFolder);
                        showNotification(`Updated description for folder "${folder.name}"`);
                    }
                });
                
                descriptionTextarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        descriptionTextarea.blur();
                    }
                });
            }
        }
        
        // Public checkbox - only if user owns the folder
        const publicCheckbox = this.previewPane.querySelector('.folder-public-checkbox');
        if (publicCheckbox) {
            publicCheckbox.addEventListener('change', () => {
                const updatedFolder = this.inventory.folders[folderKey];
                if (updatedFolder) {
                    updatedFolder.public = publicCheckbox.checked;
                    this.inventory.syncFolder(folderKey, updatedFolder);
                    
                    // Update the status text
                    const statusText = publicCheckbox.parentElement.parentElement.querySelector('span');
                    if (statusText) {
                        statusText.textContent = publicCheckbox.checked ? 
                            'Contents in this folder are public' : 
                            'Contents in this folder are private';
                    }
                    
                    showNotification(`Folder "${folder.name}" is now ${publicCheckbox.checked ? 'public' : 'private'}`);
                }
            });
        }
    }

    /**
     * Generate preview content for an item
     */
    generatePreviewContent(item, itemName) {
        const dateStr = new Date(item.created).toLocaleString();
        const itemType = item.itemType || 'entity';
        const description = item.description || '';
        
        // Use item's icon or fall back to default based on type
        const displayIcon = item.icon || (itemType === 'script' ? '📜' : itemType === 'image' ? '🖼️' : '📦');
        
        // Check if the item is in a different folder than the current folder
        const itemFolder = item.folder || null;
        const showMoveButton = itemFolder !== this.inventory.currentFolder;
        
        let previewHeader = `<div class="preview-header">
                    ${showMoveButton ? `
                        <button class="move-here-btn" data-item-name="${itemName}">
                            📁 Move
                        </button>
                    ` : ''}
                    <div class="preview-title">
                        <button class="preview-icon-btn" title="Click to change icon">${displayIcon}</button>
                        <h2 contenteditable="true" class="editable-name" data-item-name="${item.name}">${item.name}</h2>
                    </div>
                    <button class="preview-close-btn">×</button>
                </div>`
        
        // Special handling for folderRef items
        if (itemType === 'folderRef') {
            return `
                ${previewHeader}
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Public Folder Reference</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${item.author || 'Unknown'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Source:</span>
                        <span class="meta-value" style="font-size: 0.9em; word-break: break-all;">${item.importedFrom || 'Unknown'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                </div>
                ${item._description ? `
                    <div class="preview-meta">
                        <div class="meta-label">Description:</div>
                        <div class="description-readonly" style="padding: 8px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #ccc; min-height: 60px; white-space: pre-wrap;">
                            ${this.escapeHtml(item._description)}
                        </div>
                    </div>
                ` : ''}
                <div class="preview-content" style="padding: 20px;">
                    <h3>Public Folder</h3>
                    <p style="color: #888; margin: 10px 0;">This is a reference to a public folder shared by ${item.author}.</p>
                    <p style="color: #6bb6ff; margin: 10px 0;">Click the 📥 import button to download this folder to your inventory.</p>
                    <div style="margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 4px;">
                        <button class="import-folderref-preview-btn" data-item-name="${itemName}" style="
                            padding: 10px 20px;
                            background: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            📥 Import Folder
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (itemType === 'image') {
            const size = item.data.size ? (item.data.size / 1024).toFixed(2) + ' KB' : 'Unknown';
            const dimensions = item.data.width && item.data.height ? 
                `${item.data.width}×${item.data.height}` : 'Unknown';
            
            return `
                ${previewHeader}
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Image</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Size:</span>
                        <span class="meta-value">${size}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Dimensions:</span>
                        <span class="meta-value">${dimensions}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${item.author}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Description:</div>
                    <textarea class="description-textarea" data-item-name="${item.name}" placeholder="Enter a description...">${this.escapeHtml(description)}</textarea>
                </div>
                <div class="preview-content">
                    <h3>Image Preview</h3>
                    <div class="image-preview-container" style="text-align: center; margin: 20px 0;">
                        <img src="${item.data.url}" alt="${item.name}" style="max-width: 100%; max-height: 400px; border: 1px solid #333; border-radius: 4px;">
                    </div>
                    <div class="preview-actions">
                        <button class="action-btn copy-image-url-btn" data-url="${item.data.url}">
                            📋 Copy URL
                        </button>
                        <button class="action-btn open-image-btn" data-url="${item.data.url}">
                            🔗 Open in New Tab
                        </button>
                    </div>
                </div>
            `;
        } else if (itemType === 'markdown') {
            const markdownContent = item.data || '';
            
            return `
                ${previewHeader}
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Markdown</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${item.author}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Description:</div>
                    <textarea class="description-textarea" data-item-name="${item.name}" placeholder="Enter a description...">${this.escapeHtml(description)}</textarea>
                </div>
                <div class="preview-content">
                    <h3>Markdown Content</h3>
                    <pre class="script-preview"><code>${this.escapeHtml(item.data)}</code></pre>
                    <div class="preview-actions">
                        <button class="action-btn edit-script-preview-btn" data-item-name="${item.name}">
                            ✏️ Edit Markdown
                        </button>
                    </div>
                </div>
            `;
        } else if (itemType === 'script') {
            const scriptContent = item.data || '';
            const preview = scriptContent.substring(0, 500) + (scriptContent.length > 500 ? '...' : '');
            
            return `
                ${previewHeader}
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Script</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${item.author}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Script Options:</div>
                    <div style="display: flex; gap: 20px; padding: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="script-global-toggle" data-item-name="${item.name}"
                                ${item.global ? 'checked' : ''} style="cursor: pointer;">
                            <span>Global</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="script-startup-toggle" data-item-name="${item.name}"
                                ${item.startup ? 'checked' : ''} style="cursor: pointer;">
                            <span>Startup</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="script-active-toggle" data-item-name="${item.name}"
                                ${item.active ? 'checked' : ''} style="cursor: pointer;">
                            <span>Active</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" class="script-auto-update-toggle" data-item-name="${item.name}"
                                ${item.autoUpdate ? 'checked' : ''} style="cursor: pointer;">
                            <span>Auto</span>
                        </label>
                    </div>
                    ${item.startup ? `
                        <div style="padding: 10px; border-top: 1px solid #333;">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <span>Startup Sequence:</span>
                                <select class="script-startup-sequence" data-item-name="${itemName}" style="background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 4px 8px; border-radius: 4px;">
                                    <option value="onInspectorLoaded" ${(!item.startupSequence || item.startupSequence === 'onInspectorLoaded') ? 'selected' : ''}>onInspectorLoaded</option>
                                    <option value="onSceneLoaded" ${item.startupSequence === 'onSceneLoaded' ? 'selected' : ''}>onSceneLoaded</option>
                                    <option value="after" ${item.startupSequence && item.startupSequence.startsWith('after:') ? 'selected' : ''}>after</option>
                                </select>
                                ${item.startupSequence && item.startupSequence.startsWith('after:') ? `
                                    <input type="text" class="script-after-input" data-item-name="${itemName}"
                                        value="${item.startupSequence.split(':')[1]}"
                                        placeholder="ScriptName"
                                        style="background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 4px 8px; border-radius: 4px; margin-left: 8px;">
                                ` : `
                                    <input type="text" class="script-after-input" data-item-name="${itemName}"
                                        value="ScriptName"
                                        placeholder="ScriptName"
                                        style="background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 4px 8px; border-radius: 4px; margin-left: 8px; display: none;">
                                `}
                            </label>
                        </div>
                    ` : ''}
                    <div style="padding: 5px 10px; font-size: 0.9em; color: #888;">
                        <em>Note: Both startup and active must be enabled for script to run on startup</em>
                        <em>Note: Global requires all other players to have the script in their inventory to run</em>
                    </div>
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Description:</div>
                    <textarea class="description-textarea" data-item-name="${item.name}" placeholder="Enter a description...">${this.escapeHtml(description)}</textarea>
                </div>
                <div class="preview-content">
                    <h3>Script Content</h3>
                    <pre class="script-preview"><code>${this.escapeHtml(item.data)}</code></pre>
                    <div class="preview-actions">
                        <button class="action-btn edit-script-preview-btn" data-item-name="${item.name}">
                            ✏️ Edit Script
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Entity preview
            const componentCount = item.data.components ? item.data.components.length : 0;
            const childCount = item.data.children ? item.data.children.length : 0;
            
            return `
                ${previewHeader}
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Entity</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Author:</span>
                        <span class="meta-value">${item.author}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${dateStr}</span>
                    </div>
                    ${componentCount > 0 ? `
                        <div class="meta-item">
                            <span class="meta-label">Components:</span>
                            <span class="meta-value">${componentCount}</span>
                        </div>
                    ` : ''}
                    ${childCount > 0 ? `
                        <div class="meta-item">
                            <span class="meta-label">Children:</span>
                            <span class="meta-value">${childCount}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Description:</div>
                    <textarea class="description-textarea" data-item-name="${item.name}" placeholder="Enter a description...">${this.escapeHtml(description)}</textarea>
                </div>
                <div class="preview-content">
                    <h3>Entity</h3>
                    <div class="json-tree">
                        ${this.renderJsonTree(item.data)}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Render JSON tree with collapsible nodes
     */
    renderJsonTree(obj, path = '', level = 0) {
        if (obj === null || obj === undefined) {
            return `<span class="json-null">null</span>`;
        }
        
        if (typeof obj !== 'object') {
            return `<span class="json-value">${this.formatJsonValue(obj)}</span>`;
        }
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return `<span class="json-bracket">[]</span>`;
            }
            
            const id = `json-${path}-array`.replace(/[.\[\]]/g, '-');
            return `
                <span class="json-array">
                    <input type="checkbox" id="${id}" class="json-toggle" checked>
                    <label for="${id}" class="json-label">
                        <span class="json-arrow">▼</span>
                        <span class="json-bracket">[</span>
                        <span class="json-preview">${obj.length} items</span>
                    </label>
                    <div class="json-content">
                        ${obj.map((item, index) => `
                            <div class="json-item">
                                <span class="json-key">${index}:</span>
                                ${this.renderJsonTree(item, `${path}[${index}]`, level + 1)}
                            </div>
                        `).join('')}
                    </div>
                    <span class="json-bracket">]</span>
                </span>
            `;
        }
        
        // Object
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return `<span class="json-bracket">{}</span>`;
        }
        
        const id = `json-${path}-object`.replace(/[.\[\]]/g, '-');
        const isExpanded = level < 2; // Expand first two levels by default
        
        return `
            <span class="json-object">
                <input type="checkbox" id="${id}" class="json-toggle" ${isExpanded ? 'checked' : ''}>
                <label for="${id}" class="json-label">
                    <span class="json-arrow">▼</span>
                    <span class="json-bracket">{</span>
                    <span class="json-preview">${keys.length} ${keys.length === 1 ? 'property' : 'properties'}</span>
                </label>
                <div class="json-content">
                    ${keys.map(key => `
                        <div class="json-item">
                            <span class="json-key">"${key}":</span>
                            ${this.renderJsonTree(obj[key], `${path}.${key}`, level + 1)}
                        </div>
                    `).join('')}
                </div>
                <span class="json-bracket">}</span>
            </span>
        `;
    }
    
    /**
     * Format JSON value for display
     */
    formatJsonValue(value) {
        if (typeof value === 'string') {
            return `<span class="json-string">"${this.escapeHtml(value)}"</span>`;
        }
        if (typeof value === 'boolean') {
            return `<span class="json-boolean">${value}</span>`;
        }
        if (typeof value === 'number') {
            return `<span class="json-number">${value}</span>`;
        }
        return String(value);
    }

    /**
     * Setup drop zone for drag and drop
     */
    setupDropZone() {
        // Add click handler to preview pane for deselecting when clicking in empty areas
        if (this.previewPane) {
            this.previewPane.addEventListener('mousedown', (e) => {
                // Only deselect if clicking the preview pane background itself, not content
                if (e.target === this.previewPane || 
                    e.target.classList.contains('preview-content') ||
                    e.target.classList.contains('preview-meta')) {
                    // But not if clicking interactive elements
                    const clickedOnButton = e.target.closest('button');
                    const clickedOnInput = e.target.closest('input, textarea, select');
                    const clickedOnEditable = e.target.closest('[contenteditable]');
                    const clickedOnPreviewPane = e.target.closest('.inventory-preview-pane')
                    log("inventory", "clickedOn [dropZone]", e.target)
                    if (!clickedOnButton && !clickedOnInput && !clickedOnEditable && !clickedOnPreviewPane) {
                        if (this.inventory.selectedItem) {
                            this.inventory.selectedItem = null;
                            this.showEmptyPreview();
                            this.inventory.ui.render();
                        }
                    }
                }
            });
        }
        
        this.container.addEventListener('dragover', (e) => {
            // Only handle external drags (from hierarchy)
            if (!this.inventory.draggedItem) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        });
        
        this.container.addEventListener('dragleave', (e) => {
            if (e.target === this.container) {
            }
        });
        
        this.container.addEventListener('drop', async (e) => {
            // Only handle external drops (from hierarchy)
            if (!this.inventory.draggedItem) {
                e.preventDefault();
                
                const entityId = e.dataTransfer.getData('text/plain');
                let change = new SaveEntityItemChange(entityId, null, null, {source: 'ui'});
                window.changeManager.applyChange(change);
            }
        });
    }

    /**
     * Show script name modal
     */
    showScriptNameModal() {
        const modalOverlay = this.createModalOverlay();
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>Create New File</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <label for="fileTypeSelect">File Type:</label>
                <select id="fileTypeSelect" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #333; background: #1e1e1e; color: #ccc; border-radius: 4px;">
                    <option value="script" selected>JavaScript (.js)</option>
                    <option value="markdown">Markdown (.md)</option>
                </select>
                
                <label for="scriptNameInput">File Name:</label>
                <input type="text" id="scriptNameInput" placeholder="MyScript" autocomplete="off">
                <div class="modal-hint" id="fileHint">Enter a name for your script (e.g., PlayerController)</div>
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-create-btn" id="modalCreateBtn">Create File</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const input = modalContent.querySelector('#scriptNameInput');
        const fileTypeSelect = modalContent.querySelector('#fileTypeSelect');
        const fileHint = modalContent.querySelector('#fileHint');
        const createBtn = modalContent.querySelector('#modalCreateBtn');
        
        // Update hint and button text based on file type
        fileTypeSelect.addEventListener('change', () => {
            if (fileTypeSelect.value === 'markdown') {
                fileHint.textContent = 'Enter a name for your markdown file (e.g., README)';
                createBtn.textContent = 'Create Markdown';
            } else {
                fileHint.textContent = 'Enter a name for your script (e.g., PlayerController)';
                createBtn.textContent = 'Create Script';
            }
        });
        
        setTimeout(() => input.focus(), 100);
        
        const closeModal = () => modalOverlay.remove();
        
        const handleCreate = () => {
            const fileName = input.value.trim();
            const fileType = fileTypeSelect.value;
            const errorDiv = modalContent.querySelector('#modalError');
            
            if (!fileName) {
                errorDiv.textContent = 'Please enter a file name';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Add appropriate extension based on file type
            let finalName;
            if (fileType === 'markdown') {
                finalName = fileName.endsWith('.md') ? fileName : fileName + '.md';
            } else {
                finalName = fileName.endsWith('.js') ? fileName : fileName + '.js';
            }
            
            if (this.inventory.items[finalName]) {
                this.showOverwriteModal(finalName, () => {
                    closeModal();
                    this.inventory.finalizeScriptCreation(finalName, fileType);
                });
            } else {
                closeModal();
                this.inventory.finalizeScriptCreation(finalName, fileType);
            }
        };
        
        this.attachModalEventListeners(modalContent, modalOverlay, closeModal, handleCreate);
    }

    /**
     * Show overwrite confirmation modal
     */
    showOverwriteModal(fileName, onConfirm) {
        const modalOverlay = this.createModalOverlay();
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>File Already Exists</h3>
            </div>
            <div class="modal-body">
                <p>A script named "<strong>${fileName}</strong>" already exists.</p>
                <p>Do you want to override the existing file?</p>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-overwrite-btn" id="modalOverwriteBtn">Overwrite</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const closeModal = () => modalOverlay.remove();
        
        modalContent.querySelector('#modalCancelBtn').addEventListener('mousedown', closeModal);
        modalContent.querySelector('#modalOverwriteBtn').addEventListener('mousedown', () => {
            closeModal();
            onConfirm();
        });
        
        modalOverlay.addEventListener('mousedown', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }


    /**
     * Show folder name modal
     */
    showFolderNameModal(onConfirm) {
        const modalOverlay = this.createModalOverlay();
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>Create New Folder</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <label for="folderNameInput">Folder Name:</label>
                <input type="text" id="folderNameInput" placeholder="New Folder" autocomplete="off">
                <div class="modal-hint">Enter a name for your folder</div>
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-create-btn" id="modalCreateBtn">Create Folder</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const input = modalContent.querySelector('#folderNameInput');
        setTimeout(() => input.focus(), 100);
        
        const closeModal = () => modalOverlay.remove();
        
        const handleCreate = () => {
            const folderName = input.value.trim();
            const errorDiv = modalContent.querySelector('#modalError');
            
            if (!folderName) {
                errorDiv.textContent = 'Please enter a folder name';
                errorDiv.style.display = 'block';
                return;
            }
            
            closeModal();
            onConfirm(folderName);
        };
        
        this.attachModalEventListeners(modalContent, modalOverlay, closeModal, handleCreate);
    }

    /**
     * Show rename warning modal
     */
    showWarningConfirm (title, message, onConfirm, onCancel) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-warning';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>⚠️ ${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-confirm-btn modal-warning-btn" id="modalConfirmBtn">Continue Anyway</button>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Setup event listeners
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const confirmBtn = modalContent.querySelector('#modalConfirmBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        cancelBtn.addEventListener('mousedown', () => {
            closeModal();
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('mousedown', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });
        
        // Click outside to close (and cancel)
        modalOverlay.addEventListener('mousedown', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        });
        
        // ESC key to close (and cancel)
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Show confirmation modal
     */
    showConfirmModal(message, onConfirm, title = 'Confirm') {
        const modalOverlay = this.createModalOverlay();
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-confirm-btn" id="modalConfirmBtn">Confirm</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const closeModal = () => modalOverlay.remove();
        
        modalContent.querySelector('#modalCancelBtn').addEventListener('mousedown', closeModal);
        modalContent.querySelector('#modalConfirmBtn').addEventListener('mousedown', () => {
            closeModal();
            onConfirm();
        });
        
        modalOverlay.addEventListener('mousedown', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    /**
     * Show import Firebase modal
     */
    showImportFirebaseModal() {
        const modalOverlay = this.createModalOverlay();
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>Import from Firebase</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <label for="firebaseRefInput">Firebase Reference Path:</label>
                <input type="text" id="firebaseRefInput" placeholder="inventory/username/folder" autocomplete="off">
                <div class="modal-hint">Enter a Firebase inventory path (e.g., inventory/john_doe/scripts)</div>
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-import-btn" id="modalImportBtn">Import</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const input = modalContent.querySelector('#firebaseRefInput');
        setTimeout(() => input.focus(), 100);
        
        const closeModal = () => modalOverlay.remove();
        
        const handleImport = async () => {
            let firebaseRef = input.value.trim();
            const errorDiv = modalContent.querySelector('#modalError');
            const importBtn = modalContent.querySelector('#modalImportBtn');
            
            if (!firebaseRef) {
                errorDiv.textContent = 'Please enter a Firebase reference or username';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Check if input is just a username (no slashes)
            if (!firebaseRef.includes('/')) {
                // Treat as username - attempt to import public folders
                importBtn.textContent = 'Checking user...';
                importBtn.disabled = true;
                
                try {
                    const success = await this.inventory.firebase.importPublicUserFolders(firebaseRef);
                    if (success) {
                        closeModal();
                        this.inventory.ui.render();
                        showNotification(`Imported public folders from user "${firebaseRef}"`);
                    } else {
                        errorDiv.textContent = `User "${firebaseRef}" not found or has no public folders`;
                        errorDiv.style.display = 'block';
                        importBtn.textContent = 'Import';
                        importBtn.disabled = false;
                    }
                } catch (error) {
                    errorDiv.textContent = `Error: ${error.message}`;
                    errorDiv.style.display = 'block';
                    importBtn.textContent = 'Import';
                    importBtn.disabled = false;
                }
                return;
            }

            // Regular Firebase reference import
            if (firebaseRef.startsWith('~/')) {
                firebaseRef = firebaseRef.replace('~/', '');
                // Auto-prepend with inventory/SM.myName()/ if not starting with inventory/
                const userName = SM.myName();
                if (!userName) {
                    errorDiv.textContent = 'Unable to get current username';
                    errorDiv.style.display = 'block';
                    return;
                }
                firebaseRef = `inventory/${userName}/${firebaseRef}`;
            }
            
            importBtn.textContent = 'Importing...';
            importBtn.disabled = true;

            log("inventory", "importing from firebase", firebaseRef)
            
            try {
                const success = await this.inventory.firebase.importFromFirebase(firebaseRef);
                if (success) {
                    closeModal();
                } else {
                    errorDiv.textContent = 'No data found at this reference or import failed';
                    errorDiv.style.display = 'block';
                    importBtn.textContent = 'Import';
                    importBtn.disabled = false;
                }
            } catch (error) {
                errorDiv.textContent = `Import error: ${error.message}`;
                errorDiv.style.display = 'block';
                importBtn.textContent = 'Import';
                importBtn.disabled = false;
            }
        };
        
        this.attachModalEventListeners(modalContent, modalOverlay, closeModal, handleImport);
    }

    /**
     * Create modal overlay
     */
    createModalOverlay() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        return modalOverlay;
    }

    /**
     * Create modal content container
     */
    createModalContent(innerHTML) {
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = innerHTML;
        return modalContent;
    }

    /**
     * Show emoji picker modal
     */
    showEmojiPicker(itemName, item) {
        const modalOverlay = this.createModalOverlay();
        
        // Common emojis organized by category        
        const modalContent = this.createModalContent(`
            <div class="modal-header">
                <h3>Choose an Icon</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body emoji-picker-body">
                <div class="emoji-categories">
                    ${Object.entries(emojiCategories).map(([category, emojis]) => `
                        <div class="emoji-category">
                            <h4 class="emoji-category-title">${category}</h4>
                            <div class="emoji-grid">
                                ${emojis.map(emoji => `
                                    <button class="emoji-btn" data-emoji="${emoji}" title="${emoji}">
                                        ${emoji}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="custom-emoji-container">
                    <label for="customEmojiInput">Or enter custom emoji:</label>
                    <div class="custom-emoji-row">
                        <input type="text" id="customEmojiInput" placeholder="Enter any emoji..." maxlength="2" autocomplete="off">
                        <button class="modal-apply-btn" id="applyCustomEmoji">Apply</button>
                    </div>
                </div>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const closeModal = () => modalOverlay.remove();
        
        // Handle emoji selection
        const selectEmoji = async (emoji) => {
            item.icon = emoji;
            
            // Update localStorage
            const storageKey = `inventory_${itemName}`;
            localStorage.setItem(storageKey, JSON.stringify(item));
            
            // Sync to Firebase if remote
            if (this.inventory.isRemote || this.inventory.firebase.isItemInRemoteLocation(item)) {
                await this.inventory.firebase.syncToFirebase(item);
            }
            
            // Update preview
            const iconBtn = this.previewPane.querySelector('.preview-icon-btn');
            if (iconBtn) {
                iconBtn.textContent = emoji;
            }
            
            // Refresh inventory display
            this.render();
            
            closeModal();
            showNotification(`Icon updated to ${emoji}`);
        };
        
        // Add event listeners
        modalContent.querySelector('#modalCloseBtn').addEventListener('mousedown', closeModal);
        
        // Emoji button clicks
        modalContent.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('mousedown', () => {
                selectEmoji(btn.dataset.emoji);
            });
        });
        
        // Custom emoji input
        const customInput = modalContent.querySelector('#customEmojiInput');
        const applyBtn = modalContent.querySelector('#applyCustomEmoji');
        
        const applyCustom = () => {
            const customEmoji = customInput.value.trim();
            if (customEmoji) {
                selectEmoji(customEmoji);
            }
        };
        
        applyBtn.addEventListener('mousedown', applyCustom);
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                applyCustom();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // Search functionality
        // const searchInput = modalContent.querySelector('#emojiSearchInput');
        // searchInput.addEventListener('input', (e) => {
        //     const searchTerm = e.target.value.toLowerCase();
        //     modalContent.querySelectorAll('.emoji-category').forEach(category => {
        //         const hasVisibleEmojis = Array.from(category.querySelectorAll('.emoji-btn')).some(btn => {
        //             const matches = !searchTerm || btn.dataset.emoji.includes(searchTerm);
        //             btn.style.display = matches ? '' : 'none';
        //             return matches;
        //         });
        //         category.style.display = hasVisibleEmojis ? '' : 'none';
        //     });
        // });
        
        modalOverlay.addEventListener('mousedown', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    /**
     * Attach common modal event listeners
     */
    attachModalEventListeners(modalContent, modalOverlay, closeModal, handleAction) {
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const actionBtn = modalContent.querySelector('#modalCreateBtn, #modalImportBtn, #modalRenameBtn');
        const input = modalContent.querySelector('input');
        
        if (closeBtn) closeBtn.addEventListener('mousedown', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('mousedown', closeModal);
        if (actionBtn) actionBtn.addEventListener('mousedown', handleAction);
        
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleAction();
                } else if (e.key === 'Escape') {
                    closeModal();
                }
            });
        }
        
        modalOverlay.addEventListener('mousedown', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Show notification - now uses imported utility
     */
    notify(message, type = 'info') {
        showNotification(message, type);
    }
}