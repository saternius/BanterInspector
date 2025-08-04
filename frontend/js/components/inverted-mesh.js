const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterInvertedMeshComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterInvertedMesh;
        this.type = 'BanterInvertedMesh';
    }

    defaultProperties() {
        return {};
    }

    extractProperties(sceneComponent) {
        return {};
    }

    _set(property, value) {
        // BanterInvertedMesh has no properties to update
    }
}