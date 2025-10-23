const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class EntityComponent{
    constructor(){
        this._bsRef = null;
        this._lastUpdate = new Map();
        this._initialized = false;
        this.options = {};
        this.spaceProps = {};
        this.verificationTimeout = null;
        this._pendingVerifications = new Map(); // Track pending verifications by property
        this._verificationTokens = new Map(); // Track cancellation tokens for each property
        setTimeout(()=>{
            this.properties.enabled = true;
        }, 500) // this is a haack
    }

    async init(entity, sceneComponent, properties, options){
        this.id = properties?.id || `${this.type}_${Math.floor(Math.random()*99999)}`;
        this._entity = entity;
        this.properties = (properties) ? this.fillProperties(properties) : this.defaultProperties();
        this.options = options || {};
        this.loadAsync = options?.loadAsync || false;
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
        this._initialized = true;
        this.checkSpaceDiff();
        return this;
    }

    getSpaceProps(){
        this.properties.enabled = true;
        return this.properties;
    }

    checkSpaceDiff(){
        if(!SM.iamHost) return;
        let current = this.spaceProps;
        let newProps = this.getSpaceProps();
        let diff = Object.keys(newProps).filter(key=>{
            if(current[key] === undefined) return true;
            if(current[key] !== newProps[key]) return true;
            return false;
        });

        if(diff.length > 0){
            diff.forEach(k=>{
                let spaceKey = `__${this.id}:${k}`;
                networking.setSpaceProperty(spaceKey, newProps[k], true);
            })
            this.spaceProps = JSON.parse(JSON.stringify(newProps));
        }
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

    async _setWithTimestamp(property, value, timestamp){
        if(this._lastUpdate.has(property)){
            if(this._lastUpdate.get(property) >= timestamp){
                return;
            }
        }
        this._lastUpdate.set(property, timestamp);
        this._set(property, value);
    }

    async _set(property, value){
        value = parseBest(value);
        this.properties[property] = value;
        this._bs[property] = value;
        this.checkSpaceDiff();
    }

    async _destroy(){
        if(this._bs){
            this._bs.Destroy();
        }
        this._entity.components.splice(this._entity.components.indexOf(this), 1);
        delete SM.entityData.componentMap[this.id];
        
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
        

        inspector.propertiesPanel.render(this._entity.id);
    }
    async verifyComponentExistance(attempts = 0, cancellationToken = null){
        let entKey = `__${this.id}:enabled`
        log("verifyComponentExistance", "Verifying existence of", this.id, "with key", entKey, "and value", scene.spaceState.public[entKey]);

        // Check if verification was cancelled
        if(cancellationToken && cancellationToken.cancelled){
            log("verifyComponentExistance", "Verification cancelled for", this.id);
            return false;
        }

        if(scene.spaceState.public[entKey]){
            return true;
        }
        if(attempts > 30){
            return false;
        }

        // Check cancellation before waiting
        if(cancellationToken && cancellationToken.cancelled){
            log("verifyComponentExistance", "Verification cancelled before wait for", this.id);
            return false;
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        // Check cancellation after waiting
        if(cancellationToken && cancellationToken.cancelled){
            log("verifyComponentExistance", "Verification cancelled after wait for", this.id);
            return false;
        }

        return await this.verifyComponentExistance(attempts + 1, cancellationToken);
    }

    async Set(property, value){
        // Check if there's already a pending verification for this property
        const propertyKey = `${property}:${JSON.stringify(value)}`;

        if(this._pendingVerifications.has(propertyKey)){
            log("Set", "Duplicate Set() call for", this.id, property, "- ignoring");
            return; // Same property and value is already being processed
        }

        // Cancel any existing verification for this property (different value)
        const existingKeys = Array.from(this._pendingVerifications.keys()).filter(k => k.startsWith(`${property}:`));
        for(const key of existingKeys){
            const token = this._verificationTokens.get(key);
            if(token){
                token.cancelled = true;
                log("Set", "Cancelling previous verification for", this.id, property);
            }
            this._pendingVerifications.delete(key);
            this._verificationTokens.delete(key);
        }

        // Create new cancellation token for this verification
        const cancellationToken = { cancelled: false };
        this._verificationTokens.set(propertyKey, cancellationToken);
        this._pendingVerifications.set(propertyKey, true);

        try {
            // Run verification with cancellation token
            const verified = await this.verifyComponentExistance(0, cancellationToken);

            // Check if verification was cancelled during execution
            if(cancellationToken.cancelled){
                log("Set", "Verification was cancelled for", this.id, property);
                return;
            }

            if(!verified){
                log("Set", "Component verification failed for", this.id);
                return;
            }

            // Proceed with the Set operation
            if(typeof value === "object"){
                value = JSON.stringify(value);
            }
            let message = `update_component¶${this.id}¶${property}¶${value}`;
            SM.props[`__${this.id}/${property}:component`] = value;
            await networking.sendOneShot(message);
        } finally {
            // Clean up tracking for this property
            this._pendingVerifications.delete(propertyKey);
            this._verificationTokens.delete(propertyKey);
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