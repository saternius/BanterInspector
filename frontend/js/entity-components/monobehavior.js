const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class MonoBehaviorComponent extends EntityComponent {
    constructor(){
        super();
        this.bsRef = null;
        
    }

    async init(entity, sceneComponent, properties){
        await super.init(entity, sceneComponent, properties);
        this.scriptInstance = null;
        this.ctx = this.newScriptContext();
        this.scriptFunction = null;
        this.type = "MonoBehavior";
        this.setId(this.id.replace("undefined","MonoBehavior"));
        if(this.properties.file && this.properties.file.length > 0){
            if(SM.props["__" + this.id + "/_running:component"] !== false){
                this._loadScript(this.properties.file);
            }else{
                this.ctx._running = false;
            }
        }
        
        setTimeout(()=>{
            this.loadVarsFromSpaceState();
        }, 10)
        
        return this;
    }

    async _set(property, value){
        console.log("[MONO] updating property =>", property, value)
        value = parseBest(value);
        if(property === 'file'){
            this._loadScript(value);
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
            vars: {},
            _owner: SM.scene.spaceState.public.hostUser
        }
    }

    async _loadScript(fileName) {        
        if(this.properties._owner !== SM.myName()) return;
        if(!this._entity.active) return;
        const inventoryItem = window.inventory?.items?.[fileName];
        if (!inventoryItem || inventoryItem.itemType !== 'script') {
            console.error(`Script "${fileName}" not found in inventory`);
            return;
        }

        
        if(this.ctx._running){
            await this.ctx.onDestroy();
        }

        this.ctx = this.newScriptContext();
        this.scriptFunction = new Function(`
            ${inventoryItem.data}
        `);
        
        // Extract vars definition if present
        if (this.ctx.vars) {
            // Initialize vars with defaults
            const varDefinitions = this.ctx.vars;
            const initializedVars = {};
            
            for (const [varName, varDef] of Object.entries(varDefinitions)) {
                if (this.properties.vars[varName] !== undefined) {
                    // Use existing value
                    initializedVars[varName] = this.properties.vars[varName];
                } else if (varDef.default !== undefined) {
                    // Use default value
                    initializedVars[varName] = varDef.default;
                } else {
                    // Initialize based on type
                    switch (varDef.type) {
                        case 'number':
                            initializedVars[varName] = 0;
                            break;
                        case 'string':
                            initializedVars[varName] = '';
                            break;
                        case 'boolean':
                            initializedVars[varName] = false;
                            break;
                        case 'vector3':
                            initializedVars[varName] = { x: 0, y: 0, z: 0 };
                            break;
                        case 'color':
                            initializedVars[varName] = { r: 1, g: 1, b: 1, a: 1 };
                            break;
                        default:
                            initializedVars[varName] = null;
                    }
                }
            }
            
            this.ctx.vars = {...this.ctx.vars, ...initializedVars};
        }

        this.scriptFunction.call(this.ctx);
        this.scriptInstance = this.ctx;
        await lifecycle.registerMonoBehavior(this);  
        this._start();  
        console.log(`Script "${fileName}" loaded successfully for ${this.properties.name}`);
    }

    _start(){
        if(this.properties._owner !== SM.myName()) return;
        if(this.ctx._running) return;
        if(!this._entity.active) return;
        this.ctx._running = true;
        this.ctx.onStart();
        let message = `update_monobehavior:${this.id}:_running:true`;
        networking.sendOneShot(message);
        inspector.lifecyclePanel.render()
    }

    _stop(){
        if(this.properties._owner !== SM.myName()) return;
        if(!this.ctx._running) return;
        if(!this._entity.active) return;
        this.ctx._running = false;
        this.ctx.onDestroy();
        let message = `update_monobehavior:${this.id}:_running:false`;
        networking.sendOneShot(message);
        inspector.lifecyclePanel.render()
    }

    _update(){
        if(this.properties._owner !== SM.myName()) return;
        if(!this.ctx._running) return;
        if(!this._entity.active) return;
        this.ctx.onUpdate();
    }

    _refresh(){
        if(this.properties._owner !== SM.myName()) return;
        if(!this._entity.active) return;
        console.log("refreshing script [", this.ctx._running, "]..")
        if(this.ctx._running){
            this.ctx._running = false;
            this.ctx.onDestroy();
        }
        
        this._loadScript(this.properties.file);
        const event = new CustomEvent('script-refreshed', {
            detail: {
                componentId: this.id,
                name: this.properties.name,
                file: this.properties.file
            },
            
        });
        window.dispatchEvent(event);
    }

    Start(){
        const oneShot = 'monobehavior_start:' + this.id;
        networking.sendOneShot(oneShot);
    }

    Stop(){
        const oneShot = 'monobehavior_stop:' + this.id;
        networking.sendOneShot(oneShot);
    }

    Refresh(){
        const oneShot = 'monobehavior_refresh:' + this.id;
        networking.sendOneShot(oneShot);
    }



    newScriptContext(){
        let newContext =  {
            vars: {},
            onStart: ()=>{},
            onUpdate: ()=>{},
            onDestroy: ()=>{},
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
        console.log("[MONO] updating var =>", varName, value)
        if (!this.ctx || !this.ctx.vars) return;
        if(typeof value === "object"){
            value = JSON.stringify(value);
        }
        let message = `update_monobehavior:${this.id}:vars:${varName}:${value}`;
        networking.sendOneShot(message);
        // this.scriptContext.vars[varName] = value;
    }

    loadVarsFromSpaceState(){
        let key = "__" + this.id + "/vars:component";
        this.ctx.vars = SM.props[key] || {};
    }

    async _destroy(){
        await super._destroy();
        this._stop();
        await lifecycle.unregisterMonoBehavior(this);
        inspector.lifecyclePanel.render()
    }
}