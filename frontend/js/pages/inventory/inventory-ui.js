const { LoadItemChange, CreateFolderChange, DeleteItemChange, SaveEntityItemChange, RenameItemChange, RenameFolderChange, RemoveFolderChange, MoveItemDirectoryChange, CreateScriptItemChange, EditScriptItemChange} = await import(`${window.repoUrl}/change-types.js`);
/**
 * InventoryUI - Handles all UI rendering, preview, drag-drop, and modal functions
 */
export class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.container = inventory.container;
        this.previewPane = inventory.previewPane;
    }

    /**
     * Main render function
     */
    async render() {
        // Check remote status
        await this.inventory.firebase.checkRemoteStatus();
        const inventoryContainer = this.container.querySelector('.inventory-container');
        
        if (Object.keys(this.inventory.items).length === 0 && Object.keys(this.inventory.folders).length === 0) {
            this.renderEmptyState(inventoryContainer);    
            return;
        }
        
        const totalItems = Object.keys(this.inventory.items).length;
        const folderPath = this.inventory.getCurrentFolderPath();
        
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
                    ${this.inventory.isRemote ? `
                        <button class="make-remote-button remote-status" id="remoteStatusBtn" disabled>
                            <span class="remote-icon">☁️</span>
                            Remote
                        </button>
                        <button class="link-button" id="copyLinkBtn" title="Copy Firebase path">
                            <span class="link-icon">🔗</span>
                        </button>
                    ` : `
                        <button class="make-remote-button" id="makeRemoteBtn">
                            <span class="remote-icon">☁️</span>
                            Make Remote
                        </button>
                    `}
                    <input type="file" id="fileInput" accept=".js,.json,.png,.jpg,.jpeg,.bmp,.gif" style="display: none;">
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
                    <input type="file" id="fileInput" accept=".js,.json,.png,.jpg,.jpeg,.bmp,.gif" style="display: none;">
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
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.inventory.fileHandler.handleFileUpload(e));
        }

        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.inventory.sortBy = e.target.value;
                this.render();
            });
        }
        
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', () => {
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

        
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.inventory.sortBy = e.target.value;
                this.render();
            });
        }
        
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', () => {
                this.inventory.sortDirection = this.inventory.sortDirection === 'asc' ? 'desc' : 'asc';
                this.render();
            });
        }
        
        // Breadcrumb navigation
        inventoryContainer.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                const folder = item.dataset.folder;
                this.inventory.navigateToFolder(folder);
            });
        });

        // Folder operations
        
        // Add event listeners for inventory items
        inventoryContainer.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-item-btn') && !e.target.closest('.action-btn')) {
                    this.inventory.selectItem(item.dataset.itemName);
                }
            });
        });
        
        // Add event listeners for remove buttons
        inventoryContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.removeItem(itemName);
            });
        });
        
        // Add event listeners for remove folder buttons
        inventoryContainer.querySelectorAll('.remove-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.inventory.removeFolder(folderName);
            });
        });
        
        // Add event listeners for edit script buttons
        inventoryContainer.querySelectorAll('.edit-script-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.openScriptEditor(itemName);
            });
        });
        
        // Add event listeners for add to scene buttons
        inventoryContainer.querySelectorAll('.add-to-scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.loadEntityToSceneByName(itemName);
            });
        });
        
        // Add event listeners for view image buttons
        inventoryContainer.querySelectorAll('.view-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.inventory.selectItem(itemName);
            });
        });
        
        // Add event listeners for copy URL buttons
        inventoryContainer.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
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
        
        // Add event listeners for file upload
        const uploadBtn = inventoryContainer.querySelector('#uploadFileBtn');
        const fileInput = inventoryContainer.querySelector('#fileInput');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.inventory.fileHandler.handleFileUpload(e));
        }
        
        // Add event listener for export button
        const exportBtn = inventoryContainer.querySelector('#exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.inventory.downloadSelectedItem());
        }
        
        // Add event listener for new script button
        const newScriptBtn = inventoryContainer.querySelector('#newScriptBtn');
        if (newScriptBtn) {
            newScriptBtn.addEventListener('click', () => this.inventory.createNewScript());
        }
        
        // Add event listener for new folder button
        const newFolderBtn = inventoryContainer.querySelector('#newFolderBtn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.inventory.createNewFolder());
        }
        
        // Add event listener for make remote button
        const makeRemoteBtn = inventoryContainer.querySelector('#makeRemoteBtn');
        if (makeRemoteBtn) {
            makeRemoteBtn.addEventListener('click', () => this.inventory.firebase.makeRemote());
        }
        
        // Add event listener for copy link button
        const copyLinkBtn = inventoryContainer.querySelector('#copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.inventory.firebase.copyFirebaseRef());
        }
        
        // Add event listener for import from Firebase button
        const importFirebaseBtn = inventoryContainer.querySelector('#importFirebaseBtn');
        if (importFirebaseBtn) {
            importFirebaseBtn.addEventListener('click', () => this.showImportFirebaseModal());
        }
        
        // Add event listeners for folder items
        inventoryContainer.querySelectorAll('.folder-item').forEach(folder => {
            folder.addEventListener('click', (e) => {
                if (!e.target.closest('.folder-expand-btn')) {
                    const folderName = folder.dataset.folderName;
                    this.inventory.openFolder(folderName);
                }
            });
            
            // Setup drag and drop for folders
            folder.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                folder.classList.add('drag-over');
            });
            
            folder.addEventListener('dragleave', (e) => {
                e.stopPropagation();
                folder.classList.remove('drag-over');
            });
            
            folder.addEventListener('drop', async(e) => {
                e.preventDefault();
                e.stopPropagation();
                folder.classList.remove('drag-over');
                const itemName = e.dataTransfer.getData('text/inventory-item');
                const folderName = folder.dataset.folderName;
                if (itemName && this.draggedItem) {
                    await this.inventory.moveItemToFolder(itemName, folderName);
                }
            });
        });
        
        // Add event listeners for expand/collapse buttons
        inventoryContainer.querySelectorAll('.folder-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.inventory.toggleFolderExpansion(folderName);
            });
        });
        
        // Make inventory items draggable
        inventoryContainer.querySelectorAll('.inventory-item').forEach(item => {
            item.draggable = true;
            item.addEventListener('dragstart', (e) => {
                this.draggedItem = item.dataset.itemName;
                e.dataTransfer.setData('text/inventory-item', this.draggedItem);
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedItem = null;
            });
        });
        
      
        
        // Add drop zone for inventory grid to move items to root or current folder
        const inventoryGrid = inventoryContainer.querySelector('.inventory-grid');
        if (inventoryGrid) {
            inventoryGrid.addEventListener('dragover', (e) => {
                // Only handle internal drags
                if (this.draggedItem) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            
            inventoryGrid.addEventListener('drop', async (e) => {
                // Only handle internal drops on empty areas
                if (this.draggedItem && e.target === inventoryGrid) {
                    e.preventDefault();
                    e.stopPropagation();
                    const itemName = e.dataTransfer.getData('text/inventory-item');
                    if (itemName) {
                        // Move to current folder (or root if no current folder)
                        await this.inventory.moveItemToFolder(itemName, this.inventory.currentFolder);
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
        
        return `
            <div class="folder-item" data-folder-name="${key}">
                <div class="folder-header">
                    <button class="folder-expand-btn" data-folder-name="${key}">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                    <span class="folder-icon">📁</span>
                    <h3 class="folder-name">${folder.name}</h3>
                    <span class="folder-count">${itemCount} items</span>
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
                items.push(this.renderItem(key, item));
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
    renderItem(key, item) {
        const dateStr = new Date(item.created).toLocaleDateString();
        const itemType = item.itemType || 'entity';
        const itemIcon = itemType === 'script' ? '📜' : itemType === 'image' ? '🖼️' : '📦';
        const isSelected = this.inventory.selectedItem === key;
        
        let itemInfo = '';
        if (itemType === 'image') {
            const size = item.data.size ? (item.data.size / 1024).toFixed(2) + ' KB' : 'Unknown';
            const dimensions = item.data.width && item.data.height ? 
                `${item.data.width}×${item.data.height}` : 'Unknown';
            itemInfo = `
                <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${itemType}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Size:</span>
                    <span class="info-value">${size}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dimensions:</span>
                    <span class="info-value">${dimensions}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Author:</span>
                    <span class="info-value">${item.author}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${dateStr}</span>
                </div>
            `;
        } else if (itemType === 'script') {
            itemInfo = `
                <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">Script</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Author:</span>
                    <span class="info-value">${item.author}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${dateStr}</span>
                </div>
            `;
        } else {
            const componentCount = item.data.components ? item.data.components.length : 0;
            const childCount = item.data.children ? item.data.children.length : 0;
            itemInfo = `
                <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${itemType}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Author:</span>
                    <span class="info-value">${item.author}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${dateStr}</span>
                </div>
                ${componentCount > 0 ? `
                    <div class="info-row">
                        <span class="info-label">Components:</span>
                        <span class="info-value">${componentCount}</span>
                    </div>
                ` : ''}
                ${childCount > 0 ? `
                    <div class="info-row">
                        <span class="info-label">Children:</span>
                        <span class="info-value">${childCount}</span>
                    </div>
                ` : ''}
            `;
        }


        // Different actions based on item type
        let itemActions = '';
        if (itemType === 'script') {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn edit-script-btn" data-item-name="${key}">
                        ✏️ Edit
                    </button>
                </div>
            `;
        } else if (itemType === 'image') {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn copy-url-btn" data-item-name="${key}">
                        📋 Copy URL
                    </button>
                </div>
            `;
        } else {
            itemActions = `
                <div class="item-actions">
                    <button class="action-btn add-to-scene-btn" data-item-name="${key}">
                        ➕ Add to Scene
                    </button>
                </div>
            `;
        }
        
        return `
        <div class="inventory-item ${isSelected ? 'selected' : ''}" data-item-name="${key}">
            <div class="item-header">
                <div class="item-title">
                    <span class="item-type-icon" title="${itemType}">${itemIcon}</span>
                    <h3 class="item-name">${item.name}</h3>
                </div>
                <button class="remove-item-btn" data-item-name="${key}">×</button>
            </div>
            <div class="item-info">
                ${itemInfo}
            </div>
            ${itemActions}
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
        const previewContent = this.generatePreviewContent(item);
        this.previewPane.innerHTML = previewContent;
        this.previewPane.style.display = 'block';
        
        // Add event listeners for preview interactions
        this.attachPreviewEventListeners(itemName, item);
    }

    /**
     * Attach event listeners for preview pane
     */
    attachPreviewEventListeners(itemName, item) {
        // Close button
        const closeBtn = this.previewPane.querySelector('.preview-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.inventory.selectedItem = null;
                this.hidePreview();
                this.render();
            });
        }
        
        // Edit script button
        const editBtn = this.previewPane.querySelector('.edit-script-preview-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.inventory.openScriptEditor(itemName);
            });
        }
        
        // Copy image URL button
        const copyUrlBtn = this.previewPane.querySelector('.copy-image-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
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
            openImageBtn.addEventListener('click', () => {
                const url = openImageBtn.dataset.url;
                window.open(url, '_blank');
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
     * Generate preview content for an item
     */
    generatePreviewContent(item) {
        const dateStr = new Date(item.created).toLocaleString();
        const itemType = item.itemType || 'entity';
        const description = item.description || '';
        
        if (itemType === 'image') {
            const size = item.data.size ? (item.data.size / 1024).toFixed(2) + ' KB' : 'Unknown';
            const dimensions = item.data.width && item.data.height ? 
                `${item.data.width}×${item.data.height}` : 'Unknown';
            
            return `
                <div class="preview-header">
                    <h2 contenteditable="true" class="editable-name" data-item-name="${item.name}">${item.name}</h2>
                    <button class="preview-close-btn">×</button>
                </div>
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
        } else if (itemType === 'script') {
            const scriptContent = item.data || '';
            const preview = scriptContent.substring(0, 500) + (scriptContent.length > 500 ? '...' : '');
            
            return `
                <div class="preview-header">
                    <h2 contenteditable="true" class="editable-name" data-item-name="${item.name}">${item.name}</h2>
                    <button class="preview-close-btn">×</button>
                </div>
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
                <div class="preview-header">
                    <h2 contenteditable="true" class="editable-name" data-item-name="${item.name}">${item.name}</h2>
                    <button class="preview-close-btn">×</button>
                </div>
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
        this.container.addEventListener('dragover', (e) => {
            // Only handle external drags (from hierarchy)
            if (!this.inventory.draggedItem) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.container.classList.add('drag-over');
            }
        });
        
        this.container.addEventListener('dragleave', (e) => {
            if (e.target === this.container) {
                this.container.classList.remove('drag-over');
            }
        });
        
        this.container.addEventListener('drop', async (e) => {
            // Only handle external drops (from hierarchy)
            if (!this.inventory.draggedItem) {
                e.preventDefault();
                this.container.classList.remove('drag-over');
                
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
                <h3>Create New Script</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <label for="scriptNameInput">Script Name:</label>
                <input type="text" id="scriptNameInput" placeholder="MyScript.js" autocomplete="off">
                <div class="modal-hint">Enter a name for your script (e.g., PlayerController.js)</div>
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-create-btn" id="modalCreateBtn">Create Script</button>
            </div>
        `);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        const input = modalContent.querySelector('#scriptNameInput');
        setTimeout(() => input.focus(), 100);
        
        const closeModal = () => modalOverlay.remove();
        
        const handleCreate = () => {
            const scriptName = input.value.trim();
            const errorDiv = modalContent.querySelector('#modalError');
            
            if (!scriptName) {
                errorDiv.textContent = 'Please enter a script name';
                errorDiv.style.display = 'block';
                return;
            }
            
            const finalName = scriptName.endsWith('.js') ? scriptName : scriptName + '.js';
            
            if (this.inventory.items[finalName]) {
                this.showOverwriteModal(finalName, () => {
                    closeModal();
                    this.inventory.finalizeScriptCreation(finalName);
                });
            } else {
                closeModal();
                this.inventory.finalizeScriptCreation(finalName);
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
        
        modalContent.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
        modalContent.querySelector('#modalOverwriteBtn').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        modalOverlay.addEventListener('click', (e) => {
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
        
        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm();
        });
        
        // Click outside to close (and cancel)
        modalOverlay.addEventListener('click', (e) => {
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
        
        modalContent.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
        modalContent.querySelector('#modalConfirmBtn').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        modalOverlay.addEventListener('click', (e) => {
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
            const firebaseRef = input.value.trim();
            const errorDiv = modalContent.querySelector('#modalError');
            const importBtn = modalContent.querySelector('#modalImportBtn');
            
            if (!firebaseRef) {
                errorDiv.textContent = 'Please enter a Firebase reference';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (!firebaseRef.startsWith('inventory/')) {
                errorDiv.textContent = 'Reference must start with "inventory/"';
                errorDiv.style.display = 'block';
                return;
            }
            
            importBtn.textContent = 'Importing...';
            importBtn.disabled = true;
            
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
     * Attach common modal event listeners
     */
    attachModalEventListeners(modalContent, modalOverlay, closeModal, handleAction) {
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const actionBtn = modalContent.querySelector('#modalCreateBtn, #modalImportBtn, #modalRenameBtn');
        const input = modalContent.querySelector('input');
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (actionBtn) actionBtn.addEventListener('click', handleAction);
        
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleAction();
                } else if (e.key === 'Escape') {
                    closeModal();
                }
            });
        }
        
        modalOverlay.addEventListener('click', (e) => {
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