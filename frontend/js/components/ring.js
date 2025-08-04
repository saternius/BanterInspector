const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterRingComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterRing;
        this.type = 'BanterRing';
    }

    defaultProperties() {
        return {
            innerRadius: 1,
            outerRadius: 2,
            thetaSegments: 32,
            phiSegments: 1,
            thetaStart: 0,
            thetaLength: 6.283185307179586
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['innerRadius', 'outerRadius', 'thetaStart', 'thetaLength'];
        const intProps = ['thetaSegments', 'phiSegments'];
        
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterRing:`, e);
        }
    }
}