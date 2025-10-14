const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class HornComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterHorn;
        this.type = 'Horn';
    }
}
