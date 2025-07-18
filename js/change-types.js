
// Import required dependencies
let basePath = window.location.hostname === 'localhost' ? '.' : `${window.repoUrl}/js`;
const { deepClone } = await import(`${basePath}/utils.js`);

// options: { source: 'ui' | 'history' | 'script' | 'sync' }

export class SlotPropertyChange {
    constructor(slotId, property, newValue, options) {
        this.slotId = slotId;
        this.property = property;
        this.newValue = newValue;
        this.options = options;
        this.oldValue = options.oldValue || this.getOldValue();
    }

    getOldValue() {
        const slot = SM.getSlotById(this.slotId);
        return slot[this.property];
    }

    async apply(){
        await this.change(this.newValue)
    }

    async undo(){
        await this.change(this.oldValue)
    }

    async change(value){
        const slot = SM?.getSlotById(this.slotId);
        if(!slot){
            console.log(`ERROR: Slot not found ${this.slotId}`)
            return;
        }
        let gO = window.SM.slotData.slotMap[this.slotId]._bs;
        if (!gO){
            console.log(`ERROR: Slot not found ${this.slotId}`)
            return;
        }

        
        slot[this.property] = value;
        if(this.property === "active"){
            await gO.SetActive(Boolean(value));
        }
        if(this.property === "name"){
            slot.name = value;
            inspectorApp.hierarchyPanel.render()
        }

        const spaceKey = '__' + slot.name + '/' + this.property + ':slot_' + this.slotId;
        await window.SM.setSpaceProperty(spaceKey, value, false);
    }

    getDescription() {
        return `Changed slot ${this.slotId} ${this.property} to ${this.newValue}`;
    }

    getUndoDescription() {
        return `Changed slot ${this.slotId} ${this.property} to ${this.oldValue}`;
    }
}

export class ComponentPropertyChange {
    constructor(componentId, property, newValue, options) {
        console.log("ComponentPropertyChange: ", componentId, property, newValue, options)
        this.componentId = componentId;
        this.property = property;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.component = SM.getSlotComponentById(componentId);
        this.oldValue = deepClone(options.oldValue || this.getOldValue());
        console.log("ComponentPropertyChange: ", this.componentId, this.component, this.property, this.oldValue, this.newValue)
    }

    getOldValue() {        
        return deepClone(this.component.properties?.[this.property]);
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        if(!this.component) return;

        // Generate space key for persistence
        const spaceKey = `__${this.component._slot.name}/${this.component.type}/${this.property}:component_${this.componentId}`;
        if (window.SM) {
            await window.SM.setSpaceProperty(spaceKey, value, false);
        }

        await this.component.update(this.property, value);

        // Refresh UI if needed
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    getDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.newValue)}`;
    }
    getUndoDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.oldValue)}`;
    }
}

export class SpacePropertyChange {
    constructor(property, newValue, protect, options) {
        this.property = property;
        this.newValue = newValue;
        this.protected = protect;
        this.options = options || {};
        this.oldValue = options.oldValue || this.getOldValue();
    }

    getOldValue() {
        const spaceState = SM?.scene?.spaceState;
        if (!spaceState) return undefined;
        
        const props = this.protected ? spaceState.protected : spaceState.public;
        return props[this.property];
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        if (window.SM) {
            await window.SM.setSpaceProperty(this.property, value, this.protected);
        }

        // Update space props panel
        if (window.inspectorApp?.spacePropsPanel) {
            window.inspectorApp.spacePropsPanel.render();
        }
    }

    getDescription() {
        const propType = this.protected ? 'protected' : 'public';
        return `Change ${propType} property ${this.property} to ${this.newValue}`;
    }

    getUndoDescription(){
        const propType = this.protected ? 'protected' : 'public';
        return `Change ${propType} property ${this.property} to ${this.oldValue}`;
    }
}

export class ComponentAddChange {
    constructor(slotId, componentType, options) {
        this.slotId = slotId;
        this.componentType = componentType;
        this.componentProperties = options.componentProperties;
        this.componentId = null; 
        this.options = options || {};
    }

    async apply() {
        const slot = SM.getSlotById(this.slotId);
        if (!slot) {
            console.error(`Slot ${this.slotId} not found`);
            return;
        }

        let slotComponent = await SM.addComponent(slot, this.componentType, this.componentProperties);
        this.componentId = slotComponent.id;
    }

    async undo() {
        if (!this.componentId) return;

        const slot = SM.getSlotById(this.slotId);
        if (!slot) return;

        // Remove component
        const componentIndex = slot.components.findIndex(c => c.id === this.componentId);
        if (componentIndex !== -1) {
            const component = slot.components[componentIndex];
            SM.deleteComponent(component);
        }
    }


    getDescription() {
        return `Add ${this.componentType} component`;
    }

    getUndoDescription(){
        return `Remove ${this.componentType} component`;
    }
}

export class ComponentRemoveChange {
    constructor(componentId, options) {
        this.componentId = componentId;
        this.componentData = this.captureComponentData();
        this.slotId = null;
        this.componentIndex = null;
        this.options = options || {};
    }

    captureComponentData() {
        // Find the component and its slot
        const slots = SM.getAllSlots();
        for (const slot of slots) {
            const componentIndex = slot.components?.findIndex(c => c.id === this.componentId);
            if (componentIndex !== -1) {
                this.slotId = slot.id;
                this.componentIndex = componentIndex;
                const component = slot.components[componentIndex];
                
                // Deep clone the component data
                return {
                    id: component.id,
                    type: component.type,
                    properties: JSON.parse(JSON.stringify(component.properties || {})),
                    // Store additional metadata if needed
                    _wasMonoBehavior: component.constructor?.name === 'MonoBehavior'
                };
            }
        }
        return null;
    }

    async apply() {
        if (!this.componentData || !this.slotId) {
            console.error('No component data to remove');
            return;
        }

        await SM.deleteComponent(this.slotId, this.componentId, this.componentData.type);

        // Refresh properties panel
        if (window.inspectorApp?.propertiesPanel) {
            window.inspectorApp.propertiesPanel.render(this.slotId);
        }
    }

    async undo() {
        if (!this.componentData || !this.slotId) return;

        const slot = SM.getSlotById(this.slotId);
        if (!slot) return;

        // Recreate the component
        if (this.componentData.type === 'MonoBehavior') {
            alert("Can't undo MonoBehavior component deletion")
        } else {
            // Recreate Unity component
            const addChange = new ComponentAddChange(this.slotId, this.componentData.type, { properties: this.componentData.properties });
            await addChange.apply();
            
            // Update the ID to match the original
            const newComponent = slot.components[slot.components.length - 1];
            if (newComponent && this.componentIndex !== null) {
                // Move to original position
                slot.components.pop();
                slot.components.splice(this.componentIndex, 0, newComponent);
            }
        }

        // Refresh UI
        if (window.inspectorApp?.propertiesPanel) {
            window.inspectorApp.propertiesPanel.render(this.slotId);
        }
    }

    getDescription() {
        return `Remove ${this.componentData?.type || 'unknown'} component`;
    }

    getUndoDescription(){
        return `Add ${this.componentData?.type || 'unknown'} component`;
    }
}

export class SlotAddChange {
    constructor(parentId, slotName, options) {
        this.parentId = parentId;
        this.slotName = slotName || `NewSlot_${Math.floor(Math.random() * 100000)}`;
        this.newSlotId = null; // Will be set after creation
        this.options = options || {};
    }

    async apply() {
        const newSlot = await SM.addNewSlot(this.parentId);
        if (newSlot) {
            this.newSlotId = newSlot.id;
            
            // Set the name if different from default
            if (newSlot.name !== this.slotName) {
                newSlot.name = this.slotName;
                const spaceKey = `__${newSlot.name}/name:slot_${newSlot.id}`;
                if (window.SM) {
                    await window.SM.setSpaceProperty(spaceKey, this.slotName, false);
                }
            }

            // Expand parent
            if (this.parentId) {
                SM.expandedNodes.add(this.parentId);
            }

            // Select new slot
            SM.selectSlot(newSlot.id);

            // Update UI
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: newSlot.id }
            }));

            if (window.inspectorApp?.hierarchyPanel) {
                window.inspectorApp.hierarchyPanel.render();
            }
        }
    }

    async undo() {
        if (!this.newSlotId) return;

        await SM.deleteSlot(this.newSlotId);

        // Clear selection if this slot was selected
        if (SM.selectedSlot === this.newSlotId) {
            SM.selectedSlot = null;
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: null }
            }));
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    getDescription() {
        return `Added new slot${this.parentId ? ' as child' : ' at root'}`;
    }

    getUndoDescription(){
        return `Remove slot ${this.slotName}`;
    }
}

export class SlotRemoveChange {
    constructor(slotId, options) {
        this.slotId = slotId;
        this.slotData = this.captureSlotState();
        this.parentId = null;
        this.siblingIndex = null;
        this.options = options || {};
    }

    captureSlotState() {
        const slot = SM.getSlotById(this.slotId);
        if (!slot) return null;

        this.parentId = slot.parentId;

        // Find sibling index
        if (this.parentId) {
            const parent = SM.getSlotById(this.parentId);
            if (parent?.children) {
                this.siblingIndex = parent.children.findIndex(child => child.id === this.slotId);
            }
        } else {
            // Root level slot
            this.siblingIndex = SM.slotData.slots.findIndex(s => s.id === this.slotId);
        }

        return this.captureSlotStateRecursive(slot);
    }

    captureSlotStateRecursive(slot) {
        return {
            id: slot.id,
            name: slot.name,
            active: slot.active,
            persistent: slot.persistent,
            parentId: slot.parentId,
            components: slot.components?.map(c => ({
                id: c.id,
                type: c.type,
                properties: JSON.parse(JSON.stringify(c.properties || {})),
                _wasMonoBehavior: c.constructor?.name === 'MonoBehavior'
            })) || [],
            children: slot.children?.map(child => this.captureSlotStateRecursive(child)) || []
        };
    }

    async apply() {
        if (!this.slotData) return;

        await SM.deleteSlot(this.slotId);

        // Clear selection if needed
        if (SM.selectedSlot === this.slotId) {
            SM.selectedSlot = null;
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: null }
            }));
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async undo() {
        if (!this.slotData) return;

        // Recreate the slot hierarchy
        await this.recreateSlotHierarchy(this.slotData, this.parentId, this.siblingIndex);

        // Update UI
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async recreateSlotHierarchy(slotData, parentId, siblingIndex) {
        // Create the slot
        const newSlot = await SM.addNewSlot(parentId);
        if (!newSlot) return null;

        // Restore slot properties
        newSlot.name = slotData.name;
        newSlot.active = slotData.active;
        newSlot.persistent = slotData.persistent;

        // Restore components
        for (const compData of slotData.components) {
            if (compData.type === 'MonoBehavior') {
                alert("Can't undo MonoBehavior component deletion")
            } else {
                // For Unity components, we need to recreate them
                const addChange = new ComponentAddChange(newSlot.id, compData.type, { properties: compData.properties });
                await addChange.apply();
            }
        }

        // Recreate children recursively
        for (const childData of slotData.children) {
            await this.recreateSlotHierarchy(childData, newSlot.id);
        }

        // Move to correct position if needed
        if (siblingIndex !== null && siblingIndex >= 0) {
            if (parentId) {
                const parent = SM.getSlotById(parentId);
                if (parent?.children) {
                    const currentIndex = parent.children.findIndex(child => child.id === newSlot.id);
                    if (currentIndex !== -1 && currentIndex !== siblingIndex) {
                        parent.children.splice(currentIndex, 1);
                        parent.children.splice(siblingIndex, 0, newSlot);
                    }
                }
            } else {
                // Root level reordering
                const currentIndex = SM.slotData.slots.findIndex(s => s.id === newSlot.id);
                if (currentIndex !== -1 && currentIndex !== siblingIndex) {
                    SM.slotData.slots.splice(currentIndex, 1);
                    SM.slotData.slots.splice(siblingIndex, 0, newSlot);
                }
            }
        }

        return newSlot;
    }

    getDescription() {
        return `Remove slot ${this.slotData?.name || ''}`;
    }

    getUndoDescription(){
        return `Add slot ${this.slotData?.name || ''}`;
    }
}

export class SlotMoveChange {
    constructor(slotId, newParentId, options) {
        this.slotId = slotId;
        this.newParentId = newParentId;
        const slot = SM.getSlotById(slotId);
        this.oldParentId = slot?.parentId || null;
        this.oldSiblingIndex = this.getSiblingIndex(slotId, this.oldParentId);
        this.options = options || {};
    }

    getSiblingIndex(slotId, parentId) {
        if (parentId) {
            const parent = SM.getSlotById(parentId);
            return parent?.children?.findIndex(child => child.id === slotId) ?? -1;
        } else {
            return SM.slotData.slots.findIndex(s => s.id === slotId);
        }
    }

    async apply() {
        if (this.newParentId === null) {
            await SM.reparentSlot(this.slotId, SM.slotData.slots[0].id);
        } else {
            await SM.reparentSlot(this.slotId, this.newParentId);
            SM.expandedNodes.add(this.newParentId);
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    async undo() {
        if (this.oldParentId === null) {
            await SM.reparentSlot(this.slotId, SM.slotData.slots[0].id);
        } else {
            await SM.reparentSlot(this.slotId, this.oldParentId);
        }

        // Restore sibling position if possible
        const slot = SM.getSlotById(this.slotId);
        if (slot && this.oldSiblingIndex >= 0) {
            if (this.oldParentId) {
                const parent = SM.getSlotById(this.oldParentId);
                if (parent?.children) {
                    const currentIndex = parent.children.findIndex(child => child.id === this.slotId);
                    if (currentIndex !== -1 && currentIndex !== this.oldSiblingIndex) {
                        parent.children.splice(currentIndex, 1);
                        parent.children.splice(this.oldSiblingIndex, 0, slot);
                    }
                }
            } else {
                const currentIndex = SM.slotData.slots.findIndex(s => s.id === this.slotId);
                if (currentIndex !== -1 && currentIndex !== this.oldSiblingIndex) {
                    SM.slotData.slots.splice(currentIndex, 1);
                    SM.slotData.slots.splice(this.oldSiblingIndex, 0, slot);
                }
            }
        }

        // Update hierarchy
        if (window.inspectorApp?.hierarchyPanel) {
            window.inspectorApp.hierarchyPanel.render();
        }
    }

    getDescription() {
        return `Move slot`;
    }

    getUndoDescription(){
        return `Move slot`;
    }
}