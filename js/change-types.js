
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
        slot.Set(this.property, value);
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
        this.oldValue = deepClone(this.options.oldValue || this.getOldValue());
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

        await this.component.Set(this.property, value);

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
        let slot_id = `${this.parentId}/${this.slotName}`
        let data = `slot_removed:${slot_id}`
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
        let data = `load_slot:${this.slot.parentId}|${JSON.stringify(this.slotExport)}`
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
        const slot = SM.getSlotById(this.slotId);
        if (!slot) return;
        await slot.SetParent(this.newParentId);
    }

    async undo() {
        const slot = SM.getSlotById(this.slotId);
        if (!slot) return;
        await slot.SetParent(this.oldParentId);
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
        this.monobehavior = SM.getSlotComponentById(componentId);
        this.oldValue = deepClone(options.oldValue || this.getOldValue());
    }

    getOldValue() {
        if (!this.monobehavior || !this.monobehavior.ctx?.vars) return undefined;
        return deepClone(this.monobehavior.ctx.vars[this.varName]);
    }

    async apply() {
        await this.change(this.newValue);
    }

    async undo() {
        await this.change(this.oldValue);
    }

    async change(value) {
        console.log("[CHANGE] changing var =>", this.varName, value)
        if (!this.monobehavior) return;

        // Update the properties.vars for persistence
        if (!this.monobehavior.ctx.vars) {
            return;
        }

        await this.monobehavior.updateVar(this.varName, value);

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


export class LoadItemChange {
    constructor(itemName, parentId, options) {
        this.itemName = itemName;
        this.parentId = parentId || 'Root';
        this.options = options || {};
        this.slotId = null;
    }

    async apply() {
        const item = inventory.items[this.itemName];
        if(!item){
            console.log("[ERROR] no item found =>", this.itemName)
            return null;
        }
        if(item.itemType !== "slot"){
            console.log("[ERROR] item is not a slot =>", this.itemName)
            return null;
        }

        let changeChildrenIds = (slot)=>{
            slot.components.forEach(component=>{
                component.id = `${component.type}_${Math.floor(Math.random()*99999)}`;
            })
            slot.children.forEach(child=>{
                child.parentId = slot.id;
                child.id = slot.id+"/"+child.name;
                changeChildrenIds(child);
            })
        }

        let itemData = item.data;
        itemData.name = this.itemName+"_"+Math.floor(Math.random() * 100000);
        itemData.parentId = this.parentId;
        itemData.id = this.parentId+"/"+itemData.name;
        changeChildrenIds(itemData);

        console.log("[ITEM DATA] =>", itemData)
        

        let data = `load_slot:${this.parentId}|${JSON.stringify(itemData)}`
        SM.sendOneShot(data);

        //Additionally send all of the slot properties to space props
        if(!this.options.ephemeral){

            let getSlotSpaceProperties = (slot)=>{
                let props = {}
                let getSubSlotProps = (slot)=>{
                    props[`__${slot.id}/active:slot`] = slot.active
                    props[`__${slot.id}/persistent:slot`] = slot.persistent
                    props[`__${slot.id}/name:slot`] = slot.name
                    
                    slot.components.forEach(component=>{
                        Object.keys(component.properties).forEach(prop=>{
                            props[`__${component.id}/${prop}:component`] = component.properties[prop]
                        })
                    })
    
                    slot.children.forEach(child=>{
                        getSubSlotProps(child)
                    })
                }
    
                getSubSlotProps(slot)
                return props
            }


            let itemProps = getSlotSpaceProperties(itemData);
            console.log("[ITEM PROPS] =>", itemProps)
            SM.scene.SetPublicSpaceProps(itemProps)

            if(localhost){
                Object.keys(itemProps).forEach(key=>{
                    SM.scene.spaceState.public[key] = itemProps[key]
                })
                localStorage.setItem('lastSpaceState', JSON.stringify(SM.scene.spaceState));
            }
        }


        this.slotId = `${this.parentId}/${itemData.name}`
        const returnWhenSlotLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const slot = SM.getSlotById(this.slotId);
                if (slot !== undefined && slot.finished_loading) {
                  resolve(slot);
                } else {
                  // try again in 100 ms
                  setTimeout(check, 100);
                }
              };
              check();
            });
          };
        return await returnWhenSlotLoaded();
    }

    async undo() {
        if(!this.slotId) return;
        let data = `slot_removed:${this.slotId}`
        SM.sendOneShot(data);
    }

    getDescription() {
        return `Load item ${this.itemName} to ${this.parentId}`;
    }

    getUndoDescription() {
        return `Remove item ${this.itemName} from ${this.parentId}`;
    }
}

export class CloneSlotChange {
    constructor(slotId, options) {
        this.sourceSlot = SM.getSlotById(slotId);
        if(!this.sourceSlot){
            console.error(`Source slot ${slotId} not found`);
            return;
        }
        this.slotData = this.sourceSlot.export();
        this.slotId = `${this.sourceSlot.parentId}/${this.sourceSlot.name}_${Math.floor(Math.random() * 100000)}`;
        this.options = options || {};
    }

    async apply() {
       

        let changeChildrenIds = (slot)=>{
            slot.components.forEach(component=>{
                component.id = `${component.type}_${Math.floor(Math.random()*99999)}`;
            })
            slot.children.forEach(child=>{
                child.parentId = slot.id;
                child.id = slot.id+"/"+child.name;
                changeChildrenIds(child);
            })
        }

        let itemData = this.slotData;
        itemData.name = this.sourceSlot.name+"_"+Math.floor(Math.random() * 100000);
        itemData.parentId = this.sourceSlot.parentId;
        itemData.id = this.sourceSlot.parentId+"/"+itemData.name;
        changeChildrenIds(itemData);

        let data = `load_slot:${this.sourceSlot.parentId}|${JSON.stringify(itemData)}`
        SM.sendOneShot(data);

        //Additionally send all of the slot properties to space props
        if(!this.options.ephemeral){

            let getSlotSpaceProperties = (slot)=>{
                let props = {}
                let getSubSlotProps = (slot)=>{
                    props[`__${slot.id}/active:slot`] = slot.active
                    props[`__${slot.id}/persistent:slot`] = slot.persistent
                    props[`__${slot.id}/name:slot`] = slot.name
                    
                    slot.components.forEach(component=>{
                        Object.keys(component.properties).forEach(prop=>{
                            props[`__${component.id}/${prop}:component`] = component.properties[prop]
                        })
                    })
    
                    slot.children.forEach(child=>{
                        getSubSlotProps(child)
                    })
                }
    
                getSubSlotProps(slot)
                return props
            }


            let itemProps = getSlotSpaceProperties(itemData);
            console.log("[ITEM PROPS] =>", itemProps)
            SM.scene.SetPublicSpaceProps(itemProps)

            if(localhost){
                Object.keys(itemProps).forEach(key=>{
                    SM.scene.spaceState.public[key] = itemProps[key]
                })
                localStorage.setItem('lastSpaceState', JSON.stringify(SM.scene.spaceState));
            }
        }


        this.slotId = `${this.sourceSlot.parentId}/${itemData.name}`
        const returnWhenSlotLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const slot = SM.getSlotById(this.slotId);
                if (slot !== undefined && slot.finished_loading) {
                  resolve(slot);
                } else {
                  // try again in 100 ms
                  setTimeout(check, 100);
                }
              };
              check();
            });
          };
        return await returnWhenSlotLoaded();
    }

    async undo() {
        if(!this.slotId) return;
        let data = `slot_removed:${this.slotId}`
        SM.sendOneShot(data);
    }

    getDescription() {
        return `Clone slot ${this.sourceSlot.name}`;
    }

    getUndoDescription() {
        return `Remove slot ${this.sourceSlot.name}`;
    }
}



window.SetSlotProp = async (slotId, property, newValue, options)=>{
    let change = new SlotPropertyChange(slotId, property, newValue, options);
    return await change.apply();
}
window.SetComponentProp = async (componentId, property, newValue, options)=>{
    let change = new ComponentPropertyChange(componentId, property, newValue, options);
    return await change.apply();
}
window.SetSpaceProp = async (property, newValue, protect, options)=>{
    let change = new SpacePropertyChange(property, newValue, protect, options);
    return await change.apply();
}
window.AddComponent = async (slotId, componentType, options)=>{
    let change = new ComponentAddChange(slotId, componentType, options);
    return await change.apply();
}
window.RemoveComponent = async (componentId, options)=>{
    let change = new ComponentRemoveChange(componentId, options);
    return await change.apply();
}
window.AddSlot = async (parentId, slotName, options)=>{
    let change = new SlotAddChange(parentId, slotName, options);
    return await change.apply();
}
window.RemoveSlot = async (slotId, options)=>{
    let change = new SlotRemoveChange(slotId, options);
    return await change.apply();
}
window.MoveSlot = async (slotId, newParentId, options)=>{
    let change = new SlotMoveChange(slotId, newParentId, options);
    return await change.apply();
}
window.SetMonoBehaviorVar = async (componentId, varName, newValue, options)=>{
    let change = new MonoBehaviorVarChange(componentId, varName, newValue, options);
    return await change.apply();
}

window.LoadItem = async (itemName, parentId, options)=>{
    let change = new LoadItemChange(itemName, parentId, options);
    return await change.apply();
}

window.CloneSlot = async (slotId, options)=>{
    let change = new CloneSlotChange(slotId, options);
    return await change.apply();
}