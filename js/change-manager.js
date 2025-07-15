/**
 * Centralized Change Manager
 * Handles all property changes for slots and components
 */

let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
import { sceneManager } from './scene-manager.js';

class ChangeManager {
    constructor() {
        this.pendingChanges = new Map();
        this.updateTimer = null;
        this.changeListeners = new Set();
        this.componentHandlers = new Map();
        this.registeredComponents = new Map();
        this.updateInterval = 100; // ms
        this.historyManager = null;
        this.beforeFlush = null; // Hook for history manager
    }

    async initialize() {
        // Register default component handlers
        this.registerDefaultHandlers();
        
        // Initialize history manager (lazy load to avoid circular dependency)
        const { HistoryManager } = await import(`${basePath}/history-manager.js`);
        this.historyManager = new HistoryManager();
        this.setupHistoryIntegration();
        
        console.log('Change Manager initialized with history support');
    }
    
    setupHistoryIntegration() {
        // Set up the beforeFlush hook for history manager
        this.beforeFlush = (changes) => {
            console.log("changes", changes)
            if (!this.historyManager.isApplyingHistory) {
                // Filter for inspector UI changes only
                const uiChanges = changes.filter(c => 
                    c.metadata?.source === 'inspector-ui'
                );
                
                if (uiChanges.length > 0) {
                    // Record each change with its old value
                    uiChanges.forEach(change => {
                        
                        const oldValue = this.getOldValue(change);
                        console.log("change", change, oldValue)
                        this.historyManager.prepareChangeRecord(change, oldValue);
                    });
                }
            }
        };
        
        // Listen for history apply events
        document.addEventListener('historyApplyChange', async (event) => {
            const change = event.detail;
            await this.applyHistoryChange(change);
        });
    }
    
    getOldValue(change) {
        if (change.type === 'spaceProperty') {
            const spaceState = window.SM?.scene?.spaceState || sceneManager?.scene?.spaceState;
            if (spaceState) {
                const props = change.metadata.isProtected ? spaceState.protected : spaceState.public;
                return props[change.metadata.key];
            }
        } else if (change.type === 'slot') {
            const slot = window.SM?.getSlotById(change.targetId) || sceneManager?.getSlotById(change.targetId);
            return slot ? slot[change.property] : undefined;
        } else if (change.type === 'component') {
            const slot = window.SM?.getSlotById(change.metadata.slotId) || sceneManager?.getSlotById(change.metadata.slotId);
            if (slot) {
                const component = slot.components.find(c => c.id === change.targetId);
                return component?.properties?.[change.property];
            }
        } else if (change.type === 'componentAdd') {
            // For component add, the old value is null (component didn't exist)
            return null;
        } else if (change.type === 'componentRemove') {
            // For component remove, we need to capture the entire component state
            const slot = window.SM?.getSlotById(change.metadata.slotId) || sceneManager?.getSlotById(change.metadata.slotId);
            if (slot) {
                const component = slot.components.find(c => c.id === change.targetId);
                if (component) {
                    return {
                        id: component.id,
                        type: component.type,
                        properties: JSON.parse(JSON.stringify(component.properties)),
                        index: slot.components.indexOf(component)
                    };
                }
            }
        } else if (change.type === 'slotAdd') {
            // For slot add, the old value is null (slot didn't exist)
            return null;
        } else if (change.type === 'slotRemove') {
            // For slot remove, capture the entire slot state including children
            const slot = window.SM?.getSlotById(change.targetId) || sceneManager?.getSlotById(change.targetId);
            if (slot) {
                return this.captureSlotState(slot);
            }
        } else if (change.type === 'slotMove') {
            // For slot move, the old value is the previous parent ID
            return change.metadata.oldParentId;
        }
        return undefined;
    }
    
    // Helper to capture complete slot state for undo
    captureSlotState(slot) {
        const state = {
            id: slot.id,
            name: slot.name,
            active: slot.active,
            persistent: slot.persistent,
            parentId: slot.parentId,
            components: slot.components?.map(c => ({
                id: c.id,
                type: c.type,
                properties: JSON.parse(JSON.stringify(c.properties))
            })) || [],
            children: slot.children?.map(child => this.captureSlotState(child)) || []
        };
        return state;
    }
    
    async applyHistoryChange(change) {
        const { target, property, oldValue, newValue } = change;
        
        console.log('Applying history change:', { target, property, oldValue, newValue });
        
        // Create a change object that matches our normal format
        const changeObj = {
            type: target.type,
            targetId: target.id,
            property: property,
            value: oldValue !== undefined ? oldValue : newValue,
            metadata: {
                source: 'history-apply' // Mark as history change
            }
        };
        
        // Apply the change based on type
        if (target.type === 'spaceProperty') {
            // For space properties, the targetId is the key
            changeObj.metadata.key = target.id;
            changeObj.metadata.isProtected = change.metadata?.isProtected || false;
            changeObj.targetId = target.id;
            changeObj.property = 'value';
            await this.processSpacePropertyChange(changeObj);
        } else if (target.type === 'slot') {
            changeObj.metadata.slotId = target.id;
            await this.processSlotChange(changeObj);
        } else if (target.type === 'component') {
            // Need to find the slot for component changes
            const slot = this.findSlotByComponentId(target.id) || 
                        (change.metadata?.slotId && sceneManager.getSlotById(change.metadata.slotId));
            if (slot) {
                changeObj.metadata.slotId = slot.id;
                changeObj.metadata.componentType = change.metadata?.componentType || 'Unknown';
                changeObj.metadata.componentIndex = change.metadata?.componentIndex || 0;
                await this.processComponentChange(changeObj);
            } else {
                console.error('Could not find slot for component:', target.id);
            }
        } else if (target.type === 'componentAdd') {
            // Handle undo of component add (remove the component)
            if (oldValue === null) {
                // This was originally an add, so we need to remove it
                changeObj.type = 'componentRemove';
                changeObj.metadata = change.metadata;
                await this.processComponentRemove(changeObj);
            } else {
                // This was originally a remove, so we need to add it back
                // TODO: Implement re-adding component with saved state
                console.log('Re-adding component not yet implemented:', oldValue);
            }
        } else if (target.type === 'componentRemove') {
            // Handle undo of component remove (re-add the component)
            if (oldValue) {
                // TODO: Implement re-adding component with saved state
                console.log('Re-adding component not yet implemented:', oldValue);
            }
        } else if (target.type === 'slotAdd') {
            // Handle undo of slot add (remove the slot)
            if (oldValue === null) {
                // This was originally an add, so we need to remove it
                changeObj.type = 'slotRemove';
                changeObj.metadata = change.metadata;
                await this.processSlotRemove(changeObj);
            } else {
                // This was originally a remove, so we need to add it back
                // TODO: Implement re-adding slot with saved state
                console.log('Re-adding slot not yet implemented:', oldValue);
            }
        } else if (target.type === 'slotRemove') {
            // Handle undo of slot remove (re-add the slot)
            if (oldValue) {
                // TODO: Implement re-adding slot with saved state
                console.log('Re-adding slot not yet implemented:', oldValue);
            }
        } else if (target.type === 'slotMove') {
            // Handle undo of slot move (move back to old parent)
            changeObj.type = 'slotMove';
            changeObj.value = oldValue; // oldValue is the previous parent ID
            changeObj.metadata = change.metadata;
            changeObj.metadata.newParentId = oldValue;
            changeObj.metadata.oldParentId = change.metadata.newParentId;
            await this.processSlotMove(changeObj);
        }
        
        // Trigger UI refresh
        document.dispatchEvent(new CustomEvent('historyChangeApplied', {
            detail: { change: changeObj }
        }));
    }
    
    findSlotByComponentId(componentId) {
        // Try using sceneManager's method first
        if (sceneManager && sceneManager.getAllSlots) {
            const slots = sceneManager.getAllSlots();
            for (const slot of slots) {
                if (slot.components?.some(c => c.id === componentId)) {
                    return slot;
                }
            }
        }
        
        // Fallback to window.SM if available
        const slots = window.SM?.getAllSlots?.() || [];
        for (const slot of slots) {
            if (slot.components?.some(c => c.id === componentId)) {
                return slot;
            }
        }
        return null;
    }
    
    getHistoryManager() {
        return this.historyManager;
    }

    registerDefaultHandlers() {
        // Transform handler
        this.registerComponentHandler('Transform', {
            validate: (property, value) => {
                if (property === 'position' || property === 'localScale') {
                    return typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value;
                }
                if (property === 'rotation') {
                    return typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value && 'w' in value;
                }
                return false;
            },
            transform: (property, value) => {
                if (property === 'position' || property === 'localScale') {
                    return new BS.Vector3(
                        parseFloat(value.x),
                        parseFloat(value.y),
                        parseFloat(value.z)
                    );
                }
                if (property === 'rotation') {
                    return new BS.Vector4(
                        parseFloat(value.x),
                        parseFloat(value.y),
                        parseFloat(value.z),
                        parseFloat(value.w)
                    );
                }
                return value;
            },
            apply: async (component, property, value) => {
                component[property] = value;
            }
        });
        
        // BanterMaterial handler
        this.registerComponentHandler('BanterMaterial', {
            validate: (property, value) => {
                if (property === 'color') {
                    return typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
                }
                return true;
            },
            transform: (property, value) => {
                if (property === 'color') {
                    return new BS.Vector4(
                        parseFloat(value.r),
                        parseFloat(value.g),
                        parseFloat(value.b),
                        parseFloat(value.a || 1)
                    );
                }
                return value;
            },
            apply: async (component, property, value) => {
                component[property] = value;
            }
        });
        
        // Add other component handlers as needed
    }

    queueChange(change) {
        const key = this.generateChangeKey(change);
        this.pendingChanges.set(key, {
            ...change,
            timestamp: Date.now()
        });
        this.scheduleFlush();
    }

    queueSpacePropertyChange(spaceChange) {
        // Special handling for space properties
        const change = {
            type: 'spaceProperty',
            targetId: spaceChange.key,
            property: 'value',
            value: spaceChange.value,
            metadata: {
                isProtected: spaceChange.isProtected,
                key: spaceChange.key,
                source: spaceChange.source,
                uiContext: spaceChange.uiContext
            }
        };
        this.queueChange(change);
    }

    generateChangeKey(change) {
        if (change.type === 'spaceProperty') {
            return `space_${change.metadata.key}`;
        }
        return `${change.type}_${change.targetId}_${change.property}`;
    }

    generateSpaceKey(change) {
        const slot = window.SM?.getSlotById(change.metadata.slotId);
        if (!slot) return null;
        
        const prefix = '__' + slot.name;
        
        if (change.type === 'component') {
            return `${prefix}/${change.metadata.componentType}/${change.property}:component_${change.targetId}`;
        } else if (change.type === 'slot') {
            return `${prefix}/${change.property}:slot_${change.targetId}`;
        }
        return null;
    }

    scheduleFlush() {
        if (this.updateTimer) clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.flushChanges(), this.updateInterval);
    }

    async flushChanges() {
        if (this.pendingChanges.size === 0) return;
        
        const changes = Array.from(this.pendingChanges.values());
        this.pendingChanges.clear();
        
        console.log(`Flushing ${changes.length} changes`);
        
        // Call beforeFlush hook if set (for history manager)
        if (this.beforeFlush && typeof this.beforeFlush === 'function') {
            this.beforeFlush(changes);
        }
        
        // Process changes
        await this.processChanges(changes);
        
        // Notify listeners
        this.notifyListeners(changes);
        window.inspectorApp.spacePropsPanel.render()
        
        // Commit any pending history batch
        if (this.historyManager && !this.historyManager.isApplyingHistory) {
            this.historyManager.commitCurrentBatch();
        }
    }

    async processChanges(changes) {
        // Group changes by type
        const grouped = this.groupChangesByType(changes);
        
        // Process space property changes first
        for (const change of grouped.spacePropertys || []) {
            await this.processSpacePropertyChange(change);
        }
        
        // Process slot changes
        for (const change of grouped.slots || []) {
            await this.processSlotChange(change);
        }
        
        // Process component changes
        for (const change of grouped.components || []) {
            await this.processComponentChange(change);
        }
        
        // Process component additions
        for (const change of grouped.componentAdds || []) {
            await this.processComponentAdd(change);
        }
        
        // Process component removals
        for (const change of grouped.componentRemoves || []) {
            await this.processComponentRemove(change);
        }
        
        // Process slot additions
        for (const change of grouped.slotAdds || []) {
            await this.processSlotAdd(change);
        }
        
        // Process slot removals
        for (const change of grouped.slotRemoves || []) {
            await this.processSlotRemove(change);
        }
        
        // Process slot moves
        for (const change of grouped.slotMoves || []) {
            await this.processSlotMove(change);
        }
    }

    async processSpacePropertyChange(change) {
        await window.SM?.setSpaceProperty(
            change.metadata.key,
            change.value,
            change.metadata.isProtected
        );
    }

    async processSlotChange(change) {
        // Update local state
        const slot = window.SM?.getSlotById(change.targetId);
        if (slot) {
            slot[change.property] = change.value;
        }
        
        // Generate space key
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey) {
            await window.SM?.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Update Unity if needed
        if (change.property === 'active') {
            await window.SM?.updateUnityObject(change.targetId, change.property, change.value);
        }
    }

    async processComponentChange(change) {
        // Update local state
        const slot = window.SM?.getSlotById(change.metadata.slotId);
        if (slot) {
            const component = slot.components.find(c => c.id === change.targetId);
            if (component && component.properties) {
                component.properties[change.property] = change.value;
            }
        }
        
        // Generate space key
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey) {
            await window.SM?.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Apply component-specific handler if available
        const handler = this.componentHandlers.get(change.metadata.componentType);
        if (handler && handler.apply) {
            const component = this.getComponentById(change.targetId);
            if (component && component._bs) {
                // Transform value if needed
                let transformedValue = change.value;
                if (handler.transform) {
                    transformedValue = handler.transform(change.property, change.value);
                }
                await handler.apply(component._bs, change.property, transformedValue);
            }
        } else {
            // Default Unity update
            await window.SM?.updateUnityComponent(change.targetId, change.property, change.value);
        }
    }

    groupChangesByType(changes) {
        return changes.reduce((groups, change) => {
            const type = change.type + 's'; // pluralize
            if (!groups[type]) groups[type] = [];
            groups[type].push(change);
            return groups;
        }, {});
    }
    
    async processComponentAdd(change) {
        // Component addition is already handled in component-menu.js
        // This is just for history tracking
        console.log('Component added:', change.value.componentType, 'to slot:', change.metadata.slotId);
    }
    
    async processComponentRemove(change) {
        console.log('Component removal requested:', change);
        
        try {
            // Use scene manager's deleteComponent method which handles all the cleanup
            await sceneManager.deleteComponent(
                change.metadata.slotId,
                change.targetId,
                change.metadata.componentType
            );
            
            // Unregister from change manager if it was registered
            this.unregisterComponent(change.targetId);
            
            console.log('Component removed successfully');
        } catch (error) {
            console.error('Failed to remove component:', error);
        }
    }
    
    async processSlotAdd(change) {
        console.log('Slot addition requested:', change);
        
        try {
            const newSlot = await sceneManager.addNewSlot(change.value.parentId);
            if (newSlot) {
                // Update the change targetId for history
                change.targetId = newSlot.id;
                
                // If there's a parent, expand it
                if (change.value.parentId) {
                    sceneManager.expandedNodes.add(change.value.parentId);
                }
                
                // Select the new slot
                sceneManager.selectSlot(newSlot.id);
                
                // Trigger UI updates
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: newSlot.id }
                }));
                
                console.log('Slot added successfully:', newSlot.id);
            }
        } catch (error) {
            console.error('Failed to add slot:', error);
        }
    }
    
    async processSlotRemove(change) {
        console.log('Slot removal requested:', change);
        
        try {
            await sceneManager.deleteSlot(change.targetId);
            
            // Clear selection if the deleted slot was selected
            if (sceneManager.selectedSlot === change.targetId) {
                sceneManager.selectedSlot = null;
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: null }
                }));
            }
            
            console.log('Slot removed successfully');
        } catch (error) {
            console.error('Failed to remove slot:', error);
        }
    }
    
    async processSlotMove(change) {
        console.log('Slot move requested:', change);
        
        try {
            if (change.value === null) {
                // Move to root
                await sceneManager.moveSlotToRoot(change.targetId);
            } else {
                // Move to new parent
                await sceneManager.reparentSlot(change.targetId, change.value);
                
                // Expand the new parent
                sceneManager.expandedNodes.add(change.value);
            }
            
            console.log('Slot moved successfully');
        } catch (error) {
            console.error('Failed to move slot:', error);
        }
    }

    registerComponent(component) {
        this.registeredComponents.set(component.id, component);
    }

    unregisterComponent(componentId) {
        this.registeredComponents.delete(componentId);
    }

    getComponentById(componentId) {
        return this.registeredComponents.get(componentId) || 
               window.SM?.sceneData.componentMap[componentId];
    }

    clearPendingChangesForSlot(slotId) {
        // Remove any pending changes for this slot
        for (const [key, change] of this.pendingChanges) {
            if (change.metadata && change.metadata.slotId === slotId) {
                this.pendingChanges.delete(key);
            }
        }
    }

    onChangeFlushed(callback) {
        this.changeListeners.add(callback);
    }

    offChangeFlushed(callback) {
        this.changeListeners.delete(callback);
    }

    notifyListeners(changes) {
        this.changeListeners.forEach(callback => {
            try {
                callback(changes);
            } catch (error) {
                console.error('Error in change listener:', error);
            }
        });
        
        // Check if we need to update hierarchy
        const hierarchyChanges = changes.some(c => 
            c.type === 'slotAdd' || c.type === 'slotRemove' || c.type === 'slotMove'
        );
        
        if (hierarchyChanges && window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    registerComponentHandler(componentType, handler) {
        this.componentHandlers.set(componentType, handler);
    }

    handleExternalChanges(externalChanges) {
        // Handle changes from external sources (e.g., other clients)
        // This prevents feedback loops when syncing
        console.log('Handling external changes:', externalChanges);
        
        // TODO: Implement logic to apply external changes without triggering local updates
        // This would involve updating the local state directly without going through
        // the queueChange mechanism
    }
}

// Export singleton instance
export const changeManager = new ChangeManager();
window.changeManager = changeManager; // For debugging