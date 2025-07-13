let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { sceneManager } = await import(`${basePath}/scene-manager.js`);

export class Inventory {
    constructor() {
        this.container = document.getElementById('inventory-page');
        this.items = this.loadItems();
        this.selectedItem = null;
        this.setupDropZone();
        this.render();
    }
    
    /**
     * Setup drop zone for the inventory page
     */
    setupDropZone() {
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.container.classList.add('drag-over');
        });
        
        this.container.addEventListener('dragleave', (e) => {
            if (e.target === this.container) {
                this.container.classList.remove('drag-over');
            }
        });
        
        this.container.addEventListener('drop', async (e) => {
            e.preventDefault();
            this.container.classList.remove('drag-over');
            
            const slotId = e.dataTransfer.getData('text/plain');
            const slotData = e.dataTransfer.getData('application/json');
            
            if (slotData) {
                try {
                    const slot = JSON.parse(slotData);
                    await this.addItem(slot);
                } catch (error) {
                    console.error('Failed to parse slot data:', error);
                }
            }
        });
    }
    
    /**
     * Load items from localStorage
     */
    loadItems() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('inventory_')) {
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
     * Add item to inventory
     */
    async addItem(slot, itemType = 'slot') {
        let itemName = slot.name;
        const existingKeys = Object.keys(this.items);
        
        // Check if name already exists
        if (existingKeys.includes(itemName)) {
            // Prompt user for new name
            const newName = prompt(
                `An item named "${itemName}" already exists in your inventory. Please enter a new name:`,
                itemName
            );
            
            if (!newName || newName.trim() === '') {
                alert('Item not added to inventory - no name provided.');
                return;
            }
            
            // Check if new name also exists
            if (existingKeys.includes(newName.trim())) {
                alert(`An item named "${newName}" also exists. Please try again with a unique name.`);
                return;
            }
            
            itemName = newName.trim();
        }
        
        // Create inventory item
        const inventoryItem = {
            author: sceneManager.scene?.localUser?.name || 'Unknown',
            name: itemName,
            created: Date.now(),
            itemType: itemType,
            data: slot
        };
        
        // Save to localStorage
        const storageKey = `inventory_${itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(inventoryItem));
        
        // Update local items
        this.items[itemName] = inventoryItem;
        
        // Re-render
        this.render();
        
        // Show success message
        this.showNotification(`Added "${itemName}" to inventory`);
    }
    
    /**
     * Remove item from inventory
     */
    removeItem(itemName) {
        if (confirm(`Are you sure you want to remove "${itemName}" from your inventory?`)) {
            const storageKey = `inventory_${itemName}`;
            localStorage.removeItem(storageKey);
            delete this.items[itemName];
            this.render();
            this.showNotification(`Removed "${itemName}" from inventory`);
        }
    }
    
    /**
     * Render inventory items
     */
    render() {
        const inventoryContainer = this.container.querySelector('.inventory-container');
        
        if (Object.keys(this.items).length === 0) {
            inventoryContainer.innerHTML = `
                <div class="inventory-header">
                    <h2>Saved Items (0)</h2>
                    <div class="inventory-actions">
                        <button class="upload-button" id="uploadFileBtn">
                            <span class="upload-icon">⬇️</span>
                            Import File
                        </button>
                        <input type="file" id="fileInput" accept=".js,.json" style="display: none;">
                    </div>
                </div>
                <div class="inventory-empty">
                    <div class="empty-icon">📦</div>
                    <h3>Your inventory is empty</h3>
                    <p>Drag slots from the World Inspector or upload files to save them here</p>
                </div>
            `;
            
            // Add event listeners for file upload even in empty state
            const uploadBtn = inventoryContainer.querySelector('#uploadFileBtn');
            const fileInput = inventoryContainer.querySelector('#fileInput');
            
            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
            }
            
            return;
        }
        
        inventoryContainer.innerHTML = `
            <div class="inventory-header">
                <h2>Saved Items (${Object.keys(this.items).length})</h2>
                <div class="inventory-actions">
                    ${this.selectedItem ? `
                        <button class="export-button" id="exportBtn">
                            <span class="export-icon">⬆️</span>
                            Export
                        </button>
                    ` : ''}
                    <button class="upload-button" id="uploadFileBtn">
                        <span class="upload-icon">⬇️</span>
                        Import File
                    </button>
                    <input type="file" id="fileInput" accept=".js,.json" style="display: none;">
                </div>
            </div>
            <div class="inventory-grid">
                ${Object.entries(this.items).map(([key, item]) => this.renderItem(key, item)).join('')}
            </div>
        `;
        
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
            exportBtn.addEventListener('click', () => this.exportSelectedItem());
        }
    }
    
    /**
     * Render individual item
     */
    renderItem(key, item) {
        const componentCount = item.data.components ? item.data.components.length : 0;
        const childCount = item.data.children ? item.data.children.length : 0;
        const dateStr = new Date(item.created).toLocaleDateString();
        const itemType = item.itemType || 'slot'; // Default to 'slot' for backward compatibility
        const itemIcon = itemType === 'script' ? '📜' : '📦';
        const isSelected = this.selectedItem === key;
        
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
                </div>
                <div class="item-actions">
                    <button class="action-btn view-btn" onclick="inventory.viewItem('${key}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * View item details
     */
    viewItem(itemName) {
        const item = this.items[itemName];
        if (!item) return;
        
        console.log('Item details:', item);
        alert(`Item: ${item.name}\n\nFull details logged to console.`);
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
            const fileContent = await this.readFile(file);
            
            if (fileExt === 'js') {
                // Handle JavaScript files
                await this.handleScriptUpload(fileName, fileContent);
            } else if (fileExt === 'json') {
                // Handle JSON files
                await this.handleJsonUpload(fileName, fileContent);
            } else {
                alert('Please upload a .js or .json file');
            }
        } catch (error) {
            console.error('File upload error:', error);
            alert(`Error uploading file: ${error.message}`);
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
        const nameWithoutExt = fileName.replace(/\.js$/, '');
        const existingKeys = Object.keys(this.items);
        
        // Check for existing item
        if (existingKeys.includes(nameWithoutExt)) {
            const confirmed = confirm(
                `An item named "${nameWithoutExt}" already exists. Do you want to overwrite it?`
            );
            if (!confirmed) return;
        }
        
        // Create script item
        const scriptItem = {
            author: sceneManager.scene?.localUser?.name || 'Unknown',
            name: nameWithoutExt,
            created: Date.now(),
            itemType: 'script',
            data: content
        };
        
        // Save to localStorage
        const storageKey = `inventory_${nameWithoutExt}`;
        localStorage.setItem(storageKey, JSON.stringify(scriptItem));
        
        // Update local items
        this.items[nameWithoutExt] = scriptItem;
        
        // Re-render
        this.render();
        
        // Show success message
        this.showNotification(`Added script "${nameWithoutExt}" to inventory`);
    }
    
    /**
     * Handle JSON file upload
     */
    async handleJsonUpload(fileName, content) {
        try {
            const jsonData = JSON.parse(content);
            
            // Check if it's a slot inventory item format
            if (this.isInventorySlotFormat(jsonData)) {
                const itemName = jsonData.name;
                const existingKeys = Object.keys(this.items);
                
                // Check for existing item
                if (existingKeys.includes(itemName)) {
                    const confirmed = confirm(
                        `An item named "${itemName}" already exists. Do you want to overwrite it?`
                    );
                    if (!confirmed) return;
                }
                
                // Save directly as it's already in the correct format
                const storageKey = `inventory_${itemName}`;
                localStorage.setItem(storageKey, JSON.stringify(jsonData));
                
                // Update local items
                this.items[itemName] = jsonData;
                
                // Re-render
                this.render();
                
                // Show success message
                this.showNotification(`Imported "${itemName}" to inventory`);
            } else {
                alert('The JSON file is not in the correct inventory slot format');
            }
        } catch (error) {
            alert('Invalid JSON file');
        }
    }
    
    /**
     * Check if JSON data is in inventory slot format
     */
    isInventorySlotFormat(data) {
        return data && 
               typeof data === 'object' &&
               'author' in data &&
               'name' in data &&
               'created' in data &&
               'itemType' in data &&
               'data' in data;
    }
    
    /**
     * Select an inventory item
     */
    selectItem(itemName) {
        if (this.selectedItem === itemName) {
            // Deselect if clicking the same item
            this.selectedItem = null;
        } else {
            this.selectedItem = itemName;
        }
        this.render();
    }
    
    /**
     * Export the selected item as JSON
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
        this.showNotification(`Exported "${item.name}" as JSON`);
    }
}