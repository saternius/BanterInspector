import { TransformComponent } from './entity-components/transform.js';
import { deepClone, parseBest, eulerToQuaternion } from './utils.js';

export class Entity{
    async init(entityData, options){
        this.name = entityData.name || `New_Entity_${Math.floor(Math.random()*99999)}`;
        //log("init", "entity", this.name, entityData)
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
        this.keepPositionOnParenting = false;
        this.options = options || {};
        this.uuid = entityData.uuid || Math.floor(Math.random() * 10000000000000);
        SM.entityData.entityUUIDMap[this.uuid] = this;
        let parentEntity = SM.getEntityOrScene(this.parentId);
        if(!entityData._bs){
            let params = {name: this.name};
            let lp = entityData.localPosition;
            let lr = entityData.localRotation;
            let ls = entityData.localScale;
            // let p = entityData.position;
            // let r = entityData.rotation;
            // if(p){ params.position = new BS.Vector3(p.x, p.y, p.z) }
            // if(r){ params.rotation = new BS.Vector4(r.x, r.y, r.z, r.w) }
            if(lp){ params.localPosition = new BS.Vector3(lp.x, lp.y, lp.z) }
            if(lr){ params.localRotation = new BS.Vector4(lr.x, lr.y, lr.z, lr.w) }
            if(ls){ params.localScale = new BS.Vector3(ls.x, ls.y, ls.z) }
            if(parentEntity){ params.parent = parentEntity._bs; }
            params.layer = this.layer;
            params.active = this.active;
            let newGameObject = new BS.GameObject(params);
            if(params.parent){ //complain that this is needed
                setTimeout(async () => {
                    if(params.localPosition){ newGameObject.transform.localPosition = params.localPosition; }
                    if(params.localRotation){ newGameObject.transform.localRotation = params.localRotation; }
                    if(params.localScale){ newGameObject.transform.localScale = params.localScale; }
                }, 150);
            }
            this._bs = newGameObject;
        }

       

        this._bs.networkId = entityData.networkId;
        this.id = (this.parentId) ? this.parentId + "/" + this.name : this.name;
        this.identifiers.add(this.id);
        window.SM.entityData.entityMap[this.id] = this;
        this.initialized = true;
        this.transform = this._bs.transform;

        if(this.parentId){
            // Only set parent if the parent entity actually exists and is initialized
            if(parentEntity && parentEntity !== "building.." && parentEntity.initialized){
                this._setParent(parentEntity, true);
            }
            // Otherwise, the parent will claim this child when it processes the child_added event
        }
        this.setupRefs();
        
     
        
        if(this.options.context === "crawl"){
            //log("entity", "crawling", this.id)
            await this.meta_ref.set({
                active: this.active,
                layer: this.layer,
                localPosition: this.localPosition,
                localRotation: this.localRotation,
                localScale: this.localScale,
                position: this.position,
                rotation: this.rotation,
                uuid: this.uuid
            });
        }
        inspector.hierarchyPanel.render();
        return this;
    }

    setupRefs(){
         //setup db link
         this.ref = net.db.ref(`space/${net.spaceId}/${this.id}`);
         this.meta_ref = this.ref.child("__meta");
         this.meta_ref.child("active").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(data === null) return;
             this.active = data;
             this._bs.SetActive(this.active);
             inspector.hierarchyPanel.render();
         })
 
         this.meta_ref.child("layer").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             this.layer = data;
             this._bs.SetLayer(this.layer);
         })
 
         this.meta_ref.child("localPosition").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             if(data.x === this.transform.localPosition.x && data.y === this.transform.localPosition.y && data.z === this.transform.localPosition.z){
                return;
             }
             this.transform.localPosition = new BS.Vector3(data.x, data.y, data.z);
         })
 
         this.meta_ref.child("localRotation").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             if(data.x === this.transform.localRotation.x && data.y === this.transform.localRotation.y && data.z === this.transform.localRotation.z && data.w === this.transform.localRotation.w){
                return;
             }
             this.transform.localRotation = new BS.Vector4(data.x, data.y, data.z, data.w);
         })
 
         this.meta_ref.child("localScale").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             if(data.x === this.transform.localScale.x && data.y === this.transform.localScale.y && data.z === this.transform.localScale.z){
                return;
             }
             this.transform.localScale = new BS.Vector3(data.x, data.y, data.z);
         })
 
         this.meta_ref.child("position").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             if(data.x === this.transform.position.x && data.y === this.transform.position.y && data.z === this.transform.position.z){
                return;
             }
             this.transform.position = new BS.Vector3(data.x, data.y, data.z);
         })
 
         this.meta_ref.child("rotation").on("value", (snapshot)=>{
             let data = snapshot.val();
             if(!data) return;
             if(data.x === this.transform.rotation.x && data.y === this.transform.rotation.y && data.z === this.transform.rotation.z && data.w === this.transform.rotation.w){
                return;
             }
             this.transform.rotation = new BS.Vector4(data.x, data.y, data.z, data.w);
         })
 
 
 
         // handle component changes
         this.meta_ref.child("components").on("child_added", async (snapshot)=>{
             let data = snapshot.val();
             let component = SM.getEntityComponentById(snapshot.key, false);
             //log(`Entity[${this.id}]`, `${!component ? "new" : "existing"} component added`, snapshot.key, data)
             if(!component){
                let data = await net.db.ref(`space/${net.spaceId}/components/${snapshot.key}`).once('value');
                data = data.val();
                data.id = snapshot.key;
                let componentClass = componentTypeMap[snapshot.key.split("_")[0]];
                component = await new componentClass().init(this, null, data);
             }
             let hasComponent = this.components.find(c=>c.id === snapshot.key);
             if(!hasComponent){
                //log(`Entity[${this.id}]`, `does not have ${snapshot.key} => adding`)
                await this._addComponent(component);
             }
         })

         this.meta_ref.child("components").on("child_removed", async (snapshot)=>{
             let data = snapshot.val();
             //log("entity", "component removed", snapshot.key, data)
             let component = SM.getEntityComponentById(snapshot.key);
             if(component){
                //log(`Entity[${this.id}]`, "removing component", snapshot.key)
                await this._removeComponent(component);
             }
         })
 
         this.startListeningForChildChanges = ()=>{
              // handle children changes
             this.ref.on("child_added", async (snapshot)=>{
                 let key = snapshot.key;
                 if(key === "__meta"){
                     return;
                 }
 
                 window.lastAddedChild = snapshot;
                 let data = snapshot.val();
                 let targetEntity = SM.entityData.entityUUIDMap[data.__meta.uuid];
                
                 if(targetEntity){
                    log("ENTITY_REF_REDUNDANT", key, this.id, data, targetEntity)
                    if(targetEntity === "building.."){
                       // Entity is still being built, wait for it to complete then establish parent relationship
                       const checkInterval = setInterval(() => {
                           const builtEntity = SM.entityData.entityUUIDMap[data.__meta.uuid];
                           log("ENTITY_REF_REDUNDANT_CHECK", key, this.id, data, builtEntity)
                           if(builtEntity && builtEntity !== "building.." && builtEntity.initialized){
                               clearInterval(checkInterval);
                               // Only set parent if not already correctly parented
                               if(!this.children.includes(builtEntity)){
                                   this._addChild(builtEntity);
                               }
                           }
                       }, 50);
                       // Set a timeout to prevent infinite waiting
                       setTimeout(() => clearInterval(checkInterval), 5000);
                       return;
                    }

                    if(this.id === targetEntity.parentId){
                        //log( `Renaming in place  [${targetEntity.id}] => [${key}]`)
                        targetEntity._rename(key);
                    }else{
                        targetEntity._setParent(this);
                    }
                 }else{ 
                     SM.entityData.entityUUIDMap[data.__meta.uuid] = "building.."
                     log("ENTITY_REF_NEW", key, this.id, data)
                     data.parentId = this.id;
                     data.name = key;
                     let expected_id = this.id + "/" + key;
                     let existingEntity = SM.getEntityById(expected_id);
                     if(existingEntity){
                        log("ENTITY_REF_REDUNDANT", key, this.id, data, existingEntity)
                        return;
                     }
                     let newEntity = new Entity()
                     await newEntity.init(data);
                     SM.entityData.entityUUIDMap[data.__meta.uuid] = newEntity;
                 }
               
                 inspector.hierarchyPanel.render();
             })
 
             this.ref.on("child_removed", async (snapshot)=>{ // handles conditions where child is deleted or moved to a different parent.
                let key = snapshot.key;
                 if(key === "__meta"){
                     return;
                 }
                 let data = snapshot.val();
                 //log("ENTITY_REF_REMOVED", key, this.id, data)
                 let targetID = this.id + "/" + key;
                 let targetEntity = SM.getEntityById(targetID);
                 if(targetEntity){
                    SM.garbage.push(targetEntity);
                    this.children = this.children.filter(child => child !== targetEntity);
                    setTimeout(()=>{
                        //check if still orphaned, if so destroy it
                        let claimedParent = SM.getEntityById(targetEntity.parentId);
                        if(!claimedParent || !claimedParent.children.includes(targetEntity)){
                            targetEntity._destroy();
                        }
                    }, 500);
                }
                if(data.__meta.destroyed){
                    await targetEntity._destroy();
                }
                 inspector.hierarchyPanel.render();
                 
             })
         }

         if(SM.loaded){
            this.startListeningForChildChanges();
        }
    }

    get localPosition(){
        if(!this.transform) return {x:0,y:0,z:0};
        return this.transform.localPosition;
    }
    get localRotation(){
        if(!this.transform) return {x:0,y:0,z:0,w:1};
        return this.transform.localRotation;
    }
    get localScale(){
        if(!this.transform) return {x:1,y:1,z:1};
        return this.transform.localScale;
    }
    get position(){
        if(!this.transform) return {x:0,y:0,z:0};
        return this.transform.position;
    }
    get rotation(){
        if(!this.transform) return {x:0,y:0,z:0,w:1};
        return this.transform.rotation;
    }
    get scale(){
        if(!this.transform) return {x:1,y:1,z:1};
        return this.transform.scale;
    }

    GetComponent(componentType, index = 0){
        return this.components.filter(component => component.type === componentType)[index];
    }

    AddComponent(component){
        this.meta_ref.child("components").child(component.id).set(true);
        this._addComponent(component);
    }

    async _addComponent(component){
        if(this.components.includes(component)){
            return;
        }
        this.components.push(component);
        SM.entityData.componentMap[component.id] = component;
        component._entity = this;
        inspector.propertiesPanel.render();
    }

    RemoveComponent(component){
        this.meta_ref.child("components").child(component.id).remove();
        this._removeComponent(component);
    }

    async _removeComponent(component){ //This should deref instead of destroy in the future.
        await component._destroy();
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
        let scripts = this.components.filter(c=>c.type === "ScriptRunner");
        scripts.forEach(async script=>{
            await script.ctx.onLoaded();
        })
    }

    // async _checkForGhostComponents(id){
    //     let visible_components = this.components.map(x=>x._bs)
    //     Object.values(this._bs.components).forEach(async bs_comp => {
    //         if(!visible_components.includes(bs_comp)){
    //             log("entity", this.id, "ghost component found: ", bs_comp.type, componentTextMap[bs_comp.type])
    //             if(bs_comp.type === 34){
    //                 //This is UI
    //                 return;
    //             }
    //             let component_ref = `${componentTextMap[bs_comp.type]}_${id}`
    //             let props = {
    //                 id: component_ref
    //             }
    //             let componentClass = componentBSTypeMap[bs_comp.componentType];
    //             let entityComponent = await new componentClass().init(this, bs_comp, props, {context: "ghost"});
    //             this.AddComponent(entityComponent);
    //             SM.entityData.componentMap[component_ref] = entityComponent;
    //             inspector.propertiesPanel.render(this.id);
    //         }
    //     })
    // }

    _addChild(child){
        log("ENTITY_ADD_CHILD", child.id, this.id)
        child.parentId = this.id;
        if(this.children.includes(child)){
            return;
        }
        this.children.push(child);
        child._bs.SetParent(this._bs, this.keepPositionOnParenting);
        return child;
    }

    async _setParent(newParent, firstAttempt){
        // Always validate parent exists
        if(!newParent || newParent === "building..") return;

        if(!firstAttempt){
            if (newParent === this) return;
            if (this.parentId) {
                const oldParent = SM.getEntityById(this.parentId);
                if(oldParent === newParent){
                    this._rename(this.name);
                    return;
                }
                if(oldParent){
                    oldParent.children = oldParent.children.filter(child => child.id !== this.id);
                }
            }
        }

        newParent._addChild(this);
        this._rename(this.name);
    }

    async Rename(newName){
        await this._rename(newName);
    }

    _renameDownwards(){
        this.identifiers.add(this.id);
        delete SM.entityData.entityMap[this.id]
        this.id = this.parentId+"/"+this.name;
        SM.entityData.entityMap[this.id] = this;
        this._bs.SetName(this.id);
        // Update component _entityId references to the new ID
        this.components.forEach(component=>{
            component._entityId = this.id;
        });
        this.children.forEach(child=>{
            child._renameDownwards();
        })
        if(this.meta_ref){
            this.meta_ref.child("components").off();
            this.meta_ref.child("active").off();
            this.meta_ref.child("layer").off();
            this.meta_ref.child("localPosition").off();
            this.meta_ref.child("localRotation").off();
            this.meta_ref.child("localScale").off();
            this.meta_ref.child("position").off();
            this.meta_ref.child("rotation").off();
            this.meta_ref.off();
        }
        if(this.ref){
            this.ref.off();
        }
        this.setupRefs();
    }

    async _rename(newName){
        log("RENAMING ENTITY", this.id, "=>", newName)
        let newId = this.parentId+"/"+newName;
        if(this.id === newId){
            log("RENAMING ENTITY", this.id, "=>", newName, "=> same name, skipping")
            return;
        }

        let origRef = this.ref;
        if(!origRef){
            this.ref = net.db.ref(`space/${net.spaceId}/${this.parentId}/${this.name}`);
        }

        this.name = newName;
        this._renameDownwards();

        const snapshot = await origRef.once('value');
        let parentRef = net.db.ref(`space/${net.spaceId}/${this.parentId}`);
        let newSnapshot = snapshot.val();
        log('entity', 'renaming', this.id, '=>', newId, 'with snapshot', newSnapshot)
        await parentRef.child(newName).set(newSnapshot);
        origRef.remove();
    }


    async Destroy(){
        await this.meta_ref.child("destroyed").set(true);
        this.ref.remove();
    }

    async _destroy(){
        this._stagedForDestruction = true;
        
        let scriptrunners = [...this.components.filter(component => component.type === "ScriptRunner")];
        for(let scriptrunner of scriptrunners){
            await scriptrunner._destroy();
        }

        let children = [...this.children];
        for(let child of children){
            await child._destroy();
        }

        let components = [...this.components];
        for(let component of components){
            if(component.type === "ScriptRunner") continue;
            await component._destroy();
        }

        await this._bs.Destroy();
        delete SM.entityData.entityMap[this.id];
        delete SM.entityData.entityUUIDMap[this.uuid];
        if(this.parentId){
            const parent = SM.getEntityById(this.parentId);
            if (parent) {
                parent.children = parent.children.filter(child => child.id !== this.id);
            }
        }
        if(SM.garbage.includes(this)){
            SM.garbage = SM.garbage.filter(entity => entity.id !== this.id);
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

 
   

    _set(prop, newValue){
        newValue = parseBest(newValue);
        if(prop == "active"){
            if(newValue === this.active) return;
            this.active = newValue;
            this._bs.SetActive(newValue);
            this.components.forEach(component => {
                if(component.type === "ScriptRunner"){
                    if(newValue){
                        component._refresh();
                    }else{
                        component._stop();
                    }
                }
            });
        }else if(prop == "persistent"){
            if(newValue === this.persistent) return;
            this.persistent = newValue;
        }else if(prop == "layer"){
            if(newValue === this.layer) return;
            this.layer = newValue;
            this._bs.SetLayer(newValue);
        }else if(prop == "localPosition"){
            if(newValue === this.localPosition) return;
            this.transform.localPosition = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }else if(prop == "localRotation"){
            if(newValue === this.localRotation) return;
            if ('w' in newValue) {
                newValue.w = parseFloat(newValue.w || 1);
            } else {
                newValue = eulerToQuaternion(newValue);
            }
            this.transform.localRotation = new BS.Vector4(newValue.x, newValue.y, newValue.z, newValue.w);
        }else if(prop == "localScale"){
            if(newValue === this.localScale) return;
            this.transform.localScale = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }else if(prop == "position"){
            if(newValue === this.position) return;
            this.transform.position = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        }else if(prop == "rotation"){
            if(newValue === this.rotation) return;
            this.transform.rotation = new BS.Vector4(newValue.x,newValue.y, newValue.z, newValue.w)
        }
        // if(prop == "scale"){
        //     this.transform.scale = new BS.Vector3(newValue.x,newValue.y, newValue.z)
        // }
    }

    async export(){
        const snapshot = await this.ref.once('value');
        let entityData = snapshot.val();
        const componentsData = {};
        

        // Collect components from this entity
        for (const x of this.components) {
            componentsData[x.id] = x.properties;
        }

        // Collect components from all descendants
        const descendants = this.getAllDescendants();
        for (const descendant of descendants) {
            for (const x of descendant.components) {
                componentsData[x.id] = x.properties;
            }
        }

        return {
            Entity: { [this.name]: entityData },
            Components: componentsData
        }
    }

   

    async Set(property, value){
        let newValue = parseBest(value);
        if(property == "name"){
            this.Rename(value);
        }else{
            log("entity", "Set =>", this.id, property, newValue)
            this.meta_ref.update({[property]: newValue});
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

    async SetParent(newParentId){
        let newParent = SM.getEntityById(newParentId);
        if(!newParent){
            err("entity", "SetParent", "New parent not found", newParentId)
            return;
        }
        let origRef = this.ref;
        const snapshot = await this.ref.once('value');
        await newParent.ref.child(this.name).set(snapshot.val());
        origRef.remove();
    }

    WatchTransform(properties, callback){
        //log("watch", this.id, "transform", properties)
        let bs_props = properties.map(p=>BS.PropertyName[p]);
        //log("watch", this.id, "bs_props", bs_props)
        this._bs.WatchTransform(bs_props, (e)=>{
            //log("WatchTransform")
            if(SM.selectedEntity === this.id){
                inspector.propertiesPanel.updateTransform()
            }
            if(callback){
                callback({'target': this, 'transform': this.transform});
            }
        });
    }

    GetScript(scriptName){
        let scripts = this.components.filter(x=>x.type === "ScriptRunner" && x.properties.name === scriptName).map(x=>x.ctx);
        if(scripts.length === 0){
            return null;
        }
        return scripts[0];
    }

    GetChild(childName){
        let children = this.children.filter(x=>x.name === childName);
        if(children.length === 0){
            return null;
        }
        return children[0];
    }

    getAllDescendants(){
        let descendants = [];

        // Recursive helper function to collect all descendants
        const collectDescendants = (entity) => {
            for(let child of entity.children){
                descendants.push(child);
                collectDescendants(child);
            }
        };

        collectDescendants(this);
        return descendants;
    }
}