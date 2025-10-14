const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);

export class ConfigurableJointComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.ConfigurableJoint;
        this.type = 'ConfigurableJoint';
    }

    defaultProperties() {
        return {
            targetPosition: { x: 0, y: 0, z: 0 },
            autoConfigureConnectedAnchor: false,
            xMotion: 0,
            yMotion: 0,
            zMotion: 0,
            angularXMotion: 0,
            angularYMotion: 0,
            angularZMotion: 0,
            anchor: { x: 0, y: 0, z: 0 },
            axis: { x: 1, y: 0, z: 0 },
            secondaryAxis: { x: 0, y: 1, z: 0 },
            connectedAnchor: { x: 0, y: 0, z: 0 },
            targetRotation: { x: 0, y: 0, z: 0, w: 1 },
            targetVelocity: { x: 0, y: 0, z: 0 },
            targetAngularVelocity: { x: 0, y: 0, z: 0 },
            enableCollision: false,
            enablePreprocessing: true,
            breakForce: Infinity,
            breakTorque: Infinity,
            connectedMassScale: 1,
            massScale: 1,
            rotationDriveMode: 0,
            configuredInWorldSpace: false,
            swapBodies: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        // Vector3 properties
        const vector3Props = ['targetPosition', 'anchor', 'axis', 'secondaryAxis', 'connectedAnchor', 'targetVelocity', 'targetAngularVelocity'];
        vector3Props.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = {
                    x: sceneComponent[prop].x || 0,
                    y: sceneComponent[prop].y || 0,
                    z: sceneComponent[prop].z || 0
                };
            }
        });

        // Quaternion property
        if (sceneComponent.targetRotation !== undefined) {
            properties.targetRotation = {
                x: sceneComponent.targetRotation.x || 0,
                y: sceneComponent.targetRotation.y || 0,
                z: sceneComponent.targetRotation.z || 0,
                w: sceneComponent.targetRotation.w || 1
            };
        }

        // Motion constraint properties
        const motionProps = ['xMotion', 'yMotion', 'zMotion', 'angularXMotion', 'angularYMotion', 'angularZMotion'];
        motionProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });

        // Boolean properties
        const boolProps = ['autoConfigureConnectedAnchor', 'enableCollision', 'enablePreprocessing', 'configuredInWorldSpace', 'swapBodies'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });

        // Numeric properties
        const numericProps = ['breakForce', 'breakTorque', 'connectedMassScale', 'massScale', 'rotationDriveMode'];
        numericProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });

        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            const vector3Props = ['targetPosition', 'anchor', 'axis', 'secondaryAxis', 'connectedAnchor', 'targetVelocity', 'targetAngularVelocity'];

            if (vector3Props.includes(property) && typeof value === 'object') {
                this._bs[property] = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (property === 'targetRotation' && typeof value === 'object') {
                this._bs.targetRotation = new BS.Quaternion(value.x || 0, value.y || 0, value.z || 0, value.w || 1);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on ConfigurableJoint:`, e);
        }
    }
}