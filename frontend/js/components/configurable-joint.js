class ConfigurableJointComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.ConfigurableJoint;
        this.type = 'ConfigurableJoint';
    }

    defaultProperties() {
        return {
            targetPosition: { x: 0, y: 0, z: 0 },
            autoConfigureConnectedAnchor: false,
            xMotion: 0,
            yMotion: 0,
            zMotion: 0
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.targetPosition !== undefined) {
            properties.targetPosition = {
                x: sceneComponent.targetPosition.x || 0,
                y: sceneComponent.targetPosition.y || 0,
                z: sceneComponent.targetPosition.z || 0
            };
        }
        
        if (sceneComponent.autoConfigureConnectedAnchor !== undefined) {
            properties.autoConfigureConnectedAnchor = sceneComponent.autoConfigureConnectedAnchor;
        }
        
        const motionProps = ['xMotion', 'yMotion', 'zMotion'];
        motionProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (property === 'targetPosition' && typeof value === 'object') {
                this._bs.targetPosition = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on ConfigurableJoint:`, e);
        }
    }
}