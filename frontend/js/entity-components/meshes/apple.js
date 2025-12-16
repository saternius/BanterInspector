import { ParametricSurfaceComponent } from './parametric-surface.js';

export class AppleComponent extends ParametricSurfaceComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterApple;
        this.type = 'Apple';
    }
}
