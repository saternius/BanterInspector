const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`); 
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class ScriptRunnerComponent extends EntityComponent {
    constructor(){
        super();
        this._bsRef = null;
        this.inventoryItem = null;
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        if(options?.owner){
            this.properties._owner = options.owner;
        }
        this.ctx = (this.ctx) ? this.ctx : this.newScriptContext();
        this._scriptFunction = (this._scriptFunction) ? this._scriptFunction : null;
        this.type = "ScriptRunner";
        this.setId(this.id.replace("undefined","ScriptRunner"));

        let fileName = this.properties.file;
        if(fileName && fileName.length > 0){
            // Look up ScriptAsset and load if found
            const scriptAsset = SM.getScriptAsset(fileName);
            if (scriptAsset) {
                await this.LoadScript(fileName);
            } else {
                log("mono", `ScriptAsset "${fileName}" not found during init`);
                this.ctx._running = false;
            }
        }

        return this;
    }

    async _setMany(properties){
        //ensures file is last prop set
        for(let property in properties){
            if(property === "file") continue;
            await this._set(property, properties[property]);
        }
        await this._set("file", properties.file);
    }

    async _set(property, value){
        log("mono", "[MONO] updating property =>", property, value)
        value = parseBest(value);

        if(property === 'file'){
            if (value && value.length > 0) {
                await this.LoadScript(value);
            } else {
                // File cleared - stop script and clear vars
                if (this.ctx && this.ctx._running) {
                    await this._stop();
                }
                this.ctx.vars = {};
                this.properties.vars = {};
            }
        }

        this.properties[property] = value;
    }

    extractProperties(sceneComponent) {
        return {
            name: sceneComponent.name || "myScript",
            file: sceneComponent.file || null,
            vars: sceneComponent.vars || {}
        };
    }

    defaultProperties(){
        return {
            name: "myScript",
            file: null,
            vars: SM.props[`__${this.id}/vars:component`] || {},
            _owner: net.host
        }
    }

    amOwner(){
        return this.properties._owner === SM.myName()
    }

    async LoadScript(fileName) {
        if (!fileName || fileName.length === 0) {
            this.ctx._running = false;
            return;
        }

        // Find the ScriptAsset component by name
        const scriptAsset = SM.getScriptAsset(fileName);

        if (!scriptAsset) {
            log("mono", `ScriptAsset "${fileName}" not found`);
            return;
        }

        await this._loadScript(fileName, scriptAsset);
    }

    async _loadScript(fileName, scriptAsset) {
        if (!scriptAsset) {
            log("mono", `ScriptAsset "${fileName}" not found`);
            return;
        }

        const scriptContent = scriptAsset.properties.data;
        if (!scriptContent) {
            log("mono", `Script "${fileName}" has no data`);
            return;
        }

        // Stop current script if running
        if (this.ctx && this.ctx._running) {
            await this.ctx.onDestroy();
        }

        // Create new context
        this.ctx = this.newScriptContext();
        this._scriptFunction = new Function(scriptContent);

        // Initialize vars from ScriptAsset specification
        if (scriptAsset.properties.vars) {
            const varSpecs = scriptAsset.properties.vars;
            const historicalVars = SM.props[`__${this.id}/vars:component`] || {};
            const initializedVars = {};

            log("mono", "ScriptAsset varSpecs:", varSpecs);
            log("mono", "Historical vars:", historicalVars);
            log("mono", "Properties vars:", this.properties.vars);

            for (const [varName, varSpec] of Object.entries(varSpecs)) {
                // Priority: 1. Historical values, 2. Current properties, 3. ScriptAsset default
                if (historicalVars[varName] !== undefined) {
                    // Preserve existing value from space state
                    initializedVars[varName] = historicalVars[varName];
                    log("mono", `$${varName} =>`, JSON.stringify(historicalVars[varName]), "via historicalVars");
                } else if (this.properties.vars?.[varName] !== undefined) {
                    // Use value from properties
                    initializedVars[varName] = this.properties.vars[varName];
                    log("mono", `$${varName} =>`, JSON.stringify(this.properties.vars[varName]), "via properties");
                } else {
                    // Use ScriptAsset default
                    initializedVars[varName] = {
                        type: varSpec.type,
                        value: varSpec.value
                    };
                    log("mono", `$${varName} =>`, JSON.stringify(varSpec.value), "via ScriptAsset default");
                }
            }

            this.ctx.vars = initializedVars;
            this.properties.vars = initializedVars; // Update properties for persistence
        } else {
            // No vars defined in ScriptAsset
            this.ctx.vars = {};
            this.properties.vars = {};
        }

        // Execute the script function
        this._scriptFunction.call(this.ctx);

        await lifecycle.registerScriptRunner(this);
        this._start();

        log("mono", `Script "${fileName}" loaded successfully for ${this.properties.name} with ctx.vars:`, this.ctx.vars);

        // Update UI if this component is currently selected
        let selEnt = SM.getEntityById(SM.selectedEntity);
        if (selEnt) {
            let onPage = selEnt.components.filter(x => (x.type === "ScriptRunner" && x.properties.file === fileName)).length > 0;
            if (onPage) {
                inspector.propertiesPanel.render(SM.selectedEntity);
            }
        }

        // Dispatch event for UI refresh
        const event = new CustomEvent('script-refreshed', {
            detail: {
                componentId: this.id,
                name: this.properties.name,
                file: this.properties.file
            }
        });
        window.dispatchEvent(event);

        if (this._entity._finished_loading) {
            await this.ctx.onLoaded();
        }
    }

    async _start(){
        if(this.ctx._running) return;
        if(!this._entity.active) return;

        this.ctx._running = true;
        await this.ctx.onStart();

        if(this._entity._finished_loading){
            await this.ctx.onLoaded();
        }

        inspector.lifecyclePanel.render();
        log("mono", "started", this.id);
    }

    async _stop(){
        if(!this.ctx._running) return;
        if(!this._entity.active) return;

        this.ctx._running = false;
        await this.ctx.onDestroy();

        inspector.lifecyclePanel.render();
        log("mono", "stopped", this.id);
    }

    async _update(){
        // if(!this.hasOwnership()) return;
        if(!this.ctx._running) return;
        if(!this._entity.active) return;
        await this.ctx.onUpdate();
        // log("mono", "updated", this.id)
    }

    async _refresh(){
        if(!this._entity.active) return;

        const fileName = this.properties.file;
        if (!fileName || fileName.length === 0) {
            log("mono", "No script file to refresh");
            return;
        }

        log("mono", "refreshing script [", this.ctx._running, "]..");

        if(this.ctx._running){
            this.ctx._running = false;
            await this.ctx.onDestroy();
        }

        // Look up ScriptAsset and reload
        const scriptAsset = SM.getScriptAsset(fileName);
        if (scriptAsset) {
            await this._loadScript(fileName, scriptAsset);
        } else {
            log("mono", `ScriptAsset "${fileName}" not found for refresh`);
        }

        log("mono", "refreshed", this.id);
    }

    Start(){
        log("mono", `Starting ${this.fileName} on ${this.id}`)
        // const oneShot = 'scriptrunner_start¶' + this.id;
        // networking.sendOneShot(oneShot);
    }

    Stop(){
        log("mono", `Stopping ${this.fileName} on ${this.id}`)
        // const oneShot = 'scriptrunner_stop¶' + this.id;
        // networking.sendOneShot(oneShot);
    }

    Refresh(){
        log("mono", `Refreshing ${this.fileName} on ${this.id}`)
        // const oneShot = 'scriptrunner_refresh¶' + this.id;
        // networking.sendOneShot(oneShot);
    }



    newScriptContext(){
        let newContext =  {
            vars: SM.props[`__${this.id}/vars:component`] || this.properties.vars || {},
            _running: false, // Initialize _running to prevent undefined
            onStart: async ()=>{},
            onLoaded: async ()=>{},
            onUpdate: async ()=>{},
            onDestroy: async ()=>{},
            onVarChange: async (d,v)=>{},
            onKeyDown: ()=>{},
            onKeyUp: ()=>{},
            keyDown: ()=>{},
            keyUp: ()=>{},
            keyPress: ()=>{},
            log: (...args)=>{ console.log(...args)},
            _entity: this._entity, // Reference to the entity
            _scene: window.scene, // Reference to the scene
            _BS: window.BS, // Reference to BanterScript library
            _component: this
        }
        lifecycle.recordContext(newContext);
        return newContext;
    }

    async updateVar(varName, value) {
        if (!this.ctx || !this.ctx.vars) return;

        // Update locally first
        await this._updateVar(varName, value);

        // Note: Network sync would go here if needed
        // For now, changes are local only
        log("mono", "updated ctx.vars and properties.vars =>", varName, value);
    }

    async _updateVar(varName, value) {
        log("mono", "[MONO] updating var =>", varName, value)
        if (!this.ctx || !this.ctx.vars) return;
        this.properties.vars[varName] = value;
        this.ctx.vars[varName] = value;
        await this.ctx.onVarChange(varName, value);
    }

    // loadVarsFromSpaceState(){
    //     let key = "__" + this.id + "/vars:component";
    //     this.ctx.vars = SM.props[key] || {};
    // }

    async _destroy(){
        await super._destroy();
        this._stop();
        await lifecycle.unregisterScriptRunner(this);
        inspector.lifecyclePanel.render()
    }
}