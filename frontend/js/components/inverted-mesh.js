class BanterInvertedMeshComponent extends SlotComponent {
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

    update(property, value) {
        // BanterInvertedMesh has no properties to update
    }
}