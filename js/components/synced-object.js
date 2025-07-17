let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterSyncedObjectComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterSyncedObject;
        this.type = 'BanterSyncedObject';
    }

    defaultProperties() {
        return {
            syncPosition: true,
            syncRotation: true,
            takeOwnershipOnCollision: false,
            takeOwnershipOnGrab: true,
            kinematicIfNotOwned: true
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const boolProps = ['syncPosition', 'syncRotation', 'takeOwnershipOnCollision', 
                          'takeOwnershipOnGrab', 'kinematicIfNotOwned'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
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
            console.error(`Failed to update ${property} on BanterSyncedObject:`, e);
        }
    }
}