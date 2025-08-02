const { SlotComponent } = await import(`${window.repoUrl}/js/components/slot-component.js`);

export class BanterVideoPlayerComponent extends SlotComponent {
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
            properties.url = sceneComponent.url;
        }
        
        const floatProps = ['volume', 'time'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        const boolProps = ['loop', 'playOnAwake', 'skipOnDrop', 'waitForFirstFrame'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    _set(property, value) {
        if (!this._bs) return;

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