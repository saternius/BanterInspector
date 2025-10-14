const { BanterParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class BanterMobius3dComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterMobius3d;
        this.type = 'BanterMobius3d';
    }
}
