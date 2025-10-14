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
const { CharacterJointComponent } = await import(`${window.repoUrl}/entity-components/physics/character-joint.js`);
window.updateModuleProgress("character-joint");
const { FixedJointComponent } = await import(`${window.repoUrl}/entity-components/physics/fixed-joint.js`);
window.updateModuleProgress("fixed-joint");
const { HingeJointComponent } = await import(`${window.repoUrl}/entity-components/physics/hinge-joint.js`);
window.updateModuleProgress("hinge-joint");
const { SpringJointComponent } = await import(`${window.repoUrl}/entity-components/physics/spring-joint.js`);
window.updateModuleProgress("spring-joint");
const { BanterGrabbableComponent } = await import(`${window.repoUrl}/entity-components/behaviors/grabbable.js`);
window.updateModuleProgress("grabbable");
const { BanterUIPanelComponent } = await import(`${window.repoUrl}/entity-components/misc/ui-panel.js`);
window.updateModuleProgress("ui-panel");
const { BanterAvatarPedestalComponent } = await import(`${window.repoUrl}/entity-components/misc/avatar-pedestal.js`);
window.updateModuleProgress("avatar-pedestal");
const { BanterTorusKnotComponent } = await import(`${window.repoUrl}/entity-components/meshes/torus-knot.js`);
window.updateModuleProgress("torus-knot");
const { BanterAppleComponent } = await import(`${window.repoUrl}/entity-components/meshes/apple.js`);
window.updateModuleProgress("apple");
const { BanterCatenoidComponent } = await import(`${window.repoUrl}/entity-components/meshes/catenoid.js`);
window.updateModuleProgress("catenoid");
const { BanterFermetComponent } = await import(`${window.repoUrl}/entity-components/meshes/fermet.js`);
window.updateModuleProgress("fermet");
const { BanterHelicoidComponent } = await import(`${window.repoUrl}/entity-components/meshes/helicoid.js`);
window.updateModuleProgress("helicoid");
const { BanterHornComponent } = await import(`${window.repoUrl}/entity-components/meshes/horn.js`);
window.updateModuleProgress("horn");
const { BanterKleinComponent } = await import(`${window.repoUrl}/entity-components/meshes/klein.js`);
window.updateModuleProgress("klein");
const { BanterMobiusComponent } = await import(`${window.repoUrl}/entity-components/meshes/mobius.js`);
window.updateModuleProgress("mobius");
const { BanterMobius3dComponent } = await import(`${window.repoUrl}/entity-components/meshes/mobius3d.js`);
window.updateModuleProgress("mobius3d");
const { BanterNaticaComponent } = await import(`${window.repoUrl}/entity-components/meshes/natica.js`);
window.updateModuleProgress("natica");
const { BanterPillowComponent } = await import(`${window.repoUrl}/entity-components/meshes/pillow.js`);
window.updateModuleProgress("pillow");
const { BanterScherkComponent } = await import(`${window.repoUrl}/entity-components/meshes/scherk.js`);
window.updateModuleProgress("scherk");
const { BanterSnailComponent } = await import(`${window.repoUrl}/entity-components/meshes/snail.js`);
window.updateModuleProgress("snail");
const { BanterSpiralComponent } = await import(`${window.repoUrl}/entity-components/meshes/spiral.js`);
window.updateModuleProgress("spiral");
const { BanterSpringComponent } = await import(`${window.repoUrl}/entity-components/meshes/spring.js`);
window.updateModuleProgress("spring");

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
    BS.ComponentType.ConfigurableJoint,
    BS.ComponentType.CharacterJoint,
    BS.ComponentType.FixedJoint,
    BS.ComponentType.HingeJoint,
    BS.ComponentType.SpringJoint,
    BS.ComponentType.BanterGrabbable,
    BS.ComponentType.BanterUIPanel,
    BS.ComponentType.BanterAvatarPedestal,
    BS.ComponentType.BanterTorusKnot,
    BS.ComponentType.BanterApple,
    BS.ComponentType.BanterCatenoid,
    BS.ComponentType.BanterFermet,
    BS.ComponentType.BanterHelicoid,
    BS.ComponentType.BanterHorn,
    BS.ComponentType.BanterKlein,
    BS.ComponentType.BanterMobius,
    BS.ComponentType.BanterMobius3d,
    BS.ComponentType.BanterNatica,
    BS.ComponentType.BanterPillow,
    BS.ComponentType.BanterScherk,
    BS.ComponentType.BanterSnail,
    BS.ComponentType.BanterSpiral,
    BS.ComponentType.BanterSpring
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
    "CharacterJoint": CharacterJointComponent,
    "FixedJoint": FixedJointComponent,
    "HingeJoint": HingeJointComponent,
    "SpringJoint": SpringJointComponent,
    "BanterGrabbable": BanterGrabbableComponent,
    "BanterUIPanel": BanterUIPanelComponent,
    "BanterAvatarPedestal": BanterAvatarPedestalComponent,
    "BanterTorusKnot": BanterTorusKnotComponent,
    "BanterApple": BanterAppleComponent,
    "BanterCatenoid": BanterCatenoidComponent,
    "BanterFermet": BanterFermetComponent,
    "BanterHelicoid": BanterHelicoidComponent,
    "BanterHorn": BanterHornComponent,
    "BanterKlein": BanterKleinComponent,
    "BanterMobius": BanterMobiusComponent,
    "BanterMobius3d": BanterMobius3dComponent,
    "BanterNatica": BanterNaticaComponent,
    "BanterPillow": BanterPillowComponent,
    "BanterScherk": BanterScherkComponent,
    "BanterSnail": BanterSnailComponent,
    "BanterSpiral": BanterSpiralComponent,
    "BanterSpring": BanterSpringComponent,
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
    [BS.ComponentType.CharacterJoint]: CharacterJointComponent,
    [BS.ComponentType.FixedJoint]: FixedJointComponent,
    [BS.ComponentType.HingeJoint]: HingeJointComponent,
    [BS.ComponentType.SpringJoint]: SpringJointComponent,
    [BS.ComponentType.BanterGrabbable]: BanterGrabbableComponent,
    [BS.ComponentType.BanterUIPanel]: BanterUIPanelComponent,
    [BS.ComponentType.BanterAvatarPedestal]: BanterAvatarPedestalComponent,
    [BS.ComponentType.BanterTorusKnot]: BanterTorusKnotComponent,
    [BS.ComponentType.BanterApple]: BanterAppleComponent,
    [BS.ComponentType.BanterCatenoid]: BanterCatenoidComponent,
    [BS.ComponentType.BanterFermet]: BanterFermetComponent,
    [BS.ComponentType.BanterHelicoid]: BanterHelicoidComponent,
    [BS.ComponentType.BanterHorn]: BanterHornComponent,
    [BS.ComponentType.BanterKlein]: BanterKleinComponent,
    [BS.ComponentType.BanterMobius]: BanterMobiusComponent,
    [BS.ComponentType.BanterMobius3d]: BanterMobius3dComponent,
    [BS.ComponentType.BanterNatica]: BanterNaticaComponent,
    [BS.ComponentType.BanterPillow]: BanterPillowComponent,
    [BS.ComponentType.BanterScherk]: BanterScherkComponent,
    [BS.ComponentType.BanterSnail]: BanterSnailComponent,
    [BS.ComponentType.BanterSpiral]: BanterSpiralComponent,
    [BS.ComponentType.BanterSpring]: BanterSpringComponent,
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
    [BS.ComponentType.CharacterJoint]: "CharacterJoint",
    [BS.ComponentType.FixedJoint]: "FixedJoint",
    [BS.ComponentType.HingeJoint]: "HingeJoint",
    [BS.ComponentType.SpringJoint]: "SpringJoint",
    [BS.ComponentType.BanterGrabbable]: "BanterGrabbable",
    [BS.ComponentType.BanterUIPanel]: "BanterUIPanel",
    [BS.ComponentType.BanterAvatarPedestal]: "BanterAvatarPedestal",
    [BS.ComponentType.BanterTorusKnot]: "BanterTorusKnot",
    [BS.ComponentType.BanterApple]: "BanterApple",
    [BS.ComponentType.BanterCatenoid]: "BanterCatenoid",
    [BS.ComponentType.BanterFermet]: "BanterFermet",
    [BS.ComponentType.BanterHelicoid]: "BanterHelicoid",
    [BS.ComponentType.BanterHorn]: "BanterHorn",
    [BS.ComponentType.BanterKlein]: "BanterKlein",
    [BS.ComponentType.BanterMobius]: "BanterMobius",
    [BS.ComponentType.BanterMobius3d]: "BanterMobius3d",
    [BS.ComponentType.BanterNatica]: "BanterNatica",
    [BS.ComponentType.BanterPillow]: "BanterPillow",
    [BS.ComponentType.BanterScherk]: "BanterScherk",
    [BS.ComponentType.BanterSnail]: "BanterSnail",
    [BS.ComponentType.BanterSpiral]: "BanterSpiral",
    [BS.ComponentType.BanterSpring]: "BanterSpring",
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
        BanterTorusKnotComponent,
        BanterInvertedMeshComponent,
        BanterTextComponent,
        BanterAppleComponent,
        BanterCatenoidComponent,
        BanterFermetComponent,
        BanterHelicoidComponent,
        BanterHornComponent,
        BanterKleinComponent,
        BanterMobiusComponent,
        BanterMobius3dComponent,
        BanterNaticaComponent,
        BanterPillowComponent,
        BanterScherkComponent,
        BanterSnailComponent,
        BanterSpiralComponent,
        BanterSpringComponent,
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
        CharacterJointComponent,
        FixedJointComponent,
        HingeJointComponent,
        SpringJointComponent,
        // Media
        BanterAudioSourceComponent,
        BanterVideoPlayerComponent,
        BanterGLTFComponent,
        // Behaviors
        BanterGrabHandleComponent,
        BanterGrabbableComponent,
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
        BanterWorldObjectComponent,
        BanterUIPanelComponent,
        BanterAvatarPedestalComponent
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
        BanterTorusKnotComponent: { category: 'meshes', description: 'Torus knot geometry', icon: '🍩' },
        BanterInvertedMeshComponent: { category: 'meshes', description: 'Inverted mesh (inside-out)', icon: '🔄' },
        BanterTextComponent: { category: 'meshes', description: '3D text mesh', icon: '📝' },
        BanterAppleComponent: { category: 'meshes', description: 'Apple parametric surface', icon: '🍎' },
        BanterCatenoidComponent: { category: 'meshes', description: 'Catenoid minimal surface', icon: '🌀' },
        BanterFermetComponent: { category: 'meshes', description: 'Fermat spiral surface', icon: '🌀' },
        BanterHelicoidComponent: { category: 'meshes', description: 'Helicoid minimal surface', icon: '🌀' },
        BanterHornComponent: { category: 'meshes', description: 'Horn/trumpet surface', icon: '📯' },
        BanterKleinComponent: { category: 'meshes', description: 'Klein bottle surface', icon: '🌀' },
        BanterMobiusComponent: { category: 'meshes', description: 'Möbius strip', icon: '♾️' },
        BanterMobius3dComponent: { category: 'meshes', description: '3D Möbius surface', icon: '♾️' },
        BanterNaticaComponent: { category: 'meshes', description: 'Seashell-like surface', icon: '🐚' },
        BanterPillowComponent: { category: 'meshes', description: 'Pillow-shaped surface', icon: '🛏️' },
        BanterScherkComponent: { category: 'meshes', description: 'Scherk minimal surface', icon: '🌀' },
        BanterSnailComponent: { category: 'meshes', description: 'Snail shell surface', icon: '🐌' },
        BanterSpiralComponent: { category: 'meshes', description: 'Spiral surface', icon: '🌀' },
        BanterSpringComponent: { category: 'meshes', description: 'Spring/helix surface', icon: '🔩' },

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
        CharacterJointComponent: { category: 'physics', description: 'Character ragdoll joint', icon: '🦴' },
        FixedJointComponent: { category: 'physics', description: 'Fixed connection between rigidbodies', icon: '🔗' },
        HingeJointComponent: { category: 'physics', description: 'Rotational joint around axis', icon: '🚪' },
        SpringJointComponent: { category: 'physics', description: 'Elastic spring connection', icon: '🪃' },

        // Media
        BanterAudioSourceComponent: { category: 'media', description: 'Audio playback', icon: '🔊' },
        BanterVideoPlayerComponent: { category: 'media', description: 'Video playback', icon: '📹' },
        BanterGLTFComponent: { category: 'media', description: 'GLTF 3D model loader', icon: '🎭' },

        // Behaviors
        BanterGrabHandleComponent: { category: 'behaviors', description: 'Grabbable object', icon: '✋' },
        BanterGrabbableComponent: { category: 'behaviors', description: 'Advanced grab mechanics with VR controller integration', icon: '🤲' },
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
        BanterWorldObjectComponent: { category: 'misc', description: 'World object reference', icon: '🌍' },
        BanterUIPanelComponent: { category: 'misc', description: 'UI panel with haptics and sounds', icon: '📱' },
        BanterAvatarPedestalComponent: { category: 'misc', description: 'Ready Player Me avatar display', icon: '🧍' }
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
    CharacterJointComponent,
    FixedJointComponent,
    HingeJointComponent,
    SpringJointComponent,
    BanterGrabbableComponent,
    BanterUIPanelComponent,
    BanterAvatarPedestalComponent,
    BanterTorusKnotComponent,
    BanterAppleComponent,
    BanterCatenoidComponent,
    BanterFermetComponent,
    BanterHelicoidComponent,
    BanterHornComponent,
    BanterKleinComponent,
    BanterMobiusComponent,
    BanterMobius3dComponent,
    BanterNaticaComponent,
    BanterPillowComponent,
    BanterScherkComponent,
    BanterSnailComponent,
    BanterSpiralComponent,
    BanterSpringComponent,
    MonoBehaviorComponent
};
