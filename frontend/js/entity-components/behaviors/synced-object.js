const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class SyncedObjectComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSyncedObject;
        this.type = 'SyncedObject';
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
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
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
            console.error(`Failed to update ${property} on SyncedObject:`, e);
        }
        this.checkSpaceDiff();
    }
}