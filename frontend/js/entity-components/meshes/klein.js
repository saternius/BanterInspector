const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class KleinComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterKlein;
        this.type = 'Klein';
    }
}
