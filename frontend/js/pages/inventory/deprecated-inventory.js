const { LoadItemChange, CreateFolderChange, DeleteItemChange, SaveEntityItemChange, RenameItemChange, RenameFolderChange, RemoveFolderChange, MoveItemDirectoryChange, CreateScriptItemChange, EditScriptItemChange} = await import(`${window.repoUrl}/change-types.js`);
export class Inventory {
    constructor() {
        this.container = document.getElementById('inventory-page');
        this.previewPane = document.getElementById('previewPane');
        this.items = this.loadItems();
        this.folders = this.loadFolders();
        this.selectedItem = null;
        this.currentFolder = null;
        this.expandedFolders = new Set();
        this.draggedItem = null;
        this.isRemote = false;
        this.sortBy = 'alphabetical'; // alphabetical, date, last_used
        this.sortDirection = 'asc'; // asc or desc
        this.firebaseListeners = new Map(); // Track active Firebase listeners
        this.setupDropZone();
        this.render();
    }
    
    /**
     * Setup Firebase listeners for remote folders
     */
    setupFirebaseListeners() {
        // Clear any existing listeners
        this.clearFirebaseListeners();
        
        if (!window.networking) {
            console.log('Firebase not initialized, skipping listeners setup');
            return;
        }
        
        const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
        
        // Check all folders for remote status and setup listeners
        Object.entries(this.folders).forEach(([folderName, folder]) => {
            if (folder.remote) {
                this.setupFolderListener(folderName, folder);
            }
        });
        
        // Check if root is remote and setup listener
        const rootRemoteKey = `inventory_root_remote_${userName}`;
        if (localStorage.getItem(rootRemoteKey) === 'true') {
            this.setupRootListener();
        }
    }
    
    /**
     * Setup Firebase listener for a specific folder
     */
    setupFolderListener(folderName, folder) {
        if (!window.networking || !window.networking.getDatabase) return;
        
        try {
            const db = window.networking.getDatabase();
            const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            
            // Build Firebase path for the folder
            let firebasePath = `inventory/${userName}`;
            if (folder.parent) {
                const sanitizedParent = this.sanitizeFirebasePath(folder.parent);
                firebasePath += `/${sanitizedParent}`;
            }
            const sanitizedFolderName = this.sanitizeFirebasePath(folderName);
            firebasePath += `/${sanitizedFolderName}`;
            
            // Setup listeners for child_added and child_removed
            const folderRef = db.ref(firebasePath);
            
            const addedListener = folderRef.on('child_added', (snapshot) => {
                this.handleFirebaseItemAdded(snapshot, folderName);
            });
            
            const removedListener = folderRef.on('child_removed', (snapshot) => {
                this.handleFirebaseItemRemoved(snapshot, folderName);
            });
            
            const changedListener = folderRef.on('child_changed', (snapshot) => {
                this.handleFirebaseItemChanged(snapshot, folderName);
            });
            
            // Store listeners for cleanup
            this.firebaseListeners.set(firebasePath, {
                ref: folderRef,
                listeners: { addedListener, removedListener, changedListener }
            });
            
            console.log('Firebase listeners setup for folder:', firebasePath);
        } catch (error) {
            console.error('Failed to setup folder listener:', error);
        }
    }
    
    /**
     * Setup Firebase listener for root inventory
     */
    setupRootListener() {
        if (!window.networking || !window.networking.getDatabase) return;
        
        try {
            const db = window.networking.getDatabase();
            const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            const firebasePath = `inventory/${userName}`;
            
            const rootRef = db.ref(firebasePath);
            
            const addedListener = rootRef.on('child_added', (snapshot) => {
                this.handleFirebaseItemAdded(snapshot, null);
            });
            
            const removedListener = rootRef.on('child_removed', (snapshot) => {
                this.handleFirebaseItemRemoved(snapshot, null);
            });
            
            const changedListener = rootRef.on('child_changed', (snapshot) => {
                this.handleFirebaseItemChanged(snapshot, null);
            });
            
            // Store listeners for cleanup
            this.firebaseListeners.set(firebasePath, {
                ref: rootRef,
                listeners: { addedListener, removedListener, changedListener }
            });
            
            console.log('Firebase listeners setup for root:', firebasePath);
        } catch (error) {
            console.error('Failed to setup root listener:', error);
        }
    }
    
    /**
     * Handle item added from Firebase
     */
    handleFirebaseItemAdded(snapshot, folderName) {
        const key = snapshot.key;
        const data = snapshot.val();
        
        // Skip folder metadata
        if (key === '_folder') return;
        
        // Check if it's a subfolder
        if (data._folder) {
            const subfolderName = data._folder.name || key;
            const fullFolderName = folderName ? `${folderName}/${subfolderName}` : subfolderName;
            
            // Check if folder already exists locally
            if (!this.folders[fullFolderName]) {
                const folder = {
                    ...data._folder,
                    name: subfolderName,
                    parent: folderName,
                    remote: true
                };
                
                // Save to localStorage
                const storageKey = `inventory_folder_${fullFolderName}`;
                localStorage.setItem(storageKey, JSON.stringify(folder));
                this.folders[fullFolderName] = folder;
                
                // Setup listener for the new remote folder
                this.setupFolderListener(fullFolderName, folder);
                
                console.log('Remote folder added:', fullFolderName);
                this.render();
            }
        } else if (data.itemType) {
            // It's an item
            const itemName = data.name || key;
            
            // Check if item already exists locally
            if (!this.items[itemName]) {
                const item = {
                    ...data,
                    folder: folderName
                };
                
                // Save to localStorage
                const storageKey = `inventory_${itemName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                this.items[itemName] = item;
                
                console.log('Remote item added:', itemName);
                this.showNotification(`New item "${itemName}" added from remote`);
                this.render();
            }
        }
    }
    
    /**
     * Handle item removed from Firebase
     */
    handleFirebaseItemRemoved(snapshot, folderName) {
        const key = snapshot.key;
        const data = snapshot.val();
        
        // Skip folder metadata
        if (key === '_folder') return;
        
        // Check if it's a subfolder
        if (data && data._folder) {
            const subfolderName = data._folder.name || key;
            const fullFolderName = folderName ? `${folderName}/${subfolderName}` : subfolderName;
            
            // Remove folder locally if it exists
            if (this.folders[fullFolderName]) {
                // Remove all items in the folder
                Object.entries(this.items).forEach(([itemKey, item]) => {
                    if (item.folder === fullFolderName) {
                        const storageKey = `inventory_${itemKey}`;
                        localStorage.removeItem(storageKey);
                        delete this.items[itemKey];
                    }
                });
                
                // Remove the folder
                const storageKey = `inventory_folder_${fullFolderName}`;
                localStorage.removeItem(storageKey);
                delete this.folders[fullFolderName];
                
                console.log('Remote folder removed:', fullFolderName);
                this.render();
            }
        } else if (data && data.itemType) {
            // It's an item
            const itemName = data.name || key;
            
            // Remove item locally if it exists
            if (this.items[itemName]) {
                const storageKey = `inventory_${itemName}`;
                localStorage.removeItem(storageKey);
                delete this.items[itemName];
                
                console.log('Remote item removed:', itemName);
                this.showNotification(`Item "${itemName}" removed from remote`);
                this.render();
            }
        }
    }
    
    /**
     * Handle item changed from Firebase
     */
    handleFirebaseItemChanged(snapshot, folderName) {
        console.log("handleFirebaseItemChanged")
        const key = snapshot.key;
        const data = snapshot.val();
        console.log("data: ", data)
        // Skip folder metadata
        if (key === '_folder') return;
        
        if (data && data.itemType) {
            const itemName = data.name || key;
            
            // Update item locally if it exists
            if (this.items[itemName]) {
                const item = {
                    ...data,
                    folder: folderName
                };
                
                // Save to localStorage
                const storageKey = `inventory_${itemName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                this.items[itemName] = item;
                
                console.log('Remote item updated:', itemName);
                


                if(item.itemType === "script"){
					// If a script editor is open for this script, update its text and save
					try {
						if (window.scriptEditors && window.scriptEditors.size > 0) {
							for (const [key, editor] of window.scriptEditors) {
								if (editor?.currentScript?.name === itemName) {
									const newContent = item.data || data.data || '';
									// Update editor content
									if (editor.codemirror && typeof editor.codemirror.setValue === 'function') {
										editor.codemirror.setValue(newContent);
									}
									// Keep ScriptEditor's model in sync
									editor.currentScript.content = newContent;
									// Persist changes via existing save flow
									if (typeof editor.save === 'function') {
										editor.save();
									}
									break;
								}
							}
						}
					} catch (e) {
						console.warn('Failed to sync open script editor with remote update:', e);
					}
                }

                // Update preview if this item is selected
                if (this.selectedItem === itemName) {
                    this.showPreview(itemName);
                }
                
                this.render();
            }
        }
    }
    
    /**
     * Clear all Firebase listeners
     */
    clearFirebaseListeners() {
        this.firebaseListeners.forEach(({ ref, listeners }) => {
            // Remove all listeners
            if (listeners.addedListener) ref.off('child_added');
            if (listeners.removedListener) ref.off('child_removed');
            if (listeners.changedListener) ref.off('child_changed');
        });
        this.firebaseListeners.clear();
        console.log('Firebase listeners cleared');
    }
    
    /**
     * Setup drop zone for the inventory page
     */
    setupDropZone() {
        this.container.addEventListener('dragover', (e) => {
            // Only handle external drags (from hierarchy)
            if (!this.draggedItem) {
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
            if (!this.draggedItem) {
                e.preventDefault();
                this.container.classList.remove('drag-over');
                
                const entityId = e.dataTransfer.getData('text/plain');
                let change = new SaveEntityItemChange(entityId, null, null, {source: 'ui'});
                changeManager.applyChange(change);
   
            }
        });
    }

    reload(){
        this.items = this.loadItems();
        this.folders = this.loadFolders();
        this.render();
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
                    items[itemKey] = JSON.parse(localStorage.getItem(key));
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
     * Remove item from inventory
     */
    removeItem(itemName) {
        this.showConfirmModal(
            `Are you sure you want to remove "${itemName}" from your inventory?`,
            () => {
                let change = new DeleteItemChange(itemName, {source: 'ui'});
                changeManager.applyChange(change);
                this.render();
                this.showNotification(`Removed "${itemName}" from inventory`);
            },
            'Remove Item'
        );
    }

    getAvailableScripts(){
        return Object.values(this.items).filter(item => item.itemType === 'script');
    }
    
    /**
     * Check if current directory is marked as remote
     */
    async checkRemoteStatus() {
        if (this.currentFolder) {
            // Check if current folder has remote attribute set to true
            const folder = this.folders[this.currentFolder];
            this.isRemote = folder && folder.remote === true;
        } else {
            // For root directory, check localStorage flag
            const rootRemoteKey = `inventory_root_remote_${this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default')}`;
            this.isRemote = localStorage.getItem(rootRemoteKey) === 'true';
        }
    }
    
    /**
     * Get current Firebase path
     */
    getCurrentFirebasePath() {
        if (!SM.scene?.localUser?.name) return null;
        
        const userName = this.sanitizeFirebasePath(SM.scene.localUser.name);
        const basePath = `inventory/${userName}`;
        
        if (this.currentFolder) {
            const sanitizedFolder = this.sanitizeFirebasePath(this.currentFolder);
            return `${basePath}/${sanitizedFolder}`;
        }
        
        return basePath;
    }
    
    /**
     * Copy Firebase reference to clipboard
     */
    async copyFirebaseRef() {
        const firebasePath = this.getCurrentFirebasePath();
        if (!firebasePath) {
            this.showNotification('Unable to get Firebase path');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(firebasePath);
            this.showNotification('Firebase path copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('Failed to copy path');
        }
    }
    
    /**
     * Render inventory items
     */
    async render() {
        // Check remote status
        await this.checkRemoteStatus();
        const inventoryContainer = this.container.querySelector('.inventory-container');
        
        if (Object.keys(this.items).length === 0 && Object.keys(this.folders).length === 0) {
            inventoryContainer.innerHTML = `
                <div class="inventory-header">
                    <h2>Saved Items (0)</h2>
                    <div class="inventory-sorting">
                        <select id="sortDropdown" class="sort-dropdown">
                            <option value="alphabetical" ${this.sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
                            <option value="date" ${this.sortBy === 'date' ? 'selected' : ''}>Creation Date</option>
                            <option value="last_used" ${this.sortBy === 'last_used' ? 'selected' : ''}>Last Used</option>
                        </select>
                        <button id="sortDirectionBtn" class="sort-direction-btn" title="${this.sortDirection === 'asc' ? 'Ascending' : 'Descending'}">
                            ${this.sortDirection === 'asc' ? '↑' : '↓'}
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
            const newFolderBtn = inventoryContainer.querySelector('#newFolderBtn');
            const sortDropdown = inventoryContainer.querySelector('#sortDropdown');
            const sortDirectionBtn = inventoryContainer.querySelector('#sortDirectionBtn');
            
            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
            }
            
            if (newFolderBtn) {
                newFolderBtn.addEventListener('click', () => this.createNewFolder());
            }
            
            if (sortDropdown) {
                sortDropdown.addEventListener('change', (e) => {
                    this.sortBy = e.target.value;
                    this.render();
                });
            }
            
            if (sortDirectionBtn) {
                sortDirectionBtn.addEventListener('click', () => {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                    this.render();
                });
            }
            
            return;
        }
        
        const totalItems = Object.keys(this.items).length;
        const folderPath = this.getCurrentFolderPath();
        
        inventoryContainer.innerHTML = `
            <div class="inventory-header">
                <h2>${folderPath ? `📁 ${folderPath}` : `Saved Items (${totalItems})`}</h2>
                <div class="inventory-sorting">
                    <select id="sortDropdown" class="sort-dropdown">
                        <option value="alphabetical" ${this.sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
                        <option value="date" ${this.sortBy === 'date' ? 'selected' : ''}>Creation Date</option>
                        <option value="last_used" ${this.sortBy === 'last_used' ? 'selected' : ''}>Last Used</option>
                    </select>
                    <button id="sortDirectionBtn" class="sort-direction-btn" title="${this.sortDirection === 'asc' ? 'Ascending' : 'Descending'}">
                        ${this.sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
                <div class="inventory-actions">
                    ${this.selectedItem ? `
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
                    ${this.isRemote ? `
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
            ${this.currentFolder ? `
                <div class="folder-breadcrumb">
                    <span class="breadcrumb-item" data-folder="">Home</span>
                    ${this.renderBreadcrumb()}
                </div>
            ` : ''}
            <div class="inventory-grid">
                ${this.renderFoldersAndItems()}
            </div>
        `;
        
        // Add event listeners for sorting controls
        const sortDropdown = inventoryContainer.querySelector('#sortDropdown');
        const sortDirectionBtn = inventoryContainer.querySelector('#sortDirectionBtn');
        
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render();
            });
        }
        
        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', () => {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                this.render();
            });
        }
        
        // Add event listeners for inventory items
        inventoryContainer.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-item-btn') && !e.target.closest('.action-btn')) {
                    this.selectItem(item.dataset.itemName);
                }
            });
        });
        
        // Add event listeners for remove buttons
        inventoryContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.removeItem(itemName);
            });
        });
        
        // Add event listeners for remove folder buttons
        inventoryContainer.querySelectorAll('.remove-folder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.removeFolder(folderName);
            });
        });
        
        // Add event listeners for edit script buttons
        inventoryContainer.querySelectorAll('.edit-script-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.openScriptEditor(itemName);
            });
        });
        
        // Add event listeners for add to scene buttons
        inventoryContainer.querySelectorAll('.add-to-scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.loadEntityToSceneByName(itemName);
            });
        });
        
        // Add event listeners for view image buttons
        inventoryContainer.querySelectorAll('.view-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.selectItem(itemName);
            });
        });
        
        // Add event listeners for copy URL buttons
        inventoryContainer.querySelectorAll('.copy-url-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                const item = this.items[itemName];
                if (item && item.itemType === 'image' && item.data.url) {
                    navigator.clipboard.writeText(item.data.url).then(() => {
                        this.showNotification('Image URL copied to clipboard');
                    }).catch(err => {
                        console.error('Failed to copy URL:', err);
                        this.showNotification('Failed to copy URL');
                    });
                }
            });
        });
        
        // Add event listeners for file upload
        const uploadBtn = inventoryContainer.querySelector('#uploadFileBtn');
        const fileInput = inventoryContainer.querySelector('#fileInput');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Add event listener for export button
        const exportBtn = inventoryContainer.querySelector('#exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.downloadSelectedItem());
        }
        
        // Add event listener for new script button
        const newScriptBtn = inventoryContainer.querySelector('#newScriptBtn');
        if (newScriptBtn) {
            newScriptBtn.addEventListener('click', () => this.createNewScript());
        }
        
        // Add event listener for new folder button
        const newFolderBtn = inventoryContainer.querySelector('#newFolderBtn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        
        // Add event listener for make remote button
        const makeRemoteBtn = inventoryContainer.querySelector('#makeRemoteBtn');
        if (makeRemoteBtn) {
            makeRemoteBtn.addEventListener('click', () => this.makeRemote());
        }
        
        // Add event listener for copy link button
        const copyLinkBtn = inventoryContainer.querySelector('#copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyFirebaseRef());
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
                    this.openFolder(folderName);
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
                    await this.moveItemToFolder(itemName, folderName);
                }
            });
        });
        
        // Add event listeners for expand/collapse buttons
        inventoryContainer.querySelectorAll('.folder-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderName = btn.dataset.folderName;
                this.toggleFolderExpansion(folderName);
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
                        await this.moveItemToFolder(itemName, this.currentFolder);
                    }
                }
            });
        }
    }
    
    /**
     * Get current folder path for display
     */
    getCurrentFolderPath() {
        if (!this.currentFolder) return null;
        return this.currentFolder;
    }
    
    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb() {
        if (!this.currentFolder) return '';
        const parts = this.currentFolder.split('/');
        let path = '';
        return parts.map((part, index) => {
            path += (index > 0 ? '/' : '') + part;
            return `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item" data-folder="${path}">${part}</span>`;
        }).join('');
    }
    
    /**
     * Render folders and items for current view
     */
    renderFoldersAndItems() {
        const foldersHtml = [];
        const itemsHtml = [];
        
        // Get folders in current directory
        let foldersArray = Object.entries(this.folders)
            .filter(([key, folder]) => folder.parent === this.currentFolder)
            .map(([key, folder]) => ({key, ...folder}));
        
        // Sort folders
        foldersArray = this.sortItems(foldersArray, true);
        
        // Render sorted folders
        foldersArray.forEach(folder => {
            foldersHtml.push(this.renderFolder(folder.key, folder));
        });
        
        // Get items in current directory
        let itemsArray = Object.entries(this.items)
            .filter(([key, item]) => (item.folder || null) === this.currentFolder)
            .map(([key, item]) => ({key, ...item}));
        
        // Sort items
        itemsArray = this.sortItems(itemsArray, false);
        
        // Render sorted items
        itemsArray.forEach(item => {
            itemsHtml.push(this.renderItem(item.key, item));
        });
        
        return foldersHtml.join('') + itemsHtml.join('');
    }
    
    /**
     * Sort items or folders based on current sort settings
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
     * Render folder
     */
    renderFolder(key, folder) {
        const itemCount = this.getItemCountInFolder(key);
        const isExpanded = this.expandedFolders.has(key);
        
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
     * Get item count in folder (including subfolders)
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
     * Render folder contents when expanded
     */
    renderFolderContents(folderKey) {
        const items = [];
        const subfolders = [];
        
        // Get subfolders
        Object.entries(this.folders).forEach(([key, folder]) => {
            if (folder.parent === folderKey) {
                subfolders.push(this.renderFolder(key, folder));
            }
        });
        
        // Get items
        Object.entries(this.items).forEach(([key, item]) => {
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
     * Render individual item
     */
    renderItem(key, item) {
        const dateStr = new Date(item.created).toLocaleDateString();
        const itemType = item.itemType || 'entity'; // Default to 'entity' for backward compatibility
        const itemIcon = itemType === 'script' ? '📜' : itemType === 'image' ? '🖼️' : '📦';
        const isSelected = this.selectedItem === key;
        
        // Different info based on item type
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
                <div class="info-row">
                    <span class="info-label">Components:</span>
                    <span class="info-value">${componentCount}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Children:</span>
                    <span class="info-value">${childCount}</span>
                </div>
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
     * Show notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'inventory-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Handle file upload
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        try {
            if (fileExt === 'js') {
                // Handle JavaScript files
                const fileContent = await this.readFile(file);
                await this.handleScriptUpload(fileName, fileContent);
            } else if (fileExt === 'json') {
                // Handle JSON files
                const fileContent = await this.readFile(file);
                await this.handleJsonUpload(fileName, fileContent);
            } else if (['png', 'jpg', 'jpeg', 'bmp', 'gif'].includes(fileExt)) {
                // Handle image files
                await this.handleImageUpload(file);
            } else {
                this.showNotification('Please upload a .js, .json, or image file (.png, .jpg, .jpeg, .bmp, .gif)');
            }
        } catch (error) {
            console.error('File upload error:', error);
            this.showNotification(`Error uploading file: ${error.message}`);
        }
        
        // Clear the input for next upload
        event.target.value = '';
    }
    
    /**
     * Read file content as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * Handle script file upload
     */
    async handleScriptUpload(fileName, content) {
        const existingKeys = Object.keys(this.items);
        
        // Check for existing item
        if (existingKeys.includes(fileName)) {
            this.showConfirmModal(
                `An item named "${fileName}" already exists. Do you want to overwrite it?`,
                () => {
                    // Continue with overwrite
                    this.saveScriptFromUpload(fileName, content);
                },
                'Overwrite Script'
            );
            return;
        }
        
        // No conflict, save directly
        this.saveScriptFromUpload(fileName, content);
    }
    
    /**
     * Save script item to storage
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
        this.render();
        
        // Show success message
        this.showNotification(`Added script "${fileName}" to inventory`);
    }
    
    /**
     * Save inventory item (for JSON import)
     */
    saveItemFromUpload(itemName, jsonData) {
        // Save directly as it's already in the correct format
        const storageKey = `inventory_${itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(jsonData));
        
        // Update local items
        this.items[itemName] = jsonData;

        this.selectItem(itemName);
        
        // Show success message
        this.showNotification(`Imported "${itemName}" to inventory`);
    }


    async syncToFirebase(inventoryItem) {
        // Check if item is in a remote folder or root is remote
        const isRemote = this.isItemInRemoteLocation();
        if (!isRemote) return;

        if (!window.networking) {
            console.warn('Networking not initialized, skipping sync');
            return;
        }

        try {
            const userName = inventory.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            
            // Build the Firebase path
            let firebasePath = `inventory/${userName}`;
            if (this.currentFolder) {
                const sanitizedFolder = inventory.sanitizeFirebasePath(this.currentFolder);
                firebasePath += `/${sanitizedFolder}`;
            }
            const sanitizedItemName = inventory.sanitizeFirebasePath(this.itemName);
            firebasePath += `/${sanitizedItemName}`;
            
            // Save to Firebase
            await networking.setData(firebasePath, inventoryItem);
            console.log('Item synced to Firebase:', firebasePath);
        } catch (error) {
            console.error('Failed to sync item to Firebase:', error);
        }
    }

    isItemInRemoteLocation() {
        if (this.folder) {
            // Check if folder is marked as remote
            const folderData = inventory.folders[this.folder];
            return folderData && folderData.remote === true;
        } else {
            // Check if root is marked as remote
            const userName = inventory.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            const rootRemoteKey = `inventory_root_remote_${userName}`;
            return localStorage.getItem(rootRemoteKey) === 'true';
        }
    }
    
    /**
     * Handle JSON file upload
     */
    async handleJsonUpload(fileName, content) {
        try {
            const jsonData = JSON.parse(content);
            
            // Check if it's a entity inventory item format
            if (this.isInventoryEntityFormat(jsonData)) {
                const itemName = jsonData.name;
                const existingKeys = Object.keys(this.items);
                
                // Check for existing item
                if (existingKeys.includes(itemName)) {
                    this.showConfirmModal(
                        `An item named "${itemName}" already exists. Do you want to overwrite it?`,
                        () => {
                            // Continue with overwrite
                            this.saveItemFromUpload(itemName, jsonData);
                        },
                        'Overwrite Item'
                    );
                    return;
                }
                
                
                // No conflict, save directly
                this.saveItemFromUpload(itemName, jsonData);
            } else {
                this.showNotification('The JSON file is not in the correct inventory entity format');
            }
        } catch (error) {
            this.showNotification('Invalid JSON file');
        }
    }
    
    /**
     * Check if JSON data is in inventory entity format
     */
    isInventoryEntityFormat(data) {
        return data && 
               typeof data === 'object' &&
               'author' in data &&
               'name' in data &&
               'created' in data &&
               'itemType' in data &&
               'data' in data;
    }
    
    /**
     * Handle image file upload
     */
    async handleImageUpload(file) {
        const fileName = file.name;
        const existingKeys = Object.keys(this.items);
        
        // Check for existing item
        if (existingKeys.includes(fileName)) {
            this.showConfirmModal(
                `An item named "${fileName}" already exists. Do you want to overwrite it?`,
                () => {
                    // Continue with overwrite
                    this.uploadImageToFirebase(file);
                },
                'Overwrite Image'
            );
            return;
        }
        
        // No conflict, upload directly
        this.uploadImageToFirebase(file);
    }
    
    /**
     * Upload image to Firebase Storage and save reference
     */
    async uploadImageToFirebase(file) {
        try {
            // Show upload notification
            this.showNotification('Uploading image...');
            
            // Get Firebase Storage from networking module
            if (!window.networking || !window.networking.getStorage) {
                this.showNotification('Firebase Storage not initialized. Please wait and try again.');
                return;
            }
            
            const storage = window.networking.getStorage();
            if (!storage) {
                this.showNotification('Firebase Storage not available');
                return;
            }
            
            // Generate path similar to how entities would be stored
            const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            const timestamp = Date.now();
            const fileName = file.name;
            const fileExt = fileName.split('.').pop().toLowerCase();
            const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
            
            // Create storage path: inventory/username/images/timestamp_filename
            const storagePath = `inventory/${userName}/images/${fileName}`;
            const storageRef = storage.ref(storagePath);
            
            // Upload file
            const snapshot = await storageRef.put(file);
            
            // Get download URL
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Create image item
            const now = Date.now();
            const imageItem = {
                author: SM.scene?.localUser?.name || 'Unknown',
                name: fileName,
                created: now,
                last_used: now,
                itemType: 'image',
                description: '',
                data: {
                    url: downloadURL,
                    storagePath: storagePath,
                    size: file.size,
                    type: file.type,
                    width: 0,  // Will be updated when image loads
                    height: 0
                }
            };
            
            // Load image to get dimensions
            const img = new Image();
            img.onload = () => {
                imageItem.data.width = img.width;
                imageItem.data.height = img.height;
                
                // Save to localStorage
                this.saveItemFromUpload(fileName, imageItem);
            };
            img.onerror = () => {
                // Save anyway even if dimensions couldn't be loaded
                this.saveItemFromUpload(fileName, imageItem);
            };
            img.src = downloadURL;
            
        } catch (error) {
            console.error('Image upload error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            if (error.serverResponse) {
                console.error('Server response:', error.serverResponse);
                try {
                    const parsed = JSON.parse(error.serverResponse);
                    console.error('Parsed server response:', parsed);
                } catch (e) {
                    // Not JSON
                }
            }
            
            // Provide more specific error messages
            let errorMessage = 'Error uploading image: ';
            if (error.code === 'storage/unauthorized') {
                errorMessage += 'Permission denied. Check Firebase Storage rules.';
            } else if (error.code === 'storage/unknown') {
                errorMessage += 'Unknown error. Check Firebase Storage configuration and CORS settings.';
                console.error('Tip: Run window.networking.testStorageConnection() in console to debug');
            } else {
                errorMessage += error.message;
            }
            
            this.showNotification(errorMessage);
        }
    }
    
    /**
     * Save image item to storage
     */
    saveImageItem(fileName, imageItem) {
        // Only add folder property if we're in a folder
        if (this.currentFolder) {
            imageItem.folder = this.currentFolder;
            let folder = this.folders[this.currentFolder];
            if(folder.isRemote){
                this.syncToFirebase(imageItem);
            }
        }
        
        // Save to localStorage
        const storageKey = `inventory_${fileName}`;
        localStorage.setItem(storageKey, JSON.stringify(imageItem));
        
        // Update items cache
        this.items[fileName] = imageItem;

        // Show success notification
        this.showNotification(`Image "${fileName}" added to inventory`);
        
        // Re-render
        this.render();
    }
    
    /**
     * Select an inventory item
     */
    selectItem(itemName) {
        if (this.selectedItem === itemName) {
            // Deselect if clicking the same item
            this.selectedItem = null;
            this.hidePreview();
        } else {
            this.selectedItem = itemName;
            this.showPreview(itemName);
        }
        this.render();
    }
    
    /**
     * Export the selected item as JSON
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
        this.showNotification(`Exported "${item.name}" as JSON`);
    }
    
    /**
     * Show preview pane with item details
     */
    showPreview(itemName) {
        const item = this.items[itemName];
        if (!item || !this.previewPane) return;
        
        // Generate preview content
        const previewContent = this.generatePreviewContent(item);
        this.previewPane.innerHTML = previewContent;
        this.previewPane.style.display = 'block';
        
        // Add close button listener
        const closeBtn = this.previewPane.querySelector('.preview-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.selectedItem = null;
                this.hidePreview();
                this.render();
            });
        }
        
        // Add edit button listener for scripts
        const editBtn = this.previewPane.querySelector('.edit-script-preview-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openScriptEditor(itemName);
            });
        }
        
        // Add copy image URL button listener
        const copyUrlBtn = this.previewPane.querySelector('.copy-image-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                const url = copyUrlBtn.dataset.url;
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Image URL copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy URL:', err);
                    this.showNotification('Failed to copy URL');
                });
            });
        }
        
        // Add open image button listener
        const openImageBtn = this.previewPane.querySelector('.open-image-btn');
        if (openImageBtn) {
            openImageBtn.addEventListener('click', () => {
                const url = openImageBtn.dataset.url;
                window.open(url, '_blank');
            });
        }
        
        // Add description textarea listener
        const descriptionTextarea = this.previewPane.querySelector('.description-textarea');
        if (descriptionTextarea) {
            // Save description on blur
            descriptionTextarea.addEventListener('blur', () => {
                this.updateItemDescription(itemName, descriptionTextarea.value);
            });
            
            // Also save on Enter key (with Shift+Enter for new line)
            descriptionTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    descriptionTextarea.blur();
                }
            });
        }
        
        // Add editable name listener
        const editableName = this.previewPane.querySelector('.editable-name');
        if (editableName) {
            const originalName = itemName;
            
            // Prevent line breaks in name
            editableName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    editableName.blur();
                }
                // Escape key to cancel edit
                if (e.key === 'Escape') {
                    e.preventDefault();
                    editableName.textContent = originalName;
                    editableName.blur();
                }
            });
            
            // Save name on blur
            editableName.addEventListener('blur', () => {
                const newName = editableName.textContent.trim();
                if (newName && newName !== originalName) {
                    this.renameItem(originalName, newName);
                } else if (!newName) {
                    // Restore original name if empty
                    editableName.textContent = originalName;
                }
            });
            
            // Select all text on focus for easier editing
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
     * Generate preview content HTML
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
            // Entity preview - show full JSON
            const entity = item.data;
            
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
                </div>
                <div class="preview-meta">
                    <div class="meta-label">Description:</div>
                    <textarea class="description-textarea" data-item-name="${item.name}" placeholder="Enter a description...">${this.escapeHtml(description)}</textarea>
                </div>
                <div class="preview-content">
                    <h3>Entity Data</h3>
                    <div class="json-viewer">
                        ${this.renderJsonTree(entity, 'entity-data')}
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
     * Escape HTML for safe display
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
     * Load entity to scene by name
     */
    async loadEntityToSceneByName(itemName) {
        // Update last_used timestamp
        this.updateLastUsed(itemName);
        
        let change = new LoadItemChange(itemName, SM.selectedEntity, null, {source: 'ui'})
        await changeManager.applyChange(change);
        this.showNotification(`Adding "${itemName}" to scene..`);
    }
    
    /**
     * Update last_used timestamp for an item
     */
    updateLastUsed(itemName) {
        const item = this.items[itemName];
        if (item) {
            item.last_used = Date.now();
            const storageKey = `inventory_${itemName}`;
            localStorage.setItem(storageKey, JSON.stringify(item));
            this.items[itemName] = item;
        }
        this.render();
        console.log("SIJODAS")
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
            this.showNotification(`Description updated for "${itemName}"`);
        }
    }
    
    /**
     * Rename an inventory item
     */
    renameItem(oldName, newName) {
        const item = this.items[oldName];
        if (!item) return;
        
        // Show warning about broken references for entities
        const warningMessage = item.itemType === 'entity' 
            ? `<strong>Warning:</strong> Renaming "${oldName}" to "${newName}" may break existing references in scripts or other entities that depend on this name.<br><br>Any code using <code>SM.findEntityByName("${oldName}")</code> or similar references will need to be updated.<br><br>Do you want to continue?`
            : `<strong>Warning:</strong> Renaming "${oldName}" to "${newName}" may affect other items that reference this script.<br><br>Do you want to continue?`;
        
        this.showRenameWarningModal(
            warningMessage,
            () => {
                // User confirmed, now check for naming conflicts
                if (this.items[newName] && newName !== oldName) {
                    this.showConfirmModal(
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
     * Finalize the rename operation
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
        this.render();
        this.showPreview(newName);
        
        this.showNotification(`Renamed "${oldName}" to "${newName}"`);
    }

    async loadByCMD(itemName){
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
     * Open script editor for a script item
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
     * Create a new script
     */
    async createNewScript() {
        // Show modal for script name input
        this.showScriptNameModal();
    }
    
    /**
     * Show modal for script name input
     */
    showScriptNameModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = 'scriptNameModal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
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
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus on input
        const input = modalContent.querySelector('#scriptNameInput');
        setTimeout(() => input.focus(), 100);
        
        // Setup event listeners
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const createBtn = modalContent.querySelector('#modalCreateBtn');
        const errorDiv = modalContent.querySelector('#modalError');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        const handleCreate = () => {
            const scriptName = input.value.trim();
            
            if (!scriptName) {
                errorDiv.textContent = 'Please enter a script name';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Ensure it ends with .js
            const finalName = scriptName.endsWith('.js') ? scriptName : scriptName + '.js';
            
            // Check if name conflicts with existing script
            if (this.items[finalName]) {
                this.showOverwriteModal(finalName, () => {
                    closeModal();
                    this.finalizeScriptCreation(finalName);
                });
            } else {
                closeModal();
                this.finalizeScriptCreation(finalName);
            }
        };
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        createBtn.addEventListener('click', handleCreate);
        
        // Enter key to create
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleCreate();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Show overwrite confirmation modal
     */
    showOverwriteModal(fileName, onConfirm) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-confirm';
        
        modalContent.innerHTML = `
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
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Setup event listeners
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const overwriteBtn = modalContent.querySelector('#modalOverwriteBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        cancelBtn.addEventListener('click', closeModal);
        overwriteBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Create a new folder
     */
    createNewFolder() {
        this.showFolderNameModal((folderName) => {
            if (!folderName || folderName.trim() === '') return;
            
            // Validate folder name for Firebase compliance
            if (!this.isValidFirebasePath(folderName)) {
                this.showNotification('Folder name cannot contain: . $ # [ ] / or be empty');
                return;
            }
            
            // Sanitize the folder name
            const sanitizedName = this.sanitizeFirebasePath(folderName);
            
            let change = new CreateFolderChange(sanitizedName, this.currentFolder, {source: 'ui'});
            changeManager.applyChange(change);
            
            // Re-render
            this.render();
            
            this.showNotification(`Created folder "${sanitizedName}"`);
        });
    }
    
    /**
     * Open a folder
     */
    openFolder(folderName) {
        // Update last_used timestamp for folder
        this.updateFolderLastUsed(folderName);
        
        this.currentFolder = folderName;
        this.selectedItem = null;
        this.hidePreview();
        this.render();
    }
    
    /**
     * Update last_used timestamp for a folder
     */
    updateFolderLastUsed(folderName) {
        const folder = this.folders[folderName];
        if (folder) {
            folder.last_used = Date.now();
            const storageKey = `inventory_folder_${folderName}`;
            localStorage.setItem(storageKey, JSON.stringify(folder));
            this.folders[folderName] = folder;
        }
    }
    
    /**
     * Navigate to folder (from breadcrumb)
     */
    navigateToFolder(folderPath) {
        this.currentFolder = folderPath || null;
        this.selectedItem = null;
        this.hidePreview();
        this.render();
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
        this.render();
    }
    
    /**
     * Move item to folder
     */
    async moveItemToFolder(itemName, folderName) {
        let change = new MoveItemDirectoryChange(itemName, folderName, {source: 'ui'});
        let outcome = await changeManager.applyChange(change);
        if(!outcome) return;
        this.render();
        if (folderName) {
            this.showNotification(`Moved "${itemName}" to folder "${this.folders[folderName].name}"`);
        } else {
            this.showNotification(`Moved "${itemName}" to root`);
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
            this.showConfirmModal(
                `Folder "${folder.name}" contains items. Delete anyway?`,
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
     * Finalize removing folder after confirmation
     */
    finalizeRemoveFolder(folderName, folder) {
        let change = new RemoveFolderChange(folderName, {source: 'ui'});
        changeManager.applyChange(change);
        this.render();
        this.showNotification(`Removed folder "${folder.name}"`);
    }
    
    /**
     * Finalize script creation after name validation
     */
    finalizeScriptCreation(finalName) {
        // Default script template
        let change = new CreateScriptItemChange(finalName, {source: 'ui'});
        changeManager.applyChange(change);
        
        // Re-render
        this.render();
        
        // Show success message
        this.showNotification(`Created new script "${finalName}"`);
        
        // Open the script editor immediately
        this.openScriptEditor(finalName);
    }
    
    /**
     * Show rename modal for duplicate item names
     */
    showRenameModal(originalName, onConfirm) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Duplicate Name</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <p>An item named "<strong>${originalName}</strong>" already exists in your inventory.</p>
                <label for="newNameInput">Enter a new name:</label>
                <input type="text" id="newNameInput" value="${originalName}" autocomplete="off">
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-confirm-btn" id="modalConfirmBtn">Save</button>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus and select input
        const input = modalContent.querySelector('#newNameInput');
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
        
        // Setup event listeners
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const confirmBtn = modalContent.querySelector('#modalConfirmBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        const handleConfirm = () => {
            const newName = input.value.trim();
            closeModal();
            onConfirm(newName);
        };
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', handleConfirm);
        
        // Enter key to confirm
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Show folder name modal
     */
    showFolderNameModal(onConfirm) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Create New Folder</h3>
                <button class="modal-close-btn" id="modalCloseBtn">×</button>
            </div>
            <div class="modal-body">
                <label for="folderNameInput">Folder Name:</label>
                <input type="text" id="folderNameInput" placeholder="New Folder" autocomplete="off">
                <div class="modal-hint">Enter a name for your folder (cannot contain: . $ # [ ] /)</div>
                <div class="modal-error" id="modalError" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-cancel-btn" id="modalCancelBtn">Cancel</button>
                <button class="modal-create-btn" id="modalCreateBtn">Create Folder</button>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus on input
        const input = modalContent.querySelector('#folderNameInput');
        setTimeout(() => input.focus(), 100);
        
        // Setup event listeners
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const createBtn = modalContent.querySelector('#modalCreateBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        const handleCreate = () => {
            const folderName = input.value.trim();
            const errorDiv = modalContent.querySelector('#modalError');
            
            // Validate folder name
            if (!folderName) {
                errorDiv.textContent = 'Please enter a folder name';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Check for invalid characters
            const invalidChars = /[\.\$#\[\]\/]/;
            if (invalidChars.test(folderName)) {
                errorDiv.textContent = 'Folder name cannot contain: . $ # [ ] /';
                errorDiv.style.display = 'block';
                return;
            }
            
            closeModal();
            onConfirm(folderName);
        };
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        createBtn.addEventListener('click', handleCreate);
        
        // Enter key to create
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleCreate();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Show rename warning modal
     */
    showRenameWarningModal(message, onConfirm, onCancel) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-warning';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>⚠️ Rename Warning</h3>
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
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content modal-confirm';
        
        modalContent.innerHTML = `
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
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Setup event listeners
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const confirmBtn = modalContent.querySelector('#modalConfirmBtn');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
        
        // ESC key to close
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }
    
    /**
     * Sanitize a string to be Firebase path compliant
     * Firebase paths cannot contain: . $ # [ ] /
     * Also removes leading/trailing whitespace and replaces spaces with underscores
     */
    sanitizeFirebasePath(str) {
        if (!str) return '';
        
        // Replace invalid characters with underscores
        return str
            .trim()
            .replace(/[\.\$#\[\]\/]/g, '_')
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_{2,}/g, '_') // Replace multiple underscores with single
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    }
    
    /**
     * Validate if a folder name is Firebase compliant
     */
    isValidFirebasePath(str) {
        // Check if string contains any invalid characters
        const invalidChars = /[\.\$#\[\]\/]/;
        return str && str.trim().length > 0 && !invalidChars.test(str);
    }
    
    /**
     * Calculate the size of an item or folder and its contents
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
     * Get all items and folders in the current view
     */
    getCurrentViewContents() {
        const contents = {
            items: {},
            folders: {}
        };
        
        // Get items in current folder
        Object.entries(this.items).forEach(([key, item]) => {
            if ((item.folder || null) === this.currentFolder) {
                contents.items[key] = item;
            }
        });
        
        // Get folders in current folder
        Object.entries(this.folders).forEach(([key, folder]) => {
            if (folder.parent === this.currentFolder) {
                contents.folders[key] = folder;
            }
        });
        
        return contents;
    }
    
    /**
     * Get all contents recursively from a folder
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
    
    /**
     * Make items remote - upload to Firebase
     */
    async makeRemote() {
        if (!SM.scene?.localUser?.name) {
            this.showNotification('User not logged in. Cannot upload to Firebase.');
            return;
        }
        
        const userName = this.sanitizeFirebasePath(SM.scene.localUser.name);
        const contents = this.getCurrentViewContents();
        let totalSize = 0;
        
        // Calculate total size
        Object.keys(contents.items).forEach(itemName => {
            totalSize += this.calculateSize(itemName, false);
        });
        
        Object.keys(contents.folders).forEach(folderName => {
            totalSize += this.calculateSize(folderName, true);
        });
        
        // Check if total size exceeds 1MB
        const oneMB = 1024 * 1024;
        if (totalSize > oneMB) {
            this.showNotification(`Total size (${(totalSize / oneMB).toFixed(2)}MB) exceeds 1MB limit.`);
            return;
        }
        
        // Show confirmation modal
        const itemCount = Object.keys(contents.items).length;
        const folderCount = Object.keys(contents.folders).length;
        const sizeInMB = (totalSize / oneMB).toFixed(2);
        
        this.showConfirmModal(
            `Upload ${itemCount} items and ${folderCount} folders (${sizeInMB}MB) to Firebase?`,
            async () => {
                await this.uploadToFirebase(contents, userName);
            },
            'Upload to Firebase'
        );
    }
    
    /**
     * Upload contents to Firebase
     */
    async uploadToFirebase(contents, userName) {
        try {
            // Initialize Firebase if not already done
            if (!window.firebase || !window.firebase.database) {
                this.showNotification('Firebase not initialized. Please check configuration.');
                return;
            }
            
            const db = window.firebase.database();
            const basePath = `inventory/${userName}`;
            
            // Upload items
            for (const [itemName, item] of Object.entries(contents.items)) {
                const sanitizedItemName = this.sanitizeFirebasePath(itemName);
                const sanitizedCurrentFolder = this.currentFolder ? this.sanitizeFirebasePath(this.currentFolder) : null;
                const itemPath = sanitizedCurrentFolder 
                    ? `${basePath}/${sanitizedCurrentFolder}/${sanitizedItemName}`
                    : `${basePath}/${sanitizedItemName}`;
                
                await db.ref(itemPath).set(item);
            }
            
            // Upload folders and their contents recursively
            for (const [folderName, folder] of Object.entries(contents.folders)) {
                const sanitizedFolderName = this.sanitizeFirebasePath(folderName);
                const sanitizedCurrentFolder = this.currentFolder ? this.sanitizeFirebasePath(this.currentFolder) : null;
                const folderPath = sanitizedCurrentFolder
                    ? `${basePath}/${sanitizedCurrentFolder}/${sanitizedFolderName}`
                    : `${basePath}/${sanitizedFolderName}`;
                
                // Upload folder metadata
                await db.ref(`${folderPath}/_folder`).set(folder);
                
                // Get and upload folder contents recursively
                const folderContents = this.getFolderContentsRecursive(folderName);
                
                // Upload items in folder
                for (const [itemName, item] of Object.entries(folderContents.items)) {
                    const sanitizedItemName = this.sanitizeFirebasePath(itemName);
                    const sanitizedItemFolder = item.folder ? this.sanitizeFirebasePath(item.folder) : null;
                    const itemPath = sanitizedItemFolder
                        ? `${basePath}/${sanitizedItemFolder}/${sanitizedItemName}`
                        : `${folderPath}/${sanitizedItemName}`;
                    
                    await db.ref(itemPath).set(item);
                }
                
                // Upload subfolders
                for (const [subfolderName, subfolder] of Object.entries(folderContents.folders)) {
                    const sanitizedSubfolderName = this.sanitizeFirebasePath(subfolderName);
                    const sanitizedParent = subfolder.parent ? this.sanitizeFirebasePath(subfolder.parent) : null;
                    const subfolderPath = sanitizedParent
                        ? `${basePath}/${sanitizedParent}/${sanitizedSubfolderName}`
                        : `${folderPath}/${sanitizedSubfolderName}`;
                    
                    await db.ref(`${subfolderPath}/_folder`).set(subfolder);
                }
            }
            
            // Mark uploaded folders as remote
            for (const folderName of Object.keys(contents.folders)) {
                if (this.folders[folderName]) {
                    this.folders[folderName].remote = true;
                    // Update localStorage
                    const storageKey = `inventory_folder_${folderName}`;
                    localStorage.setItem(storageKey, JSON.stringify(this.folders[folderName]));
                }
            }
            
            // Mark current folder as remote if we're in a folder
            if (this.currentFolder && this.folders[this.currentFolder]) {
                this.folders[this.currentFolder].remote = true;
                const storageKey = `inventory_folder_${this.currentFolder}`;
                localStorage.setItem(storageKey, JSON.stringify(this.folders[this.currentFolder]));
            } else {
                // Mark root as remote
                const rootRemoteKey = `inventory_root_remote_${userName}`;
                localStorage.setItem(rootRemoteKey, 'true');
            }
            
            this.showNotification('Successfully uploaded to Firebase!');
            
            // Re-render to show the new remote status
            this.render();
            
            // Setup Firebase listeners for the newly remote folders
            this.setupFirebaseListeners();
            
        } catch (error) {
            console.error('Firebase upload error:', error);
            this.showNotification(`Upload failed: ${error.message}`);
        }
    }
    
    /**
     * Show import from Firebase modal
     */
    showImportFirebaseModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
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
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Focus on input
        const input = modalContent.querySelector('#firebaseRefInput');
        setTimeout(() => input.focus(), 100);
        
        // Setup event listeners
        const closeBtn = modalContent.querySelector('#modalCloseBtn');
        const cancelBtn = modalContent.querySelector('#modalCancelBtn');
        const importBtn = modalContent.querySelector('#modalImportBtn');
        const errorDiv = modalContent.querySelector('#modalError');
        
        const closeModal = () => {
            modalOverlay.remove();
        };
        
        const handleImport = async () => {
            const firebaseRef = input.value.trim();
            
            if (!firebaseRef) {
                errorDiv.textContent = 'Please enter a Firebase reference';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Validate format - should start with "inventory/"
            if (!firebaseRef.startsWith('inventory/')) {
                errorDiv.textContent = 'Reference must start with "inventory/"';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Show loading state
            importBtn.textContent = 'Importing...';
            importBtn.disabled = true;
            
            try {
                const success = await this.importFromFirebase(firebaseRef);
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
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        importBtn.addEventListener('click', handleImport);
        
        // Enter key to import
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleImport();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    /**
     * Import inventory items from Firebase reference
     */
    async importFromFirebase(firebaseRef) {
        if (!window.firebase || !window.firebase.database) {
            this.showNotification('Firebase not initialized');
            return false;
        }
        
        try {
            const db = window.firebase.database();
            const snapshot = await db.ref(firebaseRef).once('value');
            
            if (!snapshot.exists()) {
                return false;
            }
            
            const data = snapshot.val();
            let importedCount = 0;
            
            // Extract the folder name from the Firebase path
            const pathParts = firebaseRef.split('/');
            const importedFolderName = pathParts[pathParts.length - 1];
            
            // Check if we're importing a single folder with _folder metadata
            const isSingleFolder = data._folder && typeof data._folder === 'object';
            
            // Determine if this looks like a folder (has items with itemType or nested folders)
            const hasInventoryContent = Object.entries(data).some(([key, value]) => 
                key !== '_folder' && (value.itemType || value._folder)
            );
            
            if (isSingleFolder || hasInventoryContent) {
                // We're importing a folder - create it first
                let containerFolderName = importedFolderName;
                let counter = 1;
                
                // Generate unique folder name if conflict exists
                while (this.folders[containerFolderName]) {
                    containerFolderName = `${importedFolderName}_imported_${counter}`;
                    counter++;
                }
                
                // Create the container folder
                const containerFolder = {
                    name: containerFolderName,
                    created: Date.now(),
                    parent: this.currentFolder,
                    itemType: "folder",
                    remote: true,
                    imported: true,
                    importedFrom: firebaseRef
                };
                
                // Save container folder to localStorage
                const folderStorageKey = `inventory_folder_${containerFolderName}`;
                localStorage.setItem(folderStorageKey, JSON.stringify(containerFolder));
                this.folders[containerFolderName] = containerFolder;
                importedCount++;
                
                // Now import all contents into this folder
                await this.importFolderContents(data, containerFolderName, firebaseRef);
                
                // Count imported items
                const itemsInFolder = Object.values(this.items).filter(item => 
                    item.folder === containerFolderName || 
                    (item.folder && item.folder.startsWith(containerFolderName + '/'))
                ).length;
                
                const foldersInFolder = Object.values(this.folders).filter(folder => 
                    folder.parent === containerFolderName ||
                    (folder.parent && folder.parent.startsWith(containerFolderName + '/'))
                ).length;
                
                importedCount += itemsInFolder + foldersInFolder;
                
            } else {
                // Direct items import (backward compatibility)
                for (const [key, value] of Object.entries(data)) {
                    if (key === '_folder') continue;
                    
                    if (value.itemType) {
                        const itemName = value.name || key;
                        let finalItemName = itemName;
                        let counter = 1;
                        while (this.items[finalItemName]) {
                            finalItemName = `${itemName}_imported_${counter}`;
                            counter++;
                        }
                        
                        const item = {
                            ...value,
                            folder: this.currentFolder,
                            imported: true,
                            remote: true,
                            importedFrom: firebaseRef,
                            importedAt: Date.now()
                        };
                        
                        const storageKey = `inventory_${finalItemName}`;
                        localStorage.setItem(storageKey, JSON.stringify(item));
                        this.items[finalItemName] = item;
                        importedCount++;
                    }
                }
            }
            
            if (importedCount > 0) {
                // Reload and re-render
                this.reload();
                this.showNotification(`Successfully imported ${importedCount} item(s)`);
                
                // Setup Firebase listeners for imported remote folders
                this.setupFirebaseListeners();
                
                return true;
            } else {
                this.showNotification('No new items to import');
                return false;
            }
            
        } catch (error) {
            console.error('Firebase import error:', error);
            this.showNotification(`Import failed: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Import folder contents recursively
     */
    async importFolderContents(data, parentFolderName, firebaseRef) {
        for (const [key, value] of Object.entries(data)) {
            // Skip the _folder metadata
            if (key === '_folder') continue;
            
            // Check if it's a subfolder
            if (value._folder) {
                const folderData = value._folder;
                const folderName = folderData.name || key;
                
                // Create full folder path
                const fullFolderName = `${parentFolderName}/${folderName}`;
                
                // Check if folder already exists
                if (!this.folders[fullFolderName]) {
                    const folder = {
                        ...folderData,
                        name: folderName,
                        parent: parentFolderName,
                        remote: true,
                        imported: true,
                        importedFrom: firebaseRef
                    };
                    
                    const storageKey = `inventory_folder_${fullFolderName}`;
                    localStorage.setItem(storageKey, JSON.stringify(folder));
                    this.folders[fullFolderName] = folder;
                    
                    // Recursively import subfolder contents
                    await this.importFolderContents(value, fullFolderName, firebaseRef);
                }
            } else if (value.itemType) {
                // It's an item
                const itemName = value.name || key;
                let finalItemName = itemName;
                let counter = 1;
                
                // Check for conflicts in the target folder
                while (this.items[finalItemName] && this.items[finalItemName].folder === parentFolderName) {
                    finalItemName = `${itemName}_imported_${counter}`;
                    counter++;
                }
                
                const item = {
                    ...value,
                    name: finalItemName,
                    folder: parentFolderName,
                    imported: true,
                    remote: true,
                    importedFrom: firebaseRef,
                    importedAt: Date.now()
                };
                
                const storageKey = `inventory_${finalItemName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                this.items[finalItemName] = item;
            }
        }
    }
    
}