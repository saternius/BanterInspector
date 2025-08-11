const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterConeComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterCone;
        this.type = 'BanterCone';
    }

    defaultProperties() {
        return {
            radius: 1,
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
        
        const floatProps = ['radius', 'height', 'thetaStart', 'thetaLength'];
        const intProps = ['radialSegments', 'heightSegments'];
        const boolProps = ['openEnded'];
        
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
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
            console.error(`Failed to update ${property} on BanterCone:`, e);
        }
    }
}