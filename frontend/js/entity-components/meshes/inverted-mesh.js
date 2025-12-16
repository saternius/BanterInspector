import { MeshComponent } from './mesh-component.js';
import { parseBest } from '../../utils.js';

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