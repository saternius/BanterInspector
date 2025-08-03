const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterKitItemComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterKitItem;
        this.type = 'BanterKitItem';
    }

    defaultProperties() {
        return {
            path: '',
            resetTransform: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.path !== undefined) {
            properties.path = sceneComponent.path;
        }
        
        if (sceneComponent.resetTransform !== undefined) {
            properties.resetTransform = sceneComponent.resetTransform;
        }
        
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
            console.error(`Failed to update ${property} on BanterKitItem:`, e);
        }
    }
}