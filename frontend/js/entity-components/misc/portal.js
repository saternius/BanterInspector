const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class PortalComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPortal;
        this.type = 'Portal';
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
            properties.url = parseBest(sceneComponent.url);
        }
        
        if (sceneComponent.instance !== undefined) {
            properties.instance = parseBest(sceneComponent.instance);
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
            console.error(`Failed to update ${property} on Portal:`, e);
        }
        this.checkSpaceDiff();
    }
}