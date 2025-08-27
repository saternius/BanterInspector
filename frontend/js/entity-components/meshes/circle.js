const { BanterMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/mesh-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterCircleComponent extends BanterMeshComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterCircle;
        this.type = 'BanterCircle';
    }

    defaultProperties() {
        return {
            radius: 1,
            segments: 1,
            thetaStart: 0,
            thetaLength: 6.283185307179586
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        const floatProps = ['radius', 'thetaStart', 'thetaLength'];
        const intProps = ['segments'];
        
        floatProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = parseBest(sceneComponent[prop]);
            }
        });
        
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
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterCircle:`, e);
        }
    }
}