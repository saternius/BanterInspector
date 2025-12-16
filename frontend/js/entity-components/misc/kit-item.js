import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';

export class KitItemComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterKitItem;
        this.type = 'KitItem';
    }

    defaultProperties() {
        return {
            path: '',
            resetTransform: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.path !== undefined) {
            properties.path = sceneComponent.path;
        }
        
        if (sceneComponent.resetTransform !== undefined) {
            properties.resetTransform = sceneComponent.resetTransform;
        }
        
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
            console.error(`Failed to update ${property} on KitItem:`, e);
        }

    }
}