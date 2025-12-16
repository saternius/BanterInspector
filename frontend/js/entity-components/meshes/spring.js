import { ParametricSurfaceComponent } from './parametric-surface.js';

export class SpringComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSpring;
        this.type = 'Spring';
    }
}
