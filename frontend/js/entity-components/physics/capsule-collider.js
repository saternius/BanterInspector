const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class CapsuleColliderComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.CapsuleCollider;
        this.type = 'CapsuleCollider';
    }

    defaultProperties() {
        return {
            isTrigger: false,
            center: { x: 0, y: 0, z: 0 },
            radius: 0.5,
            height: 2,
            direction: 1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.isTrigger !== undefined) {
            properties.isTrigger = parseBest(sceneComponent.isTrigger);
        }
        
        if (sceneComponent.center !== undefined) {
            properties.center = {
                x: sceneComponent.center.x || 0,
                y: sceneComponent.center.y || 0,
                z: sceneComponent.center.z || 0
            };
        }
        
        if (sceneComponent.radius !== undefined) {
            properties.radius = parseBest(sceneComponent.radius);
        }
        
        if (sceneComponent.height !== undefined) {
            properties.height = parseBest(sceneComponent.height);
        }
        
        if (sceneComponent.direction !== undefined) {
            properties.direction = parseBest(sceneComponent.direction);
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        try {
            if (property === 'center' && typeof value === 'object') {
                this._bs.center = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on CapsuleCollider:`, e);
        }
    }
}