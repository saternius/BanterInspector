const { BanterMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterTorusKnotComponent extends BanterMeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterTorusKnot;
        this.type = 'BanterTorusKnot';
    }

    defaultProperties() {
        return {
            radius: 0.5,
            tube: 0.2,
            radialSegments: 64,
            tubularSegments: 128,
            p: 2,
            q: 3
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        const floatProps = ['radius', 'tube', 'radialSegments', 'tubularSegments', 'p', 'q'];
        floatProps.forEach(prop => {
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

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterTorusKnot:`, e);
        }
    }
}
