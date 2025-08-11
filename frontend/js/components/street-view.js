const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterStreetViewComponent extends SlotComponent {
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
            properties.panoId = parseBest(sceneComponent.panoId);
        }
        
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
            console.error(`Failed to update ${property} on BanterStreetView:`, e);
        }
    }
}