const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class MobiusComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterMobius;
        this.type = 'Mobius';
    }
}
