const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class PillowComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPillow;
        this.type = 'Pillow';
    }
}
