import { ParametricSurfaceComponent } from './parametric-surface.js';

export class NaticaComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterNatica;
        this.type = 'Natica';
    }
}
