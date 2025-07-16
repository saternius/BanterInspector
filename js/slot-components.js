

export class Slot{
    async init(slotData){
        this.id = slotData.id;
        this.name = slotData.name;
        this.parentId = slotData.parentId;
        this.components = slotData.components || [];
        this.children = slotData.children || [];
        this._bs = slotData._bs;

        this.active = true;
        this.persistent = true;


        if(!slotData._bs){
            let newGameObject = new BS.GameObject(this.name);
            this._bs = newGameObject;
            let parentGameObject = window.SM.scene.objects?.[this.parentId];
            if(parentGameObject){
                await newGameObject.SetParent(parentGameObject, true);
            }
            
            await newGameObject.SetActive(true);
            
            let newSlotId = parseInt(newGameObject.id);
            this.id = newSlotId;
            
            
            
            let newSlotName = `NewSlot_${newSlotId}`
            this.name = newSlotName;
            
            let transform = await new TransformComponent().init(this);
            this.components.push(transform);
        }

        window.SM.scene.objects[this.id] = this._bs;
        window.SM.slotData.slotMap[this.id] = this;
        return this;
    }
}

export class SlotComponent{
    constructor(){
        this.bsRef = BS.Transform
    }

    async init(slot, sceneComponent, properties){
        this._slot = slot;
        this.properties = (properties) ? properties : this.defaultProperties();
        if(sceneComponent){
            this.id = parseInt(sceneComponent.id);
            this.properties = this.extractProperties(sceneComponent);
            this._bs = sceneComponent;
        }else{
            let newComponent = await slot._bs.AddComponent(new this.bsRef());
            this.updateMany(this.properties)
            this._bs = newComponent;
            this.id = parseInt(newComponent.id);
        }
        window.SM.slotData.componentMap[this.id] = this;
    }

    async defaultProperties(){
        return {};
    }

    async extractProperties(sceneComponent){
        return {};
    }

    async updateMany(properties){
        for(let property in properties){
            await this.update(property, properties[property]);
        }
    }

    async update(property, value){
        this.properties[property] = value;
        this._bs[property] = value;
    }
}

export class TransformComponent extends SlotComponent {
    constructor(){
        super();
        this.bsRef = BS.Transform;
    }

    async init(slot, sceneComponent, properties){
        await super.init(slot, sceneComponent, properties);
        this.type = "Transform";
        return this;
    }

    async update(property, value){
        this.properties[property] = value;
        if (property === 'position' || property === 'localScale') {
            this._bs[property] = new BS.Vector3(
                parseFloat(value.x),
                parseFloat(value.y),
                parseFloat(value.z)
            );
        } else if (property === 'rotation') {
            // Rotation is stored as quaternion
            if ('w' in value) {
                // Already a quaternion
                this._bs[property] = new BS.Vector4(
                    parseFloat(value.x),
                    parseFloat(value.y),
                    parseFloat(value.z),
                    parseFloat(value.w)
                );
            } else {
                // If somehow we get euler angles, convert to quaternion
                console.warn('Received euler angles for rotation, expecting quaternion');
                // For safety, just use current rotation
            }
        }
    }

    extractProperties(sceneComponent) {
        return {
            position: sceneComponent.position || { x: 0, y: 0, z: 0 },
            rotation: sceneComponent.rotation || { x: 0, y: 0, z: 0, w: 1 },
            localScale: sceneComponent.localScale || { x: 1, y: 1, z: 1 }
        };
    }

    defaultProperties(){
        return {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            localScale: { x: 1, y: 1, z: 1 }
        }
    }
}



export const SUPPORTED_COMPONENTS = new Set([
    BS.ComponentType.Transform,
    // BS.ComponentType.BanterRigidbody,
    // BS.ComponentType.BanterMaterial,
    // BS.ComponentType.BanterText,
    // BS.ComponentType.BanterAudioSource,
    // BS.ComponentType.BoxCollider,
    // BS.ComponentType.SphereCollider,
    // BS.ComponentType.BanterGeometry
]);

export const componentTypeMap = {
    "Transform": TransformComponent,
}

export const componentBSTypeMap = {
    [BS.ComponentType.Transform]: TransformComponent,
}
window.componentBSTypeMap = componentBSTypeMap;
