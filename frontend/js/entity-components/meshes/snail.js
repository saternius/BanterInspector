import { ParametricSurfaceComponent } from './parametric-surface.js';

export class SnailComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterSnail;
        this.type = 'Snail';
    }
}
