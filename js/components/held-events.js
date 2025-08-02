const { SlotComponent } = await import(`${window.repoUrl}/js/components/slot-component.js`);

export class BanterHeldEventsComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterHeldEvents;
        this.type = 'BanterHeldEvents';
    }

    defaultProperties() {
        return {
            sensitivity: 1,
            fireRate: 0.1,
            auto: false,
            blockLeftPrimary: false,
            blockLeftSecondary: false,
            blockRightPrimary: false,
            blockRightSecondary: false,
            blockLeftThumbstick: false,
            blockLeftThumbstickClick: false,
            blockRightThumbstick: false,
            blockRightThumbstickClick: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['sensitivity', 'fireRate'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        const boolProps = [
            'auto', 'blockLeftPrimary', 'blockLeftSecondary', 
            'blockRightPrimary', 'blockRightSecondary',
            'blockLeftThumbstick', 'blockLeftThumbstickClick',
            'blockRightThumbstick', 'blockRightThumbstickClick'
        ];
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
            console.error(`Failed to update ${property} on BanterHeldEvents:`, e);
        }
    }
}