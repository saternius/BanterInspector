const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class RingComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterRing;
        this.type = 'Ring';
    }

    defaultProperties() {
        return {
            innerRadius: 1,
            outerRadius: 2,
            thetaSegments: 32,
            phiSegments: 1,
            thetaStart: 0,
            thetaLength: 6.283185307179586
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['innerRadius', 'outerRadius', 'thetaStart', 'thetaLength'];
        const intProps = ['thetaSegments', 'phiSegments'];
        
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
            console.error(`Failed to update ${property} on Ring:`, e);
        }

    }
}