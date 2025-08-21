/**
 * Lifecycle Manager
 * Singleton that manages lifecycle events for all MonoBehavior components
 */
let localhost = window.location.hostname === 'localhost'
export class LifecycleManager {
    constructor() {
        this.monoBehaviors = new Map(); // Map of componentId -> MonoBehavior instance
        this.fps = 30; // Default 30 FPS for onUpdate
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
     * Register a MonoBehavior component
     */
    async registerMonoBehavior(monoBehavior) {
        this.monoBehaviors.set(monoBehavior.id, monoBehavior);        
        // Start the lifecycle if this is the first component
        if (this.monoBehaviors.size === 1 && !this.isRunning) {
            this.start();
        }

        this.pruneOrphanedMonoBehaviors();
        inspector.lifecyclePanel.render()
    }

    pruneOrphanedMonoBehaviors(){
        // TODO
    }
    
    /**
     * Unregister a MonoBehavior component
     */
    unregisterMonoBehavior(monoBehavior) {
        if(!monoBehavior) return;
        // Call onDestroy before removing
        this.monoBehaviors.delete(monoBehavior.id);
        // Stop the lifecycle if no components remain
        if (this.monoBehaviors.size === 0) {
            this.stop();
        }
        this.pruneOrphanedMonoBehaviors();
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
        this.monoBehaviors.forEach((monoBehavior, componentId) => {
            monoBehavior._update();
        });
    }

    relayEventToMonoBehaviors(event, key){
        this.monoBehaviors.forEach((monoBehavior, componentId) => {
            if (monoBehavior.ctx[event] && typeof monoBehavior.ctx[event] === 'function') {
                try {
                    monoBehavior.ctx[event](key);
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
            this.relayEventToMonoBehaviors('onKeyDown', event.key);
        });
        
        // KeyUp event
        document.addEventListener('keyup', (event) => {
            this.relayEventToMonoBehaviors('onKeyUp', event.key);
        });
        
        // KeyPress event (deprecated but included for compatibility)
        document.addEventListener('keypress', (event) => {
            this.relayEventToMonoBehaviors('keyPress', event.key);
        });
    }

    keyDown(key){
        this.relayEventToMonoBehaviors('onKeyDown', key);
    }

    keyUp(key){
        this.relayEventToMonoBehaviors('onKeyUp', key);
    }

    keyPress(key){
        this.relayEventToMonoBehaviors('keyPress', key);
    }

}

// Create and export singleton instance
export const lifecycle = new LifecycleManager();
window.lifecycle = lifecycle; // For debugging