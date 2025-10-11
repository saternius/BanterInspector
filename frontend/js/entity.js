const { TransformComponent } = await import(`${window.repoUrl}/entity-components/transform.js`);
const { deepClone, parseBest, eulerToQuaternion } = await import(`${window.repoUrl}/utils.js`);

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
        this.type = "Entity";
        

        if(!entityData._bs){
            let params = {name: this.name};
            let lp = entityData.localPosition;
            let lr = entityData.localRotation;
            let ls = entityData.localScale;
            if(lp){ params.localPosition = new BS.Vector3(lp.x, lp.y, lp.z) }
            if(lr){ params.localRotation = new BS.Vector4(lr.x, lr.y, lr.z, lr.w) }
            if(ls){ params.localScale = new BS.Vector3(ls.x, ls.y, ls.z) }
            
    
            let parentEntity = SM.getEntityOrScene(this.parentId);
            params.parent = parentEntity._bs;
            params.layer = this.layer;
            params.active = this.active;
            let newGameObject = new BS.GameObject(params);
            this._bs = newGameObject;
        }
        
        this.id = (this.parentId) ? this.parentId + "/" + this.name : this.name;
        this.identifiers.add(this.id);
        window.SM.entityData.entityMap[this.id] = this;
        this.initialized = true;
        this.transform = this._bs.transform;
        return this;
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

    _loaded(){
        //log("RANDOM DEBUG", this.id, Object.keys(SM.entityData.entityMap).join(", "))
        this._finished_loading = true;
        let scripts = this.components.filter(c=>c.type === "MonoBehavior");
        scripts.forEach(async script=>{
            await script.ctx.onLoaded();
        })
    }

    async _checkForGhostComponents(id){
        let visible_components = this.components.map(x=>x._bs)
        Object.values(this._bs.components).forEach(async bs_comp => {
            if(!visible_components.includes(bs_comp)){
                log("entity", this.id, "ghost component found: ", bs_comp.type, componentTextMap[bs_comp.type])
                if(bs_comp.type === 34){
                    //This is UI
                    return;
                }
                let component_ref = `${componentTextMap[bs_comp.type]}_${id}`
                let props = {
                    id: component_ref
                }
                let componentClass = componentBSTypeMap[bs_comp.componentType];
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
        this._stagedForDestruction = true;
        let monobehaviors = [...this.components.filter(component => component.type === "MonoBehavior")];
        for(let monobehavior of monobehaviors){
            await monobehavior._destroy();
        }

        let children = [...this.children];
        for(let child of children){
            await child._destroy();
        }

        let components = [...this.components];
        for(let component of components){
            if(component.type === "MonoBehavior") continue;
            await component._destroy();
        }

        await this._bs.Destroy();
        delete SM.entityData.entityMap[this.id];

        delete SM.props[`__${this.id}/active:entity`];
        delete SM.props[`__${this.id}/persistent:entity`];
        delete SM.props[`__${this.id}/name:entity`];
        delete SM.props[`__${this.id}/layer:entity`];
        delete SM.props[`__${this.id}/localPosition:entity`];
        delete SM.props[`__${this.id}/localRotation:entity`];
        delete SM.props[`__${this.id}/localScale:entity`];
        delete SM.props[`__${this.id}/position:entity`];
        delete SM.props[`__${this.id}/rotation:entity`];
        delete SM.props[`__${this.id}/scale:entity`];
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

    transformVal(property){
        let prop = this.transform[property];
        let base = {
            x: prop.x,
            y: prop.y,
            z: prop.z
        }
        if(prop.w){
            base.w = prop.w;
        }
        return base;
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
        message = `update_entity¶${this.id}¶localPosition¶${JSON.stringify(this.transform.localPosition)}`;
        networking.sendOneShot(message);
        message = `update_entity¶${this.id}¶localRotation¶${JSON.stringify(this.transform.localRotation)}`;
        networking.sendOneShot(message);
        message = `update_entity¶${this.id}¶localScale¶${JSON.stringify(this.transform.localScale)}`;
        networking.sendOneShot(message);
        // message = `update_entity¶${this.id}¶position¶${JSON.stringify(this.transform.position)}`;
        // networking.sendOneShot(message);
        // message = `update_entity¶${this.id}¶rotation¶${JSON.stringify(this.transform.rotation)}`;
        // networking.sendOneShot(message);
        // message = `update_entity¶${this.id}¶scale¶${JSON.stringify(this.transform.scale)}`;
        // networking.sendOneShot(message);
    }

    rename(newName, localUpdate){
        //log("entity", `renaming ${this.id} to ${newName} : ${localUpdate}`)
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

        if(prop == "localPosition"){
            this.transform.localPosition = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }
        if(prop == "localRotation"){
            if ('w' in newValue) {
                newValue.w = parseFloat(newValue.w || 1);
            } else {
                newValue = eulerToQuaternion(newValue);
            }
            this.transform.localRotation = new BS.Vector4(newValue.x, newValue.y, newValue.z, newValue.w);
        }
        if(prop == "localScale"){
            this.transform.localScale = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }
        if(prop == "position"){
            this.transform.position = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }
        if(prop == "rotation"){
            this.transform.rotation = new BS.Vector4(newValue.x,newValue.y, newValue.z, newValue.w)
        }
        // if(prop == "scale"){
        //     this.transform.scale = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        // }
    }

    export(keep){
        let ignore = ['id', 'ctx']
        if(keep){
            ignore = ignore.filter(x=>!keep.includes(x));
        }

        
        let clone = {};
        for(const key in this){
            if(ignore.includes(key)) continue;
            if(key.startsWith("_")) continue;
            if(this.hasOwnProperty(key)){
                if(key === "transform"){
                    clone[key] = {
                        localPosition: this.transformVal("localPosition"),
                        localRotation: this.transformVal("localRotation"),
                        localScale: this.transformVal("localScale")
                    }
                }else if(key === "children"){
                    clone[key] = this.children.map(child=>child.export(keep));
                }else{
                    clone[key] = deepClone(this[key], ignore, true);
                }
            }
        }
        return clone;
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
    
    Get(property){
        let transformProperty = this.transform[property]
        if(transformProperty){
            return transformProperty;
        }
        return this[property];
    }

    async SetParent(newParentId){
        let data = `entity_moved¶${this.id}¶${newParentId}¶0`
        networking.sendOneShot(data);
    }
}