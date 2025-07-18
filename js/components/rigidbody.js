let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterRigidbodyComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterRigidbody;
        this.type = 'BanterRigidbody';
    }

    defaultProperties() {
        return {
            velocity: { x: 0, y: 0, z: 0 },
            angularVelocity: { x: 0, y: 0, z: 0 },
            mass: 1,
            drag: 0,
            angularDrag: 0.05,
            isKinematic: false,
            useGravity: true,
            centerOfMass: { x: 0, y: 0, z: 0 },
            collisionDetectionMode: 0,
            freezePositionX: false,
            freezePositionY: false,
            freezePositionZ: false,
            freezeRotationX: false,
            freezeRotationY: false,
            freezeRotationZ: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const vector3Props = ['velocity', 'angularVelocity', 'centerOfMass'];
        vector3Props.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = {
                    x: sceneComponent[prop].x || 0,
                    y: sceneComponent[prop].y || 0,
                    z: sceneComponent[prop].z || 0
                };
            }
        });
        
        const floatProps = ['mass', 'drag', 'angularDrag'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        const boolProps = ['isKinematic', 'useGravity', 'freezePositionX', 'freezePositionY', 
                          'freezePositionZ', 'freezeRotationX', 'freezeRotationY', 'freezeRotationZ'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        if (sceneComponent.collisionDetectionMode !== undefined) {
            properties.collisionDetectionMode = sceneComponent.collisionDetectionMode;
        }
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (['velocity', 'angularVelocity', 'centerOfMass'].includes(property) && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterRigidbody:`, e);
        }
    }
}