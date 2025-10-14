const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class AppleComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterApple;
        this.type = 'Apple';
    }
}
