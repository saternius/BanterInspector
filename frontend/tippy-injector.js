/**
 * Tippy Injector
 * This module can be imported to inject the entire Tippy application into any HTML page
 *
 * Usage:
 * <script type="module">
 *   import { TippyInjector } from './tippy-injector.js';
 *   const tippy = new TippyInjector({
 *     targetElement: document.body, // or any container element
 *     config: {
 *       ngrokUrl: 'https://your-ngrok-url.ngrok-free.app',
 *       fileServer: 'ngrok' // or 'stable', 'local', 'unity'
 *     }
 *   });
 *   tippy.inject();
 * </script>
 */

export class TippyInjector {
    constructor(options = {}) {
        window.FIREBASE_CONFIG = options.config.firebaseConfig;
        this.targetElement = options.targetElement || document.body;
        this.config = {
            serverUrl: options.config?.serverUrl || 'https://app.tippy.dev',
            ...options.config
        };
        this.injected = false;
        this.templateLoader = null;
        this.tippyConfig = null;
    }

    async inject() {
        if (this.injected) {
            console.warn('Tippy already injected');
            return;
        }

        // Set up global configuration
        this.setupGlobalConfig();

        // Inject external dependencies
        this.injectDependencies();

        // Load template and config modules
        await this.loadModules();

        // Inject the Tippy HTML
        await this.injectHTML();

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
        window.repoUrl = this.config.serverUrl;
        // window.isLocalHost = window.location.hostname === 'localhost';
        // window.repoUrl = '.';

        // window.fileServer = this.config.fileServer;
        // if (!window.fileServer) {
        //     localStorage.setItem('file_server', 'ngrok');
        //     window.fileServer = 'ngrok';
        // }

        // if (window.fileServer === 'stable') {
        //     window.repoUrl = 'https://saternius.github.io/BanterInspector/frontend';
        // } else if (window.fileServer === 'ngrok') {
        //     window.repoUrl = window.ngrokUrl;
        // } else if (window.fileServer === 'local') {
        //     window.repoUrl = 'http://192.168.0.148:9909';
        // } else if (window.fileServer === 'unity') {
        //     if (window.isLocalHost) {
        //         window.repoUrl = 'http://localhost:42069/frontend';
        //     } else {
        //         console.log('Unity is not running on localhost');
        //     }
        // }

        window.blockServiceUrl = `${window.ngrokUrl}/api/process-text`;
        window.blend2endServiceUrl = `${window.ngrokUrl}/api/format-blend2end`;
    }

    async loadModules() {
        // Import template loader and config
        const [templateLoaderModule, configModule] = await Promise.all([
            import(`${window.repoUrl}/js/template-loader.js`),
            import(`${window.repoUrl}/js/config.js`)
        ]);

        this.templateLoader = new templateLoaderModule.TemplateLoader(window.repoUrl);
        this.tippyConfig = new configModule.TippyConfig(this.config);

        // Store config globally for other modules
        window.tippyConfig = this.tippyConfig;
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
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js'
            },
            {
                type: 'script',
                src: 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
            },
            {
                type: 'link',
                rel: 'stylesheet',
                src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
            },
            {
                type: 'link',
                rel: 'stylesheet',
                src: 'https://cdn.jsdelivr.net/npm/vanilla-js-dropdown@2.2.0/dist/vanilla-js-dropdown.min.css'
            },
            {
                type: 'link',
                rel: 'stylesheet',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css'
            },
            {
                type: 'script',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js'
            },
            {
                type: 'script',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js'
            },
            {
                type: 'script',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/search/searchcursor.min.js'
            },
            {
                type: 'script',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/dialog/dialog.min.js'
            },
            {
                type: 'script',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/search/search.min.js'
            },
            {
                type: 'link',
                rel: 'stylesheet',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/dialog/dialog.min.css'
            },
            {
                type: 'link',
                rel: 'stylesheet',
                src: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/monokai.min.css'
            }
        ];

        dependencies.forEach(dep => {
            if (dep.type === 'script') {
                const script = document.createElement('script');
                script.src = dep.src;
                script.async = false;
                document.head.appendChild(script);
            } else if (dep.type === 'link') {
                const link = document.createElement('link');
                link.rel = dep.rel;
                link.href = dep.src;
                document.head.appendChild(link);
            }
        });
    }

    injectStyles() {
        // Add a small delay to ensure styles are applied after HTML is injected
        setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = window.repoUrl + '/styles.css';
            document.head.appendChild(link);

            // Add container-specific styles to fix layout when not injecting into body
            const style = document.createElement('style');
            style.textContent = `
                #tippy-root,
                #tippyContainer {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: relative;
                }

                #tippy-root .page-container,
                #tippyContainer .page-container {
                    display: block !important;
                }
            `;
            document.head.appendChild(style);

            this.initializeApp();
        }, 1000);
    }

    async injectHTML() {
        // Load templates (required)
        console.log('Loading templates...');
        const templates = await this.templateLoader.loadAll();

        // Build HTML from templates
        const tippyHTML = await this.buildHTMLFromTemplates(templates);

        // Create a container div if target is body, otherwise inject directly
        if (this.targetElement === document.body) {
            const container = document.createElement('div');
            container.id = 'tippy-root';
            container.innerHTML = tippyHTML;
            this.targetElement.appendChild(container);
        } else {
            this.targetElement.innerHTML = tippyHTML;
            // Ensure the target element has proper dimensions
            if (!this.targetElement.style.height) {
                this.targetElement.style.height = '100vh';
            }
        }
    }

    async buildHTMLFromTemplates(templates) {
        // Replace placeholder for component categories in world-inspector template
        let worldInspectorHTML = templates['world-inspector'] || '';
        worldInspectorHTML = worldInspectorHTML.replace(
            '<!-- Component categories will be injected here dynamically -->',
            this.getComponentCategories()
        );

        // Replace space props placeholder
        worldInspectorHTML = worldInspectorHTML.replace(
            '<div id="spacePropsPlaceholder"></div>',
            templates['space-props'] || ''
        );

        // Build main container with quick settings
        const quickSettingsHTML = `
            <div class="quick-settings">
                <div class="reset-buttons">
                    <button data-toolbar-btn="hardResetBtn" class="reset-btn" data-action="hard-reset">⏻</button>
                    <button data-toolbar-btn="softResetBtn" class="reset-btn" data-action="soft-reset" style="background-color: #5b3d3d;">⟳</button>
                </div>
            </div>
        `;

        return `
            ${templates.navigation || ''}
            <!-- Page Container -->
            <div class="page-container">
                ${worldInspectorHTML}
                ${templates.inventory || ''}
                ${templates.feedback || ''}
                ${quickSettingsHTML}
            </div>
        `;
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
                    { type: 'Cylinder', name: 'Cylinder', desc: 'Cylinder primitive' },
                    { type: 'Sphere', name: 'Sphere', desc: 'Sphere primitive' },
                    { type: 'Circle', name: 'Circle', desc: 'Circle primitive' },
                    { type: 'Cone', name: 'Cone', desc: 'Cone primitive' },
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
                    { type: 'AudioSource', name: 'Audio Source', desc: 'Audio playback' },
                    { type: 'VideoPlayer', name: 'Video Player', desc: 'Video playback' },
                    { type: 'GLTF', name: 'GLTF Model', desc: '3D model loader' }
                ]
            },
            behaviors: {
                icon: '⚡',
                name: 'Behaviors',
                components: [
                    { type: 'MonoBehavior', name: 'MonoBehavior', desc: 'Script behavior' },
                    { type: 'GrabHandle', name: 'Grab Handle', desc: 'Interactive grab handle' },
                    { type: 'Grabbable', name: 'Grabbable', desc: 'Grabbable object' },
                    { type: 'SyncedObject', name: 'Synced Object', desc: 'Multi-user synchronization' },
                    { type: 'HeldEvents', name: 'Held Events', desc: 'Events when object is held' },
                    { type: 'AttachedObject', name: 'Attached Object', desc: 'Attach to users' },
                    { type: 'ColliderEvents', name: 'Collider Events', desc: 'Collision/trigger events' }
                ]
            },
            misc: {
                icon: '🔧',
                name: 'Misc',
                components: [
                    { type: 'Light', name: 'Light', desc: 'Light source' },
                    { type: 'Mirror', name: 'Mirror', desc: 'Reflective surface' },
                    { type: 'Browser', name: 'Browser', desc: 'Web browser display' },
                    { type: 'AssetBundle', name: 'Asset Bundle', desc: 'Load Unity asset bundles' },
                    { type: 'Portal', name: 'Portal', desc: 'Teleport to other spaces' },
                    { type: 'WorldObject', name: 'World Object', desc: 'World object reference' },
                    { type: 'StreetView', name: 'Street View', desc: 'Google Street View integration' },
                    { type: 'KitItem', name: 'Kit Item', desc: 'Kit item reference' },
                    { type: 'UIPanel', name: 'UI Panel', desc: 'UI panel with haptics and sounds' }
                ]
            }
        };
    }

    getComponentCategories() {
        const metadata = this.getComponentMetadata();
        let html = '';

        for (const [, categoryData] of Object.entries(metadata)) {
            html += `
        <!-- ${categoryData.name} Category -->
        <div class="component-category">
            <div class="category-header">
                <span class="category-icon">${categoryData.icon}</span>
                <span class="category-name">${categoryData.name}</span>
                <span class="category-count">${categoryData.components.length}</span>
            </div>
            <div class="category-components">`;

            categoryData.components.forEach(comp => {
                html += `
                <div class="component-item" data-component="${comp.type}">
                    <div class="component-name">${comp.name}</div>
                </div>`;
            });

            html += `
            </div>
        </div>`;
        }

        return html;
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
            const container = document.getElementById('tippy-root');
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
export default TippyInjector;