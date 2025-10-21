const { JointComponent } = await import(`${window.repoUrl}/entity-components/physics/joint-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class SpringJointComponent extends JointComponent {
    constructor() {
        super();
        this._bsRef = BS.SpringJoint;
        this.type = 'SpringJoint';
    }

    defaultProperties() {
        return {
            ...this.defaultJointProperties(),
            spring: 0,
            damper: 0,
            minDistance: 0,
            maxDistance: 0,
            tolerance: 0.025
        };
    }

    extractProperties(sceneComponent) {
        const properties = this.extractJointProperties(sceneComponent);

        // Spring-specific properties
        const springProps = ['spring', 'damper', 'minDistance', 'maxDistance', 'tolerance'];
        springProps.forEach(prop => {
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
        this.checkSpaceDiff();
    }
}
