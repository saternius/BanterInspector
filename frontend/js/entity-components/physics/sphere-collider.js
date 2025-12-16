import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';

export class SphereColliderComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.SphereCollider;
        this.type = 'SphereCollider';
    }

    defaultProperties() {
        return {
            isTrigger: false,
            center: { x: 0, y: 0, z: 0 },
            radius: 0.5
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.isTrigger !== undefined) {
            properties.isTrigger = parseBest(sceneComponent.isTrigger);
        }
        
        if (sceneComponent.center !== undefined) {
            properties.center = {
                x: sceneComponent.center.x || 0,
                y: sceneComponent.center.y || 0,
                z: sceneComponent.center.z || 0
            };
        }
        
        if (sceneComponent.radius !== undefined) {
            properties.radius = parseBest(sceneComponent.radius);
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        try {
            if (property === 'center' && typeof value === 'object') {
                this._bs.center = new BS.Vector3(value.x || 0, value.y || 0, value.z || 0);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on SphereCollider:`, e);
        }

    }
}