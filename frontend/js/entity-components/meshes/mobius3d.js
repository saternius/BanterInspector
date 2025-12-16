import { ParametricSurfaceComponent } from './parametric-surface.js';

export class Mobius3dComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterMobius3d;
        this.type = 'Mobius3d';
    }
}
