const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterPhysicMaterialComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPhysicMaterial;
        this.type = 'BanterPhysicMaterial';
    }

    defaultProperties() {
        return {
            dynamicFriction: 0.6,
            staticFriction: 0.6
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.dynamicFriction !== undefined) {
            properties.dynamicFriction = parseBest(sceneComponent.dynamicFriction);
        }
        
        if (sceneComponent.staticFriction !== undefined) {
            properties.staticFriction = parseBest(sceneComponent.staticFriction);
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
            console.error(`Failed to update ${property} on BanterPhysicMaterial:`, e);
        }
    }
}