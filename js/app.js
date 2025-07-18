/**
 * Unity Scene Inspector - Main Application Entry Point
 * 
 * This is the main entry point that initializes all modules and coordinates
 * the inspector application.
 */
(async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`; 

    const  { sceneManager } = await import(`${basePath}/scene-manager.js`);
    const  { HierarchyPanel } = await import(`${basePath}/hierarchy-panel.js`);
    const  { PropertiesPanel } = await import(`${basePath}/properties-panel.js`);
    const  { SpacePropsPanel } = await import(`${basePath}/space-props-panel.js`);
    const  { ComponentMenu } = await import(`${basePath}/component-menu.js`);
    const  { loadMockSpaceProps } = await import(`${basePath}/mock-data.js`);
    const  { Navigation } = await import(`${basePath}/navigation.js`);
    const  { Inventory } = await import(`${basePath}/inventory.js`);
    const  { lifecycleManager } = await import(`${basePath}/lifecycle-manager.js`);
    const  { changeManager } = await import(`${basePath}/change-manager.js`);

    // Global app instance
    class InspectorApp {
        constructor() {
            this.navigation = null;
            this.hierarchyPanel = null;
            this.propertiesPanel = null;
            this.spacePropsPanel = null;
            this.componentMenu = null;
            this.inventory = null;
            this.initialized = false;
        }

        /**
         * Initialize the inspector application
         */
        async initialize() {
            if (this.initialized) return;
            
            console.log('Initializing Unity Scene Inspector...');
            
            try {
                // Initialize navigation
                this.navigation = new Navigation();
                
                // Initialize scene manager
                await sceneManager.initialize();
                
                // Set up change manager to scene manager integration
                changeManager.addChangeListener(async (change) => {
                    // Process changes that need UI updates
                    // if (change instanceof SpacePropertyChange || change instanceof ComponentPropertyChange || change instanceof SlotPropertyChange) {
                    
                    this.spacePropsPanel.render();
                    this.propertiesPanel.render(sceneManager.selectedSlot);
                });
                
                
                // Initialize UI panels
                this.hierarchyPanel = new HierarchyPanel();
                this.propertiesPanel = new PropertiesPanel();
                this.spacePropsPanel = new SpacePropsPanel();
                this.componentMenu = new ComponentMenu();
                
                // Initialize inventory
                this.inventory = new Inventory();
                
                // Set up global references for inline handlers
                window.spacePropsPanel = this.spacePropsPanel;
                window.inventory = this.inventory;
                
                // Initial render
                this.hierarchyPanel.render();
                this.spacePropsPanel.render();
                
                // Set up global event handlers
                this.setupGlobalEventHandlers();
                
                // Set up history notifications
                this.setupHistoryNotifications();
                
                // Handle window resize
                this.setupResizeHandlers();
                
                this.initialized = true;
                console.log('Inspector initialized successfully');
                
            } catch (error) {
                console.error('Failed to initialize inspector:', error);
                this.showInitError(error);
            }
        }

        /**
         * Setup history notification handling
         */
        setupHistoryNotifications() {
            // Create notification container
            let notificationContainer = document.getElementById('historyNotifications');
            if (!notificationContainer) {
                notificationContainer = document.createElement('div');
                notificationContainer.id = 'historyNotifications';
                document.body.appendChild(notificationContainer);
            }
            
            // Wire up undo/redo buttons
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            
            if (undoBtn) {
                undoBtn.addEventListener('click', () => {
                    if (changeManager) {
                        changeManager.undo();
                    }
                });
            }
            
            if (redoBtn) {
                redoBtn.addEventListener('click', () => {
                    if (changeManager) {
                        changeManager.redo();
                    }
                });
            }
            
            // Listen for history notifications
            document.addEventListener('historyNotification', (event) => {
                const { message, type } = event.detail;
                this.showNotification(message, type);
            });
            
            // Listen for history changes to update UI
            document.addEventListener('historyChangeApplied', (event) => {
                // Refresh relevant panels
                const change = event.detail.change;
                if (change.type === 'spaceProperty') {
                    this.spacePropsPanel.render();
                } else if (change.type === 'component' || change.type === 'slot' ||
                          change.type === 'componentAdd' || change.type === 'componentRemove') {
                    this.propertiesPanel.render(sceneManager.selectedSlot);
                } else if (change.type === 'slotAdd' || change.type === 'slotRemove' || 
                          change.type === 'slotMove') {
                    this.hierarchyPanel.render();
                    this.propertiesPanel.render(sceneManager.selectedSlot);
                }
            });
        }
        
        /**
         * Show notification to user
         */
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `history-notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Trigger animation
            setTimeout(() => notification.classList.add('show'), 10);
            
            // Remove after delay
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        /**
         * Setup global event handlers
         */
        setupGlobalEventHandlers() {
            // Handle hierarchy changes from change manager
            changeManager.addChangeListener((change) => {
                // Update hierarchy panel if slot names or active state changed
                const hierarchyChanges = change.type === 'slot' && (change.property === 'name' || change.property === 'active');
                if (hierarchyChanges.length > 0) {
                    this.hierarchyPanel.render();
                }
            });
            
            // Handle hierarchy changes (legacy - for compatibility)
            document.addEventListener('slotPropertiesChanged', () => {
                this.hierarchyPanel.render();
            });
            
            // Handle space state changes from Unity
            if (sceneManager.scene) {
                sceneManager.scene.addEventListener('space-state-changed', (event) => {
                    // Sync external changes through change manager
                    changeManager.handleExternalChanges(event.detail.changes);
                    document.dispatchEvent(new CustomEvent('spaceStateChanged'));
                });
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + F: Focus search
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                }
                
                // Delete key: Delete selected slot
                if (e.key === 'Delete' && sceneManager.selectedSlot) {
                    const deleteBtn = document.getElementById('deleteSlotBtn');
                    if (deleteBtn && !e.target.matches('input, textarea')) {
                        deleteBtn.click();
                    }
                }
                
                // Ctrl/Cmd + N: Add new child slot
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    const addBtn = document.getElementById('addChildSlotBtn');
                    if (addBtn) {
                        addBtn.click();
                    }
                }
            });
        }

        /**
         * Setup resize handlers
         */
        setupResizeHandlers() {
            // Make panels resizable
            const hierarchyPanel = document.querySelector('.hierarchy-panel');
            const propertiesPanel = document.querySelector('.properties-panel');
            const spacePropsPanel = document.querySelector('.space-props-panel');
            
            if (hierarchyPanel && propertiesPanel) {
                this.makeResizable(hierarchyPanel, 'right', 200, 500);
            }
            
            if (spacePropsPanel && propertiesPanel) {
                this.makeResizable(spacePropsPanel, 'left', 300, 600);
            }
        }

        /**
         * Make a panel resizable
         */
        makeResizable(panel, direction, minSize, maxSize) {
            const resizer = document.createElement('div');
            resizer.className = 'panel-resizer';
            resizer.style.position = 'absolute';
            resizer.style[direction] = '0';
            resizer.style.top = '0';
            resizer.style.bottom = '0';
            resizer.style.width = '4px';
            resizer.style.cursor = direction === 'right' ? 'ew-resize' : 'ew-resize';
            resizer.style.zIndex = '100';
            
            panel.style.position = 'relative';
            panel.appendChild(resizer);
            
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = panel.offsetWidth;
                document.body.style.cursor = direction === 'right' ? 'ew-resize' : 'ew-resize';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const diff = direction === 'right' ? 
                    e.clientX - startX : 
                    startX - e.clientX;
                
                const newWidth = Math.max(minSize, Math.min(maxSize, startWidth + diff));
                panel.style.width = newWidth + 'px';
                panel.style.flexShrink = '0';
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                }
            });
        }

        /**
         * Show initialization error
         */
        showInitError(error) {
            const container = document.querySelector('.inspector-container');
            if (container) {
                container.innerHTML = `
                    <div class="init-error" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        padding: 40px;
                        text-align: center;
                    ">
                        <h2 style="color: #ff6b6b; margin-bottom: 20px;">Initialization Error</h2>
                        <p style="color: #888; margin-bottom: 10px;">Failed to initialize the Scene Inspector</p>
                        <p style="color: #666; font-size: 14px; max-width: 600px;">${error.message}</p>
                        <button onclick="location.reload()" style="
                            margin-top: 30px;
                            padding: 10px 20px;
                            background: #2a2a2a;
                            border: 1px solid #3a3a3a;
                            border-radius: 4px;
                            color: #e8e8e8;
                            cursor: pointer;
                        ">Reload</button>
                    </div>
                `;
            }
        }
    }

    // Create and initialize app instance
    const app = new InspectorApp();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.initialize());
    } else {
        app.initialize();
    }

    // Export app instance for debugging
    window.inspectorApp = app;
    window.lifecycleManager = lifecycleManager;

    var loadLocalUserSceneFromLocalStorage = (scene)=>{
        var luser = JSON.parse(localStorage.getItem("localUser"));
        if(luser){
            scene.localUser = luser
            scene.users = {
                [luser.uid]: luser
            }
        }
    }
    
    var saveLocalUserSceneToLocalStorage = (luser)=>{
        localStorage.setItem("localUser", JSON.stringify({
            "name": luser.name,
            "uid": luser.uid,
            "isLocal": luser.isLocal,
            "color": luser.color
        }));
    }

    setTimeout(()=>{
        if(sceneManager.scene){
            if(sceneManager.scene.localUser === undefined){
                loadLocalUserSceneFromLocalStorage(sceneManager.scene);
            }else{
                saveLocalUserSceneToLocalStorage(sceneManager.scene.localUser);
            }
        }
    })
    
    

})()