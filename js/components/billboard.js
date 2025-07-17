class BanterBillboardComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterBillboard;
        this.type = 'BanterBillboard';
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
            properties.smoothing = sceneComponent.smoothing;
        }
        
        const boolProps = ['enableXAxis', 'enableYAxis', 'enableZAxis'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterBillboard:`, e);
        }
    }
}