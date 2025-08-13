const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class MeshColliderComponent extends EntityComponent {
    constructor() {
        super();
        this.bsRef = BS.MeshCollider;
        this.type = 'MeshCollider';
    }

    defaultProperties() {
        return {
            isTrigger: false,
            convex: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.isTrigger !== undefined) {
            properties.isTrigger = parseBest(sceneComponent.isTrigger);
        }
        
        if (sceneComponent.convex !== undefined) {
            properties.convex = parseBest(sceneComponent.convex);
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
            console.error(`Failed to update ${property} on MeshCollider:`, e);
        }
    }
}