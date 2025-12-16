import { MeshComponent } from './mesh-component.js';
import { parseBest } from '../../utils.js';

export class TextComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterText;
        this.type = 'Text';
    }

    defaultProperties() {
        return {
            text: 'New Text',
            color: { r: 1, g: 1, b: 1, a: 1 },
            horizontalAlignment: 1,
            verticalAlignment: 1,
            fontSize: 0.1,
            richText: false,
            enableWordWrapping: true,
            // rectTransformSizeDelta: { x: 2, y: 1 }
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.text !== undefined) {
            properties.text = parseBest(sceneComponent.text);
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
        
        const intProps = ['horizontalAlignment', 'verticalAlignment'];
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        if (sceneComponent.fontSize !== undefined) {
            properties.fontSize = parseBest(sceneComponent.fontSize);
        }
        
        const boolProps = ['richText', 'enableWordWrapping'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        // if (sceneComponent.rectTransformSizeDelta !== undefined) {
        //     properties.rectTransformSizeDelta = {
        //         x: sceneComponent.rectTransformSizeDelta.x || 2,
        //         y: sceneComponent.rectTransformSizeDelta.y || 1
        //     };
        // }
        
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
            } else if (property === 'rectTransformSizeDelta' && typeof value === 'object') {
                this._bs.rectTransformSizeDelta = new BS.Vector2(value.x || 0, value.y || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on Text:`, e);
        }

    }
}