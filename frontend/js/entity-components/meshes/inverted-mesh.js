const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterInvertedMeshComponent extends EntityComponent {
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