/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

// (async () => {
    let basePath = window.location.hostname === 'localhost'? '.' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
    const { loadMockSceneData } = await import(`${basePath}/mock-data.js`);

    export class SceneManager {
        constructor() {
            this.scene = null;
            this.sceneData = {
                slots: [],
                hierarchyMap: {}
            };
            this.selectedSlot = null;
            this.expandedNodes = new Set();
            this.pendingChanges = new Map();
            this.updateTimer = null;
        }

        /**
         * Initialize the scene manager
         */
        async initialize() {
            try {
                await this.connectToUnityScene();
            } catch (error) {
                console.error('Failed to connect to Unity:', error);
                console.log('Loading mock data for development...');
                this.sceneData = loadMockSceneData();
                this.initializeExpandedNodes();
            }
            window.scene = this.scene
        }

        /**
         * Connect to Unity scene via BS library
         */
        async connectToUnityScene() {
            return new Promise((resolve, reject) => {
                if (typeof window.BS === 'undefined' || !window.BS.BanterScene) {
                    reject(new Error('BS library not available'));
                    return;
                }

                this.scene = window.BS.BanterScene.GetInstance();
                this.scene.SetLoadPromise(new Promise((unityResolve) => {
                    this.scene.addEventListener("unity-loaded", unityResolve, { once: true });
                }));

                this.scene.addEventListener("unity-loaded", async () => {
                    console.log('Unity loaded, gathering scene hierarchy...');
                    try {
                        await this.gatherSceneHierarchy();
                        this.setupSpaceStateHandlers();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                setTimeout(() => {
                    reject(new Error('Unity connection timeout'));
                }, 5000);
            });
        }

        /**
         * Gather scene hierarchy from Unity
         */
        async gatherSceneHierarchy() {
            // Initialize scene.objects if it doesn't exist
            if (!this.scene.objects) {
                this.scene.objects = {};
            }
            
            
            // Helper to convert GameObject to slot format
            const gameObjectToSlot = async (gameObject, parentId = null) => {
                let id = gameObject.id
                
                // Store the GameObject reference
                this.scene.objects[id] = gameObject;
                
                // Get transform component for hierarchy info
                let transform = null;
                if (gameObject.GetComponent) {
                    transform = gameObject.GetComponent(BS.ComponentType.Transform);
                }
                
                const slot = {
                    id: id,
                    name: gameObject.name || 'GameObject',
                    parentId: parentId,
                    active: gameObject.active !== false,
                    persistent: true,
                    components: [],
                    children: []
                };
                
                // Extract transform data
                if (transform) {
                    slot.components.push({
                        id: `${id}_Transform`,
                        type: 'Transform',
                        properties: {
                            position: transform.position || { x: 0, y: 0, z: 0 },
                            rotation: transform.rotation || { x: 0, y: 0, z: 0, w: 1 },
                            localScale: transform.localScale || { x: 1, y: 1, z: 1 }
                        }
                    });
                }
                
                // Extract other components
                const componentTypes = [
                    BS.ComponentType.BanterRigidbody,
                    BS.ComponentType.BanterMaterial,
                    BS.ComponentType.BanterText,
                    BS.ComponentType.BanterAudioSource,
                    BS.ComponentType.BoxCollider,
                    BS.ComponentType.SphereCollider
                ];
                
                for (const type of componentTypes) {
                    try {
                        if (gameObject.GetComponent) {
                            const component = gameObject.GetComponent(type);
                            if (component) {
                                const componentData = await this.extractComponentData(component, type);
                                if (componentData) {
                                    slot.components.push(componentData);
                                }
                            }
                        }
                    } catch (error) {
                        // Component might not exist
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
                }
            } catch (error) {
                console.error('Error gathering scene hierarchy:', error);
            }
            
            // Set the scene data
            this.sceneData.slots = [rootSlot];
            this.buildHierarchyMap();
            this.initializeExpandedNodes();
        }

        /**
         * Extract component data from a Unity component
         */
        async extractComponentData(component, type) {
            const componentTypeName = this.getComponentTypeName(type);
            const data = {
                id: `${Math.random()}_${componentTypeName}`,
                type: componentTypeName,
                properties: {}
            };
            
            // Extract properties based on component type
            switch (type) {
                case BS.ComponentType.Transform:
                    data.properties = {
                        position: component.position || { x: 0, y: 0, z: 0 },
                        rotation: component.rotation || { x: 0, y: 0, z: 0, w: 1 },
                        localScale: component.localScale || { x: 1, y: 1, z: 1 }
                    };
                    break;
                    
                case BS.ComponentType.BanterRigidbody:
                    data.properties = {
                        mass: component.mass || 1,
                        drag: component.drag || 0,
                        angularDrag: component.angularDrag || 0.05,
                        useGravity: component.useGravity !== false,
                        isKinematic: component.isKinematic || false
                    };
                    break;
                    
                case BS.ComponentType.BanterMaterial:
                    data.properties = {
                        shader: component.shaderName || 'Standard',
                        color: component.color || { r: 1, g: 1, b: 1, a: 1 },
                        texture: component.textureUrl || ''
                    };
                    break;
                    
                case BS.ComponentType.BanterText:
                    data.properties = {
                        text: component.text || '',
                        fontSize: component.fontSize || 14,
                        color: component.color || { r: 1, g: 1, b: 1, a: 1 },
                        alignment: component.alignment || 'Center'
                    };
                    break;
                    
                case BS.ComponentType.BoxCollider:
                    data.properties = {
                        isTrigger: component.isTrigger || false,
                        center: component.center || { x: 0, y: 0, z: 0 },
                        size: component.size || { x: 1, y: 1, z: 1 }
                    };
                    break;
                    
                case BS.ComponentType.SphereCollider:
                    data.properties = {
                        isTrigger: component.isTrigger || false,
                        radius: component.radius || 0.5
                    };
                    break;
            }
            
            return data;
        }

        /**
         * Get component type name from BS ComponentType
         */
        getComponentTypeName(type) {
            const typeMap = {
                [BS.ComponentType.Transform]: 'Transform',
                [BS.ComponentType.BanterRigidbody]: 'BanterRigidbody',
                [BS.ComponentType.BanterMaterial]: 'BanterMaterial',
                [BS.ComponentType.BanterText]: 'BanterText',
                [BS.ComponentType.BanterAudioSource]: 'BanterAudioSource',
                [BS.ComponentType.BoxCollider]: 'BoxCollider',
                [BS.ComponentType.SphereCollider]: 'SphereCollider',
                [BS.ComponentType.CapsuleCollider]: 'CapsuleCollider',
                [BS.ComponentType.MeshCollider]: 'MeshCollider'
            };
            return typeMap[type] || 'Unknown';
        }

        /**
         * Build hierarchy map for quick lookups
         */
        buildHierarchyMap() {
            this.sceneData.hierarchyMap = {};
            
            const processSlot = (slot) => {
                this.sceneData.hierarchyMap[slot.id] = slot;
                if (slot.children) {
                    slot.children.forEach(processSlot);
                }
            };
            
            this.sceneData.slots.forEach(processSlot);
        }

        /**
         * Initialize expanded nodes
         */
        initializeExpandedNodes() {
            // Expand root nodes by default
            this.sceneData.slots.forEach(slot => {
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

        async updateUnityObject(slotId, property, newValue){
            let gO = this.scene.objects[slotId]
            if (!gO) return;
            if(property == "active"){
                await gO.SetActive(Boolean(newValue));
                return;
            }
            console.log("UPDATE UNITY OBJECT", gameObject, property, newValue)
        }

        /**
         * Update Unity component with changes
         */
        async updateUnityComponent(slotId, componentType, property, newValue) {
            let gO = this.scene.objects[slotId]
            if (!gO) return;
            
            
            try {
                // Get the component
                let component = null;
                
                // Map component type string to BS.ComponentType
                const componentTypeMap = {
                    'Transform': BS.ComponentType.Transform,
                    'BanterRigidbody': BS.ComponentType.BanterRigidbody,
                    'BoxCollider': BS.ComponentType.BoxCollider,
                    'SphereCollider': BS.ComponentType.SphereCollider,
                    'BanterMaterial': BS.ComponentType.BanterMaterial,
                    'BanterText': BS.ComponentType.BanterText
                };
                
                const bsComponentType = componentTypeMap[componentType];
                if (bsComponentType) {
                    component = gO.GetComponent(bsComponentType);
                }
                
                if (!component) {
                    console.warn(`Component ${componentType} not found`);
                    return;
                }
                

                // Handle special cases for different component types
                switch (componentType) {
                    case 'Transform':
                        if (property === 'position' || property === 'localScale') {
                            component[property] = new BS.Vector3(
                                parseFloat(newValue.x),
                                parseFloat(newValue.y),
                                parseFloat(newValue.z)
                            );
                        } else if (property === 'rotation') {
                            // Rotation is stored as quaternion
                            if ('w' in newValue) {
                                // Already a quaternion
                                component[property] = new BS.Vector4(
                                    parseFloat(newValue.x),
                                    parseFloat(newValue.y),
                                    parseFloat(newValue.z),
                                    parseFloat(newValue.w)
                                );
                            } else {
                                // If somehow we get euler angles, convert to quaternion
                                console.warn('Received euler angles for rotation, expecting quaternion');
                                // For safety, just use current rotation
                            }
                        }
                        break;
                        
                    case 'BanterMaterial':
                        if (property === 'color') {
                            component.color = new BS.Vector4(
                                parseFloat(newValue.r),
                                parseFloat(newValue.g),
                                parseFloat(newValue.b),
                                parseFloat(newValue.a)
                            );
                        } else {
                            component[property] = newValue;
                        }
                        break;
                        
                    default:
                        // Direct property assignment
                        component[property] = newValue;
                        break;
                }
            } catch (error) {
                console.error('Failed to update Unity component:', error);
            }
        }

        async checkAndSyncComponentProperty(key, value){
            if(!key.startsWith("__")) return;
            let key_parts = key.split(":")
            if(key_parts.length < 2) return;

            let refs = key_parts[1].split("_")
            let path = key_parts[0].split("/")
            let property = path[path.length - 1]
            let slotId = parseInt(refs[0])
            let slot = this.getSlotById(slotId)
            if(refs.length === 1){ //is slot
                await this.updateUnityObject(slotId, property, value);
                slot[property] = value;
            }else{ //is component
                let componentType = refs[1]
                let component = slot.components.find(c => c.type === componentType)
                if(component){
                    await this.updateUnityComponent(slotId, componentType, property, value);
                    component.properties[property] = value;
                }
            }

        
        }


        /**
         * Set space property
         */
        async setSpaceProperty(key, value, isProtected) {
            if (!this.scene) return;
            console.log("[setSpaceProperty]", key, value, isProtected)
            await this.checkAndSyncComponentProperty(key, value)

            if(value.value !== undefined){
                value = value.value;
            }

            // Check if this prop corresponds to a component property
            // Update the space prop
            if (isProtected) {
                sceneManager.scene.SetProtectedSpaceProps({ [key]: value });
                sceneManager.scene.spaceState.protected[key] = value;
            } else {
                sceneManager.scene.SetPublicSpaceProps({ [key]: value });
                sceneManager.scene.spaceState.public[key] = value;
            }
            window.inspectorApp.spacePropsPanel.render();
            window.inspectorApp.propertiesPanel.render(this.selectedSlot);
            
        }



        /**
         * Get slot by ID
         */
        getSlotById(slotId) {
            return this.sceneData.hierarchyMap[slotId];
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
            if(!this.scene || !parentId || !window.BS){
                console.log("NO SCENE AVAILABLE")
                return null;
            }

            // Create Unity GameObject if connected
            const parentGameObject = this.scene.objects?.[parentId];
            if(!parentGameObject){
                console.log("NO PARENT AVAILABLE")
                return null;
            }

            try {
                // Create new GameObject
                let newSlotName = `NewSlot_${Math.floor(Math.random() * 100000)}`
                let newGameObject = new BS.GameObject(newSlotName);
                
                let makeNewSlot = ()=>{
                    return new Promise(async (resolve, reject)=>{
                        setTimeout(async ()=>{
                            let newSlotId = newGameObject.id;
                            const transform = await newGameObject.AddComponent(new BS.Transform());
                            transform.position = new BS.Vector3(0, 0, 0);
                            transform.rotation = new BS.Quaternion(0, 0, 0, 1);
                            transform.localScale = new BS.Vector3(1, 1, 1);
                            
                            // Set parent
                            await newGameObject.SetParent(parentGameObject, true);
                            
                            // Ensure it's active
                            await newGameObject.SetActive(true);
                            
                            // Store GameObject reference
                            //this.scene.objects[newSlotId] = newGameObject;

                            const newSlot = {
                                id: newSlotId,
                                name: newSlotName,
                                parentId: parentId,
                                active: true,
                                persistent: true,
                                components: [
                                    {
                                        id: `${newSlotId}_Transform`,
                                        type: 'Transform',
                                        properties: {
                                            position: { x: 0, y: 0, z: 0 },
                                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                                            localScale: { x: 1, y: 1, z: 1 }
                                        }
                                    }
                                ],
                                children: []
                            };
                            
                            const parent = this.getSlotById(parentId);
                            if (parent) {
                                parent.children.push(newSlot);
                            }
                            
                            this.buildHierarchyMap();
                            resolve(newSlot);
                        }, 100)
                    })
                }
                return await makeNewSlot()
        
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
            
            // Destroy Unity GameObjects
            if (this.scene && typeof window.BS !== 'undefined') {
                // Reverse order to delete children first
                for (let i = slotsToDelete.length - 1; i >= 0; i--) {
                    const deleteSlot = this.getSlotById(slotsToDelete[i]);
                    if (deleteSlot) {
                        try {
                            const gameObject = this.scene.objects?.[deleteSlot.id];
                            if (gameObject && gameObject.Destroy) {
                                await gameObject.Destroy();
                            }
                            delete this.scene.objects[deleteSlot.id];
                        } catch (error) {
                            console.error(`Failed to destroy GameObject ${deleteSlot.name}:`, error);
                        }
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
                this.sceneData.slots = this.sceneData.slots.filter(s => s.id !== slotId);
            }
            
            // Clear selection if this slot was selected
            if (this.selectedSlot === slotId) {
                this.selectedSlot = null;
            }
            
            this.buildHierarchyMap();
        }

        /**
         * Reparent a slot to a new parent
         */
        async reparentSlot(slotId, newParentId) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;
            
            // Cannot parent to itself
            if (slotId === newParentId) return;
            
            // Remove from current parent or root
            if (slot.parentId) {
                const oldParent = this.getSlotById(slot.parentId);
                if (oldParent && oldParent.children) {
                    oldParent.children = oldParent.children.filter(child => child.id !== slotId);
                }
            } else {
                // Remove from root
                this.sceneData.slots = this.sceneData.slots.filter(s => s.id !== slotId);
            }
            
            // Add to new parent
            const newParent = this.getSlotById(newParentId);
            if (!newParent) return;
            
            if (!newParent.children) {
                newParent.children = [];
            }
            newParent.children.push(slot);
            slot.parentId = newParentId;
            
            // Update Unity scene if connected
            if (this.scene && typeof window.BS !== 'undefined') {
                try {
                    const childGameObject = this.scene.objects?.[slotId];
                    const parentGameObject = this.scene.objects?.[newParentId];
                    
                    if (childGameObject && parentGameObject) {
                        // Set the parent in Unity
                        if (childGameObject.SetParent) {
                            await childGameObject.SetParent(parentGameObject);
                        } else if (childGameObject.transform && childGameObject.transform.SetParent) {
                            await childGameObject.transform.SetParent(parentGameObject.transform);
                        }
                    }
                } catch (error) {
                    console.error('Failed to update Unity parent:', error);
                }
            }
            
            this.buildHierarchyMap();
        }

        /**
         * Move a slot to root level (no parent)
         */
        async moveSlotToRoot(slotId) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;
            
            // Already at root
            if (!slot.parentId) return;
            
            // Remove from current parent
            const oldParent = this.getSlotById(slot.parentId);
            if (oldParent && oldParent.children) {
                oldParent.children = oldParent.children.filter(child => child.id !== slotId);
            }
            
            // Add to root
            slot.parentId = null;
            this.sceneData.slots.push(slot);
            
            // Update Unity scene if connected
            if (this.scene && typeof window.BS !== 'undefined') {
                try {
                    const gameObject = this.scene.objects?.[slotId];
                    
                    if (gameObject) {
                        // Set parent to null in Unity
                        if (gameObject.SetParent) {
                            await gameObject.SetParent(null);
                        } else if (gameObject.transform && gameObject.transform.SetParent) {
                            await gameObject.transform.SetParent(null);
                        }
                    }
                } catch (error) {
                    console.error('Failed to move to root in Unity:', error);
                }
            }
            
            this.buildHierarchyMap();
        }

        /**
         * Add component to slot
         */
        addComponentToSlot(slotId, componentType) {
            const slot = this.getSlotById(slotId);
            if (!slot) return;
            
            const componentConfig = this.getDefaultComponentConfig(componentType);
            if (!componentConfig) return;
            
            const newComponent = {
                id: `${slotId}_${componentType}_${Date.now()}`,
                type: componentType,
                properties: componentConfig.properties
            };
            
            slot.components.push(newComponent);
            return newComponent;
        }

        /**
         * Delete component from slot
         */
        async deleteComponent(slotId, componentId, componentType) {
            const slot = this.getSlotById(slotId);
            if (!slot) {
                throw new Error('Slot not found');
            }
            
            // Find and remove the component from the slot
            const componentIndex = slot.components.findIndex(c => c.id === componentId);
            if (componentIndex === -1) {
                throw new Error('Component not found');
            }
            
            // Remove from slot's components array
            slot.components.splice(componentIndex, 1);
            
            // Remove component from Unity GameObject
            if (this.scene && typeof window.BS !== 'undefined') {
                try {
                    const gameObject = this.scene.objects?.[slotId];
                    if (gameObject) {
                        // Map component type to BS.ComponentType
                        const componentTypeMap = {
                            'BanterRigidbody': BS.ComponentType.BanterRigidbody,
                            'BoxCollider': BS.ComponentType.BoxCollider,
                            'SphereCollider': BS.ComponentType.SphereCollider,
                            'CapsuleCollider': BS.ComponentType.CapsuleCollider,
                            'MeshCollider': BS.ComponentType.MeshCollider,
                            'BanterMaterial': BS.ComponentType.BanterMaterial,
                            'BanterGeometry': BS.ComponentType.BanterGeometry,
                            'BanterText': BS.ComponentType.BanterText,
                            'BanterAudioSource': BS.ComponentType.BanterAudioSource,
                            'BanterVideoPlayer': BS.ComponentType.BanterVideoPlayer,
                            'BanterBrowser': BS.ComponentType.BanterBrowser,
                            'BanterGLTF': BS.ComponentType.BanterGLTF,
                            'BanterAssetBundle': BS.ComponentType.BanterAssetBundle,
                            'BanterGrabHandle': BS.ComponentType.BanterGrabHandle,
                            'BanterSyncedObject': BS.ComponentType.BanterSyncedObject,
                            'BanterBillboard': BS.ComponentType.BanterBillboard,
                            'BanterPortal': BS.ComponentType.BanterPortal
                        };
                        
                        const bsComponentType = componentTypeMap[componentType];
                        alert("There is currently no way to remove components in BanterScript..")
                        // if (bsComponentType && gameObject.RemoveComponent) {
                        //     await gameObject.RemoveComponent(bsComponentType);
                        // }
                    }
                } catch (error) {
                    console.error('Failed to remove Unity component:', error);
                    // Continue even if Unity removal fails
                }
            }
            
            // Send OneShot event for synchronization
            if (this.scene && this.scene.OneShot) {
                const eventData = {
                    action: 'deleteComponent',
                    slotId: slotId,
                    componentId: componentId,
                    componentType: componentType,
                    slotName: slot.name
                };
                
                this.scene.OneShot('inspector:componentDeleted', eventData);
                console.log('Sent component deletion event:', eventData);
            }
            
            // Remove any space properties associated with this component
            const propsToRemove = [];
            const spaceState = this.scene?.spaceState;
            
            if (spaceState) {
                // Check both public and protected properties
                ['public', 'protected'].forEach(type => {
                    const props = spaceState[type];
                    Object.keys(props).forEach(key => {
                        // Property keys for components have format: __SlotName/ComponentType/PropertyName:ComponentId
                        if (key.includes(`:${componentId}`)) {
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
            
            console.log(`Deleted component ${componentType} from slot ${slot.name}`);
        }

        /**
         * Get default component configuration
         */
        getDefaultComponentConfig(componentType) {
            const configs = {
                'BanterRigidbody': {
                    properties: {
                        mass: 1,
                        drag: 0,
                        angularDrag: 0.05,
                        useGravity: true,
                        isKinematic: false
                    }
                },
                'BoxCollider': {
                    properties: {
                        isTrigger: false,
                        center: { x: 0, y: 0, z: 0 },
                        size: { x: 1, y: 1, z: 1 }
                    }
                },
                'SphereCollider': {
                    properties: {
                        isTrigger: false,
                        radius: 0.5
                    }
                },
                'BanterMaterial': {
                    properties: {
                        shader: 'Standard',
                        color: { r: 1, g: 1, b: 1, a: 1 },
                        texture: ''
                    }
                },
                'BanterText': {
                    properties: {
                        text: 'New Text',
                        fontSize: 14,
                        color: { r: 1, g: 1, b: 1, a: 1 },
                        alignment: 'Center'
                    }
                },
                'BanterGeometry': {
                    properties: {
                        geometryType: 'BoxGeometry',
                        width: 1,
                        height: 1,
                        depth: 1
                    }
                },
                'BanterAudioSource': {
                    properties: {
                        volume: 0.8,
                        pitch: 1,
                        loop: false,
                        playOnAwake: false,
                        spatialBlend: 1
                    }
                },
                'BanterVideoPlayer': {
                    properties: {
                        url: '',
                        volume: 1,
                        loop: true,
                        playOnAwake: true
                    }
                },
                'BanterBrowser': {
                    properties: {
                        url: 'https://example.com',
                        pixelsPerUnit: 100,
                        pageWidth: 1920,
                        pageHeight: 1080
                    }
                },
                'BanterGrabHandle': {
                    properties: {
                        grabType: 'TRIGGER',
                        grabRadius: 0.1
                    }
                },
                'BanterSyncedObject': {
                    properties: {
                        syncPosition: true,
                        syncRotation: true,
                        takeOwnershipOnGrab: true
                    }
                }
            };
            
            return configs[componentType];
        }
    }

    // Create singleton instance
    export const sceneManager = new SceneManager();
    window.SM = sceneManager
//})()