
/**
 * History Manager for Undo/Redo functionality
 * Works with the new change class system
 */
let basePath = window.location.hostname === 'localhost' ? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
const { deepClone } = await import(`${basePath}/utils.js`);

export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 100;
        this.isApplying = false;
        
        this.setupKeyboardShortcuts();
        this.updateUI();
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
        console.log(`History recorded: ${entry.description}`);
    }
    
    /**
     * Undo the last change
     */
    async undo() {
        if (this.undoStack.length === 0) {
            this.showNotification('Nothing to undo');
            return;
        }
        
        console.log('Before undo - undoStack:', this.undoStack.length, 'redoStack:', this.redoStack.length);
        const entry = this.undoStack.pop();
        console.log('Undoing entry:', entry.id, entry.description);
        this.isApplying = true;
        
        try {
            // Call the change object's undo method
            await entry.change.undo();
            
            this.redoStack.push(entry);
            console.log('After undo - undoStack:', this.undoStack.length, 'redoStack:', this.redoStack.length);
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
        
        console.log('Before redo - undoStack:', this.undoStack.length, 'redoStack:', this.redoStack.length);
        const entry = this.redoStack.pop();
        console.log('Redoing entry:', entry.id, entry.description);
        this.isApplying = true;
        
        try {
            // Call the change object's apply method
            await entry.change.apply();
            
            this.undoStack.push(entry);
            console.log('After redo - undoStack:', this.undoStack.length, 'redoStack:', this.redoStack.length);
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
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
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
        
        console.log(`[History ${type}] ${message}`);
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