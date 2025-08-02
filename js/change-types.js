// Import required dependencies

const { deepClone } = await import(`${window.repoUrl}/utils.js`);

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

    cmd(){
        return {
            action: "set_slot_property",
            slotId: this.slotId,
            property: this.property,
            newValue: this.newValue,
            options: this.options
        }
    }
}

export class ComponentPropertyChange {
    constructor(componentId, property, newValue, options) {
        //console.log("ComponentPropertyChange: ", componentId, property, newValue, options)
        this.componentId = componentId;
        this.property = property;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.component = SM.getSlotComponentById(componentId);
        this.oldValue = deepClone(this.options.oldValue || this.getOldValue());
       // console.log("ComponentPropertyChange: ", this.componentId, this.component, this.property, this.oldValue, this.newValue)
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
        if (inspector?.spacePropsPanel) {
            inspector.spacePropsPanel.render();
        }
    }

    getDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.newValue)}`;
    }

    getUndoDescription() {
        return `Changed ${this.component.type} ${this.property} to ${JSON.stringify(this.oldValue)}`;
    }

    cmd(){
        return {
            action: "set_component_property",
            componentId: this.componentId,
            property: this.property,
            newValue: this.newValue,
            options: this.options
        }
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
   
        await networking.setSpaceProperty(this.property, value, this.protected);
        // Update space props panel
        if (inspector?.spacePropsPanel) {
            inspector.spacePropsPanel.render();
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

    cmd(){
        return {
            action: "set_space_property",
            property: this.property,
            newValue: this.newValue,
            protected: this.protected,
            options: this.options
        }
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
        networking.sendOneShot(data);

    }

    async undo() {
        if (!this.componentProperties.id) return;
        let data = `component_removed:${this.componentProperties.id}`
        networking.sendOneShot(data);
    }


    getDescription() {
        return `Add ${this.componentType} component`;
    }

    getUndoDescription(){
        return `Remove ${this.componentType} component`;
    }

    cmd(){
        return {
            action: "add_component",
            slotId: this.slotId,
            componentType: this.componentType,
            componentProperties: this.componentProperties,
            options: this.options
        }
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
        networking.sendOneShot(data);
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
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Remove ${this.componentData?.type || 'unknown'} component`;
    }

    getUndoDescription(){
        return `Add ${this.componentData?.type || 'unknown'} component`;
    }

    cmd(){
        return {
            action: "remove_component",
            componentId: this.componentId,
            options: this.options
        }
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
        networking.sendOneShot(data);
    }

    async undo() {
        if (!this.newSlotId) return;
        let slot_id = `${this.parentId}/${this.slotName}`
        let data = `slot_removed:${slot_id}`
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Added new slot${this.parentId ? ' as child' : ' at root'}`;
    }

    getUndoDescription(){
        return `Remove slot ${this.slotName}`;
    }

    cmd(){
        return {
            action: "add_slot",
            parentId: this.parentId,
            slotName: this.slotName,
            options: this.options
        }
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
        networking.sendOneShot(data);
    }

    async undo() {
        if (!this.slotExport) return;

        // Recreate the slot hierarchy
        let data = `load_slot:${this.slot.parentId}|${JSON.stringify(this.slotExport)}`
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Remove slot ${this.slotData?.name || ''}`;
    }

    getUndoDescription(){
        return `Add slot ${this.slotData?.name || ''}`;
    }

    cmd(){
        return {
            action: "remove_slot",
            slotId: this.slot.id,
            options: this.options
        }
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

    cmd(){
        return {
            action: "move_slot",
            slotId: this.slotId,
            newParentId: this.newParentId,
            options: this.options
        }
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
        if (inspector?.propertiesPanel) {
            inspector.propertiesPanel.render(SM.selectedSlot);
        }
    }

    getDescription() {
        return `Changed MonoBehavior var ${this.varName} to ${JSON.stringify(this.newValue)}`;
    }

    getUndoDescription() {
        return `Changed MonoBehavior var ${this.varName} to ${JSON.stringify(this.oldValue)}`;
    }

    cmd(){
        return {
            action: "set_mono_behavior_var",
            componentId: this.componentId,
            varName: this.varName,
            newValue: this.newValue,
            options: this.options
        }
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
        networking.sendOneShot(data);

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
            // console.log("[ITEM PROPS] =>", itemProps)
            // SM.scene.SetPublicSpaceProps(itemProps)
            Object.keys(itemProps).forEach(key=>{
                //SM.scene.spaceState.public[key] = itemProps[key]
                SM.props[key] = itemProps[key]
            })
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
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Load item ${this.itemName} to ${this.parentId}`;
    }

    getUndoDescription() {
        return `Remove item ${this.itemName} from ${this.parentId}`;
    }

    cmd(){
        return {
            action: "load_item",
            itemName: this.itemName,
            parentId: this.parentId,
            options: this.options
        }
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
        networking.sendOneShot(data);

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
            // console.log("[ITEM PROPS] =>", itemProps)
            // SM.scene.SetPublicSpaceProps(itemProps)
            Object.keys(itemProps).forEach(key=>{
                //SM.scene.spaceState.public[key] = itemProps[key]
                SM.props[key] = itemProps[key]
            })
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
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Clone slot ${this.sourceSlot.name}`;
    }

    getUndoDescription() {
        return `Remove slot ${this.sourceSlot.name}`;
    }

    cmd(){
        return {
            action: "clone_slot",
            slotId: this.slotId,
            options: this.options
        }
    }
}

export class SaveSlotItemChange{
    constructor(slotId, itemName, folder, options){
        this.slotId = slotId;
        this.slot = SM.getSlotById(slotId);
        this.itemName = itemName || this.slot.name;
        this.folder = folder || inventory.currentFolder;
        this.options = options || {};
    }


    finalizeAddItem(){
        let data = this.slot.export();
        const inventoryItem = {
            author: SM.scene?.localUser?.name || 'Unknown',
            name: this.itemName,
            created: Date.now(),
            itemType: "slot",
            data: data,
            folder: this.folder
        };
        const storageKey = `inventory_${this.itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(inventoryItem));
        inventory.reload();
    }

    async apply(){
        console.log("[SAVE SLOT ITEM CHANGE] applying =>", this.slotId, this.itemName, this.folder)
        const existingKeys = Object.keys(inventory.items);
        if (existingKeys.includes(this.itemName)) {
            if(this.options.source === 'ui'){
                inventory.showRenameModal(this.itemName, (newName) => {
                    if (!newName || newName.trim() === '') {
                        inventory.showNotification('Item not added - no name provided.');
                        return;
                    }
                    
                    const trimmedName = newName.trim();
                    if (existingKeys.includes(trimmedName)) {
                        this.showNotification(`An item named "${trimmedName}" also exists.`);
                        return;
                    }
                    this.itemName = trimmedName;
                    this.finalizeAddItem();
                    return true;
                });
            }
            return false;
        }
        this.finalizeAddItem();
        return true;
    }

    async undo(){
        inventory.showNotification('[ NO UNDO FOR SAVE ITEM ]');
    }

    getDescription(){
        return `Save item ${this.itemName} to ${this.folder}`;
    }

    getUndoDescription(){
        return `Remove item ${this.itemName} from ${this.folder}`;
    }

    cmd(){
        return {
            action: "save_item",
            slotId: this.slotId,
            itemName: this.itemName,
            folder: this.folder,
            options: this.options
        }
    }
}

export class RenameItemChange{
    //TODO: Implement this
}

export class DeleteItemChange{
    constructor(itemName, options){
        this.itemName = itemName;
        this.options = options || {};
    }

    async apply(){
        const storageKey = `inventory_${this.itemName}`;
        localStorage.removeItem(storageKey);
        delete inventory.items[this.itemName];
        return true;
    }

    async undo(){
        console.log("[ NO UNDO FOR DELETE ITEM ]")
    }

    getDescription(){
        return `Delete item ${this.itemName}`;
    }

    getUndoDescription(){
        return `Restore item ${this.itemName}`;
    }

    cmd(){
        return {
            action: "delete_item",
            itemName: this.itemName,
            options: this.options
        }
    }
}

export class CreateFolderChange{
    constructor(folderName, parentFolder,options){
        this.folderName = folderName;
        this.parentFolder = parentFolder || inventory.currentFolder;
        this.options = options || {};
    }

    async apply(){
        const trimmedName = this.folderName.trim();
            
        // Check if folder already exists
        if (inventory.folders[trimmedName]) {
            inventory.showNotification(`A folder named "${trimmedName}" already exists.`);
            return false;
        }
        
        // Create folder object
        const folder = {
            name: trimmedName,
            created: Date.now(),
            parent: this.parentFolder,
            itemType: "folder"
        };
        
        // Save to localStorage
        const storageKey = `inventory_folder_${trimmedName}`;
        localStorage.setItem(storageKey, JSON.stringify(folder));
        
        // Update local folders
        inventory.folders[trimmedName] = folder;
        return true;
    }

    async undo(){
        console.log("[ NO UNDO FOR CREATE FOLDER ]")
    }

    getDescription(){
        return `Create folder ${this.folderName} in ${this.parentFolder}`;
    }

    getUndoDescription(){
        return `Remove folder ${this.folderName} from ${this.parentFolder}`;
    }

    cmd(){
        return {
            action: "create_folder",
            folderName: this.folderName,
            parentFolder: this.parentFolder,
            options: this.options
        }
    }
}

export class RenameFolderChange{
    //TODO: Implement this
}

export class MoveFolderChange{
    //TODO: Implement this
}

export class RemoveFolderChange{
    constructor(folderName, options){
        this.folderName = folderName;
        this.options = options || {};
    }

    async apply(){
        Object.entries(this.items).forEach(([key, item]) => {
            if (item.folder === folderName) {
                const storageKey = `inventory_${key}`;
                localStorage.removeItem(storageKey);
                delete inventory.items[key];
            }
        });
        
        Object.entries(this.folders).forEach(([key, subfolder]) => {
            if (subfolder.parent === folderName) {
                const storageKey = `inventory_folder_${key}`;
                localStorage.removeItem(storageKey);
                delete inventory.folders[key];
            }
        });
        
        const storageKey = `inventory_folder_${folderName}`;
        localStorage.removeItem(storageKey);
        delete this.folders[folderName];
    }

    async undo(){
        console.log("[ NO UNDO FOR REMOVE FOLDER ]")
    }

    getDescription(){
        return `Remove folder ${this.folderName}`;
    }

    getUndoDescription(){
        return `Restore folder ${this.folderName}`;
    }

    cmd(){
        return {
            action: "remove_folder",
            folderName: this.folderName,
            options: this.options
        }
    }
}

export class MoveItemDirectoryChange{
    constructor(itemName, folderName, options){
        this.itemName = itemName;
        this.folderName = folderName;
        this.options = options || {};
    }

    async apply(){
        const item = inventory.items[this.itemName];
        if (!item) return false;
        
        // Don't move if it's already in the target folder
        if (item.folder === this.folderName) return false;
        
        // Update item's folder property
        item.folder = this.folderName || null;
        
        // Save to localStorage
        const storageKey = `inventory_${this.itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(item));
        return true;
    }

    async undo(){
        console.log("[ NO UNDO FOR MOVE ITEM DIRECTORY ]")
    }

    getDescription(){
        return `Move item ${this.itemName} to folder ${this.folderName}`;
    }

    getUndoDescription(){
        return `Move item ${this.itemName} to folder ${this.folderName}`;
    }

    cmd(){
        return {
            action: "move_item_directory",
            itemName: this.itemName,
            folderName: this.folderName,
            options: this.options
        }
    }
}

export class CreateScriptItemChange{
    constructor(scriptName, options){
        this.scriptName = scriptName;
        this.options = options || {};
    }

    async apply(){
        const defaultScript = `this.default = {
    "slotRef": {
        "type": "string",
        "value": ""
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})


this.onStart = ()=>{
    console.log("onStart")
}

this.onUpdate = ()=>{
    console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}`;
                
        // Create script item
        const scriptItem = {
            author: SM.scene?.localUser?.name || 'Unknown',
            name: this.scriptName,
            created: Date.now(),
            itemType: 'script',
            data: defaultScript
        };
        
        // Only add folder property if we're in a folder
        if (inventory.currentFolder) {
            scriptItem.folder = inventory.currentFolder;
        }

        // Save to localStorage
        const storageKey = `inventory_${this.scriptName}`;
        localStorage.setItem(storageKey, JSON.stringify(scriptItem));
        
        // Update local items
        inventory.items[this.scriptName] = scriptItem;
        return true;
    }
    async undo(){
        console.log("[ NO UNDO FOR SCRIPTS ]")
    }

    getDescription(){
        return `Create script ${this.scriptName}`;
    }

    getUndoDescription(){
        return `Delete script ${this.scriptName}`;
    }

    cmd(){
        return {
            action: "create_script",
            scriptName: this.scriptName,
            options: this.options
        }
    }
}


export class EditScriptItemChange{
    constructor(scriptName, scriptContent, options){
        this.scriptName = scriptName;
        this.scriptContent = scriptContent;
        this.options = options || {};
    }

    async apply(){
        // Send save event back to inventory
        const event = new CustomEvent('save-script', {
            detail: {
                name: this.scriptName,
                content: this.scriptContent
            }
        });
        window.dispatchEvent(event);
    }

    async undo(){
        console.log("[ NO UNDO FOR EDIT SCRIPT ]")
    }

    getDescription(){
        return `Edit script ${this.scriptName}`;    
    }

    getUndoDescription(){
        return `Edit script ${this.scriptName}`;
    }

    cmd(){
        return {
            action: "edit_script",
            scriptName: this.scriptName,
            scriptContent: this.scriptContent,
            options: this.options
        }
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

window.SaveSlotItem = async (slotId, itemName, folder, options)=>{
    let change = new SaveSlotItemChange(slotId, itemName, folder, options);
    return await change.apply();
}

window.DeleteItem = async (itemName, options)=>{
    let change = new DeleteItemChange(itemName, options);
    return await change.apply();
}

window.CreateFolder = async (folderName, parentFolder, options)=>{
    let change = new CreateFolderChange(folderName, parentFolder, options);
    return await change.apply();
}

window.RemoveFolder = async (folderName, options)=>{
    let change = new RemoveFolderChange(folderName, options);
    return await change.apply();
}

window.MoveItemDirectory = async (itemName, folderName, options)=>{
    let change = new MoveItemDirectoryChange(itemName, folderName, options);
    return await change.apply();
}

window.CreateScript = async (scriptName, options)=>{
    let change = new CreateScriptItemChange(scriptName, options);
    return await change.apply();
}

window.EditScript = async (scriptName, scriptContent, options)=>{
    let change = new EditScriptItemChange(scriptName, scriptContent, options);
    return await change.apply();
}