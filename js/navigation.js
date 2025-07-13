export class Navigation {
    constructor() {
        this.currentPage = 'world-inspector';
        this.pages = new Map();
        this.navItems = new Map();
        
        this.init();
    }
    
    init() {
        const pageElements = document.querySelectorAll('.page');
        pageElements.forEach(page => {
            const pageId = page.id.replace('-page', '');
            this.pages.set(pageId, page);
        });
        
        const navElements = document.querySelectorAll('.nav-item');
        navElements.forEach(navItem => {
            const pageId = navItem.getAttribute('data-page');
            this.navItems.set(pageId, navItem);
            
            navItem.addEventListener('click', () => this.switchPage(pageId));
            
            // Add drop handling for inventory tab
            if (pageId === 'inventory') {
                this.setupInventoryTabDrop(navItem);
            }
        });
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
        navItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            navItem.classList.add('drag-over');
        });
        
        navItem.addEventListener('dragleave', (e) => {
            navItem.classList.remove('drag-over');
        });
        
        navItem.addEventListener('drop', async (e) => {
            e.preventDefault();
            navItem.classList.remove('drag-over');
            
            // Switch to inventory page
            this.switchPage('inventory');
            
            // Get the slot data
            const slotData = e.dataTransfer.getData('application/json');
            
            if (slotData) {
                try {
                    const slot = JSON.parse(slotData);
                    
                    // Small delay to ensure inventory is ready
                    setTimeout(() => {
                        if (window.inventory) {
                            window.inventory.addItem(slot);
                        }
                    }, 100);
                } catch (error) {
                    console.error('Failed to parse slot data:', error);
                }
            }
        });
    }
}