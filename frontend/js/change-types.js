// Import required dependencies


const { deepClone, parseBest, appendToConsole, showNotification } = await import(`${window.repoUrl}/utils.js`);

// options: { source: 'ui' | 'history' | 'script' | 'sync' }



export class Change {
    constructor(){
        this.id = `change_${Math.floor(Math.random() * 1000000)}`;
        this.timeout = 5000;
    }

    async apply(){
        let cmd_el = document.getElementById(this.id);
        if(cmd_el){
            cmd_el.style.textDecoration = "none";
            cmd_el.style.color = "white";
            return;
        }

        let command = this.cmd();
        let commandStr = "";
        Object.entries(command).forEach(([key, value])=>{
            if(typeof value === "object"){
                value = JSON.stringify(value);
            }
            if(key === "options"){
                return;
            }
            commandStr += value + " ";
        })
        appendToConsole("command", this.id, commandStr);
    }

    async undo(){
        let cmd_el = document.getElementById(this.id);
        if(cmd_el){
            cmd_el.style.textDecoration = "line-through";
            cmd_el.style.color = "gray";
        }
    }

    cmd(){
        return {
            action: "empty_change"
        }
    }
}


export class EntityPropertyChange extends Change{
    constructor(entityId, property, newValue, options) {
        super();
        this.timeout = 500;
        this.entityId = entityId;
        this.property = property;
        this.newValue = newValue;
        this.options = options || {};
        this.oldValue = this.options.oldValue || this.getOldValue();
    }

    getOldValue() {
        const entity = SM.getEntityById(this.entityId);
        return entity[this.property];
    }

    async apply(){
        super.apply();
        await this.change(this.newValue)
    }

    async undo(){
        await this.change(this.oldValue)
    }

    async change(value){
        const entity = SM?.getEntityById(this.entityId);
        entity.Set(this.property, value);
    }

    getDescription() {
        return `Changed entity ${this.entityId} ${this.property} to ${this.newValue}`;
    }

    getUndoDescription() {
        return `Changed entity ${this.entityId} ${this.property} to ${this.oldValue}`;
    }

    cmd(){
        return {
            action: "set_entity_property",
            entityId: this.entityId,
            property: this.property,
            newValue: this.newValue,
            options: this.options
        }
    }
}

export class ComponentPropertyChange extends Change{
    constructor(componentId, property, newValue, options) {
        super();
        this.timeout = 500;
        this.componentId = componentId;
        this.property = property;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.component = SM.getEntityComponentById(componentId);
        this.oldValue = deepClone(this.options.oldValue || this.getOldValue());
    }

    getOldValue() {        
        return deepClone(this.component.properties?.[this.property]);
    }

    async apply() {
        super.apply();
        await this.change(this.newValue);
    }

    async undo() {
        super.undo();
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

export class SpacePropertyChange extends Change{
    constructor(property, newValue, protect, options) {
        super();
        this.timeout = 500;
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
        super.apply();
        await this.change(this.newValue);
    }

    async undo() {
        super.undo();
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

export class ComponentAddChange extends Change{
    constructor(entityId, componentType, options) {
        super();
        this.timeout = 3000;
        this.entityId = entityId;
        this.componentType = componentType;
        this.options = options || {};
        this.componentProperties = this.options.componentProperties || {};
    }

    async apply() {
        super.apply();
        if(!this.componentProperties.id){
            this.componentProperties.id = `${this.componentType}_${Math.floor(Math.random() * 10000)}`;
        }
        let event = {
            entityId: this.entityId,
            componentType: this.componentType,
            componentProperties: this.componentProperties
        }
        let event_str = JSON.stringify(event);
        let data = `component_added¶${event_str}`
        networking.sendOneShot(data);

        const returnWhenComponentLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const component = SM.getEntityComponentById(this.componentProperties.id);
                if (component !== undefined && component.initialized) {
                  resolve(component);
                } else {
                  setTimeout(check, 50);
                }
              };
              check();
            });
          };
        return await returnWhenComponentLoaded();
    }

    async undo() {
        super.undo();
        if (!this.componentProperties.id) return;
        let data = `component_removed¶${this.componentProperties.id}`
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
            entityId: this.entityId,
            componentType: this.componentType,
            componentProperties: this.componentProperties,
            options: this.options
        }
    }
}

export class ComponentReorderChange extends Change{
    constructor(entityId, fromIndex, toIndex, options) {
        super();
        this.timeout = 1000;
        this.entityId = entityId;
        this.fromIndex = fromIndex;
        this.toIndex = toIndex;
        this.options = options || {};
    }

    async apply() {
        super.apply();
        const entity = SM.getEntityById(this.entityId);
        if (!entity || !entity.components) return;
        
        // Don't allow moving Transform component (index 0)
        if (this.fromIndex === 0 || this.toIndex === 0) {
            console.warn('Cannot reorder Transform component');
            return;
        }
        
        const components = entity.components;
        if (this.fromIndex < 0 || this.fromIndex >= components.length ||
            this.toIndex < 0 || this.toIndex >= components.length) {
            console.error('Invalid component indices for reorder');
            return;
        }
        
        // Send the reorder command
        let event = {
            entityId: this.entityId,
            fromIndex: this.fromIndex,
            toIndex: this.toIndex
        };
        let event_str = JSON.stringify(event);
        let data = `component_reordered¶${event_str}`;
        networking.sendOneShot(data);
    }

    async undo() {
        super.undo();
        // Reverse the reorder
        let event = {
            entityId: this.entityId,
            fromIndex: this.toIndex,
            toIndex: this.fromIndex
        };
        let event_str = JSON.stringify(event);
        let data = `component_reordered¶${event_str}`;
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Reorder component from position ${this.fromIndex} to ${this.toIndex}`;
    }

    getUndoDescription() {
        return `Reorder component from position ${this.toIndex} to ${this.fromIndex}`;
    }

    cmd() {
        return {
            action: "reorder_component",
            entityId: this.entityId,
            fromIndex: this.fromIndex,
            toIndex: this.toIndex,
            options: this.options
        };
    }
}

export class ComponentRemoveChange extends Change{
    constructor(componentId, options) {
        super();
        this.timeout = 3000;
        this.componentId = componentId;
        this.componentData = this.captureComponentData();
        this.entityId = null;
        this.componentIndex = null;
        this.options = options || {};
    }

    captureComponentData() {
        // Find the component and its entity
        let component = SM.getEntityComponentById(this.componentId);
        if(!component){
            console.error(`Component ${this.componentId} not found`);
            return null;
        }
        return {
            entityId: component._entity.id,
            id: component.id,
            type: component.type,
            properties: JSON.parse(JSON.stringify(component.properties || {}))
        }
    }

    async apply() {
        super.apply();
        if (!this.componentData) {
            console.error('No component data to remove');
            return;
        }

        let data = `component_removed¶${this.componentId}`
        networking.sendOneShot(data);
    }

    async undo() {
        super.undo();
        if (!this.componentData) return;
        this.componentData.properties.id = this.componentData.id;
        let event = {
            entityId: this.componentData.entityId,
            componentType: this.componentData.type,
            componentProperties: this.componentData.properties
        }
        let event_str = JSON.stringify(event);
        let data = `component_added¶${event_str}`
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

export class EntityAddChange extends Change{
    constructor(parentId, entityName, options) {
        super();
        this.timeout = 1000;
        this.parentId = parentId;
        this.entityName = entityName || `NewEntity_${Math.floor(Math.random() * 100000)}`;
        this.newEntityId = null; // Will be set after creation
        this.options = options || {};
    }

    async apply() {
        super.apply();
        let data = `entity_added¶${this.parentId}¶${this.entityName}`
        networking.sendOneShot(data);

        let expectedEntityId = `${this.parentId}/${this.entityName}`

        const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const entity = SM.getEntityById(expectedEntityId, false);
                if (entity !== undefined && entity.initialized) {
                  resolve(entity);
                } else {
                  setTimeout(check, 50);
                }
              };
              check();
            });
          };
        return await returnWhenEntityLoaded();
    }

    async undo() {
        super.undo();
        if (!this.newEntityId) return;
        let entity_id = `${this.parentId}/${this.entityName}`
        let data = `entity_removed¶${entity_id}`
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Added new entity${this.parentId ? ' as child' : ' at root'}`;
    }

    getUndoDescription(){
        return `Remove entity ${this.entityName}`;
    }

    cmd(){
        return {
            action: "add_entity",
            parentId: this.parentId,
            entityName: this.entityName,
            options: this.options
        }
    }
}

export class EntityRemoveChange extends Change{
    constructor(entityId, options) {
        super();
        this.timeout = 5000;
        this.entity = SM.getEntityById(entityId);
        if(!this.entity){
            err("command", "Entity not found =>", entityId)
            return;
        }
        this.entityExport = this.entity.export();
        this.siblingIndex = null;
        this.options = options || {};
    }

    captureEntityState() {
        if (!this.entity) return null;

        let parentId = this.entity.parentId;

        // Find sibling index
        if (parentId) {
            const parent = SM.getEntityById(parentId);
            if (parent?.children) {
                this.siblingIndex = parent.children.findIndex(child => child.id === this.entity.id);
            }
        } else {
            // Scene level entity
            this.siblingIndex = SM.entityData.entities.findIndex(s => s.id === this.entity.id);
        }

        return this.entity.export();
    }


    async apply() {
        super.apply();
        let data = `entity_removed¶${this.entity.id}`
        networking.sendOneShot(data);
    }

    async undo() {
        super.undo();
        if (!this.entityExport) return;

        // Recreate the entity hierarchy
        let data = `load_entity¶${this.entity.parentId}¶${JSON.stringify(this.entityExport)}`
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Remove entity ${this.entityData?.name || ''}`;
    }

    getUndoDescription(){
        return `Add entity ${this.entityData?.name || ''}`;
    }

    cmd(){
        return {
            action: "remove_entity",
            entityId: this.entity.id,
            options: this.options
        }
    }
}

export class EntityMoveChange extends Change{
    constructor(entityId, newParentId, options) {
        super();
        this.timeout = 500;
        this.entityId = entityId;
        this.newParentId = newParentId;
        const entity = SM.getEntityById(entityId);
        this.oldParentId = entity?.parentId || null;
        this.oldSiblingIndex = this.getSiblingIndex(entityId, this.oldParentId);
        this.options = options || {};
    }

    getSiblingIndex(entityId, parentId) {
        if (parentId) {
            const parent = SM.getEntityById(parentId);
            return parent?.children?.findIndex(child => child.id === entityId) ?? -1;
        } else {
            return SM.entityData.entities.findIndex(s => s.id === entityId);
        }
    }

    async apply() {
        super.apply();
        const entity = SM.getEntityById(this.entityId);
        const parent = SM.getEntityById(this.newParentId);
        if (!entity || !parent) return;
        await entity.SetParent(this.newParentId);
    }

    async undo() {
        super.undo();
        const entity = SM.getEntityById(this.entityId);
        if (!entity) return;
        await entity.SetParent(this.oldParentId);
    }

    getDescription() {
        return `Move entity`;
    }

    getUndoDescription(){
        return `Move entity`;
    }

    cmd(){
        return {
            action: "move_entity",
            entityId: this.entityId,
            newParentId: this.newParentId,
            options: this.options
        }
    }
}

export class MonoBehaviorVarChange extends Change{
    constructor(componentId, varName, newValue, options) {
        super();
        this.timeout = 500;
        this.componentId = componentId;
        this.varName = varName;
        this.newValue = deepClone(newValue);
        this.options = options || {};
        this.monobehavior = SM.getEntityComponentById(componentId);
        this.oldValue = deepClone(options.oldValue || this.getOldValue());
    }

    getOldValue() {
        if (!this.monobehavior || !this.monobehavior.ctx?.vars) return undefined;
        return deepClone(this.monobehavior.ctx.vars[this.varName]);
    }

    async apply() {
        super.apply();
        await this.change(this.newValue);
    }

    async undo() {
        super.undo();
        await this.change(this.oldValue);
    }

    async change(value) {
        log("monobehavior", "changing var =>", this.monobehavior, this.varName, value)
        if (!this.monobehavior) return;

        // Update the properties.vars for persistence
        if (!this.monobehavior.ctx.vars) {
            return;
        }

        await this.monobehavior.updateVar(this.varName, value);

        // Refresh UI if needed
        if (inspector?.propertiesPanel) {
            inspector.propertiesPanel.render(SM.selectedEntity);
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


export class LoadItemChange extends Change{
    constructor(itemName, parentId, itemData, options) {
        super();
        this.timeout = 10000;
        this.itemName = itemName;
        this.parentId = parentId || 'Scene';
        this.options = options || {};
        this.entityId = null;
        this.itemData = itemData;
    }

    async apply() {
        super.apply();
        if(!this.itemData){
            const item = inventory.items[this.itemName];
            if(!item){
                err("inventory", "No item found =>", this.itemName)
                return null;
            }
            if(item.itemType !== "entity"){
                err("inventory", "Item is not a entity =>", this.itemName)
                return null;
            }
    
            let changeChildrenIds = (entity)=>{
                entity.components.forEach(component=>{
                    component.id = `${component.type}_${Math.floor(Math.random()*99999)}`;
                })
                if(entity.children){
                    entity.children.forEach(child=>{
                        child.parentId = entity.id;
                        child.id = entity.id+"/"+child.name;
                        changeChildrenIds(child);
                    })
                }
            }
    
            let itemData = item.data;
            itemData.name = this.itemName+"_"+Math.floor(Math.random() * 100000);
            itemData.parentId = this.parentId;
            itemData.id = this.parentId+"/"+itemData.name;
            changeChildrenIds(itemData);
    
            log("inventory", "[ITEM DATA] =>", itemData)
            this.itemData = itemData;    
        }
       
        let data = `load_entity¶${this.parentId}¶${JSON.stringify(this.itemData)}`
        networking.sendOneShot(data);

        //Additionally send all of the entity properties to space props
        if(!this.options.ephemeral){

            let getEntitySpaceProperties = (entity)=>{
                let props = {}
                let getSubEntityProps = (entity)=>{
                    props[`__${entity.id}/active:entity`] = entity.active
                    props[`__${entity.id}/persistent:entity`] = entity.persistent
                    props[`__${entity.id}/name:entity`] = entity.name
                    props[`__${entity.id}/layer:entity`] = entity.layer
                    if(entity.components){
                        entity.components.forEach(component=>{
                            if(component.properties){   
                                Object.keys(component.properties).forEach(prop=>{
                                    props[`__${component.id}/${prop}:component`] = component.properties[prop]
                                })
                            }
                        })
                    }
                    

                    if(entity.children){
                        entity.children.forEach(child=>{
                            getSubEntityProps(child)
                        })
                    }
                    
                }
    
                getSubEntityProps(entity)
                return props
            }


            let itemProps = getEntitySpaceProperties(this.itemData);
            Object.keys(itemProps).forEach(key=>{
                SM.props[key] = itemProps[key]
            })
        }

        this.entityId = `${this.parentId}/${this.itemData.name}`
        let checks = 0;
        const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const entity = SM.getEntityById(this.entityId, false);
                checks++;
                
                if(checks > 100){
                    err("loadItem", "Entity could not be loaded/found =>", this.entityId)
                    resolve(null);
                    return;
                }

                if (entity !== undefined && entity.finished_loading) {  
                    resolve(entity);
                } else {
                    setTimeout(check, 50);
                }
              };
              check();
            });
          };
        return await returnWhenEntityLoaded();
    }

    async undo() {
        super.undo();
        if(!this.entityId) return;
        let data = `entity_removed¶${this.entityId}`
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
            itemData: this.itemData,
            options: this.options
        }
    }
}

export class CloneEntityChange extends Change{
    constructor(entityId, options) {
        super();
        this.timeout = 10000;
        this.sourceEntity = SM.getEntityById(entityId);
        if(!this.sourceEntity){
            console.error(`Source entity ${entityId} not found`);
            return;
        }
        this.entityData = this.sourceEntity.export();
        this.entityId = `${this.sourceEntity.parentId}/${this.sourceEntity.name}_${Math.floor(Math.random() * 100000)}`;
        this.options = options || {};
    }

    async apply() {
        super.apply();

        let changeChildrenIds = (entity)=>{
            entity.components.forEach(component=>{
                component.id = `${component.type}_${Math.floor(Math.random()*99999)}`;
            })
            entity.children.forEach(child=>{
                child.parentId = entity.id;
                child.id = entity.id+"/"+child.name;
                changeChildrenIds(child);
            })
        }

        let itemData = this.entityData;
        itemData.name = this.sourceEntity.name+"_"+Math.floor(Math.random() * 100000);
        itemData.parentId = this.sourceEntity.parentId;
        itemData.id = this.sourceEntity.parentId+"/"+itemData.name;
        changeChildrenIds(itemData);

        let data = `load_entity¶${this.sourceEntity.parentId}¶${JSON.stringify(itemData)}`
        networking.sendOneShot(data);

        //Additionally send all of the entity properties to space props
        if(!this.options.ephemeral){

            let getEntitySpaceProperties = (entity)=>{
                let props = {}
                let getSubEntityProps = (entity)=>{
                    props[`__${entity.id}/active:entity`] = entity.active
                    props[`__${entity.id}/persistent:entity`] = entity.persistent
                    props[`__${entity.id}/name:entity`] = entity.name
                    props[`__${entity.id}/layer:entity`] = entity.layer
                    
                    entity.components.forEach(component=>{
                        Object.keys(component.properties).forEach(prop=>{
                            props[`__${component.id}/${prop}:component`] = component.properties[prop]
                        })
                    })
    
                    entity.children.forEach(child=>{
                        getSubEntityProps(child)
                    })
                }
    
                getSubEntityProps(entity)
                return props
            }


            let itemProps = getEntitySpaceProperties(itemData);
            Object.keys(itemProps).forEach(key=>{
                SM.props[key] = itemProps[key]
            })
        }


        this.entityId = `${this.sourceEntity.parentId}/${itemData.name}`
        const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const entity = SM.getEntityById(this.entityId, false);
                if (entity !== undefined && entity.finished_loading) {
                  resolve(entity);
                } else {
                  setTimeout(check, 50);
                }
              };
              check();
            });
          };
        return await returnWhenEntityLoaded();
    }

    async undo() {
        super.undo();
        if(!this.entityId) return;
        let data = `entity_removed¶${this.entityId}`
        networking.sendOneShot(data);
    }

    getDescription() {
        return `Clone entity ${this.sourceEntity.name}`;
    }

    getUndoDescription() {
        return `Remove entity ${this.sourceEntity.name}`;
    }

    cmd(){
        return {
            action: "clone_entity",
            entityId: this.entityId,
            options: this.options
        }
    }
}

export class SaveEntityItemChange extends Change{
    constructor(entityId, itemName, folder, options){
        super();
        this.timeout = 10000;
        this.entityId = entityId;
        if(this.entityId.length === 0){
            showNotification('No entity selected');
            return;
        }
        this.entity = SM.getEntityById(entityId);
        this.itemName = itemName || this.entity.name;
        this.folder = folder || inventory.currentFolder;
        this.options = options || {};
        this.itemName = this.itemName.trim();
    }


    async finalizeAddItem(){
        let data = this.entity.export();
        const now = Date.now();
        const inventoryItem = {
            author: SM.scene?.localUser?.name || 'Unknown',
            name: this.itemName,
            created: now,
            last_used: now,
            itemType: "entity",
            icon:"📦",
            description: '',  // Initialize with empty description
            data: data,
            folder: this.folder,
            history: changeManager.gatherHistory(this.entity)
        };
        const storageKey = `inventory_${this.itemName}`;
        localStorage.setItem(storageKey, JSON.stringify(inventoryItem));
        
        // Sync to Firebase if in remote location
        await inventory.firebase.syncToFirebase(inventoryItem);
        let folderName = this.folder? this.folder : "/";
        showNotification(`Item "${this.itemName}" saved to ${folderName}`);
        inventory.reload();
    }
    
    

    async apply(){
        if(this.entityId.length === 0){return;}

        super.apply();
        const existingKeys = Object.keys(inventory.items);
        if (!this.itemName || this.itemName.trim() === ''){
            showNotification('Item not added - no name provided.');
            return;
        }
        if(this.options.source === 'ui'){
            if (existingKeys.includes(this.itemName)) {
                inventory.ui.showWarningConfirm(
                    "Overwrite Existing Item",
                    `WARNING: An item named "${this.itemName}" already exists.<br><br>` +
                    `<strong style="color: #ff6b6b;">Clicking "Confirm" will DELETE the existing saved entity "${this.itemName}" and replace it with the new one.</strong><br><br>` +
                    `This action cannot be undone. Are you sure you want to overwrite it?`,
                    async () => {
                        // User confirmed overwrite - delete existing and save new
                        const deleteChange = new DeleteItemChange(this.itemName, {source: 'ui'});
                        await deleteChange.apply();
                        showNotification(`Overwriting existing item "${this.itemName}"`);
                        let change = new SaveEntityItemChange(this.entityId, this.itemName, this.folder, this.options);
                        change.apply();
                        return;
                    },
                    ()=>{
                        showNotification(`canceled save"`);
                    }
                );
            }else{
                this.finalizeAddItem().then(() => {});
            }
            return true;
        }
        await this.finalizeAddItem();
        return true;
    }

    async undo(){
        super.undo();
        showNotification('[ NO UNDO FOR SAVE ITEM ]');
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
            entityId: this.entityId,
            itemName: this.itemName,
            folder: this.folder,
            options: this.options
        }
    }
}

export class RenameItemChange extends Change{
    //TODO: Implement this
    constructor(itemName, newName, options){
        super();
        this.timeout = 1000;
        this.itemName = itemName;
        this.newName = newName;
        this.options = options || {};
    }

    async finalizeRename(){

        let item = inventory.items[this.itemName];
        if(!item) return false;

        if (item.itemType === 'script' && !this.newName.endsWith('.js')) {
            this.newName = this.newName + '.js';
        }

        //DELETE OLD ITEM
        const oldKey = `inventory_${this.itemName}`;
        localStorage.removeItem(oldKey);
        delete inventory.items[this.itemName];
        let folder = item.folder;
        if(folder && folder.remote){
            let sAuth = inventory.firebase.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            let sFolder = inventory.firebase.sanitizeFirebasePath(folder);
            let sItem = inventory.firebase.sanitizeFirebasePath(this.itemName);
            let firebasePath = `inventory/${sAuth}/${sFolder}/${sItem}`;
            await networking.deleteData(firebasePath);
        }
        
        //ADD ITEM
        item.name = this.newName;
        item.last_used = Date.now();
        item.folder = inventory.currentFolder;
        
        const newKey = `inventory_${this.newName}`;
        localStorage.setItem(newKey, JSON.stringify(item));
        inventory.items[this.newName] = item;
        
        // Sync to Firebase if in remote location
        await inventory.firebase.syncToFirebase(item);
        showNotification(`Item "${this.itemName}" renamed to "${this.newName}"`);
        inventory.reload();
        inventory.selectItem(this.newName);



        // If this is a script, update any open script editor tabs
        if (item.itemType === 'script' && window.inspector && window.inspector.scriptEditors) {
            // Find and update the script editor with the old name
            for (const [key, editor] of window.inspector.scriptEditors) {
                if (editor.currentScript.name === this.itemName) {
                    // Update the script editor's internal reference
                    editor.currentScript.name = this.newName;
                    editor.currentScript.data = item.data;
                    
                    // Update the navigation tab text
                    if (editor.navElement) {
                        // Store the old close button handler before updating innerHTML
                        const oldCloseBtn = editor.navElement.querySelector('.close-tab-btn');
                        
                        editor.navElement.innerHTML = `
                            <span class="nav-icon">📜</span>
                            ${this.newName}
                            <span class="close-tab-btn" data-close-script="${editor.pageId}">×</span>
                        `;
                        
                        // Re-attach close button handler
                        const newCloseBtn = editor.navElement.querySelector('.close-tab-btn');
                        if (newCloseBtn && editor.closeBtnHandler) {
                            newCloseBtn.addEventListener('mousedown', editor.closeBtnHandler);
                        }
                    }
                    
                    // Update the editor page title
                    const editorTitle = document.querySelector(`#${editor.pageId}-page .editor-title h2`);
                    if (editorTitle) {
                        editorTitle.textContent = `Editing: ${this.newName}`;
                    }
                    
                    // Update the scriptEditors map key
                    window.inspector.scriptEditors.delete(key);
                    window.inspector.scriptEditors.set(this.newName, editor);
                    
                    // Update localStorage for opened editors
                    localStorage.setItem(`openedEditors`, Array.from(window.inspector.scriptEditors.keys()).join(","));
                    
                    break;
                }
            }
        }
        return true;
    }

    async apply(){
        super.apply();
        if(this.newName === this.itemName) return true;
        if(inventory.items[this.newName]) return false;
        if(this.options.source === 'ui'){
            inventory.ui.showWarningConfirm(
                "Renaming is Dangerous",
                `WARNING: Renaming an item can break existing references in scripts or other entities that depend on this name.<br><br>` +
                `This action cannot be undone. Are you sure you want to continue?`,
                async () => {
                    const existingKeys = Object.keys(inventory.items);
                    if(existingKeys.includes(this.newName)){
                        inventory.ui.showWarningConfirm(
                            "Overwrite Existing Item",
                            `WARNING: An item named "${this.newName}" already exists.<br><br>` +
                            `<strong style="color: #ff6b6b;">Clicking "Confirm" will DELETE the existing saved entity "${this.newName}" and replace it with the new one.</strong><br><br>` +
                            `This action cannot be undone. Are you sure you want to overwrite it?`,
                            async () => {
                                this.finalizeRename();
                            },
                            ()=>{
                                showNotification(`canceled rename"`);
                            }
                        );
                    }else{
                        this.finalizeRename();
                    }
                    return;
                },
                ()=>{
                    showNotification(`canceled rename"`);
                }
            );
        
        }else{
            this.finalizeRename();
        }
       
        return true;
    }

    async undo(){
        super.undo();
        log("command", "[ NO UNDO FOR RENAME ITEM ]")
    }

    getDescription(){
        return `Rename item ${this.itemName} to ${this.newName}`;
    }

    getUndoDescription(){
        return `Rename item ${this.newName} to ${this.itemName}`;
    }
    
    cmd(){
        return {
            action: "rename_item",
            itemName: this.itemName,
            newName: this.newName,
            options: this.options
        }
    }
}

export class DeleteItemChange extends Change{
    constructor(itemName, options){
        super();
        this.timeout = 1000;
        this.itemName = itemName;
        this.options = options || {};
        // Store item data for Firebase sync
        this.itemData = inventory.items[this.itemName];
    }

    async apply(){
        super.apply();
        const storageKey = `inventory_${this.itemName}`;
        localStorage.removeItem(storageKey);
        delete inventory.items[this.itemName];
        
        // Sync deletion to Firebase if in remote location
        await this.syncDeleteToFirebase();
        
        return true;
    }
    
    async syncDeleteToFirebase() {
        if (!this.itemData) return;
        
        // Check if item was in a remote folder or root is remote
        const isRemote = this.isItemInRemoteLocation();
        if (!isRemote) return;

        if (!window.networking) {
            console.warn('Networking not initialized, skipping sync');
            return;
        }

        try {
            const userName = inventory.firebase.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            
            // Build the Firebase path
            let firebasePath = `inventory/${userName}`;
            if (this.itemData.folder) {
                const sanitizedFolder = inventory.firebase.sanitizeFirebasePath(this.itemData.folder);
                firebasePath += `/${sanitizedFolder}`;
            }
            const sanitizedItemName = inventory.firebase.sanitizeFirebasePath(this.itemName);
            firebasePath += `/${sanitizedItemName}`;
            
            // Delete from Firebase
            await networking.deleteData(firebasePath);
            log('inventory', 'Item deleted from Firebase:', firebasePath);
        } catch (error) {
            err('inventory', 'Failed to delete item from Firebase:', error);
        }
    }

    isItemInRemoteLocation() {
        if (!this.itemData) return false;
        
        if (this.itemData.folder) {
            // Check if folder is marked as remote
            const folderData = inventory.folders[this.itemData.folder];
            return folderData && folderData.remote === true;
        } else {
            // Check if root is marked as remote
            const userName = inventory.firebase.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            const rootRemoteKey = `inventory_root_remote_${userName}`;
            return localStorage.getItem(rootRemoteKey) === 'true';
        }
    }

    async undo(){
        super.undo();
        log("command", "[ NO UNDO FOR DELETE ITEM ]")
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

export class CreateFolderChange extends Change{
    constructor(folderName, parentFolderName, options){
        super();
        this.timeout = 500;
        this.folderName = folderName;
        this.parentFolderName = parentFolderName || inventory.currentFolder;
        this.options = options || {};
    }

    async apply(){
        super.apply();
        const trimmedName = this.folderName.trim();
            
        // Check if folder already exists
        if (inventory.folders[trimmedName]) {
            showNotification(`A folder named "${trimmedName}" already exists.`);
            return false;
        }
        
        let parentFolder = inventory.folders[this.parentFolderName];
        let parentPath = "";
        if(parentFolder && parentFolder.path){
            parentPath = parentFolder.path+"/";
        }
        // Create folder object
        const now = Date.now();
        let path = `${parentPath}${trimmedName}`
        const folder = {
            name: trimmedName,
            created: now,
            last_used: now,
            parent: this.parentFolderName,
            path: path,
            itemType: "folder",
            icon:"📂",
            remote: false,
            public: false
        };
        
        // Save to localStorage
        const storageKey = `inventory_folder_${path}`;
        localStorage.setItem(storageKey, JSON.stringify(folder));
        
        // Update local folders
        inventory.folders[path] = folder;
        return true;
    }

    async undo(){
        super.undo();   
        log("command", "[ NO UNDO FOR CREATE FOLDER ]")
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

export class RenameFolderChange extends Change{
    constructor(originalName, newName, options){
        super();
        this.timeout = 500;
        this.originalName = originalName;
        this.newName = newName;
        this.options = options || {};
    }

    async apply(){
        super.apply();
        inventory._renameFolder(this.originalName, this.newName);
    }

    async undo(){
        super.undo();
        inventory._renameFolder(this.newName, this.originalName);
    }

    getDescription(){
        return `Rename folder ${this.originalName} to ${this.newName}`;
    }

    getUndoDescription(){
        return `Rename folder ${this.newName} to ${this.originalName}`;
    }

    cmd(){
        return {
            action: "rename_folder",
            originalName: this.originalName,
            newName: this.newName,
            options: this.options
        }
    }
}

export class MoveFolderChange extends Change{
    //TODO: Implement this
}

export class RemoveFolderChange extends Change{
    constructor(folderPath, options){
        super();
        this.timeout = 500;
        this.folderPath = folderPath;
        this.options = options || {};
    }

    async apply(){
        super.apply();
        Object.entries(inventory.items).forEach(([key, item]) => {
            if (item.folder === this.folderPath) {
                const storageKey = `inventory_${key}`;
                localStorage.removeItem(storageKey);
                delete inventory.items[key];
            }
        });
        
        Object.entries(inventory.folders).forEach(([key, subfolder]) => {
            if (subfolder.parent === this.folderPath) {
                const storageKey = `inventory_folder_${key}`;
                localStorage.removeItem(storageKey);
                let delChange = new RemoveFolderChange(key, this.options);
                delChange.apply();
            }
        });
        
        const storageKey = `inventory_folder_${this.folderPath}`;
        localStorage.removeItem(storageKey);
        delete inventory.folders[this.folderPath];
    }

    async undo(){
        super.undo();
        log("command", "[ NO UNDO FOR REMOVE FOLDER ]")
    }

    getDescription(){
        return `Remove folder ${this.folderPath}`;
    }

    getUndoDescription(){
        return `Restore folder ${this.folderPath}`;
    }

    cmd(){
        return {
            action: "remove_folder",
            folderPath: this.folderPath,
            options: this.options
        }
    }
}

export class MoveItemDirectoryChange extends Change{
    constructor(itemName, folderName, options){
        super();
        this.timeout = 500;
        this.itemName = itemName;
        this.folderName = folderName;
        this.options = options || {};
    }

    async apply(){
        super.apply();
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
        super.undo();
        log("command", "[ NO UNDO FOR MOVE ITEM DIRECTORY ]")
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

export class CreateScriptItemChange extends Change{
    constructor(scriptName, options){
        super();
        this.timeout = 500;
        this.scriptName = scriptName;
        this.options = options || {};
        this.fileType = options.fileType || 'script'; // 'script' or 'markdown'
    }

    async apply(){
        super.apply();
        
        let defaultContent, itemType, icon;
        
        if (this.fileType === 'markdown') {
            defaultContent = `# ${this.scriptName.replace('.md', '')}

## Description
Enter your documentation here...

## Usage
Describe how to use this...

## Notes
Additional notes...`;
            itemType = 'markdown';
            icon = '📝';
        } else {
            defaultContent = `this.default = {}

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
            itemType = 'script';
            icon = '📜';
        }
                
        // Create item
        const now = Date.now();
        const item = {
            author: SM.scene?.localUser?.name || 'Unknown',
            name: this.scriptName,
            created: now,
            last_used: now,
            itemType: itemType,
            icon: icon,
            description: '',  // Initialize with empty description
            data: defaultContent,
            startup: false,  // Script runs on scene startup (only for scripts)
            active: false    // Script is active even without being attached to GameObject (only for scripts)
        };
        
        // Only add folder property if we're in a folder
        if (inventory.currentFolder) {
            item.folder = inventory.currentFolder;
        }

        // Save to localStorage
        const storageKey = `inventory_${this.scriptName}`;
        localStorage.setItem(storageKey, JSON.stringify(item));
        
        // Update local items
        inventory.items[this.scriptName] = item;
        return true;
    }
    async undo(){
        super.undo();
        log("command", "[ NO UNDO FOR SCRIPTS ]")
    }

    getDescription(){
        return `Create ${this.fileType} ${this.scriptName}`;
    }

    getUndoDescription(){
        return `Delete ${this.fileType} ${this.scriptName}`;
    }

    cmd(){
        return {
            action: "create_script",
            scriptName: this.scriptName,
            options: this.options
        }
    }
}


export class EditScriptItemChange extends Change{
    constructor(scriptName, scriptContent, options){
        super();
        this.timeout = 1000;
        this.scriptName = scriptName;
        this.scriptContent = scriptContent;
        this.options = options || {};
    }

    async apply(){
        super.apply();
        // Send save event back to inventory
        if (inventory) {
            const item = inventory.items[this.scriptName];
            if (item && (item.itemType === 'script' || item.itemType === 'markdown')) {
                item.data = this.scriptContent;
                item.last_used = Date.now();
                const storageKey = `inventory_${this.scriptName}`;
                localStorage.setItem(storageKey, JSON.stringify(item));
                // Refresh preview if selected
                if (inventory.selectedItem === this.scriptName) {
                    inventory.ui.showPreview(this.scriptName);
                }
                showNotification(`Saved changes to "${this.scriptName}"`);
                if(item.folder){
                    let folder = inventory.folders[item.folder];
                    if(folder){
                        folder.last_used = Date.now();
                        const storageKey = `inventory_folder_${folder.name}`;
                        localStorage.setItem(storageKey, JSON.stringify(folder));
                        let my_name = inventory.firebase.sanitizeFirebasePath(scene.localUser.name);
                        let script_name = inventory.firebase.sanitizeFirebasePath(this.scriptName);
                        if(folder.remote){
                            let ref = (folder.importedFrom)?`${folder.importedFrom}/${script_name}`:`inventory/${my_name}/${folder.path}/${script_name}`;
                            ref = ref;
                            log("inventory", "SAVING TO: ", ref)
                            networking.setData(ref, item);
                        }
                    }
                }
            }
        }


    }

    async undo(){
        super.undo();   
        log("command", "[ NO UNDO FOR EDIT SCRIPT ]")
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


let getHelpText = ()=>{
return `
<span style="color: #00ff00; font-weight: bold;">Available Commands:</span>

<span style="color: #ffaa00; font-weight: bold;">Entity Commands:</span>
  <span style="color: #88ddff;">add_entity</span> <span style="color: #ff88ff;">$parentId $entityName</span>         - Add a new entity as child of parent
  <span style="color: #88ddff;">remove_entity</span> <span style="color: #ff88ff;">$entityId</span>                   - Remove an entity and its children
  <span style="color: #88ddff;">move_entity</span> <span style="color: #ff88ff;">$entityId $newParentId</span>       - Move entity to new parent
  <span style="color: #88ddff;">set_entity_property</span> <span style="color: #ff88ff;">$entityId $prop $val</span>- Set entity property value
  <span style="color: #88ddff;">clone_entity</span> <span style="color: #ff88ff;">$entityId</span>                    - Clone an entity and its children

<span style="color: #ffaa00; font-weight: bold;">Component Commands:</span>
  <span style="color: #88ddff;">add_component</span> <span style="color: #ff88ff;">$entityId $componentType</span>   - Add component to entity
  <span style="color: #88ddff;">remove_component</span> <span style="color: #ff88ff;">$componentId</span>              - Remove component from entity
  <span style="color: #88ddff;">set_component_property</span> <span style="color: #ff88ff;">$compId $prop $val</span>- Set component property value

<span style="color: #ffaa00; font-weight: bold;">Space Commands:</span>
  <span style="color: #88ddff;">set_space_property</span> <span style="color: #ff88ff;">$prop $val $protect</span>  - Set space property (protect: true/false)

<span style="color: #ffaa00; font-weight: bold;">MonoBehavior Commands:</span>
  <span style="color: #88ddff;">set_mono_behavior_var</span> <span style="color: #ff88ff;">$compId $var $val</span> - Set MonoBehavior variable value

<span style="color: #ffaa00; font-weight: bold;">Inventory Commands:</span>
  <span style="color: #88ddff;">load_item</span> <span style="color: #ff88ff;">$itemName $parentId</span>            - Load item from inventory
  <span style="color: #88ddff;">save_item</span> <span style="color: #ff88ff;">$entityId $itemName $desc</span>     - Save entity as inventory item
  <span style="color: #88ddff;">delete_item</span> <span style="color: #ff88ff;">$itemName</span>                     - Delete item from inventory
  <span style="color: #88ddff;">create_folder</span> <span style="color: #ff88ff;">$folderName $color</span>         - Create inventory folder
  <span style="color: #88ddff;">remove_folder</span> <span style="color: #ff88ff;">$folderName</span>                 - Remove inventory folder
  <span style="color: #88ddff;">move_item_directory</span> <span style="color: #ff88ff;">$itemName $folder</span>    - Move item to folder
  <span style="color: #88ddff;">create_script_item</span> <span style="color: #ff88ff;">$scriptName</span>            - Create new script item

<span style="color: #00ff00; font-weight: bold;">Usage Examples:</span>
  <span style="color: #88ddff;">add_entity</span> <span style="color: #ffff88;">Scene MyEntity</span>                   - Add entity to root
  <span style="color: #88ddff;">add_component</span> <span style="color: #ffff88;">e_123 Cube</span>                   - Add Cube component to entity
  <span style="color: #88ddff;">set_entity_property</span> <span style="color: #ffff88;">e_123 name "New Name"</span>  - Rename entity
  <span style="color: #88ddff;">load_item</span> <span style="color: #ffff88;">MyPrefab e_456</span>                   - Load prefab as child of e_456

<span style="color: #00ff00; font-weight: bold;">Notes:</span>
  <span style="color: #aaaaaa;">- Use 'Scene' for root/no parent
  - Entity IDs format: e_XXX
  - Component IDs format: c_XXX
  - Values are auto-parsed (strings, numbers, booleans, vectors, colors)
  - Vectors: [1,2,3] or {x:1,y:2,z:3}
  - Colors: #FF0000 or {r:1,g:0,b:0}</span>`
}

window.RunCommand = async (execString, options)=>{

    let args = execString.split(" ").map(arg=>parseBest(arg));
    let change = null;
    options = options || {};
    switch(args[0]){
        case "help":
            // Create a colored help text div
            const helpDiv = document.createElement('div');
            helpDiv.style.fontFamily = 'monospace';
            helpDiv.style.whiteSpace = 'pre-wrap';
            helpDiv.innerHTML = getHelpText();
            
            // Append the colored help directly
            const consoleEl = document.getElementById("lifecycleConsole");
            if(consoleEl) {
                const children = consoleEl.children;
                if (children.length >= 500) {
                    consoleEl.removeChild(children[0]);
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'change-item';
                wrapper.id = "help_"+Math.floor(Math.random()*1000000);
                wrapper.appendChild(helpDiv);
                consoleEl.appendChild(wrapper);
                consoleEl.scrollTop = consoleEl.scrollHeight;
            }
            return;
        case "add_entity":
            change = new EntityAddChange(args[1], args[2], options);
            break;
        case "remove_entity":
            change = new EntityRemoveChange(args[1], options);
            break;
        case "move_entity":
            change = new EntityMoveChange(args[1], args[2], options);
            break;
        case "set_entity_property":
            change = new EntityPropertyChange(args[1], args[2], args[3], options);
            break;
        case "add_component":
            options.componentProperties = args[3];
            change = new ComponentAddChange(args[1], args[2], options);
            break;
        case "remove_component":
            change = new ComponentRemoveChange(args[1], options);
            break;
        case "set_component_property":
            change = new ComponentPropertyChange(args[1], args[2], args[3], options);
            break;
        case "set_space_property":
            change = new SpacePropertyChange(args[1], args[2], args[3], options);
            break;
        case "set_mono_behavior_var":
            change = new MonoBehaviorVarChange(args[1], args[2], args[3], options);
            break;
        case "load_item":
            change = new LoadItemChange(args[1], args[2], args[3], options);
            break;
        case "clone_entity":
            change = new CloneEntityChange(args[1], options);
            break;
        case "save_item":
            change = new SaveEntityItemChange(args[1], args[2], args[3], options);
            break;
        case "delete_item":
            change = new DeleteItemChange(args[1], options);
            break;
        case "create_folder":
            change = new CreateFolderChange(args[1], args[2], options);
            break;
        case "remove_folder":
            change = new RemoveFolderChange(args[1], options);
            break;
        case "move_item_directory":
            change = new MoveItemDirectoryChange(args[1], args[2], options);
            break;
        case "create_script":
            change = new CreateScriptItemChange(args[1], options);
            break;
        case "edit_script":
            change = new EditScriptItemChange(args[1], args[2], options);
            break;
        case "reorder_component":
            change = new ComponentReorderChange(args[1], args[2], args[3], options);
            break;
        default:
            appendToConsole("command", "custom_command_"+Math.floor(Math.random()*1000000), `Unknown command: ${args[0]}`)
    }

    if(change){
        await change.apply();
    }
}

// Command history management
const COMMAND_HISTORY_KEY = 'commandHistory';
const MAX_HISTORY_SIZE = 100;

class CommandHistory {
    constructor() {
        this.history = this.loadHistory();
        this.currentIndex = this.history.length;
        this.tempCommand = '';
    }
    
    loadHistory() {
        try {
            const stored = localStorage.getItem(COMMAND_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load command history:', e);
            return [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem(COMMAND_HISTORY_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save command history:', e);
        }
    }
    
    add(command) {
        if (!command || command.trim() === '') return;
        
        // Remove duplicate if exists
        const index = this.history.indexOf(command);
        if (index > -1) {
            this.history.splice(index, 1);
        }
        
        // Add to end of history
        this.history.push(command);
        
        // Limit history size
        if (this.history.length > MAX_HISTORY_SIZE) {
            this.history.shift();
        }
        
        this.currentIndex = this.history.length;
        this.tempCommand = '';
        this.saveHistory();
    }
    
    navigateUp(currentValue) {
        if (this.history.length === 0) return currentValue;
        
        if (this.currentIndex === this.history.length) {
            this.tempCommand = currentValue;
        }
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        
        return this.history[0];
    }
    
    navigateDown(currentValue) {
        if (this.history.length === 0) return currentValue;
        
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        } else if (this.currentIndex === this.history.length - 1) {
            this.currentIndex = this.history.length;
            return this.tempCommand;
        }
        
        return currentValue;
    }
    
    reset() {
        this.currentIndex = this.history.length;
        this.tempCommand = '';
    }
}

const commandHistory = new CommandHistory();

let commmandInputEl = document.getElementById("commandConsoleInput");
commmandInputEl.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        let execString = commmandInputEl.value;
        if(execString.trim()) {
            commandHistory.add(execString);
            window.RunCommand(execString);
        }
        commmandInputEl.value = "";
        commandHistory.reset();
    } else if(e.key === "ArrowUp") {
        e.preventDefault();
        commmandInputEl.value = commandHistory.navigateUp(commmandInputEl.value);
        // Move cursor to end
        commmandInputEl.setSelectionRange(commmandInputEl.value.length, commmandInputEl.value.length);
    } else if(e.key === "ArrowDown") {
        e.preventDefault();
        commmandInputEl.value = commandHistory.navigateDown(commmandInputEl.value);
        // Move cursor to end
        commmandInputEl.setSelectionRange(commmandInputEl.value.length, commmandInputEl.value.length);
    }
})


window.SetEntityProp = async (entityId, property, newValue, options)=>{
    let change = new EntityPropertyChange(entityId, property, newValue, options);
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
window.AddComponent = async (entityId, componentType, options)=>{
    let change = new ComponentAddChange(entityId, componentType, options);
    return await change.apply();
}
window.RemoveComponent = async (componentId, options)=>{
    let change = new ComponentRemoveChange(componentId, options);
    return await change.apply();
}
window.AddEntity = async (parentId, entityName, options)=>{
    let change = new EntityAddChange(parentId, entityName, options);
    return await change.apply();
}
window.RemoveEntity = async (entityId, options)=>{
    let change = new EntityRemoveChange(entityId, options);
    return await change.apply();
}
window.MoveEntity = async (entityId, newParentId, options)=>{
    let change = new EntityMoveChange(entityId, newParentId, options);
    return await change.apply();
}
window.SetMonoBehaviorVar = async (componentId, varName, newValue, options)=>{
    let change = new MonoBehaviorVarChange(componentId, varName, newValue, options);
    return await change.apply();
}

window.LoadItem = async (itemName, parentId, options)=>{
    let change = new LoadItemChange(itemName, parentId, null, options);
    return await change.apply();
}

window.CloneEntity = async (entityId, options)=>{
    let change = new CloneEntityChange(entityId, options);
    return await change.apply();
}

window.SaveEntityItem = async (entityId, itemName, folder, options)=>{
    let change = new SaveEntityItemChange(entityId, itemName, folder, options);
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