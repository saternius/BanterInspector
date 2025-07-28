/**
 * Refactored Change Manager
 * Uses specialized change classes for cleaner separation of concerns
 */


class ChangeManager {
    constructor() {
        this.changeListeners = [];
        this.isProcessing = false;
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 100;
        this.isApplying = false;
        this.setupKeyboardShortcuts();
        this.updateUI();
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


            // Skip history recording if from history or not from UI
            const isFromHistory = change.options?.source === 'history' || this.isApplying;
            const shouldRecord = !isFromHistory && change.options?.source === 'ui';

            // Apply the change
            await change.apply();

            // Record in history if applicable
            if (shouldRecord) {
                this.recordChange(change);
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
     * Record a change in history
     * @param {Object} change - The change object with apply() and undo() methods
     */
    recordChange(change) {
        // Don't record if we're applying history
        if (this.isApplying) {
            console.log('Skipping record - isApplying is true');
            return;
        }
        
        // Don't record if not from UI
        if (change.options?.source !== 'ui') {
            console.log('Skipping record - source is not ui:', change.options?.source);
            return;
        }
        
        // Validate change object
        if (!change || typeof change.apply !== 'function' || typeof change.undo !== 'function') {
            console.error('Invalid change object for history - must have apply() and undo() methods');
            return;
        }
        
        const entry = {
            id: Date.now(),
            timestamp: Date.now(),
            description: change.getDescription ? change.getDescription() : 'Unknown change',
            change: change // Store the actual change object
        };
        
        this.undoStack.push(entry);
        this.redoStack = []; // Clear redo on new change
        
        // Limit stack size
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        
        this.updateUI();
        //console.log(`History recorded: ${entry.description}`);
    }
    
    /**
     * Undo the last change
     */
    async undo() {
        if (this.undoStack.length === 0) {
            this.showNotification('Nothing to undo');
            return;
        }
        
        const entry = this.undoStack.pop();
        this.isApplying = true;
        
        try {
            // Call the change object's undo method
            await entry.change.undo();
            
            this.redoStack.push(entry);
            this.updateUI();
            this.showNotification(`Undone: ${entry.description}`);
        } catch (error) {
            console.error('Undo failed:', error);
            this.showNotification('Undo failed: ' + error.message, 'error');
            // Put it back
            this.undoStack.push(entry);
        } finally {
            this.isApplying = false;
        }
        changeManager.notifyListeners(entry);
    }
    
    /**
     * Redo the last undone change
     */
    async redo() {
        if (this.redoStack.length === 0) {
            this.showNotification('Nothing to redo');
            return;
        }
        
        const entry = this.redoStack.pop();
        this.isApplying = true;
        
        try {
            // Call the change object's apply method
            await entry.change.apply();
            
            this.undoStack.push(entry);
            this.updateUI();
            this.showNotification(`Redone: ${entry.description}`);
        } catch (error) {
            console.error('Redo failed:', error);
            this.showNotification('Redo failed: ' + error.message, 'error');
            // Put it back
            this.redoStack.push(entry);
        } finally {
            this.isApplying = false;
        }
        changeManager.notifyListeners(entry);
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
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                if(navigation.currentPage !== "world-inspector") return;
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }

    /**
     * Update UI state (buttons)
     */
    updateUI() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.title = this.undoStack.length > 0 
                ? `Undo: ${this.undoStack[this.undoStack.length - 1].description} (Ctrl+Z)`
                : 'Nothing to undo (Ctrl+Z)';
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.title = this.redoStack.length > 0
                ? `Redo: ${this.redoStack[this.redoStack.length - 1].description} (Ctrl+Shift+Z)`
                : 'Nothing to redo (Ctrl+Shift+Z)';
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Dispatch event for UI to handle
        document.dispatchEvent(new CustomEvent('historyNotification', {
            detail: { message, type }
        }));
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0,
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            isApplying: this.isApplying
        };
    }
    
    /**
     * Clear all history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
        this.showNotification('History cleared');
    }
    
}

// Export singleton instance
export const changeManager = new ChangeManager();
window.changeManager = changeManager; // For debugging