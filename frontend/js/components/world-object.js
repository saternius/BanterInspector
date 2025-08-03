const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterWorldObjectComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterWorldObject;
        this.type = 'BanterWorldObject';
    }

    defaultProperties() {
        return {};
    }

    extractProperties(sceneComponent) {
        return {};
    }

    update(property, value) {
        // BanterWorldObject has no properties to update
    }
}