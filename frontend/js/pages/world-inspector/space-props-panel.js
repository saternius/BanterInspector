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
            this.showAllInline = false; // Whether to show all properties inline (default: only pinned)
            this.searchQuery = ''; // Search filter for flat view
            // Property filters for struct view - default show common structure properties
            this.propertyFilters = new Set(['active', 'layer', 'position', 'rotation', 'scale',
                                           'localPosition', 'localRotation', 'localScale',
                                           'components', 'children']);
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

                    // Add Show All toggle if not already there
                    if (!publicHeader.querySelector('.show-all-toggle')) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.className = 'show-all-toggle';
                        toggleBtn.style.cssText = 'margin-left: 10px; font-size: 12px; padding: 2px 8px; border-radius: 3px; background: #444; border: 1px solid #555; color: #888; cursor: pointer;';
                        toggleBtn.innerHTML = this.showAllInline ? 'Show Pinned Only' : 'Show All';
                        toggleBtn.title = this.showAllInline ? 'Show only pinned properties' : 'Show all properties';
                        toggleBtn.onmousedown = (e) => {
                            e.stopPropagation();
                            this.showAllInline = !this.showAllInline;
                            toggleBtn.innerHTML = this.showAllInline ? 'Show Pinned Only' : 'Show All';
                            toggleBtn.title = this.showAllInline ? 'Show only pinned properties' : 'Show all properties';
                            // Also update the protected button if it exists
                            const protToggle = document.querySelector('#protectedPropsSection .show-all-toggle');
                            if (protToggle) {
                                protToggle.innerHTML = toggleBtn.innerHTML;
                                protToggle.title = toggleBtn.title;
                            }
                            this.render();
                        };
                        publicHeader.appendChild(toggleBtn);
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

                    // Add Show All toggle if not already there
                    if (!protectedHeader.querySelector('.show-all-toggle')) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.className = 'show-all-toggle';
                        toggleBtn.style.cssText = 'margin-left: 10px; font-size: 12px; padding: 2px 8px; border-radius: 3px; background: #444; border: 1px solid #555; color: #888; cursor: pointer;';
                        toggleBtn.innerHTML = this.showAllInline ? 'Show Pinned Only' : 'Show All';
                        toggleBtn.title = this.showAllInline ? 'Show only pinned properties' : 'Show all properties';
                        toggleBtn.onmousedown = (e) => {
                            e.stopPropagation();
                            this.showAllInline = !this.showAllInline;
                            toggleBtn.innerHTML = this.showAllInline ? 'Show Pinned Only' : 'Show All';
                            toggleBtn.title = this.showAllInline ? 'Show only pinned properties' : 'Show all properties';
                            // Also update the public button if it exists
                            const pubToggle = document.querySelector('#publicPropsSection .show-all-toggle');
                            if (pubToggle) {
                                pubToggle.innerHTML = toggleBtn.innerHTML;
                                pubToggle.title = toggleBtn.title;
                            }
                            this.render();
                        };
                        protectedHeader.appendChild(toggleBtn);
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
         * Create property filter buttons HTML
         */
        createPropertyFilterButtons() {
            const properties = ['active', 'layer', 'position', 'rotation', 'scale',
                              'localPosition', 'localRotation', 'localScale',
                              'components', 'children'];

            return properties.map(prop => {
                const isActive = this.propertyFilters.has(prop);
                return `
                    <button class="property-filter-btn ${isActive ? 'active' : ''}"
                            data-property="${prop}"
                            style="padding: 4px 10px;
                                   border-radius: 4px;
                                   border: 1px solid ${isActive ? '#3b82c4' : '#555'};
                                   background: ${isActive ? '#3b82c4' : '#2a2a2a'};
                                   color: ${isActive ? 'white' : '#888'};
                                   cursor: pointer;
                                   font-size: 12px;
                                   transition: all 0.2s;">
                        ${prop}
                    </button>`;
            }).join('');
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
                                <button class="refresh-popup-btn" id="refreshPopupBtn" style="margin-left: 8px; font-size: 12px; padding: 2px 6px; border-radius: 3px; background: #444; border: 1px solid #555; color: #888; cursor: pointer;" title="Refresh all values">🔄</button>
                            </div>
                            <div class="search-bar-container" id="searchBarContainer" style="display: ${this.viewMode === 'flat' ? 'block' : 'none'}; padding: 10px; border-bottom: 1px solid #333;">
                                <input type="text"
                                    id="propSearchInput"
                                    class="prop-search-input"
                                    placeholder="🔍 Search properties..."
                                    value="${this.searchQuery}"
                                    style="width: 100%; padding: 8px 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: #e0e0e0; font-size: 14px;">
                            </div>
                            <div class="property-filters-container" id="propertyFiltersContainer" style="display: ${this.viewMode === 'struct' ? 'block' : 'none'}; padding: 10px; border-bottom: 1px solid #333;">
                                <div style="font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Show Properties:</div>
                                <div class="property-filter-buttons" id="propertyFilterButtons" style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    ${this.createPropertyFilterButtons()}
                                </div>
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

                        // Show/hide search bar and filters based on view mode
                        const searchBarContainer = this.popupWindow.querySelector('#searchBarContainer');
                        if (searchBarContainer) {
                            searchBarContainer.style.display = mode === 'flat' ? 'block' : 'none';
                        }

                        const propertyFiltersContainer = this.popupWindow.querySelector('#propertyFiltersContainer');
                        if (propertyFiltersContainer) {
                            propertyFiltersContainer.style.display = mode === 'struct' ? 'block' : 'none';
                        }

                        // Clear search when switching to struct view
                        if (mode === 'struct') {
                            this.searchQuery = '';
                            const searchInput = this.popupWindow.querySelector('#propSearchInput');
                            if (searchInput) searchInput.value = '';
                        }

                        // Re-render with new view mode
                        this.render();
                    }
                });
            });

            // Search input
            const searchInput = this.popupWindow.querySelector('#propSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value.toLowerCase();
                    // Re-render to apply filter
                    this.render();
                });

                // Clear search on Escape
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.searchQuery = '';
                        searchInput.value = '';
                        this.render();
                    }
                });
            }

            // Refresh button
            const refreshBtn = this.popupWindow.querySelector('#refreshPopupBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Force a full refresh of all properties
                    this.fullRefresh();
                });
            }

            // Property filter buttons
            const propertyFilterButtons = this.popupWindow.querySelectorAll('.property-filter-btn');
            propertyFilterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const property = btn.dataset.property;

                    // Toggle filter
                    if (this.propertyFilters.has(property)) {
                        this.propertyFilters.delete(property);
                        btn.classList.remove('active');
                        btn.style.background = '#2a2a2a';
                        btn.style.borderColor = '#555';
                        btn.style.color = '#888';
                    } else {
                        this.propertyFilters.add(property);
                        btn.classList.add('active');
                        btn.style.background = '#3b82c4';
                        btn.style.borderColor = '#3b82c4';
                        btn.style.color = 'white';
                    }

                    this.saveViewPreferences();
                    // Re-render to apply filters
                    this.render();
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
        /**
         * Check if we should render based on property changes
         */
        shouldRenderForProperty(propertyKey, isProtected = false) {
            // Always render if popup is open
            if (this.isPopupOpen) {
                return true;
            }

            // If showing all inline, always render
            if (this.showAllInline) {
                return true;
            }

            // Otherwise, only render if property is pinned
            const type = isProtected ? 'protected' : 'public';
            const propKey = `${type}_${propertyKey}`;
            return this.pinnedProps.has(propKey);
        }

        /**
         * Smart render - only renders if necessary
         */
        smartRender(propertyKey = null, isProtected = false) {
            // If no property specified, always render (for general updates)
            if (!propertyKey) {
                this.render();
                return;
            }

            // Check if we should render for this property
            if (this.shouldRenderForProperty(propertyKey, isProtected)) {
                this.render();
            }
        }

        /**
         * Force a full refresh of all property values from the scene
         */
        fullRefresh() {
            // Clear any cached values or editing states
            this.editingProps.clear();

            // Force re-fetch all properties from the scene
            // The SM.scene.spaceState already contains the latest values
            // Just force a full re-render
            this.render();

            // Show a brief visual feedback that refresh occurred
            const refreshBtn = this.popupWindow?.querySelector('#refreshPopupBtn');
            if (refreshBtn) {
                const originalColor = refreshBtn.style.color;
                refreshBtn.style.color = '#3b82c4';
                setTimeout(() => {
                    refreshBtn.style.color = originalColor;
                }, 300);
            }
        }

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

            // Filter properties for inline view
            let filteredKeys = propKeys;
            if (!isPopup && !this.showAllInline) {
                // Only show pinned properties in inline view
                filteredKeys = propKeys.filter(key => {
                    const propKey = `${type}_${key}`;
                    return this.pinnedProps.has(propKey);
                });
            }

            // Apply search filter for popup flat view
            if (isPopup && this.searchQuery && this.viewMode === 'flat') {
                filteredKeys = filteredKeys.filter(key =>
                    key.toLowerCase().includes(this.searchQuery)
                );
            }

            // Update count display
            if (!isPopup && !this.showAllInline) {
                countElement.textContent = `${filteredKeys.length} pinned / ${propKeys.length} total`;
            } else if (isPopup && this.searchQuery && this.viewMode === 'flat') {
                // Show filtered count when searching
                countElement.textContent = `${filteredKeys.length} / ${propKeys.length}`;
            } else {
                countElement.textContent = propKeys.length;
            }

            if (filteredKeys.length === 0) {
                if (!isPopup && !this.showAllInline && propKeys.length > 0) {
                    listElement.innerHTML = `<div class="empty-props">No pinned ${type} properties<br><small style="opacity:0.7">${propKeys.length} total available</small></div>`;
                } else if (isPopup && this.searchQuery && this.viewMode === 'flat') {
                    listElement.innerHTML = `<div class="empty-props">No properties matching "<strong>${this.searchQuery}</strong>"<br><small style="opacity:0.7">${propKeys.length} total properties</small></div>`;
                } else {
                    listElement.innerHTML = `<div class="empty-props">No ${type} properties</div>`;
                }
                return;
            }

            listElement.innerHTML = '';

            // Sort properties: pinned first, then alphabetical
            const sortedKeys = filteredKeys.sort((a, b) => {
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
            // Always render when starting edit mode to show the edit UI
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
            // Use smart render - only render if property is visible
            this.smartRender(key, type === 'protected');
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
                // Use smart render to only render if needed
                this.smartRender(key, type === 'protected');
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
                // New properties should be rendered if we're showing all or if they're auto-pinned
                this.smartRender(key, false);
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
                // New properties should be rendered if we're showing all or if they're auto-pinned
                this.smartRender(key, false);
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
                // New properties should be rendered if we're showing all or if they're auto-pinned
                this.smartRender(key, true);
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
                // New properties should be rendered if we're showing all or if they're auto-pinned
                this.smartRender(key, true);
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

            // Load property filters
            const filtersSaved = localStorage.getItem('spacePropsPropertyFilters');
            if (filtersSaved) {
                try {
                    const filters = JSON.parse(filtersSaved);
                    // Only use saved filters if it's a non-empty array
                    if (Array.isArray(filters) && filters.length > 0) {
                        this.propertyFilters = new Set(filters);
                    }
                    // Otherwise keep the default filters that were set in the constructor
                } catch (e) {
                    // Keep default filters on error
                }
            }
        }

        /**
         * Save view preferences to localStorage
         */
        saveViewPreferences() {
            localStorage.setItem('spacePropsViewMode', this.viewMode);
            localStorage.setItem('spacePropsExpandedNodes', JSON.stringify([...this.expandedNodes]));
            localStorage.setItem('spacePropsPropertyFilters', JSON.stringify([...this.propertyFilters]));
        }

        /**
         * Parse flat key-value properties into a tree structure
         * Handles Banter's property structure:
         * - $ prefix for entities with / path separator and : property separator
         * - __ prefix for components with : property separator
         * - Simple properties with no prefix
         */
        parseKeysToTree(props) {
            const tree = {
                simple: {},      // Properties with no prefix
                entities: {},    // $ prefixed (entity properties)
                components: {}   // __ prefixed (component properties)
            };

            for (const [key, value] of Object.entries(props)) {
                if (key.startsWith('$')) {
                    // Entity property: $Scene/Ground:position
                    this.parseEntityProperty(tree.entities, key, value);
                } else if (key.startsWith('__')) {
                    // Component property: __BoxCollider_87459:center
                    this.parseComponentProperty(tree.components, key, value);
                } else {
                    // Simple property: passcode
                    tree.simple[key] = value;
                }
            }

            return tree;
        }

        /**
         * Parse entity properties with $ prefix
         * Format: $EntityPath/SubPath:PropertyName
         */
        parseEntityProperty(tree, key, value) {
            // Remove $ prefix
            const cleanKey = key.substring(1);

            // Split by : to separate path from property
            const colonIndex = cleanKey.lastIndexOf(':');

            if (colonIndex === -1) {
                // No property part, just entity path
                tree[cleanKey] = {
                    _value: value,
                    _originalKey: key,
                    _type: 'entity'
                };
            } else {
                const entityPath = cleanKey.substring(0, colonIndex);
                const propertyName = cleanKey.substring(colonIndex + 1);

                // Split entity path by /
                const pathParts = entityPath.split('/');

                // Build nested structure
                let current = tree;
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    if (!current[part]) {
                        current[part] = {
                            _properties: {},
                            _children: {},
                            _type: 'entity',
                            _path: pathParts.slice(0, i + 1).join('/')
                        };
                    }
                    if (i < pathParts.length - 1) {
                        current = current[part]._children || (current[part]._children = {});
                    } else {
                        // Last part - add the property
                        current[part]._properties = current[part]._properties || {};
                        current[part]._properties[propertyName] = {
                            value: value,
                            originalKey: key
                        };
                    }
                }
            }
        }

        /**
         * Parse component properties with __ prefix
         * Format: __ComponentType_ID:PropertyName
         */
        parseComponentProperty(tree, key, value) {
            // Remove __ prefix
            const cleanKey = key.substring(2);

            // Split by : to separate component from property
            const colonIndex = cleanKey.indexOf(':');

            if (colonIndex === -1) {
                tree[cleanKey] = {
                    _value: value,
                    _originalKey: key,
                    _type: 'component'
                };
            } else {
                const componentName = cleanKey.substring(0, colonIndex);
                const propertyName = cleanKey.substring(colonIndex + 1);

                // Extract component type and ID
                const lastUnderscore = componentName.lastIndexOf('_');
                let componentType, componentId;

                if (lastUnderscore !== -1) {
                    componentType = componentName.substring(0, lastUnderscore);
                    componentId = componentName.substring(lastUnderscore + 1);
                } else {
                    componentType = componentName;
                    componentId = 'default';
                }

                // Group by component type
                if (!tree[componentType]) {
                    tree[componentType] = {
                        _type: 'componentGroup',
                        _instances: {}
                    };
                }
                if (!tree[componentType]._instances[componentId]) {
                    tree[componentType]._instances[componentId] = {
                        _properties: {},
                        _originalName: componentName
                    };
                }

                tree[componentType]._instances[componentId]._properties[propertyName] = {
                    value: value,
                    originalKey: key
                };
            }
        }

        /**
         * Render struct view with three sections
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

            // Section 1: Simple Properties
            if (Object.keys(tree.simple).length > 0) {
                const simpleSection = document.createElement('div');
                simpleSection.className = 'tree-section';

                const simpleHeader = document.createElement('div');
                simpleHeader.className = 'tree-section-header';
                simpleHeader.innerHTML = '<span class="section-icon">📝</span> Simple Properties';
                simpleSection.appendChild(simpleHeader);

                const simpleContent = document.createElement('div');
                simpleContent.className = 'tree-section-content';
                for (const [key, value] of Object.entries(tree.simple)) {
                    const propElement = this.renderSimpleProperty(type, key, value, isPopup);
                    simpleContent.appendChild(propElement);
                }
                simpleSection.appendChild(simpleContent);
                treeContainer.appendChild(simpleSection);
            }

            // Section 2: Entity Hierarchy
            if (Object.keys(tree.entities).length > 0) {
                const entitySection = document.createElement('div');
                entitySection.className = 'tree-section';

                const entityHeader = document.createElement('div');
                entityHeader.className = 'tree-section-header';
                entityHeader.innerHTML = '<span class="section-icon">📦</span> Entity Properties';
                entitySection.appendChild(entityHeader);

                const entityContent = document.createElement('div');
                entityContent.className = 'tree-section-content';
                for (const [key, node] of Object.entries(tree.entities)) {
                    const nodeElement = this.renderEntityNode(type, key, node, 0, '', isPopup);
                    entityContent.appendChild(nodeElement);
                }
                entitySection.appendChild(entityContent);
                treeContainer.appendChild(entitySection);
            }

            // Section 3: Components
            if (Object.keys(tree.components).length > 0) {
                const componentSection = document.createElement('div');
                componentSection.className = 'tree-section';

                const componentHeader = document.createElement('div');
                componentHeader.className = 'tree-section-header';
                componentHeader.innerHTML = '<span class="section-icon">⚙️</span> Component Properties';
                componentSection.appendChild(componentHeader);

                const componentContent = document.createElement('div');
                componentContent.className = 'tree-section-content';
                for (const [componentType, componentGroup] of Object.entries(tree.components)) {
                    const groupElement = this.renderComponentGroup(type, componentType, componentGroup, isPopup);
                    componentContent.appendChild(groupElement);
                }
                componentSection.appendChild(componentContent);
                treeContainer.appendChild(componentSection);
            }

            listElement.appendChild(treeContainer);
        }

        /**
         * Render a simple property (no prefix)
         */
        renderSimpleProperty(type, key, value, isPopup = false) {
            const propElement = document.createElement('div');
            propElement.className = 'tree-simple-prop';

            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key simple-key';
            keySpan.textContent = key;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'tree-value';
            valueSpan.textContent = this.formatValue(value);

            const actions = document.createElement('span');
            actions.className = 'tree-actions';
            actions.innerHTML = `
                <button onclick="spacePropsPanel.editProp('${type}', '${key}', ${isPopup})" class="edit-btn" title="Edit">✎</button>
                <button onclick="spacePropsPanel.deleteProp('${type}', '${key}')" class="delete-btn" title="Delete">×</button>
            `;

            propElement.appendChild(keySpan);
            propElement.appendChild(valueSpan);
            propElement.appendChild(actions);

            return propElement;
        }

        /**
         * Render an entity node with hierarchy
         */
        renderEntityNode(type, key, node, depth, parentPath, isPopup = false) {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node entity-node';
            nodeElement.setAttribute('data-depth', depth);

            const fullPath = parentPath ? `${parentPath}/${key}` : key;
            const nodeId = `entity_${fullPath}`;

            // Node header
            const headerElement = document.createElement('div');
            headerElement.className = 'tree-node-header';
            headerElement.style.paddingLeft = `${depth * 20}px`;

            // Check if node has children or properties
            const hasChildren = node._children && Object.keys(node._children).length > 0;
            const hasProperties = node._properties && Object.keys(node._properties).length > 0;
            const canExpand = hasChildren || hasProperties;

            // Expand/collapse arrow
            if (canExpand) {
                const arrow = document.createElement('span');
                arrow.className = 'tree-arrow';
                arrow.textContent = this.expandedNodes.has(nodeId) ? '▼' : '▶';
                arrow.onclick = () => this.toggleTreeNode(nodeId);
                headerElement.appendChild(arrow);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'tree-arrow invisible';
                headerElement.appendChild(spacer);
            }

            // Node name
            const nameSpan = document.createElement('span');
            nameSpan.className = 'tree-key entity-key';
            nameSpan.textContent = key;
            headerElement.appendChild(nameSpan);

            nodeElement.appendChild(headerElement);

            // Children container
            if (canExpand) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                childrenContainer.id = nodeId;
                childrenContainer.style.display = this.expandedNodes.has(nodeId) ? 'block' : 'none';

                // Render properties
                if (hasProperties) {
                    for (const [propName, propData] of Object.entries(node._properties)) {
                        // Check if property should be shown based on filters
                        if (this.propertyFilters.has(propName)) {
                            const propElement = this.renderEntityProperty(type, propName, propData, depth + 1, isPopup);
                            childrenContainer.appendChild(propElement);
                        }
                    }
                }

                // Render child entities
                if (hasChildren) {
                    for (const [childKey, childNode] of Object.entries(node._children)) {
                        const childElement = this.renderEntityNode(type, childKey, childNode, depth + 1, fullPath, isPopup);
                        childrenContainer.appendChild(childElement);
                    }
                }

                nodeElement.appendChild(childrenContainer);
            }

            return nodeElement;
        }

        /**
         * Render an entity property
         */
        renderEntityProperty(type, propName, propData, depth, isPopup = false) {
            const propElement = document.createElement('div');
            propElement.className = 'tree-entity-prop';
            propElement.style.paddingLeft = `${depth * 20}px`;

            const spacer = document.createElement('span');
            spacer.className = 'tree-arrow invisible';

            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key entity-prop-key';
            keySpan.textContent = propName;

            const valueSpan = document.createElement('span');
            valueSpan.className = 'tree-value';
            valueSpan.textContent = this.formatValue(propData.value);

            const actions = document.createElement('span');
            actions.className = 'tree-actions';
            actions.innerHTML = `
                <button onclick="spacePropsPanel.editProp('${type}', '${propData.originalKey}', ${isPopup})" class="edit-btn" title="Edit">✎</button>
                <button onclick="spacePropsPanel.deleteProp('${type}', '${propData.originalKey}')" class="delete-btn" title="Delete">×</button>
            `;

            propElement.appendChild(spacer);
            propElement.appendChild(keySpan);
            propElement.appendChild(valueSpan);
            propElement.appendChild(actions);

            return propElement;
        }

        /**
         * Render a component group
         */
        renderComponentGroup(type, componentType, componentGroup, isPopup = false) {
            const groupElement = document.createElement('div');
            groupElement.className = 'tree-component-group';

            const groupId = `component_${componentType}`;

            // Group header
            const headerElement = document.createElement('div');
            headerElement.className = 'tree-node-header component-group-header';

            const hasInstances = Object.keys(componentGroup._instances).length > 0;

            if (hasInstances) {
                const arrow = document.createElement('span');
                arrow.className = 'tree-arrow';
                arrow.textContent = this.expandedNodes.has(groupId) ? '▼' : '▶';
                arrow.onclick = () => this.toggleTreeNode(groupId);
                headerElement.appendChild(arrow);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'tree-arrow invisible';
                headerElement.appendChild(spacer);
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'tree-key component-type';
            nameSpan.textContent = componentType;
            headerElement.appendChild(nameSpan);

            const countSpan = document.createElement('span');
            countSpan.className = 'component-count';
            countSpan.textContent = `(${Object.keys(componentGroup._instances).length})`;
            headerElement.appendChild(countSpan);

            groupElement.appendChild(headerElement);

            // Instances container
            if (hasInstances) {
                const instancesContainer = document.createElement('div');
                instancesContainer.className = 'tree-children';
                instancesContainer.id = groupId;
                instancesContainer.style.display = this.expandedNodes.has(groupId) ? 'block' : 'none';

                for (const [instanceId, instance] of Object.entries(componentGroup._instances)) {
                    const instanceElement = this.renderComponentInstance(type, componentType, instanceId, instance, isPopup);
                    instancesContainer.appendChild(instanceElement);
                }

                groupElement.appendChild(instancesContainer);
            }

            return groupElement;
        }

        /**
         * Render a component instance as an expandable node
         */
        renderComponentInstance(type, componentType, instanceId, instance, isPopup = false) {
            const instanceElement = document.createElement('div');
            instanceElement.className = 'tree-component-instance';

            const instanceIdDisplay = instanceId !== 'default' ? instanceId : instance._originalName;
            const instanceNodeId = `component_${componentType}_${instanceId}`;

            // Create instance header (expandable)
            const instanceHeader = document.createElement('div');
            instanceHeader.className = 'tree-node-header component-instance-header';
            instanceHeader.style.paddingLeft = '20px';

            // Check if instance has properties
            const hasProperties = Object.keys(instance._properties).length > 0;

            if (hasProperties) {
                const arrow = document.createElement('span');
                arrow.className = 'tree-arrow';
                arrow.textContent = this.expandedNodes.has(instanceNodeId) ? '▼' : '▶';
                arrow.onclick = () => this.toggleTreeNode(instanceNodeId);
                instanceHeader.appendChild(arrow);
            } else {
                const spacer = document.createElement('span');
                spacer.className = 'tree-arrow invisible';
                instanceHeader.appendChild(spacer);
            }

            // Instance name/ID
            const instanceNameSpan = document.createElement('span');
            instanceNameSpan.className = 'tree-key component-instance-key';
            instanceNameSpan.textContent = `Instance ${instanceIdDisplay}`;
            instanceHeader.appendChild(instanceNameSpan);

            // Property count
            const propCountSpan = document.createElement('span');
            propCountSpan.className = 'component-prop-count';
            propCountSpan.textContent = ` (${Object.keys(instance._properties).length} props)`;
            instanceHeader.appendChild(propCountSpan);

            instanceElement.appendChild(instanceHeader);

            // Properties container
            if (hasProperties) {
                const propertiesContainer = document.createElement('div');
                propertiesContainer.className = 'tree-children component-properties';
                propertiesContainer.id = instanceNodeId;
                propertiesContainer.style.display = this.expandedNodes.has(instanceNodeId) ? 'block' : 'none';

                // Render each property
                for (const [propName, propData] of Object.entries(instance._properties)) {
                    const propElement = document.createElement('div');
                    propElement.className = 'tree-component-prop';
                    propElement.style.paddingLeft = '40px';

                    const spacer = document.createElement('span');
                    spacer.className = 'tree-arrow invisible';

                    const keySpan = document.createElement('span');
                    keySpan.className = 'tree-key component-prop-key';
                    keySpan.textContent = propName;

                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'tree-value';
                    valueSpan.textContent = this.formatValue(propData.value);

                    const actions = document.createElement('span');
                    actions.className = 'tree-actions';
                    actions.innerHTML = `
                        <button onclick="spacePropsPanel.editProp('${type}', '${propData.originalKey}', ${isPopup})" class="edit-btn" title="Edit">✎</button>
                        <button onclick="spacePropsPanel.deleteProp('${type}', '${propData.originalKey}')" class="delete-btn" title="Delete">×</button>
                    `;

                    propElement.appendChild(spacer);
                    propElement.appendChild(keySpan);
                    propElement.appendChild(valueSpan);
                    propElement.appendChild(actions);

                    propertiesContainer.appendChild(propElement);
                }

                instanceElement.appendChild(propertiesContainer);
            }

            return instanceElement;
        }

        /**
         * Format value for display
         */
        formatValue(value) {
            if (value === null || value === undefined) return 'null';
            if (typeof value === 'object') {
                if (value.x !== undefined && value.y !== undefined && value.z !== undefined) {
                    return `(${value.x}, ${value.y}, ${value.z})`;
                }
                return JSON.stringify(value);
            }
            return String(value);
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

                /* Section styles */
                .tree-section {
                    margin-bottom: 16px;
                    border: 1px solid #333;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .tree-section-header {
                    background: #2a2a2a;
                    padding: 8px 12px;
                    font-weight: bold;
                    color: #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 1px solid #333;
                }

                .section-icon {
                    font-size: 16px;
                }

                .tree-section-content {
                    padding: 8px;
                    background: #1a1a1a;
                }

                /* Tree nodes */
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

                /* Key styles by type */
                .tree-key {
                    font-weight: 600;
                    margin-right: 8px;
                }

                .simple-key {
                    color: #888;
                }

                .entity-key {
                    color: #3b82c4;
                }

                .entity-prop-key {
                    color: #60a5fa;
                    font-weight: normal;
                }

                .component-type {
                    color: #10b981;
                }

                .component-prop-key {
                    color: #34d399;
                    font-weight: normal;
                }

                .component-count {
                    color: #666;
                    font-size: 12px;
                    margin-left: 4px;
                }

                /* Value display */
                .tree-value {
                    color: #e0e0e0;
                    flex: 1;
                    margin-left: 8px;
                    word-break: break-all;
                    font-family: monospace;
                }

                /* Property rows */
                .tree-simple-prop,
                .tree-entity-prop,
                .tree-component-prop {
                    display: flex;
                    align-items: center;
                    padding: 4px 8px;
                    border-radius: 3px;
                    transition: background 0.2s;
                }

                .tree-simple-prop:hover,
                .tree-entity-prop:hover,
                .tree-component-prop:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                /* Hierarchy indentation */
                .tree-children {
                    border-left: 1px solid #333;
                    margin-left: 8px;
                }

                .entity-node .tree-children {
                    margin-left: 12px;
                    border-left-color: #2563eb;
                }

                .tree-component-group .tree-children {
                    margin-left: 12px;
                    border-left-color: #10b981;
                }

                /* Actions */
                .tree-actions {
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    margin-left: auto;
                }

                .tree-simple-prop:hover .tree-actions,
                .tree-entity-prop:hover .tree-actions,
                .tree-component-prop:hover .tree-actions,
                .tree-node-header:hover .tree-actions {
                    opacity: 1;
                }

                .edit-btn, .delete-btn {
                    background: transparent;
                    border: 1px solid #444;
                    color: #888;
                    padding: 2px 6px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .edit-btn:hover {
                    background: #444;
                    color: #e0e0e0;
                    border-color: #555;
                }

                .delete-btn:hover {
                    background: #c44;
                    border-color: #c44;
                    color: white;
                }

                /* Component instance styles */
                .tree-component-instance {
                    margin-bottom: 4px;
                }

                .tree-component-group-header {
                    font-weight: bold;
                }

                .component-instance-header {
                    background: rgba(16, 185, 129, 0.1);
                    border-left: 2px solid #10b981;
                    margin: 2px 0;
                }

                .component-instance-header:hover {
                    background: rgba(16, 185, 129, 0.15);
                }

                .component-instance-key {
                    color: #10b981;
                    font-weight: 600;
                }

                .component-prop-count {
                    color: #666;
                    font-size: 11px;
                    margin-left: 8px;
                    opacity: 0.8;
                }

                .component-properties {
                    border-left: 1px dashed #10b98133;
                    margin-left: 12px;
                }

                /* Empty state */
                .empty-props {
                    color: #666;
                    font-style: italic;
                    padding: 20px;
                    text-align: center;
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