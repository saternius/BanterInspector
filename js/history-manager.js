/**
 * History Manager for Undo/Redo functionality
 * 
 * Design principles:
 * - Clear data flow - unidirectional from UI → Change Manager → History Manager
 * - Simple and maintainable - easy to understand and extend
 */
let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
const { ChangeTypes } = await import(`${basePath}/types.js`);
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
     * @param {Object} change - The change object
     * @param {*} oldValue - The value before the change
     */
    recordChange(change, oldValue) {
        // Don't record if we're applying history
        if (this.isApplying) return;
        
        // Don't record if not from UI
        if (change.source !== 'inspector-ui') return;
        
        const entry = {
            id: Date.now(),
            timestamp: Date.now(),
            description: this.describeChange(change),
            forward: deepClone(change),
            reverse: deepClone(this.createReverseChange(change, oldValue))
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
     * Create a reverse change for undo
     */
    createReverseChange(change, oldValue) {
        const reverse = {
            type: change.type,
            targetId: change.targetId,
            targetType: change.targetType,
            property: change.property,
            value: oldValue,
            oldValue: change.value,
            metadata: { ...change.metadata }
        };
        
        // Handle special cases
        switch (change.type) {
            case ChangeTypes.COMPONENT_ADD:
                reverse.type = ChangeTypes.COMPONENT_REMOVE;
                break;
            case ChangeTypes.COMPONENT_REMOVE:
                reverse.type = ChangeTypes.COMPONENT_ADD;
                reverse.componentData = oldValue; // Full component state
                break;
            case ChangeTypes.SLOT_ADD:
                reverse.type = ChangeTypes.SLOT_REMOVE;
                break;
            case ChangeTypes.SLOT_REMOVE:
                reverse.type = ChangeTypes.SLOT_ADD;
                reverse.slotData = oldValue; // Full slot state
                break;
            case ChangeTypes.SLOT_MOVE:
                reverse.newParentId = oldValue; // Old parent
                reverse.oldParentId = change.newParentId;
                break;
        }
        
        return reverse;
    }
    
    /**
     * Generate human-readable description
     */
    describeChange(change) {
        switch (change.type) {
            case ChangeTypes.COMPONENT:
                return `Changed ${change.metadata.componentType} ${change.property}`;
            case ChangeTypes.SLOT:
                return `Changed slot ${change.property}`;
            case ChangeTypes.COMPONENT_ADD:
                return `Added ${change.metadata.componentType} component`;
            case ChangeTypes.COMPONENT_REMOVE:
                return `Removed ${change.metadata.componentType} component`;
            case ChangeTypes.SLOT_ADD:
                return `Added new slot`;
            case ChangeTypes.SLOT_REMOVE:
                return `Removed slot ${change.metadata.slotName || ''}`;
            case ChangeTypes.SLOT_MOVE:
                return `Moved slot`;
            case ChangeTypes.SPACE_PROPERTY:
                const propType = change.metadata.isProtected ? 'protected' : 'public';
                return `Changed ${propType} property ${change.metadata.key}`;
        }
        return 'Made changes';
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
            await changeManager.applyChange(entry.reverse);
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
            await changeManager.applyChange(entry.forward);
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
    }
    
    /*
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