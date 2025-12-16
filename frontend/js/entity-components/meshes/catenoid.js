import { ParametricSurfaceComponent } from './parametric-surface.js';

export class CatenoidComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterCatenoid;
        this.type = 'Catenoid';
    }
}
