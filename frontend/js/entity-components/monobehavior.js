const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`); 
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class MonoBehaviorComponent extends EntityComponent {
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
        this.type = "MonoBehavior";
        this.setId(this.id.replace("undefined","MonoBehavior"));
        let fileName = this.properties.file;
        if(fileName && fileName.length > 0){
            // if(networking.spaceState["#"+fileName]){
            //     await this._loadScript(fileName);
            // }else if(window.inventory?.items?.[fileName]){
            //     this.LoadScript(fileName);
            // }else{
            //     this.ctx._running = false;
            // }
        }
        
        // setTimeout(()=>{
        //     this.loadVarsFromSpaceState();
        // }, 10)
        
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
            await this.LoadScript(value);
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
        // if(!this._entity.active) return;
        // this.inventoryItem = window.inventory?.items?.[fileName];
        // // if(!this.hasOwnership()){
        // //     return;
        // // }
        // if (!this.inventoryItem || this.inventoryItem.itemType !== 'script') {
        //     log("mono", `Script "${fileName}" not found in inventory`);
        //     return;
        // }

        // let scriptContent = this.inventoryItem.data;
        // let scriptKey = '#'+fileName;
        // if(networking.spaceState[scriptKey] === undefined || networking.spaceState[scriptKey] !== scriptContent){
        //     networking.setSpaceProperty(scriptKey, scriptContent, false);
        //     log("Mono", "Setting script content", scriptKey, scriptContent)
        // }else{
        //     networking.sendOneShot("load_script¶"+fileName+"¶"+this.id);
        // }
    }

    async _loadScript(fileName, attempts = 0) {
        // let scriptKey = '#'+fileName;
        // let scriptContent = networking.spaceState[scriptKey];
        // log("mono", "scriptContent", scriptContent)
        // if(!scriptContent && inventory?.items?.[fileName]){
        //     scriptContent = inventory.items[fileName].data;
        // }
        // if(!scriptContent){
        //     log("mono", `Script "${fileName}" not found in space state, retrying... (${attempts})`);
        //     await new Promise(r => setTimeout(r, 200));
        //     if(attempts > 10){
        //         log("mono", `Script "${fileName}" not found in space state, giving up...`);
        //         return;
        //     }
        //     return await this._loadScript(fileName, attempts + 1);
        // }
        
        // if(this.ctx && this.ctx._running){
        //     await this.ctx.onDestroy();
        // }

        // this.ctx = this.newScriptContext();
        // this._scriptFunction = new Function(`
        //     ${scriptContent}
        // `);
        
        // // Extract vars definition if present
        // if (this.ctx.vars) {
        //     // Initialize vars with defaults
        //     const varDefinitions = this.ctx.vars;
        //     const historicalVars = SM.props[`__${this.id}/vars:component`] || {};
        //     const initializedVars = {};
        //     log("mono", "varDefinitions", varDefinitions)
        //     log("mono", "historicalVars", historicalVars)
        //     log("mono", "properties.vars", this.properties.vars)

        //     for (const [varName, varDef] of Object.entries(varDefinitions)) {
        //         if(this.properties.vars[varName] !== undefined){
        //             initializedVars[varName] = this.properties.vars[varName];
        //             log("mono", `$${varName} => ${this.properties.vars[varName]} via properties`)
        //         }
        //         else if (historicalVars[varName] !== undefined) {
        //             // Use existing value
        //             initializedVars[varName] = historicalVars[varName];
        //             log("mono", `$${varName} => ${historicalVars[varName]} via historicalVars`)
        //         } else if (varDef.default !== undefined) {
        //             // Use default value
        //             initializedVars[varName] = varDef.default;
        //             log("mono", `$${varName} => ${varDef.default} via varDef.default`)
        //         } else {
        //             // Initialize based on type
        //             switch (varDef.type) {
        //                 case 'number':
        //                     initializedVars[varName] = 0;
        //                     break;
        //                 case 'string':
        //                     initializedVars[varName] = '';
        //                     break;
        //                 case 'boolean':
        //                     initializedVars[varName] = false;
        //                     break;
        //                 case 'vector3':
        //                     initializedVars[varName] = { x: 0, y: 0, z: 0 };
        //                     break;
        //                 case 'color':
        //                     initializedVars[varName] = { r: 1, g: 1, b: 1, a: 1 };
        //                     break;
        //                 default:
        //                     initializedVars[varName] = null;
        //             }
        //             log("mono", `$${varName} => ${initializedVars[varName]} via varDef.type`)
        //         }
        //     }
            
        //     this.ctx.vars = {...this.ctx.vars, ...initializedVars};
        // }

        // this._scriptFunction.call(this.ctx);
        // await lifecycle.registerMonoBehavior(this);  
        // this._start();  
        // log("mono", `Script "${fileName}" loaded successfully for ${this.properties.name} with ctx.vars: `, this.ctx.vars);
        // let selEnt = SM.getEntityById(SM.selectedEntity);
        // if(selEnt){
        //     let onPage = selEnt.components.filter(x=>(x.type==="MonoBehavior" && x.properties.file === fileName)).length > 0
        //     if(onPage){
        //         inspector.propertiesPanel.render(SM.selectedEntity);
        //     }
        // }

        // const event = new CustomEvent('script-refreshed', {
        //     detail: {
        //         componentId: this.id,
        //         name: this.properties.name,
        //         file: this.properties.file
        //     },
            
        // });
        // window.dispatchEvent(event);
        // if(this._entity._finished_loading){
        //     await this.ctx.onLoaded();
        // }
    }

    async _start(){
        // if(!this.hasOwnership()) return;
        // if(this.ctx._running) return;
        // if(!this._entity.active) return;
        // this.ctx._running = true;
        // await this.ctx.onStart();
        // if(this._entity._finished_loading){
        //     await this.ctx.onLoaded();
        // }
        // let message = `update_monobehavior¶${this.id}¶_running¶true`;
        // networking.sendOneShot(message);
        // inspector.lifecyclePanel.render()
        // log("mono", "started", this.id)
    }

    async _stop(){
        // if(!this.hasOwnership()) return;
        // if(!this.ctx._running) return;
        // if(!this._entity.active) return;
        // this.ctx._running = false;
        // await this.ctx.onDestroy();
        // let message = `update_monobehavior¶${this.id}¶_running¶false`;
        // networking.sendOneShot(message);
        // inspector.lifecyclePanel.render()
        // console.log("monobehavior", "stopped", this.id)
    }

    async _update(){
        // if(!this.hasOwnership()) return;
        if(!this.ctx._running) return;
        if(!this._entity.active) return;
        await this.ctx.onUpdate();
        // log("mono", "updated", this.id)
    }

    async _refresh(){
        // if(!this.hasOwnership()) return;
        if(!this._entity.active) return;
        log("mono", "refreshing script [", this.ctx._running, "]..")
        if(this.ctx._running){
            this.ctx._running = false;
            await this.ctx.onDestroy();
        }
        
        await this._loadScript(this.properties.file);
       
        log("mono", "refreshed", this.id)
    }

    Start(){
        // const oneShot = 'monobehavior_start¶' + this.id;
        // networking.sendOneShot(oneShot);
    }

    Stop(){
        // const oneShot = 'monobehavior_stop¶' + this.id;
        // networking.sendOneShot(oneShot);
    }

    Refresh(){
        // const oneShot = 'monobehavior_refresh¶' + this.id;
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
        // if (!this.ctx || !this.ctx.vars) return;
        // if(typeof value === "object"){
        //     value = JSON.stringify(value);
        // }
        // let message = `update_monobehavior¶${this.id}¶vars¶${varName}¶${value}`;
        // networking.sendOneShot(message);
        // log("mono", "updated ctx.vars and properties.vars =>", varName, value)
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
        await lifecycle.unregisterMonoBehavior(this);
        inspector.lifecyclePanel.render()
    }
}