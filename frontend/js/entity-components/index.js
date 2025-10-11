const { EntityComponent } = await import(`${window.repoUrl}/entity-components/entity-component.js`);
window.updateModuleProgress("entity-component");
const { Entity } = await import(`${window.repoUrl}/entity.js`);
window.updateModuleProgress("entity");
const { TransformComponent } = await import(`${window.repoUrl}/entity-components/transform.js`);
window.updateModuleProgress("transform");
const { MonoBehaviorComponent } = await import(`${window.repoUrl}/entity-components/monobehavior.js`);
window.updateModuleProgress("monobehavior");
const { BanterGeometryComponent } = await import(`${window.repoUrl}/entity-components/meshes/geometry.js`);
window.updateModuleProgress("geometry");
const { BanterMaterialComponent } = await import(`${window.repoUrl}/entity-components/materials/material.js`);
window.updateModuleProgress("material");
const { BanterRigidbodyComponent } = await import(`${window.repoUrl}/entity-components/physics/rigidbody.js`);
window.updateModuleProgress("rigidbody");
const { BanterAudioSourceComponent } = await import(`${window.repoUrl}/entity-components/media/audio-source.js`);
window.updateModuleProgress("audio-source");
const { BanterVideoPlayerComponent } = await import(`${window.repoUrl}/entity-components/media/video-player.js`);
window.updateModuleProgress("video-player");
const { BanterTextComponent } = await import(`${window.repoUrl}/entity-components/meshes/text.js`);
window.updateModuleProgress("text");
const { BoxColliderComponent } = await import(`${window.repoUrl}/entity-components/physics/box-collider.js`);
window.updateModuleProgress("box-collider");
const { SphereColliderComponent } = await import(`${window.repoUrl}/entity-components/physics/sphere-collider.js`);
window.updateModuleProgress("sphere-collider");
const { CapsuleColliderComponent } = await import(`${window.repoUrl}/entity-components/physics/capsule-collider.js`);
window.updateModuleProgress("capsule-collider");
const { MeshColliderComponent } = await import(`${window.repoUrl}/entity-components/physics/mesh-collider.js`);
window.updateModuleProgress("mesh-collider");
const { BanterBillboardComponent } = await import(`${window.repoUrl}/entity-components/misc/billboard.js`);
window.updateModuleProgress("billboard");
const { BanterGrabHandleComponent } = await import(`${window.repoUrl}/entity-components/behaviors/grab-handle.js`);
window.updateModuleProgress("grab-handle");
const { BanterSyncedObjectComponent } = await import(`${window.repoUrl}/entity-components/behaviors/synced-object.js`);
window.updateModuleProgress("synced-object");
const { BanterPhysicMaterialComponent } = await import(`${window.repoUrl}/entity-components/materials/physic-material.js`);
window.updateModuleProgress("physic-material");
const { BanterMirrorComponent } = await import(`${window.repoUrl}/entity-components/misc/mirror.js`);
window.updateModuleProgress("mirror");
const { BanterBrowserComponent } = await import(`${window.repoUrl}/entity-components/misc/browser.js`);
window.updateModuleProgress("browser");
const { BanterHeldEventsComponent } = await import(`${window.repoUrl}/entity-components/behaviors/held-events.js`);
window.updateModuleProgress("held-events");
const { BanterAttachedObjectComponent } = await import(`${window.repoUrl}/entity-components/behaviors/attached-object.js`);
window.updateModuleProgress("attached-object");
const { BanterGLTFComponent } = await import(`${window.repoUrl}/entity-components/media/gltf.js`);
window.updateModuleProgress("gltf");
const { BanterAssetBundleComponent } = await import(`${window.repoUrl}/entity-components/misc/asset-bundle.js`);
window.updateModuleProgress("asset-bundle");
const { BanterPortalComponent } = await import(`${window.repoUrl}/entity-components/misc/portal.js`);
window.updateModuleProgress("portal");
const { BanterColliderEventsComponent } = await import(`${window.repoUrl}/entity-components/behaviors/collider-events.js`);
window.updateModuleProgress("collider-events");
const { BanterBoxComponent } = await import(`${window.repoUrl}/entity-components/meshes/box.js`);
window.updateModuleProgress("box");
const { BanterCircleComponent } = await import(`${window.repoUrl}/entity-components/meshes/circle.js`);
window.updateModuleProgress("circle");
const { BanterConeComponent } = await import(`${window.repoUrl}/entity-components/meshes/cone.js`);
window.updateModuleProgress("cone");
const { BanterCylinderComponent } = await import(`${window.repoUrl}/entity-components/meshes/cylinder.js`);
window.updateModuleProgress("cylinder");
const { BanterPlaneComponent } = await import(`${window.repoUrl}/entity-components/meshes/plane.js`);
window.updateModuleProgress("plane");
const { BanterRingComponent } = await import(`${window.repoUrl}/entity-components/meshes/ring.js`);
window.updateModuleProgress("ring");
const { BanterSphereComponent } = await import(`${window.repoUrl}/entity-components/meshes/sphere.js`);
window.updateModuleProgress("sphere");
const { BanterTorusComponent } = await import(`${window.repoUrl}/entity-components/meshes/torus.js`);
window.updateModuleProgress("torus");
const { BanterInvertedMeshComponent } = await import(`${window.repoUrl}/entity-components/meshes/inverted-mesh.js`);
window.updateModuleProgress("inverted-mesh");
const { BanterKitItemComponent } = await import(`${window.repoUrl}/entity-components/misc/kit-item.js`);
window.updateModuleProgress("kit-item");
const { BanterStreetViewComponent } = await import(`${window.repoUrl}/entity-components/misc/street-view.js`);
window.updateModuleProgress("street-view");
const { BanterWorldObjectComponent } = await import(`${window.repoUrl}/entity-components/misc/world-object.js`);
window.updateModuleProgress("world-object");
const { ConfigurableJointComponent } = await import(`${window.repoUrl}/entity-components/physics/configurable-joint.js`);
window.updateModuleProgress("configurable-joint");

export const BanterLayers = {
    Default: 0,
    TransparentFX: 1,
    IgnoreRaycast: 2,
    UserLayer1: 3,
    Water: 4,
    UI: 5,
    UserLayer2: 6,
    UserLayer3: 7,
    UserLayer4: 8,
    UserLayer5: 9,
    UserLayer6: 10,
    UserLayer7: 11,
    UserLayer8: 12,
    UserLayer9: 13,
    UserLayer10: 14,
    UserLayer11: 15,
    UserLayer12: 16,
    NetworkPlayer: 17,
    RPMAvatarHead: 18,
    RPMAvatarBody: 19,
    Grabbable: 20,
    HandColliders: 21,
    WalkingLegs: 22,
    PhysicsPlayer: 23,
 }

export const SUPPORTED_COMPONENTS = new Set([
    BS.ComponentType.Transform,
    BS.ComponentType.BanterGeometry,
    BS.ComponentType.BanterMaterial,
    BS.ComponentType.BanterRigidbody,
    BS.ComponentType.BanterAudioSource,
    BS.ComponentType.BanterVideoPlayer,
    BS.ComponentType.BanterText,
    BS.ComponentType.BoxCollider,
    BS.ComponentType.SphereCollider,
    BS.ComponentType.CapsuleCollider,
    BS.ComponentType.MeshCollider,
    BS.ComponentType.BanterBillboard,
    BS.ComponentType.BanterGrabHandle,
    BS.ComponentType.BanterSyncedObject,
    BS.ComponentType.BanterPhysicMaterial,
    BS.ComponentType.BanterMirror,
    BS.ComponentType.BanterBrowser,
    BS.ComponentType.BanterHeldEvents,
    BS.ComponentType.BanterAttachedObject,
    BS.ComponentType.BanterGLTF,
    BS.ComponentType.BanterAssetBundle,
    BS.ComponentType.BanterPortal,
    BS.ComponentType.BanterColliderEvents,
    BS.ComponentType.BanterBox,
    BS.ComponentType.BanterCircle,
    BS.ComponentType.BanterCone,
    BS.ComponentType.BanterCylinder,
    BS.ComponentType.BanterPlane,
    BS.ComponentType.BanterRing,
    BS.ComponentType.BanterSphere,
    BS.ComponentType.BanterTorus,
    BS.ComponentType.BanterInvertedMesh,
    BS.ComponentType.BanterKitItem,
    BS.ComponentType.BanterStreetView,
    BS.ComponentType.BanterWorldObject,
    BS.ComponentType.ConfigurableJoint
]);

export const componentTypeMap = {
    "Transform": TransformComponent,
    "BanterGeometry": BanterGeometryComponent,
    "BanterMaterial": BanterMaterialComponent,
    "BanterRigidbody": BanterRigidbodyComponent,
    "BanterAudioSource": BanterAudioSourceComponent,
    "BanterVideoPlayer": BanterVideoPlayerComponent,
    "BanterText": BanterTextComponent,
    "BoxCollider": BoxColliderComponent,
    "SphereCollider": SphereColliderComponent,
    "CapsuleCollider": CapsuleColliderComponent,
    "MeshCollider": MeshColliderComponent,
    "BanterBillboard": BanterBillboardComponent,
    "BanterGrabHandle": BanterGrabHandleComponent,
    "BanterSyncedObject": BanterSyncedObjectComponent,
    "BanterPhysicMaterial": BanterPhysicMaterialComponent,
    "BanterMirror": BanterMirrorComponent,
    "BanterBrowser": BanterBrowserComponent,
    "BanterHeldEvents": BanterHeldEventsComponent,
    "BanterAttachedObject": BanterAttachedObjectComponent,
    "BanterGLTF": BanterGLTFComponent,
    "BanterAssetBundle": BanterAssetBundleComponent,
    "BanterPortal": BanterPortalComponent,
    "BanterColliderEvents": BanterColliderEventsComponent,
    "BanterBox": BanterBoxComponent,
    "BanterCircle": BanterCircleComponent,
    "BanterCone": BanterConeComponent,
    "BanterCylinder": BanterCylinderComponent,
    "BanterPlane": BanterPlaneComponent,
    "BanterRing": BanterRingComponent,
    "BanterSphere": BanterSphereComponent,
    "BanterTorus": BanterTorusComponent,
    "BanterInvertedMesh": BanterInvertedMeshComponent,
    "BanterKitItem": BanterKitItemComponent,
    "BanterStreetView": BanterStreetViewComponent,
    "BanterWorldObject": BanterWorldObjectComponent,
    "ConfigurableJoint": ConfigurableJointComponent,
    "MonoBehavior": MonoBehaviorComponent
}

export const componentBSTypeMap = {
    [BS.ComponentType.Transform]: TransformComponent,
    [BS.ComponentType.BanterGeometry]: BanterGeometryComponent,
    [BS.ComponentType.BanterMaterial]: BanterMaterialComponent,
    [BS.ComponentType.BanterRigidbody]: BanterRigidbodyComponent,
    [BS.ComponentType.BanterAudioSource]: BanterAudioSourceComponent,
    [BS.ComponentType.BanterVideoPlayer]: BanterVideoPlayerComponent,
    [BS.ComponentType.BanterText]: BanterTextComponent,
    [BS.ComponentType.BoxCollider]: BoxColliderComponent,
    [BS.ComponentType.SphereCollider]: SphereColliderComponent,
    [BS.ComponentType.CapsuleCollider]: CapsuleColliderComponent,
    [BS.ComponentType.MeshCollider]: MeshColliderComponent,
    [BS.ComponentType.BanterBillboard]: BanterBillboardComponent,
    [BS.ComponentType.BanterGrabHandle]: BanterGrabHandleComponent,
    [BS.ComponentType.BanterSyncedObject]: BanterSyncedObjectComponent,
    [BS.ComponentType.BanterPhysicMaterial]: BanterPhysicMaterialComponent,
    [BS.ComponentType.BanterMirror]: BanterMirrorComponent,
    [BS.ComponentType.BanterBrowser]: BanterBrowserComponent,
    [BS.ComponentType.BanterHeldEvents]: BanterHeldEventsComponent,
    [BS.ComponentType.BanterAttachedObject]: BanterAttachedObjectComponent,
    [BS.ComponentType.BanterGLTF]: BanterGLTFComponent,
    [BS.ComponentType.BanterAssetBundle]: BanterAssetBundleComponent,
    [BS.ComponentType.BanterPortal]: BanterPortalComponent,
    [BS.ComponentType.BanterColliderEvents]: BanterColliderEventsComponent,
    [BS.ComponentType.BanterBox]: BanterBoxComponent,
    [BS.ComponentType.BanterCircle]: BanterCircleComponent,
    [BS.ComponentType.BanterCone]: BanterConeComponent,
    [BS.ComponentType.BanterCylinder]: BanterCylinderComponent,
    [BS.ComponentType.BanterPlane]: BanterPlaneComponent,
    [BS.ComponentType.BanterRing]: BanterRingComponent,
    [BS.ComponentType.BanterSphere]: BanterSphereComponent,
    [BS.ComponentType.BanterTorus]: BanterTorusComponent,
    [BS.ComponentType.BanterInvertedMesh]: BanterInvertedMeshComponent,
    [BS.ComponentType.BanterKitItem]: BanterKitItemComponent,
    [BS.ComponentType.BanterStreetView]: BanterStreetViewComponent,
    [BS.ComponentType.BanterWorldObject]: BanterWorldObjectComponent,
    [BS.ComponentType.ConfigurableJoint]: ConfigurableJointComponent,
    [MonoBehaviorComponent]: MonoBehaviorComponent
}

export const componentTextMap = {
    [BS.ComponentType.Transform]: "Transform",
    [BS.ComponentType.BanterGeometry]: "BanterGeometry",
    [BS.ComponentType.BanterMaterial]: "BanterMaterial",
    [BS.ComponentType.BanterRigidbody]: "BanterRigidbody",
    [BS.ComponentType.BanterAudioSource]: "BanterAudioSource",
    [BS.ComponentType.BanterVideoPlayer]: "BanterVideoPlayer",
    [BS.ComponentType.BanterText]: "BanterText",
    [BS.ComponentType.BoxCollider]: "BoxCollider",
    [BS.ComponentType.SphereCollider]: "SphereCollider",
    [BS.ComponentType.CapsuleCollider]: "CapsuleCollider",
    [BS.ComponentType.MeshCollider]: "MeshCollider",
    [BS.ComponentType.BanterBillboard]: "BanterBillboard",
    [BS.ComponentType.BanterGrabHandle]: "BanterGrabHandle",
    [BS.ComponentType.BanterSyncedObject]: "BanterSyncedObject",
    [BS.ComponentType.BanterPhysicMaterial]: "BanterPhysicMaterial",
    [BS.ComponentType.BanterMirror]: "BanterMirror",
    [BS.ComponentType.BanterBrowser]: "BanterBrowser",
    [BS.ComponentType.BanterHeldEvents]: "BanterHeldEvents",
    [BS.ComponentType.BanterAttachedObject]: "BanterAttachedObject",
    [BS.ComponentType.BanterGLTF]: "BanterGLTF",
    [BS.ComponentType.BanterAssetBundle]: "BanterAssetBundle",
    [BS.ComponentType.BanterPortal]: "BanterPortal",
    [BS.ComponentType.BanterColliderEvents]: "BanterColliderEvents",
    [BS.ComponentType.BanterBox]: "BanterBox",
    [BS.ComponentType.BanterCircle]: "BanterCircle",
    [BS.ComponentType.BanterCone]: "BanterCone",
    [BS.ComponentType.BanterCylinder]: "BanterCylinder",
    [BS.ComponentType.BanterPlane]: "BanterPlane",
    [BS.ComponentType.BanterRing]: "BanterRing",
    [BS.ComponentType.BanterSphere]: "BanterSphere",
    [BS.ComponentType.BanterTorus]: "BanterTorus",
    [BS.ComponentType.BanterInvertedMesh]: "BanterInvertedMesh",
    [BS.ComponentType.BanterKitItem]: "BanterKitItem",
    [BS.ComponentType.BanterStreetView]: "BanterStreetView",
    [BS.ComponentType.BanterWorldObject]: "BanterWorldObject",
    [BS.ComponentType.ConfigurableJoint]: "ConfigurableJoint",
    [MonoBehaviorComponent]: "MonoBehavior"
}


export const componentBundleMap = {
    "BanterGeometry": ['BanterMaterial'],
    "BoxCollider": ['BanterColliderEvents'],
    "SphereCollider": ['BanterColliderEvents'],
    "CapsuleCollider": ['BanterColliderEvents'],
    "MeshCollider": ['BanterColliderEvents'],
    "BanterBox": ['BanterMaterial'],
    "BanterCylinder": ['BanterMaterial'],
    // "BanterCircle": ['BanterMaterial'],
    // "BanterCone": ['BanterMaterial'],
    // "BanterPlane": ['BanterMaterial'],
    // "BanterRing": ['BanterMaterial'],
    // "BanterSphere": ['BanterMaterial'],
    // "BanterTorus": ['BanterMaterial']
}


// Legacy global exports (kept for backwards compatibility)
window.componentBSTypeMap = componentBSTypeMap;
window.componentTextMap = componentTextMap;

// ============================================================================
// EXPOSE COMPONENT REGISTRY FOR RUNTIME INSPECTION
// ============================================================================

/**
 * Global registry of all Component types and metadata for runtime inspection and debugging.
 * Accessible via window.ComponentRegistry in the browser console.
 *
 * Usage:
 *   - List all components: ComponentRegistry.list()
 *   - Get component by name: ComponentRegistry.getByName('BanterBox')
 *   - Get components by category: ComponentRegistry.getByCategory('meshes')
 *   - Check layer definitions: ComponentRegistry.layers
 */
window.ComponentRegistry = {
    // All component class constructors
    classes: {
        Entity,
        EntityComponent,
        TransformComponent,
        MonoBehaviorComponent,
        // Meshes/Geometry
        BanterGeometryComponent,
        BanterBoxComponent,
        BanterCircleComponent,
        BanterConeComponent,
        BanterCylinderComponent,
        BanterPlaneComponent,
        BanterRingComponent,
        BanterSphereComponent,
        BanterTorusComponent,
        BanterInvertedMeshComponent,
        BanterTextComponent,
        // Materials
        BanterMaterialComponent,
        BanterPhysicMaterialComponent,
        // Physics
        BanterRigidbodyComponent,
        BoxColliderComponent,
        SphereColliderComponent,
        CapsuleColliderComponent,
        MeshColliderComponent,
        ConfigurableJointComponent,
        // Media
        BanterAudioSourceComponent,
        BanterVideoPlayerComponent,
        BanterGLTFComponent,
        // Behaviors
        BanterGrabHandleComponent,
        BanterSyncedObjectComponent,
        BanterHeldEventsComponent,
        BanterAttachedObjectComponent,
        BanterColliderEventsComponent,
        // Misc
        BanterBillboardComponent,
        BanterMirrorComponent,
        BanterBrowserComponent,
        BanterAssetBundleComponent,
        BanterPortalComponent,
        BanterKitItemComponent,
        BanterStreetViewComponent,
        BanterWorldObjectComponent
    },

    // Component metadata organized by category
    metadata: {
        // Core
        Entity: { category: 'core', description: 'Entity/GameObject class', icon: '📦' },
        EntityComponent: { category: 'core', description: 'Base component class', icon: '🧩' },
        TransformComponent: { category: 'core', description: 'Position, rotation, scale', icon: '📐' },
        MonoBehaviorComponent: { category: 'scripting', description: 'Script execution component', icon: '📜' },

        // Meshes/Geometry
        BanterGeometryComponent: { category: 'meshes', description: 'Generic geometry component', icon: '🔷' },
        BanterBoxComponent: { category: 'meshes', description: 'Box/cube primitive', icon: '◼️' },
        BanterCircleComponent: { category: 'meshes', description: 'Circle primitive', icon: '⭕' },
        BanterConeComponent: { category: 'meshes', description: 'Cone primitive', icon: '🔺' },
        BanterCylinderComponent: { category: 'meshes', description: 'Cylinder primitive', icon: '🥫' },
        BanterPlaneComponent: { category: 'meshes', description: 'Flat plane primitive', icon: '▬' },
        BanterRingComponent: { category: 'meshes', description: 'Ring/torus primitive', icon: '⭕' },
        BanterSphereComponent: { category: 'meshes', description: 'Sphere primitive', icon: '⚪' },
        BanterTorusComponent: { category: 'meshes', description: 'Torus/donut primitive', icon: '🍩' },
        BanterInvertedMeshComponent: { category: 'meshes', description: 'Inverted mesh (inside-out)', icon: '🔄' },
        BanterTextComponent: { category: 'meshes', description: '3D text mesh', icon: '📝' },

        // Materials
        BanterMaterialComponent: { category: 'materials', description: 'Material properties (color, texture)', icon: '🎨' },
        BanterPhysicMaterialComponent: { category: 'materials', description: 'Physics material (friction, bounce)', icon: '⚙️' },

        // Physics
        BanterRigidbodyComponent: { category: 'physics', description: 'Physics simulation', icon: '💫' },
        BoxColliderComponent: { category: 'physics', description: 'Box collision shape', icon: '📦' },
        SphereColliderComponent: { category: 'physics', description: 'Sphere collision shape', icon: '⚪' },
        CapsuleColliderComponent: { category: 'physics', description: 'Capsule collision shape', icon: '💊' },
        MeshColliderComponent: { category: 'physics', description: 'Mesh-based collision', icon: '🔷' },
        ConfigurableJointComponent: { category: 'physics', description: 'Configurable physics joint', icon: '🔗' },

        // Media
        BanterAudioSourceComponent: { category: 'media', description: 'Audio playback', icon: '🔊' },
        BanterVideoPlayerComponent: { category: 'media', description: 'Video playback', icon: '📹' },
        BanterGLTFComponent: { category: 'media', description: 'GLTF 3D model loader', icon: '🎭' },

        // Behaviors
        BanterGrabHandleComponent: { category: 'behaviors', description: 'Grabbable object', icon: '✋' },
        BanterSyncedObjectComponent: { category: 'behaviors', description: 'Multi-user synchronization', icon: '🔄' },
        BanterHeldEventsComponent: { category: 'behaviors', description: 'Events when object is held', icon: '🤝' },
        BanterAttachedObjectComponent: { category: 'behaviors', description: 'Attach to player or object', icon: '📌' },
        BanterColliderEventsComponent: { category: 'behaviors', description: 'Collision/trigger events', icon: '💥' },

        // Misc
        BanterBillboardComponent: { category: 'misc', description: 'Always face camera', icon: '👁️' },
        BanterMirrorComponent: { category: 'misc', description: 'Reflective mirror surface', icon: '🪞' },
        BanterBrowserComponent: { category: 'misc', description: 'Embedded web browser', icon: '🌐' },
        BanterAssetBundleComponent: { category: 'misc', description: 'Load Unity asset bundles', icon: '📦' },
        BanterPortalComponent: { category: 'misc', description: 'Portal to another space', icon: '🚪' },
        BanterKitItemComponent: { category: 'misc', description: 'Kit item reference', icon: '🎁' },
        BanterStreetViewComponent: { category: 'misc', description: 'Google Street View integration', icon: '🗺️' },
        BanterWorldObjectComponent: { category: 'misc', description: 'World object reference', icon: '🌍' }
    },

    // Unity layer definitions
    layers: BanterLayers,

    // Component type mappings (for compatibility)
    typeMap: componentTypeMap,
    bsTypeMap: componentBSTypeMap,
    textMap: componentTextMap,
    bundleMap: componentBundleMap,
    supportedComponents: SUPPORTED_COMPONENTS,

    // Helper methods for runtime inspection

    /**
     * Get component class by name
     * @param {string} name - Component name (e.g., 'BanterBox')
     * @returns {Function|null} Component class constructor
     */
    getByName(name) {
        return this.classes[name] || this.typeMap[name] || null;
    },

    /**
     * Get all components in a category
     * @param {string} category - Category name (core, meshes, materials, physics, media, behaviors, misc, scripting)
     * @returns {Array<string>} Array of component names
     */
    getByCategory(category) {
        return Object.entries(this.metadata)
            .filter(([_, meta]) => meta.category === category)
            .map(([name, _]) => name);
    },

    /**
     * Get all categories
     * @returns {Array<string>} Array of unique category names
     */
    getCategories() {
        return [...new Set(Object.values(this.metadata).map(meta => meta.category))];
    },

    /**
     * Get metadata for a specific component
     * @param {string} name - Component name
     * @returns {Object|null} Metadata object
     */
    getInfo(name) {
        return this.metadata[name] || null;
    },

    /**
     * List all components with their metadata
     * @returns {Array<Object>} Array of {name, category, description, icon} objects
     */
    list() {
        return Object.entries(this.metadata).map(([name, meta]) => ({
            name,
            category: meta.category,
            description: meta.description,
            icon: meta.icon
        }));
    },

    /**
     * Get statistics about components
     * @returns {Object} Statistics object
     */
    getStats() {
        const categories = this.getCategories();
        const stats = {
            total: Object.keys(this.classes).length,
            byCategory: {},
            layers: Object.keys(this.layers).length
        };

        categories.forEach(cat => {
            stats.byCategory[cat] = this.getByCategory(cat).length;
        });

        return stats;
    },

    /**
     * Check if a component is supported
     * @param {string|number} componentType - Component type (string name or BS.ComponentType enum)
     * @returns {boolean} True if supported
     */
    isSupported(componentType) {
        if (typeof componentType === 'string') {
            // Convert string name to BS.ComponentType
            const bsType = Object.keys(this.textMap).find(key =>
                this.textMap[key] === componentType
            );
            return this.supportedComponents.has(parseInt(bsType));
        }
        return this.supportedComponents.has(componentType);
    },

    /**
     * Get layer name by layer number
     * @param {number} layerNum - Layer number (0-23)
     * @returns {string|null} Layer name
     */
    getLayerName(layerNum) {
        return Object.keys(this.layers).find(name =>
            this.layers[name] === layerNum
        ) || null;
    },

    /**
     * Get layer number by layer name
     * @param {string} layerName - Layer name
     * @returns {number|null} Layer number
     */
    getLayerNumber(layerName) {
        return this.layers[layerName] ?? null;
    },

    /**
     * Get components that this component auto-includes (bundles)
     * @param {string} componentName - Component name
     * @returns {Array<string>} Array of bundled component names
     */
    getBundledComponents(componentName) {
        return this.bundleMap[componentName] || [];
    }
};

// Log availability for debugging
console.log('[ComponentRegistry] Exposed globally with', Object.keys(window.ComponentRegistry.classes).length, 'component types');
console.log('[ComponentRegistry] Usage: ComponentRegistry.list() or ComponentRegistry.getByCategory("meshes")');
console.log('[ComponentRegistry] Categories:', window.ComponentRegistry.getCategories().join(', '));

export {
    Entity,
    EntityComponent,
    TransformComponent,
    BanterGeometryComponent,
    BanterMaterialComponent,
    BanterRigidbodyComponent,
    BanterAudioSourceComponent,
    BanterVideoPlayerComponent,
    BanterTextComponent,
    BoxColliderComponent,
    SphereColliderComponent,
    CapsuleColliderComponent,
    MeshColliderComponent,
    BanterBillboardComponent,
    BanterGrabHandleComponent,
    BanterSyncedObjectComponent,
    BanterPhysicMaterialComponent,
    BanterMirrorComponent,
    BanterBrowserComponent,
    BanterHeldEventsComponent,
    BanterAttachedObjectComponent,
    BanterGLTFComponent,
    BanterAssetBundleComponent,
    BanterPortalComponent,
    BanterColliderEventsComponent,
    BanterBoxComponent,
    BanterCircleComponent,
    BanterConeComponent,
    BanterCylinderComponent,
    BanterPlaneComponent,
    BanterRingComponent,
    BanterSphereComponent,
    BanterTorusComponent,
    BanterInvertedMeshComponent,
    BanterKitItemComponent,
    BanterStreetViewComponent,
    BanterWorldObjectComponent,
    ConfigurableJointComponent,
    MonoBehaviorComponent
};
