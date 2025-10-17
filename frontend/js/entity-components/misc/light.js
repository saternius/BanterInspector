const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class LightComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = BS.Light;
        this.type = 'Light';
    }

    enums(){
        return {
            type: {
                0: 'SPOT',
                1: 'DIRECTIONAL',
                2: 'POINT',
                3: 'RECTANGLE',
                4: 'DISC',
                5: 'PYRAMID',
                6: 'BOX',
                7: 'TUBE'
            }
        }
    }

    defaultProperties() {
        return {
            type: 1,              // LightType: Directional=0, Point=1, Spot=2, Area=3
            color: { r: 1, g: 1, b: 1, a: 1 },  // White light
            intensity: 1,         // Light intensity
            range: 10,            // Range for Point and Spot lights
            spotAngle: 30,        // Outer cone angle for Spot lights (degrees)
            innerSpotAngle: 21.8, // Inner cone angle for Spot lights (degrees)
            shadows: 0,           // ShadowType: None=0, Hard=1, Soft=2
            shadowStrength: 1,    // Shadow intensity (0-1)
            bounceIntensity: 1,   // Indirect lighting intensity
            cookieSize: 10,       // Cookie texture size for directional lights
            renderMode: 0,        // Auto=0, Important=1, NotImportant=2
            cullingMask: -1       // Layers to illuminate (-1 = everything)
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};

        // Color property
        if (sceneComponent.color !== undefined) {
            properties.color = {
                r: sceneComponent.color.r || 1,
                g: sceneComponent.color.g || 1,
                b: sceneComponent.color.b || 1,
                a: sceneComponent.color.a || 1
            };
        }

        // Float properties
        const floatProps = ['intensity', 'range', 'spotAngle', 'innerSpotAngle',
                           'shadowStrength', 'bounceIntensity', 'cookieSize'];
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });

        // Integer/enum properties
        const intProps = ['type', 'shadows', 'renderMode', 'cullingMask'];
        intProps.forEach(prop => {
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
            if (property === 'color' && typeof value === 'object') {
                // Handle color as Color object
                if (BS.Color) {
                    this._bs[property] = new BS.Color(
                        value.r || 0,
                        value.g || 0,
                        value.b || 0,
                        value.a || 1
                    );
                }
            } else if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on Light:`, e);
        }
    }
}
