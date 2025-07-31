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
        //console.log("[LIFECYCLE] registering monoBehavior =>", monoBehavior.id)
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
        //console.log("[LIFECYCLE] unregistering monoBehavior =>", monoBehavior.id)

       
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
        
        console.log(`LifecycleManager started with ${this.fps} FPS`);
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
        
        console.log('LifecycleManager stopped');
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
    
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardListeners() {
        // KeyDown event
        document.addEventListener('keydown', (event) => {
            this.monoBehaviors.forEach((monoBehavior, componentId) => {
                if (monoBehavior.onKeyDown && typeof monoBehavior.onKeyDown === 'function') {
                    try {
                        monoBehavior.onKeyDown(event.key);
                    } catch (error) {
                        console.error(`Error in onKeyDown for ${componentId}:`, error);
                    }
                }
                
                // Also trigger keyDown for backward compatibility
                if (monoBehavior.keyDown && typeof monoBehavior.keyDown === 'function') {
                    try {
                        monoBehavior.keyDown(event.key);
                    } catch (error) {
                        console.error(`Error in keyDown for ${componentId}:`, error);
                    }
                }
            });
        });
        
        // KeyUp event
        document.addEventListener('keyup', (event) => {
            this.monoBehaviors.forEach((monoBehavior, componentId) => {
                if (monoBehavior.onKeyUp && typeof monoBehavior.onKeyUp === 'function') {
                    try {
                        monoBehavior.onKeyUp(event.key);
                    } catch (error) {
                        console.error(`Error in onKeyUp for ${componentId}:`, error);
                    }
                }
                
                // Also trigger keyUp for backward compatibility
                if (monoBehavior.keyUp && typeof monoBehavior.keyUp === 'function') {
                    try {
                        monoBehavior.keyUp(event.key);
                    } catch (error) {
                        console.error(`Error in keyUp for ${componentId}:`, error);
                    }
                }
            });
        });
        
        // KeyPress event (deprecated but included for compatibility)
        document.addEventListener('keypress', (event) => {
            this.monoBehaviors.forEach((monoBehavior, componentId) => {
                if (monoBehavior.keyPress && typeof monoBehavior.keyPress === 'function') {
                    try {
                        monoBehavior.keyPress(event.key);
                    } catch (error) {
                        console.error(`Error in keyPress for ${componentId}:`, error);
                    }
                }
            });
        });
    }

}

// Create and export singleton instance
export const lifecycle = new LifecycleManager();
window.lifecycle = lifecycle; // For debugging