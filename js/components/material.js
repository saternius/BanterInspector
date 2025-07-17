let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
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
            color: { x: 1, y: 1, z: 1, w: 1 },
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
            properties.color = {
                x: sceneComponent.color.x || 1,
                y: sceneComponent.color.y || 1,
                z: sceneComponent.color.z || 1,
                w: sceneComponent.color.w || 1
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
                this._bs.color = new BS.Vector4(value.x || 0, value.y || 0, value.z || 0, value.w || 1);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterMaterial:`, e);
        }
    }
}