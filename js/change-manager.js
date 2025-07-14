/**
 * Centralized Change Manager
 * Handles all property changes for slots and components
 */

let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';

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
            const spaceState = window.SM?.scene?.spaceState;
            if (spaceState) {
                const props = change.metadata.isProtected ? spaceState.protected : spaceState.public;
                return props[change.metadata.key];
            }
        } else if (change.type === 'slot') {
            const slot = window.SM?.getSlotById(change.targetId);
            return slot ? slot[change.property] : undefined;
        } else if (change.type === 'component') {
            const slot = window.SM?.getSlotById(change.metadata.slotId);
            if (slot) {
                const component = slot.components.find(c => c.id === change.targetId);
                return component?.properties?.[change.property];
            }
        }
        return undefined;
    }
    
    async applyHistoryChange(change) {
        const { target, property, oldValue } = change;
        
        // Create a change object that matches our normal format
        const changeObj = {
            type: target.type,
            targetId: target.id,
            property: property,
            value: oldValue !== undefined ? oldValue : change.newValue,
            metadata: {
                source: 'history-apply' // Mark as history change
            }
        };
        
        // Apply the change based on type
        if (target.type === 'spaceProperty') {
            changeObj.metadata.key = property;
            changeObj.metadata.isProtected = change.isProtected || false;
            await this.processSpacePropertyChange(changeObj);
        } else if (target.type === 'slot') {
            changeObj.metadata.slotId = target.id;
            await this.processSlotChange(changeObj);
        } else if (target.type === 'component') {
            // Need to find the slot for component changes
            const slot = this.findSlotByComponentId(target.id);
            if (slot) {
                changeObj.metadata.slotId = slot.id;
                changeObj.metadata.componentType = change.componentType || 'Unknown';
                await this.processComponentChange(changeObj);
            }
        }
        
        // Trigger UI refresh
        document.dispatchEvent(new CustomEvent('historyChangeApplied', {
            detail: { change: changeObj }
        }));
    }
    
    findSlotByComponentId(componentId) {
        const slots = window.SM?.getAllSlots() || [];
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