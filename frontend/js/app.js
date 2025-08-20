/**
 * Unity Scene Inspector - Main Application Entry Point
 * 
 * This is the main entry point that initializes all modules and coordinates
 * the inspector application.
 */
(async () => {
    // Import and show loading screen first
    const { logger } = await import(`${window.repoUrl}/utils.js`);
    const { loadingScreen } = await import(`${window.repoUrl}/pages/world-inspector/loading-screen.js`);
    window.loadingScreen = loadingScreen; // Make globally accessible
    loadingScreen.show();
    loadingScreen.updateStage('banterScene', 100, 'BS Library loaded');
    
    // Track module loading progress
    const totalModules = 53;
    let loadedModules = 0;
    const updateModuleProgress = (moduleName) => {
        loadedModules++;
        const progress = (loadedModules / totalModules) * 100;
        loadingScreen.updateStage('modules', progress, `Loading [${moduleName}] ${loadedModules} of ${totalModules}`);
    };

    window.updateModuleProgress = updateModuleProgress;
    
    // Load modules with progress tracking
    loadingScreen.updateStage('modules', 0, 'Starting module imports...');
    
    const  { sceneManager } = await import(`${window.repoUrl}/scene-manager.js`);
    updateModuleProgress("scene-manager");
    const  { networking } = await import(`${window.repoUrl}/networking.js`);
    updateModuleProgress("networking");
    const  { HierarchyPanel } = await import(`${window.repoUrl}/pages/world-inspector/hierarchy-panel.js`);
    updateModuleProgress("hierarchy-panel");
    const  { PropertiesPanel } = await import(`${window.repoUrl}/pages/world-inspector/properties-panel.js`);
    updateModuleProgress("properties-panel");
    const  { SpacePropsPanel } = await import(`${window.repoUrl}/pages/world-inspector/space-props-panel.js`);
    updateModuleProgress("space-props-panel");
    const  { ComponentMenu } = await import(`${window.repoUrl}/pages/world-inspector/component-menu.js`);
    updateModuleProgress("component-menu");
    const  { Navigation } = await import(`${window.repoUrl}/navigation.js`);
    updateModuleProgress("navigation");
    const  { Inventory } = await import(`${window.repoUrl}/pages/inventory/inventory.js`);
    updateModuleProgress("inventory");
    const  { ScriptEditor } = await import(`${window.repoUrl}/pages/script-editor/script-editor.js`);
    updateModuleProgress("script-editor");
    const  { lifecycleManager } = await import(`${window.repoUrl}/lifecycle-manager.js`);
    updateModuleProgress("lifecycle-manager");
    const  { changeManager } = await import(`${window.repoUrl}/change-manager.js`);
    updateModuleProgress("change-manager");
    const  { LifecyclePanel } = await import(`${window.repoUrl}/pages/world-inspector/lifecycle-panel.js`);
    updateModuleProgress("lifecycle-panel");
    const  { Feedback } = await import(`${window.repoUrl}/pages/feedback/feedback.js`);
    updateModuleProgress("feedback");
    const  { InputHandler } = await import(`${window.repoUrl}/input-handler.js`);
    updateModuleProgress("input-handler");

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
            log("init", "File Server: " + window.fileServer);
            log("init", "Ngrok URL: " + window.ngrokUrl);
            log("init", "Repo URL: " + window.repoUrl);
            log("init", "Block Service URL: " + window.blockServiceUrl);
            document.body.style.height = "100vh";



            if (this.initialized) return;

            
            
            log('init', 'Initializing Unity Scene Inspector...');
            try {
                // Initialize navigation
                loadingScreen.updateStage('ui-panels', 10, 'Initializing navigation...');
                this.navigation = new Navigation();
                
                // Initialize scene manager
                loadingScreen.updateStage('scene-connect', 0, 'Connecting to Unity scene...');
                await SM.initialize();
                
                
                // Set up change manager to scene manager integration
                changeManager.addChangeListener(async (change) => {
                    this.spacePropsPanel.render();
                    this.propertiesPanel.render(SM.selectedEntity);
                });
                
                
                // Initialize UI panels
                this.hierarchyPanel = new HierarchyPanel();
                this.propertiesPanel = new PropertiesPanel();
                this.spacePropsPanel = new SpacePropsPanel();
                this.componentMenu = new ComponentMenu();
                this.lifecyclePanel = new LifecyclePanel();
                
                
                // Initialize inventory
                this.inventory = new Inventory();
                
                // Initialize feedback
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
                this.hierarchyPanel.render();
                this.spacePropsPanel.render();
                this.lifecyclePanel.render();
                this.setupGlobalEventHandlers();
                
                
                

                // Setup console toggle buttons
                const toggleButtons = document.querySelectorAll('.console-toggle');
                toggleButtons.forEach(btn => {
                    btn.addEventListener('mousedown', () => {
                        const toggleType = btn.dataset.toggle;
                        window.logger.include[toggleType] = !window.logger.include[toggleType];
                        btn.classList.toggle('active', window.logger.include[toggleType]);
                    });
                });

                // Setup clear console button (moved to console header)
                const clearConsoleBtn = document.getElementById('clearConsoleBtn2');
                if (clearConsoleBtn) {
                    clearConsoleBtn.addEventListener('mousedown', () => {
                        this.lifecyclePanel.clearConsole();
                    });
                }

                const refreshPanelBtn = document.getElementById('refreshPanelBtn');
                if (refreshPanelBtn) {
                    refreshPanelBtn.addEventListener('mousedown', () => {
                        this.lifecyclePanel.render();
                    });
                }
                
                // Set up history notifications
    
                this.setupHistoryNotifications();
                
                // Handle window resize
                this.setupResizeHandlers();
                
                this.loadOldTabs();


                this.initialized = true;
                log('init', 'Inspector initialized successfully');
                
                // Hide loading screen
                
                
            } catch (error) {
                err('init', 'Failed to initialize inspector:', error);
                
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
                undoBtn.addEventListener('mousedown', () => {
                    if (changeManager) {
                        changeManager.undo();
                    }
                });
            }
            
            if (redoBtn) {
                redoBtn.addEventListener('mousedown', () => {
                    if (changeManager) {
                        changeManager.redo();
                    }
                });
            }
            
            // Wire up save button
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.addEventListener('mousedown', () => {
                    SM.saveScene();
                    this.showNotification('Scene saved', 'success');
                    saveBtn.style.opacity = 0.5;
                    saveBtn.style.pointerEvents = "none";
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
                } else if (change.type === 'component' || change.type === 'entity' ||
                          change.type === 'componentAdd' || change.type === 'componentRemove') {
                    this.propertiesPanel.render(SM.selectedEntity);
                } else if (change.type === 'entityAdd' || change.type === 'entityRemove' || 
                          change.type === 'entityMove') {
                    this.hierarchyPanel.render();
                    this.propertiesPanel.render(SM.selectedEntity);
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
            log("init", "setting up global event handlers")
            // Handle hierarchy changes from change manager
            changeManager.addChangeListener((change) => {
                // Update hierarchy panel if entity names or active state changed
                const hierarchyChanges = change.type === 'entity' && (change.property === 'name' || change.property === 'active');
                if (hierarchyChanges.length > 0) {
                    this.hierarchyPanel.render();
                }
            });
            
            // Handle hierarchy changes (legacy - for compatibility)
            document.addEventListener('entityPropertiesChanged', () => {
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
            
            // // Handle space state changes from Unity
            if (SM.scene) {

                let onLoad = ()=>{
                    log("init", "onLoad()");
                    if(window.isLocalHost){
                        SM.scene.localUser = {
                            name: "Technocrat",
                            uid: "abcdefghi",
                            id: "abcdefghi",
                            isLocal: true,
                            color: "#000000"
                        }
                        SM.scene.users = {
                            [SM.scene.localUser.id]: SM.scene.localUser
                        }
                    }
                    saveLocalUserSceneToLocalStorage(SM.scene.localUser);
                    
                    SM.setup();
                    loadingScreen.updateStage('scene-connect', 100, 'Scene connected');
                    loadingScreen.hide();
                }

                SM.scene.addEventListener('space-state-changed', (event) => {
                    // Sync external changes through change manager
                    document.dispatchEvent(new CustomEvent('spaceStateChanged'));
                    networking.handleSpaceStateChange(event);
                });

                SM.scene.On("loaded", async () => {
                    onLoad();
                });

                SM.scene.On("one-shot", async (event) => {
                    networking.handleOneShot(event);
                    document.dispatchEvent(new CustomEvent('oneshotReceived', {detail: event}));
                });

                SM.scene.On("user-left", (event) => {
                    log('scene-event', "[USER LEFT] fired", event)
                    //SM.handleUserLeft(event);
                })

                SM.scene.On("user-joined", (event) => {
                    log('scene-event', "[USER JOINED] fired", event)
                    
                    //SM.handleUserJoined(event);
                })

                scene.On("button-released", e => {
                    SM.getAllMonoBehaviors().forEach(m=>{
                        if(m.ctx.buttonReleased){
                            m.ctx.buttonReleased(e)
                        }
                    })
                })

                scene.On("button-pressed", e => {
                    SM.getAllMonoBehaviors().forEach(m=>{
                        if(m.ctx.buttonPressed){
                            m.ctx.buttonPressed(e)
                        }
                    })
                })

                
                let runWhenUnityLoaded = ()=>{
                    if(SM.scene.unityLoaded){
                        if(!SM.scene.localUser){
                            log('init', "No local user found, loading from localStorage")
                            loadLocalUserSceneFromLocalStorage(SM.scene);
                        }
                        onLoad();
                    }else{
                        setTimeout(runWhenUnityLoaded, 500);
                    }
                }
                runWhenUnityLoaded();
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
                
                // Delete key: Delete selected entity
                if (e.key === 'Delete' && SM.selectedEntity) {
                    const deleteBtn = document.getElementById('deleteEntityBtn');
                    if (deleteBtn && !e.target.matches('input, textarea')) {
                        deleteBtn.click();
                    }
                }
                
                // Ctrl/Cmd + N: Add new child entity
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    const addBtn = document.getElementById('addChildEntityBtn');
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
                        <button onmousedown="location.reload()" style="
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


})()