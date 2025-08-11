const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

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

    _set(property, value) {
        // BanterWorldObject has no properties to update
    }
}