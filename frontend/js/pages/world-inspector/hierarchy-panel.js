/**
 * Hierarchy Panel
 * Handles the scene hierarchy tree display and interactions
 */

import { changeManager } from '../../change-manager.js';
import { AddEntityChange, RemoveEntityChange, EntityMoveChange, CloneEntityChange, SaveEntityItemChange } from '../../change-types.js';
import { confirm } from '../../utils.js';

export class HierarchyPanel {
        constructor() {
            this.treeContainer = document.getElementById('hierarchyTree');
            this.searchInput = document.getElementById('searchInput');
            this.addChildBtn = document.getElementById('addChildEntityBtn');
            this.cloneBtn = document.getElementById('cloneEntityBtn');
            this.deleteBtn = document.getElementById('deleteEntityBtn');
            this.saveBtn = document.getElementById('saveEntityBtn');
            
            this.searchTerm = '';
            this.draggedEntityId = null;
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
                if (!e.target.closest('.tree-node') && this.draggedEntityId) {
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
                if (!e.target.closest('.tree-node') && this.draggedEntityId) {
                    e.preventDefault();
                    this.treeContainer.classList.remove('drag-over-root');
                    this.handleDropToRoot();
                }
            });

            // Add child button
            this.addChildBtn.addEventListener('mousedown', async () => {
                const parentId = SM.selectedEntity;
                
                // Queue entity addition through change manager
                const change = new AddEntityChange(parentId, null, { source: 'ui' });
                changeManager.applyChange(change);
            });

            // Clone button
            this.cloneBtn.addEventListener('mousedown', async () => {
                const change = new CloneEntityChange(SM.selectedEntity, { source: 'ui' });
                changeManager.applyChange(change);
                SM.selectEntity(change.entityId);
            });

            // Delete button
            this.deleteBtn.addEventListener('mousedown', async () => {
                if (!SM.selectedEntity) {
                    showNotification('Please select a entity to delete');
                    return;
                }
                
                const entity = SM.getEntityById(SM.selectedEntity);
                if (!entity) return;
                
                if (await confirm(`Are you sure you want to delete "${entity.name}" and all its children?`)) {
                    // Queue entity deletion through change manager
                    log("scene", "deleting entity =>", SM.selectedEntity)
                    const change = new RemoveEntityChange(SM.selectedEntity, { source: 'ui' });
                    changeManager.applyChange(change);
                    SM.selectEntity('Scene');
                }
            });

            // Save button
            this.saveBtn.addEventListener('mousedown', async () => {
                if (!SM.selectedEntity) {
                    showNotification('Please select a entity to save');
                    return;
                }

                let change = new SaveEntityItemChange(SM.selectedEntity, null, null, {source: 'ui'});
                changeManager.applyChange(change);

            });
        }

        /**
         * Render the hierarchy tree
         */
        render() {
            if (!this.treeContainer) return;
            
            this.treeContainer.innerHTML = '';
            if (SM.entityData.entities.length === 0) {
                this.treeContainer.innerHTML = '<div class="loading-state">No scene data available</div>';
                return;
            }
            
            // Get root entities
            const rootEntities = SM.entityData.entities;
            
            // Render each root entity
            rootEntities.forEach(entity => {
                const nodeElement = this.renderEntityNode(entity, this.searchTerm, 0);
                if (nodeElement) {
                    this.treeContainer.appendChild(nodeElement);
                }
            });
        }

        /**
         * Render a single entity node
         */
        renderEntityNode(entity, searchTerm, level) {
            // Check if this node or any children match the search
            if (searchTerm && !this.matchesSearch(entity, searchTerm)) {
                return null;
            }
            
            const isExpanded = SM.expandedNodes.has(entity.id);
            const hasChildren = entity.children && entity.children.length > 0;
            const isSelected = SM.selectedEntity === entity.id;
            
            // Create node container
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'tree-node-container';
            nodeDiv.dataset.entityId = entity.id;
            
            // Create node element
            const node = document.createElement('div');
            node.className = 'tree-node';
            if (isSelected) node.classList.add('selected');
            if (!entity.active) node.classList.add('inactive');
            if (!entity.persistent) node.classList.add('non-persistent');
            node.style.paddingLeft = `${level * 20 + 8}px`;
            
            // Make node draggable
            node.draggable = true;
            node.dataset.entityId = entity.id;
            
            // Add drag event handlers
            node.addEventListener('dragstart', (e) => this.handleDragStart(e, entity));
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
                toggle.onmousedown = (e) => {
                    e.stopPropagation();
                    this.toggleNode(entity.id);
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
            name.textContent = entity.name;

            if(entity.name.endsWith("_js")){
                name.style.color = '#ff9500';
            }
            
            // Assemble node
            content.appendChild(icon);
            content.appendChild(name);
            node.appendChild(toggle);
            node.appendChild(content);
            
            // Click handler
            node.onmousedown = () => SM.selectEntity(entity.id);
            
            nodeDiv.appendChild(node);
            
            // Render children if expanded
            if (hasChildren && isExpanded) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                
                entity.children.forEach(child => {
                    const childNode = this.renderEntityNode(child, searchTerm, level + 1);
                    if (childNode) {
                        childrenContainer.appendChild(childNode);
                    }
                });
                
                nodeDiv.appendChild(childrenContainer);
            }
            
            return nodeDiv;
        }

        /**
         * Check if entity matches search term
         */
        matchesSearch(entity, searchTerm) {
            if (!searchTerm) return true;
            
            // Check entity name
            if (entity.name.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Check component types
            if (entity.components) {
                for (const component of entity.components) {
                    if (component.type.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }
            
            // Check children
            if (entity.children) {
                for (const child of entity.children) {
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
        toggleNode(entityId) {
            SM.toggleNodeExpansion(entityId);
            this.render();
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
        handleDragStart(e, entity) {
            this.draggedEntityId = entity.id;
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('text/plain', entity.id);
            
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
            this.draggedEntityId = null;
            
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
            if (!this.draggedEntityId) return;
            
            const target = e.target.closest('.tree-node');
            if (!target) return;
            
            const targetEntityId = target.dataset.entityId;
            if (targetEntityId === this.draggedEntityId) return;
            
            // Check if we can drop here (not on a descendant)
            if (this.isDescendant(this.draggedEntityId, targetEntityId)) {
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
            
            const targetEntityId = target.dataset.entityId;
            if (!targetEntityId || targetEntityId === this.draggedEntityId) return;
            
            // Check if we can drop here
            if (this.isDescendant(this.draggedEntityId, targetEntityId)) {
                showNotification('Cannot move a entity into one of its descendants');
                return;
            }
            
            // Queue entity move through change manager
            const change = new EntityMoveChange(this.draggedEntityId, targetEntityId, { source: 'ui' });
            changeManager.applyChange(change);
            
            // Expand the target node to show the newly added child
            SM.expandedNodes.add(targetEntityId);
        }

        /**
         * Check if targetId is a descendant of entityId
         */
        isDescendant(entityId, targetId) {
            const entity = SM.getEntityById(entityId);
            if (!entity) return false;
            
            const checkChildren = (parent) => {
                if (!parent.children) return false;
                
                for (const child of parent.children) {
                    if (child.id === targetId) return true;
                    if (checkChildren(child)) return true;
                }
                return false;
            };
            
            return checkChildren(entity);
        }

        /**
         * Handle drop to root level
         */
        async handleDropToRoot() {
            if (!this.draggedEntityId) return;

            // Queue entity move to root through change manager
            const change = new EntityMoveChange(this.draggedEntityId, null, { source: 'ui' });
            changeManager.applyChange(change);
        }
    }