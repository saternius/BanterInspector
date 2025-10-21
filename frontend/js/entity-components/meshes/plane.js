const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class PlaneComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPlane;
        this.type = 'Plane';
    }

    defaultProperties() {
        return {
            width: 1,
            height: 1,
            widthSegments: 1,
            heightSegments: 1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['width', 'height'];
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
            console.error(`Failed to update ${property} on Plane:`, e);
        }
        this.checkSpaceDiff();
    }
}