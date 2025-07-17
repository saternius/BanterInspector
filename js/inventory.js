let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { sceneManager } = await import(`${basePath}/scene-manager.js`);
export class Inventory {
    constructor() {
        this.container = document.getElementById('inventory-page');
        this.previewPane = document.getElementById('previewPane');
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
                            Import
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
                    ${this.selectedItem && this.items[this.selectedItem]?.itemType !== 'script' ? `
                        <button class="add-to-scene-button" id="addToSceneBtn">
                            <span class="add-icon">➕</span>
                            Add to Scene
                        </button>
                    ` : ''}
                    ${this.selectedItem ? `
                        <button class="export-button" id="exportBtn">
                            <span class="export-icon">⬆️</span>
                            Export
                        </button>
                    ` : ''}
                    <button class="upload-button" id="uploadFileBtn">
                        <span class="upload-icon">⬇️</span>
                        Import
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
        
        // Add event listener for add to scene button
        const addToSceneBtn = inventoryContainer.querySelector('#addToSceneBtn');
        if (addToSceneBtn) {
            addToSceneBtn.addEventListener('click', () => this.loadSlotToScene());
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
        const existingKeys = Object.keys(this.items);
        
        // Check for existing item
        if (existingKeys.includes(fileName)) {
            const confirmed = confirm(
                `An item named "${fileName}" already exists. Do you want to overwrite it?`
            );
            if (!confirmed) return;
        }
        
        // Create script item
        const scriptItem = {
            author: sceneManager.scene?.localUser?.name || 'Unknown',
            name: fileName,
            created: Date.now(),
            itemType: 'script',
            data: content
        };
        
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
        const itemType = item.itemType || 'slot';
        
        if (itemType === 'script') {
            return `
                <div class="preview-header">
                    <h2>${item.name}</h2>
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
                <div class="preview-content">
                    <h3>Script Content</h3>
                    <pre class="script-preview"><code>${this.escapeHtml(item.data)}</code></pre>
                </div>
            `;
        } else {
            // Slot preview - show full JSON
            const slot = item.data;
            
            return `
                <div class="preview-header">
                    <h2>${item.name}</h2>
                    <button class="preview-close-btn">×</button>
                </div>
                <div class="preview-meta">
                    <div class="meta-item">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">Slot</span>
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
                <div class="preview-content">
                    <h3>Slot Data</h3>
                    <div class="json-viewer">
                        ${this.renderJsonTree(slot, 'slot-data')}
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
     * Load selected slot to scene
     */
    async loadSlotToScene() {
        console.log("LOADING ITEM")
        if (!this.selectedItem) return;
        
        const item = this.items[this.selectedItem];
        if (!item || item.itemType !== 'slot') return;
        await sceneManager.loadSlotFromInventory(item)
        // Show success message
        this.showNotification(`Added "${item.name}" to scene`);
    }
    
}