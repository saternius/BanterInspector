import { EntityComponent } from '../entity-component.js';
import { parseBest } from '../../utils.js';


// Reference code for the gltf component via pure BanterScript code
// const go = new BS.GameObject();
// const glb = new BS.BanterGLTF('https://cdn.sidequestvr.com/file/2309817/christmas_tree_polycraft.glb');
// await go.AddComponent(glb);
// const transform = await go.AddComponent(new BS.Transform());
// transform.localScale = new BS.Vector3(0.01, 0.01, 0.01);

export class GLTFControls {
    constructor(component) {
        this.component = component;
        this.crawling = false;
        this.type = 'GLTF';
        this.controls = {
            'crawl': {
                'input': 'button',
                'callback': this.crawlInlineObjects.bind(this),
                'label': 'Crawl Inline Objects',
                'id': 'crawl'
            }
        }
    }

    // Sanitize names for Firebase paths - replace invalid chars with underscore
    sanitizeName(name) {
        if (!name) return 'unnamed';
        // Firebase disallows: ".", "#", "$", "[", "]"
        return name.replace(/[.#$\[\]]/g, '_');
    }

    async crawlInlineObjects() {
        if (this.crawling) return;

        const buttonEl = document.getElementById(`${this.component.id}_crawl`);

        try {
            this.crawling = true;
            buttonEl.innerHTML = 'Crawling...';
            buttonEl.disabled = true;

            // Call BS method to expose inline objects
            console.log('GLTF Crawl: Starting CrawlInlineObjects...');
            await this.component._entity._bs.CrawlInlineObjects();
            console.log('GLTF Crawl: CrawlInlineObjects complete');

            // Brief delay for Unity to update hierarchy
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create entities for newly exposed children
            console.log('GLTF Crawl: Creating entities for children...');
            await this.createEntitiesForChildren();
            console.log('GLTF Crawl: Entity creation complete');

            inspector.hierarchyPanel.render();

            buttonEl.innerHTML = 'Crawl Complete';
            setTimeout(() => {
                buttonEl.innerHTML = this.controls['crawl'].label;
                buttonEl.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Error crawling inline objects:', error);
            buttonEl.innerHTML = 'Crawl Failed';
            setTimeout(() => {
                buttonEl.innerHTML = this.controls['crawl'].label;
                buttonEl.disabled = false;
            }, 2000);
        } finally {
            this.crawling = false;
        }
    }

    async createEntitiesForChildren() {
        const parentEntity = this.component._entity;
        const parentGameObject = parentEntity._bs;
        const existingChildNames = new Set(parentEntity.children.map(c => c.name));

        console.log('GLTF Crawl: parentGameObject.unityId =', parentGameObject.unityId);
        console.log('GLTF Crawl: Has Traverse?', !!parentGameObject.Traverse);

        if (parentGameObject.Traverse) {
            const childrenToProcess = [];

            console.log('GLTF Crawl: Starting traverse...');
            parentGameObject.Traverse((child) => {
                console.log('GLTF Crawl: Found child:', child?.name, 'id:', child?.id, 'parent:', child?.parent);
                // Exclude self and only get direct children
                if (child && child.id !== parentGameObject.unityId && parseInt(child.parent) === parseInt(parentGameObject.unityId)) {
                    const sanitizedChildName = this.sanitizeName(child.name);
                    if (!existingChildNames.has(sanitizedChildName)) {
                        childrenToProcess.push(child);
                    }
                }
            });
            console.log('GLTF Crawl: Traverse complete, found', childrenToProcess.length, 'children');

            for (const child of childrenToProcess) {
                console.log('GLTF Crawl: Processing child:', child.name);
                await this.createEntityFromGameObject(child, parentEntity);
            }
        }
    }

    async createEntityFromGameObject(gameObject, parentEntity) {
        const { Entity } = await import('../../entity.js');

        const sanitizedName = this.sanitizeName(gameObject.name);
        console.log('GLTF Crawl: Creating entity for', gameObject.name, '(sanitized:', sanitizedName + ')');

        const newEntity = await new Entity().init({
            name: sanitizedName,
            parentId: parentEntity.id,
            _bs: gameObject,
            layer: gameObject.layer || 0,
            localPosition: gameObject.transform.localPosition,
            localRotation: gameObject.transform.localRotation,
            localScale: gameObject.transform.localScale,
        }, { context: "crawl" });

        if (!parentEntity.children.includes(newEntity)) {
            parentEntity.children.push(newEntity);
        }

        console.log('GLTF Crawl: Entity created:', newEntity.id);

        // Recursively process grandchildren
        // The gameObject from Traverse has 'id' (UUID) and we need to find its Unity instance ID
        // which children reference via their 'parent' property
        const gameObjectInstanceId = gameObject.unityId || gameObject.instanceId || gameObject.parent;
        console.log('GLTF Crawl:', gameObject.name, 'gameObject keys:', Object.keys(gameObject), 'unityId:', gameObject.unityId, 'instanceId:', gameObject.instanceId);

        if (gameObject.Traverse) {
            const grandchildren = [];
            gameObject.Traverse((grandchild) => {
                console.log('GLTF Crawl: Grandchild check:', grandchild?.name, 'parent:', grandchild?.parent, 'vs gameObject unityId:', gameObjectInstanceId);
                // Exclude self and only get direct children of this gameObject
                if (grandchild && grandchild.id !== gameObject.id && parseInt(grandchild.parent) === parseInt(gameObjectInstanceId)) {
                    grandchildren.push(grandchild);
                }
            });

            console.log('GLTF Crawl:', gameObject.name, 'has', grandchildren.length, 'grandchildren');

            for (const grandchild of grandchildren) {
                await this.createEntityFromGameObject(grandchild, newEntity);
            }
        }

        return newEntity;
    }
}

export class GLTFComponent extends EntityComponent {
    constructor() {
        super();
        this._bsRef = false;
        this.type = 'GLTF';
        this._generationTimeout = null;
        this._gltfComponent = null;
        this._gltfTransform = null;
        this._controls = new GLTFControls(this);
        this._listeners = new Map();
    }

    On(event, callback) {
        this._listeners.set(event, callback);
    }

    Off(event) {
        this._listeners.delete(event);
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
        if(this._gltfComponent){
            log('gltf', 'destroying old gltf component..')
            await this._gltfComponent.Destroy();
        }

        log('gltf', 'creating new gltf object..')
        this._gltfComponent = new BS.BanterGLTF(this.properties.url, this.properties.generateMipMaps, this.properties.addColliders, this.properties.nonConvexColliders, this.properties.slippery, this.properties.climbable, this.properties.legacyRotate);
        this._bs = this._gltfComponent;
        this._gltfComponent.On('loaded', ()=>{
            if(this._listeners.has('loaded')){
                this._listeners.get('loaded')()
            }
        })

        this._gltfComponent.On('unity-linked', ()=>{
            if(this._listeners.has('unity-linked')){
                this._listeners.get('unity-linked')()   
            }
        })

        this._gltfComponent.On('progress', (e)=>{
            log('gltf', 'progress', e)
            if(this._listeners.has('progress')){
                this._listeners.get('progress')(e)   
            }
        })

        await this._entity._bs.AddComponent(this._gltfComponent);
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