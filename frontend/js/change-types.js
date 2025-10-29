// Import required dependencies
const { deepClone, parseBest, appendToShell, showNotification } = await import(`${window.repoUrl}/utils.js`);

// options: { source: 'ui' | 'history' | 'script' | 'sync' }



export class Change {
    constructor(){
        this.id = `change_${Math.floor(Math.random() * 1000000)}`;
        this.timeout = 5000;
        this.voidChange = false;
    }

    void(message){
        this.voidChange = true;
        if(message){
            showNotification(message);
        }
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
        if(this.voidChange){
            cmd_el.style.textDecoration = "line-through";
            cmd_el.style.color = "gray";
        }
        appendToShell("command", this.id, commandStr);
    }

    async undo(){
        if(this.voidChange){
            return;
        }
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
        if(this.property === "name"){
            if((this.oldValue === "Scene" || this.newValue === "Scene")){
                this.void("Cannot assign/change the name of 'Scene'");
                return;
            }
            if((this.newValue === "People" || this.oldValue === "People")){
                this.void("Cannot change the name of 'People'");
                return;
            }
            let entity = SM.getEntityById(this.entityId);
            if(!entity){
                this.void("Entity not found");
                return;
            }
            if(entity.parentId === "People"){
                this.void("Cannot change the name of 'People'");
                return;
            }
            let newId = entity.parentId+"/"+this.newValue;
            let existsAlready = SM.getEntityById(newId, false);
            if(existsAlready){
                this.void("Entity with that name already exists");
                return;
            }
        }
        
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
        if(!this.component){
            this.void(`Component ${componentId} not found`);
            return;
        }
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
        // if (inspector?.spacePropsPanel) {
        //     inspector.spacePropsPanel.render();
        // }
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
        return net.state[this.property];
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
        await net.SetVar(this.property, value, this.protected);
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

export class AddComponentChange extends Change{
    constructor(entityId, componentType, options) {
        super();
        this.timeout = 3000;
        this.entityId = entityId;
        this.componentType = componentType;
        this.options = options || {};
        this.componentProperties = this.options.componentProperties || {};

        // Validate component type exists
        const validation = window.ChangeTypes?.validateComponent(componentType);
        if (validation && !validation.valid) {
            this.void(`Invalid component type: ${componentType}`);

            // Build error message with suggestions
            let errorMsg = validation.message;
            if (validation.suggestions && validation.suggestions.length > 0) {
                errorMsg += '\n\nDid you mean one of these?\n' +
                    validation.suggestions.slice(0, 5).map(s => `  - ${s}`).join('\n');
            }

            // Also add helpful tips about component naming
            errorMsg += '\n\nNote: Component names like Box, Sphere, Material, etc.';
            errorMsg += '\nExcept colliders which don\'t (e.g., BoxCollider, SphereCollider)';
            errorMsg += '\n\nUse ComponentRegistry.list() to see all available components.';

            throw new Error(errorMsg);
        }
    }

    async apply() {
        super.apply();
        if(!this.componentProperties.id){
            this.componentProperties.id = `${this.componentType}_${Math.floor(Math.random() * 10000)}`;
        }
        let event = {
            entityId: this.entityId,
            componentType: this.componentType,
            componentProperties: this.componentProperties,
            options: this.options
        }
        let event_str = JSON.stringify(event);
        let data = `component_added¶${event_str}`
        net.sendOneShot(data);
        let checks = 0;
        const returnWhenComponentLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const component = SM.getEntityComponentById(this.componentProperties.id, false);
                if (component !== undefined && component._initialized) {
                  resolve(component);
                } else {
                  checks++;
                  if(checks > 100){
                    resolve(null);
                  }else{
                    setTimeout(check, 50);
                  }
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
        net.sendOneShot(data);
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

export class ReorderComponentChange extends Change{
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
        
        // // Don't allow moving Transform component (index 0)
        // if (this.fromIndex === 0 || this.toIndex === 0) {
        //     console.warn('Cannot reorder Transform component');
        //     return;
        // }
        
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
        net.sendOneShot(data);
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
        net.sendOneShot(data);
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

export class RemoveComponentChange extends Change{
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
        net.sendOneShot(data);
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
        net.sendOneShot(data);
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

export class AddEntityChange extends Change{
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
        this.newEntityId = `${this.parentId}/${this.entityName}`
        let exists = SM.getEntityById(this.newEntityId, false);
        if(exists){
            showNotification("Entity with that name already exists");
            return exists;
        }

        // let data = `entity_added¶${this.parentId}¶${this.entityName}`
        // net.sendOneShot(data);

        let parentRef = net.db.ref(`space/${net.spaceId}/${this.parentId}`);
        let newEntityRef = parentRef.child(this.entityName);
        await newEntityRef.set({
            __meta: {
                active: true,
                layer: 0,
                localPosition: {x: 0, y: 0, z: 0},
                localRotation: {x: 0, y: 0, z: 0, w: 1},
                localScale: {x: 1, y: 1, z: 1},
                position: {x: 0, y: 0, z: 0},
                rotation: {x: 0, y: 0, z: 0, w: 1},
                components: {},
                uuid: Math.floor(Math.random() * 10000000000000)
            }
        });

        const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                console.log("checking for: ", this.newEntityId)
                const entity = SM.getEntityById(this.newEntityId, false);
                if (entity !== undefined && entity.initialized) {
                    console.log("entity found: ", entity)
                  resolve(entity);
                } else {
                    console.log("entity not found: ", this.newEntityId)
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
        let entity_id = this.newEntityId
        let data = `entity_removed¶${entity_id}`
        net.sendOneShot(data);
    }

    getDescription() {
        return `New Entity: ${this.entityName} @ ${this.parentId}`;
    }

    getUndoDescription(){
        return `Remove Entity: ${this.entityName} @ ${this.parentId}`;
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

export class RemoveEntityChange extends Change{
    constructor(entityId, options) {
        super();
        this.timeout = 5000;
        this.entityId = entityId;
        this.siblingIndex = null;
        this.options = options || {};
    }

    async apply() {
        super.apply();
        let entity = SM.getEntityById(this.entityId);
        if(!entity){
            this.void(`Entity not found => ${this.entityId}`);
            return;
        }
        await entity.Destroy();
    }

    async undo() {
        super.undo();
        if (!this.entityExport) return;

        // Recreate the entity hierarchy
        // let data = `load_entity¶${this.entity.parentId}¶${JSON.stringify(this.entityExport)}`
        // net.sendOneShot(data);
        
    }

    getDescription() {
        return `Remove Entity: ${this.entityId}`;
    }

    getUndoDescription(){
        return `Restore Entity: ${this.entityId}`;
    }

    cmd(){
        return {
            action: "remove_entity",
            entityId: this.entityId,
            options: this.options
        }
    }
}

export class EntityMoveChange extends Change{
    constructor(entityId, newParentId, keepPosition, options) {
        super();
        this.timeout = 500;
        this.entityId = entityId;
        this.newParentId = newParentId;
        this.keepPosition = keepPosition;
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
        if(this.oldParentId === this.newParentId) return;
        if(this.oldParentId === "People" || this.newParentId === "People" || this.entityId === "People"){
            showNotification("People entities cannot be moved");
            return;
        }
        const entity = SM.getEntityById(this.entityId);
        const parent = SM.getEntityById(this.newParentId);
        if (!entity || !parent) return;
        await entity.SetParent(this.newParentId, this.keepPosition);
    }

    async undo() {
        super.undo();
        const entity = SM.getEntityById(this.entityId);
        if (!entity) return;
        await entity.SetParent(this.oldParentId, this.keepPosition);
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
            keepPosition: this.keepPosition,
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
                entity.components?.forEach(component=>{
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
            itemData.name = this.options.name || this.itemName+"_"+Math.floor(Math.random() * 100000);
            itemData.parentId = this.parentId;
            itemData.uuid = Math.floor(Math.random() * 10000000000000);
            itemData.id = this.parentId+"/"+itemData.name;
            changeChildrenIds(itemData);
    
            log("inventory", "[ITEM DATA] =>", itemData)
            this.itemData = itemData;    
        }
       
        let data = `load_entity¶${this.parentId}¶${JSON.stringify(this.itemData)}`
        net.sendOneShot(data);
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

                if (entity !== undefined && entity._finished_loading) {  
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
        net.sendOneShot(data);
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
        this.sourceEntityId = entityId;
        // Generate a unique clone name upfront for synchronization across clients
        this.cloneName = `${this.sourceEntity.name}_${Math.floor(Math.random() * 100000)}`;
        this.clonedEntityId = `${this.sourceEntity.parentId}/${this.cloneName}`;

        // Pre-generate all component IDs for the entire hierarchy
        this.componentIdMap = this.generateComponentIdMap(this.sourceEntity);

        this.options = options || {};
    }

    /**
     * Recursively generates component IDs for the entity and all its children
     * Returns a map of original component IDs to new component IDs
     */
    generateComponentIdMap(entity) {
        const idMap = {};

        // Generate IDs for this entity's components
        entity.components.forEach(component => {
            const newId = `${component.type}_${Math.floor(Math.random() * 99999)}`;
            idMap[component.id] = newId;
        });

        // Recursively generate IDs for children
        if (entity.children && entity.children.length > 0) {
            entity.children.forEach(child => {
                const childMap = this.generateComponentIdMap(child);
                Object.assign(idMap, childMap);
            });
        }

        return idMap;
    }

    async apply() {
        super.apply();

        // Send OneShot message with source entity ID, clone name, and component ID map
        let data = `entity_cloned¶${this.sourceEntityId}¶${this.cloneName}¶${JSON.stringify(this.componentIdMap)}`
        net.sendOneShot(data);

        // Wait for the cloned entity to be created and initialized
        const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                const entity = SM.getEntityById(this.clonedEntityId, false);
                if (entity !== undefined && entity._finished_loading) {
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
        if(!this.clonedEntityId) return;
        let data = `entity_removed¶${this.clonedEntityId}`
        net.sendOneShot(data);
    }

    getDescription() {
        return `Clone entity ${this.sourceEntity.name}`;
    }

    getUndoDescription() {
        return `Remove cloned entity`;
    }

    cmd(){
        return {
            action: "clone_entity",
            entityId: this.sourceEntityId,
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
            await net.deleteData(firebasePath);
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

        if (!window.net) {
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
            await net.deleteData(firebasePath);
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
            // const userName = inventory.firebase.sanitizeFirebasePath(SM.scene?.localUser?.name || 'default');
            // const rootRemoteKey = `inventory_root_remote_${userName}`;
            // return localStorage.getItem(rootRemoteKey) === 'true';
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
            startupSequence: "onSceneLoaded",
            active: false,    // Script is active even without being attached to GameObject (only for scripts)
            global: false,    // Script is global (only for scripts)
            autoUpdate: false // Script auto updates when imported from remote folder
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
                if(this.options.source === 'ui' && item.folder){ 
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
                            net.setData(ref, item);
                        }
                    }
                }else if(this.options.source === 'firebaseHandler'){ // Firebase=>here=>mono=>SpaceProps=>mono
                    log("Inventory", "Setting script content", this.scriptName, this.scriptContent)
                    net.setScript(this.scriptName, this.scriptContent);
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

let commandInputEl = document.getElementById("commandShellInput");
commandInputEl.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        let execString = commandInputEl.value;
        if(execString.trim()) {
            commandHistory.add(execString);
            window.RunCommand(execString);
        }
        commandInputEl.value = "";
        commandHistory.reset();
    } else if(e.key === "ArrowUp") {
        e.preventDefault();
        commandInputEl.value = commandHistory.navigateUp(commandInputEl.value);
        // Move cursor to end
        commandInputEl.setSelectionRange(commandInputEl.value.length, commandInputEl.value.length);
    } else if(e.key === "ArrowDown") {
        e.preventDefault();
        commandInputEl.value = commandHistory.navigateDown(commandInputEl.value);
        // Move cursor to end
        commandInputEl.setSelectionRange(commandInputEl.value.length, commandInputEl.value.length);
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
    let change = new AddComponentChange(entityId, componentType, options);
    return await change.apply();
}
window.RemoveComponent = async (componentId, options)=>{
    let change = new RemoveComponentChange(componentId, options);
    return await change.apply();
}

window.ReorderComponent = async (entityId, fromIndex, toIndex, options)=>{
    let change = new ReorderComponentChange(entityId, fromIndex, toIndex, options);
    return await change.apply();
}

window.AddEntity = async (parentId, entityName, options)=>{
    let change = new AddEntityChange(parentId, entityName, options);
    return await change.apply();
}
window.RemoveEntity = async (entityId, options)=>{
    let change = new RemoveEntityChange(entityId, options);
    return await change.apply();
}
window.MoveEntity = async (entityId, newParentId, options)=>{
    let change = new EntityMoveChange(entityId, newParentId, options);
    return await change.apply();
}

window.RenameItem = async (itemName, newName, options)=>{
    let change = new RenameItemChange(itemName, newName, options);
    return await change.apply();
}

window.SetMonoBehaviorVar = async (componentId, varName, newValue, options)=>{
    let change = new MonoBehaviorVarChange(componentId, varName, newValue, options);
    return await change.apply();
}

window.SetItem = (item)=>{
    const storageKey = 'inventory_' + item.name;
    localStorage.setItem(storageKey, JSON.stringify(item));
    inventory.items[item.name] = item;
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

window.RenameFolder = async (folderName, newName, options)=>{
    let change = new RenameFolderChange(folderName, newName, options);
    return await change.apply();
}

window.MoveFolder = async (folderName, newName, options)=>{
    let change = new MoveFolderChange(folderName, newName, options);
    return await change.apply();
}

// ============================================================================
// EXPOSE CHANGE TYPES FOR RUNTIME INSPECTION
// ============================================================================

/**
 * Global registry of all Change types for runtime inspection and debugging.
 * Accessible via window.ChangeTypes in the browser console.
 *
 * Usage:
 *   - List all change types: Object.keys(ChangeTypes.classes)
 *   - Get change type info: ChangeTypes.getInfo('EntityPropertyChange')
 *   - Create change instance: new ChangeTypes.classes.EntityPropertyChange(...)
 *   - Get all entity changes: ChangeTypes.getByCategory('entity')
 */
window.ChangeTypes = {
    // All change class constructors
    classes: {
        Change,
        SetEntityProp,
        SetComponentProp,
        SetSpaceProp,
        AddComponent,
        ReorderComponent,
        RemoveComponent,
        AddEntity,
        RemoveEntity,
        MoveEntity,
        SetMonoBehaviorVar,
        LoadItem,
        CloneEntity,
        SaveEntityItem,
        RenameItem,
        DeleteItem,
        CreateFolder,
        RenameFolder,
        MoveFolder,
        RemoveFolder,
        MoveItemDirectory,
        CreateScript,
        EditScript
    },

    // Metadata about each change type
    metadata: {
        Change: {
            category: 'base',
            description: 'Base class for all changes',
            parameters: [],
            undoable: true
        },
        SetEntityProp: {
            category: 'entity',
            description: 'Change a property of an entity (name, active, layer, etc.)',
            parameters: ['entityId', 'property', 'newValue', 'options'],
            undoable: true,
            command: 'set_entity_property'
        },
        SetComponentProp: {
            category: 'component',
            description: 'Change a property of a component',
            parameters: ['componentId', 'property', 'newValue', 'options'],
            undoable: true,
            command: 'set_component_property'
        },
        SetSpaceProp: {
            category: 'space',
            description: 'Change a public or protected space property',
            parameters: ['property', 'newValue', 'protect', 'options'],
            undoable: true,
            command: 'set_space_property'
        },
        AddComponent: {
            category: 'component',
            description: 'Add a component to an entity',
            parameters: ['entityId', 'componentType', 'options'],
            undoable: true,
            command: 'add_component'
        },
        ReorderComponent: {
            category: 'component',
            description: 'Reorder a component in the entity component list',
            parameters: ['entityId', 'fromIndex', 'toIndex', 'options'],
            undoable: true,
            command: 'reorder_component'
        },
        RemoveComponent: {
            category: 'component',
            description: 'Remove a component from an entity',
            parameters: ['componentId', 'options'],
            undoable: true,
            command: 'remove_component'
        },
        AddEntity: {
            category: 'entity',
            description: 'Add a new entity as child of parent',
            parameters: ['parentId', 'entityName', 'options'],
            undoable: true,
            command: 'add_entity'
        },
        RemoveEntity: {
            category: 'entity',
            description: 'Remove an entity and its children',
            parameters: ['entityId', 'options'],
            undoable: true,
            command: 'remove_entity'
        },
        MoveEntity: {
            category: 'entity',
            description: 'Move entity to new parent',
            parameters: ['entityId', 'newParentId', 'options'],
            undoable: true,
            command: 'move_entity'
        },
        SetMonoBehaviorVar: {
            category: 'script',
            description: 'Change a MonoBehavior variable value',
            parameters: ['componentId', 'varName', 'newValue', 'options'],
            undoable: true,
            command: 'set_mono_behavior_var'
        },
        LoadItem: {
            category: 'inventory',
            description: 'Load item from inventory into scene',
            parameters: ['itemName', 'parentId', 'itemData', 'options'],
            undoable: true,
            command: 'load_item'
        },
        CloneEntity: {
            category: 'entity',
            description: 'Clone an entity and its children',
            parameters: ['entityId', 'options'],
            undoable: true,
            command: 'clone_entity'
        },
        SaveEntityItem: {
            category: 'inventory',
            description: 'Save entity as inventory item',
            parameters: ['entityId', 'itemName', 'folder', 'options'],
            undoable: false,
            command: 'save_item'
        },
        RenameItem: {
            category: 'inventory',
            description: 'Rename an inventory item',
            parameters: ['itemName', 'newName', 'options'],
            undoable: false,
            command: 'rename_item'
        },
        DeleteItem: {
            category: 'inventory',
            description: 'Delete item from inventory',
            parameters: ['itemName', 'options'],
            undoable: false,
            command: 'delete_item'
        },
        CreateFolder: {
            category: 'inventory',
            description: 'Create inventory folder',
            parameters: ['folderName', 'parentFolderName', 'options'],
            undoable: false,
            command: 'create_folder'
        },
        RenameFolder: {
            category: 'inventory',
            description: 'Rename inventory folder',
            parameters: ['originalName', 'newName', 'options'],
            undoable: true,
            command: 'rename_folder'
        },
        MoveFolder: {
            category: 'inventory',
            description: 'Move folder to new parent (NOT IMPLEMENTED)',
            parameters: [],
            undoable: false,
            command: null
        },
        RemoveFolder: {
            category: 'inventory',
            description: 'Remove inventory folder and its contents',
            parameters: ['folderPath', 'options'],
            undoable: false,
            command: 'remove_folder'
        },
        MoveItemDirectory: {
            category: 'inventory',
            description: 'Move item to different folder',
            parameters: ['itemName', 'folderName', 'options'],
            undoable: false,
            command: 'move_item_directory'
        },
        CreateScriptItem: {
            category: 'inventory',
            description: 'Create new script or markdown item',
            parameters: ['scriptName', 'options'],
            undoable: false,
            command: 'create_script'
        },
        EditScriptItem: {
            category: 'inventory',
            description: 'Edit script content',
            parameters: ['scriptName', 'scriptContent', 'options'],
            undoable: false,
            command: 'edit_script'
        }
    },

    // Helper methods for runtime inspection

    /**
     * Get information about a specific change type
     * @param {string} typeName - Name of the change type
     * @returns {Object} Metadata object with category, description, parameters
     */
    getInfo(typeName) {
        return this.metadata[typeName] || null;
    },

    /**
     * Get all change types in a category
     * @param {string} category - Category name (entity, component, inventory, space, script, base)
     * @returns {Array<string>} Array of change type names
     */
    getByCategory(category) {
        return Object.entries(this.metadata)
            .filter(([_, meta]) => meta.category === category)
            .map(([name, _]) => name);
    },

    /**
     * Get all categories
     * @returns {Array<string>} Array of unique category names
     */
    getCategories() {
        return [...new Set(Object.values(this.metadata).map(meta => meta.category))];
    },

    /**
     * Get all undoable change types
     * @returns {Array<string>} Array of change type names that support undo
     */
    getUndoable() {
        return Object.entries(this.metadata)
            .filter(([_, meta]) => meta.undoable === true)
            .map(([name, _]) => name);
    },

    /**
     * Get all change types that have shell commands
     * @returns {Object} Map of command names to change type names
     */
    getCommands() {
        const commands = {};
        Object.entries(this.metadata).forEach(([typeName, meta]) => {
            if (meta.command) {
                commands[meta.command] = typeName;
            }
        });
        return commands;
    },

    /**
     * List all change types with their basic info
     * @returns {Array<Object>} Array of {name, category, description, undoable} objects
     */
    list() {
        return Object.entries(this.metadata).map(([name, meta]) => ({
            name,
            category: meta.category,
            description: meta.description,
            undoable: meta.undoable,
            command: meta.command || null
        }));
    },

    /**
     * Get statistics about change types
     * @returns {Object} Statistics object
     */
    getStats() {
        const categories = this.getCategories();
        const stats = {
            total: Object.keys(this.classes).length,
            byCategory: {},
            undoable: this.getUndoable().length,
            withCommands: Object.keys(this.getCommands()).length
        };

        categories.forEach(cat => {
            stats.byCategory[cat] = this.getByCategory(cat).length;
        });

        return stats;
    },
    getHelpText(){
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
          <span style="color: #88ddff;">add_component</span> <span style="color: #ffff88;">Scene/Box Box</span>         - Add Box component
          <span style="color: #88ddff;">set_entity_property</span> <span style="color: #ffff88;">Scene/Box name "New Name"</span>  - Rename entity
          <span style="color: #88ddff;">load_item</span> <span style="color: #ffff88;">MyPrefab Scene</span>                   - Load prefab to Scene

        <span style="color: #00ff00; font-weight: bold;">Discovery Commands:</span>
          <span style="color: #88ddff;">ComponentRegistry.list()</span>              - List all available components
          <span style="color: #88ddff;">ComponentRegistry.getByCategory("meshes")</span> - Get components by category
          <span style="color: #88ddff;">ChangeTypes.validateComponent("Box")</span> - Check if component exists
          <span style="color: #88ddff;">ChangeTypes.suggestComponent("cube")</span>  - Get component name suggestions

        <span style="color: #00ff00; font-weight: bold;">Notes:</span>
          <span style="color: #aaaaaa;">- Most components have 'Banter' prefix (Box, Sphere, Material)
          - Colliders DON'T have Banter prefix (BoxCollider, SphereCollider)
          - Entity IDs use path format: Scene/Parent/Child
          - Component IDs format: ComponentType_12345
          - Values are auto-parsed (strings, numbers, booleans, vectors, colors)
          - Vectors: [1,2,3] or {x:1,y:2,z:3}
          - Colors: #FF0000 or {r:1,g:0,b:0}
          - ALWAYS verify components exist after add_component!</span>`
        },

    /**
     * Validate if a component type exists and is supported
     * @param {string} componentType - Component type name to validate
     * @returns {Object} {valid: boolean, message: string, suggestions: Array<string>}
     */
    validateComponent(componentType) {
        // Check if ComponentRegistry exists
        if (!window.ComponentRegistry) {
            return {
                valid: false,
                message: 'ComponentRegistry not available',
                suggestions: []
            };
        }

        // Check if component exists
        const exists = window.ComponentRegistry.typeMap[componentType];
        if (exists) {
            return {
                valid: true,
                message: `Component "${componentType}" is valid`,
                suggestions: []
            };
        }

        // Get suggestions using fuzzy matching
        const suggestions = this.suggestComponent(componentType);

        return {
            valid: false,
            message: `Component "${componentType}" not found. Did you mean one of these?`,
            suggestions: suggestions.slice(0, 5)  // Top 5 suggestions
        };
    },

    /**
     * Suggest component names based on fuzzy matching
     * @param {string} input - Partial or misspelled component name
     * @returns {Array<string>} Sorted array of suggested component names
     */
    suggestComponent(input) {
        if (!window.ComponentRegistry) return [];

        const allComponents = Object.keys(window.ComponentRegistry.typeMap);
        const lowerInput = input.toLowerCase();

        // Calculate similarity scores
        const scored = allComponents.map(name => {
            const lowerName = name.toLowerCase();
            let score = 0;

            // Exact match
            if (lowerName === lowerInput) score += 1000;

            // Starts with
            if (lowerName.startsWith(lowerInput)) score += 100;

            // Contains
            if (lowerName.includes(lowerInput)) score += 50;

            // Levenshtein-like simple similarity
            const commonChars = [...lowerInput].filter(char => lowerName.includes(char)).length;
            score += commonChars * 10;

            // Penalize length difference
            score -= Math.abs(lowerName.length - lowerInput.length) * 2;

            return { name, score };
        });

        // Sort by score and return top matches
        return scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.name);
    },

    /**
     * Validate command syntax before execution
     * @param {string} commandString - Full command string to validate
     * @returns {Object} {valid: boolean, message: string, suggestions: Array<string>}
     */
    validateCommand(commandString) {
        const args = commandString.trim().split(" ");
        const command = args[0];

        // Check if command exists
        const commands = this.getCommands();
        const validCommands = Object.keys(commands);

        if (!validCommands.includes(command) && command !== 'help') {
            return {
                valid: false,
                message: `Unknown command: "${command}"`,
                suggestions: validCommands.filter(cmd =>
                    cmd.toLowerCase().includes(command.toLowerCase())
                )
            };
        }

        // Validate add_component specifically
        if (command === 'add_component') {
            if (args.length < 3) {
                return {
                    valid: false,
                    message: 'add_component requires entityId and componentType',
                    suggestions: []
                };
            }

            const componentType = args[2];
            const componentValidation = this.validateComponent(componentType);

            if (!componentValidation.valid) {
                return componentValidation;
            }
        }

        // Validate set_component_property specifically
        if (command === 'set_component_property') {
            if (args.length < 4) {
                return {
                    valid: false,
                    message: 'set_component_property requires componentId, property, and newValue',
                    suggestions: []
                };
            }

            const componentId = parseBest(args[1]);
            const propertyName = parseBest(args[2]);

            // Check if SM (SceneManager) is available
            if (!window.SM) {
                // Can't validate without SM, but allow command through
                return {
                    valid: true,
                    message: 'SceneManager not available, skipping property validation',
                    suggestions: []
                };
            }

            // Get the component
            const component = window.SM.getEntityComponentById(componentId, false);
            if (!component) {
                return {
                    valid: false,
                    message: `Component "${componentId}" not found`,
                    suggestions: []
                };
            }

        
            // Check if property exists
            const validProperties = Object.keys(component.properties);
            if (!validProperties.includes(propertyName)) {
                // Suggest similar property names
                const suggestions = validProperties.filter(prop =>
                    prop.toLowerCase().includes(propertyName.toLowerCase()) ||
                    propertyName.toLowerCase().includes(prop.toLowerCase())
                );

                return {
                    valid: false,
                    message: `Property "${propertyName}" does not exist in component "${component.type}". Valid properties: ${validProperties.join(', ')}`,
                    suggestions: suggestions.length > 0 ? suggestions : validProperties.slice(0, 5)
                };
            }
        }

        return {
            valid: true,
            message: 'Command syntax is valid',
            suggestions: []
        };
    },

    /**
     * Get help for a specific command or component
     * @param {string} name - Command or component name
     * @returns {string} Help text
     */
    getHelp(name) {
        // Check if it's a command
        const commands = this.getCommands();
        const changeType = commands[name];
        if (changeType) {
            const info = this.getInfo(changeType);
            return `
Command: ${name}
Description: ${info.description}
Parameters: ${info.parameters.join(', ')}
Undoable: ${info.undoable ? 'Yes' : 'No'}
            `.trim();
        }

        // Check if it's a component
        if (window.ComponentRegistry) {
            const compInfo = window.ComponentRegistry.getInfo(name);
            if (compInfo) {
                return `
Component: ${name}
Category: ${compInfo.category}
Description: ${compInfo.description}
Usage: add_component <entityId> ${name}
                `.trim();
            }
        }

        return `No help available for "${name}". Try: ChangeTypes.list() or ComponentRegistry.list()`;
    },

    /**
     * Validate and run a command string safely with error checking
     * @param {string} commandString - Full command string to validate and execute
     * @param {Object} options - Optional options object to pass to RunCommand
     * @returns {Promise<boolean>} True if command executed successfully
     * @throws {Error} If validation fails
     */
    async runSafe(commandString, options) {
        // Validate command syntax first
        const validation = this.validateCommand(commandString);

        if (!validation.valid) {
            let errorMsg = `❌ ${validation.message}`;
            if (validation.suggestions.length > 0) {
                errorMsg += `\n\nDid you mean:\n` + validation.suggestions.map(s => `  - ${s}`).join('\n');
            }

            // Log to console for debugging
            console.error(errorMsg);

            // Throw error so calling code knows validation failed
            throw new Error(errorMsg);
        }

        console.log(`✓ Command validated, executing: ${commandString}`);
        await window.RunCommand(commandString, options);
        return true;
    }
};


window.RunCommand = async (execString, options)=>{
    let args = execString.split(" ").map(arg=>parseBest(arg));

    // Convert arrays to {x, y, z} objects for Vector3-like values
    args = args.map(arg => {
        if (Array.isArray(arg)) {
            if (arg.length === 3) {
                return { x: arg[0], y: arg[1], z: arg[2] };
            } else if (arg.length === 2) {
                return { x: arg[0], y: arg[1] };
            } else if (arg.length === 4) {
                return { x: arg[0], y: arg[1], z: arg[2], w: arg[3] };
            }
        }
        return arg;
    });

    let change = null;
    options = options || {};
    switch(args[0]){
        case "help":
            // Create a colored help text div
            const helpDiv = document.createElement('div');
            helpDiv.style.fontFamily = 'monospace';
            helpDiv.style.whiteSpace = 'pre-wrap';
            helpDiv.innerHTML = window.ChangeTypes.getHelpText();
            
            // Append the colored help directly
            const shellEl = document.getElementById("lifecycleShell");
            if(shellEl) {
                const children = shellEl.children;
                if (children.length >= 500) {
                    shellEl.removeChild(children[0]);
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'change-item';
                wrapper.id = "help_"+Math.floor(Math.random()*1000000);
                wrapper.appendChild(helpDiv);
                shellEl.appendChild(wrapper);
                shellEl.scrollTop = shellEl.scrollHeight;
            }
            return;
        case "add_entity":
            change = new AddEntityChange(args[1], args[2], options);
            break;
        case "remove_entity":
            change = new RemoveEntityChange(args[1], options);
            break;
        case "move_entity":
            change = new EntityMoveChange(args[1], args[2], options);
            break;
        case "set_entity_property":
            change = new EntityPropertyChange(args[1], args[2], args[3], options);
            break;
        case "add_component":
            options.componentProperties = args[3];
            change = new AddComponentChange(args[1], args[2], options);
            break;
        case "remove_component":
            change = new RemoveComponentChange(args[1], options);
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
            change = new ReorderComponentChange(args[1], args[2], args[3], options);
            break;
        default:
            appendToShell("command", "custom_command_"+Math.floor(Math.random()*1000000), `Unknown command: ${args[0]}`)
    }

    if(change){
        await change.apply();
    }
}

ChangeTypes.RunCommand = RunCommand;
window.RunSafeCommand = ChangeTypes.runSafe.bind(ChangeTypes);
// Log availability for debugging
console.log('[ChangeTypes] Exposed globally with', Object.keys(window.ChangeTypes.classes).length, 'change types');
console.log('[ChangeTypes] Usage: window.ChangeTypes.list() or ChangeTypes.getInfo("EntityPropertyChange")');
console.log('[ChangeTypes] Categories:', window.ChangeTypes.getCategories().join(', '));