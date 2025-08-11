const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

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
            properties.shaderName = parseBest(sceneComponent.shaderName);
        }
        
        if (sceneComponent.texture !== undefined) {
            properties.texture = parseBest(sceneComponent.texture);
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
            properties.side = parseBest(sceneComponent.side);
        }
        
        if (sceneComponent.generateMipMaps !== undefined) {
            properties.generateMipMaps = parseBest(sceneComponent.generateMipMaps);
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
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