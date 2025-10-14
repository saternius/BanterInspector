const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class AvatarPedestalComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterAvatarPedestal;
        this.type = 'AvatarPedestal';
    }

    defaultProperties() {
        return {
            avatarId: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        if (sceneComponent.avatarId !== undefined) {
            properties.avatarId = parseBest(sceneComponent.avatarId);
        }

        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on AvatarPedestal:`, e);
        }
    }
}
