let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterTextComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterText;
        this.type = 'BanterText';
    }

    defaultProperties() {
        return {
            text: 'New Text',
            color: { x: 1, y: 1, z: 1, w: 1 },
            horizontalAlignment: 1,
            verticalAlignment: 1,
            fontSize: 0.1,
            richText: false,
            enableWordWrapping: true,
            rectTransformSizeDelta: { x: 2, y: 1 }
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.text !== undefined) {
            properties.text = sceneComponent.text;
        }
        
        if (sceneComponent.color !== undefined) {
            properties.color = {
                x: sceneComponent.color.x || 1,
                y: sceneComponent.color.y || 1,
                z: sceneComponent.color.z || 1,
                w: sceneComponent.color.w || 1
            };
        }
        
        const intProps = ['horizontalAlignment', 'verticalAlignment'];
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        if (sceneComponent.fontSize !== undefined) {
            properties.fontSize = sceneComponent.fontSize;
        }
        
        const boolProps = ['richText', 'enableWordWrapping'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        if (sceneComponent.rectTransformSizeDelta !== undefined) {
            properties.rectTransformSizeDelta = {
                x: sceneComponent.rectTransformSizeDelta.x || 2,
                y: sceneComponent.rectTransformSizeDelta.y || 1
            };
        }
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (property === 'color' && typeof value === 'object') {
                this._bs.color = new BS.Vector4(value.x || 0, value.y || 0, value.z || 0, value.w || 1);
            } else if (property === 'rectTransformSizeDelta' && typeof value === 'object') {
                this._bs.rectTransformSizeDelta = new BS.Vector2(value.x || 0, value.y || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterText:`, e);
        }
    }
}