const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class FermetComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterFermet;
        this.type = 'Fermet';
    }
}
