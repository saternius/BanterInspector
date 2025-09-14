const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);

export class BanterColliderEventsComponent extends EntityComponent {
    constructor() {
        super();
        this.bsRe_bsReff = BS.BanterColliderEvents;
        this.type = 'BanterColliderEvents';
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