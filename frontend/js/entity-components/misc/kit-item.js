const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterKitItemComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterKitItem;
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

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
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