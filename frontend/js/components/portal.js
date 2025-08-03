const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterPortalComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterPortal;
        this.type = 'BanterPortal';
    }

    defaultProperties() {
        return {
            url: '',
            instance: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.url !== undefined) {
            properties.url = sceneComponent.url;
        }
        
        if (sceneComponent.instance !== undefined) {
            properties.instance = sceneComponent.instance;
        }
        
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
            console.error(`Failed to update ${property} on BanterPortal:`, e);
        }
    }
}