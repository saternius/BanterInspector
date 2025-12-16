import { JointComponent } from './joint-component.js';
import { parseBest } from '../../utils.js';

export class FixedJointComponent extends JointComponent {
    constructor() {
        super();
        this._bsRef = BS.FixedJoint;
        this.type = 'FixedJoint';
    }

    defaultProperties() {
        return this.defaultJointProperties();
    }

    extractProperties(sceneComponent) {
        return this.extractJointProperties(sceneComponent);
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        this._setJointProperty(property, value);

    }
}
