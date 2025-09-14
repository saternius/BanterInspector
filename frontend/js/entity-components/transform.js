const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { eulerToQuaternion, parseBest } = await import(`${window.repoUrl}/utils.js`);

export class TransformComponent extends EntityComponent {
    constructor(){
        super();
        this._bsRef = BS.Transform;
        this.type = "Transform";
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        return this;
    }

    async _set(property, value){
        value = parseBest(value);
        this.properties[property] = value;
        value.x = parseFloat(value.x || 0);
        value.y = parseFloat(value.y || 0);
        value.z = parseFloat(value.z || 0);
        if (property === 'localPosition' || property === 'localScale' || property === "position" || property === "scale") {
            this._bs[property] = new BS.Vector3(value.x,value.y, value.z);
        } else if (property === 'localRotation' || property === "rotation") {
            if ('w' in value) {
                value.w = parseFloat(value.w || 1);
                this._bs[property] = new BS.Vector4( value.x, value.y, value.z, value.w);
            } else {
                value = eulerToQuaternion(value);
                this._bs[property] = new BS.Vector4(value.x, value.y, value.z, value.w);
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