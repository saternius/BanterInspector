const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class VideoPlayerComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterVideoPlayer;
        this.type = 'VideoPlayer';
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

        // Read-only properties
        const readOnlyBoolProps = ['isPlaying', 'isLooping', 'isPrepared', 'isMuted'];
        readOnlyBoolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        const readOnlyFloatProps = ['duration'];
        readOnlyFloatProps.forEach(prop => {
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
            // Don't try to set read-only properties
            const readOnlyProps = ['isPlaying', 'isLooping', 'isPrepared', 'isMuted', 'duration'];
            if (!readOnlyProps.includes(property) && this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on VideoPlayer:`, e);
        }
    }

    // Control methods
    PlayToggle() {
        if (this._bs && typeof this._bs.PlayToggle === 'function') {
            this._bs.PlayToggle();
        }
    }

    MuteToggle() {
        if (this._bs && typeof this._bs.MuteToggle === 'function') {
            this._bs.MuteToggle();
        }
    }

    Stop() {
        if (this._bs && typeof this._bs.Stop === 'function') {
            this._bs.Stop();
        }
    }
}