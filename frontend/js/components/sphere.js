const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterSphereComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterSphere;
        this.type = 'BanterSphere';
    }

    defaultProperties() {
        return {
            radius: 1,
            widthSegments: 16,
            heightSegments: 16,
            phiStart: 0,
            phiLength: 6.283185307179586,
            thetaStart: 0,
            thetaLength: 3.141592653589793
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['radius', 'phiStart', 'phiLength', 'thetaStart', 'thetaLength'];
        const intProps = ['widthSegments', 'heightSegments'];
        
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
            console.error(`Failed to update ${property} on BanterSphere:`, e);
        }
    }
}