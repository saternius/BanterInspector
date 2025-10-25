const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class AudioSourceComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterAudioSource;
        this.type = 'AudioSource';
    }

    defaultProperties() {
        return {
            volume: 1,
            pitch: 1,
            mute: false,
            loop: false,
            bypassEffects: false,
            bypassListenerEffects: false,
            bypassReverbZones: false,
            playOnAwake: true,
            spatialBlend: 1
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['volume', 'pitch', 'spatialBlend'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
        const boolProps = ['mute', 'loop', 'bypassEffects', 'bypassListenerEffects', 
                          'bypassReverbZones', 'playOnAwake'];
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
            console.error(`Failed to update ${property} on AudioSource:`, e);
        }

    }
}