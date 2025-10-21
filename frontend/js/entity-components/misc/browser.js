const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BrowserComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterBrowser;
        this.type = 'Browser';
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
            properties.url = parseBest(sceneComponent.url);
        }
        
        const intProps = ['mipMaps', 'pixelsPerUnit', 'pageWidth', 'pageHeight'];
        intProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        if (sceneComponent.actions !== undefined) {
            properties.actions = parseBest(sceneComponent.actions);
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
            console.error(`Failed to update ${property} on Browser:`, e);
        }
        this.checkSpaceDiff();
    }
}