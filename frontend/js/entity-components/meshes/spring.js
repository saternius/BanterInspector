const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class SpringComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSpring;
        this.type = 'Spring';
    }
}
