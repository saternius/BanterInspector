import { ParametricSurfaceComponent } from './parametric-surface.js';

export class HelicoidComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterHelicoid;
        this.type = 'Helicoid';
    }
}
