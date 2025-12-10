const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class EntityComponent{
    constructor(){
        this._bsRef = null;
        this._lastUpdate = new Map();
        this._initialized = false;
        this.options = {};
    }

    async init(entity, sceneComponent, properties, options){
        this.id = properties?.id || `${this.type}_${Math.floor(Math.random()*99999)}`;
        this._entity = entity;
        this.properties = (properties) ? this.fillProperties(properties) : this.defaultProperties();
        this.options = options || {};
        this.loadAsync = options?.loadAsync || false;
      //
        if(sceneComponent){
            this.properties = this.extractProperties(sceneComponent);
            this._bs = sceneComponent;
        }else{
            if(this._bsRef){
                let newComponent = await entity._bs.AddComponent(new this._bsRef());
                this._bs = newComponent;
            }
            await this._setMany(this.properties)
        }
        window.SM.entityData.componentMap[this.id] = this;
        delete this.properties.id;
        this._initialized = true;


        //link db
        this.ref = net.db.ref(`space/${net.spaceId}/components/${this.id}`);
        

        this.ref.on("value", (snapshot)=>{
            let data = snapshot.val();
            if(data === null) return;
            delete data.id;
            for(let p in data){
                let v1 = JSON.stringify(this.properties[p]);
                let v2 = JSON.stringify(data[p]);
                if(v1 !== v2){
                    //log("component", `${this.id} is setting ${p} from ${v1} to ${v2}`)
                    this._set(p, data[p]);
                }else{
                    //log("component", `${v1} is the same as ${v2}`)
                }
            }

            let defaultProperties = this.defaultProperties();

            // Handle properties that were deleted from Firebase
            for(let p in defaultProperties){
                if(!(p in data)){
                    this._set(p, defaultProperties[p]);
                }
            }
        })

        if(this.options.context === "crawl" || this.options.context === "spawn"){
            await this.ref.set(this.properties);
        }
        return this;
    }

    

    enums(){
        return {};
    }

    setId(id){
        delete window.SM.entityData.componentMap[this.id];
        this.id = id;
        window.SM.entityData.componentMap[this.id] = this;
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
        for(let property in properties){
            await this._set(property, properties[property]);
        }
    }
 
    async _set(property, value){
        value = parseBest(value);
        this.properties[property] = value;
        this._bs[property] = value;
    }

    async _destroy(){
        this.ref.remove();
        if(this._bs){
            this._bs.Destroy();
        }
        let idx = this._entity.components.indexOf(this);
        if(idx !== -1){
            this._entity.components.splice(idx, 1);
            delete SM.entityData.componentMap[this.id];
            inspector.propertiesPanel.render(this._entity.id);
        }
    }
    
    async Set(property, value){
        // Firebase will delete the property if value is null
        if (value === null) {
            // Use remove() for null values to ensure Firebase deletes the field
            await this.ref.child(property).remove();
        } else {
            await this.ref.update({[property]: value});
        }
    }

    WatchProperties(properties, callback){
        let bs_props = properties.map(p=>BS.PropertyName[p]);
        log("WatchProperties", this.id, properties)
        this._bs.WatchProperties(bs_props, ()=>{
            log("WatchProperties", this.id, properties)
            for(let p of properties){
                this.properties[p] = this._bs[p];
                if(SM.selectedEntity === this._entity.id){
                    inspector.propertiesPanel.updateProperty(this.id, p, this._bs[p])
                }
            }
            if(callback){
                callback({'target': this, 'properties': this.properties});
            }
        });
        return this;
    }
}