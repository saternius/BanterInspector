import { ParametricSurfaceComponent } from './parametric-surface.js';

export class MobiusComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterMobius;
        this.type = 'Mobius';
    }
}
