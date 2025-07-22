
// Import required dependencies
let localhost = window.location.hostname === 'localhost'
let basePath = localhost ? '.' : `${window.repoUrl}/js`;
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

        
       

        const spaceKey = '__' + slot.id + '/' + this.property + ':slot';
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
        const spaceKey = `__${this.component._slot.name}/${this.component.type}/${this.property}:${this.componentId}`;
        if (window.SM) {
            await window.SM.setSpaceProperty(spaceKey, value, false);
        }

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
        this.options = options || {};
        this.componentProperties = options.componentProperties || {};
    }

    async apply() {
        this.componentProperties.id = `${this.componentType}_${Math.floor(Math.random() * 10000)}`;
        let event = {
            slotId: this.slotId,
            componentType: this.componentType,
            componentProperties: this.componentProperties
        }
        let event_str = JSON.stringify(event);
        let data = `component_added:${event_str}`
        SM.sendOneShot(data);

    }

    async undo() {
        if (!this.componentProperties.id) return;
        let data = `component_removed:${this.componentProperties.id}`
        SM.sendOneShot(data);
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
        let component = SM.getSlotComponentById(this.componentId);
        if(!component){
            console.error(`Component ${this.componentId} not found`);
            return null;
        }
        return {
            slotId: component._slot.id,
            id: component.id,
            type: component.type,
            properties: JSON.parse(JSON.stringify(component.properties || {}))
        }
    }

    async apply() {
        if (!this.componentData) {
            console.error('No component data to remove');
            return;
        }

        let data = `component_removed:${this.componentId}`
        SM.sendOneShot(data);
    }

    async undo() {
        if (!this.componentData) return;
        this.componentData.properties.id = this.componentData.id;
        let event = {
            slotId: this.componentData.slotId,
            componentType: this.componentData.type,
            componentProperties: this.componentData.properties
        }
        let event_str = JSON.stringify(event);
        let data = `component_added:${event_str}`
        SM.sendOneShot(data);
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
        let data = `slot_added:${this.parentId}:${this.slotName}`
        SM.sendOneShot(data);
    }

    async undo() {
        if (!this.newSlotId) return;
        let data = `slot_removed:${this.parentId}/${this.slotName}`
        SM.sendOneShot(data);
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
        console.log("SlotRemoveChange: ", slotId)
        this.slot = SM.getSlotById(slotId);
        this.slotExport = this.slot.export();
        this.siblingIndex = null;
        this.options = options || {};
    }

    captureSlotState() {
        if (!this.slot) return null;

        let parentId = this.slot.parentId;

        // Find sibling index
        if (parentId) {
            const parent = SM.getSlotById(parentId);
            if (parent?.children) {
                this.siblingIndex = parent.children.findIndex(child => child.id === this.slot.id);
            }
        } else {
            // Root level slot
            this.siblingIndex = SM.slotData.slots.findIndex(s => s.id === this.slot.id);
        }

        return this.slot.export();
    }


    async apply() {
        let data = `slot_removed:${this.slot.id}`
        SM.sendOneShot(data);
    }

    async undo() {
        if (!this.slotExport) return;

        // Recreate the slot hierarchy
        let data = `load_slot:${JSON.stringify(this.slotExport)}`
        SM.sendOneShot(data);
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
        let data = `slot_moved:${this.slotId}:${this.newParentId}`
        SM.sendOneShot(data);
    }

    async undo() {
        let data = `slot_moved:${this.slotId}:${this.oldParentId}:${this.oldSiblingIndex}`
        SM.sendOneShot(data);
    }

    getDescription() {
        return `Move slot`;
    }

    getUndoDescription(){
        return `Move slot`;
    }
}

export class MonoBehaviorVarChange {
    constructor(componentId, varName, newValue, options) {
        this.componentId = componentId;
        this.varName = varName;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.component = SM.slotData.componentMap[componentId];
        this.oldValue = deepClone(options.oldValue || this.getOldValue());
    }

    getOldValue() {
        if (!this.component || !this.component.properties?.vars) return undefined;
        return deepClone(this.component.properties.vars[this.varName]);
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        if (!this.component) return;

        // Update the properties.vars for persistence
        if (!this.component.properties.vars) {
            this.component.properties.vars = {};
        }
        this.component.properties.vars[this.varName] = value;

        // Update the scriptContext.vars for runtime
        if (this.component.updateVar) {
            this.component.updateVar(this.varName, value);
        }

        // Generate space key for persistence
        const spaceKey = `__${this.component._slot.name}/${this.component.type}/vars/${this.varName}:${this.componentId}`;
        if (window.SM) {
            // Send the entire vars object
            await window.SM.setSpaceProperty(spaceKey, this.component.properties.vars, false);
        }

        // Refresh UI if needed
        if (window.inspectorApp?.propertiesPanel) {
            window.inspectorApp.propertiesPanel.render(SM.selectedSlot);
        }
    }

    getDescription() {
        return `Changed MonoBehavior var ${this.varName} to ${JSON.stringify(this.newValue)}`;
    }

    getUndoDescription() {
        return `Changed MonoBehavior var ${this.varName} to ${JSON.stringify(this.oldValue)}`;
    }
}

// Load Inventory
// Duplicate Slot
