import { ParametricSurfaceComponent } from './parametric-surface.js';

export class SpiralComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSpiral;
        this.type = 'Spiral';
    }
}
