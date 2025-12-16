import { ParametricSurfaceComponent } from './parametric-surface.js';

export class PillowComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterPillow;
        this.type = 'Pillow';
    }
}
