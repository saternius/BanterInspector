const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class UIPanelComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterUIPanel;
        this.type = 'UIPanel';
    }

    defaultProperties() {
        return {
            resolution: { x: 1024, y: 1024 },
            screenSpace: false,
            enableHaptics: true,
            clickHaptic: 0.5,
            enterHaptic: 0.2,
            exitHaptic: 0.1,
            enableSounds: true,
            clickSoundUrl: '',
            enterSoundUrl: '',
            exitSoundUrl: ''
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        // Vector2 property (resolution)
        if (sceneComponent.resolution !== undefined) {
            properties.resolution = {
                x: sceneComponent.resolution.x || 1024,
                y: sceneComponent.resolution.y || 1024
            };
        }

        // Boolean properties
        const boolProps = ['screenSpace', 'enableHaptics', 'enableSounds'];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        // Float properties
        const floatProps = ['clickHaptic', 'enterHaptic', 'exitHaptic'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        // String properties
        const stringProps = ['clickSoundUrl', 'enterSoundUrl', 'exitSoundUrl'];
        stringProps.forEach(prop => {
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
            if (property === 'resolution' && typeof value === 'object') {
                this._bs.resolution = new BS.Vector2(value.x || 1024, value.y || 1024);
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on UIPanel:`, e);
        }
        this.checkSpaceDiff();
    }

    // Methods
    SetBackgroundColor(color) {
        if (this._bs && typeof this._bs.SetBackgroundColor === 'function') {
            this._bs.SetBackgroundColor(color);
        }
    }
}
