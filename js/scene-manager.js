/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

console.log("It is 4:23")
// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : `${window.repoUrl}/js`;
    const { loadMockSlotData } = await import(`${basePath}/mock-data.js`);
    const { SUPPORTED_COMPONENTS, Slot, TransformComponent, componentBSTypeMap, componentTypeMap } = await import( `${basePath}/components/index.js`);

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
                this.scene.addEventListener("unity-loaded", async () => {
                    console.log('Unity loaded');
                    try {
                        console.log('Gathering scene hierarchy...');
                        await this.gatherSceneHierarchy();
                        console.log('Setting up space state handlers...');
                        this.setupSpaceStateHandlers();
                    } catch (error) {
                        console.error('Error gathering scene hierarchy:', error);
                    }
                });

                setTimeout(() => {
                    reject(new Error('Unity connection timeout'));
                }, 20000);
            } catch (error) {
                console.error('Failed to connect to Unity:', error);
            }
            window.scene = this.scene
        }


        /**
         * Gather scene hierarchy from Unity
         */
        async gatherSceneHierarchy() {
            console.log("gathering SceneHierarchy")

            
            // Helper to convert GameObject to slot format
            const gameObjectToSlot = async (gameObject, parentId = null) => {
                const slot = await new Slot().init({
                    name: gameObject.name || 'GameObject',
                    parentId: parentId,
                    active: gameObject.active !== false,
                    persistent: true,
                    components: [],
                    children: [],
                    _bs: gameObject
                });

                //Make tranform the top component
                let transform = gameObject.GetComponent(BS.ComponentType.Transform)
                if(transform){
                    let transformSlotComponent = await new TransformComponent().init(slot, transform);
                    slot.components.push(transformSlotComponent);
                    this.slotData.componentMap[transformSlotComponent.id] = transformSlotComponent
                }

                for(let componentID in gameObject.components){
                    if(componentID == transform.id) continue;
                    let component = gameObject.components[componentID]
                    if(SUPPORTED_COMPONENTS.has(component.type)){
                        console.log("component =>", component)
                        let componentClass = componentBSTypeMap[component.type]
                        console.log("componentClass =>", componentClass)
                        let slotComponent = await new componentClass().init(slot, component);
                        console.log("slotComponent =>", slotComponent)
                        slot.components.push(slotComponent);
                        this.slotData.componentMap[slotComponent.id] = slotComponent
                    }
                }
                
                // Process children using Traverse method if available
                if (gameObject.Traverse) {
                    const childPromises = [];
                    gameObject.Traverse((child) => {
                        if (child && child.id !== gameObject.id) {
                            if (child.parent == gameObject.id) {
                                childPromises.push(gameObjectToSlot(child, slot.id));
                            }
                        }
                    });
                    
                    const childSlots = await Promise.all(childPromises);
                    slot.children = childSlots.filter(s => s);
                } 
                return slot;
            };
            
            let rootSlot = null;
            try {
                // Common root object names to search for
                const rootName = 'Root'
                const obj = await this.scene.Find(rootName);
                if (obj) {
                    const slot = await gameObjectToSlot(obj);
                    rootSlot = slot;
                    console.log("rootSlot =>", rootSlot)
                }else{
                    console.log("no root found")
                }
            } catch (error) {
                console.error('Error gathering scene hierarchy:', error);
            }
            
            // Set the scene data
            this.slotData.slots = [rootSlot];
            console.log("slotData.slots =>", this.slotData.slots)
            this.initializeExpandedNodes();
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
         * Setup space state event handlers
         */
        setupSpaceStateHandlers() {
            if (!this.scene) return;
            
            // Listen for space state changes
            this.scene.addEventListener('space-state-changed', (event) => {
                this.handleSpaceStateChange(event);
            });
        }

        /**
         * Handle space state changes
         */
        handleSpaceStateChange(event) {
            console.log("TODO: make changes sync across all clients")
            const { changes } = event.detail;
            
            changes.forEach(change => {
                const { property, newValue, isProtected } = change;
                
                if (isProtected) {
                    this.scene.spaceState.protected[property] = newValue;
                } else {
                    this.scene.spaceState.public[property] = newValue;
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
                        sceneManager.scene.OneShot('+slot_deleted', {slotId: this.id});
                        delete sceneManager.slotData.slotMap[this.id];

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
            sceneManager.slotData.componentMap[slotComponent.id] = slotComponent;

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
            if (!sceneManager.selectedSlot) {
                sceneManager.selectedSlot = sceneManager.slotData.slots[0].id
            }
            const parentSlot = this.getSlotById(this.selectedSlot);
            const newSlot = await this.createSlotHierarchy(item.data, parentSlot.id);
            
            await newSlot.setParent(parentSlot);
            
            sceneManager.scene.OneShot('+item_added', {item: item, slotId: parentSlot.id});

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