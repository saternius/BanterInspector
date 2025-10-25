const { TransformComponent } = await import(`${window.repoUrl}/entity-components/transform.js`);
const { deepClone, parseBest, eulerToQuaternion } = await import(`${window.repoUrl}/utils.js`);

export class Entity{
    async init(entityData){
        log("entity", "init", entityData)
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
        this.uuid = Math.floor(Math.random() * 10000000000000);

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

        this._bs.networkId = entityData.networkId;
        this.id = (this.parentId) ? this.parentId + "/" + this.name : this.name;
        this.identifiers.add(this.id);
        window.SM.entityData.entityMap[this.id] = this;
        this.initialized = true;
        this.transform = this._bs.transform;
        this.spaceProps = {};
        this.ref = net.db.ref(`space/${net.spaceId}/${this.id}`);
        return this;
    }

    get localPosition(){
        return this.transform.localPosition;
    }
    get localRotation(){
        return this.transform.localRotation;
    }
    get localScale(){
        return this.transform.localScale;
    }
    get position(){
        return this.transform.position;
    }
    get rotation(){
        return this.transform.rotation;
    }
    get scale(){
        return this.transform.scale;
    }

    async GetComponent(componentType, index = 0, attempts = 0){
        let component = this.components.filter(component => component.type === componentType)[index];
        if(!component && attempts < 100){
            await new Promise(resolve => setTimeout(resolve, 100));
            log("entity", "GetComponent", "Retrying", componentType, index, attempts);
            return this.GetComponent(componentType, index, attempts + 1);
        }
        return component;
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

        const [movedComponent] = this.components.splice(fromIndex, 1);
        this.components.splice(toIndex, 0, movedComponent);
        return true;
    }

    _loaded(){
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

    async _setParent(newParent, keepPosition){
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
        this._bs.SetParent(newParent._bs, keepPosition);
        this._rename(this.name);
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
        this.ref.remove();
        if(this.parentId){
            const parent = SM.getEntityById(this.parentId);
            if (parent) {
                parent.children = parent.children.filter(child => child.id !== this.id);
            }
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

 
    _rename(newName){
        // if(!SM.iamHost) this._deleteOldSpaceProperties();
        delete SM.entityData.entityMap[this.id]
        this.name = newName;
        this.id = this.parentId+"/"+this.name;
        this._bs.SetName(newName);
        SM.entityData.entityMap[this.id] = this;
        // if(!SM.iamHost) this.saveSpaceProperties();
        this.children.forEach(child=>{
            child.parentId = this.id;
            child._rename(child.name);
        })
        this.identifiers.add(this.id);
    }


    _set(prop, newValue){
        log("entity", `(${this.name}) update ${prop} =>`, newValue)
        newValue = parseBest(newValue);
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

    async Rename(newName){
        //TODO: one shot => call _rename, if host, clone and del fbdb
        showNotification("Renaming entity is not supported yet");
        return;
    }

    async Set(property, value){
        if(property == "name"){
            this.Rename(value);
        }else{
            this.ref.child(property).set(value);
        }
    }
    
    Get(property){
        // Handle directional vectors
        const directions = {
            'forward': () => {
                // Forward is local +Z axis rotated by entity's rotation
                const rot = this.transform.rotation;
                return new BS.Vector3(
                    2 * (rot.x * rot.z + rot.w * rot.y),
                    2 * (rot.y * rot.z - rot.w * rot.x),
                    1 - 2 * (rot.x * rot.x + rot.y * rot.y)
                );
            },
            'backward': () => {
                const forward = this.Get('forward');
                return new BS.Vector3(-forward.x, -forward.y, -forward.z);
            },
            'right': () => {
                // Right is local +X axis rotated by entity's rotation
                const rot = this.transform.rotation;
                return new BS.Vector3(
                    1 - 2 * (rot.y * rot.y + rot.z * rot.z),
                    2 * (rot.x * rot.y + rot.w * rot.z),
                    2 * (rot.x * rot.z - rot.w * rot.y)
                );
            },
            'left': () => {
                const right = this.Get('right');
                return new BS.Vector3(-right.x, -right.y, -right.z);
            },
            'up': () => {
                // Up is local +Y axis rotated by entity's rotation
                const rot = this.transform.rotation;
                return new BS.Vector3(
                    2 * (rot.x * rot.y - rot.w * rot.z),
                    1 - 2 * (rot.x * rot.x + rot.z * rot.z),
                    2 * (rot.y * rot.z + rot.w * rot.x)
                );
            },
            'down': () => {
                const up = this.Get('up');
                return new BS.Vector3(-up.x, -up.y, -up.z);
            }
        };

        // Check if it's a directional property
        if(directions[property]){
            return directions[property]();
        }

        // Original logic for transform and entity properties
        let transformProperty = this.transform[property]
        if(transformProperty){
            return transformProperty;
        }
        return this[property];
    }

    async SetParent(newParentId, keepPosition){
        if(!keepPosition) keepPosition = true;
        let data = `entity_moved¶${this.id}¶${newParentId}¶${keepPosition}`
        networking.sendOneShot(data);
    }

    WatchTransform(properties, callback){
        log("watch", this.id, "transform", properties)
        let bs_props = properties.map(p=>BS.PropertyName[p]);
        this._bs.WatchTransform(bs_props, (e)=>{
            log("WatchTransform")
            if(SM.selectedEntity === this.id){
                inspector.propertiesPanel.updateTransform()
            }
            if(callback){
                callback({'target': this, 'transform': this.transform});
            }
        });
    }

    GetScript(scriptName){
        let scripts = this.components.filter(x=>x.type === "MonoBehavior" && x.properties.name === scriptName).map(x=>x.ctx);
        if(scripts.length === 0){
            return null;
        }
        return scripts[0];
    }
}