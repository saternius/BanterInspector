const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class SphereComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSphere;
        this.type = 'Sphere';
    }

    defaultProperties() {
        return {
            radius: 1,
            widthSegments: 16,
            heightSegments: 16,
            phiStart: 0,
            phiLength: 6.283185307179586,
            thetaStart: 0,
            thetaLength: 3.141592653589793
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['radius', 'phiStart', 'phiLength', 'thetaStart', 'thetaLength'];
        const intProps = ['widthSegments', 'heightSegments'];
        
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        intProps.forEach(prop => {
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
            console.error(`Failed to update ${property} on Sphere:`, e);
        }
    }
}