const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);

export class BanterAudioSourceComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterAudioSource;
        this.type = 'BanterAudioSource';
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
                properties[prop] = sceneComponent[prop];
            }
        });
        
        const boolProps = ['mute', 'loop', 'bypassEffects', 'bypassListenerEffects', 
                          'bypassReverbZones', 'playOnAwake'];
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
            console.error(`Failed to update ${property} on BanterAudioSource:`, e);
        }
    }
}