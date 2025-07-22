let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);

export class BanterGLTFComponent extends SlotComponent {
    constructor() {
        super();
        this.bsRef = BS.BanterGLTF;
        this.type = 'BanterGLTF';
    }

    defaultProperties() {
        return {
            url: '',
            generateMipMaps: true,
            addColliders: false,
            nonConvexColliders: false,
            slippery: false,
            climbable: false,
            legacyRotate: false
        };
    }

    extractProperties(sceneComponent) {
        const properties = {};
        
        if (sceneComponent.url !== undefined) {
            properties.url = sceneComponent.url;
        }
        
        const boolProps = [
            'generateMipMaps', 'addColliders', 'nonConvexColliders',
            'slippery', 'climbable', 'legacyRotate'
        ];
        boolProps.forEach(prop => {
            if (sceneComponent[prop] !== undefined) {
                properties[prop] = sceneComponent[prop];
            }
        });
        
        return properties;
    }

    update(property, value) {
        if (!this._bs) return;

        this.properties[property] = value;

        try {
            if (this._bs[property] !== undefined) {
                this._bs[property] = value;
            }
        } catch (e) {
            console.error(`Failed to update ${property} on BanterGLTF:`, e);
        }
    }
}