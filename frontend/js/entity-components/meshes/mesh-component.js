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
        if(!SM.iamHost) return;
        let material = this._entity?.getComponent("Material");
        if(!material){
            setTimeout(this.initGrabbable.bind(this), 50);
            return;
        }
        material.Set("shaderName", "Standard");
        material.Set("color", material.properties.color);
        this._entity.Set("layer", 5);
        await AddComponent(this._entity.id, "MeshCollider")
        await AddComponent(this._entity.id, "MonoBehavior", {
            componentProperties:{
                file: "Grabbable.js"
            }
        })
    }
}