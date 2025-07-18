let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class SphereColliderComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.SphereCollider;
        this.type = 'SphereCollider';
    }

    defaultProperties() {
        return {
            isTrigger: false,
            center: { x: 0, y: 0, z: 0 },
            radius: 0.5
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.isTrigger !== undefined) {
            properties.isTrigger = sceneComponent.isTrigger;
        }
        
        if (sceneComponent.center !== undefined) {
            properties.center = {
                x: sceneComponent.center.x || 0,
                y: sceneComponent.center.y || 0,
                z: sceneComponent.center.z || 0
            };
        }
        
        if (sceneComponent.radius !== undefined) {
            properties.radius = sceneComponent.radius;
        }
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (property === 'center' && typeof value === 'object') {
                this._bs.center = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on SphereCollider:`, e);
        }
    }
}