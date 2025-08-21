/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

// (async () => {
    // let localhost = window.location.hostname === 'localhost'
    const { SUPPORTED_COMPONENTS, Entity, TransformComponent, componentBSTypeMap, componentTypeMap, componentTextMap, componentBundleMap, MonoBehaviorComponent } = await import( `${window.repoUrl}/entity-components/index.js`);

    export class SceneManager {
        constructor() {
            this.scene = null;
            this.entityData = {
                entities: [],
                entityMap:{},
                componentMap: {}
            };
            this.props = {
                hierarchy: null,
            }
            this.selectedEntity = null;
            this.expandedNodes = new Set();
            this.loaded = false;

            setInterval(()=>{
                this.saveScene();
            }, 5000)
        }
        

        myName(){
            return this.scene.localUser.name ///`${}_${this.scene.localUser.id.slice(0,3)}`
        }

        changeFileServer(value){
            localStorage.setItem('file_server', value);
            window.location.reload();
        }

        async initializeMock(){
            this.scene = {
                unityLoaded: true,
                spaceState:{
                    public:{
                        text:"Hello World"
                    },
                    protected:{
                        maxPlayers: 8
                    },
                },
                localUser:{
                    name: "Tutorial User",
                    uid: "tutorial-user-123",
                    id: "abcdefghi",
                    isLocal: true,
                    color: "#667eea"
                },
                addEventListener: (event, callback)=>{
                    console.log("event =>", event, callback)
                },
                On: (event, callback)=>{
                    console.log("event =>", event, callback)
                },
                Find: (path)=>{
                    console.log("Find =>", path)
                    return null;
                },
                FindByPath: (path)=>{
                    console.log("FindByPath =>", path)
                    return null;
                },
                OneShot: (string)=>{
                    console.log("OneShot =>", string)
                }
            }
            this.props = {
                hierarchy:{
                    "name": "Root",
                    "layer": 0,
                    "components": [
                        "Transform_5523"
                    ],
                    "children": [
                        {
                            "name": "Ground",
                            "layer": 0,
                            "components": [
                                "Transform_58041",
                                "BoxCollider_25563"
                            ],
                            "children": [
                                {
                                    "name": "GroundMesh",
                                    "layer": 0,
                                    "components": [
                                        "Transform_98837"
                                    ],
                                    "children": []
                                },
                                {
                                    "name": "Sigil",
                                    "layer": 0,
                                    "components": [
                                        "Transform_46066"
                                    ],
                                    "children": []
                                }
                            ]
                        }
                    ]
                }
            }
            let root = new BS.GameObject("Root");
            let entity = new Entity().init({
                name: "Root",
                parentId: null,
                layer: 0,
                _bs: root
            });
            this.entityData.entities = [entity];
            this.entityData.entityMap[entity.id] = entity;
            await this.loadHierarchy(this.props.hierarchy);
            this.loaded = true;
        }

        async initialize() {
            if(window.useMock){
                await this.initializeMock();
                this.setup = async ()=>{
                    this.loaded = true;
                }
                return;
            }



            let fileServer = localStorage.getItem('file_server');
            if(!fileServer){
                localStorage.setItem('file_server', "stable");
                fileServer = "stable";
            }
            let fileServerEl = document.getElementById("custom-fileServer");
            fileServerEl.children[0].innerHTML = fileServer;
            

            try {
                if (typeof window.BS === 'undefined' || !window.BS.BanterScene) {
                    err('init', 'BS library not available');
                    return;
                }
                this.scene = window.BS.BanterScene.GetInstance();

                this.setup = async ()=>{
                    if(this.loaded) return;
                    
                    log('init', "setting up inspector")
                    if(window.isLocalHost){
                        let lastSpaceState = localStorage.getItem('lastSpaceState');
                        if(lastSpaceState){
                            this.scene.spaceState = JSON.parse(lastSpaceState);
                        }
                    }

                    let lastProps = localStorage.getItem('lastProps');
                    if(lastProps){
                        this.props = JSON.parse(lastProps);
                    }

                    if(!this.scene.spaceState.public.hostUser){
                        log('init', "No host user found, setting to local user =>", this.myName())
                        networking.setSpaceProperty("hostUser", this.myName(), false);
                    }else{
                        let hostHere = Object.values(this.scene.users).map(x=>x.name).includes(this.scene.spaceState.public.hostUser);
                        if(!hostHere){
                            log('init', "Host user not here, setting to local user =>", this.myName())
                            networking.setSpaceProperty("hostUser", this.myName(), false);
                        }
                    }

                    try {
                        log('init', 'Gathering scene hierarchy...');
                        let hierarchy = null;
                        if(!this.props.hierarchy){
                            // Update loading screen progress for hierarchy gathering
                            if (window.loadingScreen) {
                                window.loadingScreen.updateStage('hierarchy', 0, 'Gathering scene structure...');
                            }
                            hierarchy = await this.gatherSceneHierarchy();
                            if (window.loadingScreen) {
                                window.loadingScreen.updateStage('hierarchy', 100, 'Scene structure loaded');
                            }
                        }else{
                            let h = this.props.hierarchy;
                            if(typeof h == "string"){
                                h = JSON.parse(h);
                            }
                            hierarchy = h;
                            if (window.loadingScreen) {
                                window.loadingScreen.updateStage('hierarchy', 100, 'Using cached hierarchy');
                            }
                        }
                        log('init', "hierarchy =>", hierarchy)
                        
                        // Start entity generation
                        if (window.loadingScreen) {
                            window.loadingScreen.updateStage('entities', 0, 'Generating entities...');
                        }
                        await this.loadHierarchy(hierarchy);
                    } catch (error) {
                        err('init', 'Error gathering scene hierarchy:', error);
                    }
                    this.loaded = true;
                    inspector.hierarchyPanel.render()
                    setTimeout(()=>{
                        inspector.lifecyclePanel.render()
                    }, 100)
                }
            } catch (error) {
                err('init', 'Failed to connect to Unity:', error);
            }
            window.scene = this.scene
        }

        // Resets the SpaceProperties
        async Reset(ui){
            let r = async ()=>{
                networking.sendOneShot('reset');
                await this._reset();
            }

            if(!(this.scene.localUser.name === "Technocrat") && ui){
                inventory.ui.showWarningConfirm(
                    "Reset Scene",
                    `This will delete any unsaved changes, and return to an empty scene.`,
                    r,
                    ()=>{
                        showNotification(`canceled reset"`);
                    }
                );
            }else{
                await r();
            }
        }
        
        async _reset(){
            if(window.isLocalHost){
                localStorage.removeItem('lastSpaceState');
            }
            this.loaded = false;
            this.scene.spaceState = {
                public: {},
                protected: {}
            }
            this.props = {
                hierarchy: null,
            }
            localStorage.removeItem('lastProps');
            window.location.reload();
        }

        claimHost(){
            networking.setSpaceProperty("hostUser", this.myName(), false);
            setTimeout(()=>{
                networking.sendOneShot('reset');
            }, 1000)
        }

        async saveScene(){
            await this.updateHierarchy(false);
            localStorage.setItem('lastProps', JSON.stringify(this.props));
            //showNotification("Scene saved")
        }

        // This gathers the hierarchy of the scene via Unity GameObjects
        async gatherSceneHierarchy(){
            log('init', "gathering SceneHierarchy")
            
            // Update progress: finding root
            if (window.loadingScreen) {
                window.loadingScreen.updateStage('hierarchy', 10, 'Finding root object...');
            }
            
            let rootObj = await this.scene.Find("Root");
            if(!rootObj){
                log('init', "no root object found")
                return null;
            }
            
            // Update progress: found root
            if (window.loadingScreen) {
                window.loadingScreen.updateStage('hierarchy', 20, 'Root object found');
            }

            let createEntityHierarchy = async (obj)=>{
                let component_refs = []
                let entity = {}

                // Make transform the top component
                let transform = obj.GetComponent(BS.ComponentType.Transform)
                if(transform){
                    let component_ref = `Transform_${Math.floor(Math.random()*99999)}`
                    component_refs.push(component_ref);
                }

                for(let c in obj.components){
                    let component = obj.components[c]
                    if(component.type == BS.ComponentType.Transform) continue;
                    let component_ref = `${componentTextMap[component.type]}_${Math.floor(Math.random()*99999)}`
                    component_refs.push(component_ref)
                }


                entity.name = obj.name;
                entity.components = component_refs;
                if (obj.Traverse) {
                    const childPromises = [];
                    obj.Traverse((child) => {
                        if (child && child.id !== obj.unityId) {
                            if (child.parent == obj.unityId) {
                                childPromises.push(createEntityHierarchy(child));
                            }
                        }
                    });
                    
                    const childEntities = await Promise.all(childPromises);
                    entity.children = childEntities.filter(s => s);
                } 
                return entity;
            }

            let rootEntity = await createEntityHierarchy(rootObj, null);
            log('init', "rootEntity =>", rootEntity)
            return rootEntity;
        }

        // This gathers the hierarchy of the scene from the root entity
        async gatherSceneHierarchyByEntity(){
            if(!this.entityData.entities.length){
                return null;
            }
            let rootEntity = this.getRootEntity();
            let createEntityHierarchy = (entity)=>{
                let h = {
                    name: entity.name,
                    layer: entity.layer,
                    components: Array.from(new Set(entity.components.map(c=>c.id))),
                    children: entity.children.map(c=>createEntityHierarchy(c))
                }
                return h;
            }
            let hierarchy = createEntityHierarchy(rootEntity);
            return hierarchy;
        }



        // Updates the hierarchy of the scene from the root entity
        async updateHierarchy(updateUI = true){  
            let h = await this.gatherSceneHierarchyByEntity();
            this.props.hierarchy = h;
            if(updateUI){
                this._updateUI();
            }
        }


        // Loads all the Entities on initialization
        async loadHierarchy(hierarchy){
            log('init', "loading hierarchy =>", hierarchy)
            if(!hierarchy){ return null}
            this.props.hierarchy = hierarchy;
            
            // Count total entities for progress tracking
            let totalEntities = 0;
            let processedEntities = 0;
            const countEntities = (h) => {
                totalEntities++;
                if (h.children) {
                    h.children.forEach(child => countEntities(child));
                }
            };
            countEntities(hierarchy);
            
            let hierarchyToEntity = async (h, parent_path = null)=>{
                let path = parent_path ? parent_path + "/" + h.name : h.name;
                let gO = await this.scene.FindByPath(path);
                if(!gO){
                    return await this.loadHistoricalEntity(h, parent_path)
                }

                const entity = await new Entity().init({
                    name: h.name || 'GameObject',
                    parentId: parent_path,
                    _bs: gO,
                    layer: gO.layer
                });
                
                // Update entity generation progress
                processedEntities++;
                if (window.loadingScreen) {
                    const progress = (processedEntities / totalEntities) * 100;
                    window.loadingScreen.updateStage('entities', progress, 
                        `Processing entity ${processedEntities} of ${totalEntities}: ${h.name}`);
                }

                //Make transform the top component
                let ref_idx = 0;
                let transform = gO.GetComponent(BS.ComponentType.Transform)
                if(transform){
                    let component_ref = h.components[ref_idx]
                    let componentClass = componentBSTypeMap[transform.type]
                    let entityComponent = await new componentClass().init(entity, transform);
                    entityComponent.setId(component_ref);
                    entity.components.push(entityComponent);
                    ref_idx++;
                }

                
                // Add other components
                for(let componentID in gO.components){
                    let component = gO.components[componentID]
                    if(component.type == BS.ComponentType.Transform) continue;
                    let component_ref = h.components[ref_idx]
                    ref_idx++;
                    if(!component_ref){
                        log('init', "no component ref found for", component, h.components, ref_idx)
                        continue;
                    }

                    if(SUPPORTED_COMPONENTS.has(component.type)){
                        let componentClass = componentBSTypeMap[component.type]
                        let props = this.getHistoricalProps(component_ref).props
                        let entityComponent = await new componentClass().init(entity, component, props);
                        entityComponent.setId(component_ref);
                        entity.components.push(entityComponent);
                    }
                }

                //Add any MonoBehaviors
                h.components.forEach(async component_ref=>{
                    if(component_ref.startsWith("MonoBehavior")){
                        let props = this.getHistoricalProps(component_ref).props
                        props.id = component_ref;
                        let entityComponent = await new MonoBehaviorComponent().init(entity, null, props)
                        entity.components.push(entityComponent);
                    }
                })
                
                for(let child of h.children){
                    let childEntity = await hierarchyToEntity(child, entity.id);
                    await childEntity._setParent(entity);
                }
                return entity;
            }

            const entity = await hierarchyToEntity(hierarchy, null);

            this.entityData.entities = [entity];
            this.initializeExpandedNodes();
            
            // Entities generation complete
            if (window.loadingScreen) {
                window.loadingScreen.updateStage('entities', 100, 'All entities generated');
            }
            
            inspector?.hierarchyPanel?.render()
        }


        //Creates a entity from the inventory schema
        async _loadEntity(entityData, parentId){
            let loadSubEntity = async (item, parentId)=>{ 
                const newEntity = await new Entity().init({
                    name: item.name,
                    parentId: parentId,
                    layer: item.layer
                });
    
                
                if(item.components){
                    for(let component of item.components){
                        if(component.properties){
                            component.properties.id = component.id;
                        }else{
                            component.properties = {
                                id: component.id
                            }
                        }
                        await this._addComponent(newEntity, component.type, component.properties);
                    }
                }

                if(item.children){
                    for(let i=0; i<item.children.length; i++){
                        let child = item.children[i];
                        let childEntity = await loadSubEntity(child, newEntity.id);
                        await childEntity._setParent(newEntity);
                    }
                }
    
                return newEntity;
            }


            let parentEntity = (parentId)? this.getEntityOrRoot(parentId) : this.getEntityOrRoot(entityData.parentId);
            let entity = await loadSubEntity(entityData, parentId);
            await entity._setParent(parentEntity);

            this.expandedNodes.add(parentId);
            this.selectEntity(entity.id);
            entity.finished_loading = true;
            return entity;
        }


        getHistoricalProps(component_ref){
            let type = component_ref.split("_")[0]
            let space_keys = Object.keys(this.props)
            let props = {}
            space_keys.forEach(key=>{
                if(key.startsWith(`__${component_ref}/`)){
                    let path = key.split(":")[0].split("/")
                    let prop = path[path.length-1]
                    props[prop] = this.props[key]
                }
            })
            return{
                type: type,
                props: props
            }
        }
        

        // Creates and hydrates a entity using the SpaceProperties
        async loadHistoricalEntity(hierarchy, parentId){
            
            log('init', "loading historical entity =>", hierarchy)
            const entity = await new Entity().init({
                name: hierarchy.name,
                parentId: parentId,
                layer: hierarchy.layer
            });

            for(let i=0; i<hierarchy.components.length; i++){
                let component_ref = hierarchy.components[i]
                let hist = this.getHistoricalProps(component_ref)
                log('init', `historical props for [${component_ref}] =>`, hist)
                let componentClass = componentTypeMap[hist.type]
                let props = hist.props
                props.id = component_ref;
                let entityComponent = await new componentClass().init(entity, null, props)
                entity.components.push(entityComponent);
            }

            hierarchy.children.forEach(async (child)=>{
                let childEntity = await this.loadHistoricalEntity(child, entity.id);
                await childEntity._setParent(entity);
            })

            return entity;
        }

    
        initializeExpandedNodes() {
            // Expand root nodes by default
            this.entityData.entities.forEach(entity => {
                this.expandedNodes.add(entity.id);
            });
        }

    
        getEntityComponentById(componentId){
            return this.entityData.componentMap[componentId];
        }

        
        toggleNodeExpansion(entityId) {
            if (this.expandedNodes.has(entityId)) {
                this.expandedNodes.delete(entityId);
            } else {
                this.expandedNodes.add(entityId);
            }
        }


        selectEntity(entityId) {
            this.selectedEntity = entityId;
            this._updateUI();
        }

        _updateUI(){
            // Update UI
            if (inspector?.hierarchyPanel) {
                inspector.hierarchyPanel.render();
            }
            if(inspector?.propertiesPanel){
                inspector.propertiesPanel.render(this.selectedEntity);
            }
        }


        getEntityById(entityId) {
            return this.entityData.entityMap[entityId];
        }


        getAllEntities() {
            return Object.values(this.entityData.entityMap || {});
        }

        getRootEntity(){
            return this.entityData.entities[0];
        }

        getEntityOrRoot(entityId){
            let entity = this.getEntityById(entityId);
            if(!entity){
                entity = this.getRootEntity();
            }
            return entity;
        }

        getSelectedEntity(rootFallback){
            if(rootFallback){
                return this.getEntityOrRoot(this.selectedEntity);
            }
            return this.getEntityById(this.selectedEntity);
        }

        getEntityByName(entityName){
            return SM.getAllEntities().find(x=>x.name==entityName);
        }

        getAllMonoBehaviors(){
            return Object.values(this.entityData.componentMap).filter(x=>x.type === "MonoBehavior");
        }


        async _addNewEntity(entityName, parentId = null) {
            if(!this.scene || !window.BS){
                log('init', "NO SCENE AVAILABLE")
                return null;
            }

            if(!parentId){
                parentId = this.entityData.entities[0].id;
            }

            let parentEntity = this.getEntityById(parentId);
            if(!parentEntity){
                log("scene","no parent entity found")
                return null;
            }
          
            // Create new GameObject
            let newEntity = await new Entity().init({
                parentId: parentId,
                name: entityName
            });

            log("scene", "NEW SLOT:", newEntity)

            function stringTo8DigitNumber(str) {
                let hash = 0x811c9dc5; // FNV offset basis
                for (let i = 0; i < str.length; i++) {
                  hash ^= str.charCodeAt(i);
                  hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
                }
                return hash % 100_000_000;
              }

            let properties = {
                id: `Transform_${stringTo8DigitNumber(newEntity.id)}`
            }

            let transform = await new TransformComponent().init(newEntity, null, properties);
            newEntity.components.push(transform);

            //this.updateHierarchy()
            await newEntity._setParent(parentEntity);
        }

       
        async _addComponent(entity, componentType, componentProperties){
            // Check if component already exists (for unique components)
            const uniqueComponents = ['Transform', 'BanterRigidbody', 'BanterSyncedObject'];
            if (uniqueComponents.includes(componentType)) {
                const exists = entity.components.some(c => c.type === componentType);
                if (exists) {
                    log("scene", `A ${componentType} component already exists on this entity`);
                    return;
                }
            }

            // Create the component
            const ComponentClass = componentTypeMap[componentType];
            
            if (!ComponentClass) {
                log("scene", `Component class not found for type: ${componentType}`);
                return;
            }
            
            let entityComponent = await new ComponentClass().init(entity, null, componentProperties);
            entity.components.push(entityComponent);
            this.entityData.componentMap[entityComponent.id] = entityComponent;

            // Refresh properties panel
            if (inspector?.propertiesPanel) {
                inspector.propertiesPanel.render(entity.id);
            }

         
            entity._checkForGhostComponents(entityComponent.id.split("_")[1]);
            setTimeout(()=>{
                entity._checkForGhostComponents(entityComponent.id.split("_")[1]);
            }, 1500)
            //this.updateHierarchy()
            return entityComponent;
        }
    }

    // Create singleton instance
    export const sceneManager = new SceneManager();
    window.SM = sceneManager
    window.entities = ()=>{ return window.SM.entityData.entities }
    window.crawl = ()=>{
        let dig = (entity)=>{
            let map = {
                entity: entity,
                _bs: entity._bs,
                name: entity.name,
                '.': entity.components,
                '_': entity.components.map(c=>c.type)
            }
            for(let i=0; i<entity.children.length; i++){
                map[i] = dig(entity.children[i])
            }
            return map
        }
        return dig(window.entities()[0])
    }
//})()