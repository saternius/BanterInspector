class BanterBrowserComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterBrowser;
        this.type = 'BanterBrowser';
    }

    defaultProperties() {
        return {
            url: '',
            mipMaps: 4,
            pixelsPerUnit: 1200,
            pageWidth: 1024,
            pageHeight: 576,
            actions: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.url !== undefined) {
            properties.url = sceneComponent.url;
        }
        
        const intProps = ['mipMaps', 'pixelsPerUnit', 'pageWidth', 'pageHeight'];
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        if (sceneComponent.actions !== undefined) {
            properties.actions = sceneComponent.actions;
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
            console.error(`Failed to update ${property} on BanterBrowser:`, e);
        }
    }
}