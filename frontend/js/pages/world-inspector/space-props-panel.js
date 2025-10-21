/**
 * Space Properties Panel
 * Handles public and protected space properties management
 */

// (async () => {
    const { isVector3Object, isQuaternion, quaternionToEuler, formatNumber, confirm } = await import(`${window.repoUrl}/utils.js`);
    const { changeManager } = await import(`${window.repoUrl}/change-manager.js`);
    const { SpacePropertyChange } = await import(`${window.repoUrl}/change-types.js`);

    export class SpacePropsPanel {
        constructor() {
            this.editingProps = new Map();
            this.pinnedProps = new Set();
            this.popupWindow = null;
            this.isPopupOpen = false;
            this.popupType = null; // 'public' or 'protected'
            this.isDragging = false;
            this.isResizing = false;
            this.dragOffset = { x: 0, y: 0 };
            this.resizeStartPos = { x: 0, y: 0, width: 0, height: 0 };
            this.renders = 0; // Track number of render calls
            this.viewMode = 'flat'; // 'flat' or 'struct'
            this.expandedNodes = new Set(); // Track expanded nodes in struct view
            this.loadPinnedProps();
            this.loadViewPreferences();
            this.setupEventListeners();
            this.setupCollapsible();
            this.addPopupButtons();
            this.render();
        }

        /**
         * Add popup buttons to space props headers
         */
        addPopupButtons() {
            // Add popup button after a slight delay to ensure DOM is ready
            setTimeout(() => {
                const publicHeader = document.querySelector('#publicPropsSection');
                const protectedHeader = document.querySelector('#protectedPropsSection');

                // Add to public header
                if (publicHeader) {
                    // Add popup button if not already there
                    if (!publicHeader.querySelector('.popup-btn')) {
                        const popupBtn = document.createElement('button');
                        popupBtn.className = 'popup-btn';
                        popupBtn.innerHTML = '⛶';
                        popupBtn.title = 'Open in popup window';
                        popupBtn.onmousedown = (e) => {
                            e.stopPropagation();
                            this.togglePopup('public');
                        };
                        publicHeader.appendChild(popupBtn);
                    }

                    // Add render counter if not already there
                    if (!publicHeader.querySelector('.render-count')) {
                        const renderCount = document.createElement('span');
                        renderCount.className = 'render-count';
                        renderCount.title = 'Render calls';
                        renderCount.style.cssText = 'margin-left: 10px; font-size: 12px; color: #888; background: #333; padding: 2px 6px; border-radius: 3px;';
                        renderCount.innerHTML = `R: <span id="publicPropsRenderCount">${this.renders}</span>`;
                        publicHeader.appendChild(renderCount);
                    }
                }

                // Add to protected header
                if (protectedHeader) {
                    // Add popup button if not already there
                    if (!protectedHeader.querySelector('.popup-btn')) {
                        const popupBtn = document.createElement('button');
                        popupBtn.className = 'popup-btn';
                        popupBtn.innerHTML = '⛶';
                        popupBtn.title = 'Open in popup window';
                        popupBtn.onmousedown = (e) => {
                            e.stopPropagation();
                            this.togglePopup('protected');
                        };
                        protectedHeader.appendChild(popupBtn);
                    }

                    // Add render counter if not already there
                    if (!protectedHeader.querySelector('.render-count')) {
                        const renderCount = document.createElement('span');
                        renderCount.className = 'render-count';
                        renderCount.title = 'Render calls';
                        renderCount.style.cssText = 'margin-left: 10px; font-size: 12px; color: #888; background: #333; padding: 2px 6px; border-radius: 3px;';
                        renderCount.innerHTML = `R: <span id="protectedPropsRenderCount">${this.renders}</span>`;
                        protectedHeader.appendChild(renderCount);
                    }
                }
            }, 100);
        }

        /**
         * Toggle popup window
         */
        togglePopup(type) {
            if (this.isPopupOpen && this.popupType === type) {
                // Close if clicking the same type that's already open
                this.closePopup();
            } else if (this.isPopupOpen) {
                // Switch to different type
                this.closePopup();
                this.openPopup(type);
            } else {
                // Open new popup
                this.openPopup(type);
            }
        }

        /**
         * Open space props in popup window
         */
        openPopup(type) {
            // Store the type of popup being opened
            this.popupType = type;

            // Hide inline panel
            const spacePropsContent = document.getElementById('spacePropsContent');
            if (spacePropsContent) {
                spacePropsContent.style.display = 'none';
            }

            // Create popup window
            this.createPopupWindow(type);
            this.isPopupOpen = true;

            // Render content in popup
            this.render();
        }

        /**
         * Close popup window
         */
        closePopup() {
            if (this.popupWindow && this.popupWindow.parentNode) {
                this.popupWindow.remove();
            }
            this.popupWindow = null;
            this.isPopupOpen = false;
            this.popupType = null;

            // Show inline panel again
            const spacePropsContent = document.getElementById('spacePropsContent');
            if (spacePropsContent) {
                spacePropsContent.style.display = '';
            }

            // Re-render in inline panel
            this.render();
            // Re-add popup buttons after rendering
            this.addPopupButtons();
        }

        /**
         * Create popup window
         */
        createPopupWindow(type) {
            // Remove any existing popup first
            if (this.popupWindow) {
                this.popupWindow.remove();
            }

            // Determine title and content based on type
            const isPublic = type === 'public';
            const title = isPublic ? 'Public Properties' : 'Protected Properties';
            const propsKey = isPublic ? 'public' : 'protected';
            const capitalized = isPublic ? 'Public' : 'Protected';

            // Create popup container
            this.popupWindow = document.createElement('div');
            this.popupWindow.id = 'space-props-popup';
            this.popupWindow.className = 'space-props-popup';
            this.popupWindow.innerHTML = `
                <div class="popup-header">
                    <span class="popup-title">${title}</span>
                    <div class="popup-controls">
                        <button class="view-toggle-btn ${this.viewMode === 'flat' ? 'active' : ''}" data-mode="flat" title="Flat view">
                            <span>📋</span> Flat
                        </button>
                        <button class="view-toggle-btn ${this.viewMode === 'struct' ? 'active' : ''}" data-mode="struct" title="Structured view">
                            <span>🌳</span> Struct
                        </button>
                        <button class="popup-close" title="Close">&times;</button>
                    </div>
                </div>
                <div class="popup-content">
                    <div class="space-props-content-popup">
                        <div class="space-props-section">
                            <div class="space-props-header">
                                <h3>${capitalized} Properties</h3>
                                <span class="props-count" id="${propsKey}PropsCountPopup">0</span>
                                <span class="render-count" style="margin-left: 10px; font-size: 12px; color: #888; background: #333; padding: 2px 6px; border-radius: 3px;" title="Render calls">R: <span id="SpacePropsRenderCount">${this.renders}</span></span>
                            </div>
                            <div class="props-list" id="${propsKey}PropsListPopup">
                                <div class="empty-props">No ${propsKey} properties</div>
                            </div>
                            <div class="add-prop-container">
                                <input type="text" id="add${capitalized}KeyPopup" class="prop-input" placeholder="Key">
                                <input type="text" id="add${capitalized}ValuePopup" class="prop-input" placeholder="Value">
                                <button onclick="window.spacePropsPanel.add${capitalized}PropPopup()" class="add-prop-button">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="popup-resize-handle"></div>
            `;

            // Position popup in center of screen initially
            this.popupWindow.style.left = '50%';
            this.popupWindow.style.top = '50%';
            this.popupWindow.style.transform = 'translate(-50%, -50%)';
            this.popupWindow.style.width = '500px';
            this.popupWindow.style.height = '400px';

            // Add to document body
            document.body.appendChild(this.popupWindow);

            // Set up event listeners
            this.setupPopupEventListeners();

            // Apply styles
            this.injectStructViewStyles();
        }

        /**
         * Setup popup event listeners
         */
        setupPopupEventListeners() {
            const header = this.popupWindow.querySelector('.popup-header');
            const closeBtn = this.popupWindow.querySelector('.popup-close');
            const resizeHandle = this.popupWindow.querySelector('.popup-resize-handle');
            const viewToggleBtns = this.popupWindow.querySelectorAll('.view-toggle-btn');

            // Close button
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closePopup();
            });

            // View toggle buttons
            viewToggleBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mode = btn.dataset.mode;
                    if (mode !== this.viewMode) {
                        this.viewMode = mode;
                        this.saveViewPreferences();
                        // Update active state
                        viewToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
                        // Re-render with new view mode
                        this.render();
                    }
                });
            });

            // Dragging functionality
            header.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('popup-close')) return;
                if (e.target.classList.contains('view-toggle-btn')) return;
                if (e.target.closest('.view-toggle-btn')) return;

                this.isDragging = true;

                // Get current position
                const rect = this.popupWindow.getBoundingClientRect();
                this.dragOffset.x = e.clientX - rect.left;
                this.dragOffset.y = e.clientY - rect.top;

                // Remove transform for absolute positioning
                this.popupWindow.style.transform = 'none';

                header.style.cursor = 'grabbing';
            });

            // Resize functionality
            resizeHandle.addEventListener('mousedown', (e) => {
                this.isResizing = true;
                const rect = this.popupWindow.getBoundingClientRect();
                this.resizeStartPos = {
                    x: e.clientX,
                    y: e.clientY,
                    width: rect.width,
                    height: rect.height
                };
                e.preventDefault();
            });

            // Global mouse move
            document.addEventListener('mousemove', (e) => {
                if (this.isDragging && this.popupWindow) {
                    const x = e.clientX - this.dragOffset.x;
                    const y = e.clientY - this.dragOffset.y;

                    this.popupWindow.style.left = `${x}px`;
                    this.popupWindow.style.top = `${y}px`;
                } else if (this.isResizing && this.popupWindow) {
                    const deltaX = e.clientX - this.resizeStartPos.x;
                    const deltaY = e.clientY - this.resizeStartPos.y;

                    const newWidth = Math.max(400, this.resizeStartPos.width + deltaX);
                    const newHeight = Math.max(300, this.resizeStartPos.height + deltaY);

                    this.popupWindow.style.width = `${newWidth}px`;
                    this.popupWindow.style.height = `${newHeight}px`;
                }
            });

            // Global mouse up
            document.addEventListener('mouseup', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    const header = this.popupWindow?.querySelector('.popup-header');
                    if (header) header.style.cursor = 'grab';
                }
                if (this.isResizing) {
                    this.isResizing = false;
                }
            });

            // Setup input event listeners for popup based on type
            if (this.popupType === 'public') {
                const keyInput = this.popupWindow.querySelector('#addPublicKeyPopup');
                const valueInput = this.popupWindow.querySelector('#addPublicValuePopup');

                if (keyInput && valueInput) {
                    const addProp = () => this.addPublicPropPopup();
                    keyInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') addProp();
                    });
                    valueInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') addProp();
                    });
                }
            } else if (this.popupType === 'protected') {
                const keyInput = this.popupWindow.querySelector('#addProtectedKeyPopup');
                const valueInput = this.popupWindow.querySelector('#addProtectedValuePopup');

                if (keyInput && valueInput) {
                    const addProp = () => this.addProtectedPropPopup();
                    keyInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') addProp();
                    });
                    valueInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') addProp();
                    });
                }
            }
        }

        /**
         * Setup collapsible functionality
         */
        setupCollapsible() {
            const collapseBtn = document.getElementById('spacePropsCollapseBtn');
            const panel = document.getElementById('spacePropsContent');

            if (collapseBtn && panel) {
                // Load saved state from localStorage
                const isCollapsed = localStorage.getItem('spacePropsCollapsed') === 'true';
                if (isCollapsed) {
                    panel.classList.add('collapsed');
                    collapseBtn.classList.add('collapsed');
                }

                // Add click handler
                collapseBtn.addEventListener('click', () => {
                    const isCurrentlyCollapsed = panel.classList.contains('collapsed');
                    if (isCurrentlyCollapsed) {
                        panel.classList.remove('collapsed');
                        collapseBtn.classList.remove('collapsed');
                        localStorage.setItem('spacePropsCollapsed', 'false');
                    } else {
                        panel.classList.add('collapsed');
                        collapseBtn.classList.add('collapsed');
                        localStorage.setItem('spacePropsCollapsed', 'true');
                    }
                });
            }
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for space state changes
            document.addEventListener('spaceStateChanged', () => {
                this.render();
            });

            // Add property key press handlers
            const publicKeyInput = document.getElementById('addPublicKey');
            const publicValueInput = document.getElementById('addPublicValue');
            const protectedKeyInput = document.getElementById('addProtectedKey');
            const protectedValueInput = document.getElementById('addProtectedValue');
            const refreshSpacePropsBtn = document.getElementById('refreshSpacePropsBtn');
            if(refreshSpacePropsBtn){
                refreshSpacePropsBtn.addEventListener('mousedown', () => {
                    this.render();
                });
            }

            if (publicKeyInput && publicValueInput) {
                const addPublic = () => this.addPublicProp();
                publicKeyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addPublic();
                });
                publicValueInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addPublic();
                });
            }

            if (protectedKeyInput && protectedValueInput) {
                const addProtected = () => this.addProtectedProp();
                protectedKeyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addProtected();
                });
                protectedValueInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') addProtected();
                });
            }
        }

        /**
         * Render space properties
         */
        render() {
            // Increment render counter
            this.renders++;
            this.updateRenderCount();

            if (this.isPopupOpen && this.popupWindow) {
                // Render only the specific property type in popup
                if (this.viewMode === 'struct') {
                    // Render in struct view
                    if (this.popupType === 'public') {
                        this.renderStructView('public', SM.scene.spaceState.public, true);
                    } else if (this.popupType === 'protected') {
                        this.renderStructView('protected', SM.scene.spaceState.protected, true);
                    }
                } else {
                    // Render in flat view
                    if (this.popupType === 'public') {
                        this.renderPropsList('public', SM.scene.spaceState.public, true);
                    } else if (this.popupType === 'protected') {
                        this.renderPropsList('protected', SM.scene.spaceState.protected, true);
                    }
                }
            } else {
                // Render both in inline panel (always flat view for inline)
                this.renderPropsList('public', SM.scene.spaceState.public, false);
                this.renderPropsList('protected', SM.scene.spaceState.protected, false);
            }
        }

        /**
         * Update render count display
         */
        updateRenderCount() {
            // Update in popup if open
            if (this.popupWindow) {
                const popupCounter = this.popupWindow.querySelector('#SpacePropsRenderCount');
                if (popupCounter) {
                    popupCounter.textContent = this.renders;
                }
            }

            // Update in inline panel headers - we'll add these elements in addPopupButtons
            const publicCounter = document.querySelector('#publicPropsRenderCount');
            if (publicCounter) {
                publicCounter.textContent = this.renders;
            }

            const protectedCounter = document.querySelector('#protectedPropsRenderCount');
            if (protectedCounter) {
                protectedCounter.textContent = this.renders;
            }
        }

        /**
         * Render properties list
         */
        renderPropsList(type, props, isPopup = false) {
            const suffix = isPopup ? 'Popup' : '';
            const listElement = document.getElementById(`${type}PropsList${suffix}`);
            const countElement = document.getElementById(`${type}PropsCount${suffix}`);

            if (!listElement || !countElement) return;

            const propKeys = Object.keys(props);
            countElement.textContent = propKeys.length;

            if (propKeys.length === 0) {
                listElement.innerHTML = `<div class="empty-props">No ${type} properties</div>`;
                return;
            }

            listElement.innerHTML = '';

            // Sort properties: pinned first, then alphabetical
            const sortedKeys = propKeys.sort((a, b) => {
                const aKey = `${type}_${a}`;
                const bKey = `${type}_${b}`;
                const aPinned = this.pinnedProps.has(aKey);
                const bPinned = this.pinnedProps.has(bKey);

                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return a.localeCompare(b);
            });

            sortedKeys.forEach(key => {
                const value = props[key];

                if(value === "null" || value === "undefined") return;
                const propItem = this.createPropItem(type, key, value, isPopup);
                listElement.appendChild(propItem);
            });
        }

        /**
         * Create property item element
         */
        createPropItem(type, key, value, isPopup = false) {
            const item = document.createElement('div');
            const propKey = `${type}_${key}`;
            const isPinned = this.pinnedProps.has(propKey);

            item.className = isPinned ? 'prop-item pinned' : 'prop-item';

            // Pin button
            const pinBtn = document.createElement('button');
            pinBtn.className = isPinned ? 'prop-pin-button pinned' : 'prop-pin-button';
            pinBtn.innerHTML = '📌';
            pinBtn.title = isPinned ? 'Unpin' : 'Pin to top';
            pinBtn.onmousedown = (e) => {
                e.stopPropagation();
                this.togglePinProp(type, key);
            };

            const keyElement = document.createElement('div');
            keyElement.className = 'prop-key';
            keyElement.textContent = key;
            keyElement.title = key;
            keyElement.style.marginLeft = "4px";
            
            const valueContainer = document.createElement('div');
            valueContainer.className = 'prop-value';
            
            const isEditing = this.editingProps.has(`${type}_${key}`);
            
            if (isQuaternion(value)) {
                // Quaternion - display as read-only Euler angles
                const eulerAngles = quaternionToEuler(value);
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'prop-value-display quaternion-euler';
                valueDisplay.textContent = `(${formatNumber(eulerAngles.x, 2)}, ${formatNumber(eulerAngles.y, 2)}, ${formatNumber(eulerAngles.z, 2)})`;
                valueDisplay.title = 'Rotation in Euler angles (read-only)';
                
                valueContainer.appendChild(valueDisplay);
                
                // Only delete button for quaternions (no edit)
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onmousedown = () => this.deleteProp(type, key);
                
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
                
            } else if (isVector3Object(value)) {
                // Vector3 always shows input fields
                const vectorGroup = document.createElement('div');
                vectorGroup.className = 'vector-group';
                
                ['x', 'y', 'z'].forEach(axis => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'property-input number';
                    const suffix = isPopup ? '_popup' : '';
                    input.id = `${type}_prop_${key}_${axis}${suffix}`;
                    input.value = value[axis] || 0;
                    input.step = 'any';
                    
                    // Auto-save on change
                    input.addEventListener('change', () => {
                        this.saveVector3Prop(type, key, isPopup);
                    });

                    // Handle Enter and Escape keys
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            this.saveVector3Prop(type, key, isPopup);
                            e.preventDefault();
                        }
                    });
                    
                    const label = document.createElement('span');
                    label.className = 'vector-label';
                    label.textContent = axis.toUpperCase();
                    
                    vectorGroup.appendChild(label);
                    vectorGroup.appendChild(input);
                });
                
                valueContainer.appendChild(vectorGroup);
                
                // Delete button for Vector3
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onmousedown = () => this.deleteProp(type, key);
                
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
                
            } else if (isEditing) {
                // Edit mode for non-Vector3
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'prop-input';
                const suffix = isPopup ? '_popup' : '';
                input.id = `${type}_prop_${key}${suffix}`;
                input.value = typeof value === 'object' ? JSON.stringify(value) : value;
                input.addEventListener('keypress', (e) => {
                    this.handlePropKeyPress(e, type, key, isPopup);
                });
                valueContainer.appendChild(input);
                
                // Save/Cancel buttons
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const saveBtn = document.createElement('button');
                saveBtn.className = 'prop-button save';
                saveBtn.innerHTML = '✓';
                saveBtn.title = 'Save';
                saveBtn.onmousedown = () => this.saveProp(type, key, isPopup);

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'prop-button';
                cancelBtn.innerHTML = '×';
                cancelBtn.title = 'Cancel';
                cancelBtn.onmousedown = () => this.cancelEditProp(type, key);
                
                actions.appendChild(saveBtn);
                actions.appendChild(cancelBtn);
                valueContainer.appendChild(actions);
                
            } else {
                // Display mode for non-Vector3 and non-Quaternion
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'prop-value-display';
                
                if (typeof value === 'object') {
                    valueDisplay.textContent = JSON.stringify(value);
                } else {
                    valueDisplay.textContent = value;
                }
                
                valueContainer.appendChild(valueDisplay);
                
                // Edit/Delete buttons
                const actions = document.createElement('div');
                actions.className = 'prop-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'prop-button';
                editBtn.innerHTML = '✎';
                editBtn.title = 'Edit';
                editBtn.onmousedown = () => this.editProp(type, key, isPopup);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'prop-button delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onmousedown = () => this.deleteProp(type, key);
                
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                valueContainer.appendChild(actions);
            }
            
            item.appendChild(pinBtn);
            item.appendChild(keyElement);
            item.appendChild(valueContainer);

            return item;
        }

        /**
         * Start editing a property
         */
        editProp(type, key, isPopup = false) {
            this.editingProps.set(`${type}_${key}`, true);
            this.render();

            // Focus the input after render
            setTimeout(() => {
                const props = type === 'public' ? SM.scene.spaceState.public : SM.scene.spaceState.protected;
                const value = props[key];
                const suffix = isPopup ? '_popup' : '';

                if (isVector3Object(value)) {
                    // Focus the first Vector3 input (x)
                    const xInput = document.getElementById(`${type}_prop_${key}_x${suffix}`);
                    if (xInput) {
                        xInput.dataset.input = "propertyPanelEditProp";
                        xInput.focus();
                        xInput.select();
                    }
                } else {
                    // Focus regular input
                    const input = document.getElementById(`${type}_prop_${key}${suffix}`);
                    if (input) {
                        input.dataset.input = "propertyPanelEditProp";
                        input.focus();
                        input.select();
                    }
                }
            }, 0);
        }

        /**
         * Save edited property
         */
        saveProp(type, key, isPopup = false) {
            const props = type === 'public' ? SM.scene.spaceState.public : SM.scene.spaceState.protected;
            const currentValue = props[key];
            const suffix = isPopup ? '_popup' : '';

            if (isVector3Object(currentValue)) {
                // Save Vector3
                const xInput = document.getElementById(`${type}_prop_${key}_x${suffix}`);
                const yInput = document.getElementById(`${type}_prop_${key}_y${suffix}`);
                const zInput = document.getElementById(`${type}_prop_${key}_z${suffix}`);

                if (xInput && yInput && zInput) {
                    const newValue = {
                        x: parseFloat(xInput.value) || 0,
                        y: parseFloat(yInput.value) || 0,
                        z: parseFloat(zInput.value) || 0
                    };
                    const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                    changeManager.applyChange(change);
                }
            } else {
                // Save regular value
                const input = document.getElementById(`${type}_prop_${key}${suffix}`);
                if (input) {
                    // Use parseValue method to handle all value types including Vector3
                    const newValue = this.parseValue(input.value);
                    const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                    changeManager.applyChange(change);
                }
            }

            this.cancelEditProp(type, key);
        }

        /**
         * Cancel editing a property
         */
        cancelEditProp(type, key) {
            this.editingProps.delete(`${type}_${key}`);
            this.render();
        }

        /**
         * Delete a property
         */
        async deleteProp(type, key) {
            if (await confirm(`Are you sure you want to delete the ${type} property "${key}"?`)) {
                const change = new SpacePropertyChange(key, undefined, type === 'protected', { source: 'ui' });
                changeManager.applyChange(change);
                if (type === 'public') {
                    delete SM.scene.spaceState.public[key];
                } else {
                    delete SM.scene.spaceState.protected[key];
                }
                this.render();
            }
        }

        /**
         * Add public property
         */
        addPublicProp() {
            const keyInput = document.getElementById('addPublicKey');
            const valueInput = document.getElementById('addPublicValue');

            if (!keyInput || !valueInput) return;

            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);

            if (key) {
                const change = new SpacePropertyChange(key, value, false, { source: 'ui' });
                changeManager.applyChange(change);
                SM.scene.spaceState.public[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Add public property from popup
         */
        addPublicPropPopup() {
            const keyInput = this.popupWindow?.querySelector('#addPublicKeyPopup');
            const valueInput = this.popupWindow?.querySelector('#addPublicValuePopup');

            if (!keyInput || !valueInput) return;

            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);

            if (key) {
                const change = new SpacePropertyChange(key, value, false, { source: 'ui' });
                changeManager.applyChange(change);
                SM.scene.spaceState.public[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Add protected property
         */
        addProtectedProp() {
            const keyInput = document.getElementById('addProtectedKey');
            const valueInput = document.getElementById('addProtectedValue');

            if (!keyInput || !valueInput) return;

            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);

            if (key) {
                const change = new SpacePropertyChange(key, value, true, { source: 'ui' });
                changeManager.applyChange(change);
                SM.scene.spaceState.protected[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Add protected property from popup
         */
        addProtectedPropPopup() {
            const keyInput = this.popupWindow?.querySelector('#addProtectedKeyPopup');
            const valueInput = this.popupWindow?.querySelector('#addProtectedValuePopup');

            if (!keyInput || !valueInput) return;

            const key = keyInput.value.trim();
            const value = this.parseValue(valueInput.value);

            if (key) {
                const change = new SpacePropertyChange(key, value, true, { source: 'ui' });
                changeManager.applyChange(change);
                SM.scene.spaceState.protected[key] = value;
                keyInput.value = '';
                valueInput.value = '';
                this.render();
            }
        }

        /**
         * Parse value from string input
         */
        parseValue(value) {
            value = value.trim();
            
            // Try to parse as JSON
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    // Keep as string if JSON parse fails
                }
            }
            
            // Check for Vector3 format: "(x, y, z)" or "x y z" or "x,y,z"
            const vector3Pattern = /^\(?\s*(-?\d*\.?\d+)\s*[,\s]\s*(-?\d*\.?\d+)\s*[,\s]\s*(-?\d*\.?\d+)\s*\)?$/;
            const match = value.match(vector3Pattern);
            if (match) {
                return {
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2]),
                    z: parseFloat(match[3])
                };
            }
            
            // Check for boolean
            if (value === 'true') return true;
            if (value === 'false') return false;
            
            // Check for number
            if (!isNaN(value) && value !== '') {
                return parseFloat(value);
            }
            
            // Return as string
            return value;
        }

        /**
         * Save Vector3 property directly
         */
        saveVector3Prop(type, key, isPopup = false) {
            const suffix = isPopup ? '_popup' : '';
            const xInput = document.getElementById(`${type}_prop_${key}_x${suffix}`);
            const yInput = document.getElementById(`${type}_prop_${key}_y${suffix}`);
            const zInput = document.getElementById(`${type}_prop_${key}_z${suffix}`);

            if (xInput && yInput && zInput) {
                const newValue = {
                    x: parseFloat(xInput.value) || 0,
                    y: parseFloat(yInput.value) || 0,
                    z: parseFloat(zInput.value) || 0
                };
                const change = new SpacePropertyChange(key, newValue, type === 'protected', { source: 'ui' });
                changeManager.applyChange(change);

                // Update local state
                if (type === 'public') {
                    SM.scene.spaceState.public[key] = newValue;
                } else {
                    SM.scene.spaceState.protected[key] = newValue;
                }
            }
        }

        /**
         * Handle key press in property input
         */
        handlePropKeyPress(event, type, key, isPopup = false) {
            if (event.key === 'Enter') {
                this.saveProp(type, key, isPopup);
            } else if (event.key === 'Escape') {
                this.cancelEditProp(type, key);
            }
        }

        /**
         * Toggle pin status for a property
         */
        togglePinProp(type, key) {
            const propKey = `${type}_${key}`;
            if (this.pinnedProps.has(propKey)) {
                this.pinnedProps.delete(propKey);
            } else {
                this.pinnedProps.add(propKey);
            }
            this.savePinnedProps();
            this.render();
        }

        /**
         * Save pinned properties to localStorage
         */
        savePinnedProps() {
            localStorage.setItem('spacePropsPinned', JSON.stringify([...this.pinnedProps]));
        }

        /**
         * Load pinned properties from localStorage
         */
        loadPinnedProps() {
            const saved = localStorage.getItem('spacePropsPinned');
            if (saved) {
                try {
                    const props = JSON.parse(saved);
                    this.pinnedProps = new Set(props);
                } catch (e) {
                    this.pinnedProps = new Set();
                }
            }
        }

        /**
         * Load view preferences from localStorage
         */
        loadViewPreferences() {
            const saved = localStorage.getItem('spacePropsViewMode');
            if (saved) {
                this.viewMode = saved;
            }

            const expandedSaved = localStorage.getItem('spacePropsExpandedNodes');
            if (expandedSaved) {
                try {
                    const nodes = JSON.parse(expandedSaved);
                    this.expandedNodes = new Set(nodes);
                } catch (e) {
                    this.expandedNodes = new Set();
                }
            }
        }

        /**
         * Save view preferences to localStorage
         */
        saveViewPreferences() {
            localStorage.setItem('spacePropsViewMode', this.viewMode);
            localStorage.setItem('spacePropsExpandedNodes', JSON.stringify([...this.expandedNodes]));
        }

        /**
         * Parse flat key-value properties into a tree structure
         */
        parseKeysToTree(props) {
            const tree = {};

            for (const [key, value] of Object.entries(props)) {
                // Split by dots, but handle array notation
                const parts = key.split(/\.|\[|\]/g).filter(p => p !== '');
                let current = tree;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isLast = i === parts.length - 1;

                    if (!current[part]) {
                        current[part] = {
                            _value: isLast ? value : null,
                            _children: isLast ? null : {},
                            _fullKey: parts.slice(0, i + 1).join('.'),
                            _originalKey: key
                        };
                    } else if (!isLast && !current[part]._children) {
                        // Convert leaf to branch if needed
                        current[part]._children = {};
                    }

                    if (!isLast) {
                        current = current[part]._children;
                    }
                }
            }

            return tree;
        }

        /**
         * Render struct view
         */
        renderStructView(type, props, isPopup = false) {
            const suffix = isPopup ? 'Popup' : '';
            const listElement = document.getElementById(`${type}PropsList${suffix}`);
            const countElement = document.getElementById(`${type}PropsCount${suffix}`);

            if (!listElement || !countElement) return;

            const propKeys = Object.keys(props);
            countElement.textContent = propKeys.length;

            if (propKeys.length === 0) {
                listElement.innerHTML = `<div class="empty-props">No ${type} properties</div>`;
                return;
            }

            // Parse properties into tree structure
            const tree = this.parseKeysToTree(props);

            // Render the tree
            listElement.innerHTML = '';
            const treeContainer = document.createElement('div');
            treeContainer.className = 'struct-tree';

            // Render root level nodes
            for (const [key, node] of Object.entries(tree)) {
                const nodeElement = this.renderTreeNode(type, key, node, 0, '', isPopup);
                treeContainer.appendChild(nodeElement);
            }

            listElement.appendChild(treeContainer);
        }

        /**
         * Render a single tree node
         */
        renderTreeNode(type, key, node, depth, parentPath, isPopup = false) {
            const fullPath = parentPath ? `${parentPath}.${key}` : key;
            const isExpanded = this.expandedNodes.has(fullPath);
            const hasChildren = node._children && Object.keys(node._children).length > 0;
            const isLeaf = !hasChildren;

            const nodeDiv = document.createElement('div');
            nodeDiv.className = `tree-node ${isLeaf ? 'leaf' : ''}`;
            nodeDiv.dataset.depth = depth;
            nodeDiv.dataset.path = fullPath;

            // Create node header
            const nodeHeader = document.createElement('div');
            nodeHeader.className = 'tree-node-header';
            nodeHeader.style.paddingLeft = `${depth * 20}px`;

            // Expand/collapse arrow
            const arrow = document.createElement('span');
            arrow.className = hasChildren ? 'tree-arrow' : 'tree-arrow invisible';
            arrow.textContent = hasChildren ? (isExpanded ? '▼' : '▶') : '';
            arrow.onclick = (e) => {
                e.stopPropagation();
                if (hasChildren) {
                    this.toggleTreeNode(fullPath);
                }
            };

            // Node key
            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key';
            keySpan.textContent = key;

            nodeHeader.appendChild(arrow);
            nodeHeader.appendChild(keySpan);

            // Add value and actions for leaf nodes
            if (isLeaf) {
                const valueSpan = document.createElement('span');
                valueSpan.className = 'tree-value';

                if (isVector3Object(node._value)) {
                    valueSpan.textContent = `(${formatNumber(node._value.x, 2)}, ${formatNumber(node._value.y, 2)}, ${formatNumber(node._value.z, 2)})`;
                } else if (typeof node._value === 'object') {
                    valueSpan.textContent = JSON.stringify(node._value);
                } else {
                    valueSpan.textContent = node._value;
                }

                // Actions
                const actions = document.createElement('span');
                actions.className = 'tree-actions';

                const editBtn = document.createElement('button');
                editBtn.className = 'tree-action-btn';
                editBtn.innerHTML = '✎';
                editBtn.title = 'Edit';
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    // TODO: Implement edit in struct view
                    console.log('Edit:', node._originalKey);
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'tree-action-btn delete';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (await confirm(`Delete property "${node._originalKey}"?`)) {
                        const change = new SpacePropertyChange(node._originalKey, undefined, type === 'protected', { source: 'ui' });
                        changeManager.applyChange(change);
                        if (type === 'public') {
                            delete SM.scene.spaceState.public[node._originalKey];
                        } else {
                            delete SM.scene.spaceState.protected[node._originalKey];
                        }
                        this.render();
                    }
                };

                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);

                nodeHeader.appendChild(valueSpan);
                nodeHeader.appendChild(actions);
            }

            nodeDiv.appendChild(nodeHeader);

            // Add children container if has children
            if (hasChildren) {
                const childrenDiv = document.createElement('div');
                childrenDiv.className = 'tree-children';
                childrenDiv.style.display = isExpanded ? 'block' : 'none';

                for (const [childKey, childNode] of Object.entries(node._children)) {
                    const childElement = this.renderTreeNode(type, childKey, childNode, depth + 1, fullPath, isPopup);
                    childrenDiv.appendChild(childElement);
                }

                nodeDiv.appendChild(childrenDiv);
            }

            return nodeDiv;
        }

        /**
         * Toggle tree node expansion
         */
        toggleTreeNode(path) {
            if (this.expandedNodes.has(path)) {
                this.expandedNodes.delete(path);
            } else {
                this.expandedNodes.add(path);
            }
            this.saveViewPreferences();
            this.render();
        }

        /**
         * Add struct view CSS styles
         */
        injectStructViewStyles() {
            if (document.getElementById('struct-view-styles')) return;

            const styleEl = document.createElement('style');
            styleEl.id = 'struct-view-styles';
            styleEl.textContent = `
                .popup-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .view-toggle-btn {
                    background: #444;
                    border: 1px solid #555;
                    color: #888;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s;
                }

                .view-toggle-btn:hover {
                    background: #555;
                    color: #e0e0e0;
                }

                .view-toggle-btn.active {
                    background: #3b82c4;
                    border-color: #2563eb;
                    color: white;
                }

                .struct-tree {
                    padding: 5px;
                }

                .tree-node {
                    margin: 1px 0;
                }

                .tree-node-header {
                    display: flex;
                    align-items: center;
                    padding: 4px;
                    border-radius: 3px;
                    cursor: default;
                    transition: background 0.2s;
                }

                .tree-node-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .tree-arrow {
                    width: 16px;
                    display: inline-block;
                    text-align: center;
                    cursor: pointer;
                    user-select: none;
                    color: #888;
                    transition: transform 0.2s;
                }

                .tree-arrow.invisible {
                    visibility: hidden;
                }

                .tree-key {
                    font-weight: 600;
                    color: #3b82c4;
                    margin-right: 8px;
                }

                .tree-value {
                    color: #e0e0e0;
                    flex: 1;
                    margin-left: 8px;
                    word-break: break-all;
                }

                .tree-children {
                    border-left: 1px solid #333;
                    margin-left: 8px;
                }

                .tree-actions {
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    margin-left: auto;
                }

                .tree-node-header:hover .tree-actions {
                    opacity: 1;
                }

                .tree-action-btn {
                    background: transparent;
                    border: 1px solid #444;
                    color: #888;
                    padding: 2px 6px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .tree-action-btn:hover {
                    background: #444;
                    color: #e0e0e0;
                }

                .tree-action-btn.delete:hover {
                    background: #c44;
                    border-color: #c44;
                    color: white;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }

    // Make functions globally available for inline onmousedown handlers
    window.addPublicProp = () => {
        const panel = window.spacePropsPanel;
        if (panel) panel.addPublicProp();
    };

    window.addProtectedProp = () => {
        const panel = window.spacePropsPanel;
        if (panel) panel.addProtectedProp();
    };
//})()