const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

/**
 * Base class for all Unity joint components
 * Provides common properties and methods shared by all joint types
 */
export class JointComponent extends EntityComponent {
    constructor() {
        super();
    }

    /**
     * Default properties common to all joints
     */
    defaultJointProperties() {
        return {
            anchor: { x: 0, y: 0, z: 0 },
            connectedAnchor: { x: 0, y: 0, z: 0 },
            autoConfigureConnectedAnchor: true,
            breakForce: Infinity,
            breakTorque: Infinity,
            enableCollision: false,
            enablePreprocessing: true,
            connectedMassScale: 1,
            massScale: 1
        };
    }

    /**
     * Extract common joint properties from scene component
     */
    extractJointProperties(sceneComponent) {
        const properties = {};

        // Vector3 properties
        const vector3Props = ['anchor', 'connectedAnchor'];
        vector3Props.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = {
                    x: sceneComponent[prop].x || 0,
                    y: sceneComponent[prop].y || 0,
                    z: sceneComponent[prop].z || 0
                };
            }
        });

        // Boolean and numeric properties
        const simpleProps = [
            'autoConfigureConnectedAnchor',
            'breakForce',
            'breakTorque',
            'enableCollision',
            'enablePreprocessing',
            'connectedMassScale',
            'massScale'
        ];
        simpleProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        return properties;
    }

    /**
     * Set a joint property with appropriate type handling
     */
    _setJointProperty(property, value) {
        if (!this._bs) return;

        const vector3Props = ['anchor', 'connectedAnchor', 'axis', 'swingAxis', 'secondaryAxis'];

        try {
            if (vector3Props.includes(property) && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on ${this.type}:`, e);
        }
    }
}
