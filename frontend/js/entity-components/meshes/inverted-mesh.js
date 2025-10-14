const { MeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class InvertedMeshComponent extends MeshComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterInvertedMesh;
        this.type = 'InvertedMesh';
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