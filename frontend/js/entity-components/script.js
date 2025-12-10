const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`); 
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class ScriptAssetComponent extends EntityComponent {
    constructor(){
        super();
        this._bsRef = null;
        this.inventoryItem = null;
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        this.type = "ScriptAsset";
        this.setId(this.id.replace("undefined","ScriptAsset"));
        this.updateRunners();
        return this;
    }

    
    extractProperties(sceneComponent) {
        return {
            name: sceneComponent.name || "myScript",
            data: sceneComponent.data || "",
            vars: sceneComponent.vars !== undefined ? sceneComponent.vars : null
        };
    }

    defaultProperties(){
        return {
            name: "myScript",
            data: "",
            vars: null
        }
    }

    async _set(property, value){
        value = parseBest(value);
        if(property === "data" && value !== this.properties.data){
            console.log("scriptasset", "set", property, value);
            this.properties[property] = value;
            this.updateRunners();
        }else{
            this.properties[property] = value;
        }
    }

    updateRunners(){
        this.getAllAttachedRunners().forEach(runner => {
            if(runner.properties.hotreload){
                runner.Refresh();
            }
        });
    }

    getAllAttachedRunners(){
        return SM.getAllScriptRunners().filter(x=>x.properties.file === this.properties.name);
    }
}