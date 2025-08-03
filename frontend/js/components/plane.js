const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterPlaneComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterPlane;
        this.type = 'BanterPlane';
    }

    defaultProperties() {
        return {
            width: 1,
            height: 1,
            widthSegments: 1,
            heightSegments: 1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['width', 'height'];
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
            console.error(`Failed to update ${property} on BanterPlane:`, e);
        }
    }
}