const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class CatenoidComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterCatenoid;
        this.type = 'Catenoid';
    }
}
