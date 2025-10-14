const { BanterParametricSurfaceComponent } = await import(`${window.repoUrl}/entity-components/meshes/parametric-surface.js`);

export class BanterHelicoidComponent extends BanterParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterHelicoid;
        this.type = 'BanterHelicoid';
    }
}
