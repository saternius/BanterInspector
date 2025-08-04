const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterCylinderComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterCylinder;
        this.type = 'BanterCylinder';
    }

    defaultProperties() {
        return {
            topRadius: 1,
            bottomRadius: 1,
            height: 1,
            radialSegments: 32,
            heightSegments: 1,
            openEnded: false,
            thetaStart: 0,
            thetaLength: 6.283185307179586
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['topRadius', 'bottomRadius', 'height', 'thetaStart', 'thetaLength'];
        const intProps = ['radialSegments', 'heightSegments'];
        const boolProps = ['openEnded'];
        
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
        
        boolProps.forEach(prop => {
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
            console.error(`Failed to update ${property} on BanterCylinder:`, e);
        }
    }
}