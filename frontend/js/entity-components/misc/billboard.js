import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';

export class BillboardComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterBillboard;
        this.type = 'Billboard';
    }

    defaultProperties() {
        return {
            smoothing: 0.1,
            enableXAxis: true,
            enableYAxis: true,
            enableZAxis: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.smoothing !== undefined) {
            properties.smoothing = parseBest(sceneComponent.smoothing);
        }
        
        const boolProps = ['enableXAxis', 'enableYAxis', 'enableZAxis'];
        boolProps.forEach(prop => {
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
            }
        } catch (e) {
            console.error(`Failed to update ${property} on Billboard:`, e);
        }

    }
}