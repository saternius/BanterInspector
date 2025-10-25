const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class CylinderComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterGeometry;
        this.type = 'Cylinder';
    }

    async init(entity, sceneComponent, properties, options){
        await super.init(entity, sceneComponent, properties, options);
        this._bs['geometryType'] = 2;
        return this;
    }


    defaultProperties() {
        return {
             height: 1,
             radialSegments: 32,
             radius: 1,
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        const props = ['height','radius', 'radialSegments'];
        props.forEach(prop => {
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
                if(property === 'radius'){
                    this._bs['radiusTop'] = value;
                    this._bs['radiusBottom'] = value;
                }else{
                    this._bs[property] = value;
                }
                
            }
        } catch (e) {
            console.error(`Failed to update ${property} on Cylinder:`, e);
        }

    }
}