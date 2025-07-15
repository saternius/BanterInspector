/**
 * Simplified Change Manager
 * Applies changes immediately without batching
 */

let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js';
import { sceneManager } from './scene-manager.js';
import { SimpleHistoryManager, ChangeTypes } from './simple-history-manager.js';

class SimpleChangeManager {
    constructor() {
        this.componentHandlers = new Map();
        this.registeredComponents = new Map();
        this.historyManager = null;
        this.slotAddHistory = new Map(); // Track newly created slots for undo
    }

    async initialize() {
        // Register default component handlers
        this.registerDefaultHandlers();
        
        // Initialize history manager
        this.historyManager = new SimpleHistoryManager();
        
        console.log('Simple Change Manager initialized');
    }

    /**
     * Apply a change immediately
     */
    async applyChange(change) {
        // Skip if from history (to prevent loops)
        if (change.source === 'history-apply') {
            return this.processChange(change);
        }
        
        // Record in history if from UI
        if (change.source === 'inspector-ui' && this.historyManager && !this.historyManager.isApplying) {
            const oldValue = this.getOldValue(change);
            const historyChange = this.convertToHistoryFormat(change);
            this.historyManager.recordChange(historyChange, oldValue);
        }
        
        // Apply the change
        return this.processChange(change);
    }

    /**
     * Process a change based on its type
     */
    async processChange(change) {
        console.log(`Processing ${change.type} change:`, change);
        
        switch (change.type) {
            case 'component':
                return this.processComponentChange(change);
            case 'slot':
                return this.processSlotChange(change);
            case 'spaceProperty':
                return this.processSpacePropertyChange(change);
            case 'componentAdd':
                return this.processComponentAdd(change);
            case 'componentRemove':
                return this.processComponentRemove(change);
            case 'slotAdd':
                return this.processSlotAdd(change);
            case 'slotRemove':
                return this.processSlotRemove(change);
            case 'slotMove':
                return this.processSlotMove(change);
            default:
                console.warn('Unknown change type:', change.type);
        }
    }

    /**
     * Get the old value before a change
     */
    getOldValue(change) {
        if (change.type === 'spaceProperty') {
            const spaceState = sceneManager?.scene?.spaceState;
            if (spaceState) {
                const props = change.metadata.isProtected ? spaceState.protected : spaceState.public;
                return props[change.metadata.key];
            }
        } else if (change.type === 'slot') {
            const slot = sceneManager?.getSlotById(change.targetId);
            return slot ? slot[change.property] : undefined;
        } else if (change.type === 'component') {
            const slot = sceneManager?.getSlotById(change.metadata.slotId);
            if (slot) {
                const component = slot.components.find(c => c.id === change.targetId);
                return component?.properties?.[change.property];
            }
        } else if (change.type === 'componentAdd' || change.type === 'slotAdd') {
            return null; // Nothing existed before
        } else if (change.type === 'componentRemove') {
            const slot = sceneManager?.getSlotById(change.metadata.slotId);
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
        } else if (change.type === 'slotRemove') {
            const slot = sceneManager?.getSlotById(change.targetId);
            return slot ? this.captureSlotState(slot) : null;
        } else if (change.type === 'slotMove') {
            const slot = sceneManager?.getSlotById(change.targetId);
            return slot?.parentId;
        }
        return undefined;
    }

    /**
     * Capture complete slot state for undo
     */
    captureSlotState(slot) {
        return {
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
    }

    /**
     * Convert change to history format
     */
    convertToHistoryFormat(change) {
        let historyChange = {
            type: ChangeTypes.PROPERTY,
            targetId: change.targetId,
            targetType: change.type,
            property: change.property,
            newValue: change.value,
            source: change.source,
            metadata: { ...change.metadata }
        };
        
        // Map change types to history format
        switch (change.type) {
            case 'component':
                historyChange.targetType = 'component';
                break;
            case 'slot':
                historyChange.targetType = 'slot';
                if (change.property === 'name') {
                    historyChange.type = ChangeTypes.SLOT_RENAME;
                }
                break;
            case 'spaceProperty':
                historyChange.type = ChangeTypes.SPACE_PROPERTY;
                historyChange.targetType = 'space';
                break;
            case 'componentAdd':
                historyChange.type = ChangeTypes.COMPONENT_ADD;
                historyChange.targetType = 'component';
                break;
            case 'componentRemove':
                historyChange.type = ChangeTypes.COMPONENT_REMOVE;
                historyChange.targetType = 'component';
                break;
            case 'slotAdd':
                historyChange.type = ChangeTypes.SLOT_ADD;
                historyChange.targetType = 'slot';
                break;
            case 'slotRemove':
                historyChange.type = ChangeTypes.SLOT_REMOVE;
                historyChange.targetType = 'slot';
                break;
            case 'slotMove':
                historyChange.type = ChangeTypes.SLOT_MOVE;
                historyChange.targetType = 'slot';
                historyChange.newParentId = change.value;
                break;
        }
        
        return historyChange;
    }

    /**
     * Process component property change
     */
    async processComponentChange(change) {
        // Update local state
        const slot = sceneManager?.getSlotById(change.metadata.slotId);
        if (slot) {
            const component = slot.components.find(c => c.id === change.targetId);
            if (component && component.properties) {
                component.properties[change.property] = change.value;
            }
        }
        
        // Generate space key for persistence
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey && window.SM) {
            await window.SM.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Apply component-specific handler if available
        const handler = this.componentHandlers.get(change.metadata.componentType);
        if (handler && handler.apply) {
            const component = this.getComponentById(change.targetId);
            if (component && component._bs) {
                let transformedValue = change.value;
                if (handler.transform) {
                    transformedValue = handler.transform(change.property, change.value);
                }
                await handler.apply(component._bs, change.property, transformedValue);
            }
        } else if (window.SM) {
            // Default Unity update
            await window.SM.updateUnityComponent(change.targetId, change.property, change.value);
        }
        
        // Refresh UI
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    /**
     * Process slot property change
     */
    async processSlotChange(change) {
        // Update local state
        const slot = sceneManager?.getSlotById(change.targetId);
        if (slot) {
            slot[change.property] = change.value;
        }
        
        // Generate space key for persistence
        const spaceKey = this.generateSpaceKey(change);
        if (spaceKey && window.SM) {
            await window.SM.setSpaceProperty(spaceKey, change.value, false);
        }
        
        // Update Unity if needed
        if (change.property === 'active' && window.SM) {
            await window.SM.updateUnityObject(change.targetId, change.property, change.value);
        }
        
        // Update hierarchy if name changed
        if (change.property === 'name' && window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    /**
     * Process space property change
     */
    async processSpacePropertyChange(change) {
        if (window.SM) {
            await window.SM.setSpaceProperty(
                change.metadata.key,
                change.value,
                change.metadata.isProtected
            );
        }
        
        // Update space props panel
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    /**
     * Process component addition
     */
    async processComponentAdd(change) {
        console.log('Component added:', change.value.componentType, 'to slot:', change.metadata.slotId);
        // Component creation is handled by component-menu.js
        // This is just for history tracking
    }

    /**
     * Process component removal
     */
    async processComponentRemove(change) {
        console.log('Removing component:', change);
        
        try {
            await sceneManager.deleteComponent(
                change.metadata.slotId,
                change.targetId,
                change.metadata.componentType
            );
            
            this.unregisterComponent(change.targetId);
            
            // Refresh properties panel
            if (window.inspectorApp?.propertiesPanel) {
                window.inspectorApp.propertiesPanel.render(change.metadata.slotId);
            }
        } catch (error) {
            console.error('Failed to remove component:', error);
        }
    }

    /**
     * Process slot addition
     */
    async processSlotAdd(change) {
        console.log('Adding slot:', change);
        
        try {
            const newSlot = await sceneManager.addNewSlot(change.value.parentId);
            if (newSlot) {
                // Store for undo tracking
                const historyKey = `${change.value.parentId || 'root'}_${change.timestamp || Date.now()}`;
                this.slotAddHistory.set(historyKey, newSlot.id);
                this.slotAddHistory.set(newSlot.id, historyKey);
                
                // Expand parent
                if (change.value.parentId) {
                    sceneManager.expandedNodes.add(change.value.parentId);
                }
                
                // Select new slot
                sceneManager.selectSlot(newSlot.id);
                
                // Update UI
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: newSlot.id }
                }));
                
                if (window.inspectorApp?.hierarchyPanel) {
                    window.inspectorApp.hierarchyPanel.render();
                }
            }
        } catch (error) {
            console.error('Failed to add slot:', error);
        }
    }

    /**
     * Process slot removal
     */
    async processSlotRemove(change) {
        console.log('Removing slot:', change);
        
        try {
            await sceneManager.deleteSlot(change.targetId);
            
            // Clear selection if needed
            if (sceneManager.selectedSlot === change.targetId) {
                sceneManager.selectedSlot = null;
                document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                    detail: { slotId: null }
                }));
            }
            
            // Update hierarchy
            if (window.inspectorApp?.hierarchyPanel) {
                window.inspectorApp.hierarchyPanel.render();
            }
        } catch (error) {
            console.error('Failed to remove slot:', error);
        }
    }

    /**
     * Process slot move
     */
    async processSlotMove(change) {
        console.log('Moving slot:', change);
        
        try {
            if (change.value === null) {
                await sceneManager.moveSlotToRoot(change.targetId);
            } else {
                await sceneManager.reparentSlot(change.targetId, change.value);
                sceneManager.expandedNodes.add(change.value);
            }
            
            // Update hierarchy
            if (window.inspectorApp?.hierarchyPanel) {
                window.inspectorApp.hierarchyPanel.render();
            }
        } catch (error) {
            console.error('Failed to move slot:', error);
        }
    }

    /**
     * Generate space key for persistence
     */
    generateSpaceKey(change) {
        const slot = sceneManager?.getSlotById(change.metadata.slotId);
        if (!slot) return null;
        
        const prefix = '__' + slot.name;
        
        if (change.type === 'component') {
            return `${prefix}/${change.metadata.componentType}/${change.property}:component_${change.targetId}`;
        } else if (change.type === 'slot') {
            return `${prefix}/${change.property}:slot_${change.targetId}`;
        }
        return null;
    }

    /**
     * Register default component handlers
     */
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
    }

    registerComponentHandler(componentType, handler) {
        this.componentHandlers.set(componentType, handler);
    }

    registerComponent(component) {
        this.registeredComponents.set(component.id, component);
    }

    unregisterComponent(componentId) {
        this.registeredComponents.delete(componentId);
    }

    getComponentById(componentId) {
        return this.registeredComponents.get(componentId) || 
               window.SM?.sceneData?.componentMap?.[componentId];
    }

    getHistoryManager() {
        return this.historyManager;
    }
}

// Export singleton instance
export const simpleChangeManager = new SimpleChangeManager();
window.simpleChangeManager = simpleChangeManager; // For debugging