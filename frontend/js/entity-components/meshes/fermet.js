import { ParametricSurfaceComponent } from './parametric-surface.js';

export class FermetComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterFermet;
        this.type = 'Fermet';
    }
}
