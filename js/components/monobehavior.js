let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class MonoBehaviorComponent extends SlotComponent {
    constructor(){
        super();
        this.bsRef = null;
        
    }

    async init(slot, sceneComponent, properties){
        await super.init(slot, sceneComponent, properties);
        this.scriptInstance = null;
        this.ctx = this.newScriptContext();
        this.scriptFunction = null;
        this.type = "MonoBehavior";
        this.setId(this.id.replace("undefined","MonoBehavior"));
        if(this.properties.file && this.properties.file.length > 0){
            if(SM.scene.spaceState.public["__" + this.id + "_running:monobehavior"] !== false){
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
        console.log("loading script =>", fileName)
        if(this.properties._owner !== SM.scene.localUser.name) return;
        if(!this._slot.active) return;
        console.log("loading script =>", fileName)
        const inventoryItem = window.inventory?.items?.[fileName];
        if (!inventoryItem || inventoryItem.itemType !== 'script') {
            console.error(`Script "${fileName}" not found in inventory`);
            return;
        }

        
        console.log("this.scriptContext.running =>", this.ctx)
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
        if(this.properties._owner !== SM.scene.localUser.name) return;
        if(this.ctx._running) return;
        if(!this._slot.active) return;
        this.ctx._running = true;
        this.ctx.onStart();
        SM.setSpaceProperty("__" + this.id + "_running:monobehavior", true, false);
        inspectorApp.lifecyclePanel.render()
    }

    _stop(){
        if(this.properties._owner !== SM.scene.localUser.name) return;
        if(!this.ctx._running) return;
        if(!this._slot.active) return;
        this.ctx._running = false;
        this.ctx.onDestroy();
        SM.setSpaceProperty("__" + this.id + "_running:monobehavior", false, false);
        inspectorApp.lifecyclePanel.render()
    }

    _update(){
        if(this.properties._owner !== SM.scene.localUser.name) return;
        if(!this.ctx._running) return;
        if(!this._slot.active) return;
        this.ctx.onUpdate();
    }

    _refresh(){
        if(this.properties._owner !== SM.scene.localUser.name) return;
        if(!this._slot.active) return;
        console.log("refreshing script [", this.ctx._running, "]..")
        if(this.ctx._running){
            this.ctx._running = false;
            this.ctx.onDestroy();
        }
        
        this._loadScript(this.properties.file);
    }

    Start(){
        const oneShot = 'monobehavior_start:' + this.id;
        SM.sendOneShot(oneShot);
    }

    Stop(){
        const oneShot = 'monobehavior_stop:' + this.id;
        SM.sendOneShot(oneShot);
    }

    Refresh(){
        const oneShot = 'monobehavior_refresh:' + this.id;
        SM.sendOneShot(oneShot);
    }



    newScriptContext(){
        let defaults =  {
            vars: (this.properties.vars || {}),
            onStart: ()=>{},
            onUpdate: ()=>{},
            onDestroy: ()=>{},
            onKeyDown: ()=>{},
            onKeyUp: ()=>{},
            keyDown: ()=>{},
            keyUp: ()=>{},
            keyPress: ()=>{},
            log: (...args)=>{ console.log(...args)},
            _slot: this._slot, // Reference to the slot
            _scene: window.scene, // Reference to the scene
            _BS: window.BS, // Reference to BanterScript library
            _component: this
        }

        defaults.onScriptChanged = function() {
            this.onDestroy();
            this.onStart();
        }

        return defaults;
    }

    async updateVar(varName, value) {
        console.log("[MONO] updating var =>", varName, value)
        if (!this.ctx || !this.ctx.vars) return;
        const spaceKey = '__' + this.id + '/' + varName + ':monobehavior';
        await SM.setSpaceProperty(spaceKey, value, false);
        // this.scriptContext.vars[varName] = value;
    }

    loadVarsFromSpaceState(){
        console.log("loading vars from space state =>", this.id)
        let spaceKeys = Object.keys(SM.scene.spaceState.public).filter(x=>x.startsWith("__"+this.id+"/"));
        console.log("spaceKeys =>", spaceKeys)
        for(let key of spaceKeys){
            let varName = key.split('/')[1].split(':')[0];
            this.ctx.vars[varName] = SM.scene.spaceState.public[key];
        }
    }

    async _destroy(){
        await super._destroy();
        this._stop();
        await lifecycle.unregisterMonoBehavior(this);
        inspectorApp.lifecyclePanel.render()
    }
}