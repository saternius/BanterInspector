/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

console.log("It is 6:03")
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
                        if(!this.scene.spaceState.public.hierarchy){
                            hierarchy = await this.gatherSceneHierarchy();
                            this.setSpaceProperty("hierarchy", hierarchy, false);
                        }else{
                            let h = this.scene.spaceState.public.hierarchy;
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
                    inspectorApp.hierarchyPanel.render()
                    setTimeout(()=>{
                        inspectorApp.lifecyclePanel.render()
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
            await this.initialize();
        }

        claimHost(){
            this.setSpaceProperty("hostUser", SM.scene.localUser.name, false);
            setTimeout(()=>{
                this.sendOneShot('reset');
            }, 1000)
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
                    components: slot.components.map(c=>c.id),
                    children: slot.children.map(c=>createSlotHierarchy(c))
                }
                return h;
            }
            let hierarchy = createSlotHierarchy(rootSlot);
            return hierarchy;
        }


        getSlotSpaceProperties(slot){
            let props = {}
            let getSubSlotProps = (slot)=>{
                props[`__${slot.id}/active:slot`] = slot.active
                props[`__${slot.id}/persistent:slot`] = slot.persistent
                props[`__${slot.id}/name:slot`] = slot.name
                
                slot.components.forEach(component=>{
                    Object.keys(component.properties).forEach(prop=>{
                        props[`__${slot.id}/${component.type}/${prop}:${component.id}`] = component.properties[prop]
                    })
                })

                slot.children.forEach(child=>{
                    getSubSlotProps(child)
                })
            }

            getSubSlotProps(slot)
            return props
        }


        // Updates the hierarchy of the scene from the root slot
        async updateHierarchy(slot = null){  
            let h = await this.gatherSceneHierarchyBySlot();
            this.setSpaceProperty("hierarchy", h, false);

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
                    await childSlot.setParent(slot);
                }
                return slot;
            }

            const slot = await hierarchyToSlot(hierarchy, null);

            this.slotData.slots = [slot];
            this.initializeExpandedNodes();
            inspectorApp.hierarchyPanel.render()
        }


        //Creates a slot from the inventory schema
        async _loadSlot(slotData, parentId){

            let loadSubSlot = async (item, parentId)=>{ 
                const newSlot = await new Slot().init({
                    name: item.name,
                    parentId: parentId
                });
    
    
                for(let component of item.components){
                    await this._addComponent(newSlot, component.type, component.properties);
                }
    
                item.children.forEach(async (child) => {
                    let childSlot = await loadSubSlot(child, newSlot.id);
                    await childSlot.setParent(newSlot);
                });
    
                return newSlot;
            }


            let parentSlot = (parentId)? this.getSlotOrRoot(parentId) : this.getSlotOrRoot(slotData.parentId);
            let slot = await loadSubSlot(slotData, parentId);
            await slot.setParent(parentSlot);

            this.expandedNodes.add(parentId);
            this.selectSlot(slot.id);
            document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                detail: { slotId: slot.id }
            }));
            await this.updateHierarchy(slot);

            let spaceProps = this.getSlotSpaceProperties(slot)
            this.scene.SetPublicSpaceProps(spaceProps)

            if(localhost){
                Object.keys(spaceProps).forEach(key=>{
                    this.scene.spaceState.public[key] = spaceProps[key]
                })
                localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
            }
            slot.finished_loading = true;
            return slot;
        }


        getHistoricalProps(component_ref){
            let type = component_ref.split("_")[0]
            let space_keys = Object.keys(this.scene.spaceState.public)
            let props = {}
            space_keys.forEach(key=>{
                // console.log("key =>", key, component_ref)
                if(key.endsWith(component_ref)){
                    let path = key.split(":")[0].split("/")
                    //console.log("path =>", path)
                    let prop = path[path.length-1]
                    props[prop] = this.scene.spaceState.public[key]
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
                let componentClass = componentTypeMap[hist.type]
                let props = hist.props
                props.id = component_ref;
                let slotComponent = await new componentClass().init(slot, null, props)
                slot.components.push(slotComponent);
            }

            hierarchy.children.forEach(async (child)=>{
                let childSlot = await this.loadHistoricalSlot(child, slot.id);
                await childSlot.setParent(slot);
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
                        inspectorApp.propertiesPanel.render(this.selectedSlot)
                    }
                }
                

                
                if(property.slice(0,2) == "__"){
                    let items = property.split(":");
                    let path = items[0].split("/");
                    let prop = path[path.length-1];
                    let type = items[1].split("_")
                    if(type[0] == "slot"){
                        let ref = ['Root'].concat(path.slice(1,-1)).join("/")
                        let slot = this.getSlotById(ref);
                        if(slot){
                            await slot.update(prop, newValue);
                        }
                        inspectorApp.hierarchyPanel.render()
                    }else if(type[0] == "monobehavior"){
                        console.log("updating monobehavior =>", property, newValue)
                        let ref = path[0].slice(2)
                        let monobehavior = this.getSlotComponentById(ref);
                        if(monobehavior && monobehavior.scriptContext){
                            if(prop === "_running"){
                                monobehavior.scriptContext._running = newValue;
                                inspectorApp.lifecyclePanel.render()
                            }else{
                                monobehavior.scriptContext.vars[prop] = newValue;
                                renderProps(monobehavior)
                            }
                        }
                    }else{
                        let component = this.getSlotComponentById(items[1]);
                        if(component){
                            await component.update(prop, newValue);
                        }
                        renderProps(component)
                    }
                }
            });
        }


        async handleOneShot(event){
            console.log("handleOneShot =>", event)
            let data = event.detail.data;

            if(data === "reset"){
                window.location.reload();
            }
           
            if(data.startsWith("load_slot")){
                let [parentId, slot_data] = data.slice(10).split("|");
                await this._loadSlot(JSON.parse(slot_data), parentId);
            }

            if(data.startsWith("component_added")){
                let event = JSON.parse(data.slice(16));
                let slot = this.getSlotById(event.slotId);
                if(slot){
                    await this._addComponent(slot, event.componentType, event.componentProperties);
                }
            }

            if(data.startsWith("component_removed")){
                let componentId = data.slice(18);
                let component = this.getSlotComponentById(componentId);
                if(component){
                    await this._deleteComponent(component);
                }
            }


            if(data.startsWith("slot_added")){
                let [parentId, slotName] = data.slice(11).split(":");
                await this._addNewSlot(slotName, parentId);
            }

            if(data.startsWith("slot_removed")){
                let slotId = data.slice(13);
                await this._deleteSlot(slotId);
            }

            if(data.startsWith("slot_moved")){
                let [slotId, newParentId, newSiblingIndex] = data.slice(11).split(":");
                newSiblingIndex = (newSiblingIndex)? parseInt(newSiblingIndex) : null;
                await this._moveSlot(slotId, newParentId, newSiblingIndex);
            }

            if(data.startsWith("monobehavior_start")){
                let componentId = data.slice(19);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._start();
                }
            }

            if(data.startsWith("monobehavior_stop")){
                let componentId = data.slice(18);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._stop();
                }
            }

            if(data.startsWith("monobehavior_refresh")){
                let componentId = data.slice(21);
                let monobehavior = this.getSlotComponentById(componentId);
                if(monobehavior){
                    monobehavior._refresh();
                }
            }
        }


        async setSpaceProperty(key, value, isProtected) {
            if (!this.scene) return;
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
                localStorage.setItem('lastSpaceState', JSON.stringify(this.scene.spaceState));
            }
        }


        async sendOneShot(data){
            //console.log("sending one shot =>", data)
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

            if (window.inspectorApp?.hierarchyPanel) {
                window.inspectorApp.hierarchyPanel.render();
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

            let transform = await new TransformComponent().init(newSlot);
            newSlot.components.push(transform);

            
            await newSlot.setParent(parentSlot);
            await this.updateHierarchy(newSlot);
        }

        async _deleteSlot(slotId) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;
            
            // Get all slots to delete (including children)
            const slotsToDelete = [slotId];
            const collectChildren = (slot) => {
                if (slot.children) {
                    slot.children.forEach(child => {
                        slotsToDelete.push(child.id);
                        collectChildren(child);
                    });
                }
            };
            collectChildren(slot);
            
            // Clean up components before destroying
            for (const delSlotId of slotsToDelete) {
                const delSlot = this.getSlotById(delSlotId);
                if (delSlot && delSlot.components) {
                    delSlot.components.forEach(comp => {
                        this._deleteComponent(comp);
                    });
                }
            }
            
            // Reverse order to delete children first
            for (let i = slotsToDelete.length - 1; i >= 0; i--) {
                const deleteSlot = this.getSlotById(slotsToDelete[i]);
                if (deleteSlot) {
                    try {
                        await deleteSlot._bs.Destroy();
                        deleteSlot.destroyed = true;
                        delete this.slotData.slotMap[this.id];

                    } catch (error) {
                        console.error(`Failed to destroy GameObject ${deleteSlot.name}:`, error);
                    }
                }
            }
            
            
            // Remove from parent's children or root
            if (slot.parentId) {
                const parent = this.getSlotById(slot.parentId);
                if (parent) {
                    parent.children = parent.children.filter(child => child.id !== slotId);
                }
            } else {
                this.slotData.slots = this.slotData.slots.filter(s => s.id !== slotId);
            }

            await this.updateHierarchy(null);
        }

        async _moveSlot(slotId, newParentId, newSiblingIndex) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;

            if(!newParentId){
                newParentId = this.slotData.slots[0].id;
            }
            await slot.setParent(this.getSlotById(newParentId));
            if(newSiblingIndex){
                //slot.setSiblingIndex(newSiblingIndex); TODO: implement this
            }
            await this.updateHierarchy(slot);
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
            if (window.inspectorApp?.propertiesPanel) {
                window.inspectorApp.propertiesPanel.render(slot.id);
            }
            await this.updateHierarchy(slot);
            return slotComponent;
        }

        async _handleComponentBundles(slot, slotComponent){ //TODO: make it so that this only triggers on the component menu
            let bundles = componentBundleMap[slotComponent.type];
            let idx = parseInt(slotComponent.id.split("_")[1]);
            if(bundles){
                for(let bundle of bundles){
                    let properties = {
                        id: `${bundle}_${idx}`,
                    }
                    await this._addComponent(slot, bundle, properties);
                    idx += 1;
                }
            }
        }

        async _deleteComponent(slotComponent){
            let isMonoBehavior = slotComponent.type === "MonoBehavior";
            console.log("deleting component =>", slotComponent)
            await slotComponent.destroy();
            slotComponent.destroyed = true;
            slotComponent._slot.components.splice(slotComponent._slot.components.indexOf(slotComponent), 1);
            delete this.slotData.componentMap[slotComponent.id];
            
            // Remove any space properties associated with this component
            const propsToRemove = [];
            const spaceState = this.scene?.spaceState;
            
            if (spaceState) {
                // Check both public and protected properties
                ['public', 'protected'].forEach(type => {
                    const props = spaceState[type];
                    Object.keys(props).forEach(key => {
                        // Property keys for components have format: __SlotName/ComponentType/PropertyName:ComponentId
                        if (key.includes(`:${slotComponent.id}`)) {
                            propsToRemove.push({ key, isProtected: type === 'protected' });
                        }
                    });
                });
                
                // Remove the properties
                for (const { key, isProtected } of propsToRemove) {
                    if (isProtected) {
                        delete spaceState.protected[key];
                        if (this.scene.SetProtectedSpaceProps) {
                            this.scene.SetProtectedSpaceProps({ [key]: null });
                        }
                    } else {
                        delete spaceState.public[key];
                        if (this.scene.SetPublicSpaceProps) {
                            this.scene.SetPublicSpaceProps({ [key]: null });
                        }
                    }
                }
            }

            if (window.inspectorApp?.propertiesPanel) {
                window.inspectorApp.propertiesPanel.render(this.slotId);
            }

            this.updateHierarchy(slotComponent._slot);
            if(isMonoBehavior){
                inspectorApp.lifecyclePanel.render()
            }
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