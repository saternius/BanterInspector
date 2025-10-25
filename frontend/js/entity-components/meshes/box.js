const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BoxComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterGeometry;
        this.type = 'Box';
    }

    defaultProperties() {
        return {
            width: 1,
            height: 1,
            depth: 1,
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        const floatProps = ['width', 'height', 'depth'];
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
            console.error(`Failed to update ${property} on Box:`, e);
        }

    }
}