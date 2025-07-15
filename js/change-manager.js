/**
 * Refactored Change Manager
 * Uses specialized change classes for cleaner separation of concerns
 */

let basePath = window.location.hostname === 'localhost' ? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
const { HistoryManager } = await import(`${basePath}/history-manager.js`);

class ChangeManager {
    constructor() {
        this.historyManager = null;
        this.changeListeners = [];
        this.isProcessing = false;
    }

    async initialize() {
        // Initialize history manager
        this.historyManager = new HistoryManager();
        console.log('Refactored Change Manager initialized');
    }

    /**
     * Add a change listener
     */
    addChangeListener(listener) {
        this.changeListeners.push(listener);
    }

    /**
     * Remove a change listener
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * Apply a change - now accepts change objects with apply() and undo() methods
     */
    async applyChange(change) {
        if (this.isProcessing) {
            console.warn('Change already in progress');
            return;
        }

        this.isProcessing = true;

        try {
            // Validate change object
            if (!change || typeof change.apply !== 'function') {
                console.error('Invalid change object - must have apply() method');
                return;
            }

            console.log(`Applying change: ${change.getDescription ? change.getDescription() : 'Unknown'}`);

            // Skip history recording if from history or not from UI
            const isFromHistory = change.options?.source === 'history' || this.historyManager?.isApplying;
            const shouldRecord = !isFromHistory && change.options?.source === 'ui' && this.historyManager;

            // Apply the change
            await change.apply();

            // Record in history if applicable
            if (shouldRecord) {
                this.historyManager.recordChange(change);
            }

            // Notify listeners
            this.notifyListeners(change);

        } catch (error) {
            console.error('Failed to apply change:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Notify all change listeners
     */
    notifyListeners(change) {
        this.changeListeners.forEach(listener => {
            try {
                listener(change);
            } catch (error) {
                console.error('Change listener error:', error);
            }
        });
    }

    /**
     * Get the history manager instance
     */
    getHistoryManager() {
        return this.historyManager;
    }

    /**
     * Component lifecycle management (for compatibility)
     */
    registerComponent(component) {
        // Components now manage their own lifecycle
        console.log('Component registered:', component.id);
    }

    unregisterComponent(componentId) {
        // Components now manage their own lifecycle
        console.log('Component unregistered:', componentId);
    }
}

// Export singleton instance
export const changeManager = new ChangeManager();
window.changeManager = changeManager; // For debugging