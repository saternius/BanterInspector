const { SaveEntityItemChange } = await import(`${window.repoUrl}/change-types.js`);

export class Navigation {
    constructor() {
        this.currentPage = 'world-inspector';
        this.pages = new Map();
        this.navItems = new Map();
        this.dynamicPages = new Map();
        this.tabOrder = [];
        this.draggedTab = null;
        this.insertIndicator = null;
        
        this.init();
    }
    
    init() {
        const pageElements = document.querySelectorAll('.page');
        pageElements.forEach(page => {
            const pageId = page.id.replace('-page', '');
            this.pages.set(pageId, page);
        });
        
        const navElements = document.querySelectorAll('.nav-item');
        navElements.forEach((navItem, index) => {
            const pageId = navItem.getAttribute('data-page');
            this.navItems.set(pageId, navItem);
            this.tabOrder.push(pageId);
            
            navItem.addEventListener('mousedown', () => this.switchPage(pageId));
            
            // Setup tab dragging
            this.setupTabDragging(navItem, pageId);
            
            // Add drop handling for inventory tab
            if (pageId === 'inventory') {
                this.setupInventoryTabDrop(navItem);
            }
        });
        
        // Create insertion indicator
        this.createInsertIndicator();
    }
    
    switchPage(pageId) {
        if (pageId === this.currentPage) return;
        
        this.pages.forEach((page, id) => {
            if (id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        this.navItems.forEach((navItem, id) => {
            if (id === pageId) {
                navItem.classList.add('active');
            } else {
                navItem.classList.remove('active');
            }
        });
        
        this.currentPage = pageId;
        
        const event = new CustomEvent('page-switched', { 
            detail: { pageId } 
        });
        window.dispatchEvent(event);
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
    
    setupInventoryTabDrop(navItem) {
        const originalDragOver = navItem.ondragover;
        navItem.addEventListener('dragover', (e) => {
            // Check if this is a tab reorder - if so, let the tab drag handler handle it
            if (e.dataTransfer.types.includes('text/tab-reorder')) {
                return;
            }
            
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            navItem.classList.add('drag-over');
        });
        
        navItem.addEventListener('dragleave', (e) => {
            // Don't remove drag-over if it's a tab reorder operation
            if (!e.dataTransfer || !e.dataTransfer.types.includes('text/tab-reorder')) {
                navItem.classList.remove('drag-over');
            }
        });
        
        navItem.addEventListener('drop', async (e) => {
            // Check if this is a tab reorder - if so, let the tab drag handler handle it
            if (e.dataTransfer.types.includes('text/tab-reorder')) {
                return;
            }
            
            e.preventDefault();
            navItem.classList.remove('drag-over');
            
            // Switch to inventory page
            this.switchPage('inventory');
            
            // Get the entity data
            const entityId = e.dataTransfer.getData('text/plain');
            if (entityId && typeof SaveEntityItemChange !== 'undefined' && typeof changeManager !== 'undefined') {
                let change = new SaveEntityItemChange(entityId, null, null, {source: 'ui'});
                changeManager.applyChange(change);
            }
        });
    }
    
    addDynamicPage(pageId, pageElement, navElement) {
        // Remove existing if any
        this.removeDynamicPage(pageId);
        
        // Add page element
        this.pages.set(pageId, pageElement);
        this.dynamicPages.set(pageId, { pageElement, navElement });
        
        // Add nav element
        const navItems = document.querySelector('.nav-items');
        navItems.insertBefore(navElement, this.insertIndicator);
        this.navItems.set(pageId, navElement);
        
        // Add to tab order
        this.tabOrder.push(pageId);
        
        // Setup click handler
        navElement.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.close-tab-btn')) {
                this.switchPage(pageId);
            }
        });
        
        // Setup tab dragging for dynamic tabs
        this.setupTabDragging(navElement, pageId);
    }
    
    removeDynamicPage(pageId) {
        const dynamicPage = this.dynamicPages.get(pageId);
        if (!dynamicPage) return;
        
        // Remove elements
        dynamicPage.pageElement.remove();
        dynamicPage.navElement.remove();
        
        // Clean up maps
        this.pages.delete(pageId);
        this.navItems.delete(pageId);
        this.dynamicPages.delete(pageId);
        
        // Remove from tab order
        const index = this.tabOrder.indexOf(pageId);
        if (index > -1) {
            this.tabOrder.splice(index, 1);
        }
        
        // Switch to default page if current page was removed
        if (this.currentPage === pageId) {
            this.switchPage('world-inspector');
        }
    }
    
    createInsertIndicator() {
        // Create the insertion indicator element
        this.insertIndicator = document.createElement('div');
        this.insertIndicator.className = 'tab-insert-indicator';
        this.insertIndicator.style.display = 'none';
        document.querySelector('.nav-items').appendChild(this.insertIndicator);
    }
    
    setupTabDragging(navItem, pageId) {
        // Make the tab draggable
        navItem.draggable = true;
        navItem.setAttribute('data-page-id', pageId);
        
        navItem.addEventListener('dragstart', (e) => {
            // Don't drag if clicking on close button
            if (e.target.closest('.close-tab-btn')) {
                e.preventDefault();
                return;
            }
            
            this.draggedTab = navItem;
            navItem.classList.add('dragging');
            
            // Store the page ID in the data transfer
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/tab-reorder', pageId);
            
            // Create a custom drag image
            const dragImage = navItem.cloneNode(true);
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            dragImage.style.opacity = '0.8';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
            setTimeout(() => dragImage.remove(), 0);
        });
        
        navItem.addEventListener('dragend', (e) => {
            navItem.classList.remove('dragging');
            this.hideInsertIndicator();
            this.draggedTab = null;
        });
        
        navItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            // Check if this is a tab reorder operation
            if (!e.dataTransfer.types.includes('text/tab-reorder')) {
                // This might be the inventory drop operation
                return;
            }
            
            if (!this.draggedTab || this.draggedTab === navItem) return;
            
            e.dataTransfer.dropEffect = 'move';
            
            // Calculate position for insert indicator
            const rect = navItem.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            const insertBefore = e.clientX < midpoint;
            
            this.showInsertIndicator(navItem, insertBefore);
        });
        
        navItem.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Check if this is a tab reorder operation
            if (!e.dataTransfer.types.includes('text/tab-reorder')) {
                // Let the inventory drop handler deal with it
                return;
            }
            
            if (!this.draggedTab || this.draggedTab === navItem) return;
            
            const draggedPageId = e.dataTransfer.getData('text/tab-reorder');
            const targetPageId = navItem.getAttribute('data-page-id');
            
            // Calculate if we should insert before or after
            const rect = navItem.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;
            const insertBefore = e.clientX < midpoint;
            
            this.reorderTabs(draggedPageId, targetPageId, insertBefore);
        });
        
        navItem.addEventListener('dragleave', (e) => {
            // Only hide indicator if we're leaving the tab area entirely
            if (!e.relatedTarget || !e.relatedTarget.closest('.nav-items')) {
                this.hideInsertIndicator();
            }
        });
    }
    
    showInsertIndicator(targetTab, insertBefore) {
        const rect = targetTab.getBoundingClientRect();
        const navItems = document.querySelector('.nav-items');
        const navRect = navItems.getBoundingClientRect();
        
        this.insertIndicator.style.display = 'block';
        this.insertIndicator.style.position = 'absolute';
        this.insertIndicator.style.top = `${rect.top - navRect.top}px`;
        
        if (insertBefore) {
            this.insertIndicator.style.left = `${rect.left - navRect.left - 2}px`;
        } else {
            this.insertIndicator.style.left = `${rect.right - navRect.left - 2}px`;
        }
        
        this.insertIndicator.style.height = `${rect.height}px`;
    }
    
    hideInsertIndicator() {
        if (this.insertIndicator) {
            this.insertIndicator.style.display = 'none';
        }
    }
    
    reorderTabs(draggedPageId, targetPageId, insertBefore) {
        // Get current indices
        const draggedIndex = this.tabOrder.indexOf(draggedPageId);
        let targetIndex = this.tabOrder.indexOf(targetPageId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove dragged tab from array
        this.tabOrder.splice(draggedIndex, 1);
        
        // Adjust target index if necessary
        if (draggedIndex < targetIndex) {
            targetIndex--;
        }
        
        // Insert at new position
        if (!insertBefore) {
            targetIndex++;
        }
        
        this.tabOrder.splice(targetIndex, 0, draggedPageId);
        
        // Reorder DOM elements
        this.updateTabOrder();
    }
    
    updateTabOrder() {
        const navItemsContainer = document.querySelector('.nav-items');
        const fragment = document.createDocumentFragment();
        
        // Reorder tabs according to tabOrder array
        this.tabOrder.forEach(pageId => {
            const navItem = this.navItems.get(pageId);
            if (navItem) {
                fragment.appendChild(navItem);
            }
        });
        
        // Clear and re-append in correct order
        navItemsContainer.innerHTML = '';
        navItemsContainer.appendChild(fragment);
        navItemsContainer.appendChild(this.insertIndicator);
    }
}