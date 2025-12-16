import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';

let noInf = (value)=>{
    if(value === Infinity) return 999999;
    return value;
}


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
            breakForce: 999999,
            breakTorque: 999999,
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
                    x: noInf(sceneComponent[prop].x) || 0,
                    y: noInf(sceneComponent[prop].y) || 0,
                    z: noInf(sceneComponent[prop].z) || 0
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
                this._bs[property] = new BS.Vector3(noInf(value.x) || 0, noInf(value.y) || 0, noInf(value.z) || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on ${this.type}:`, e);
        }
    }
}
