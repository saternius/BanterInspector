const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
export class BanterMeshComponent extends EntityComponent {
    constructor() {
        super();
    }

    async init(entity, sceneComponent, properties, options){
        super.init(entity, sceneComponent, properties, options);
        if(this.options.context === "new"){
            this.initGrabbable();
        }
        return this;
    }

    async initGrabbable(){
        let material = this._entity?.getComponent("BanterMaterial");
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