/**
 * Hierarchy Panel
 * Handles the scene hierarchy tree display and interactions
 */

import { sceneManager } from './scene-manager.js';

export class HierarchyPanel {
    constructor() {
        this.treeContainer = document.getElementById('hierarchyTree');
        this.searchInput = document.getElementById('searchInput');
        this.addChildBtn = document.getElementById('addChildSlotBtn');
        this.deleteBtn = document.getElementById('deleteSlotBtn');
        
        this.searchTerm = '';
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        // Add child button
        this.addChildBtn.addEventListener('click', async () => {
            const parentId = sceneManager.selectedSlot;
            const newSlot = await sceneManager.addNewSlot(parentId);
            
            if (parentId) {
                sceneManager.expandedNodes.add(parentId);
            }
            
            sceneManager.selectSlot(newSlot.id);
            this.render();
            
            // Trigger properties panel update
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: newSlot.id }
            }));
        });

        // Delete button
        this.deleteBtn.addEventListener('click', async () => {
            if (!sceneManager.selectedSlot) {
                alert('Please select a slot to delete');
                return;
            }
            
            const slot = sceneManager.getSlotById(sceneManager.selectedSlot);
            if (!slot) return;
            
            if (confirm(`Are you sure you want to delete "${slot.name}" and all its children?`)) {
                sceneManager.deleteSlot(sceneManager.selectedSlot);
                this.render();
                
                // Clear properties panel
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: null }
                }));
            }
        });
    }

    /**
     * Render the hierarchy tree
     */
    render() {
        if (!this.treeContainer) return;
        
        this.treeContainer.innerHTML = '';
        
        if (sceneManager.sceneData.slots.length === 0) {
            this.treeContainer.innerHTML = '<div class="loading-state">No scene data available</div>';
            return;
        }
        
        // Get root slots
        const rootSlots = sceneManager.sceneData.slots;
        
        // Render each root slot
        rootSlots.forEach(slot => {
            const nodeElement = this.renderSlotNode(slot, this.searchTerm, 0);
            if (nodeElement) {
                this.treeContainer.appendChild(nodeElement);
            }
        });
    }

    /**
     * Render a single slot node
     */
    renderSlotNode(slot, searchTerm, level) {
        // Check if this node or any children match the search
        if (searchTerm && !this.matchesSearch(slot, searchTerm)) {
            return null;
        }
        
        const isExpanded = sceneManager.expandedNodes.has(slot.id);
        const hasChildren = slot.children && slot.children.length > 0;
        const isSelected = sceneManager.selectedSlot === slot.id;
        
        // Create node container
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node-container';
        
        // Create node element
        const node = document.createElement('div');
        node.className = 'tree-node';
        if (isSelected) node.classList.add('selected');
        if (!slot.active) node.classList.add('inactive');
        if (!slot.persistent) node.classList.add('non-persistent');
        node.style.paddingLeft = `${level * 20 + 8}px`;
        
        // Toggle button
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        if (hasChildren) {
            toggle.classList.add('has-children');
            toggle.textContent = isExpanded ? '▼' : '▶';
            toggle.onclick = (e) => {
                e.stopPropagation();
                this.toggleNode(slot.id);
            };
        } else {
            toggle.classList.add('empty');
            toggle.textContent = '•';
        }
        
        // Node content
        const content = document.createElement('div');
        content.className = 'node-content';
        
        // Node icon
        const icon = document.createElement('span');
        icon.className = 'node-icon';
        
        // Node name
        const name = document.createElement('span');
        name.className = 'node-name';
        name.textContent = slot.name;
        
        // Assemble node
        content.appendChild(icon);
        content.appendChild(name);
        node.appendChild(toggle);
        node.appendChild(content);
        
        // Click handler
        node.onclick = () => this.selectSlot(slot.id);
        
        nodeDiv.appendChild(node);
        
        // Render children if expanded
        if (hasChildren && isExpanded) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            
            slot.children.forEach(child => {
                const childNode = this.renderSlotNode(child, searchTerm, level + 1);
                if (childNode) {
                    childrenContainer.appendChild(childNode);
                }
            });
            
            nodeDiv.appendChild(childrenContainer);
        }
        
        return nodeDiv;
    }

    /**
     * Check if slot matches search term
     */
    matchesSearch(slot, searchTerm) {
        if (!searchTerm) return true;
        
        // Check slot name
        if (slot.name.toLowerCase().includes(searchTerm)) {
            return true;
        }
        
        // Check component types
        if (slot.components) {
            for (const component of slot.components) {
                if (component.type.toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
        }
        
        // Check children
        if (slot.children) {
            for (const child of slot.children) {
                if (this.matchesSearch(child, searchTerm)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Toggle node expansion
     */
    toggleNode(slotId) {
        sceneManager.toggleNodeExpansion(slotId);
        this.render();
    }

    /**
     * Select a slot
     */
    selectSlot(slotId) {
        sceneManager.selectSlot(slotId);
        this.render();
        
        // Notify properties panel
        document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
            detail: { slotId: slotId }
        }));
    }

    /**
     * Show error message
     */
    showError(message) {
        this.treeContainer.innerHTML = `
            <div class="empty-state">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}