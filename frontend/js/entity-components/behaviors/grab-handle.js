const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterGrabHandleComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterGrabHandle;
        this.type = 'BanterGrabHandle';
    }

    defaultProperties() {
        return {
            grabType: 0,
            grabRadius: 0.1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.grabType !== undefined) {
            properties.grabType = parseBest(sceneComponent.grabType);
        }
        
        if (sceneComponent.grabRadius !== undefined) {
            properties.grabRadius = parseBest(sceneComponent.grabRadius);
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
            console.error(`Failed to update ${property} on BanterGrabHandle:`, e);
        }
    }
}