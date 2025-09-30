const { BanterMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterCylinderComponent extends BanterMeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterCylinder;
        this.type = 'BanterCylinder';
    }

    defaultProperties() {
        return {
            // topRadius: 1,
            // bottomRadius: 1,
             height: 1,
             radialSegments: 32,
             radius: 1,
            // heightSegments: 1,
            // openEnded: false,
            // thetaStart: 0,
            // thetaLength: 6.283185307179586
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
                this._bs[property] = value;
                let geometry = this._entity.getComponent("BanterGeometry")
                if(geometry){
                    if(property === 'radius'){
                        geometry._set("topRadius", value)
                        geometry._set("bottomRadius", value)
                    }else{
                        geometry._set(property, value)
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterCylinder:`, e);
        }
    }
}