/**
 * Unity Scene Inspector - Main Application Entry Point
 * 
 * This is the main entry point that initializes all modules and coordinates
 * the inspector application.
 */
(async () => {
    console.log(window.repoUrl)
    
    // Import and show loading screen first
    const { loadingScreen } = await import(`${window.repoUrl}/loading-screen.js`);
    window.loadingScreen = loadingScreen; // Make globally accessible
    loadingScreen.show();
    loadingScreen.updateStage('dom', 100, 'DOM loaded');
    
    // Track module loading progress
    const totalModules = 13;
    let loadedModules = 0;
    const updateModuleProgress = () => {
        loadedModules++;
        const progress = (loadedModules / totalModules) * 100;
        loadingScreen.updateStage('modules', progress, `Loading module ${loadedModules} of ${totalModules}`);
    };
    
    // Load modules with progress tracking
    loadingScreen.updateStage('modules', 0, 'Starting module imports...');
    
    const  { sceneManager } = await import(`${window.repoUrl}/scene-manager.js`);
    updateModuleProgress();
    const  { networking } = await import(`${window.repoUrl}/networking.js`);
    updateModuleProgress();
    const  { HierarchyPanel } = await import(`${window.repoUrl}/hierarchy-panel.js`);
    updateModuleProgress();
    const  { PropertiesPanel } = await import(`${window.repoUrl}/properties-panel.js`);
    updateModuleProgress();
    const  { SpacePropsPanel } = await import(`${window.repoUrl}/space-props-panel.js`);
    updateModuleProgress();
    const  { ComponentMenu } = await import(`${window.repoUrl}/component-menu.js`);
    updateModuleProgress();
    const  { loadMockSpaceProps } = await import(`${window.repoUrl}/mock-data.js`);
    updateModuleProgress();
    const  { Navigation } = await import(`${window.repoUrl}/navigation.js`);
    updateModuleProgress();
    const  { Inventory } = await import(`${window.repoUrl}/inventory.js`);
    updateModuleProgress();
    const  { ScriptEditor } = await import(`${window.repoUrl}/script-editor.js`);
    updateModuleProgress();
    const  { lifecycleManager } = await import(`${window.repoUrl}/lifecycle-manager.js`);
    updateModuleProgress();
    const  { changeManager } = await import(`${window.repoUrl}/change-manager.js`);
    updateModuleProgress();
    const  { LifecyclePanel } = await import(`${window.repoUrl}/lifecycle-panel.js`);
    updateModuleProgress();
    const  { Feedback } = await import(`${window.repoUrl}/feedback.js`);
    updateModuleProgress();

    // Global app instance
    class InspectorApp {
        constructor() {
            this.navigation = null;
            this.hierarchyPanel = null;
            this.propertiesPanel = null;
            this.spacePropsPanel = null;
            this.componentMenu = null;
            this.inventory = null;
            this.scriptEditors = null;
            this.lifecyclePanel = null;
            this.feedback = null;
            this.initialized = false;
        }

        /**
         * Initialize the inspector application
         */
        async initialize() {
            if (this.initialized) return;
            
            console.log('Initializing Unity Scene Inspector...');
            
            try {
                // Wait for BS library to be available
                loadingScreen.updateStage('bs-wait', 0, 'Checking for BanterScript library...');
                await loadingScreen.createBSLibraryTimeout(10000).catch(error => {
                    console.error('BS Library timeout:', error);
                    loadingScreen.setError(error.message);
                    throw error;
                });
                // Initialize navigation
                loadingScreen.updateStage('ui-panels', 10, 'Initializing navigation...');
                this.navigation = new Navigation();
                
                // Initialize scene manager
                loadingScreen.updateStage('scene-connect', 0, 'Connecting to Unity scene...');
                await SM.initialize();
                loadingScreen.updateStage('scene-connect', 100, 'Scene connected');
                
                // Set up change manager to scene manager integration
                changeManager.addChangeListener(async (change) => {
                    // Process changes that need UI updates
                    // if (change instanceof SpacePropertyChange || change instanceof ComponentPropertyChange || change instanceof SlotPropertyChange) {
                    
                    this.spacePropsPanel.render();
                    this.propertiesPanel.render(SM.selectedSlot);
                });
                
                
                // Initialize UI panels
                loadingScreen.updateStage('ui-panels', 20, 'Creating hierarchy panel...');
                this.hierarchyPanel = new HierarchyPanel();
                
                loadingScreen.updateStage('ui-panels', 40, 'Creating properties panel...');
                this.propertiesPanel = new PropertiesPanel();
                
                loadingScreen.updateStage('ui-panels', 60, 'Creating space properties panel...');
                this.spacePropsPanel = new SpacePropsPanel();
                
                loadingScreen.updateStage('ui-panels', 70, 'Creating component menu...');
                this.componentMenu = new ComponentMenu();
                
                loadingScreen.updateStage('ui-panels', 80, 'Creating lifecycle panel...');
                this.lifecyclePanel = new LifecyclePanel();
                
                // Initialize inventory
                loadingScreen.updateStage('ui-panels', 90, 'Initializing inventory...');
                this.inventory = new Inventory();
                
                // Initialize feedback
                loadingScreen.updateStage('ui-panels', 100, 'Initializing feedback system...');
                this.feedback = new Feedback();
                
                // Initialize script editors map
                this.scriptEditors = new Map();
                
                // Set up global references for inline handlers
                window.spacePropsPanel = this.spacePropsPanel;
                window.inventory = this.inventory;
                window.navigation = this.navigation;
                window.scriptEditors = this.scriptEditors;
                window.lifecyclePanel = this.lifecyclePanel;
                window.feedback = this.feedback;
                
                // Initial render
                loadingScreen.updateStage('render', 30, 'Rendering hierarchy panel...');
                this.hierarchyPanel.render();
                
                loadingScreen.updateStage('render', 60, 'Rendering space properties...');
                this.spacePropsPanel.render();
                
                loadingScreen.updateStage('render', 90, 'Rendering lifecycle panel...');
                this.lifecyclePanel.render();
                
                // Set up global event handlers
                loadingScreen.updateStage('events', 50, 'Setting up event handlers...');
                this.setupGlobalEventHandlers();
                
                loadingScreen.updateStage('events', 80, 'Setting up UI controls...');
                
                // Setup clear console button
                const clearConsoleBtn = document.getElementById('clearConsoleBtn');
                if (clearConsoleBtn) {
                    clearConsoleBtn.addEventListener('click', () => {
                        this.lifecyclePanel.clearConsole();
                    });
                }

                const refreshPanelBtn = document.getElementById('refreshPanelBtn');
                if (refreshPanelBtn) {
                    refreshPanelBtn.addEventListener('click', () => {
                        this.lifecyclePanel.render();
                    });
                }
                
                // Set up history notifications
                loadingScreen.updateStage('events', 90, 'Setting up history...');
                this.setupHistoryNotifications();
                
                // Handle window resize
                this.setupResizeHandlers();
                
                loadingScreen.updateStage('events', 100, 'Loading saved tabs...');
                this.loadOldTabs();


                this.initialized = true;
                console.log('Inspector initialized successfully');
                
                // Hide loading screen
                loadingScreen.updateStage('render', 100, 'Complete!');
                setTimeout(() => loadingScreen.hide(), 500);
                
            } catch (error) {
                console.error('Failed to initialize inspector:', error);
                
                // Show error in loading screen if it's still visible
                if (loadingScreen.element) {
                    loadingScreen.setError(error.message || 'Failed to initialize the Scene Inspector');
                } else {
                    this.showInitError(error);
                }
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
                    this.propertiesPanel.render(SM.selectedSlot);
                } else if (change.type === 'slotAdd' || change.type === 'slotRemove' || 
                          change.type === 'slotMove') {
                    this.hierarchyPanel.render();
                    this.propertiesPanel.render(SM.selectedSlot);
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
            console.log("setting up global event handlers")
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
            
            // Handle script editor events
            window.addEventListener('open-script-editor', (event) => {
                const scriptData = event.detail;
                const editorKey = scriptData.name;
                
                // Check if editor for this script already exists
                let existingEditor = null;
                for (const [key, editor] of this.scriptEditors) {
                    if (editor.currentScript.name === scriptData.name) {
                        existingEditor = editor;
                        // Switch to existing tab
                        if(!event.detail.openInBackground){
                            navigation.switchPage(editor.pageId);
                        }
                        return;
                    }
                }
                
                // Create new script editor instance
                const scriptEditor = new ScriptEditor(scriptData);
                this.scriptEditors.set(editorKey, scriptEditor);

                let saveTabs = ()=>{
                    localStorage.setItem(`openedEditors`, Array.from(this.scriptEditors.keys()).join(","));
                }
                saveTabs();
                scriptEditor.open(event.detail.openInBackground);
                
                // Clean up when editor is closed
                const originalClose = scriptEditor.close.bind(scriptEditor);
                scriptEditor.close = () => {
                    originalClose();
                    this.scriptEditors.delete(editorKey);
                    saveTabs();
                };
            });
            
            window.addEventListener('save-script', (event) => {
                if (this.inventory) {
                    const { name, content } = event.detail;
                    const item = this.inventory.items[name];
                    if (item && item.itemType === 'script') {
                        item.data = content;
                        const storageKey = `inventory_${name}`;
                        localStorage.setItem(storageKey, JSON.stringify(item));
                        
                        // Refresh preview if selected
                        if (this.inventory.selectedItem === name) {
                            this.inventory.showPreview(name);
                        }
                        
                        this.inventory.showNotification(`Saved changes to "${name}"`);
                    }
                }
            });
            
            // // Handle space state changes from Unity
            if (SM.scene) {
                SM.scene.addEventListener('space-state-changed', (event) => {
                    // Sync external changes through change manager
                    document.dispatchEvent(new CustomEvent('spaceStateChanged'));
                    networking.handleSpaceStateChange(event);
                });

                SM.scene.On("unity-loaded", async () => {
                    console.log("unity-loaded fired")
                    setTimeout(()=>{
                        SM.setup();
                        networking.initFirebase();
                    }, 1000)
                })

                SM.scene.On("loaded", async () => {
                    console.log('Loaded fired');
                    setTimeout(async ()=>{
                        SM.setup();
                        
                    }, 1000)
                });

                SM.scene.On("one-shot", async (event) => {
                    //console.log("oneshot fired", event)
                    networking.handleOneShot(event);
                    document.dispatchEvent(new CustomEvent('oneshotReceived', {detail: event}));
                });

                SM.scene.On("user-left", (event) => {
                    console.log("[USER LEFT] fired", event)
                    //SM.handleUserLeft(event);
                })

                SM.scene.On("user-joined", (event) => {
                    console.log("[USER JOINED] fired", event)
                    
                    //SM.handleUserJoined(event);
                })

                setTimeout(()=>{
                    SM.setup();
                }, 5000)

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
                if (e.key === 'Delete' && SM.selectedSlot) {
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

        loadOldTabs(){
            let openedEditors = localStorage.getItem(`openedEditors`);
            if(openedEditors){
                openedEditors.split(",").forEach(editor=>{
                    const scriptItem = window.inventory.items[editor];
                    if (scriptItem && scriptItem.itemType === 'script') {
                        const event = new CustomEvent('open-script-editor', {
                            detail: {
                                name: editor,
                                content: scriptItem.data,
                                author: scriptItem.author,
                                created: scriptItem.created,
                                openInBackground: true
                            },
                            
                        });
                        window.dispatchEvent(event);
                    }
                })
            }
        }

        /**
         * Setup resize handlers
         */
        setupResizeHandlers() {
            // Make panels resizable
            const hierarchyPanel = document.querySelector('.hierarchy-panel');
            const propertiesPanel = document.querySelector('.properties-panel');
            const spacePropsContainer = document.querySelector('.space-props-panel-container');
            
            if (hierarchyPanel && propertiesPanel) {
                this.makeResizable(hierarchyPanel, 'right', 200, 500);
            }
            
            if (spacePropsContainer && propertiesPanel) {
                this.makeResizable(spacePropsContainer, 'left', 300, 600);
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
    
    // Handle continue without Unity event
    window.addEventListener('loadingScreenContinueWithoutUnity', () => {
        console.log('Continuing without Unity connection...');
        // You could load mock data here if needed
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.initialize());
    } else {
        app.initialize();
    }

    // Export app instance for debugging
    window.inspector = app;


    var loadLocalUserSceneFromLocalStorage = (scene)=>{
        var luser = JSON.parse(localStorage.getItem("localUser"));
        if(luser){
            scene.localUser = luser
            scene.localUser.id = "abcdefghi"
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
        if(SM.scene){
            if(SM.scene.localUser === undefined){
                loadLocalUserSceneFromLocalStorage(SM.scene);
            }else{
                saveLocalUserSceneToLocalStorage(SM.scene.localUser);
            }
        }
    })
    
    

})()