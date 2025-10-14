const { ParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class HelicoidComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterHelicoid;
        this.type = 'Helicoid';
    }
}
