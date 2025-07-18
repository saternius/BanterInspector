let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterMaterialComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterMaterial;
        this.type = 'BanterMaterial';
    }

    defaultProperties() {
        return {
            shaderName: 'Standard',
            texture: '',
            color: { r: 1, g: 1, b: 1, a: 1 },
            side: 0,
            generateMipMaps: true
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.shaderName !== undefined) {
            properties.shaderName = sceneComponent.shaderName;
        }
        
        if (sceneComponent.texture !== undefined) {
            properties.texture = sceneComponent.texture;
        }
        
        if (sceneComponent.color !== undefined) {
            // Convert from Vector4 {x,y,z,w} to color {r,g,b,a} format
            properties.color = {
                r: sceneComponent.color.x || 1,
                g: sceneComponent.color.y || 1,
                b: sceneComponent.color.z || 1,
                a: sceneComponent.color.w || 1
            };
        }
        
        if (sceneComponent.side !== undefined) {
            properties.side = sceneComponent.side;
        }
        
        if (sceneComponent.generateMipMaps !== undefined) {
            properties.generateMipMaps = sceneComponent.generateMipMaps;
        }
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (property === 'color' && typeof value === 'object') {
                // Convert from color {r,g,b,a} format to Vector4 {x,y,z,w}
                this._bs.color = new BS.Vector4(value.r || 0, value.g || 0, value.b || 0, value.a || 1);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterMaterial:`, e);
        }
    }
}