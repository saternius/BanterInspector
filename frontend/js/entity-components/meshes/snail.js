const { BanterParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class BanterSnailComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSnail;
        this.type = 'BanterSnail';
    }
}
