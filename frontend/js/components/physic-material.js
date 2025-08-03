const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterPhysicMaterialComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterPhysicMaterial;
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
            properties.dynamicFriction = sceneComponent.dynamicFriction;
        }
        
        if (sceneComponent.staticFriction !== undefined) {
            properties.staticFriction = sceneComponent.staticFriction;
        }
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

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