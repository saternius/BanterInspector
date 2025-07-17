class MeshColliderComponent extends SlotComponent {
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
            properties.isTrigger = sceneComponent.isTrigger;
        }
        
        if (sceneComponent.convex !== undefined) {
            properties.convex = sceneComponent.convex;
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
            console.error(`Failed to update ${property} on MeshCollider:`, e);
        }
    }
}