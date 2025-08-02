/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

console.log("It is 3:00")
// (async () => {
    // let localhost = window.location.hostname === 'localhost'
    const { loadMockSlotData } = await import(`${window.repoUrl}/mock-data.js`);
    const { SUPPORTED_COMPONENTS, Slot, TransformComponent, componentBSTypeMap, componentTypeMap, componentTextMap, componentBundleMap, MonoBehaviorComponent } = await import( `${window.repoUrl}/components/index.js`);

    export class SceneManager {
        constructor() {
            this.scene = null;
            this.slotData = {
                slots: [],
                slotMap:{},
                componentMap: {}
            };
            this.props = {
                hierarchy: null,
            }
            this.selectedSlot = null;
            this.expandedNodes = new Set();
            this.loaded = false;
            this.saveMethod = "aggressive"
        }
        

        myName(){
            return `${this.scene.localUser.name}_${this.scene.localUser.id.slice(0,3)}`
        }

        toggleFileServer(){
            let fileServer = localStorage.getItem('file_server');
            if(fileServer === "github"){
                localStorage.setItem('file_server', "local");
            }else{
                localStorage.setItem('file_server', "github");
            }
            window.location.reload();
        }


        async initialize() {
            let fileServer = localStorage.getItem('file_server');
            if(!fileServer){
                localStorage.setItem('file_server', "github");
                fileServer = "github";
            }
            let fileServerEl = document.getElementById("fileServer");
            fileServerEl.innerHTML = fileServer;

            try {
                if (typeof window.BS === 'undefined' || !window.BS.BanterScene) {
                    console.error('BS library not available');
                    return;
                }
                this.scene = window.BS.BanterScene.GetInstance();

                this.setup = async ()=>{
                    if(this.loaded) return;
                    
                    console.log("setting up inspector")
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
                        console.log("No host user found, setting to local user =>", this.myName())
                        networking.setSpaceProperty("hostUser", this.myName(), false);
                    }else{
                        let hostHere = Object.values(this.scene.users).map(x=>`${x.name}_${x.id.slice(0,3)}`).includes(this.scene.spaceState.public.hostUser);
                        if(!hostHere){
                            console.log("Host user not here, setting to local user =>", this.myName())
                            networking.setSpaceProperty("hostUser", this.myName(), false);
                        }
                    }

                    try {
                        console.log('Gathering scene hierarchy...');
                        let hierarchy = null;
                        if(!this.props.hierarchy){
                            hierarchy = await this.gatherSceneHierarchy();
                        }else{
                            let h = this.props.hierarchy;
                            if(typeof h == "string"){
                                h = JSON.parse(h);
                            }
                            hierarchy = h;
                        }
                        console.log("hierarchy =>", hierarchy)
                        this.loadHierarchy(hierarchy);
                    } catch (error) {
                        console.error('Error gathering scene hierarchy:', error);
                    }
                    this.loaded = true;
                    inspector.hierarchyPanel.render()
                    setTimeout(()=>{
                        inspector.lifecyclePanel.render()
                    }, 100)
                }
            } catch (error) {
                console.error('Failed to connect to Unity:', error);
            }
            window.scene = this.scene
        }

        // Resets the SpaceProperties
        async reset(){
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
            await this.initialize();
        }

        claimHost(){
            networking.setSpaceProperty("hostUser", this.myName(), false);
            setTimeout(()=>{
                networking.sendOneShot('reset');
            }, 1000)
        }

        async saveScene(){
            localStorage.setItem('lastProps', JSON.stringify(this.props));
        }

        // This gathers the hierarchy of the scene via Unity GameObjects
        async gatherSceneHierarchy(){
            console.log("gathering SceneHierarchy")
            let rootObj = await this.scene.Find("Root");
            if(!rootObj){
                console.log("no root object found")
                return null;
            }

            let createSlotHierarchy = async (obj)=>{
                let component_refs = []
                let slot = {}

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


                slot.name = obj.name;
                slot.components = component_refs;
                if (obj.Traverse) {
                    const childPromises = [];
                    obj.Traverse((child) => {
                        if (child && child.id !== obj.id) {
                            if (child.parent == obj.id) {
                                childPromises.push(createSlotHierarchy(child));
                            }
                        }
                    });
                    
                    const childSlots = await Promise.all(childPromises);
                    slot.children = childSlots.filter(s => s);
                } 
                return slot;
            }

            let rootSlot = await createSlotHierarchy(rootObj, null);
            console.log("rootSlot =>", rootSlot)
            return rootSlot;
        }

        // This gathers the hierarchy of the scene from the root slot
        async gatherSceneHierarchyBySlot(){
            let rootSlot = this.getRootSlot();
            let createSlotHierarchy = (slot)=>{
                let h = {
                    name: slot.name,
                    components: Array.from(new Set(slot.components.map(c=>c.id))),
                    children: slot.children.map(c=>createSlotHierarchy(c))
                }
                return h;
            }
            let hierarchy = createSlotHierarchy(rootSlot);
            return hierarchy;
        }



        // Updates the hierarchy of the scene from the root slot
        async updateHierarchy(slot = null){  
            let h = await this.gatherSceneHierarchyBySlot();
            this.props.hierarchy = h;
            this._updateUI();
            // slot = slot || this.getRootSlot();
            // if(slot){
            //     this.selectSlot(slot.id);
            //     if(slot.parentId){
            //         this.expandedNodes.add(slot.parentId);
            //     }
            // }
        }


        // Loads all the Slots on initialization
        async loadHierarchy(hierarchy){
            console.log("loading hierarchy =>", hierarchy)
            if(!hierarchy){ return null}
            this.props.hierarchy = hierarchy;
            
            let hierarchyToSlot = async (h, parent_path = null)=>{
                let path = parent_path ? parent_path + "/" + h.name : h.name;
                let gO = await this.scene.FindByPath(path);
                if(!gO){
                    return await this.loadHistoricalSlot(h, parent_path)
                }

                const slot = await new Slot().init({
                    name: h.name || 'GameObject',
                    parentId: parent_path,
                    _bs: gO
                });

                //Make transform the top component
                let ref_idx = 0;
                let transform = gO.GetComponent(BS.ComponentType.Transform)
                if(transform){
                    let component_ref = h.components[ref_idx]
                    let componentClass = componentBSTypeMap[transform.type]
                    let slotComponent = await new componentClass().init(slot, transform);
                    slotComponent.setId(component_ref);
                    slot.components.push(slotComponent);
                    ref_idx++;
                }

                
                // Add other components
                for(let componentID in gO.components){
                    let component = gO.components[componentID]
                    if(component.type == BS.ComponentType.Transform) continue;
                    let component_ref = h.components[ref_idx]
                    ref_idx++;

                    if(SUPPORTED_COMPONENTS.has(component.type)){
                        //console.log("component =>", component)
                        let componentClass = componentBSTypeMap[component.type]
                        //console.log("componentClass =>", componentClass)
                        let props = this.getHistoricalProps(component_ref).props
                        let slotComponent = await new componentClass().init(slot, component, props);
                        //console.log("slotComponent =>", slotComponent)
                        slotComponent.setId(component_ref);
                        slot.components.push(slotComponent);
                    }
                }

                //Add any MonoBehaviors
                h.components.forEach(async component_ref=>{
                    //console.log("component_ref =>", component_ref)
                    if(component_ref.startsWith("MonoBehavior")){
                        //console.log("MonoBehavior Spotted =>", component_ref)
                        let props = this.getHistoricalProps(component_ref).props
                        props.id = component_ref;
                        let slotComponent = await new MonoBehaviorComponent().init(slot, null, props)
                        slot.components.push(slotComponent);
                    }
                })

                for(let child of h.children){
                    let childSlot = await hierarchyToSlot(child, slot.id);
                    await childSlot._setParent(slot);
                }
                return slot;
            }

            const slot = await hierarchyToSlot(hierarchy, null);

            this.slotData.slots = [slot];
            this.initializeExpandedNodes();
            inspector.hierarchyPanel.render()
        }


        //Creates a slot from the inventory schema
        async _loadSlot(slotData, parentId){
            console.log("loading slot =>", slotData)
            let loadSubSlot = async (item, parentId)=>{ 
                const newSlot = await new Slot().init({
                    name: item.name,
                    parentId: parentId
                });
    
    
                for(let component of item.components){
                    component.properties.id = component.id;
                    await this._addComponent(newSlot, component.type, component.properties);
                }

                for(let i=0; i<item.children.length; i++){
                    let child = item.children[i];
                    let childSlot = await loadSubSlot(child, newSlot.id);
                    await childSlot._setParent(newSlot);
                }
    
                return newSlot;
            }


            let parentSlot = (parentId)? this.getSlotOrRoot(parentId) : this.getSlotOrRoot(slotData.parentId);
            let slot = await loadSubSlot(slotData, parentId);
            await slot._setParent(parentSlot);

            this.expandedNodes.add(parentId);
            this.selectSlot(slot.id);
            slot.finished_loading = true;
            return slot;
        }


        getHistoricalProps(component_ref){
            let type = component_ref.split("_")[0]
            let space_keys = Object.keys(this.props)
            let props = {}
            space_keys.forEach(key=>{
                // console.log("key =>", key, component_ref)
                if(key.startsWith(`__${component_ref}/`)){
                    let path = key.split(":")[0].split("/")
                    //console.log("path =>", path)
                    let prop = path[path.length-1]
                    props[prop] = this.props[key]
                }
            })
            return{
                type: type,
                props: props
            }
        }
        

        // Creates and hydrates a slot using the SpaceProperties
        async loadHistoricalSlot(hierarchy, parentId){
            
            console.log("loading historical slot =>", hierarchy)
            const slot = await new Slot().init({
                name: hierarchy.name,
                parentId: parentId,
            });

            for(let i=0; i<hierarchy.components.length; i++){
                let component_ref = hierarchy.components[i]
                let hist = this.getHistoricalProps(component_ref)
                console.log(`historical props for [${component_ref}] =>`, hist)
                let componentClass = componentTypeMap[hist.type]
                let props = hist.props
                props.id = component_ref;
                let slotComponent = await new componentClass().init(slot, null, props)
                slot.components.push(slotComponent);
            }

            hierarchy.children.forEach(async (child)=>{
                let childSlot = await this.loadHistoricalSlot(child, slot.id);
                await childSlot._setParent(slot);
            })

            return slot;
        }

    
        initializeExpandedNodes() {
            // Expand root nodes by default
            this.slotData.slots.forEach(slot => {
                this.expandedNodes.add(slot.id);
            });
        }

    
        getSlotComponentById(componentId){
            return this.slotData.componentMap[componentId];
        }

        
        toggleNodeExpansion(slotId) {
            if (this.expandedNodes.has(slotId)) {
                this.expandedNodes.delete(slotId);
            } else {
                this.expandedNodes.add(slotId);
            }
        }


        selectSlot(slotId) {
            this.selectedSlot = slotId;
            this._updateUI();
        }

        _updateUI(){
            // Update UI
            if (inspector?.hierarchyPanel) {
                inspector.hierarchyPanel.render();
            }
            if(inspector?.propertiesPanel){
                inspector.propertiesPanel.render(this.selectedSlot);
            }
        }


        getSlotById(slotId) {
            return this.slotData.slotMap[slotId];
        }


        getAllSlots() {
            return Object.values(this.slotData.slotMap || {});
        }

        getRootSlot(){
            return this.slotData.slots[0];
        }

        getSlotOrRoot(slotId){
            let slot = this.getSlotById(slotId);
            if(!slot){
                slot = this.getRootSlot();
            }
            return slot;
        }

        getSelectedSlot(rootFallback){
            if(rootFallback){
                return this.getSlotOrRoot(this.selectedSlot);
            }
            return this.getSlotById(this.selectedSlot);
        }

        getSlotByName(slotName){
            return SM.getAllSlots().find(x=>x.name==slotName);
        }

        getAllMonoBehaviors(){
            return Object.values(this.slotData.componentMap).filter(x=>x.type === "MonoBehavior");
        }


        async _addNewSlot(slotName, parentId = null) {
            if(!this.scene || !window.BS){
                console.log("NO SCENE AVAILABLE")
                return null;
            }

            if(!parentId){
                parentId = this.slotData.slots[0].id;
            }

            let parentSlot = this.getSlotById(parentId);
            if(!parentSlot){
                console.log("no parent slot found")
                return null;
            }
          
            // Create new GameObject
            let newSlot = await new Slot().init({
                parentId: parentId,
                name: slotName
            });

            console.log("NEW SLOT:", newSlot)

            function stringTo8DigitNumber(str) {
                let hash = 0x811c9dc5; // FNV offset basis
                for (let i = 0; i < str.length; i++) {
                  hash ^= str.charCodeAt(i);
                  hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
                }
                return hash % 100_000_000;
              }

            let properties = {
                id: `Transform_${stringTo8DigitNumber(newSlot.id)}`
            }

            let transform = await new TransformComponent().init(newSlot, null, properties);
            newSlot.components.push(transform);

            
            await newSlot._setParent(parentSlot);
        }

       
        async _addComponent(slot, componentType, componentProperties){
            // Check if component already exists (for unique components)
            const uniqueComponents = ['Transform', 'BanterRigidbody', 'BanterSyncedObject'];
            if (uniqueComponents.includes(componentType)) {
                const exists = slot.components.some(c => c.type === componentType);
                if (exists) {
                    console.warn(`A ${componentType} component already exists on this slot`);
                    return;
                }
            }

            // Create the component
            const ComponentClass = componentTypeMap[componentType];
            
            if (!ComponentClass) {
                console.error(`Component class not found for type: ${componentType}`);
                return;
            }
            
            let slotComponent = await new ComponentClass().init(slot, null, componentProperties);
            slot.components.push(slotComponent);
            this.slotData.componentMap[slotComponent.id] = slotComponent;

            // Refresh properties panel
            if (inspector?.propertiesPanel) {
                inspector.propertiesPanel.render(slot.id);
            }
            return slotComponent;
        }
    }

    // Create singleton instance
    export const sceneManager = new SceneManager();
    window.SM = sceneManager
    window.slots = ()=>{ return window.SM.slotData.slots }
    window.crawl = ()=>{
        let dig = (slot)=>{
            let map = {
                slot: slot,
                name: slot.name,
                '.': slot.components,
                '_': slot.components.map(c=>c.type)
            }
            for(let i=0; i<slot.children.length; i++){
                map[i] = dig(slot.children[i])
            }
            return map
        }
        return dig(window.slots()[0])
    }
//})()