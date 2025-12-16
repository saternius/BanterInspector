import { EntityComponent } from '../entity-component.js';
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
        material.Set("shaderName", "Standard");
        material.Set("color", material.properties.color);
        AddComponent(this._entity.id, "MeshCollider");
        AddComponent(this._entity.id, "ScriptRunner",{
            componentProperties:{
                file: "Grabbable.js"
            }
        })
    }
}