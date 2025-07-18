/**
 * Mock Data
 * Provides mock scene data for testing without Unity connection
 */

let basePath = window.location.hostname === 'localhost' ? '.' : `${window.repoUrl}/js`;
const { Slot, componentTypeMap } = await import(`${basePath}/components/index.js`);

export async function loadMockSlotData() {
    // Create mock slot data using the new Slot classes
    const slotMap = {};
    const componentMap = {};
    
    // Helper function to create components
    async function createComponents(slot, componentsData) {
        const components = [];
        for (const compData of componentsData) {
            const ComponentClass = componentTypeMap[compData.type];
            if (ComponentClass) {
                const component = await new ComponentClass().init(slot, null, compData.properties);
                component.id = compData.id; // Use mock IDs
                components.push(component);
                componentMap[component.id] = component;
            } else {
                // For components not yet implemented, create a basic object
                const component = {
                    id: compData.id,
                    type: compData.type,
                    properties: compData.properties,
                    _slot: slot,
                    update: async function(property, value) {
                        this.properties[property] = value;
                    }
                };
                components.push(component);
                componentMap[component.id] = component;
            }
        }
        return components;
    }
    
    // Helper function to create slot hierarchy
    async function createSlot(slotData, parent = null) {
        // Create the slot instance
        const slot = new Slot(slotData.id, slotData.name, parent?.id || null);
        await new SlotPropertyChange(slot.id, 'active', slotData.active).apply();
        await new SlotPropertyChange(slot.id, 'persistent', slotData.persistent).apply();
        
        // Add to slotMap
        slotMap[slot.id] = slot;
        
        // Create components
        slot.components = await createComponents(slot, slotData.components || []);
        
        // Create children recursively
        if (slotData.children && slotData.children.length > 0) {
            slot.children = [];
            for (const childData of slotData.children) {
                const childSlot = await createSlot(childData, slot);
                slot.children.push(childSlot);
            }
        }
        
        return slot;
    }
    
    // Mock data structure
    const mockData = {
        slots: [
            {
                id: 'root_1',
                name: 'World',
                parentId: null,
                active: true,
                persistent: true,
                components: [
                    {
                        id: 'root_1_Transform',
                        type: 'Transform',
                        properties: {
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                            localScale: { x: 1, y: 1, z: 1 }
                        }
                    }
                ],
                children: [
                    {
                        id: 'environment_1',
                        name: 'Environment',
                        parentId: 'root_1',
                        active: true,
                        persistent: true,
                        components: [
                            {
                                id: 'environment_1_Transform',
                                type: 'Transform',
                                properties: {
                                    position: { x: 0, y: 0, z: 0 },
                                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                                    localScale: { x: 1, y: 1, z: 1 }
                                }
                            }
                        ],
                        children: [
                            {
                                id: 'ground_1',
                                name: 'Ground',
                                parentId: 'environment_1',
                                active: true,
                                persistent: true,
                                components: [
                                    {
                                        id: 'ground_1_Transform',
                                        type: 'Transform',
                                        properties: {
                                            position: { x: 0, y: -0.5, z: 0 },
                                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                                            localScale: { x: 20, y: 1, z: 20 }
                                        }
                                    },
                                    {
                                        id: 'ground_1_BanterGeometry',
                                        type: 'BanterGeometry',
                                        properties: {
                                            geometryType: 'BoxGeometry',
                                            width: 1,
                                            height: 1,
                                            depth: 1
                                        }
                                    },
                                    {
                                        id: 'ground_1_BanterMaterial',
                                        type: 'BanterMaterial',
                                        properties: {
                                            shader: 'Standard',
                                            color: { r: 0.5, g: 0.8, b: 0.3, a: 1 },
                                            texture: ''
                                        }
                                    },
                                    {
                                        id: 'ground_1_BoxCollider',
                                        type: 'BoxCollider',
                                        properties: {
                                            isTrigger: false,
                                            center: { x: 0, y: 0, z: 0 },
                                            size: { x: 1, y: 1, z: 1 }
                                        }
                                    }
                                ],
                                children: []
                            },
                            {
                                id: 'sky_1',
                                name: 'Sky',
                                parentId: 'environment_1',
                                active: true,
                                persistent: true,
                                components: [
                                    {
                                        id: 'sky_1_Transform',
                                        type: 'Transform',
                                        properties: {
                                            position: { x: 0, y: 0, z: 0 },
                                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                                            localScale: { x: 50, y: 50, z: 50 }
                                        }
                                    },
                                    {
                                        id: 'sky_1_BanterGeometry',
                                        type: 'BanterGeometry',
                                        properties: {
                                            geometryType: 'SphereGeometry',
                                            radius: 1,
                                            widthSegments: 32,
                                            heightSegments: 16
                                        }
                                    },
                                    {
                                        id: 'sky_1_BanterMaterial',
                                        type: 'BanterMaterial',
                                        properties: {
                                            shader: 'Unlit/Diffuse',
                                            color: { r: 0.53, g: 0.81, b: 0.92, a: 1 },
                                            texture: ''
                                        }
                                    }
                                ],
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'objects_1',
                        name: 'Objects',
                        parentId: 'root_1',
                        active: true,
                        persistent: true,
                        components: [
                            {
                                id: 'objects_1_Transform',
                                type: 'Transform',
                                properties: {
                                    position: { x: 0, y: 0, z: 0 },
                                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                                    localScale: { x: 1, y: 1, z: 1 }
                                }
                            }
                        ],
                        children: [
                            {
                                id: 'cube_1',
                                name: 'Interactive Cube',
                                parentId: 'objects_1',
                                active: true,
                                persistent: false,
                                components: [
                                    {
                                        id: 'cube_1_Transform',
                                        type: 'Transform',
                                        properties: {
                                            position: { x: -2, y: 1, z: 0 },
                                            rotation: { x: 0, y: 45, z: 0, w: 0.92388 },
                                            localScale: { x: 1, y: 1, z: 1 }
                                        }
                                    },
                                    {
                                        id: 'cube_1_BanterGeometry',
                                        type: 'BanterGeometry',
                                        properties: {
                                            geometryType: 'BoxGeometry',
                                            width: 1,
                                            height: 1,
                                            depth: 1
                                        }
                                    },
                                    {
                                        id: 'cube_1_BanterMaterial',
                                        type: 'BanterMaterial',
                                        properties: {
                                            shader: 'Standard',
                                            color: { r: 1, g: 0.2, b: 0.2, a: 1 },
                                            texture: ''
                                        }
                                    },
                                    {
                                        id: 'cube_1_BanterRigidbody',
                                        type: 'BanterRigidbody',
                                        properties: {
                                            mass: 1,
                                            drag: 0,
                                            angularDrag: 0.05,
                                            useGravity: true,
                                            isKinematic: false
                                        }
                                    },
                                    {
                                        id: 'cube_1_BoxCollider',
                                        type: 'BoxCollider',
                                        properties: {
                                            isTrigger: false,
                                            center: { x: 0, y: 0, z: 0 },
                                            size: { x: 1, y: 1, z: 1 }
                                        }
                                    },
                                    {
                                        id: 'cube_1_BanterGrabHandle',
                                        type: 'BanterGrabHandle',
                                        properties: {
                                            grabType: 'TRIGGER',
                                            grabRadius: 0.1
                                        }
                                    },
                                    {
                                        id: 'cube_1_BanterSyncedObject',
                                        type: 'BanterSyncedObject',
                                        properties: {
                                            syncPosition: true,
                                            syncRotation: true,
                                            takeOwnershipOnGrab: true
                                        }
                                    }
                                ],
                                children: []
                            },
                            {
                                id: 'sphere_1',
                                name: 'Bouncy Ball',
                                parentId: 'objects_1',
                                active: true,
                                persistent: false,
                                components: [
                                    {
                                        id: 'sphere_1_Transform',
                                        type: 'Transform',
                                        properties: {
                                            position: { x: 2, y: 3, z: 0 },
                                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                                            localScale: { x: 0.5, y: 0.5, z: 0.5 }
                                        }
                                    },
                                    {
                                        id: 'sphere_1_BanterGeometry',
                                        type: 'BanterGeometry',
                                        properties: {
                                            geometryType: 'SphereGeometry',
                                            radius: 1,
                                            widthSegments: 16,
                                            heightSegments: 16
                                        }
                                    },
                                    {
                                        id: 'sphere_1_BanterMaterial',
                                        type: 'BanterMaterial',
                                        properties: {
                                            shader: 'Standard',
                                            color: { r: 0.2, g: 0.6, b: 1, a: 1 },
                                            texture: ''
                                        }
                                    },
                                    {
                                        id: 'sphere_1_BanterRigidbody',
                                        type: 'BanterRigidbody',
                                        properties: {
                                            mass: 0.5,
                                            drag: 0.1,
                                            angularDrag: 0.1,
                                            useGravity: true,
                                            isKinematic: false
                                        }
                                    },
                                    {
                                        id: 'sphere_1_SphereCollider',
                                        type: 'SphereCollider',
                                        properties: {
                                            isTrigger: false,
                                            radius: 0.5
                                        }
                                    }
                                ],
                                children: []
                            },
                            {
                                id: 'text_1',
                                name: 'Welcome Sign',
                                parentId: 'objects_1',
                                active: true,
                                persistent: true,
                                components: [
                                    {
                                        id: 'text_1_Transform',
                                        type: 'Transform',
                                        properties: {
                                            position: { x: 0, y: 2, z: -5 },
                                            rotation: { x: 0, y: 0, z: 0, w: 1 },
                                            localScale: { x: 1, y: 1, z: 1 }
                                        }
                                    },
                                    {
                                        id: 'text_1_BanterText',
                                        type: 'BanterText',
                                        properties: {
                                            text: 'Welcome to the Scene Inspector!',
                                            fontSize: 24,
                                            color: { r: 1, g: 1, b: 1, a: 1 },
                                            alignment: 'Center'
                                        }
                                    },
                                    {
                                        id: 'text_1_BanterBillboard',
                                        type: 'BanterBillboard',
                                        properties: {
                                            smoothing: 0.1,
                                            enableXAxis: false,
                                            enableYAxis: true,
                                            enableZAxis: false
                                        }
                                    }
                                ],
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'ui_1',
                        name: 'UI',
                        parentId: 'root_1',
                        active: false,
                        persistent: true,
                        components: [
                            {
                                id: 'ui_1_Transform',
                                type: 'Transform',
                                properties: {
                                    position: { x: 0, y: 0, z: 0 },
                                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                                    localScale: { x: 1, y: 1, z: 1 }
                                }
                            }
                        ],
                        children: []
                    }
                ]
            }
        ]
    };
    
    // Create root slots
    const slots = [];
    for (const rootData of mockData.slots) {
        const rootSlot = await createSlot(rootData);
        slots.push(rootSlot);
    }
    
    return {
        slots,
        slotMap,
        componentMap
    };
}

/**
 * Load mock space properties
 */
export function loadMockSpaceProps() {
    return {
        public: {
            'spaceTitle': 'My Test Space',
            'maxPlayers': 20,
            'gameMode': 'sandbox',
            'debugMode': false,
            'spawnPoint': { x: 0, y: 1, z: 0 }
        },
        protected: {
            'adminPassword': 'secret123',
            'apiKey': 'mock-api-key-12345',
            'serverConfig': {
                host: 'localhost',
                port: 3000,
                secure: false
            }
        }
    };
}