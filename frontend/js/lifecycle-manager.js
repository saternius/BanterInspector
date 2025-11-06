/**
 * Lifecycle Manager
 * Singleton that manages lifecycle events for all ScriptRunner components
 */
let localhost = window.location.hostname === 'localhost'
export class LifecycleManager {
    constructor() {
        this.startupExecutionStart = {
            onInspectorLoaded: false,
            onSceneLoaded: false
        }
        this.startupExecutionComplete = {
            onInspectorLoaded: false,
            onSceneLoaded: false
        }
        this.scriptRunners = new Map(); // Map of componentId -> ScriptRunner instance
        this.fps = 30; // Default 45 FPS for onUpdate
        this.updateInterval = null;
        this.isRunning = false;
        this.contexts = []
        // Setup keyboard event listeners
        this.setupKeyboardListeners();
        return this;
    }


    recordContext(context){
        //this.contexts.push(context); // This is only for debugging
    }
    
    /**
     * Register a ScriptRunner component
     */
    async registerScriptRunner(scriptRunner) {
        this.scriptRunners.set(scriptRunner.id, scriptRunner);        
        // Start the lifecycle if this is the first component
        if (this.scriptRunners.size === 1 && !this.isRunning) {
            this.start();
        }

        this.pruneOrphanedScriptRunners();
        inspector.lifecyclePanel.render()
    }

    pruneOrphanedScriptRunners(){
        // TODO
    }
    
    /**
     * Unregister a ScriptRunner component
     */
    unregisterScriptRunner(scriptRunner) {
        if(!scriptRunner) return;
        // Call onDestroy before removing
        this.scriptRunners.delete(scriptRunner.id);
        // Stop the lifecycle if no components remain
        if (this.scriptRunners.size === 0) {
            this.stop();
        }
        this.pruneOrphanedScriptRunners();
        inspector.lifecyclePanel.render()
    }
    
    /**
     * Start the lifecycle manager
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Start update loop
        const intervalMs = 1000 / this.fps;
        this.updateInterval = setInterval(() => {
            this.triggerUpdate();
        }, intervalMs);
        
        log('lifecycle', `LifecycleManager started with ${this.fps} FPS`);
        inspector.lifecyclePanel.render()
    }
    
    /**
     * Stop the lifecycle manager
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        // Stop update loop
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        log('lifecycle', 'LifecycleManager stopped');
        inspector.lifecyclePanel.render()
    }
    
    /**
     * Set the FPS for update events
     */
    setFPS(fps) {
        this.fps = Math.max(1, Math.min(120, fps)); // Clamp between 1-120 FPS
        
        // Restart the update loop if running
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    
    /**
     * Trigger onUpdate for all registered behaviors
     */
    triggerUpdate() {
        this.scriptRunners.forEach((scriptRunner, componentId) => {
            scriptRunner._update();
        });
    }

    relayEventToScriptRunners(event, key){
        this.scriptRunners.forEach((scriptRunner, componentId) => {
            if (scriptRunner.ctx[event] && typeof scriptRunner.ctx[event] === 'function') {
                try {
                    scriptRunner.ctx[event](key);
                } catch (error) {
                    err('lifecycle', `Error in ${event} for ${componentId}:`, error);
                }
            }
        });
    }
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        // KeyDown event
        document.addEventListener('keydown', (event) => {
            this.relayEventToScriptRunners('onKeyDown', event.key);
        });
        
        // KeyUp event
        document.addEventListener('keyup', (event) => {
            this.relayEventToScriptRunners('onKeyUp', event.key);
        });
        
        // KeyPress event (deprecated but included for compatibility)
        document.addEventListener('keypress', (event) => {
            this.relayEventToScriptRunners('keyPress', event.key);
        });
    }

    keyDown(key){
        this.relayEventToScriptRunners('onKeyDown', key);
    }

    keyUp(key){
        this.relayEventToScriptRunners('onKeyUp', key);
    }

    keyPress(key){
        this.relayEventToScriptRunners('keyPress', key);
    }

}

// Create and export singleton instance
export const lifecycle = new LifecycleManager();
window.lifecycle = lifecycle; // For debugging

/**
 * Global LifecycleAPI for runtime inspection
 * Provides easy access to running ScriptRunner scripts
 */
window.LifecycleAPI = {
    /**
     * Get the lifecycle manager instance
     */
    get manager() {
        return lifecycle;
    },

    /**
     * Get all running ScriptRunners
     * @returns {Array} Array of ScriptRunner instances with metadata
     */
    getAllScripts() {
        const scripts = [];
        lifecycle.scriptRunners.forEach((scriptRunner, id) => {
            scripts.push({
                id,
                scriptFile: mb.properties?.file,
                entity: mb._entity ? {
                    eid: mb._entity.eid,
                    name: mb._entity.name,
                    active: mb._entity.active,
                    layer: mb._entity.layer
                } : null,
                running: mb.ctx?._running,
                initialized: mb._initialized,
                owner: mb.properties?._owner,
                vars: mb.properties?.vars,
                instance: mb
            });
        });
        return scripts;
    },

    /**
     * Get scripts by entity name
     * @param {string} entityName - Name of entity to search for
     * @returns {Array} Array of ScriptRunner instances on that entity
     */
    getByEntity(entityName) {
        return this.getAllScripts().filter(s => s.entity?.name === entityName);
    },

    /**
     * Get scripts by file name
     * @param {string} fileName - Script file name to search for
     * @returns {Array} Array of ScriptRunner instances using that script
     */
    getByFile(fileName) {
        return this.getAllScripts().filter(s => s.scriptFile === fileName);
    },

    /**
     * Get running scripts only
     * @returns {Array} Array of currently running ScriptRunner instances
     */
    getRunning() {
        return this.getAllScripts().filter(s => s.running);
    },

    /**
     * Get scripts by owner
     * @param {string} owner - Owner name to filter by
     * @returns {Array} Array of ScriptRunner instances owned by that user
     */
    getByOwner(owner) {
        return this.getAllScripts().filter(s => s.owner === owner);
    },

    /**
     * Get lifecycle methods available on a script
     * @param {string} scriptId - ScriptRunner component ID
     * @returns {Object} Object with lifecycle method availability
     */
    getLifecycleMethods(scriptId) {
        const mb = lifecycle.scriptRunners.get(scriptId);
        if (!mb?.ctx) return null;

        return {
            onStart: typeof mb.ctx.onStart === 'function',
            onUpdate: typeof mb.ctx.onUpdate === 'function',
            onDestroy: typeof mb.ctx.onDestroy === 'function',
            onLoaded: typeof mb.ctx.onLoaded === 'function',
            onVarChange: typeof mb.ctx.onVarChange === 'function',
            onKeyDown: typeof mb.ctx.onKeyDown === 'function',
            onKeyUp: typeof mb.ctx.onKeyUp === 'function'
        };
    },

    /**
     * Get custom methods defined on a script (non-lifecycle)
     * @param {string} scriptId - ScriptRunner component ID
     * @returns {Array} Array of custom method names
     */
    getCustomMethods(scriptId) {
        const mb = lifecycle.scriptRunners.get(scriptId);
        if (!mb?.ctx) return [];

        const standardKeys = [
            'vars', '_running', 'onStart', 'onLoaded', 'onUpdate', 'onDestroy',
            'onVarChange', 'onKeyDown', 'onKeyUp', 'keyDown', 'keyUp', 'keyPress',
            'log', '_entity', '_scene', '_BS', '_component', 'default'
        ];

        return Object.keys(mb.ctx).filter(key =>
            !standardKeys.includes(key) && typeof mb.ctx[key] === 'function'
        );
    },

    /**
     * Call a custom method on a ScriptRunner
     * @param {string} scriptId - ScriptRunner component ID
     * @param {string} methodName - Method name to call
     * @param {...any} args - Arguments to pass to the method
     * @returns {any} Return value of the method
     */
    callMethod(scriptId, methodName, ...args) {
        const mb = lifecycle.scriptRunners.get(scriptId);
        if (!mb?.ctx?.[methodName]) {
            throw new Error(`Method ${methodName} not found on script ${scriptId}`);
        }

        if (typeof mb.ctx[methodName] !== 'function') {
            throw new Error(`${methodName} is not a function`);
        }

        return mb.ctx[methodName](...args);
    },

    /**
     * Get statistics about the lifecycle system
     * @returns {Object} Statistics object
     */
    getStats() {
        const all = this.getAllScripts();
        const running = all.filter(s => s.running);

        // Count by file
        const byFile = {};
        all.forEach(s => {
            byFile[s.scriptFile] = (byFile[s.scriptFile] || 0) + 1;
        });

        // Count by owner
        const byOwner = {};
        all.forEach(s => {
            if (s.owner) {
                byOwner[s.owner] = (byOwner[s.owner] || 0) + 1;
            }
        });

        return {
            total: all.length,
            running: running.length,
            fps: lifecycle.fps,
            isRunning: lifecycle.isRunning,
            byFile,
            byOwner,
            files: Object.keys(byFile),
            owners: Object.keys(byOwner)
        };
    },

    /**
     * List all scripts with basic info
     */
    list() {
        const scripts = this.getAllScripts();
        console.table(scripts.map(s => ({
            id: s.id,
            file: s.scriptFile,
            entity: s.entity?.name,
            running: s.running,
            owner: s.owner
        })));
        return scripts;
    },

    /**
     * Get detailed info about a specific script
     * @param {string} scriptId - ScriptRunner component ID
     * @returns {Object} Detailed information object
     */
    getInfo(scriptId) {
        const mb = lifecycle.scriptRunners.get(scriptId);
        if (!mb) {
            console.warn(`Script ${scriptId} not found`);
            return null;
        }

        const info = {
            id: scriptId,
            scriptFile: mb.properties?.file,
            entity: mb._entity ? {
                eid: mb._entity.eid,
                name: mb._entity.name,
                active: mb._entity.active,
                layer: mb._entity.layer
            } : null,
            running: mb.ctx?._running,
            initialized: mb._initialized,
            owner: mb.properties?._owner,
            vars: mb.properties?.vars,
            lifecycleMethods: this.getLifecycleMethods(scriptId),
            customMethods: this.getCustomMethods(scriptId),
            inventoryItem: mb.inventoryItem ? {
                name: mb.inventoryItem.name,
                folder: mb.inventoryItem.folder,
                author: mb.inventoryItem.author,
                created: new Date(mb.inventoryItem.created).toLocaleString(),
                startup: mb.inventoryItem.startup
            } : null
        };

        console.log('ScriptRunner Info:', info);
        return info;
    },

    /**
     * Set the FPS for update loops
     * @param {number} fps - Target FPS (1-120)
     */
    setFPS(fps) {
        lifecycle.setFPS(fps);
        console.log(`Update FPS set to ${lifecycle.fps}`);
    },

    /**
     * Start the lifecycle manager
     */
    start() {
        lifecycle.start();
    },

    /**
     * Stop the lifecycle manager
     */
    stop() {
        lifecycle.stop();
    }
};

console.log('[LifecycleAPI] Exposed globally with monitoring for', lifecycle.scriptRunners.size, 'ScriptRunner scripts');