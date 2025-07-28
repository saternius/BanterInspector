/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

console.log("It is 12:24")
// (async () => {
    let localhost = window.location.hostname === 'localhost'
    let basePath = localhost ? '.' : `${window.repoUrl}/js`;
    const { loadMockSlotData } = await import(`${basePath}/mock-data.js`);
    const { SUPPORTED_COMPONENTS, Slot, TransformComponent, componentBSTypeMap, componentTypeMap, componentTextMap, componentBundleMap, MonoBehaviorComponent } = await import( `${basePath}/components/index.js`);

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
        }


        async initialize() {
            try {
                if (typeof window.BS === 'undefined' || !window.BS.BanterScene) {
                    console.error('BS library not available');
                    return;
                }
                this.scene = window.BS.BanterScene.GetInstance();

                this.setup = async ()=>{
                    if(this.loaded) return;
                    
                    console.log("setting up inspector")
                    if(localhost){
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
                        console.log("No host user found, setting to local user =>", SM.scene.localUser.name)
                        this.setSpaceProperty("hostUser", SM.scene.localUser.name, false);
                    }else{
                        let hostHere = Object.values(this.scene.users).map(x=>x.name).includes(this.scene.spaceState.public.hostUser);
                        if(!hostHere){
                            console.log("Host user not here, setting to local user =>", SM.scene.localUser.name)
                            this.setSpaceProperty("hostUser", SM.scene.localUser.name, false);
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
            if(localhost){
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
            this.setSpaceProperty("hostUser", SM.scene.localUser.name, false);
            setTimeout(()=>{
                this.sendOneShot('reset');
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
            slot = slot || this.getRootSlot();
            if(slot){
                this.selectSlot(slot.id);
                if(slot.parentId){
                    this.expandedNodes.add(slot.parentId);
                }
            }
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
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: slot.id }
            }));

            
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


        handleSpaceStateChange(event) {
            const { changes } = event.detail;
            //console.log("[SPACE CHANGE] =>", changes)
            changes.forEach(async (change) => {
                //console.log("[SPACE CHANGE] =>", change)
                let { property, newValue, isProtected } = change;
                newValue = JSON.parse(newValue);
                
                if (isProtected) {
                    this.scene.spaceState.protected[property] = newValue;
                } else {
                    this.scene.spaceState.public[property] = newValue;
                }

                let renderProps = (component)=>{
                    if(this.selectedSlot === component._slot.id){
                        inspector.propertiesPanel.render(this.selectedSlot)
                    }
                }
                

                
                if(property.slice(0,2) == "__"){
                    let items = property.split(":");
                    let path = items[0].split("/");
                    let prop = path[path.length-1];
                    let type = items[1].split("_")
                    //console.log("updating =>", items, path, prop, type)
                    if(type[0] == "slot"){
                        let ref = ['Root'].concat(path.slice(1,-1)).join("/")
                        let slot = this.getSlotById(ref);
                        if(slot){
                            await slot._set(prop, newValue);
                            inspector.hierarchyPanel.render()
                        }
                        
                    }else if(type[0] == "monobehavior"){
                        //console.log("updating monobehavior =>", property, newValue)
                        let ref = path[0].slice(2)
                        let monobehavior = this.getSlotComponentById(ref);
                        if(monobehavior && monobehavior.ctx){
                            if(prop === "_running"){
                                monobehavior.ctx._running = newValue;
                                inspector.lifecyclePanel.render()
                            }else{
                                monobehavior.ctx.vars[prop] = newValue;
                                renderProps(monobehavior)
                            }
                        }
                    }else if(type[0] == "component"){
                        let component = this.getSlotComponentById(path[0].slice(2));
                        if(component){
                            await component._set(prop, newValue);
                            renderProps(component)
                        }
                        
                    }
                }
            });
        }


        async handleOneShot(event){

            let renderProps = (component)=>{
                if(navigation.currentPage !== "world-inspector") return;
                if(this.selectedSlot === component._slot.id){
                    inspector.propertiesPanel.render(this.selectedSlot)
                }
            }


            console.log("handleOneShot =>", event)
            let message = event.detail.data;
            let firstColon = message.indexOf(":");
            let timestamp = message.slice(0, firstColon);
            let data = message.slice(firstColon+1);

            if(data.startsWith("update_slot")){ //`update_slot:${this.id}:${property}:${value}`;
                let str = data.slice(12)
                let nxtColon = str.indexOf(":")
                let slotId = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let prop = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let value = str.slice(nxtColon+1)
                let slot = this.getSlotById(slotId);
                if(slot){
                    await slot._set(prop, value);
                    inspector.hierarchyPanel.render()
                    renderProps(slot)
                }
                this.props[`__${slotId}/${prop}:slot`] = value
                return;
            }


            if(data.startsWith("update_component")){ // `update_component:${this.id}:${property}:${value}`;
                let str = data.slice(17)
                let nxtColon = str.indexOf(":")
                let componentId = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let prop = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let value = str.slice(nxtColon+1)
                let component = this.getSlotComponentById(componentId);
                if(component){
                    await component._set(prop, value);
                    renderProps(component)
                }
                this.props[`__${componentId}/${prop}:component`] = value
                return;
            }

            //update_monobehavior, update_component, update_slot
            if(data.startsWith("update_monobehavior")){
                let str = data.slice(20)
                let nxtColon = str.indexOf(":")
                let componentId = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let op = str.slice(0, nxtColon)
                str = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let prop = str.slice(nxtColon+1)
                nxtColon = str.indexOf(":")
                let value = str.slice(nxtColon+1)
                let monobehavior = this.getSlotComponentById(componentId);
                if(op === "vars"){
                    monobehavior.ctx.vars[prop] = value;
                    renderProps(monobehavior)
                }else if(op === "_running"){
                    monobehavior.ctx._running = value;
                    inspector.lifecyclePanel.render()
                }

                this.props[`__${componentId}/${prop}:component`] = value

                return;
            }

            if(data === "reset"){
                window.location.reload();
            }
           
            if(data.startsWith("load_slot")){
                let [parentId, slot_data] = data.slice(10).split("|");
                await this._loadSlot(JSON.parse(slot_data), parentId);
                await this.updateHierarchy(this.selectedSlot);
                return;
            }

            if(data.startsWith("component_added")){
                let event = JSON.parse(data.slice(16));
                let slot = this.getSlotById(event.slotId);
                if(slot){
                    await this._addComponent(slot, event.componentType, event.componentProperties);
                    await this.updateHierarchy(this.selectedSlot);
                }
                return;
            }

            if(data.startsWith("component_removed")){
                let componentId = data.slice(18);
                let component = this.getSlotComponentById(componentId);
                if(component){
                    await component._destroy();
                    await this.updateHierarchy(this.selectedSlot);
                }
                return;
            }


            if(data.startsWith("slot_added")){
                let [parentId, slotName] = data.slice(11).split(":");
                await this._addNewSlot(slotName, parentId);
                await this.updateHierarchy(this.selectedSlot);
                return;
            }

            if(data.startsWith("slot_removed")){
                let slotId = data.slice(13);
                let slot = this.getSlotById(slotId);
                if(slot){
                    await slot._destroy();
                    await this.updateHierarchy(this.selectedSlot);
                }
                return;
            }

            if(data.startsWith("slot_moved")){
                let [slotId, newParentId, newSiblingIndex] = data.slice(11).split(":");
                //newSiblingIndex = (newSiblingIndex)? parseInt(newSiblingIndex) : null;
                const slot = this.getSlotById(slotId);
                if (!slot) return;
                if(!newParentId) newParentId = this.slotData.slots[0].id;
                await slot._setParent(this.getSlotById(newParentId));
                await this.updateHierarchy(this.selectedSlot);
                return;
            }

            if(data.startsWith("monobehavior_start")){
                let componentId = data.slice(19);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._start();
                }
                return;
            }

            if(data.startsWith("monobehavior_stop")){
                let componentId = data.slice(18);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._stop();
                }
                return;
            }

            if(data.startsWith("monobehavior_refresh")){
                let componentId = data.slice(21);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._refresh();
                }
                return;
            }
        }


        async setSpaceProperty(key, value, isProtected) {
            if (!this.scene) return;

            //console.log(`setting space property => [${key}] => ${value}`)
         
            //console.log("[setSpaceProperty]", key, value, isProtected)

            // if(value && value.value !== undefined){
            //     value = value.value;
            // }

            value = JSON.stringify(value);

            if (isProtected) {
                this.scene.SetProtectedSpaceProps({ [key]: value });
                this.scene.spaceState.protected[key] = value;
            } else {
                this.scene.SetPublicSpaceProps({ [key]: value });
                this.scene.spaceState.public[key] = value;
            }
            
            if(localhost){
                this.handleSpaceStateChange({detail: {changes: [{property: key, newValue: value, isProtected: isProtected}]}})
                //localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
            }
        }

        async deleteSpaceProperty(key, isProtected){
            if(isProtected){
                this.scene.SetProtectedSpaceProps({ [key]: null });
                delete this.scene.spaceState.protected[key];
            }else{
                this.scene.SetPublicSpaceProps({ [key]: null });
                delete this.scene.spaceState.public[key];
            }
            // if(localhost){
            //     localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
            // }
        }


        async sendOneShot(data){
            //console.log("sending one shot =>", data)
            let data = `${Date.now()}:${data}`
            this.scene.OneShot(data);
            if(localhost){
                this.handleOneShot({detail: {data: data}})
            }
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

             // Update UI
             document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: slotId }
            }));

            if (inspector?.hierarchyPanel) {
                inspector.hierarchyPanel.render();
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

        getSelectedSlot(){
            return this.getSlotOrRoot(this.selectedSlot);
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