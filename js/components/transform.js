let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class TransformComponent extends SlotComponent {
    constructor(){
        super();
        this.bsRef = BS.Transform;
    }

    async init(slot, sceneComponent, properties){
        await super.init(slot, sceneComponent, properties);
        this.type = "Transform";
        console.log("TRANSFORM COMPONENT INIT", this._bs, this._slot, properties)
        this.setId(`Transform_${slot.id}`);
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