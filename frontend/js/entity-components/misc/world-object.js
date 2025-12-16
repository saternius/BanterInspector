import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';

export class WorldObjectComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterWorldObject;
        this.type = 'WorldObject';
    }

    defaultProperties() {
        return {};
    }

    extractProperties(sceneComponent) {
        return {};
    }

    _set(property, value) {
        // BanterWorldObject has no properties to update
    }
}