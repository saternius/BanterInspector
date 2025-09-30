const { BanterMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterBoxComponent extends BanterMeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterBox;
        this.type = 'BanterBox';
    }

    defaultProperties() {
        return {
            width: 1,
            height: 1,
            depth: 1,
            // widthSegments: 1,
            // heightSegments: 1,
            // depthSegments: 1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['width', 'height', 'depth'];
        // const intProps = ['widthSegments', 'heightSegments', 'depthSegments'];
        
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        // intProps.forEach(prop => {
        //     if (sceneComponent[prop] !== undefined) {
        //         properties[prop] = parseBest(sceneComponent[prop]);
        //     }
        // });
        
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
                    geometry._set(property, value)
                }
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterBox:`, e);
        }
    }
}