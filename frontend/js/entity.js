const { TransformComponent } = await import(`${window.repoUrl}/entity-components/transform.js`);
const { deepClone, parseBest } = await import(`${window.repoUrl}/utils.js`);

export class Entity{
    async init(entityData){
        this.name = entityData.name || `New_Entity_${Math.floor(Math.random()*99999)}`;
        this.parentId = entityData.parentId;
        this.components = entityData.components || [];
        this.children = entityData.children || [];
        this._bs = entityData._bs;
        this.loadAsync = entityData.loadAsync || false;
        this.active = true;
        this.layer = parseInt(entityData.layer) || 0;
        this.persistent = true;
        this.identifiers = new Set();
        this.initialized = false;
        

        if(!entityData._bs){
            let newGameObject = new BS.GameObject(this.name);
            this._bs = newGameObject;
            let parentEntity = SM.getEntityOrScene(this.parentId);
            try{
                if(parentEntity){
                    let parentGameObject = parentEntity._bs;
                    if(parentGameObject){
                        await newGameObject.SetParent(parentGameObject, true);
                    }
                }
                await newGameObject.SetActive(true);
                await newGameObject.SetLayer(this.layer);
            }catch(e){
                err("entity", this, this.parentId, parentEntity)
                err("entity", e);
            }
        }
        
        this.id = (this.parentId) ? this.parentId + "/" + this.name : this.name;
        this.identifiers.add(this.id);
        window.SM.entityData.entityMap[this.id] = this;
        this.initialized = true;
        return this;
    }

    getTransform(){
        return this.components.find(component => component.type === "Transform");
    }

    getComponent(componentType, index = 0){
        return this.components.filter(component => component.type === componentType)[index];
    }

    getComponents(componentType){
        return this.components.filter(component => component.type === componentType);
    }
    
    reorderComponent(fromIndex, toIndex){
        if (fromIndex < 0 || fromIndex >= this.components.length ||
            toIndex < 0 || toIndex >= this.components.length) {
            err("entity", "Invalid component indices for reorder")
            return false;
        }
        
        // Don't allow moving Transform component (should always be at index 0)
        if (fromIndex === 0 || toIndex === 0) {
            return false;
        }
        
        // Perform the reorder
        const [movedComponent] = this.components.splice(fromIndex, 1);
        this.components.splice(toIndex, 0, movedComponent);
        
        // Update the Unity side if needed (this might require BS API support)
        // For now, just update the local state
        return true;
    }

    async _checkForGhostComponents(id){
        let visible_components = this.components.map(x=>x._bs)
        Object.values(this._bs.components).forEach(async bs_comp => {
            if(!visible_components.includes(bs_comp)){
                log("entity", "ghost component found: ", componentTextMap[bs_comp.type])
                let component_ref = `${componentTextMap[bs_comp.type]}_${id}`
                let props = {
                    id: component_ref
                }
                let componentClass = componentBSTypeMap[bs_comp.type];
                let entityComponent = await new componentClass().init(this, bs_comp, props, {context: "ghost"});
                entityComponent.setId(component_ref);
                this.components.push(entityComponent);
                SM.entityData.componentMap[component_ref] = entityComponent;
                inspector.propertiesPanel.render(this.id);
            }
        })
    }

    async _setParent(newParent){
        if (newParent === this) return;
        if(!newParent) return;
        if (this.parentId) {
            const oldParent = SM.getEntityById(this.parentId);
            if(oldParent){
                oldParent.children = oldParent.children.filter(child => child.id !== this.id);
            }
        }
        newParent.children.push(this);
        this.parentId = newParent.id;
        this._bs.SetParent(newParent._bs);
        this.rename(this.name, true);
    }

    async _destroy(){
        let children = [...this.children];
        for(let child of children){
            await child._destroy();
        }

        let components = [...this.components];
        for(let component of components){
            await component._destroy();
        }

        await this._bs.Destroy();
        delete SM.entityData.entityMap[this.id];

        delete SM.props[`__${this.id}/active:entity`];
        delete SM.props[`__${this.id}/persistent:entity`];
        delete SM.props[`__${this.id}/name:entity`];
        delete SM.props[`__${this.id}/layer:entity`];
        if(this.parentId){
            const parent = SM.getEntityById(this.parentId);
            if (parent) {
                parent.children = parent.children.filter(child => child.id !== this.id);
            }
        }
    }

    _deleteOldSpaceProperties(){
        let toDelete = [];
        Object.keys(SM.props).forEach(key=>{
            let lastSlash = key.lastIndexOf("/");
            let compID = key.slice(2, lastSlash).trim();
            let component = SM.getEntityComponentById(compID, false);
            if(!component) return;
            if(component._entity.id === this.id){
                if(!key.endsWith(":component")){
                    toDelete.push(key);
                }
            }
        })

        for(let key of toDelete){
            delete SM.props[key];
        }
    }

    saveSpaceProperties(){
        let message = `update_entity¶${this.id}¶active¶${this.active}`;
        networking.sendOneShot(message);
        message = `update_entity¶${this.id}¶persistent¶${this.persistent}`;
        networking.sendOneShot(message);
        message = `update_entity¶${this.id}¶name¶${this.name}`;
        networking.sendOneShot(message);
        message = `update_entity¶${this.id}¶layer¶${this.layer}`;
        networking.sendOneShot(message);
    }

    rename(newName, localUpdate){
        log("entity", `renaming ${this.id} to ${newName} : ${localUpdate}`)
        if(!localUpdate) this._deleteOldSpaceProperties();
        delete SM.entityData.entityMap[this.id]
        this.name = newName;
        this.id = this.parentId+"/"+this.name;
        this._bs.SetName(newName);
        SM.entityData.entityMap[this.id] = this;
        if(!localUpdate) this.saveSpaceProperties();
        this.children.forEach(child=>{
            child.parentId = this.id;
            child.rename(child.name, localUpdate);
        })
        this.identifiers.add(this.id);
    }

    _set(prop, newValue){
        log("entity", `(${this.name}) update ${prop} =>`, newValue)
        newValue = parseBest(newValue);
        if(prop == "name"){
            this.rename(newValue, true);
        }
        if(prop == "active"){
            this.active = newValue;
            this._bs.SetActive(newValue);
            this.components.forEach(component => {
                if(component.type === "MonoBehavior"){
                    if(newValue){
                        component._refresh();
                    }else{
                        component._stop();
                    }
                }
            });
        }
        if(prop == "persistent"){
            this.persistent = newValue;
        }

        if(prop == "layer"){
            this.layer = newValue;
            this._bs.SetLayer(newValue);
        }
    }

    export(keep){
        let ignore = ['_bs', '_entity', 'bsRef','_component','_scene','_BS','_running', '_owner', '_controls', 'id', 'ctx', 'scriptFunction', 'finished_loading']
        if(keep){
            ignore = ignore.filter(x=>!keep.includes(x));
        }
        return deepClone(this, ignore);
    }

    async Set(property, value){
        if(typeof value === "object"){
            value = JSON.stringify(value);
        }
        SM.props[`__${this.id}/${property}:entity`] = value;
        let message = `update_entity¶${this.id}¶${property}¶${value}`;
        networking.sendOneShot(message);
        if(property == "name"){
            this.rename(value, false);
        }
    }

    async SetParent(newParentId){
        let data = `entity_moved¶${this.id}¶${newParentId}¶0`
        networking.sendOneShot(data);
    }
}