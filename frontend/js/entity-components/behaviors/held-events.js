const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);
export class BanterHeldEventsComponent extends EntityComponent {
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
                properties[prop] = parseBest(sceneComponent[prop]);
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
            console.error(`Failed to update ${property} on BanterHeldEvents:`, e);
        }
    }
}