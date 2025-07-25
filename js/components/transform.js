let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);
const { eulerToQuaternion } = await import(`${basePath}/utils.js`);

export class TransformComponent extends SlotComponent {
    constructor(){
        super();
        this.bsRef = BS.Transform;
    }

    async init(slot, sceneComponent, properties){
        await super.init(slot, sceneComponent, properties);
        this.type = "Transform";
        this.setId(`Transform_${slot.id}`);
        return this;
    }

    async _set(property, value){
        this.properties[property] = value;
        if (property === 'localPosition' || property === 'localScale') {
            this._bs[property] = new BS.Vector3(
                parseFloat(value.x),
                parseFloat(value.y),
                parseFloat(value.z)
            );
        } else if (property === 'localRotation') {
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
                value = eulerToQuaternion(value);
                this._bs[property] = new BS.Vector4(
                    parseFloat(value.x),
                    parseFloat(value.y),
                    parseFloat(value.z),
                    parseFloat(value.w)
                );
            }
        }
    }

    extractProperties(sceneComponent) {
        return {
            localPosition: sceneComponent.localPosition || { x: 0, y: 0, z: 0 },
            localRotation: sceneComponent.localRotation || { x: 0, y: 0, z: 0, w: 1 },
            localScale: sceneComponent.localScale || { x: 1, y: 1, z: 1 }
        };
    }

    defaultProperties(){
        return {
            localPosition: { x: 0, y: 0, z: 0 },
            localRotation: { x: 0, y: 0, z: 0, w: 1 },
            localScale: { x: 1, y: 1, z: 1 }
        }
    }

    async Add(property, vector3){
        let addX = vector3.x || 0;
        let addY = vector3.y || 0;
        let addZ = vector3.z || 0;
        let curVec = this.properties[property];
        let newVec = {
            x: curVec.x + addX,
            y: curVec.y + addY,
            z: curVec.z + addZ
        }
        await this.Set(property, newVec);
        return this
    }

    async Multiply(property, vector3){
        let multX = vector3.x || 1;
        let multY = vector3.y || 1;
        let multZ = vector3.z || 1;
        let curVec = this.properties[property];
        let newVec = {
            x: curVec.x * multX,
            y: curVec.y * multY,
            z: curVec.z * multZ
        }
        await this.Set(property, newVec);
        return this
    }

}