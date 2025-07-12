/**
 * Scene Manager
 * Handles Unity scene connection, state management, and data synchronization
 */

import { loadMockSceneData } from './mock-data.js';

export class SceneManager {
    constructor() {
        this.scene = null;
        this.sceneData = {
            slots: [],
            hierarchyMap: {}
        };
        this.selectedSlot = null;
        this.expandedNodes = new Set();
        this.spaceState = {
            public: {},
            protected: {}
        };
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
        const rootSlots = [];
        
        // Helper to convert GameObject to slot format
        const gameObjectToSlot = async (gameObject, parentId = null) => {
            let id = gameObject.name + "_" + Date.now() + "_" + Math.random();
            
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
                    id: `${id}_transform`,
                    type: 'Transform',
                    properties: {
                        position: transform.position || { x: 0, y: 0, z: 0 },
                        rotation: transform.rotation || { x: 0, y: 0, z: 0, w: 1 },
                        scale: transform.localScale || { x: 1, y: 1, z: 1 }
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
            
            // Process children
            if (gameObject.children && gameObject.children.length > 0) {
                for (const child of gameObject.children) {
                    const childSlot = await gameObjectToSlot(child, slot.id);
                    slot.children.push(childSlot);
                }
            }
            
            return slot;
        };
        
        // Try to find root objects in the scene
        try {
            // Common root object names to search for
            const rootNames = ['Root', 'Scene', 'World', 'Level', 'Environment', 'Main'];
            
            for (const name of rootNames) {
                try {
                    const obj = await this.scene.Find(name);
                    if (obj) {
                        const slot = await gameObjectToSlot(obj);
                        rootSlots.push(slot);
                    }
                } catch (error) {
                    // Object not found, continue
                }
            }
        } catch (error) {
            console.error('Error gathering scene hierarchy:', error);
        }
        
        // Set the scene data
        this.sceneData.slots = rootSlots;
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
                    scale: component.localScale || { x: 1, y: 1, z: 1 }
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
        
        // Initialize space state
        if (this.scene.spaceState) {
            this.spaceState = {
                public: { ...this.scene.spaceState.public },
                protected: { ...this.scene.spaceState.protected }
            };
        }
    }

    /**
     * Handle space state changes
     */
    handleSpaceStateChange(event) {
        const { changes } = event.detail;
        
        changes.forEach(change => {
            const { property, newValue, isProtected } = change;
            
            if (isProtected) {
                this.spaceState.protected[property] = newValue;
            } else {
                this.spaceState.public[property] = newValue;
            }
        });
    }

    /**
     * Update Unity component with changes
     */
    async updateUnityComponent(gameObject, change) {
        if (!gameObject) return;
        
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
            
            const bsComponentType = componentTypeMap[change.componentType];
            if (bsComponentType) {
                component = gameObject.GetComponent(bsComponentType);
            }
            
            if (!component) {
                console.warn(`Component ${change.componentType} not found`);
                return;
            }
            
            // Update the property
            const { propertyKey, newValue } = change;
            
            // Handle special cases for different component types
            switch (change.componentType) {
                case 'Transform':
                    if (propertyKey === 'position' || propertyKey === 'rotation' || propertyKey === 'scale') {
                        component[propertyKey] = new BS.Vector3(
                            parseFloat(newValue.x),
                            parseFloat(newValue.y),
                            parseFloat(newValue.z)
                        );
                    }
                    break;
                    
                case 'BanterMaterial':
                    if (propertyKey === 'color') {
                        component.color = new BS.Vector4(
                            parseFloat(newValue.r),
                            parseFloat(newValue.g),
                            parseFloat(newValue.b),
                            parseFloat(newValue.a)
                        );
                    } else {
                        component[propertyKey] = newValue;
                    }
                    break;
                    
                default:
                    // Direct property assignment
                    component[propertyKey] = newValue;
                    break;
            }
        } catch (error) {
            console.error('Failed to update Unity component:', error);
        }
    }

    /**
     * Set space property
     */
    setSpaceProperty(key, value, isProtected) {
        if (!this.scene) return;
        
        if (isProtected) {
            this.scene.SetProtectedSpaceProps({ [key]: value });
        } else {
            this.scene.SetPublicSpaceProps({ [key]: value });
        }
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
        const newSlot = {
            id: `slot_${Date.now()}_${Math.random()}`,
            name: `NewSlot_${this.getNextSlotIndex()}`,
            parentId: parentId,
            active: true,
            persistent: true,
            components: [
                {
                    id: `transform_${Date.now()}`,
                    type: 'Transform',
                    properties: {
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0, w: 1 },
                        scale: { x: 1, y: 1, z: 1 }
                    }
                }
            ],
            children: []
        };
        
        if (parentId) {
            const parent = this.getSlotById(parentId);
            if (parent) {
                parent.children.push(newSlot);
            }
        } else {
            this.sceneData.slots.push(newSlot);
        }
        
        this.buildHierarchyMap();
        return newSlot;
    }

    /**
     * Delete slot
     */
    deleteSlot(slotId) {
        const slot = this.getSlotById(slotId);
        if (!slot) return;
        
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
     * Get next slot index for naming
     */
    getNextSlotIndex() {
        let maxIndex = 0;
        const regex = /NewSlot_(\d+)/;
        
        const checkSlot = (slot) => {
            const match = slot.name.match(regex);
            if (match) {
                maxIndex = Math.max(maxIndex, parseInt(match[1]));
            }
            if (slot.children) {
                slot.children.forEach(checkSlot);
            }
        };
        
        this.sceneData.slots.forEach(checkSlot);
        return maxIndex + 1;
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