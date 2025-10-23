const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
export class MeshComponent extends EntityComponent {
    constructor() {
        super();
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        if(this.options.source === "ui"){
            this.initGrabbable();
        }
        return this;
    }

    async initGrabbable(){
        let material = this._entity?.getComponent("Material");
        if(!material){
            setTimeout(this.initGrabbable.bind(this), 50);
            return;
        }
        material._set("shaderName", "Standard");
        material._set("color", material.properties.color);
        this._entity._set("layer", 5);
        SM._addComponent(this._entity, "MeshCollider");
        SM._addComponent(this._entity, "MonoBehavior", {
            componentProperties:{
                file: "Grabbable.js"
            }
        })
    }
}