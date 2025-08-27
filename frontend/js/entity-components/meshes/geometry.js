const { BanterMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterGeometryComponent extends BanterMeshComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterGeometry;
        this.type = 'BanterGeometry';
    }

    defaultProperties() {
        return {
            geometryType: 0,
            parametricType: 0,
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            radiusTop: 0.5,
            radiusBottom: 0.5,
            radialSegments: 32,
            heightSegments: 1,
            openEnded: false,
            thetaStart: 0,
            thetaLength: 6.283185307179586,
            phiStart: 0,
            phiLength: 6.283185307179586,
            widthSegments: 1,
            depthSegments: 1,
            tube: 0.4,
            tubularSegments: 64,
            arc: 6.283185307179586,
            p: 2,
            q: 3,
            segments: 64,
            innerRadius: 0.2,
            outerRadius: 0.5,
            phiSegments: 8,
            thetaSegments: 6
        };
    }

    extractProperties(sceneComponent) {
        const properties = {
            geometryType: parseBest(sceneComponent.geometryType) || 0,
            parametricType: parseBest(sceneComponent.parametricType) || 0
        };

        const floatProps = [
            'width', 'height', 'depth', 'radius', 'radiusTop', 'radiusBottom',
            'radialSegments', 'heightSegments', 'thetaStart', 'thetaLength',
            'phiStart', 'phiLength', 'widthSegments', 'depthSegments',
            'tube', 'tubularSegments', 'arc', 'p', 'q', 'segments',
            'innerRadius', 'outerRadius', 'phiSegments', 'thetaSegments'
        ];

        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        if (sceneComponent.openEnded !== undefined) {
            properties.openEnded = parseBest(sceneComponent.openEnded);
        }

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
            console.error(`Failed to update ${property} on BanterGeometry:`, e);
        }
    }
}