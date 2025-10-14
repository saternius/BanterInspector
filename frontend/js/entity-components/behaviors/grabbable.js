const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class GrabbableComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.BanterGrabbable;
        this.type = 'Grabbable';
    }

    defaultProperties() {
        return {
            grabType: 0,
            grabRadius: 0.1,
            gunTriggerSensitivity: 0.5,
            gunTriggerFireRate: 0.1,
            gunTriggerAutoFire: false,
            blockLeftPrimary: false,
            blockLeftSecondary: false,
            blockRightPrimary: false,
            blockRightSecondary: false,
            blockLeftThumbstick: false,
            blockLeftThumbstickClick: false,
            blockRightThumbstick: false,
            blockRightThumbstickClick: false,
            blockLeftTrigger: false,
            blockRightTrigger: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        // Numeric properties
        const numericProps = ['grabType', 'grabRadius', 'gunTriggerSensitivity', 'gunTriggerFireRate'];
        numericProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        // Boolean properties
        const boolProps = [
            'gunTriggerAutoFire',
            'blockLeftPrimary',
            'blockLeftSecondary',
            'blockRightPrimary',
            'blockRightSecondary',
            'blockLeftThumbstick',
            'blockLeftThumbstickClick',
            'blockRightThumbstick',
            'blockRightThumbstickClick',
            'blockLeftTrigger',
            'blockRightTrigger'
        ];
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
            console.error(`Failed to update ${property} on Grabbable:`, e);
        }
    }
}
