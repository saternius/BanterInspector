let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { sceneManager } = await import(`${basePath}/scene-manager.js`);

export class Inventory {
    constructor() {
        this.container = document.getElementById('inventory-page');
        this.items = this.loadItems();
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
                <div class="inventory-empty">
                    <div class="empty-icon">📦</div>
                    <h3>Your inventory is empty</h3>
                    <p>Drag slots from the World Inspector to save them here</p>
                </div>
            `;
            return;
        }
        
        inventoryContainer.innerHTML = `
            <div class="inventory-header">
                <h2>Saved Items (${Object.keys(this.items).length})</h2>
            </div>
            <div class="inventory-grid">
                ${Object.entries(this.items).map(([key, item]) => this.renderItem(key, item)).join('')}
            </div>
        `;
        
        // Add event listeners for remove buttons
        inventoryContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemName = btn.dataset.itemName;
                this.removeItem(itemName);
            });
        });
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
        
        return `
            <div class="inventory-item" data-item-name="${key}">
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
}