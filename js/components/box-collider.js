let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BoxColliderComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BoxCollider;
        this.type = 'BoxCollider';
    }

    defaultProperties() {
        return {
            isTrigger: false,
            center: { x: 0, y: 0, z: 0 },
            size: { x: 1, y: 1, z: 1 }
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
        
        if (sceneComponent.size !== undefined) {
            properties.size = {
                x: sceneComponent.size.x || 1,
                y: sceneComponent.size.y || 1,
                z: sceneComponent.size.z || 1
            };
        }
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if ((property === 'center' || property === 'size') && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BoxCollider:`, e);
        }
    }
}