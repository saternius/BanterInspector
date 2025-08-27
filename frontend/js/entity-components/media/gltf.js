const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterGLTFComponent extends EntityComponent {
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
            properties.url = parseBest(sceneComponent.url);
        }
        
        const boolProps = [
            'generateMipMaps', 'addColliders', 'nonConvexColliders',
            'slippery', 'climbable', 'legacyRotate'
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
            console.error(`Failed to update ${property} on BanterGLTF:`, e);
        }

       
        if(this.initialized){
            log('gltf', 'setting',  this.properties)
            let newBS = new BS.BanterGLTF(this.properties.url, this.properties.generateMipMaps, this.properties.addColliders, this.properties.nonConvexColliders, this.properties.slippery, this.properties.climbable, this.properties.legacyRotate);
            this._entity._bs.AddComponent(newBS);
            this._bs.Destroy();
            this._bs = newBS;
        }
    }
}