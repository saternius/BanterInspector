// Debug helper for testing undo/redo functionality
window.debugHistory = {

    // Show current history status
    status() {
        const hm = window.changeManager;
        if (!hm) {
            console.log('History manager not available');
            return;
        }
        
        const status = hm.getStatus();
        console.log('History Status:', {
            canUndo: status.canUndo,
            canRedo: status.canRedo,
            undoStackSize: status.undoCount,
            redoStackSize: status.redoCount,
            isApplying: status.isApplying
        });
        
        if (hm.undoStack.length > 0) {
            console.log('Last undo item:', hm.undoStack[hm.undoStack.length - 1].description);
        }
        
        return status;
    },
    
    // Perform undo
    undo() {
        const hm = window.changeManager;
        if (!hm) {
            console.log('History manager not available');
            return;
        }
        
        console.log('Performing undo...');
        hm.undo();
    },
    
    // Perform redo
    redo() {
        const hm = window.changeManager;
        if (!hm) {
            console.log('History manager not available');
            return;
        }
        
        console.log('Performing redo...');
        hm.redo();
    },
    
    // Simulate a UI change for testing
    simulateChange() {
        console.log('Simulating UI property change...');
        window.changeManager.queueChange({
            type: 'component',
            targetId: 'test-component-1',
            property: 'testProp',
            value: Math.random(),
            metadata: {
                slotId: 'test-slot-1',
                componentType: 'TestComponent',
                componentIndex: 0,
                source: 'inspector-ui', // This is key - marks it as UI change
                uiContext: {
                    panelType: 'properties',
                    inputElement: 'test-input',
                    eventType: 'change'
                }
            }
        });
    },
    
    // Check if buttons are wired up
    checkButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        console.log('Undo button:', undoBtn ? 'Found' : 'Not found');
        console.log('Redo button:', redoBtn ? 'Found' : 'Not found');
        
        if (undoBtn) {
            // Get all event listeners (this only works in Chrome DevTools)
            console.log('Undo button disabled:', undoBtn.disabled);
            console.log('Undo button onclick:', undoBtn.onclick);
            
            // Try clicking it
            console.log('Clicking undo button...');
            undoBtn.click();
        }
        
        return { undoBtn, redoBtn };
    },
    
    // Force update button states
    updateButtons() {
        const hm = window.changeManager;
        if (hm) {
            hm.updateUIState();
            console.log('Button states updated');
        }
    }
};

console.log('Debug history loaded. Use window.debugHistory for testing:');
console.log('- debugHistory.status() - Show current history status');
console.log('- debugHistory.undo() - Perform undo');
console.log('- debugHistory.redo() - Perform redo');
console.log('- debugHistory.simulateChange() - Create a test change');
console.log('- debugHistory.checkButtons() - Check if buttons are wired up');
console.log('- debugHistory.updateButtons() - Force update button states');