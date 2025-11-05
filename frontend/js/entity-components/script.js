const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`); 
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class ScriptComponent extends EntityComponent {
    constructor(){
        super();
        this._bsRef = null;
        this.inventoryItem = null;
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        this.type = "Script";
        this.setId(this.id.replace("undefined","Script"));
        return this;
    }

    
    extractProperties(sceneComponent) {
        return {
            name: sceneComponent.name || "myScript",
            data: sceneComponent.data || "",
            vars: sceneComponent.vars || {}
        };
    }

    defaultProperties(){
        return {
            name: "myScript",
            data: "",
            vars: {}
        }
    }

    async _set(property, value){
        value = parseBest(value);
        this.properties[property] = value;
    }
}