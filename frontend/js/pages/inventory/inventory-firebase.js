
/**
 * InventoryFirebase - Handles all Firebase/remote storage operations for the inventory
 */
export class InventoryFirebase {
    constructor(inventory) {
        this.inventory = inventory;
        this.firebaseListeners = new Map();
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
        Object.entries(this.inventory.folders).forEach(([folderName, folder]) => {
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
        console.log("[SETUP FOLDER LISTENER for folder: ", folderName, "]")
        if (!window.networking || !window.networking.getDatabase) return;
        
        try {
            const db = window.networking.getDatabase();
            let firebasePath = null;
            if(folder.importedFrom !== undefined){
                firebasePath = folder.importedFrom;
            }else{
                let userName = SM.scene?.localUser?.name;
                if(!userName){
                    console.log("no user name found, waiting for 1 second")
                    setTimeout(()=>{
                        this.setupFolderListener(folderName, folder);
                    }, 100);
                    return;
                }
                userName = this.sanitizeFirebasePath(userName);
                firebasePath = `inventory/${userName}`;
                if (folder.parent) {
                    const sanitizedParent = this.sanitizeFirebasePath(folder.parent);
                    firebasePath += `/${sanitizedParent}`;
                }
                const sanitizedFolderName = this.sanitizeFirebasePath(folderName);
                firebasePath += `/${sanitizedFolderName}`;
            }
            
            
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
     * Handle Firebase item added event
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
            if (!this.inventory.folders[fullFolderName]) {
                const folder = {
                    ...data._folder,
                    name: subfolderName,
                    parent: folderName,
                    remote: true
                };
                
                // Save to localStorage
                const storageKey = `inventory_folder_${fullFolderName}`;
                localStorage.setItem(storageKey, JSON.stringify(folder));
                this.inventory.folders[fullFolderName] = folder;
                
                // Setup listener for the new remote folder
                this.setupFolderListener(fullFolderName, folder);
                
                console.log('Remote folder added:', fullFolderName);
                this.inventory.ui.render();
            }
        } else if (data.itemType) {
            // It's an item
            const itemName = data.name || key;
            
            // Check if item already exists locally
            if (!this.inventory.items[itemName]) {
                const item = {
                    ...data,
                    folder: folderName
                };
                
                // Save to localStorage
                const storageKey = `inventory_${itemName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                this.inventory.items[itemName] = item;
                
                console.log('Remote item added:', itemName);
                showNotification(`New item "${itemName}" added from remote`);
                this.inventory.ui.render();
            }
        }
    }

    /**
     * Handle Firebase item removed event
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
            if (this.inventory.folders[fullFolderName]) {
                // Remove all items in the folder
                Object.entries(this.inventory.items).forEach(([itemKey, item]) => {
                    if (item.folder === fullFolderName) {
                        const storageKey = `inventory_${itemKey}`;
                        localStorage.removeItem(storageKey);
                        delete this.inventory.items[itemKey];
                    }
                });
                
                // Remove the folder
                const storageKey = `inventory_folder_${fullFolderName}`;
                localStorage.removeItem(storageKey);
                delete this.inventory.folders[fullFolderName];
                
                console.log('Remote folder removed:', fullFolderName);
                this.inventory.ui.render();
            }
        } else if (data && data.itemType) {
            // It's an item
            const itemName = data.name || key;
            
            // Remove item locally if it exists
            if (this.inventory.items[itemName]) {
                const storageKey = `inventory_${itemName}`;
                localStorage.removeItem(storageKey);
                delete this.inventory.items[itemName];
                
                console.log('Remote item removed:', itemName);
                showNotification(`Item "${itemName}" removed from remote`);
                this.inventory.ui.render();
            }
        }
    }

    /**
     * Handle Firebase item changed event
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
            if (this.inventory.items[itemName]) {
                const item = {
                    ...data,
                    folder: folderName
                };
                
                // Save to localStorage
                const storageKey = `inventory_${itemName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                this.inventory.items[itemName] = item;
                
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
                if (this.inventory.selectedItem === itemName) {
                    this.inventory.ui.showPreview(itemName);
                }
                
                this.inventory.ui.render();
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
     * Check if current folder is remote
     */
    async checkRemoteStatus() {
        if (this.inventory.currentFolder) {
            // Check if current folder has remote attribute set to true
            const folder = this.inventory.folders[this.inventory.currentFolder];
            this.inventory.isRemote = folder && folder.remote;
        } else {
            // For root directory, check localStorage flag
            const rootRemoteKey = `inventory_root_remote_${this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default')}`;
            this.inventory.isRemote = localStorage.getItem(rootRemoteKey) === 'true';
        }
    }

    /**
     * Copy Firebase reference to clipboard
     */
    async copyFirebaseRef() {
        const firebasePath = this.getCurrentFirebasePath();
        if (!firebasePath) {
            showNotification('Unable to get Firebase path');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(firebasePath);
            showNotification('Firebase path copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            showNotification('Failed to copy path');
        }
    }

    /**
     * Get current Firebase path
     */
    getCurrentFirebasePath() {
        if (!SM.scene?.localUser?.name) return null;
        
        const userName = this.sanitizeFirebasePath(SM.scene.localUser.name);
        const basePath = `inventory/${userName}`;
        
        if (this.inventory.currentFolder) {
            const sanitizedFolder = this.sanitizeFirebasePath(this.inventory.currentFolder); //TODO: Math this path
            return `${basePath}/${sanitizedFolder}`;
        }
        
        return basePath;
    }

    /**
     * Sync item to Firebase
     */
    async syncToFirebase(inventoryItem) {
        // Check if item is in a remote folder or root is remote
        const isRemote = this.isItemInRemoteLocation();
        if (!isRemote) return;

        if (!window.networking) {
            console.warn('Networking not initialized, skipping sync');
            return;
        }

        try {
            const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            
            // Build the Firebase path
            let firebasePath = `inventory/${userName}`;
            if (inventoryItem.folder) {
                const sanitizedFolder = this.sanitizeFirebasePath(inventoryItem.folder);
                firebasePath += `/${sanitizedFolder}`;
            }
            const sanitizedItemName = this.sanitizeFirebasePath(inventoryItem.name);
            firebasePath += `/${sanitizedItemName}`;
            
            // Save to Firebase
            await window.networking.setData(firebasePath, inventoryItem);
            console.log('Item synced to Firebase:', firebasePath);
        } catch (error) {
            console.error('Failed to sync item to Firebase:', error);
        }
    }

    /**
     * Check if item is in remote location
     */
    isItemInRemoteLocation(item) {
        let folder = (item && item.folder)? item.folder : this.inventory.currentFolder;
        if (folder) {
            const folderData = this.inventory.folders[folder];
            return folderData && folderData.remote;
        } 
        return false;
    }

    /**
     * Make current location remote - upload to Firebase
     */
    async makeRemote() {
        if (!SM.scene?.localUser?.name) {
            showNotification('User not logged in. Cannot upload to Firebase.');
            return;
        }
        
        const userName = this.sanitizeFirebasePath(SM.scene.localUser.name);
        const contents = this.inventory.getCurrentViewContents();
        let totalSize = 0;
        
        // Calculate total size
        Object.keys(contents.items).forEach(itemName => {
            totalSize += this.inventory.calculateSize(itemName, false);
        });
        
        Object.keys(contents.folders).forEach(folderName => {
            totalSize += this.inventory.calculateSize(folderName, true);
        });
        
    
         // Check if total size exceeds 1MB
         const oneMB = 1024 * 1024;
         if (totalSize > oneMB) {
             showNotification(`Total size (${(totalSize / oneMB).toFixed(2)}MB) exceeds 1MB limit.`);
             return;
         }

        // Show confirmation modal
        const itemCount = Object.keys(contents.items).length;
        const folderCount = Object.keys(contents.folders).length;
        const sizeInMB = (totalSize / oneMB).toFixed(2);
        
        this.inventory.ui.showConfirmModal(
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
                showNotification('Firebase not initialized. Please check configuration.');
                return;
            }
            
            const db = window.firebase.database();
            const basePath = `inventory/${userName}`;
            
            // Upload items
            for (const [itemName, item] of Object.entries(contents.items)) {
                const sanitizedItemName = this.sanitizeFirebasePath(itemName);
                const sanitizedCurrentFolder = this.inventory.currentFolder ? this.sanitizeFirebasePath(this.inventory.currentFolder) : null;
                const itemPath = sanitizedCurrentFolder 
                    ? `${basePath}/${sanitizedCurrentFolder}/${sanitizedItemName}`
                    : `${basePath}/${sanitizedItemName}`;
                
                await db.ref(itemPath).set(item);
            }
            
            // Upload folders and their contents recursively
            for (const [folderName, folder] of Object.entries(contents.folders)) {
                const sanitizedFolderName = this.sanitizeFirebasePath(folderName);
                const sanitizedCurrentFolder = this.inventory.currentFolder ? this.sanitizeFirebasePath(this.inventory.currentFolder) : null;
                const folderPath = sanitizedCurrentFolder
                    ? `${basePath}/${sanitizedCurrentFolder}/${sanitizedFolderName}`
                    : `${basePath}/${sanitizedFolderName}`;
                
                // Upload folder metadata
                await db.ref(`${folderPath}/_folder`).set(folder);
                
                // Get and upload folder contents recursively
                const folderContents = this.inventory.getFolderContentsRecursive(folderName);
                
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
                if (this.inventory.folders[folderName]) {
                    this.inventory.folders[folderName].remote = true;
                    // Update localStorage
                    const storageKey = `inventory_folder_${folderName}`;
                    localStorage.setItem(storageKey, JSON.stringify(this.inventory.folders[folderName]));
                }
            }
            
            // Mark current folder as remote if we're in a folder
            if (this.inventory.currentFolder && this.inventory.folders[this.inventory.currentFolder]) {
                this.inventory.folders[this.inventory.currentFolder].remote = true;
                const storageKey = `inventory_folder_${this.inventory.currentFolder}`;
                localStorage.setItem(storageKey, JSON.stringify(this.inventory.folders[this.inventory.currentFolder]));
            } else {
                // Mark root as remote
                const rootRemoteKey = `inventory_root_remote_${userName}`;
                localStorage.setItem(rootRemoteKey, 'true');
            }
            
            showNotification('Successfully uploaded to Firebase!');
            this.inventory.ui.render();
            this.setupFirebaseListeners();
            
        } catch (error) {
            console.error('Firebase upload error:', error);
            showNotification(`Upload failed: ${error.message}`);
        }
    }

    /**
     * Import from Firebase reference
     */
    async importFromFirebase(firebaseRef) {
        if (!window.firebase || !window.firebase.database) {
            showNotification('Firebase not initialized');
            return false;
        }
        
        try {
            const data = await networking.getData(firebaseRef);
            if(!data) return false;
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
                while (this.inventory.folders[containerFolderName]) {
                    containerFolderName = `${importedFolderName}_imported_${counter}`;
                    counter++;
                }
                
                // Create the container folder
                const containerFolder = {
                    name: containerFolderName,
                    created: Date.now(),
                    parent: this.inventory.currentFolder,
                    itemType: "folder",
                    icon:"📂",
                    remote: true,
                    imported: true,
                    importedFrom: firebaseRef
                };
                
                // Save container folder to localStorage
                const folderStorageKey = `inventory_folder_${containerFolderName}`;
                localStorage.setItem(folderStorageKey, JSON.stringify(containerFolder));
                this.inventory.folders[containerFolderName] = containerFolder;
                importedCount++;
                
                // Now import all contents into this folder
                await this.importFolderContents(data, containerFolderName, firebaseRef);
                
                // Count imported items
                const itemsInFolder = Object.values(this.inventory.items).filter(item => 
                    item.folder === containerFolderName || 
                    (item.folder && item.folder.startsWith(containerFolderName + '/'))
                ).length;
                
                const foldersInFolder = Object.values(this.inventory.folders).filter(folder => 
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
                        while (this.inventory.items[finalItemName]) {
                            finalItemName = `${itemName}_imported_${counter}`;
                            counter++;
                        }
                        
                        const item = {
                            ...value,
                            folder: this.inventory.currentFolder,
                            imported: true,
                            remote: true,
                            importedFrom: firebaseRef,
                            importedAt: Date.now()
                        };
                        
                        const storageKey = `inventory_${finalItemName}`;
                        localStorage.setItem(storageKey, JSON.stringify(item));
                        this.inventory.items[finalItemName] = item;
                        importedCount++;
                    }
                }
            }
            
            if (importedCount > 0) {
                // Reload and re-render
                this.inventory.reload();
                showNotification(`Successfully imported ${importedCount} item(s)`);
                
                // Setup Firebase listeners for imported remote folders
                this.setupFirebaseListeners();
                
                return true;
            } else {
                showNotification('No new items to import');
                return false;
            }
            
        } catch (error) {
            console.error('Firebase import error:', error);
            showNotification(`Import failed: ${error.message}`);
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
                if (!this.inventory.folders[fullFolderName]) {
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
                    this.inventory.folders[fullFolderName] = folder;
                    
                    // Recursively import subfolder contents
                    await this.importFolderContents(value, fullFolderName, firebaseRef);
                }
            } else if (value.itemType) {
                // It's an item
                const itemName = value.name || key;
                let finalItemName = itemName;
                let counter = 1;
                
                // Check for conflicts in the target folder
                while (this.inventory.items[finalItemName] && this.inventory.items[finalItemName].folder === parentFolderName) {
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
                this.inventory.items[finalItemName] = item;
            }
        }
    }

    /**
     * Upload image to Firebase storage
     */
    async uploadImageToFirebase(file) {
        try {
            // Show upload notification
            showNotification('Uploading image...');
            
            // Get Firebase Storage from networking module
            if (!window.networking || !window.networking.getStorage) {
                showNotification('Firebase Storage not initialized. Please wait and try again.');
                return;
            }
            
            const storage = window.networking.getStorage();
            if (!storage) {
                showNotification('Firebase Storage not available');
                return;
            }
            
            // Generate path similar to how entities would be stored
            const userName = this.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            const timestamp = Date.now();
            const fileName = file.name;
            const fileExt = fileName.split('.').pop().toLowerCase();
            const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
            
            // Create storage path: inventory/username/currentFolder/filename
            const storagePath = `inventory/${userName}/${this.inventory.currentFolder}/${fileName}`;
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
                icon:"🖼️",
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
                this.inventory.saveImageItem(fileName, imageItem);
            };
            img.onerror = () => {
                // Save anyway even if dimensions couldn't be loaded
                this.inventory.saveImageItem(fileName, imageItem);
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
            
            showNotification(errorMessage);
        }
    }

    /**
     * Sanitize string for Firebase path
     */
    sanitizeFirebasePath(str) {
        if (!str) return '';
        let clean = (str)=>{
            return str
            .trim()
            .replace(/[\.\$#\[\]\/]/g, '_')
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_{2,}/g, '_') // Replace multiple underscores with single
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
        }
        return str.split('/').map(clean).join('/');
    }

    /**
     * Check if string is valid Firebase path
     */
    isValidFirebasePath(str) {
        // Check if string contains any invalid characters
        const invalidChars = /[\.\$#\[\]\/]/;
        return str && str.trim().length > 0 && !invalidChars.test(str);
    }
}