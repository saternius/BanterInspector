export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 100;
        this.currentBatch = null;
        this.batchTimeout = null;
        this.isApplyingHistory = false;
        this.batchTimeWindow = 500; // milliseconds to group changes
        
        // Sources that shouldn't be tracked
        this.automatedSources = new Set([
            'monobehavior-update',
            'animation',
            'physics-simulation',
            'script-automation',
            'programmatic'
        ]);
        
        this.setupKeyboardShortcuts();
    }
    
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
    
    // Check if a change should be tracked in history
    shouldTrackChange(change) {
        // Only track inspector UI changes
        return change.metadata?.source === 'inspector-ui' && 
               !this.isApplyingHistory;
    }
    
    // Prepare to record a change
    prepareChangeRecord(change, oldValue) {
        if (!this.shouldTrackChange(change)) {
            return;
        }
        
        // Start new batch if needed
        if (!this.currentBatch) {
            this.currentBatch = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                timestamp: Date.now(),
                changes: [],
                description: ''
            };
        }
        
        // Create reversible change record
        const changeRecord = {
            type: change.type,
            forward: {
                target: { 
                    type: change.type, 
                    id: change.targetId || change.slotId 
                },
                property: change.property,
                newValue: this.cloneValue(change.value)
            },
            reverse: {
                target: { 
                    type: change.type, 
                    id: change.targetId || change.slotId 
                },
                property: change.property,
                oldValue: this.cloneValue(oldValue)
            },
            metadata: change.metadata
        };
        
        this.currentBatch.changes.push(changeRecord);
        
        // Reset batch timer
        this.scheduleBatchCommit();
    }
    
    // Schedule batch commit after timeout
    scheduleBatchCommit() {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = setTimeout(() => {
            this.commitCurrentBatch();
        }, this.batchTimeWindow);
    }
    
    // Commit the current batch to history
    commitCurrentBatch() {
        if (!this.currentBatch || this.currentBatch.changes.length === 0) {
            return;
        }
        
        // Generate description
        this.currentBatch.description = this.generateBatchDescription(this.currentBatch.changes);
        
        // Add to undo stack
        this.undoStack.push(this.currentBatch);
        
        // Clear redo stack when new changes are made
        this.redoStack = [];
        
        // Limit history size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        
        // Reset current batch
        this.currentBatch = null;
        
        // Update UI
        this.updateUIState();
        this.showNotification(`Recorded: ${this.undoStack[this.undoStack.length - 1].description}`);
    }
    
    // Generate human-readable description for a batch
    generateBatchDescription(changes) {
        const panels = new Set();
        const components = new Set();
        
        changes.forEach(change => {
            if (change.metadata?.uiContext?.panelType) {
                panels.add(change.metadata.uiContext.panelType);
            }
            if (change.metadata?.componentType) {
                components.add(change.metadata.componentType);
            }
        });
        
        if (panels.has('properties')) {
            if (components.size === 1) {
                return `Modified ${components.values().next().value} properties`;
            }
            return `Modified ${changes.length} properties`;
        } else if (panels.has('space-props')) {
            return `Updated space properties`;
        } else if (panels.has('hierarchy')) {
            return `Changed hierarchy`;
        }
        
        return `Made ${changes.length} changes`;
    }
    
    // Undo the last batch
    async undo() {
        if (this.undoStack.length === 0) {
            this.showNotification('Nothing to undo');
            return;
        }
        
        // Commit any pending changes first
        this.commitCurrentBatch();
        
        const batch = this.undoStack.pop();
        this.isApplyingHistory = true;
        
        try {
            // Apply all reverse changes in reverse order
            for (let i = batch.changes.length - 1; i >= 0; i--) {
                await this.applyChange(batch.changes[i].reverse);
            }
            
            // Move to redo stack
            this.redoStack.push(batch);
            
            // Update UI
            this.updateUIState();
            this.showNotification(`Undone: ${batch.description}`);
            
        } catch (error) {
            console.error('Error during undo:', error);
            this.showNotification('Undo failed: ' + error.message, 'error');
            
            // Put the batch back
            this.undoStack.push(batch);
        } finally {
            this.isApplyingHistory = false;
        }
    }
    
    // Redo the last undone batch
    async redo() {
        if (this.redoStack.length === 0) {
            this.showNotification('Nothing to redo');
            return;
        }
        
        const batch = this.redoStack.pop();
        this.isApplyingHistory = true;
        
        try {
            // Apply all forward changes
            for (const change of batch.changes) {
                await this.applyChange(change.forward);
            }
            
            // Move to undo stack
            this.undoStack.push(batch);
            
            // Update UI
            this.updateUIState();
            this.showNotification(`Redone: ${batch.description}`);
            
        } catch (error) {
            console.error('Error during redo:', error);
            this.showNotification('Redo failed: ' + error.message, 'error');
            
            // Put the batch back
            this.redoStack.push(batch);
        } finally {
            this.isApplyingHistory = false;
        }
    }
    
    // Apply a single change
    async applyChange(change) {
        // This will be implemented to work with the change manager
        // For now, we'll dispatch a custom event
        const event = new CustomEvent('historyApplyChange', {
            detail: change
        });
        document.dispatchEvent(event);
    }
    
    // Deep clone a value
    cloneValue(value) {
        if (value === null || value === undefined) {
            return value;
        }
        
        if (typeof value !== 'object') {
            return value;
        }
        
        if (Array.isArray(value)) {
            return value.map(item => this.cloneValue(item));
        }
        
        if (value instanceof Date) {
            return new Date(value.getTime());
        }
        
        // Handle objects
        const cloned = {};
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                cloned[key] = this.cloneValue(value[key]);
            }
        }
        return cloned;
    }
    
    // Update UI state (buttons enabled/disabled)
    updateUIState() {
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
    
    // Show notification to user
    showNotification(message, type = 'info') {
        // Dispatch event for UI to handle
        const event = new CustomEvent('historyNotification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
        
        // Also log to console
        console.log(`[History ${type}] ${message}`);
    }
    
    // Get history status
    getStatus() {
        return {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0,
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            isApplying: this.isApplyingHistory
        };
    }
    
    // Clear all history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentBatch = null;
        clearTimeout(this.batchTimeout);
        this.updateUIState();
    }
}