export class SlotComponent{
    constructor(){
        this.bsRef = null;
        this.lastUpdate = new Map();
    }

    async init(slot, sceneComponent, properties){
        //console.log("init component =>", properties)
        this.id = properties?.id || `${this.type}_${Math.floor(Math.random()*99999)}`;
        this._slot = slot;
        this.properties = (properties) ? this.fillProperties(properties) : this.defaultProperties();
        
        if(sceneComponent){
            this.properties = this.extractProperties(sceneComponent);
            this._bs = sceneComponent;
        }else{
            if(this.bsRef){
                let newComponent = await slot._bs.AddComponent(new this.bsRef());
                this._bs = newComponent;
                this._setMany(this.properties)
            }
        }
        
        window.SM.slotData.componentMap[this.id] = this;
        return this;
    }

    setId(id){
        delete window.SM.slotData.componentMap[this.id];
        this.id = id;
        window.SM.slotData.componentMap[this.id] = this;
    }

    async defaultProperties(){
        return {};
    }

    fillProperties(properties){
        let newProps = this.defaultProperties();
        for(let p in properties){
            if(newProps[p] !== undefined){
                newProps[p] = properties[p];
            }
        }
        return newProps;
    }

    async extractProperties(sceneComponent){
        return {};
    }

    

    async _setMany(properties){
        //console.log(`(${this._slot.name})[${this.type}] setMany`, properties)
        for(let property in properties){
            await this._set(property, properties[property]);
        }
    }

    async _setWithTimestamp(property, value, timestamp){
        if(this.lastUpdate.has(property)){
            if(this.lastUpdate.get(property) >= timestamp){
                return;
            }
        }
        this.lastUpdate.set(property, timestamp);
        this._set(property, value);
    }

    async _set(property, value){
        //console.log(`(${this._slot.name})[${this.type}] set ${property} =>`, value)
        this.properties[property] = value;
        this._bs[property] = value;
    }

    async _destroy(){
        if(this._bs){
            this._bs.Destroy();
        }
        //console.log("deleting component =>", this.id)
        this._slot.components.splice(this._slot.components.indexOf(this), 1);
        delete SM.slotData.componentMap[this.id];
        
        // Remove any space properties associated with this component
        const propsToRemove = [];
        // Check both public and protected properties
        Object.keys(SM.props).forEach(key => {
            if (key.includes(`__${this.id}/`)) {
                propsToRemove.push(key);
            }
        });
        // Remove the properties
        for (const key of propsToRemove) {
            delete SM.props[key];
        }
        

        inspector.propertiesPanel.render(this._slot.id);
    }

    async Set(property, value){
        if(typeof value === "object"){
            value = JSON.stringify(value);
        }
        let message = `update_component:${this.id}:${property}:${value}`;
        SM.props[`__${this.id}/${property}:component`] = value;
        await networking.sendOneShot(message);
    }
}