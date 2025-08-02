/**
 * React Hook for Change Manager Integration
 * Provides undo/redo functionality and change tracking
 */

const { useState, useEffect, useCallback, useRef } = window.React;

export function useChangeManager() {
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [changeCount, setChangeCount] = useState(0);
    const changeListenerRef = useRef(null);
    
    // Update state when change manager updates
    useEffect(() => {
        const updateState = () => {
            if (window.changeManager) {
                setCanUndo(window.changeManager.canUndo());
                setCanRedo(window.changeManager.canRedo());
                setChangeCount(prev => prev + 1); // Force re-render
            }
        };
        
        // Listen for change manager updates
        window.addEventListener('change-manager-updated', updateState);
        window.addEventListener('historyChangeApplied', updateState);
        
        // Add change listener
        if (window.changeManager && !changeListenerRef.current) {
            changeListenerRef.current = window.changeManager.addChangeListener(() => {
                updateState();
            });
        }
        
        // Initial state
        updateState();
        
        return () => {
            window.removeEventListener('change-manager-updated', updateState);
            window.removeEventListener('historyChangeApplied', updateState);
        };
    }, []);
    
    // Add a new change
    const addChange = useCallback((change) => {
        if (!window.changeManager) {
            console.warn('Change manager not initialized');
            return;
        }
        
        window.changeManager.addChange(change);
    }, []);
    
    // Undo last change
    const undo = useCallback(() => {
        if (!window.changeManager || !canUndo) return;
        window.changeManager.undo();
    }, [canUndo]);
    
    // Redo last undone change
    const redo = useCallback(() => {
        if (!window.changeManager || !canRedo) return;
        window.changeManager.redo();
    }, [canRedo]);
    
    // Create property change
    const createPropertyChange = useCallback((componentId, propertyName, oldValue, newValue) => {
        if (!window.ComponentPropertyChange) {
            console.warn('ComponentPropertyChange class not available');
            return null;
        }
        
        return new window.ComponentPropertyChange(componentId, propertyName, oldValue, newValue);
    }, []);
    
    // Create slot change
    const createSlotChange = useCallback((slotId, propertyName, oldValue, newValue) => {
        if (!window.SlotPropertyChange) {
            console.warn('SlotPropertyChange class not available');
            return null;
        }
        
        return new window.SlotPropertyChange(slotId, propertyName, oldValue, newValue);
    }, []);
    
    // Create space property change
    const createSpacePropertyChange = useCallback((type, key, oldValue, newValue, propertyType) => {
        if (!window.SpacePropertyChange) {
            console.warn('SpacePropertyChange class not available');
            return null;
        }
        
        return new window.SpacePropertyChange(type, key, oldValue, newValue, propertyType);
    }, []);
    
    // Batch changes together
    const batchChanges = useCallback((changes) => {
        if (!window.changeManager) return;
        
        // Temporarily disable notifications
        const originalNotify = window.changeManager.notifyListeners;
        window.changeManager.notifyListeners = () => {};
        
        // Add all changes
        changes.forEach(change => window.changeManager.addChange(change));
        
        // Re-enable notifications and notify once
        window.changeManager.notifyListeners = originalNotify;
        window.changeManager.notifyListeners();
    }, []);
    
    // Get change history (for debugging)
    const getHistory = useCallback(() => {
        if (!window.changeManager) return { past: [], future: [] };
        
        return {
            past: window.changeManager.history || [],
            future: window.changeManager.future || []
        };
    }, []);
    
    // Clear history
    const clearHistory = useCallback(() => {
        if (!window.changeManager) return;
        
        window.changeManager.history = [];
        window.changeManager.future = [];
        window.changeManager.notifyListeners();
    }, []);
    
    return {
        // State
        canUndo,
        canRedo,
        changeCount,
        
        // Actions
        addChange,
        undo,
        redo,
        batchChanges,
        clearHistory,
        
        // Change creators
        createPropertyChange,
        createSlotChange,
        createSpacePropertyChange,
        
        // Debug
        getHistory,
        
        // Direct access to change manager
        changeManager: window.changeManager
    };
}

/**
 * Hook for tracking a specific property with undo/redo
 */
export function useTrackedProperty(componentId, propertyName, initialValue) {
    const [value, setValue] = useState(initialValue);
    const { addChange, createPropertyChange } = useChangeManager();
    const previousValueRef = useRef(initialValue);
    
    // Update value with change tracking
    const updateValue = useCallback((newValue, skipUndo = false) => {
        if (newValue === value) return;
        
        if (!skipUndo && window.changeManager) {
            const change = createPropertyChange(componentId, propertyName, previousValueRef.current, newValue);
            if (change) {
                addChange(change);
            }
        }
        
        previousValueRef.current = newValue;
        setValue(newValue);
    }, [value, componentId, propertyName, addChange, createPropertyChange]);
    
    // Listen for external changes
    useEffect(() => {
        const handleExternalChange = (event) => {
            if (event.detail?.componentId === componentId && 
                event.detail?.propertyName === propertyName) {
                setValue(event.detail.newValue);
                previousValueRef.current = event.detail.newValue;
            }
        };
        
        window.addEventListener('property-changed', handleExternalChange);
        return () => window.removeEventListener('property-changed', handleExternalChange);
    }, [componentId, propertyName]);
    
    return [value, updateValue];
}