const { BanterParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class BanterPillowComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPillow;
        this.type = 'BanterPillow';
    }
}
