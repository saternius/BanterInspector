const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
const { parseBest } = await import(`${window.repoUrl}/utils.js`);


// Reference code for the gltf component via pure BanterScript code
// const go = new BS.GameObject();
// const glb = new BS.BanterGLTF('https://cdn.sidequestvr.com/file/2309817/christmas_tree_polycraft.glb');
// await go.AddComponent(glb);
// const transform = await go.AddComponent(new BS.Transform());
// transform.localScale = new BS.Vector3(0.01, 0.01, 0.01);    

export class GLTFComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = false;
        this.type = 'GLTF';
        this._generationTimeout = null;
        this._gltfObject = null;
        this._gltfComponent = null;
        this._gltfTransform = null;
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
        if(this._gltfObject){
            log('gltf', 'destroying old gltf object..')
            await this._gltfObject.Destroy();
        }
        log('gltf', 'creating new gltf object..')
        this._gltfObject = new BS.GameObject();
        this._gltfComponent = new BS.BanterGLTF(this.properties.url, this.properties.generateMipMaps, this.properties.addColliders, this.properties.nonConvexColliders, this.properties.slippery, this.properties.climbable, this.properties.legacyRotate);
        await this._gltfObject.AddComponent(this._gltfComponent);

        // this._gltfComponent.On("loaded",() => {
        //     // go 
        //   });
        
        
        // let parentTransform = await this._entity.transform;
        // let position = parentTransform.position;
        // let rotation = parentTransform.rotation;
        // let localScale = parentTransform.localScale;
        // log('gltf', 'parentTransform', position, rotation, localScale, this._entity.id)
        // this._gltfTransform = this._gltfObject.transform;
        // this._gltfTransform.position = new BS.Vector3(position.x,position.y, position.z);
        // this._gltfTransform.rotation = new BS.Vector4(rotation.x,rotation.y, rotation.z, rotation.w);
        // this._gltfTransform.localScale = new BS.Vector3(localScale.x, localScale.y, localScale.z);

        await this._gltfObject.SetParent(this._entity._bs, false);
        await this._gltfObject.SetLayer(5);  
        
    }

    async _set(property, value) {
        value = parseBest(value);
        this.properties[property] = value;
        if(this._generationTimeout){
            clearTimeout(this._generationTimeout);
        }
        this._generationTimeout = setTimeout(this.generate.bind(this), 500)

    }
}