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
    }

    async initialize() {
        // Register default component handlers
        this.registerDefaultHandlers();
        console.log('Change Manager initialized');
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
                key: spaceChange.key
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
        
        // Process changes
        await this.processChanges(changes);
        
        // Notify listeners
        this.notifyListeners(changes);
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