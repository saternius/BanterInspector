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
        this.scriptContext = this.newScriptContext();
        this.scriptFunction = null;
        this.type = "MonoBehavior";
        if(this.properties.file && this.properties.file.length > 0){
            this.loadScript(this.properties.file);
        }
        this.setId(this.id.replace("undefined","MonoBehavior"));
        this.loadVarsFromSpaceState();
        return this;
    }

    async update(property, value){
        console.log("[MONO] updating property =>", property, value)
        if(property === 'file'){
            this.loadScript(value);
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
            vars: {}
        }
    }

    async loadScript(fileName) {        
        console.log("loading script =>", fileName)
        const inventoryItem = window.inventory?.items?.[fileName];
        if (!inventoryItem || inventoryItem.itemType !== 'script') {
            console.error(`Script "${fileName}" not found in inventory`);
            return;
        }

        
        console.log("this.scriptContext.running =>", this.scriptContext)
        if(this.scriptContext._running){
            await this.scriptContext.onDestroy();
        }

        this.scriptContext = this.newScriptContext();
        this.scriptFunction = new Function(`
            ${inventoryItem.data}
        `);
        
        // Extract vars definition if present
        if (this.scriptContext.vars) {
            // Initialize vars with defaults
            const varDefinitions = this.scriptContext.vars;
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
            
            this.properties.vars = initializedVars;
            this.scriptContext.vars = initializedVars;
        }

        this.scriptFunction.call(this.scriptContext);
        this.scriptInstance = this.scriptContext;
        await lifecycle.registerMonoBehavior(this);  
        this.start();  
        console.log(`Script "${fileName}" loaded successfully for ${this.properties.name}`);
    }

    start(){
        if(this.scriptContext._running) return;
        this.scriptContext._running = true;
        this.scriptContext.onStart();
    }

    pause(){
        if(!this.scriptContext._running) return;
        this.scriptContext._running = false;
        this.scriptContext.onPause();
    }

    resume(){
        if(this.scriptContext._running) return;
        this.scriptContext._running = true;
        this.scriptContext.onResume();
    }

    stop(){
        if(!this.scriptContext._running) return;
        this.scriptContext._running = false;
        this.scriptContext.onDestroy();
    }

    refresh(){
        console.log("refreshing script [", this.scriptContext._running, "]..")
        if(this.scriptContext._running){
            this.scriptContext._running = false;
            this.scriptContext.onDestroy();
        }
        
        this.loadScript(this.properties.file);
    }



    newScriptContext(){
        let defaults =  {
            vars: {},
            onStart: ()=>{},
            onUpdate: ()=>{},
            onPause: ()=>{},
            onResume: ()=>{},
            onDestroy: ()=>{},
            onKeyDown: ()=>{},
            onKeyUp: ()=>{},
            keyDown: ()=>{},
            keyUp: ()=>{},
            keyPress: ()=>{},
            log: (...args)=>{ console.log(...args)},
            loadItem: SM.loadItem,
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
        if (!this.scriptContext || !this.scriptContext.vars) return;
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
            this.scriptContext.vars[varName] = SM.scene.spaceState.public[key];
        }
    }

    async destroy(){
        await super.destroy();
        this.stop();
        await lifecycle.unregisterMonoBehavior(this);
        
    }
}