const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterColliderEventsComponent extends SlotComponent {
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

    _set(property, value) {
        // BanterColliderEvents has no properties to update
    }
}