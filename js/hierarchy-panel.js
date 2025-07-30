/**
 * Hierarchy Panel
 * Handles the scene hierarchy tree display and interactions
 */

// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`;   
    const { changeManager } = await import(`${basePath}/change-manager.js`);
    const { SlotAddChange, SlotRemoveChange, SlotMoveChange, CloneSlotChange } = await import(`${basePath}/change-types.js`);

    export class HierarchyPanel {
        constructor() {
            this.treeContainer = document.getElementById('hierarchyTree');
            this.searchInput = document.getElementById('searchInput');
            this.addChildBtn = document.getElementById('addChildSlotBtn');
            this.cloneBtn = document.getElementById('cloneSlotBtn');
            this.deleteBtn = document.getElementById('deleteSlotBtn');
            this.saveBtn = document.getElementById('saveSlotBtn');
            
            this.searchTerm = '';
            this.draggedSlotId = null;
            this.dropTargetId = null;
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
            
            // Listen for scene updates
            document.addEventListener('sceneUpdated', () => {
                this.render();
            });
            
            // Add drag and drop to the tree container for root level drops
            this.treeContainer.addEventListener('dragover', (e) => {
                // Only allow drop at root level if not over a node
                if (!e.target.closest('.tree-node') && this.draggedSlotId) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    this.treeContainer.classList.add('drag-over-root');
                }
            });
            
            this.treeContainer.addEventListener('dragleave', (e) => {
                // Remove visual feedback when leaving the container
                if (e.target === this.treeContainer) {
                    this.treeContainer.classList.remove('drag-over-root');
                }
            });
            
            this.treeContainer.addEventListener('drop', (e) => {
                // Handle drop at root level
                if (!e.target.closest('.tree-node') && this.draggedSlotId) {
                    e.preventDefault();
                    this.treeContainer.classList.remove('drag-over-root');
                    this.handleDropToRoot();
                }
            });

            // Add child button
            this.addChildBtn.addEventListener('click', async () => {
                const parentId = SM.selectedSlot;
                
                // Queue slot addition through change manager
                const change = new SlotAddChange(parentId, null, { source: 'ui' });
                changeManager.applyChange(change);
            });

            // Clone button
            this.cloneBtn.addEventListener('click', async () => {
                const change = new CloneSlotChange(SM.selectedSlot, { source: 'ui' });
                changeManager.applyChange(change);
            });

            // Delete button
            this.deleteBtn.addEventListener('click', async () => {
                if (!SM.selectedSlot) {
                    alert('Please select a slot to delete');
                    return;
                }
                
                const slot = SM.getSlotById(SM.selectedSlot);
                if (!slot) return;
                
                if (confirm(`Are you sure you want to delete "${slot.name}" and all its children?`)) {
                    // Queue slot deletion through change manager
                    console.log("deleting slot =>", SM.selectedSlot)
                    const change = new SlotRemoveChange(SM.selectedSlot, { source: 'ui' });
                    changeManager.applyChange(change);
                }
            });

            // Save button
            this.saveBtn.addEventListener('click', async () => {
                if (!SM.selectedSlot) {
                    alert('Please select a slot to save');
                    return;
                }

                let change = new SaveSlotItemChange(SM.selectedSlot, null, null, {source: 'ui'});
                changeManager.applyChange(change);

            });
        }

        /**
         * Render the hierarchy tree
         */
        render() {
            if (!this.treeContainer) return;
            
            this.treeContainer.innerHTML = '';
            //console.log("SM.slotData.slots =>", SM.slotData.slots)
            if (SM.slotData.slots.length === 0) {
                this.treeContainer.innerHTML = '<div class="loading-state">No scene data available</div>';
                return;
            }
            
            // Get root slots
            const rootSlots = SM.slotData.slots;
            
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
            //console.log("rendering slot node", slot)
            // Check if this node or any children match the search
            if (searchTerm && !this.matchesSearch(slot, searchTerm)) {
                return null;
            }
            
            const isExpanded = SM.expandedNodes.has(slot.id);
            const hasChildren = slot.children && slot.children.length > 0;
            const isSelected = SM.selectedSlot === slot.id;
            
            // Create node container
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'tree-node-container';
            nodeDiv.dataset.slotId = slot.id;
            
            // Create node element
            const node = document.createElement('div');
            node.className = 'tree-node';
            if (isSelected) node.classList.add('selected');
            if (!slot.active) node.classList.add('inactive');
            if (!slot.persistent) node.classList.add('non-persistent');
            node.style.paddingLeft = `${level * 20 + 8}px`;
            
            // Make node draggable
            node.draggable = true;
            node.dataset.slotId = slot.id;
            
            // Add drag event handlers
            node.addEventListener('dragstart', (e) => this.handleDragStart(e, slot));
            node.addEventListener('dragend', (e) => this.handleDragEnd(e));
            node.addEventListener('dragover', (e) => this.handleDragOver(e));
            node.addEventListener('drop', (e) => this.handleDrop(e));
            node.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            node.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
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
            SM.toggleNodeExpansion(slotId);
            this.render();
        }

        /**
         * Select a slot
         */
        selectSlot(slotId) {
            SM.selectSlot(slotId);
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

        /**
         * Handle drag start
         */
        handleDragStart(e, slot) {
            this.draggedSlotId = slot.id;
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('text/plain', slot.id);
            
            // console.log("slot", slot)
            // let copy = slot.export()

            // // Store the full slot data for inventory
            // e.dataTransfer.setData('application/json', JSON.stringify(copy));
            
            // Add dragging class
            e.target.classList.add('dragging');
            
            // Store drag data
            e.dataTransfer.setDragImage(e.target, 0, 0);
        }

        /**
         * Handle drag end
         */
        handleDragEnd(e) {
            e.target.classList.remove('dragging');
            this.draggedSlotId = null;
            
            // Remove all drag-over classes
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            
            // Remove root drag-over class
            this.treeContainer.classList.remove('drag-over-root');
        }

        /**
         * Handle drag over
         */
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        /**
         * Handle drag enter
         */
        handleDragEnter(e) {
            if (!this.draggedSlotId) return;
            
            const target = e.target.closest('.tree-node');
            if (!target) return;
            
            const targetSlotId = target.dataset.slotId;
            if (targetSlotId === this.draggedSlotId) return;
            
            // Check if we can drop here (not on a descendant)
            if (this.isDescendant(this.draggedSlotId, targetSlotId)) {
                return;
            }
            
            target.classList.add('drag-over');
        }

        /**
         * Handle drag leave
         */
        handleDragLeave(e) {
            const target = e.target.closest('.tree-node');
            if (target) {
                target.classList.remove('drag-over');
            }
        }

        /**
         * Handle drop
         */
        async handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const target = e.target.closest('.tree-node');
            if (!target) return;
            
            const targetSlotId = target.dataset.slotId;
            if (!targetSlotId || targetSlotId === this.draggedSlotId) return;
            
            // Check if we can drop here
            if (this.isDescendant(this.draggedSlotId, targetSlotId)) {
                alert('Cannot move a slot into one of its descendants');
                return;
            }
            
            // Queue slot move through change manager
            const change = new SlotMoveChange(this.draggedSlotId, targetSlotId, { source: 'ui' });
            changeManager.applyChange(change);
            
            // Expand the target node to show the newly added child
            SM.expandedNodes.add(targetSlotId);
        }

        /**
         * Check if targetId is a descendant of slotId
         */
        isDescendant(slotId, targetId) {
            const slot = SM.getSlotById(slotId);
            if (!slot) return false;
            
            const checkChildren = (parent) => {
                if (!parent.children) return false;
                
                for (const child of parent.children) {
                    if (child.id === targetId) return true;
                    if (checkChildren(child)) return true;
                }
                return false;
            };
            
            return checkChildren(slot);
        }

        /**
         * Handle drop to root level
         */
        async handleDropToRoot() {
            if (!this.draggedSlotId) return;
            
            // Queue slot move to root through change manager
            const change = new SlotMoveChange(this.draggedSlotId, null, { source: 'ui' });
            changeManager.applyChange(change);
        }
    }
// })()