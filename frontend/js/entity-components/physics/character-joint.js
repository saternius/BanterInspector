const { JointComponent } = await import(`${window.repoUrl}/entity-components/physics/joint-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class CharacterJointComponent extends JointComponent {
    constructor() {
        super();
        this._bsRef = BS.CharacterJoint;
        this.type = 'CharacterJoint';
    }

    defaultProperties() {
        return {
            ...this.defaultJointProperties(),
            axis: { x: 1, y: 0, z: 0 },
            swingAxis: { x: 0, y: 1, z: 0 },
            enableProjection: false,
            projectionDistance: 0.1,
            projectionAngle: 180
        };
    }

    extractProperties(sceneComponent) {
        const properties = this.extractJointProperties(sceneComponent);

        // Vector3 properties specific to CharacterJoint
        const vector3Props = ['axis', 'swingAxis'];
        vector3Props.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = {
                    x: sceneComponent[prop].x || 0,
                    y: sceneComponent[prop].y || 0,
                    z: sceneComponent[prop].z || 0
                };
            }
        });

        // Projection properties
        if (sceneComponent.enableProjection !== undefined) {
            properties.enableProjection = parseBest(sceneComponent.enableProjection);
        }
        if (sceneComponent.projectionDistance !== undefined) {
            properties.projectionDistance = parseBest(sceneComponent.projectionDistance);
        }
        if (sceneComponent.projectionAngle !== undefined) {
            properties.projectionAngle = parseBest(sceneComponent.projectionAngle);
        }

        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        this._setJointProperty(property, value);

    }
}
