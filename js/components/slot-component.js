export class SlotComponent{
    constructor(){
        this.bsRef = null;
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
        const spaceState = SM.scene?.spaceState;
        
        if (spaceState) {
            // Check both public and protected properties
            ['public', 'protected'].forEach(type => {
                const props = spaceState[type];
                Object.keys(props).forEach(key => {
                    if (key.includes(`__${this.id}/`)) {
                        propsToRemove.push({ key, isProtected: type === 'protected' });
                    }
                });
            });
            
            // Remove the properties
            for (const { key, isProtected } of propsToRemove) {
                await SM.deleteSpaceProperty(key, isProtected);
            }
        }

        inspectorApp.propertiesPanel.render(this._slot.id);
    }

    async Set(property, value){
        const spaceKey = `__${this.id}/${property}:component`;
        await SM.setSpaceProperty(spaceKey, value, false);
    }
}