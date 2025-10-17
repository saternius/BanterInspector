/**
 * Banter Inspector Injector
 * This module can be imported to inject the entire inspector application into any HTML page
 *
 * Usage:
 * <script type="module">
 *   import { InspectorInjector } from './inspector-injector.js';
 *   const inspector = new InspectorInjector({
 *     targetElement: document.body, // or any container element
 *     config: {
 *       ngrokUrl: 'https://your-ngrok-url.ngrok-free.app',
 *       fileServer: 'ngrok' // or 'stable', 'local', 'unity'
 *     }
 *   });
 *   inspector.inject();
 * </script>
 */

export class InspectorInjector {
    constructor(options = {}) {
        this.targetElement = options.targetElement || document.body;
        this.config = {
            ngrokUrl: options.config?.ngrokUrl || 'https://suitable-bulldog-flying.ngrok-free.app',
            fileServer: options.config?.fileServer || 'ngrok',
            ...options.config
        };
        this.injected = false;
    }

    inject() {
        if (this.injected) {
            console.warn('Inspector already injected');
            return;
        }

        // Set up global configuration
        this.setupGlobalConfig();

        // Inject external dependencies
        this.injectDependencies();

        // Inject the inspector HTML
        this.injectHTML();

        // Inject styles
        this.injectStyles();


        window.loadInventoryDeps = async ()=>{
            if(this.config.inventoryDeps){
                for(const dep of this.config.inventoryDeps){
                    log("init", "importing inventory dep: ", dep);
                    await window.inventory.firebase.importFromFirebase(dep.path, "", dep.minUpdateTime);
                }
            }
        }
    }

    setupGlobalConfig() {
        window.ngrokUrl = this.config.ngrokUrl;
        window.isLocalHost = window.location.hostname === 'localhost';
        window.repoUrl = '.';

        window.fileServer = this.config.fileServer;
        if (!window.fileServer) {
            localStorage.setItem('file_server', 'ngrok');
            window.fileServer = 'ngrok';
        }

        if (window.fileServer === 'stable') {
            window.repoUrl = 'https://saternius.github.io/BanterInspector/frontend';
        } else if (window.fileServer === 'ngrok') {
            window.repoUrl = window.ngrokUrl;
        } else if (window.fileServer === 'local') {
            window.repoUrl = 'http://192.168.0.148:9909';
        } else if (window.fileServer === 'unity') {
            if (window.isLocalHost) {
                window.repoUrl = 'http://localhost:42069/frontend';
            } else {
                console.log('Unity is not running on localhost');
            }
        }

        window.blockServiceUrl = `${window.ngrokUrl}/api/process-text`;
        window.blend2endServiceUrl = `${window.ngrokUrl}/api/format-blend2end`;
    }

    injectDependencies() {
        const dependencies = [
            {
                type: 'script',
                src: 'https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js'
            },
            {
                type: 'script',
                src: 'https://cdn.jsdelivr.net/gh/zoltantothcom/vanilla-js-dropdown/dist/vanilla-js-dropdown.min.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js'
            }
        ];

        dependencies.forEach(dep => {
            const element = document.createElement(dep.type);
            if (dep.src) element.src = dep.src;
            if (dep.type === 'script') {
                element.async = false;
            }
            document.head.appendChild(element);
        });

        // Add select enhancement script
        this.injectSelectEnhancement();
    }

    injectSelectEnhancement() {
        const script = document.createElement('script');
        script.textContent = `
        (function() {
            document.addEventListener('DOMContentLoaded', () => {
                function enhanceSelect(el) {
                    if (!el.dataset.vjsdInit) {
                        var select = new CustomSelect({
                            elem: el,
                        });
                        el.dataset.vjsdInit = 'true';
                    }
                }

                document.querySelectorAll('select').forEach(enhanceSelect);

                const observer = new MutationObserver(mutations => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType !== 1) continue;
                            if (node.tagName === 'SELECT') {
                                enhanceSelect(node);
                            } else {
                                node.querySelectorAll?.('select').forEach(enhanceSelect);
                            }
                        }
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        })();`;
        document.head.appendChild(script);
    }

    injectStyles() {
        setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = window.repoUrl + '/styles.css';
            document.head.appendChild(link);

            // Add container-specific styles to fix layout when not injecting into body
            const style = document.createElement('style');
            style.textContent = `
                #banter-inspector-root,
                #inspectorContainer {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: relative;
                }

                #banter-inspector-root .page-container,
                #inspectorContainer .page-container {
                    display: block !important;
                }
            `;
            document.head.appendChild(style);

            this.initializeApp();
        }, 1000);
    }

    injectHTML() {
        const inspectorHTML = `
        <!-- Navigation Header -->
        <nav class="navigation-header">
            <div class="nav-items">
                <button class="nav-item active" data-page="world-inspector">
                    <span class="nav-icon">🌍</span>
                    World Inspector
                </button>
                <button class="nav-item" data-page="inventory">
                    <span class="nav-icon">📦</span>
                    Inventory
                </button>
                <button class="nav-item" data-page="feedback">
                    <span class="nav-icon">💬</span>
                    Feedback
                </button>
            </div>
            <div class="nav-controls">
                <button id="undoBtn" data-toolbar-btn="undoBtn" class="nav-control-btn" title="Undo (Ctrl+Z)" disabled>
                    <span class="control-icon">↶</span>
                </button>
                <button id="redoBtn" data-toolbar-btn="redoBtn" class="nav-control-btn" title="Redo (Ctrl+Shift+Z)" disabled>
                    <span class="control-icon">↷</span>
                </button>
                <button id="saveBtn" data-toolbar-btn="saveBtn" class="nav-control-btn" title="Save Scene">
                    <span class="control-icon">💾</span>
                </button>
            </div>
        </nav>

        <!-- Page Container -->
        <div class="page-container">
            <!-- World Inspector Page -->
            <div class="page active" id="world-inspector-page">
                <div class="inspector-container">
                    <!-- Hierarchy Panel -->
                    <div data-panel="hierarchyPanel" class="panel hierarchy-panel">
                        <div class="panel-header">Scene Hierarchy</div>
                        <div class="search-container">
                            <input data-input="entitySearchInput" type="text" id="searchInput" class="search-input" placeholder="Search entities...">
                        </div>
                        <div class="entity-actions-container">
                            <button data-hierarchy-btn="addChildEntityBtn" class="action-button" id="addChildEntityBtn" title="Add Child">
                                <span class="button-icon">+</span>
                            </button>
                            <button data-hierarchy-btn="cloneEntityBtn" class="action-button" id="cloneEntityBtn" title="Clone">
                                <span class="button-icon">🧬</span>
                            </button>
                            <button data-hierarchy-btn="deleteEntityBtn" class="action-button delete-button" id="deleteEntityBtn" title="Delete">
                                <span class="button-icon">×</span>
                            </button>
                            <button data-hierarchy-btn="saveEntityBtn" class="action-button save-button" id="saveEntityBtn" title="Save">
                                <span class="button-icon">💾</span>
                            </button>
                        </div>
                        <div data-section="hierarchyTree" class="hierarchy-tree" id="hierarchyTree">
                            <div class="loading-state">Loading scene hierarchy...</div>
                        </div>
                    </div>

                    <!-- Properties Panel -->
                    <div data-panel="propertiesPanel" class="panel properties-panel" id="propertiesPanel">
                        <div class="panel-header">
                            <span id="selectedEntityName">Properties</span>
                            <div class="properties-header-buttons">
                                <button id="loadSettingsBtn" class="collapse-all-btn" data-panel="loadSettingsBtn">Async</button>
                                <button id="collapseAllBtn" style="display: none;" class="collapse-all-btn" data-panel="propertyPanelCollapseAllBtn">Collapse</button>
                            </div>
                        </div>
                        <div class="properties-content" id="propertiesContent">
                            <div class="empty-state">
                                <h3>No entity selected</h3>
                                <p>Select a entity from the hierarchy to view its properties</p>
                            </div>
                        </div>
                        <div data-panel='propertyPanelAddComponent' class="add-component-container" id="addComponentContainer" style="display: none;">
                            <button class="add-component-button" id="addComponentBtn">
                                <span>+</span>
                                Add Component
                            </button>
                        </div>
                    </div>

                    <!-- Space Props Panel Container -->
                    <div data-panel="spacePropsPanel" class="panel space-props-panel-container">
                        <div data-panel="spacePropsPanel" class="space-props-panel">
                            <!-- Input Handler Overlay -->
                            <div id="inputHelper" data-section="inputHelper" class="input-helper">
                                <div class="panel-header">
                                    Input Helper
                                    <span id="inputHelperSubject">Unknown Subject</span>
                                </div>
                                <div class="properties-content">
                                    <div class="input-value-display" id="inputHelperValue">0</div>
                                    <div class="input-helper-info" id="inputHelperInfo"></div>
                                    <div class="radial-crown-container">
                                        <div class="radial-crown-ridge" id="radialCrown">
                                            <div class="radial-crown">
                                                <div class="radial-crown-slit"></div>
                                            </div>
                                        </div>
                                        <div style="transform: scale(.5, .5); margin-top: -40px; justify-items: center;">
                                            <div class="radial-crown-ridge" id="radialCrownTol">
                                                <div class="radial-crown">
                                                    <div class="radial-crown-slit"></div>
                                                </div>
                                            </div>
                                            <div class="radial-crown-tol-display" id="radialCrownTolDisplay">
                                                Tol: +/- 1
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Space Props Panel Container -->
                            <div id="spacePropsContent" data-section="spacePropsContent" class="space-props-content">
                                <div class="panel-header">
                                    <button class="panel-collapse-btn" id="spacePropsCollapseBtn" title="Collapse/Expand">▼</button>
                                    Space Properties
                                    <div class="lifecycle-buttons">
                                        <button class="console-clear-button" id="refreshSpacePropsBtn" title="Refresh Panel" data-panel="spacePropsPanelRefreshBtn">🔄</button>
                                    </div>
                                </div>
                                <div class="properties-content">
                                    <!-- Public Properties -->
                                    <div data-section="publicPropsSection" class="space-props-section">
                                        <div class="space-props-header">
                                            <h3>Public Properties</h3>
                                            <span class="props-count" id="publicPropsCount">0</span>
                                        </div>
                                        <div class="props-list" id="publicPropsList">
                                            <div class="empty-props">No public properties</div>
                                        </div>
                                        <div class="add-prop-container">
                                            <input data-input="propertyPanelAddPublicPropKey" type="text" id="addPublicKey" class="prop-input" placeholder="Key">
                                            <input data-input="propertyPanelAddPublicPropValue" type="text" id="addPublicValue" class="prop-input" placeholder="Value">
                                            <button data-panel="propertyPanelAddPublicProp" onclick="addPublicProp()" class="add-prop-button">Add</button>
                                        </div>
                                    </div>

                                    <!-- Protected Properties -->
                                    <div data-section="protectedPropsSection" class="space-props-section">
                                        <div class="space-props-header">
                                            <h3>Protected Properties</h3>
                                            <span class="props-count" id="protectedPropsCount">0</span>
                                        </div>
                                        <div class="props-list" id="protectedPropsList">
                                            <div class="empty-props">No protected properties</div>
                                        </div>
                                        <div class="add-prop-container">
                                            <input data-input="propertyPanelAddProtectedPropKey" type="text" id="addProtectedKey" class="prop-input" placeholder="Key">
                                            <input data-input="propertyPanelAddProtectedPropValue" type="text" id="addProtectedValue" class="prop-input" placeholder="Value">
                                            <button data-panel="propertyPanelAddProtectedProp" onclick="addProtectedProp()" class="add-prop-button">Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Lifecycle Panel -->
                        <div data-panel="lifecyclePanel" class="lifecycle-panel" id="lifecyclePanel">
                            <div class="panel-header">
                                <button class="panel-collapse-btn" id="lifecycleCollapseBtn" title="Collapse/Expand">▼</button>
                                <span>Lifecycle</span>
                                <div class="lifecycle-buttons">
                                    <button class="console-clear-button" id="refreshPanelBtn" title="Refresh Panel" data-panel="lifecyclePanelRefreshBtn">🔄</button>
                                </div>
                            </div>
                            <div class="lifecycle-content">
                                <div data-section="lifecycleList" class="lifecycle-list" id="lifecycleList">
                                    <div class="empty-lifecycle">No active MonoBehavior scripts</div>
                                </div>
                                <div data-section="cmdShell" class="lifecycle-shell-container">
                                    <div class="shell-header">
                                        <span>Shell</span>
                                        <div class="shell-toggles">
                                            <button class="shell-toggle active" data-toggle="command" title="Command">Command</button>
                                            <button class="shell-toggle active" data-toggle="script" title="Scripts">Scripts</button>
                                            <button class="shell-toggle" data-toggle="oneShot" title="OneShot">OneShot</button>
                                            <button class="shell-toggle" data-toggle="spaceProps" title="SpaceProps">SpaceProps</button>
                                            <button class="shell-clear-button" id="clearShellBtn2" title="Clear Shell" data-panel="lifecyclePanelClearShellBtn">🗑️</button>
                                        </div>
                                    </div>
                                    <div class="lifecycle-shell" id="lifecycleShell"></div>
                                    <input class="command-shell-input" id="commandShellInput" placeholder="> cmd" data-input="lifecyclePanelCommandShellInput">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Component Menu Overlay -->
                <div class="component-menu-overlay" id="componentMenuOverlay" style="display: none;">
                    <div class="component-menu">
                        <div class="component-menu-header">
                            <h2>Add Component</h2>
                            <button class="close-button" id="closeComponentMenu" data-panel="componentMenuCloseBtn">×</button>
                        </div>
                        <div class="component-menu-search">
                            <input data-input="componentMenuSearchInput" type="text" class="component-search-input" id="componentSearchInput" placeholder="Search components...">
                        </div>
                        <div class="component-menu-content">
                            <!-- Component categories will be injected here -->
                            ${this.getComponentCategories()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inventory Page -->
            <div class="page" id="inventory-page">
                <div class="inventory-layout">
                    <div class="inventory-container"></div>
                    <div class="inventory-preview-pane" id="previewPane" style="display: none;"></div>
                </div>
            </div>

            <!-- Feedback Page -->
            <div class="page" id="feedback-page">
                ${this.getFeedbackPageHTML()}
            </div>

            <div class="quick-settings">
                <div class="reset-buttons">
                    <button data-toolbar-btn="hardResetBtn" class="reset-btn" onclick="SM.Reset(true)">⏻</button>
                    <button data-toolbar-btn="softResetBtn" class="reset-btn" onclick="window.location.reload()" style="background-color: #5b3d3d;">⟳</button>
                </div>
                <div data-toolbar-btn="fileServer">
                    <select class="file-server" id="fileServer" onchange="SM.changeFileServer(this.value)">
                        <option value="stable">Stable</option>
                        <option value="ngrok">Ngrok</option>
                        <option value="local">Local</option>
                    </select>
                </div>
            </div>
        </div>`;

        // Create a container div if target is body, otherwise inject directly
        if (this.targetElement === document.body) {
            const container = document.createElement('div');
            container.id = 'banter-inspector-root';
            container.innerHTML = inspectorHTML;
            this.targetElement.appendChild(container);
        } else {
            this.targetElement.innerHTML = inspectorHTML;
            // Ensure the target element has proper dimensions
            if (!this.targetElement.style.height) {
                this.targetElement.style.height = '100vh';
            }
        }
    }

    /**
     * Component metadata for menu generation
     * This mirrors the ComponentRegistry structure from index.js
     * Note: This could be refactored to dynamically load from ComponentRegistry
     * after modules are loaded, but for now it's static for injection time.
     */
    getComponentMetadata() {
        return {
            meshes: {
                icon: '🎨',
                name: 'Meshes',
                components: [
                    { type: 'Geometry', name: 'Geometry', desc: '3D procedural shapes' },
                    { type: 'Box', name: 'Box', desc: 'Box/cube primitive' },
                    { type: 'Sphere', name: 'Sphere', desc: 'Sphere primitive' },
                    { type: 'Circle', name: 'Circle', desc: 'Circle primitive' },
                    { type: 'Cone', name: 'Cone', desc: 'Cone primitive' },
                    { type: 'Cylinder', name: 'Cylinder', desc: 'Cylinder primitive' },
                    { type: 'Plane', name: 'Plane', desc: 'Flat plane primitive' },
                    { type: 'Ring', name: 'Ring', desc: 'Ring primitive' },
                    { type: 'Torus', name: 'Torus', desc: 'Torus/donut primitive' },
                    { type: 'TorusKnot', name: 'Torus Knot', desc: 'Torus knot geometry' },
                    { type: 'InvertedMesh', name: 'Inverted Mesh', desc: 'Inverted mesh (inside-out)' },
                    { type: 'Text', name: 'Text', desc: '3D text mesh' },
                    { type: 'Apple', name: 'Apple', desc: 'Apple parametric surface' },
                    { type: 'Catenoid', name: 'Catenoid', desc: 'Catenoid minimal surface' },
                    { type: 'Fermet', name: 'Fermat', desc: 'Fermat spiral surface' },
                    { type: 'Helicoid', name: 'Helicoid', desc: 'Helicoid minimal surface' },
                    { type: 'Horn', name: 'Horn', desc: 'Horn/trumpet surface' },
                    { type: 'Klein', name: 'Klein Bottle', desc: 'Klein bottle surface' },
                    { type: 'Mobius', name: 'Möbius Strip', desc: 'Möbius strip' },
                    { type: 'Mobius3d', name: 'Möbius 3D', desc: '3D Möbius surface' },
                    { type: 'Natica', name: 'Natica', desc: 'Seashell-like surface' },
                    { type: 'Pillow', name: 'Pillow', desc: 'Pillow-shaped surface' },
                    { type: 'Scherk', name: 'Scherk', desc: 'Scherk minimal surface' },
                    { type: 'Snail', name: 'Snail', desc: 'Snail shell surface' },
                    { type: 'Spiral', name: 'Spiral', desc: 'Spiral surface' },
                    { type: 'Spring', name: 'Spring', desc: 'Spring/helix surface' }
                ]
            },
            materials: {
                icon: '🎨',
                name: 'Materials',
                components: [
                    { type: 'Material', name: 'Material', desc: 'Surface appearance' },
                    { type: 'PhysicMaterial', name: 'Physic Material', desc: 'Physics material properties' }
                ]
            },
            physics: {
                icon: '⚛',
                name: 'Physics',
                components: [
                    { type: 'Rigidbody', name: 'Rigidbody', desc: 'Enables physics simulation' },
                    { type: 'BoxCollider', name: 'Box Collider', desc: 'Box-shaped collision' },
                    { type: 'SphereCollider', name: 'Sphere Collider', desc: 'Sphere-shaped collision' },
                    { type: 'CapsuleCollider', name: 'Capsule Collider', desc: 'Capsule-shaped collision' },
                    { type: 'MeshCollider', name: 'Mesh Collider', desc: 'Mesh-based collision' },
                    { type: 'ConfigurableJoint', name: 'Configurable Joint', desc: 'Configurable joint' },
                    { type: 'CharacterJoint', name: 'Character Joint', desc: 'Character ragdoll joint' },
                    { type: 'FixedJoint', name: 'Fixed Joint', desc: 'Fixed connection' },
                    { type: 'HingeJoint', name: 'Hinge Joint', desc: 'Rotational joint' },
                    { type: 'SpringJoint', name: 'Spring Joint', desc: 'Elastic spring connection' }
                ]
            },
            media: {
                icon: '🎬',
                name: 'Media',
                components: [
                    { type: 'GLTF', name: 'GLTF', desc: 'Load 3D models' },
                    { type: 'AudioSource', name: 'Audio Source', desc: 'Play sounds and music' },
                    { type: 'VideoPlayer', name: 'Video Player', desc: 'Play video content' },
                    { type: 'Billboard', name: 'Billboard', desc: 'Always faces camera' }
                ]
            },
            behaviors: {
                icon: '🤚',
                name: 'Behaviors',
                components: [
                    { type: 'GrabHandle', name: 'Grab Handle', desc: 'Basic grab mechanics' },
                    { type: 'Grabbable', name: 'Grabbable', desc: 'Advanced grab with VR controls' },
                    { type: 'ColliderEvents', name: 'Collider Events', desc: 'Trigger and collision events' },
                    { type: 'AttachedObject', name: 'Attached Object', desc: 'Attach to users' },
                    { type: 'SyncedObject', name: 'Synced Object', desc: 'Network synchronization' },
                    { type: 'HeldEvents', name: 'Held Events', desc: 'Input while holding' },
                    { type: 'MonoBehavior', name: 'MonoBehavior', desc: 'Custom script component' }
                ]
            },
            misc: {
                icon: '📦',
                name: 'Misc',
                components: [
                    { type: 'Mirror', name: 'Mirror', desc: 'Reflective surface' },
                    { type: 'Browser', name: 'Browser', desc: 'Embed web content' },
                    { type: 'AssetBundle', name: 'Asset Bundle', desc: 'Unity asset bundles' },
                    { type: 'Portal', name: 'Portal', desc: 'Portal to other spaces' },
                    { type: 'WorldObject', name: 'World Object', desc: 'World object reference' },
                    { type: 'StreetView', name: 'Street View', desc: 'Street view panorama' },
                    { type: 'KitItem', name: 'Kit Item', desc: 'Kit item component' },
                    { type: 'UIPanel', name: 'UI Panel', desc: 'UI with haptics and sounds' },
                    { type: 'AvatarPedestal', name: 'Avatar Pedestal', desc: 'Ready Player Me avatar' },
                    { type: 'Light', name: 'Light', desc: 'Light source (directional, point, spot)' }
                ]
            }
        };
    }

    /**
     * Generate component categories HTML from metadata
     * Dynamically builds the component menu from the metadata structure
     */
    getComponentCategories() {
        const metadata = this.getComponentMetadata();
        let html = '';

        for (const [categoryKey, categoryData] of Object.entries(metadata)) {
            html += `
        <!-- ${categoryData.name} Category -->
        <div class="component-category">
            <div class="category-header">
                <span class="category-icon">${categoryData.icon}</span>
                <span class="category-name">${categoryData.name}</span>
            </div>
            <div class="category-items">`;

            for (const component of categoryData.components) {
                html += `
                <div class="component-item" data-component="${component.type}">
                    <span class="component-item-name">${component.name}</span>
                    <span class="component-item-desc">${component.desc}</span>
                </div>`;
            }

            html += `
            </div>
        </div>`;
        }

        return html;
    }

    getFeedbackPageHTML() {
        return `
        <div class="feedback-split-layout">
            <!-- Left Side - Feedback Form -->
            <div class="feedback-left-panel">
                <div class="feedback-container">
                    <div class="feedback-header">
                        <h2>Help Improve the Inspector</h2>
                        <p>Your feedback helps us make the inspector better for everyone</p>
                    </div>

                    <div class="feedback-form">
                        <div class="feedback-section">
                            <label class="feedback-label">What would you like to share?</label>
                            <div class="feedback-type-selector">
                                <button class="feedback-type-btn active" data-type="feature">
                                    <span class="feedback-type-icon">✨</span>
                                    Feature
                                </button>
                                <button class="feedback-type-btn" data-type="bug">
                                    <span class="feedback-type-icon">🐛</span>
                                    Bug
                                </button>
                                <button class="feedback-type-btn" data-type="improvement">
                                    <span class="feedback-type-icon">💡</span>
                                    Idea
                                </button>
                            </div>
                        </div>

                        <div class="feedback-section">
                            <label class="feedback-label" for="feedbackDetails">Your Feedback</label>
                            <div class="feedback-input feedback-input-container">
                                <textarea data-input="feedbackDetails" id="feedbackDetails" class="feedback-textarea" rows="6" placeholder="Please provide as much detail as possible..."></textarea>
                                <button data-feedback="feedbacMicButton" id="micButton" class="mic-button" title="Click to record feedback">
                                    <span class="mic-status"></span>
                                    <span class="mic-icon">🎤</span>
                                    <span class="recording-indicator"></span>
                                </button>
                            </div>
                            <div id="speechStatus" class="speech-status" style="display: none;"></div>

                            <!-- Block Editor Container -->
                            <div id="blockEditorContainer" class="block-editor-container" style="display: none;">
                                <div class="block-editor-header">
                                    <h3>Refined Feedback</h3>
                                    <button data-feedback="feedbackClearDraftBtn" id="clearDraftBtn" class="clear-draft-btn" title="Clear draft and start over" style="display: none;">
                                        <span class="btn-icon">🗑️</span>
                                        Clear Draft
                                    </button>
                                </div>
                                <div class="block-editor-content">
                                    <div id="blocksList" class="blocks-list"></div>
                                </div>
                            </div>
                        </div>

                        <div class="feedback-actions">
                            <button data-feedback="feedbackSubmitBtn" id="submitFeedbackBtn" class="feedback-submit-btn">
                                <span class="btn-icon">📤</span>
                                Submit Feedback
                            </button>
                            <div id="dualSubmitButtons" class="dual-submit-buttons" style="display: none;">
                                <button data-feedback="feedbackSubmitOriginalBtn" id="submitOriginalBtn" class="feedback-submit-btn submit-original">
                                    <span class="btn-icon">📄</span>
                                    Submit Original
                                </button>
                                <button data-feedback="feedbackSubmitRefinementBtn" id="submitRefinementBtn" class="feedback-submit-btn submit-original">
                                    <span class="btn-icon">✨</span>
                                    Submit Refinement
                                </button>
                                <button data-feedback="feedbackFixWithVoiceBtn" id="fixWithVoice" class="feedback-submit-btn submit-original">
                                    <span class="btn-icon">🎤</span>
                                    Fix with Voice
                                </button>
                            </div>
                        </div>

                        <div id="feedbackStatus" class="feedback-status" style="display: none;"></div>
                    </div>

                    <div class="feedback-footer">
                        <p>You can also contribute directly on <a href="https://github.com/saternius/BanterInspector" target="_blank">GitHub</a></p>
                    </div>
                </div>
            </div>

            <!-- Right Side - Tickets List -->
            <div class="feedback-right-panel">
                <div class="tickets-container">
                    <div class="tickets-header">
                        <h2>Active Tickets</h2>
                        <button data-feedback="feedbackRefreshTicketsBtn" id="refreshTicketsBtn" class="refresh-tickets-btn" title="Refresh tickets">
                            <span class="btn-icon">🔄</span>
                        </button>
                    </div>

                    <div class="tickets-filters">
                        <select data-feedback="feedbackTicketFilterType" id="ticketFilterType" class="ticket-filter">
                            <option value="all">All Types</option>
                            <option value="feature">Features</option>
                            <option value="bug">Bugs</option>
                            <option value="improvement">Improvements</option>
                        </select>
                        <select data-feedback="feedbackTicketFilterStatus" id="ticketFilterStatus" class="ticket-filter">
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="qa">QA</option>
                            <option value="postponed">Postponed</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    <div id="ticketsList" class="tickets-list">
                        <div class="loading-tickets">Loading tickets...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ticket Detail Modal -->
        <div id="ticketDetailModal" class="ticket-detail-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTicketId"></h3>
                    <button class="modal-close" data-feedback="feedbackTicketDetailModalCloseBtn" onclick="closeTicketModal()">×</button>
                </div>
                <div id="modalTicketContent" class="modal-body"></div>
            </div>
        </div>

        <!-- Ticket Edit Modal -->
        <div id="ticketEditModal" class="ticket-edit-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Feedback</h3>
                    <button class="modal-close" data-feedback="feedbackTicketEditModalCloseBtn" onclick="feedback.closeEditModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="edit-form-group">
                        <label for="ticketEditContent">Feedback Details:</label>
                        <textarea id="ticketEditContent" class="ticket-edit-textarea" rows="8" placeholder="Enter your feedback details..."></textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-save-btn" data-feedback="feedbackTicketEditModalSaveBtn" onclick="feedback.saveTicketEdit()">Save Changes</button>
                        <button class="modal-cancel-btn" data-feedback="feedbackTicketEditModalCancelBtn" onclick="feedback.closeEditModal()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    initializeApp() {
        // Load the main app module
        const script = document.createElement('script');
        script.type = 'module';
        script.src = window.repoUrl + '/js/app.js';

        window.repoUrl += '/js';
        document.body.appendChild(script);
        this.injected = true;
    }

    destroy() {
        // Clean up if needed
        if (this.targetElement === document.body) {
            const container = document.getElementById('banter-inspector-root');
            if (container) {
                container.remove();
            }
        } else {
            this.targetElement.innerHTML = '';
        }
        this.injected = false;
    }
}

// Export for use as a module
export default InspectorInjector;