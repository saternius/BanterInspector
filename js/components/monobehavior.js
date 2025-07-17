let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class MonoBehaviorComponent extends SlotComponent {
    constructor(){
        super();
        this.bsRef = null;
        this.scriptInstance = null;
        this.scriptContext = this.newScriptContext();
        this.scriptFunction = null;
    }

    async init(slot, sceneComponent, properties){
        await super.init(slot, sceneComponent, properties);
        this.type = "MonoBehavior";
        if(this.properties.file){
            this.loadScript(this.properties.file);
        }
        return this;
    }

    async update(property, value){
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

        

        if(this.scriptContext.running){
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
        this.scriptContext.running = true;
        window.lifecycleManager.registerMonoBehavior(this.id, this.scriptContext);    
        console.log(`Script "${fileName}" loaded successfully for ${this.properties.name}`);
    }



    newScriptContext(){
        return {
            vars: {},
            onStart: null,
            onUpdate: null,
            onDestroy: null,
            onKeyDown: null,
            onKeyUp: null,
            keyDown: null,
            keyUp: null,
            keyPress: null,
            slot: this.slot, // Reference to the slot
            scene: window.scene, // Reference to the scene
            BS: window.BS, // Reference to BanterScript library
            transform: this.transform
        }
    }

    async destroy(){
        await super.destroy();
        window.lifecycleManager.unregisterMonoBehavior(this.id);
        await this.scriptContext.onDestroy();
    }
}