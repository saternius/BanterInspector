class BanterColliderEventsComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterColliderEvents;
        this.type = 'BanterColliderEvents';
    }

    defaultProperties() {
        return {};
    }

    extractProperties(sceneComponent) {
        return {};
    }

    update(property, value) {
        // BanterColliderEvents has no properties to update
    }
}