const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);

export class BanterGLTFComponent extends EntityComponent {
    constructor() {
        super();
        this.bsRef = false;
        this.type = 'BanterGLTF';
        this.generationTimeout = null;
        this.gltfObject = null;
        this.gltfComponent = null;
        this.gltfTransform = null;
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

    async generate(){
        if(!this.properties.url || this.properties.url === ''){
            log('gltf', 'no url provided, skipping generation..')
            return;
        }

        log('gltf', 'generating', this.properties)
        if(this.gltfObject){
            log('gltf', 'destroying old gltf object..')
            await this.gltfObject.Destroy();
        }
        log('gltf', 'creating new gltf object..')
        this.gltfObject = new BS.GameObject();
        log('gltf', 'creating new gltf component..')
        this.gltfComponent = new BS.BanterGLTF(this.properties.url, this.properties.generateMipMaps, this.properties.addColliders, this.properties.nonConvexColliders, this.properties.slippery, this.properties.climbable, this.properties.legacyRotate);
        log('gltf', 'adding component..')
        await this.gltfObject.AddComponent(this.gltfComponent);
        log('gltf', 'added component..')
        this.gltfTransform = await this.gltfObject.AddComponent(new BS.Transform());
        log('gltf', 'adding transform..')
        this.gltfTransform.localScale = new BS.Vector3(0.01, 0.01, 0.01);
        log('gltf', 'set scale..')
        await this.gltfObject.SetParent(this._entity._bs, true);
        log('gltf', 'set parent..')

       
        // const go = new BS.GameObject();
        // const glb = new BS.BanterGLTF('https://cdn.sidequestvr.com/file/2309817/christmas_tree_polycraft.glb');
        // await go.AddComponent(glb);
        // const transform = await go.AddComponent(new BS.Transform());
        // transform.localScale = new BS.Vector3(0.01, 0.01, 0.01);      
        
    }

    async _set(property, value) {
        // if (!this._bs) return;

        value = parseBest(value);
        this.properties[property] = value;

        // try {
        //     if (this._bs[property] !== undefined) {
        //         this._bs[property] = value;
        //     }
        // } catch (e) {
        //     console.error(`Failed to update ${property} on BanterGLTF:`, e);
        // }

        if(this.generationTimeout){
            clearTimeout(this.generationTimeout);
        }
        this.generationTimeout = setTimeout(this.generate.bind(this), 500)
    }
}