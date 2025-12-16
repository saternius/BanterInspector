import { ParametricSurfaceComponent } from './parametric-surface.js';

export class KleinComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterKlein;
        this.type = 'Klein';
    }
}
