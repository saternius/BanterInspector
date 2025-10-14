const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);

export class ColliderEventsComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterColliderEvents;
        this.type = 'ColliderEvents';
    }

    defaultProperties() {
        return {};
    }

    extractProperties(sceneComponent) {
        return {};
    }

    _set(property, value) {
        // BanterColliderEvents has no properties to update
    }
}