import { ParametricSurfaceComponent } from './parametric-surface.js';

export class ScherkComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterScherk;
        this.type = 'Scherk';
    }
}
