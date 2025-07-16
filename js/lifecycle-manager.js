/**
 * Lifecycle Manager
 * Singleton that manages lifecycle events for all MonoBehavior components
 */

export class LifecycleManager {
    constructor() {
        if (LifecycleManager.instance) {
            return LifecycleManager.instance;
        }
        
        this.monoBehaviors = new Map(); // Map of componentId -> MonoBehavior instance
        this.fps = 30; // Default 30 FPS for onUpdate
        this.updateInterval = null;
        this.isRunning = false;
        
        // Setup keyboard event listeners
        this.setupKeyboardListeners();
        
        LifecycleManager.instance = this;
        return this;
    }
    
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!LifecycleManager.instance) {
            new LifecycleManager();
        }
        return LifecycleManager.instance;
    }
    
    /**
     * Register a MonoBehavior component
     */
    async registerMonoBehavior(componentId, monoBehavior) {
        this.monoBehaviors.set(componentId, monoBehavior);
        
        // Start the lifecycle if this is the first component
        if (this.monoBehaviors.size === 1 && !this.isRunning) {
            this.start();
        }
        
        // Call onStart for the newly registered behavior
        if (monoBehavior.onStart && typeof monoBehavior.onStart === 'function') {
            try {
                monoBehavior.onStart();
            } catch (error) {
                console.error(`Error in onStart for ${componentId}:`, error);
            }
        }
    }
    
    /**
     * Unregister a MonoBehavior component
     */
    unregisterMonoBehavior(componentId) {
        const monoBehavior = this.monoBehaviors.get(componentId);
        if (monoBehavior) {
            // Call onDestroy before removing
            if (monoBehavior.onDestroy && typeof monoBehavior.onDestroy === 'function') {
                try {
                    monoBehavior.onDestroy();
                } catch (error) {
                    console.error(`Error in onDestroy for ${componentId}:`, error);
                }
            }
            
            this.monoBehaviors.delete(componentId);
            
            // Stop the lifecycle if no components remain
            if (this.monoBehaviors.size === 0) {
                this.stop();
            }
        }
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
            if (monoBehavior.onUpdate && typeof monoBehavior.onUpdate === 'function') {
                try {
                    monoBehavior.onUpdate();
                } catch (error) {
                    console.error(`Error in onUpdate for ${componentId}:`, error);
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
    
    /**
     * Trigger onDestroy for a specific slot and its children
     */
    triggerDestroyForSlot(slotId) {
        // Find all MonoBehaviors attached to this slot
        this.monoBehaviors.forEach((monoBehavior, componentId) => {
            if (monoBehavior.slot && monoBehavior.slot.id === slotId) {
                this.unregisterMonoBehavior(componentId);
            }
        });
    }
}

// Create and export singleton instance
export const lifecycleManager = LifecycleManager.getInstance();
window.lifecycleManager = lifecycleManager; // For debugging