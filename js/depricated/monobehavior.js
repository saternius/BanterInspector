/**
 * MonoBehavior Component
 * Implements Unity-style scripting for inspector objects
 */

let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { lifecycleManager } = await import(`${basePath}/lifecycle-manager.js`);

export class MonoBehavior {
    constructor(slot, componentData) {
        this.slot = slot;
        this.id = componentData.id;
        this.type = 'MonoBehavior';
        this.properties = componentData.properties || {
            name: 'myScript',
            file: null,
            vars: {}
        };
        
        // Script instance and context
        this.scriptInstance = null;
        this.scriptContext = null;
        
        // If a file is already set, load it
        if (this.properties.file) {
            this.loadScript(this.properties.file);
        }
        this.transform = slot.components.find(c=>c.type === 'Transform')
    }
    
    /**
     * Load a script from inventory
     */
    async loadScript(fileName) {
        console.log("Loading script: ", fileName)
        if (!fileName) return;
        
        // Get the script from inventory
        const inventoryItem = window.inventory?.items?.[fileName];
        console.log("inventoryItem =>", inventoryItem)
        if (!inventoryItem || inventoryItem.itemType !== 'script') {
            console.error(`Script "${fileName}" not found in inventory`);
            return;
        }
        
        try {
            // Create a new context for the script
            this.scriptContext = {
                vars: {},
                onStart: null,
                onUpdate: null,
                onDestroy: null,
                onKeyDown: null,
                onKeyUp: null,
                keyDown: null,
                keyUp: null,
                keyPress: null,
                slot: this.slot, // Reference to the slot
                scene: window.scene, // Reference to the scene
                BS: window.BS, // Reference to BanterScript library
                transform: this.transform
            };
            
            // Execute the script in the context
            const scriptFunction = new Function(`
                ${inventoryItem.data}
            `);

            console.log("scriptFunction =>", scriptFunction)
            
            // Bind the function to our context and execute
            scriptFunction.call(this.scriptContext);
            
            // Extract vars definition if present
            if (this.scriptContext.vars) {
                // Initialize vars with defaults
                const varDefinitions = this.scriptContext.vars;
                const initializedVars = {};
                
                for (const [varName, varDef] of Object.entries(varDefinitions)) {
                    if (this.properties.vars[varName] !== undefined) {
                        // Use existing value
                        initializedVars[varName] = this.properties.vars[varName];
                    } else if (varDef.default !== undefined) {
                        // Use default value
                        initializedVars[varName] = varDef.default;
                    } else {
                        // Initialize based on type
                        switch (varDef.type) {
                            case 'number':
                                initializedVars[varName] = 0;
                                break;
                            case 'string':
                                initializedVars[varName] = '';
                                break;
                            case 'boolean':
                                initializedVars[varName] = false;
                                break;
                            case 'vector3':
                                initializedVars[varName] = { x: 0, y: 0, z: 0 };
                                break;
                            case 'color':
                                initializedVars[varName] = { r: 1, g: 1, b: 1, a: 1 };
                                break;
                            default:
                                initializedVars[varName] = null;
                        }
                    }
                }
                
                this.properties.vars = initializedVars;
                this.scriptContext.vars = initializedVars;
            }
            
            // Store the script instance
            this.scriptInstance = this.scriptContext;
            
            // Register with lifecycle manager
            lifecycleManager.registerMonoBehavior(this.id, this.scriptContext);
            
            console.log(`Script "${fileName}" loaded successfully for ${this.properties.name}`);
            
        } catch (error) {
            console.error(`Error loading script "${fileName}":`, error);
        }
    }
    
    /**
     * Unload the current script
     */
    unloadScript() {
        if (this.scriptInstance) {
            // Unregister from lifecycle manager
            lifecycleManager.unregisterMonoBehavior(this.id);
            
            this.scriptInstance = null;
            this.scriptContext = null;
        }
    }
    
    /**
     * Update a variable value
     */
    updateVar(varName, value) {
        if (this.properties.vars.hasOwnProperty(varName)) {
            this.properties.vars[varName] = value;
            
            // Update the script context if loaded
            if (this.scriptContext && this.scriptContext.vars) {
                this.scriptContext.vars[varName] = value;
            }
        }
    }
    
    /**
     * Get available script files from inventory
     */
    static getAvailableScripts() {
        if (!window.inventory || !window.inventory.items) return [];
        
        return Object.entries(window.inventory.items)
            .filter(([key, item]) => item.itemType === 'script')
            .map(([key, item]) => ({
                name: item.name,
                fileName: item.name,
                author: item.author,
                created: item.created
            }));
    }
    
    /**
     * Clean up when component is destroyed
     */
    destroy() {
        this.unloadScript();
    }
}