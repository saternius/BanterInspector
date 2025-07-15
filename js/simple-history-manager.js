/**
 * Simplified History Manager for Undo/Redo functionality
 * 
 * Design principles:
 * - No batching - each user action creates one history entry
 * - Clear data flow - unidirectional from UI → Change Manager → History Manager
 * - Simple and maintainable - easy to understand and extend
 */

export const ChangeTypes = {
    PROPERTY: 'property',              // Component or slot property change
    COMPONENT_ADD: 'component_add',
    COMPONENT_REMOVE: 'component_remove',
    SLOT_ADD: 'slot_add',
    SLOT_REMOVE: 'slot_remove',
    SLOT_RENAME: 'slot_rename',
    SLOT_MOVE: 'slot_move',
    SPACE_PROPERTY: 'space_property'
};

export class SimpleHistoryManager {
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
            forward: { ...change },
            reverse: this.createReverseChange(change, oldValue)
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
            newValue: oldValue,
            oldValue: change.newValue,
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
            case ChangeTypes.PROPERTY:
                if (change.targetType === 'component') {
                    return `Changed ${change.metadata.componentType} ${change.property}`;
                } else if (change.targetType === 'slot') {
                    return `Changed slot ${change.property}`;
                }
                break;
            case ChangeTypes.COMPONENT_ADD:
                return `Added ${change.metadata.componentType} component`;
            case ChangeTypes.COMPONENT_REMOVE:
                return `Removed ${change.metadata.componentType} component`;
            case ChangeTypes.SLOT_ADD:
                return `Added new slot`;
            case ChangeTypes.SLOT_REMOVE:
                return `Removed slot ${change.metadata.slotName || ''}`;
            case ChangeTypes.SLOT_RENAME:
                return `Renamed slot to ${change.newValue}`;
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
            await this.applyChange(entry.reverse);
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
            await this.applyChange(entry.forward);
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
    
    /**
     * Apply a change (for undo/redo)
     */
    async applyChange(change) {
        // Get change manager instance
        const changeManager = window.changeManager;
        if (!changeManager) {
            throw new Error('Change manager not available');
        }
        
        // Create a change object that matches the expected format
        const changeToApply = {
            type: change.targetType,
            targetId: change.targetId,
            property: change.property,
            value: change.newValue,
            source: 'history-apply', // Mark as history change
            metadata: { ...change.metadata }
        };
        
        // Handle different change types
        switch (change.type) {
            case ChangeTypes.PROPERTY:
                if (change.targetType === 'component') {
                    changeToApply.type = 'component';
                } else if (change.targetType === 'slot') {
                    changeToApply.type = 'slot';
                }
                changeManager.queueChange(changeToApply);
                break;
                
            case ChangeTypes.SPACE_PROPERTY:
                changeManager.queueSpacePropertyChange({
                    key: change.metadata.key,
                    value: change.newValue,
                    isProtected: change.metadata.isProtected,
                    source: 'history-apply'
                });
                break;
                
            case ChangeTypes.COMPONENT_ADD:
                // Re-add component with saved data
                if (change.componentData) {
                    await this.readdComponent(change);
                }
                break;
                
            case ChangeTypes.COMPONENT_REMOVE:
                changeToApply.type = 'componentRemove';
                changeManager.queueChange(changeToApply);
                break;
                
            case ChangeTypes.SLOT_ADD:
                // Re-add slot with saved data
                if (change.slotData) {
                    await this.readdSlot(change);
                }
                break;
                
            case ChangeTypes.SLOT_REMOVE:
                changeToApply.type = 'slotRemove';
                changeManager.queueChange(changeToApply);
                break;
                
            case ChangeTypes.SLOT_MOVE:
                changeToApply.type = 'slotMove';
                changeToApply.value = change.newParentId;
                changeToApply.metadata.newParentId = change.newParentId;
                changeToApply.metadata.oldParentId = change.oldParentId;
                changeManager.queueChange(changeToApply);
                break;
                
            case ChangeTypes.SLOT_RENAME:
                changeToApply.type = 'slot';
                changeToApply.property = 'name';
                changeManager.queueChange(changeToApply);
                break;
        }
        
        // Wait for changes to flush
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Trigger UI refresh
        document.dispatchEvent(new CustomEvent('historyChangeApplied', {
            detail: { change: changeToApply }
        }));
    }
    
    /**
     * Re-add a component that was removed
     */
    async readdComponent(change) {
        // TODO: Implement component re-addition
        console.log('Re-adding component not yet implemented:', change.componentData);
        this.showNotification('Component re-addition not yet implemented', 'warning');
    }
    
    /**
     * Re-add a slot that was removed
     */
    async readdSlot(change) {
        // TODO: Implement slot re-addition
        console.log('Re-adding slot not yet implemented:', change.slotData);
        this.showNotification('Slot re-addition not yet implemented', 'warning');
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