/**
 * Component Menu
 * Handles the component selection menu overlay
 */


let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`; 
const { changeManager } = await import(`${basePath}/change-manager.js`);
const { ComponentAddChange } = await import(`${basePath}/change-types.js`);

export class ComponentMenu {
    constructor() {
        this.overlay = document.getElementById('componentMenuOverlay');
        this.searchInput = document.getElementById('componentSearchInput');
        this.closeBtn = document.getElementById('closeComponentMenu');
        
        this.selectedSlotId = null;
        this.categoryStates = new Map(); // Track expanded/collapsed state
        this.setupEventListeners();
        this.initializeCategories();
    }

    /**
     * Initialize categories with default expanded state
     */
    initializeCategories() {
        const categories = document.querySelectorAll('.component-category');
        categories.forEach((category, index) => {
            const categoryName = category.querySelector('.category-name')?.textContent || `category-${index}`;
            this.categoryStates.set(categoryName, true); // All expanded by default
            
            // Add expand/collapse indicator
            const header = category.querySelector('.category-header');
            if (header && !header.querySelector('.category-toggle')) {
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'category-toggle';
                toggleIcon.textContent = '▼';
                header.insertBefore(toggleIcon, header.firstChild);
            }
        });
        categories.forEach((category, index) => {
            this.toggleCategory(category);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for show component menu events
        document.addEventListener('showComponentMenu', (event) => {
            this.selectedSlotId = event.detail.slotId;
            this.show();
        });

        // Close button
        this.closeBtn?.addEventListener('click', () => {
            this.hide();
        });

        // Overlay click (close on background click)
        this.overlay?.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Search input
        this.searchInput?.addEventListener('input', (e) => {
            this.filterComponents(e.target.value);
        });

        // Category header clicks
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.category-header');
            if (header && this.overlay?.contains(header)) {
                e.stopPropagation();
                this.toggleCategory(header.closest('.component-category'));
            }
        });

        // Component item clicks
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.component-item');
            if (item && this.overlay?.contains(item)) {
                const componentType = item.dataset.component;
                if (componentType) {
                    this.addComponent(componentType);
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.style.display !== 'none') {
                this.hide();
            }
        });
    }

    /**
     * Toggle category expanded/collapsed state
     */
    toggleCategory(categoryElement) {
        const categoryName = categoryElement.querySelector('.category-name')?.textContent;
        if (!categoryName) return;
        
        const isExpanded = this.categoryStates.get(categoryName) ?? true;
        this.categoryStates.set(categoryName, !isExpanded);
        
        // Update UI
        const toggleIcon = categoryElement.querySelector('.category-toggle');
        const itemsContainer = categoryElement.querySelector('.category-items');
        
        if (toggleIcon) {
            toggleIcon.textContent = isExpanded ? '▶' : '▼';
        }
        
        if (itemsContainer) {
            itemsContainer.classList.toggle('collapsed', isExpanded);
        }
        
        categoryElement.classList.toggle('collapsed', isExpanded);
    }

    /**
     * Show the component menu
     */
    show() {
        if (!this.overlay || !this.selectedSlotId) return;
        
        this.overlay.style.display = 'flex';
        this.searchInput.value = '';
        this.filterComponents('');
        
        // Re-initialize categories in case DOM changed
        this.initializeCategories();
        
        // Focus search input
        setTimeout(() => {
            this.searchInput?.focus();
        }, 100);
    }

    /**
     * Hide the component menu
     */
    hide() {
        if (!this.overlay) return;
        
        this.overlay.style.display = 'none';
        this.selectedSlotId = null;
    }

    /**
     * Filter components based on search term
     */
    filterComponents(searchTerm) {
        const term = searchTerm.toLowerCase();
        const items = document.querySelectorAll('.component-item');
        const categories = document.querySelectorAll('.component-category');
        
        items.forEach(item => {
            const name = item.querySelector('.component-item-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.component-item-desc')?.textContent.toLowerCase() || '';
            const matches = name.includes(term) || desc.includes(term);
            
            item.classList.toggle('hidden', !matches);
        });
        
        // Handle categories
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.component-item:not(.hidden)');
            const hasVisibleItems = visibleItems.length > 0;
            
            category.style.display = hasVisibleItems ? 'block' : 'none';
            
            // Auto-expand categories with matching items when searching
            if (term && hasVisibleItems) {
                const categoryName = category.querySelector('.category-name')?.textContent;
                if (categoryName && !this.categoryStates.get(categoryName)) {
                    this.categoryStates.set(categoryName, true);
                    category.classList.remove('collapsed');
                    
                    const toggleIcon = category.querySelector('.category-toggle');
                    if (toggleIcon) {
                        toggleIcon.textContent = '▼';
                    }
                    
                    const itemsContainer = category.querySelector('.category-items');
                    if (itemsContainer) {
                        itemsContainer.classList.remove('collapsed');
                    }
                }
            }
        });
    }

    /**
     * Add component to selected slot
     */
    async addComponent(componentType) {
        if (!this.selectedSlotId) return;
        
        const slot = SM.getSlotById(this.selectedSlotId);
        if (!slot) return;
          
        // Create and apply the component add change
        const change = new ComponentAddChange(
            this.selectedSlotId, 
            componentType,
            { source: 'ui' }
        );
        
        await changeManager.applyChange(change);
        
        // Hide menu and refresh UI
        this.hide();
        document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
            detail: { slotId: this.selectedSlotId }
        }));
        
    }

}
