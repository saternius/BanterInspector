const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class NaticaComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterNatica;
        this.type = 'Natica';
    }
}
