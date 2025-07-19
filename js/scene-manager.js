/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

console.log("It is 9:05")
// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`;
    const { loadMockSlotData } = await import(`${basePath}/mock-data.js`);
    const { SUPPORTED_COMPONENTS, Slot, TransformComponent, componentBSTypeMap, componentTypeMap, componentTextMap } = await import( `${basePath}/components/index.js`);

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

        /**
         * Initialize the scene manager
         */
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
                    try {
                        console.log('Gathering scene hierarchy...');
                        let hierarchy = null;
                        if(!this.scene.spaceState.public.hierarchy){
                            hierarchy = await this.gatherSceneHierarchy();
                            this.setSpaceProperty("hierarchy", hierarchy, false);
                        }else{
                            hierarchy = this.scene.spaceState.public.hierarchy;
                        }
                        console.log("hierarchy =>", hierarchy)
                        this.loadHierarchy(hierarchy);
                        // console.log('Setting up space state handlers...');
                        // this.setupSpaceStateHandlers();
                    } catch (error) {
                        console.error('Error gathering scene hierarchy:', error);
                    }
                    this.loaded = true;
                    inspectorApp.hierarchyPanel.render()
                }
            } catch (error) {
                console.error('Failed to connect to Unity:', error);
            }
            window.scene = this.scene
        }

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
                    if(component.type == "Transform") continue;
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

        async loadHierarchy(hierarchy){
            console.log("loading hierarchy =>", hierarchy)
            if(!hierarchy){ return null}
            
            let hierarchyToSlot = async (h, parent_path = null)=>{
                let path = parent_path ? parent_path + "/" + h.name : h.name;
                let gO = await this.scene.FindByPath(path);
                if(!gO){
                    console.log("no game object found at path =>", path)
                    return null;
                }

                const slot = await new Slot().init({
                    name: h.name || 'GameObject',
                    parentId: parent_path,
                    _bs: gO
                });

                let ref_idx = 0;
                // Add other components
                for(let componentID in gO.components){
                    let component = gO.components[componentID]
                    let component_ref = h.components[ref_idx]
                    ref_idx++;

                    if(SUPPORTED_COMPONENTS.has(component.type)){
                        console.log("component =>", component)
                        let componentClass = componentBSTypeMap[component.type]
                        console.log("componentClass =>", componentClass)
                        let slotComponent = await new componentClass().init(slot, component);
                        console.log("slotComponent =>", slotComponent)
                        slotComponent.setId(component_ref);
                        slot.components.push(slotComponent);
                    }
                }

                for(let child of h.children){
                    let childSlot = await hierarchyToSlot(child, slot.id);
                    await childSlot.setParent(slot);
                }
                slot.children = slot.children.filter(c => c);
                return slot;
            }

            const slot = await hierarchyToSlot(hierarchy, null);

            this.slotData.slots = [slot];
            this.initializeExpandedNodes();
            inspectorApp.hierarchyPanel.render()
        }

    
        /**
         * Initialize expanded nodes
         */
        initializeExpandedNodes() {
            // Expand root nodes by default
            this.slotData.slots.forEach(slot => {
                this.expandedNodes.add(slot.id);
            });
        }

    
        /**
         * Handle space state changes
         */
        handleSpaceStateChange(event) {
            const { changes } = event.detail;
            changes.forEach(async (change) => {
                let { property, newValue, isProtected } = change;
                newValue = JSON.parse(newValue);
                
                if (isProtected) {
                    this.scene.spaceState.protected[property] = newValue;
                } else {
                    this.scene.spaceState.public[property] = newValue;
                }
                console.log("change =>", change)

                
                if(property.slice(0,2) == "__"){
                    let items = property.split(":");
                    let path = items[0].split("/");
                    let prop = path[path.length-1];
                    let type = items[1].split("_")
                    if(type[0] == "component"){
                        let component = this.getSlotComponentById(items[1]);
                        if(component){
                            await component.update(prop, newValue);
                        }
                    }else if(type[0] == "slot"){
                        let slot = this.getSlotById(items[1]);
                        if(slot){
                            await slot.update(prop, newValue);
                        }
                    }
                }
            });
        }


        /**
         * Set space property
         */
        async setSpaceProperty(key, value, isProtected) {
            if (!this.scene) return;
            console.log("[setSpaceProperty]", key, value, isProtected)

            if(value && value.value !== undefined){
                value = value.value;
            }

            value = JSON.stringify(value);

            if (isProtected) {
                this.scene.SetProtectedSpaceProps({ [key]: value });
                this.scene.spaceState.protected[key] = value;
            } else {
                this.scene.SetPublicSpaceProps({ [key]: value });
                this.scene.spaceState.public[key] = value;
            }
            
            // UI updates should be handled by change manager listeners
        }


        /**
         * Get slot by ID
         */
        getSlotById(slotId) {
            return this.slotData.slotMap[slotId];
        }
        
        /**
         * Get all slots as a flat array
         */
        getAllSlots() {
            return Object.values(this.slotData.slotMap || {});
        }

    
        /**
         * Get the component for a slot
         */
        getSlotComponentById(componentId){
            return this.slotData.componentMap[componentId];
        }

        
        /**
         * Toggle node expansion
         */
        toggleNodeExpansion(slotId) {
            if (this.expandedNodes.has(slotId)) {
                this.expandedNodes.delete(slotId);
            } else {
                this.expandedNodes.add(slotId);
            }
        }

        /**
         * Select slot
         */
        selectSlot(slotId) {
            this.selectedSlot = slotId;
        }


        /**
         * Add new slot
         */
        async addNewSlot(parentId = null) {
            if(!this.scene || !window.BS){
                console.log("NO SCENE AVAILABLE")
                return null;
            }

            if(!parentId){
                parentId = this.slotData.slots[0].id;
            }

            try {
                // Create new GameObject
                let newSlot = await new Slot().init({
                    name: "UnNamedObject",
                    parentId: parentId
                });
              
                const parent = this.getSlotById(parentId);
                parent.children.push(newSlot);
                this.scene.OneShot('+slot_added', {slotId: newSlot.id});
                return newSlot;
            } catch (error) {
                console.error('Failed to create Unity GameObject:', error);
                return null
            }
        }

        /**
         * Delete slot
         */
        async deleteSlot(slotId) {
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
                        this.deleteComponent(comp);
                    });
                }
            }
            
            // Notify lifecycle manager of slot destruction
            if (window.lifecycleManager) {
                slotsToDelete.forEach(id => {
                    window.lifecycleManager.triggerDestroyForSlot(id);
                });
            }
            
            // Reverse order to delete children first
            for (let i = slotsToDelete.length - 1; i >= 0; i--) {
                const deleteSlot = this.getSlotById(slotsToDelete[i]);
                if (deleteSlot) {
                    try {
                        await deleteSlot._bs.Destroy();
                        deleteSlot.destroyed = true;
                        this.scene.OneShot('+slot_deleted', {slotId: this.id});
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
            
            // Clear selection if this slot was selected
            if (this.selectedSlot === slotId) {
                this.selectedSlot = null;
            }
            
        }

        /**
         * Reparent a slot to a new parent
         */
        async reparentSlot(slotId, newParentId) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;

            if(!newParentId){
                newParentId = this.slotData.slots[0].id;
            }
            await slot.setParent(this.getSlotById(newParentId));

            this.scene.OneShot('+slot_reparented', {slotId: slot.id, newParentId: newParentId});
        }

        async addComponent(slot, componentType, componentProperties){
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
            
            this.scene.OneShot('+component_added', {componentType: componentType, componentProperties: componentProperties, componentId: slotComponent.id, slotId: slot.id});  
            return slotComponent;
        }

        async deleteComponent(slotComponent){
            await slotComponent.destroy();
            slotComponent.destroyed = true;
            slotComponent._slot.components.splice(slotComponent._slot.components.indexOf(this), 1);
            this.scene.OneShot('+component_deleted', {componentId: slotComponent.id});            
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
        }

        async createSlotHierarchy(item, parentId){
            //create a new slot
            const newSlot = await new Slot().init({
                name: item.name,
                parentId: parentId
            });


            //create new components
            for(let component of item.components){
                if(component.type === "Transform"){
                    let transform = newSlot.getTransform();
                    transform.updateMany(component.properties);
                }else{
                    await this.addComponent(newSlot, component.type, component.properties);
                }
            }

            item.children.forEach(async (child) => {
                let childSlot = await this.createSlotHierarchy(child, newSlot.id);
                await childSlot.setParent(newSlot);
            });

            return newSlot;
        }

        async loadSlotFromInventory(item){
            if (!this.selectedSlot) {
                this.selectedSlot = this.slotData.slots[0].id
            }
            const parentSlot = this.getSlotById(this.selectedSlot);
            const newSlot = await this.createSlotHierarchy(item.data, parentSlot.id);
            
            await newSlot.setParent(parentSlot);
            
            this.scene.OneShot('+item_added', {item: item, slotId: parentSlot.id});

            // Trigger hierarchy update
            document.dispatchEvent(new CustomEvent('sceneUpdated'));
            
            
            // Navigate to world inspector page and select the parent slot
            setTimeout(() => {
                const worldTab = document.querySelector('[data-page="world-inspector"]');
                if (worldTab) {
                    worldTab.click();
                    // Trigger selection of the parent slot to show the new child
                    document.dispatchEvent(new CustomEvent('slotSelectionChanged', {
                        detail: { slotId: newSlot.id }
                    }));
                }
            }, 500);
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