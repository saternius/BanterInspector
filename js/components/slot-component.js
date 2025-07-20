export class SlotComponent{
    constructor(){
        this.bsRef = null;
    }

    async init(slot, sceneComponent, properties){
        this.id = properties?.id || `${this.type}_${Math.floor(Math.random()*99999)}`;
        this._slot = slot;
        this.properties = (properties) ? properties : this.defaultProperties();
        if(sceneComponent){
            this.properties = this.extractProperties(sceneComponent);
            this._bs = sceneComponent;
        }else{
            if(this.bsRef){
                let newComponent = await slot._bs.AddComponent(new this.bsRef());
                this._bs = newComponent;
                this.updateMany(this.properties)
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

    async extractProperties(sceneComponent){
        return {};
    }

    async updateMany(properties){
        console.log(`(${this._slot.name})[${this.type}] updateMany`, properties)
        for(let property in properties){
            await this.update(property, properties[property]);
        }
    }

    async update(property, value){
        console.log(`(${this._slot.name})[${this.type}] update ${property} =>`, value)
        this.properties[property] = value;
        this._bs[property] = value;
    }

    async destroy(){
        if(this._bs){
            this._bs.Destroy();
        }
    }
}