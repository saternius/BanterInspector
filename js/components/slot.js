let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { TransformComponent } = await import(`${basePath}/components/transform.js`);
const { deepClone } = await import(`${basePath}/utils.js`);

export class Slot{
    async init(slotData){
        this.name = slotData.name || `New_Slot_${Math.floor(Math.random()*99999)}`;
        this.parentId = slotData.parentId;
        this.components = slotData.components || [];
        this.children = slotData.children || [];
        this._bs = slotData._bs;
        this.active = true;
        this.persistent = true;
        


        if(!slotData._bs){
            let newGameObject = new BS.GameObject(this.name);
            this._bs = newGameObject;
            let parentSlot = SM.getSlotOrRoot(this.parentId);
            let parentGameObject = parentSlot._bs;
            if(parentGameObject){
                await newGameObject.SetParent(parentGameObject, true);
            }
            await newGameObject.SetActive(true);
        }
        
        this.id = (this.parentId) ? this.parentId + "/" + this.name : this.name;
        window.SM.slotData.slotMap[this.id] = this;
        return this;
    }

    getTransform(){
        return this.components.find(component => component.type === "Transform");
    }

    getComponent(componentType, index){
        index = index || 0;
        return this.components.find(component => component.type === componentType);
    }

    getComponents(componentType){
        return this.components.filter(component => component.type === componentType);
    }

    

    async _setParent(newParent){
        if (newParent === this) return;
        if (this.parentId) {
            const oldParent = SM.getSlotById(this.parentId);
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
        delete SM.slotData.slotMap[this.id];

        SM.deleteSpaceProperty(`__${this.id}/active:slot`, false);
        SM.deleteSpaceProperty(`__${this.id}/persistent:slot`, false);
        SM.deleteSpaceProperty(`__${this.id}/name:slot`, false);

        if(this.parentId){
            const parent = SM.getSlotById(this.parentId);
            if (parent) {
                parent.children = parent.children.filter(child => child.id !== this.id);
            }
        }
    }

    _deleteOldSpaceProperties(){
        let toDelete = [];
        Object.keys(SM.scene.spaceState.public).forEach(key=>{
            let lastSlash = key.lastIndexOf("/");
            let compID = key.slice(2, lastSlash).trim();
            let component = SM.getSlotComponentById(compID);
            //console.log(compID, "=>", component)
            if(!component) return;
            //console.log(`${component._slot.id} => ${this.id}`)
            if(component._slot.id === this.id){
                toDelete.push(key);
            }
        })
        //console.log(` deleting [${toDelete.length}] space properties..`)

        for(let key of toDelete){
            SM.deleteSpaceProperty(key, false);
        }
    }

    saveSpaceProperties(){
        //console.log(`saving space properties for ${this.id}`)
        SM.setSpaceProperty(`__${this.id}/active:slot`, this.active, false);
        SM.setSpaceProperty(`__${this.id}/persistent:slot`, this.persistent, false);
        SM.setSpaceProperty(`__${this.id}/name:slot`, this.name, false);
    }

    rename(newName, localUpdate){
        //console.log(`renaming ${this.id} to ${newName} : ${localUpdate}`)
        if(!localUpdate) this._deleteOldSpaceProperties();
        delete SM.slotData.slotMap[this.id]
        this.name = newName;
        this.id = this.parentId+"/"+this.name;
        SM.slotData.slotMap[this.id] = this;
        if(!localUpdate) this.saveSpaceProperties();
        this.children.forEach(child=>{
            child.parentId = this.id;
            child.rename(child.name, localUpdate);
        })
    }

    _set(prop, newValue){
        //console.log(`(${this.name}) update ${prop} =>`, newValue)
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
    }

    export(){
        return deepClone(this, ['_bs', '_slot', 'bsRef','_component','_scene','_BS','_running', '._owner']);
    }

    async Set(property, value){
        const spaceKey = '__' + this.id + '/' + property + ':slot';
        await SM.setSpaceProperty(spaceKey, value, false);
        if(property == "name"){
            this.rename(value, false);
        }
    }

    async SetParent(newParentId){
        await this._setParent(SM.getSlotOrRoot(newParentId), true);
        let data = `slot_moved:${this.id}:${newParentId}:0`
        SM.sendOneShot(data);
    }
}