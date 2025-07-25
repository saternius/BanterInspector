let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterGrabHandleComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterGrabHandle;
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
            properties.grabType = sceneComponent.grabType;
        }
        
        if (sceneComponent.grabRadius !== undefined) {
            properties.grabRadius = sceneComponent.grabRadius;
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
            console.error(`Failed to update ${property} on BanterGrabHandle:`, e);
        }
    }
}