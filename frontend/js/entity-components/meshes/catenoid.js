const { BanterParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class BanterCatenoidComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterCatenoid;
        this.type = 'BanterCatenoid';
    }
}
