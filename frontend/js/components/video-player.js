const { EntityComponent } = await import(`${window.repoUrl}/components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterVideoPlayerComponent extends EntityComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterVideoPlayer;
        this.type = 'BanterVideoPlayer';
    }

    defaultProperties() {
        return {
            url: '',
            volume: 1,
            loop: false,
            playOnAwake: true,
            skipOnDrop: false,
            waitForFirstFrame: false,
            time: 0
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.url !== undefined) {
            properties.url = parseBest(sceneComponent.url);
        }
        
        const floatProps = ['volume', 'time'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        const boolProps = ['loop', 'playOnAwake', 'skipOnDrop', 'waitForFirstFrame'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
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
            console.error(`Failed to update ${property} on BanterVideoPlayer:`, e);
        }
    }
}