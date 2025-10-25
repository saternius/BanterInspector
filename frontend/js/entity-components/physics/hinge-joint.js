const { JointComponent } = await import(`${window.repoUrl}/entity-components/physics/joint-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class HingeJointComponent extends JointComponent {
    constructor() {
        super();
        this._bsRef = BS.HingeJoint;
        this.type = 'HingeJoint';
    }

    defaultProperties() {
        return {
            ...this.defaultJointProperties(),
            axis: { x: 0, y: 1, z: 0 },
            useLimits: false,
            useMotor: false,
            useSpring: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = this.extractJointProperties(sceneComponent);

        // Vector3 property specific to HingeJoint
        if (sceneComponent.axis !== undefined) {
            properties.axis = {
                x: sceneComponent.axis.x || 0,
                y: sceneComponent.axis.y || 0,
                z: sceneComponent.axis.z || 0
            };
        }

        // Hinge-specific boolean properties
        const boolProps = ['useLimits', 'useMotor', 'useSpring'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        this._setJointProperty(property, value);

    }
}
