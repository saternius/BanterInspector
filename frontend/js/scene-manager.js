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
        }

        myName(){
            return this.scene.localUser.name 
        }

        changeFileServer(value){
            localStorage.setItem('file_server', value);
            window.location.reload();
        }

        async initialize() {
            try {
                if (typeof window.BS === 'undefined' || !window.BS.BanterScene) {
                    err('init', 'BS library not available');
                    return;
                }
                this.scene = window.BS.BanterScene.GetInstance();
                this.setup = async ()=>{
                    if(this.loaded) return;
                    log("init", "initializing firebase..")

                    net.initFirebase(async (state)=>{
                        log("init", "spaceState =>", state)
                        if(!state.vars.hostUser){
                            log('init', "Server has no host user, so I guess it's me", this.myName())
                            net.claimHost();
                        }else{
                            let hostHere = Object.values(this.scene.users).map(x=>x.name).includes(state.vars.hostUser);
                            if(!hostHere){
                                log('init', "Host user not here, so I'll make myself the host", this.myName())
                                net.claimHost();
                            }
                        }
                        
                        //TODO: have a mutex in place like
                        // let crawlMutex = net.getVar("_MUTEX_CRAWL");
                        // while(crawlMutex && (Date.now() - crawlMutex) < 60000){
                        //     log("init", "someone is already crawling the scene.. I should wait", crawlMutex, Date.now() - crawlMutex)
                        //     await new Promise(resolve => setTimeout(resolve, 1000));
                        // }

                        let scene_entity = null;
                        let people_entity = null;
                        if(!state.Scene){ // crawl
                            net.setVar("_MUTEX_CRAWL", Date.now());
                            window.loadingScreen.updateStage('hierarchy', 0, 'Gathering scene structure...');
                            let hierarchy = await this.gatherSceneHierarchy();
                            log('init', "gathered Scene's hierarchy =>", hierarchy)
                            this.props.hierarchy = hierarchy;
                            window.loadingScreen.updateStage('hierarchy', 100, 'Scene structure loaded');
                            window.loadingScreen.updateStage('entities', 0, 'Generating entities...');
                            scene_entity = await this.loadHierarchy("Scene", hierarchy);
                            people_entity = await this.loadHierarchy("People", {});
                            net.delVar("_MUTEX_CRAWL");
                        }else{ //load
                            scene_entity = await this.loadHierarchy("Scene", state.Scene);
                            people_entity = await this.loadHierarchy("People", state.People);
                        }

                        this.entityData.entities = [scene_entity, people_entity];
                        this.initializeExpandedNodes();
                        window.loadingScreen.updateStage('entities', 100, 'All entities generated');
                        inspector?.hierarchyPanel?.render()
                        inspector?.lifecyclePanel?.render()
                        this.loaded = true;
                        await this.executeStartupScripts("onSceneLoaded");
                    })
                }
            } catch (error) {
                err('init', 'Failed to connect to Unity:', error);
            }
            window.scene = this.scene
        }

        // Resets the SpaceProperties
        async Reset(ui){
            await net.clearSpaceState();
            let r = async ()=>{
                networking.sendOneShot('reset');
                this.resetLoadAttempt();
                setTimeout(async ()=>{
                    await this._reset();
                }, 1000)
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
            localStorage.removeItem('lastProps');
            scene.OpenPage(`banter://${location.host}`)
        }


        async handleUserJoined(event){
            log('scene-event', "[USER JOINED] fired", event)
            let name = event.detail.name;
            await AddEntity("People", name)
            
        }

        async saveScene(){
            //await this.updateHierarchy(false);
            localStorage.setItem('lastProps', JSON.stringify(this.props));
            //showNotification("Scene saved")
        }

        // This gathers the hierarchy of the scene via Unity GameObjects
        async gatherSceneHierarchy(){
            log('init', "gathering SceneHierarchy")
            
            // Update progress: finding root
            if (window.loadingScreen) {
                window.loadingScreen.updateStage('hierarchy', 10, 'Finding scene object...');
            }
            
            let sceneObj = await this.scene.Find("Scene");
            if(!sceneObj){
                log('init', "no scene object found")
                return null;
            }
            
            // Update progress: found root
            if (window.loadingScreen) {
                window.loadingScreen.updateStage('hierarchy', 20, 'Scene object found');
            }

            let createEntityHierarchy = async (obj)=>{
                let component_refs = []
                let entity = {}

                // Make transform the top component
                // let transform = obj.GetComponent(BS.ComponentType.Transform)
                // if(transform){
                //     let component_ref = `Transform_${Math.floor(Math.random()*99999)}`
                //     component_refs.push(component_ref);
                // }

                for(let c in obj.components){
                    let component = obj.components[c]
                    if(component.type == BS.ComponentType.Transform) continue;
                    let component_ref = `${componentTextMap[component.type]}_${Math.floor(Math.random()*99999)}`
                    component_refs.push(component_ref)
                }


                entity.name = obj.name;
                entity.components = component_refs;
                entity.localPosition = obj.transform.localPosition;
                entity.localRotation = obj.transform.localRotation;
                entity.localScale = obj.transform.localScale;
                if (obj.Traverse) {
                    const childPromises = [];
                    obj.Traverse((child) => {
                        log('init', 'traversing..',child.id, child.name,  child.parent, obj.unityId)
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

            let sceneEntity = await createEntityHierarchy(sceneObj, null);
            log('init', "sceneEntity =>", sceneEntity)
            return sceneEntity;
        }

        // This gathers the hierarchy of the scene from the root entity
        async gatherEntityHierarchy(entity){
            if(!entity){
                return null;
            }
            let createEntityHierarchy = (entity)=>{
                let h = {
                    name: entity.name,
                    layer: entity.layer,
                    components: Array.from(new Set(entity.components.map(c=>c.id))),
                    children: entity.children.map(c=>createEntityHierarchy(c)),
                    localPosition: entity.transform.localPosition,
                    localRotation: entity.transform.localRotation,
                    localScale: entity.transform.localScale
                }
                return h;
            }
            let hierarchy = createEntityHierarchy(entity);
            return hierarchy;
        }

        // Updates the hierarchy of the scene from the root entity
        async updateHierarchy(updateUI = true){  
            let h = await this.gatherEntityHierarchy(this.getSceneEntity());
            this.props.hierarchy = h;
            if(updateUI){
                this._updateUI();
            }
        }


        // Loads all the Entities on initialization
        async loadHierarchy(destination, hierarchy){
            log('init', "loading hierarchy for", destination, "=>", hierarchy)
            if(!hierarchy){ return null}
            
            if(!hierarchy.layer){ hierarchy.layer = 0 }
            if(!hierarchy.components){ hierarchy.components = [] }
            if(!hierarchy.children){ hierarchy.children = [] }
            if(!hierarchy.name){ hierarchy.name = destination }
            
            let hierarchyToEntity = async (h, parent_path = null)=>{
                let path = parent_path ? parent_path + "/" + h.name : h.name;
                let gO = await this.scene.FindByPath(path);
                if(!gO){
                    return await this.loadHistoricalEntity(h, parent_path)
                }

                const entity = await new Entity().init({
                    name: h.name,
                    parentId: parent_path,
                    _bs: gO,
                    layer: gO.layer,
                    localPosition: h.localPosition,
                    localRotation: h.localRotation,
                    localScale: h.localScale
                });
                
                //Make transform the top component
                let ref_idx = 0;
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
                        let componentClass = componentBSTypeMap[component.componentType]
                        let props = this.getHistoricalProps(component_ref).props
                        let entityComponent = await new componentClass().init(entity, component, props);
                        entityComponent.setId(component_ref);
                        entity.components.push(entityComponent);
                    }
                }

                //Add any MonoBehaviors
                h.components.forEach(async component_ref=>{
                    if(!component_ref){
                        log("init", "[SUS SITUATION]: component_ref is not defined", component_ref, h, h.components)
                        return;
                    }
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
                entity._loaded();
                return entity;
            }
            return await hierarchyToEntity(hierarchy, null);
        }


        // async provideHierarchyEntity(){
        //     let sendHier = async (path)=>{
        //         let entity = SM.getEntityById(path, false)
        //         if(!entity){
        //             log("init", "I don't have a hier for: ", path)
        //             return
        //         }
        //         networking.sendOneShot(`hierarchy_entity¶${path}¶${JSON.stringify(entity.export(['id']))}`)
        //     }
        //     sendHier("People/"+this.myName())
        //     if(this._iamHost){
        //         sendHier("Scene")
        //     }
        // }

        // async onRecievedHierarchyEntity(path, entityData){
        //     if(this.getEntityById(path)){ return }
        //     log("init", "recieved hierarchy for: ", path, "=>", entityData)
        //     if(path == "Scene" && !this._iamHost){
        //         window.loadingScreen.updateStage('hierarchy', 100, 'Scene structure loaded');
        //         window.loadingScreen.updateStage('entities', 0, 'Generating entities...');
        //         log('init', "loading scene...")
        //         let scene_entity = await this._loadEntity(entityData, null)
        //         this.finalizeSceneLoad(scene_entity);
        //     }else{
        //         if(path.startsWith("People/")){
        //             let userName = path.split("/")[1]
                    
        //             let entity = await this._loadEntity(entityData, "People")
        //             await entity._setParent(this.getEntityById("People"))
        //         }
        //     }
        // }


        //Creates a entity from the inventory schema
        async _loadEntity(entityData, parentId, options){
            //log("RANDOM DEBUG", "LOADING ENTITY", entityData, parentId, options)
            //TODO: add a param for await req for sync/async component/entity
            let loadSubEntity = async (item, parentId, parentEnt)=>{ 
            
                const newEntity = await new Entity().init({
                    name: item.name,
                    parentId: parentId,
                    layer: item.layer,
                    loadAsync: item.loadAsync,
                    localPosition: item.transform.localPosition,
                    localRotation: item.transform.localRotation,
                    localScale: item.transform.localScale,
                    networkId: `${parentId}/${item.name}`
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
                        const result = this._addComponent(newEntity, component.type, component.properties, {context: "item", loadAsync: component.loadAsync, owner: options?.owner});
                        if(!component.loadAsync){
                            log("loadEntity", "component [AWAIT]", component.type, item.name+"/"+component.type+":"+component.id)
                            await result;
                        }else{
                            log("loadEntity", "component [ASYNC]", component.type, item.name+"/"+component.type+":"+component.id)
                        }
                    }
                }

                if(item.children){
                    let childPromises = [];
                    for(let i=0; i<item.children.length; i++){
                        let child = item.children[i];
                        let childEntityPromise = loadSubEntity(child, newEntity.id, newEntity);
                        if(!child.loadAsync){
                            console.log("LoadEntity", "Entity [AWAIT]", child.name)
                            await childEntityPromise;
                        }else{
                            console.log("LoadEntity", "Entity [ASYNC]", child.name)
                            childPromises.push(childEntityPromise);
                        }
                    }
                    // Wait for all async children to complete
                    if(childPromises.length > 0){
                        await Promise.all(childPromises);
                    }
                }

                if(newEntity.name !== "Scene"){
                    await newEntity._setParent(parentEnt);
                }
                
                // Call _loaded() after all children are fully instantiated
                newEntity._loaded();
                return newEntity;
            }


            let parentEntity = (parentId)? this.getEntityOrScene(parentId) : this.getEntityOrScene(entityData.parentId);
            let entity = await loadSubEntity(entityData, parentId, parentEntity);

            this.expandedNodes.add(parentId);
            this.selectEntity(entity.id);
            // _loaded() is now called within loadSubEntity after all children are instantiated
            return entity;
        }


        getHistoricalProps(component_ref){
            let props = net.state.components[component_ref]
            if(!props){
                log("init", "ISSUE: no props found for", component_ref)
                props = {}
            }
            return{
                type: component_ref.split("_")[0],
                props: props
            }
        }
        

        // Creates and hydrates a entity using the SpaceProperties
        async loadHistoricalEntity(hierarchy, parentId){
            
            log('init', "loading historical entity =>", hierarchy)
            const entity = await new Entity().init({
                name: hierarchy.name,
                parentId: parentId,
                layer: hierarchy.layer,
                localPosition: hierarchy.localPosition,
                localRotation: hierarchy.localRotation,
                localScale: hierarchy.localScale
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

            // Process all children and wait for them to complete
            if(hierarchy.children && hierarchy.children.length > 0){
                const childPromises = hierarchy.children.map(async (child) => {
                    let childEntity = await this.loadHistoricalEntity(child, entity.id);
                    await childEntity._setParent(entity);
                    return childEntity;
                });
                await Promise.all(childPromises);
            }
            entity._loaded();
            return entity;
        }

    
        initializeExpandedNodes() {
            // Expand root nodes by default
            this.entityData.entities.forEach(entity => {
                this.expandedNodes.add(entity.id);
            });
        }

    
        getEntityComponentById(componentId, useFallback = true){
            let component = this.entityData.componentMap[componentId];
            if(useFallback && !component){
                log("fallback", "searching for component: ", componentId)
                component = this.fallbackComponentSearch(componentId);
                log("fallback", "found: ", component)
            }
            return component;
        }

        fallbackComponentSearch(componentId){
            let crawlEnts = (arr, cid)=>{
                for(var i=0; i<arr.length; i++){
                    let ent = arr[i];
                    for(var j=0; j<ent.components.length; j++){
                        let comp = ent.components[j];
                        if(comp.id === cid){
                            return comp;
                        }
                    }
                    let inChild = crawlEnts(ent.children, cid)
                    if(inChild){
                        return inChild
                    }
                }
                return undefined;
            }
            let fallback = crawlEnts(entities(), componentId);
            if(fallback){
                this.entityData.componentMap[componentId] = fallback;
            }
            return fallback;
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
            window.dispatchEvent(new CustomEvent('entitySelected', {
                detail: { entityId }
            }));
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


        getEntityById(entityId, useFallback = true) {
            if(!entityId){ return null }
            let ent = this.entityData.entityMap[entityId];
            if(useFallback && !ent){
                log("fallback", "searching for: ", entityId)
                ent = this.fallbackEntitySearch(entityId);
                log("fallback", "found: ", ent)
            }
            return ent;
        }

        getEntityByUuid(uuid){
            return Object.values(SM.entityData.entityMap).find(ent=>ent.uuid === uuid);
        }

        fallbackEntitySearch(entityId){
            let crawlEnts = (arr, eid)=>{
                for(var i=0; i<arr.length; i++){
                    let ent = arr[i];
                    if(ent['id'] === eid){
                        return ent;
                    }
                    let inChild = crawlEnts(ent.children, eid)
                    if(inChild){
                        return inChild
                    }
                }
                return undefined;
            }
            let fallback = crawlEnts(entities(), entityId);
            if(fallback){
                this.entityData.entityMap[entityId] = fallback;
            }
            return fallback;
        }


        getAllEntities() {
            return Object.values(this.entityData.entityMap || {});
        }

        getSceneEntity(){
            return this.entityData.entities[0];
        }

        getEntityOrScene(entityId){
            let entity = this.getEntityById(entityId);
            if(!entity){
                entity = this.getSceneEntity();
            }
            return entity;
        }

        getSelectedEntity(sceneFallback){
            if(sceneFallback){
                return this.getEntityOrScene(this.selectedEntity);
            }
            return this.getEntityById(this.selectedEntity);
        }

        getEntityByName(entityName){
            return SM.getAllEntities().find(x=>x.name==entityName);
        }

        getAllMonoBehaviors(){
            return Object.values(this.entityData.componentMap).filter(x=>x.type === "MonoBehavior");
        }

        getScriptByName(scriptName){
            let mono =  Object.values(this.entityData.componentMap).find(x=>x.type === "MonoBehavior" && x.properties.name === scriptName);
            return mono?.ctx;
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

            // function stringTo8DigitNumber(str) {
            //     let hash = 0x811c9dc5; // FNV offset basis
            //     for (let i = 0; i < str.length; i++) {
            //       hash ^= str.charCodeAt(i);
            //       hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
            //     }
            //     return hash % 100_000_000;
            //   }
            // let properties = {
            //     id: `Transform_${stringTo8DigitNumber(newEntity.id)}`
            // }
            // let transform = await new TransformComponent().init(newEntity, null, properties);
            // newEntity.components.push(transform);
            await newEntity._setParent(parentEntity);
        }

        /**
         * Creates entity wrappers for a cloned GameObject and all its children/components
         * Used after scene.Instantiate to map the Unity GameObject hierarchy to our entity system
         * @param {Object} gameObject - The cloned Unity GameObject
         * @param {string} parentId - The parent entity ID
         * @param {string} name - The entity name
         * @param {Object} sourceEntity - The original entity being cloned (for ID mapping)
         * @param {Object} componentIdMap - Map of original component IDs to new synchronized IDs
         */
        async _createEntityFromGameObject(gameObject, parentId, name, sourceEntity, componentIdMap) {
            // Create the entity wrapper
            const entity = await new Entity().init({
                name: name || gameObject.name,
                parentId: parentId,
                _bs: gameObject,
                layer: gameObject.layer,
                localPosition: gameObject.transform.localPosition,
                localRotation: gameObject.transform.localRotation,
                localScale: gameObject.transform.localScale
            });

            
            

            // Map all components from the GameObject using synchronized IDs
            let componentIndex = 0;

            // Handle Transform component first
            // const transform = gameObject.GetComponent(BS.ComponentType.Transform);
            // if (transform) {
            //     const sourceComponent = sourceEntity.components[componentIndex];
            //     const component_ref = componentIdMap[sourceComponent.id];
            //     const componentClass = componentBSTypeMap[transform.componentType];
            //     const entityComponent = await new componentClass().init(entity, transform);
            //     entityComponent.setId(component_ref);
            //     entity.components.push(entityComponent);
            //     this.entityData.componentMap[component_ref] = entityComponent;
            //     componentIndex++;


            //     // Set the parent and transform
            //     let parentBS = this.getEntityById(parentId)._bs;
            //     entity._bs.SetParent(parentBS)
            //     let sourceTransform = sourceEntity.getTransform()
            //     let transformProps = await sourceTransform.Get("transform")
            //     console.log('transformProps', transformProps)
            //     entityComponent.Set("localPosition", transformProps.localPosition)
            //     entityComponent.Set("localRotation", transformProps.localRotation)
            //     entityComponent.Set("localScale", transformProps.localScale)
            // }

           

            // Handle all other components
            for (let c in gameObject.components) {
                const component = gameObject.components[c];
                if (component.type === BS.ComponentType.Transform) continue;

                if (SUPPORTED_COMPONENTS.has(component.type)) {
                    const sourceComponent = sourceEntity.components[componentIndex];
                    const component_ref = componentIdMap[sourceComponent.id];
                    const componentClass = componentTypeMap[component_ref.split("_")[0]];
                    const entityComponent = await new componentClass().init(entity, component);
                    entityComponent.setId(component_ref);
                    entity.components.push(entityComponent);
                    this.entityData.componentMap[component_ref] = entityComponent;
                    componentIndex++;
                }
            }

            // Add entity to parent
            const parentEntity = this.getEntityById(parentId);
            if (parentEntity) {
                parentEntity.children.push(entity);
            }

            // Recursively handle children
            if (gameObject.Traverse && sourceEntity.children && sourceEntity.children.length > 0) {
                let childIndex = 0;
                gameObject.Traverse((child) => {
                    if (child && child.id !== gameObject.unityId && child.parent === gameObject.unityId) {
                        const sourceChild = sourceEntity.children[childIndex];
                        this._createEntityFromGameObject(child, entity.id, child.name, sourceChild, componentIdMap);
                        childIndex++;
                    }
                });
            }


            entity._loaded();
            return entity;
        }


        async _addComponent(entity, componentType, componentProperties, options){
            // Check if component already exists (for unique components)
            const uniqueComponents = ['Transform', 'Rigidbody', 'SyncedObject'];
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
            
            let entityComponent = await new ComponentClass().init(entity, null, componentProperties, options);

            
            entity.components.push(entityComponent);
            this.entityData.componentMap[entityComponent.id] = entityComponent;

            // Refresh properties panel
            if (inspector?.propertiesPanel) {
                inspector.propertiesPanel.render(entity.id);
            }


            // Check for ghost if new, if item delete ghosts.
            entity._checkForGhostComponents(entityComponent.id.split("_")[1]);
            setTimeout(()=>{
                entity._checkForGhostComponents(entityComponent.id.split("_")[1]);
            }, 1500)

            if(options.context === "item"){
                setTimeout(()=>{
                    let toBust = []
                    entity.components.forEach(c=>{
                        if(c.options.context === "ghost"){
                            toBust.push(c);
                        }
                    })
                    toBust.forEach(c=>{
                        // log("loadEntity", `destroying ghost: ${entity.id}/${c.type}/${c.id}`)
                        // c._destroy();
                    })
                }, 3000)
            }
            
            return entityComponent;
        }

        /**
         * Execute startup scripts from inventory
         * Scripts must have both startup and active flags set to true
         */
        async executeStartupScripts(stage, attempts = 0) {
            log('startup', "executing startup scripts for: ", stage)
            if(!lifecycle || !window.inventory || !window.inventory.items){
                log('startup', 'Lifecycle not initialized, delaying..');
                await new Promise(resolve => setTimeout(resolve, 500));
                return await this.executeStartupScripts(stage);
            }

            if(stage === "onInspectorLoaded"){
                if(lifecycle.startupExecutionStart.onInspectorLoaded){
                    log('startup', 'Inspector startup has already started, skipping..');
                    return;
                }
                lifecycle.startupExecutionStart.onInspectorLoaded = true;
            }
           
            if(stage === "onSceneLoaded"){
                if(!lifecycle.startupExecutionStart.onInspectorLoaded){
                    log('startup', 'Inspector startup has not started for some reason..');
                    await this.executeStartupScripts("onInspectorLoaded");
                }
                if(lifecycle.startupExecutionStart.onInspectorLoaded && !lifecycle.startupExecutionComplete.onInspectorLoaded){ 
                    log('startup', 'Inspector startup has not completed yet, delaying..');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return await this.executeStartupScripts(stage, attempts + 1);
                }

                if(lifecycle.startupExecutionStart.onSceneLoaded){
                    log('startup', 'Scene startup has already started, skipping..');
                    return;
                }
                lifecycle.startupExecutionStart.onSceneLoaded = true;
            }

            try {
                if (!window.inventory) {
                    log('startup', 'Inventory not initialized, skipping startup scripts');
                    return;
                }
                
                const startupScripts = Object.values(window.inventory.items).filter(item => 
                    item.itemType === 'script' && 
                    item.startup === true && 
                    item.active === true &&
                    item.startupSequence === stage
                );
                
           
                
                log('startup', `Found ${startupScripts.length} startup scripts to execute`);
                for (const script of startupScripts) {
                    try {
                        log('startup', `Executing startup script: ${script.name}`);
                        
                        // Create a script context similar to MonoBehavior
                        const scriptContext = {
                            vars: {},
                            _scene: this.scene,
                            _BS: window.BS,
                            _entity: null, // No entity for startup scripts
                            _component: null // No component for startup scripts
                        };
                        
                        // Execute the script
                        const scriptFunction = new Function('console', script.data);
                        scriptFunction.call(scriptContext, console);
                        
                        // Call onStart if it exists
                        if (typeof scriptContext.onStart === 'function') {
                            scriptContext.onStart();
                        }
                        
                        showNotification(`Startup script "${script.name}" executed`);
                    } catch (error) {
                        err('startup', `Error executing startup script "${script.name}":`, error);
                        showNotification(`Failed to execute startup script "${script.name}"`, 'error');
                    }
                }
                
                log('startup', 'All startup scripts executed');
            } catch (error) {
                err('startup', 'Error in executeStartupScripts:', error);
            }

            lifecycle.startupExecutionComplete[stage] = true;
            log('startup', `[${stage}] COMPLETED`);
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
    window.sel = ()=>{
        return window.SM.getSelectedEntity()
    }
    window.doIOwnCallback = (unityId, owned) => console.log(unityId, owned);
    window.getUserColor = (name)=>{
        return Object.values(scene.users).find(x=>x.name===name)?.color || "#8b8f9e"
    }

//})()