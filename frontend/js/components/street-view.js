class BanterStreetViewComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterStreetView;
        this.type = 'BanterStreetView';
    }

    defaultProperties() {
        return {
            panoId: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.panoId !== undefined) {
            properties.panoId = sceneComponent.panoId;
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
            console.error(`Failed to update ${property} on BanterStreetView:`, e);
        }
    }
}