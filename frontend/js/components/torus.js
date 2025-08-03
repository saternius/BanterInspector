class BanterTorusComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterTorus;
        this.type = 'BanterTorus';
    }

    defaultProperties() {
        return {
            tube: 1,
            radialSegments: 8,
            tubularSegments: 6,
            arc: 6.283185307179586
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['tube', 'arc'];
        const intProps = ['radialSegments', 'tubularSegments'];
        
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

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterTorus:`, e);
        }
    }
}