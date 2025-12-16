import { EntityComponent } from './entity-component.js';
import { Entity } from '../entity.js';
import { TransformComponent } from './transform.js';
import { ScriptRunnerComponent } from './scriptrunner.js';
import { ScriptAssetComponent } from './script.js';
import { GeometryComponent } from './meshes/geometry.js';
import { MaterialComponent } from './materials/material.js';
import { RigidbodyComponent } from './physics/rigidbody.js';
import { AudioSourceComponent } from './media/audio-source.js';
import { VideoPlayerComponent } from './media/video-player.js';
import { TextComponent } from './meshes/text.js';
import { BoxColliderComponent } from './physics/box-collider.js';
import { SphereColliderComponent } from './physics/sphere-collider.js';
import { CapsuleColliderComponent } from './physics/capsule-collider.js';
import { MeshColliderComponent } from './physics/mesh-collider.js';
import { BillboardComponent } from './misc/billboard.js';
import { GrabHandleComponent } from './behaviors/grab-handle.js';
import { SyncedObjectComponent } from './behaviors/synced-object.js';
import { PhysicMaterialComponent } from './materials/physic-material.js';
import { MirrorComponent } from './misc/mirror.js';
import { BrowserComponent } from './misc/browser.js';
import { HeldEventsComponent } from './behaviors/held-events.js';
import { AttachedObjectComponent } from './behaviors/attached-object.js';
import { GLTFComponent } from './media/gltf.js';
import { AssetBundleComponent } from './misc/asset-bundle.js';
import { PortalComponent } from './misc/portal.js';
import { ColliderEventsComponent } from './behaviors/collider-events.js';
import { BoxComponent } from './meshes/box.js';
import { CircleComponent } from './meshes/circle.js';
import { ConeComponent } from './meshes/cone.js';
import { CylinderComponent } from './meshes/cylinder.js';
import { PlaneComponent } from './meshes/plane.js';
import { RingComponent } from './meshes/ring.js';
import { SphereComponent } from './meshes/sphere.js';
import { TorusComponent } from './meshes/torus.js';
import { InvertedMeshComponent } from './meshes/inverted-mesh.js';
import { KitItemComponent } from './misc/kit-item.js';
import { StreetViewComponent } from './misc/street-view.js';
import { WorldObjectComponent } from './misc/world-object.js';
import { ConfigurableJointComponent } from './physics/configurable-joint.js';
import { CharacterJointComponent } from './physics/character-joint.js';
import { FixedJointComponent } from './physics/fixed-joint.js';
import { HingeJointComponent } from './physics/hinge-joint.js';
import { SpringJointComponent } from './physics/spring-joint.js';
import { GrabbableComponent } from './behaviors/grabbable.js';
import { UIPanelComponent } from './misc/ui-panel.js';
import { AvatarPedestalComponent } from './misc/avatar-pedestal.js';
import { TorusKnotComponent } from './meshes/torus-knot.js';
import { AppleComponent } from './meshes/apple.js';
import { CatenoidComponent } from './meshes/catenoid.js';
import { FermetComponent } from './meshes/fermet.js';
import { HelicoidComponent } from './meshes/helicoid.js';
import { HornComponent } from './meshes/horn.js';
import { KleinComponent } from './meshes/klein.js';
import { MobiusComponent } from './meshes/mobius.js';
import { Mobius3dComponent } from './meshes/mobius3d.js';
import { NaticaComponent } from './meshes/natica.js';
import { PillowComponent } from './meshes/pillow.js';
import { ScherkComponent } from './meshes/scherk.js';
import { SnailComponent } from './meshes/snail.js';
import { SpiralComponent } from './meshes/spiral.js';
import { SpringComponent } from './meshes/spring.js';
import { LightComponent } from './misc/light.js';

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
    BS.ComponentType.BanterSpring,
    BS.ComponentType.Light
]);

export const componentTypeMap = {
    "Transform": TransformComponent,
    "Geometry": GeometryComponent,
    "Material": MaterialComponent,
    "Rigidbody": RigidbodyComponent,
    "AudioSource": AudioSourceComponent,
    "VideoPlayer": VideoPlayerComponent,
    "Text": TextComponent,
    "BoxCollider": BoxColliderComponent,
    "SphereCollider": SphereColliderComponent,
    "CapsuleCollider": CapsuleColliderComponent,
    "MeshCollider": MeshColliderComponent,
    "Billboard": BillboardComponent,
    "GrabHandle": GrabHandleComponent,
    "SyncedObject": SyncedObjectComponent,
    "PhysicMaterial": PhysicMaterialComponent,
    "Mirror": MirrorComponent,
    "Browser": BrowserComponent,
    "HeldEvents": HeldEventsComponent,
    "AttachedObject": AttachedObjectComponent,
    "GLTF": GLTFComponent,
    "AssetBundle": AssetBundleComponent,
    "Portal": PortalComponent,
    "ColliderEvents": ColliderEventsComponent,
    "Box": BoxComponent,
    "Circle": CircleComponent,
    "Cone": ConeComponent,
    "Cylinder": CylinderComponent,
    "Plane": PlaneComponent,
    "Ring": RingComponent,
    "Sphere": SphereComponent,
    "Torus": TorusComponent,
    "InvertedMesh": InvertedMeshComponent,
    "KitItem": KitItemComponent,
    "StreetView": StreetViewComponent,
    "WorldObject": WorldObjectComponent,
    "ConfigurableJoint": ConfigurableJointComponent,
    "CharacterJoint": CharacterJointComponent,
    "FixedJoint": FixedJointComponent,
    "HingeJoint": HingeJointComponent,
    "SpringJoint": SpringJointComponent,
    "Grabbable": GrabbableComponent,
    "UIPanel": UIPanelComponent,
    "AvatarPedestal": AvatarPedestalComponent,
    "TorusKnot": TorusKnotComponent,
    "Apple": AppleComponent,
    "Catenoid": CatenoidComponent,
    "Fermet": FermetComponent,
    "Helicoid": HelicoidComponent,
    "Horn": HornComponent,
    "Klein": KleinComponent,
    "Mobius": MobiusComponent,
    "Mobius3d": Mobius3dComponent,
    "Natica": NaticaComponent,
    "Pillow": PillowComponent,
    "Scherk": ScherkComponent,
    "Snail": SnailComponent,
    "Spiral": SpiralComponent,
    "Spring": SpringComponent,
    "Light": LightComponent,
    "ScriptRunner": ScriptRunnerComponent,
    "ScriptAsset": ScriptAssetComponent
}

window.componentTypeMap = componentTypeMap;

export const componentBSTypeMap = {
    [BS.ComponentType.Transform]: TransformComponent,
    [BS.ComponentType.BanterGeometry]: GeometryComponent,
    [BS.ComponentType.BanterMaterial]: MaterialComponent,
    [BS.ComponentType.BanterRigidbody]: RigidbodyComponent,
    [BS.ComponentType.BanterAudioSource]: AudioSourceComponent,
    [BS.ComponentType.BanterVideoPlayer]: VideoPlayerComponent,
    [BS.ComponentType.BanterText]: TextComponent,
    [BS.ComponentType.BoxCollider]: BoxColliderComponent,
    [BS.ComponentType.SphereCollider]: SphereColliderComponent,
    [BS.ComponentType.CapsuleCollider]: CapsuleColliderComponent,
    [BS.ComponentType.MeshCollider]: MeshColliderComponent,
    [BS.ComponentType.BanterBillboard]: BillboardComponent,
    [BS.ComponentType.BanterGrabHandle]: GrabHandleComponent,
    [BS.ComponentType.BanterSyncedObject]: SyncedObjectComponent,
    [BS.ComponentType.BanterPhysicMaterial]: PhysicMaterialComponent,
    [BS.ComponentType.BanterMirror]: MirrorComponent,
    [BS.ComponentType.BanterBrowser]: BrowserComponent,
    [BS.ComponentType.BanterHeldEvents]: HeldEventsComponent,
    [BS.ComponentType.BanterAttachedObject]: AttachedObjectComponent,
    [BS.ComponentType.BanterGLTF]: GLTFComponent,
    [BS.ComponentType.BanterAssetBundle]: AssetBundleComponent,
    [BS.ComponentType.BanterPortal]: PortalComponent,
    [BS.ComponentType.BanterColliderEvents]: ColliderEventsComponent,
    [BS.ComponentType.BanterBox]: BoxComponent,
    [BS.ComponentType.BanterCircle]: CircleComponent,
    [BS.ComponentType.BanterCone]: ConeComponent,
    [BS.ComponentType.BanterCylinder]: CylinderComponent,
    [BS.ComponentType.BanterPlane]: PlaneComponent,
    [BS.ComponentType.BanterRing]: RingComponent,
    [BS.ComponentType.BanterSphere]: SphereComponent,
    [BS.ComponentType.BanterTorus]: TorusComponent,
    [BS.ComponentType.BanterInvertedMesh]: InvertedMeshComponent,
    [BS.ComponentType.BanterKitItem]: KitItemComponent,
    [BS.ComponentType.BanterStreetView]: StreetViewComponent,
    [BS.ComponentType.BanterWorldObject]: WorldObjectComponent,
    [BS.ComponentType.ConfigurableJoint]: ConfigurableJointComponent,
    [BS.ComponentType.CharacterJoint]: CharacterJointComponent,
    [BS.ComponentType.FixedJoint]: FixedJointComponent,
    [BS.ComponentType.HingeJoint]: HingeJointComponent,
    [BS.ComponentType.SpringJoint]: SpringJointComponent,
    [BS.ComponentType.BanterGrabbable]: GrabbableComponent,
    [BS.ComponentType.BanterUIPanel]: UIPanelComponent,
    [BS.ComponentType.BanterAvatarPedestal]: AvatarPedestalComponent,
    [BS.ComponentType.BanterTorusKnot]: TorusKnotComponent,
    [BS.ComponentType.BanterApple]: AppleComponent,
    [BS.ComponentType.BanterCatenoid]: CatenoidComponent,
    [BS.ComponentType.BanterFermet]: FermetComponent,
    [BS.ComponentType.BanterHelicoid]: HelicoidComponent,
    [BS.ComponentType.BanterHorn]: HornComponent,
    [BS.ComponentType.BanterKlein]: KleinComponent,
    [BS.ComponentType.BanterMobius]: MobiusComponent,
    [BS.ComponentType.BanterMobius3d]: Mobius3dComponent,
    [BS.ComponentType.BanterNatica]: NaticaComponent,
    [BS.ComponentType.BanterPillow]: PillowComponent,
    [BS.ComponentType.BanterScherk]: ScherkComponent,
    [BS.ComponentType.BanterSnail]: SnailComponent,
    [BS.ComponentType.BanterSpiral]: SpiralComponent,
    [BS.ComponentType.BanterSpring]: SpringComponent,
    [BS.ComponentType.Light]: LightComponent,
    [ScriptRunnerComponent]: ScriptRunnerComponent,
    [ScriptAssetComponent]: ScriptAssetComponent
}

export const componentTextMap = {
    [BS.ComponentType.Transform]: "Transform",
    [BS.ComponentType.BanterGeometry]: "Geometry",
    [BS.ComponentType.BanterMaterial]: "Material",
    [BS.ComponentType.BanterRigidbody]: "Rigidbody",
    [BS.ComponentType.BanterAudioSource]: "AudioSource",
    [BS.ComponentType.BanterVideoPlayer]: "VideoPlayer",
    [BS.ComponentType.BanterText]: "Text",
    [BS.ComponentType.BoxCollider]: "BoxCollider",
    [BS.ComponentType.SphereCollider]: "SphereCollider",
    [BS.ComponentType.CapsuleCollider]: "CapsuleCollider",
    [BS.ComponentType.MeshCollider]: "MeshCollider",
    [BS.ComponentType.BanterBillboard]: "Billboard",
    [BS.ComponentType.BanterGrabHandle]: "GrabHandle",
    [BS.ComponentType.BanterSyncedObject]: "SyncedObject",
    [BS.ComponentType.BanterPhysicMaterial]: "PhysicMaterial",
    [BS.ComponentType.BanterMirror]: "Mirror",
    [BS.ComponentType.BanterBrowser]: "Browser",
    [BS.ComponentType.BanterHeldEvents]: "HeldEvents",
    [BS.ComponentType.BanterAttachedObject]: "AttachedObject",
    [BS.ComponentType.BanterGLTF]: "GLTF",
    [BS.ComponentType.BanterAssetBundle]: "AssetBundle",
    [BS.ComponentType.BanterPortal]: "Portal",
    [BS.ComponentType.BanterColliderEvents]: "ColliderEvents",
    [BS.ComponentType.BanterBox]: "Box",
    [BS.ComponentType.BanterCircle]: "Circle",
    [BS.ComponentType.BanterCone]: "Cone",
    [BS.ComponentType.BanterCylinder]: "Cylinder",
    [BS.ComponentType.BanterPlane]: "Plane",
    [BS.ComponentType.BanterRing]: "Ring",
    [BS.ComponentType.BanterSphere]: "Sphere",
    [BS.ComponentType.BanterTorus]: "Torus",
    [BS.ComponentType.BanterInvertedMesh]: "InvertedMesh",
    [BS.ComponentType.BanterKitItem]: "KitItem",
    [BS.ComponentType.BanterStreetView]: "StreetView",
    [BS.ComponentType.BanterWorldObject]: "WorldObject",
    [BS.ComponentType.ConfigurableJoint]: "ConfigurableJoint",
    [BS.ComponentType.CharacterJoint]: "CharacterJoint",
    [BS.ComponentType.FixedJoint]: "FixedJoint",
    [BS.ComponentType.HingeJoint]: "HingeJoint",
    [BS.ComponentType.SpringJoint]: "SpringJoint",
    [BS.ComponentType.BanterGrabbable]: "Grabbable",
    [BS.ComponentType.BanterUIPanel]: "UIPanel",
    [BS.ComponentType.BanterAvatarPedestal]: "AvatarPedestal",
    [BS.ComponentType.BanterTorusKnot]: "TorusKnot",
    [BS.ComponentType.BanterApple]: "Apple",
    [BS.ComponentType.BanterCatenoid]: "Catenoid",
    [BS.ComponentType.BanterFermet]: "Fermet",
    [BS.ComponentType.BanterHelicoid]: "Helicoid",
    [BS.ComponentType.BanterHorn]: "Horn",
    [BS.ComponentType.BanterKlein]: "Klein",
    [BS.ComponentType.BanterMobius]: "Mobius",
    [BS.ComponentType.BanterMobius3d]: "Mobius3d",
    [BS.ComponentType.BanterNatica]: "Natica",
    [BS.ComponentType.BanterPillow]: "Pillow",
    [BS.ComponentType.BanterScherk]: "Scherk",
    [BS.ComponentType.BanterSnail]: "Snail",
    [BS.ComponentType.BanterSpiral]: "Spiral",
    [BS.ComponentType.BanterSpring]: "Spring",
    [BS.ComponentType.Light]: "Light",
    [ScriptRunnerComponent]: "ScriptRunner",
    [ScriptAssetComponent]: "ScriptAsset"
}


export const componentBundleMap = {
    "Geometry": ['Material'],
    "BoxCollider": ['ColliderEvents'],
    "SphereCollider": ['ColliderEvents'],
    "CapsuleCollider": ['ColliderEvents'],
    "MeshCollider": ['ColliderEvents'],
    "Box": ['Material'],
    "Cylinder": ['Material'],
    // "Circle": ['Material'],
    // "Cone": ['Material'],
    // "Plane": ['Material'],
    // "Ring": ['Material'],
    // "Sphere": ['Material'],
    // "Torus": ['Material']
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
 *   - Get component by name: ComponentRegistry.getByName('Box')
 *   - Get components by category: ComponentRegistry.getByCategory('meshes')
 *   - Check layer definitions: ComponentRegistry.layers
 */
window.ComponentRegistry = {
    // All component class constructors
    classes: {
        Entity,
        EntityComponent,
        TransformComponent,
        ScriptRunnerComponent,
        // Meshes/Geometry
        GeometryComponent,
        BoxComponent,
        CircleComponent,
        ConeComponent,
        CylinderComponent,
        PlaneComponent,
        RingComponent,
        SphereComponent,
        TorusComponent,
        TorusKnotComponent,
        InvertedMeshComponent,
        TextComponent,
        AppleComponent,
        CatenoidComponent,
        FermetComponent,
        HelicoidComponent,
        HornComponent,
        KleinComponent,
        MobiusComponent,
        Mobius3dComponent,
        NaticaComponent,
        PillowComponent,
        ScherkComponent,
        SnailComponent,
        SpiralComponent,
        SpringComponent,
        // Materials
        MaterialComponent,
        PhysicMaterialComponent,
        // Physics
        RigidbodyComponent,
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
        AudioSourceComponent,
        VideoPlayerComponent,
        GLTFComponent,
        // Behaviors
        GrabHandleComponent,
        GrabbableComponent,
        SyncedObjectComponent,
        HeldEventsComponent,
        AttachedObjectComponent,
        ColliderEventsComponent,
        // Misc
        BillboardComponent,
        MirrorComponent,
        BrowserComponent,
        AssetBundleComponent,
        PortalComponent,
        KitItemComponent,
        StreetViewComponent,
        WorldObjectComponent,
        UIPanelComponent,
        AvatarPedestalComponent,
        LightComponent
    },

    // Component metadata organized by category
    metadata: {
        // Core
        Entity: { category: 'core', description: 'Entity/GameObject class', icon: '📦' },
        EntityComponent: { category: 'core', description: 'Base component class', icon: '🧩' },
        TransformComponent: { category: 'core', description: 'Position, rotation, scale', icon: '📐' },
        ScriptRunnerComponent: { category: 'scripting', description: 'Script execution component', icon: '📜' },

        // Meshes/Geometry
        GeometryComponent: { category: 'meshes', description: 'Generic geometry component', icon: '🔷' },
        BoxComponent: { category: 'meshes', description: 'Box/cube primitive', icon: '◼️' },
        CircleComponent: { category: 'meshes', description: 'Circle primitive', icon: '⭕' },
        ConeComponent: { category: 'meshes', description: 'Cone primitive', icon: '🔺' },
        CylinderComponent: { category: 'meshes', description: 'Cylinder primitive', icon: '🥫' },
        PlaneComponent: { category: 'meshes', description: 'Flat plane primitive', icon: '▬' },
        RingComponent: { category: 'meshes', description: 'Ring/torus primitive', icon: '⭕' },
        SphereComponent: { category: 'meshes', description: 'Sphere primitive', icon: '⚪' },
        TorusComponent: { category: 'meshes', description: 'Torus/donut primitive', icon: '🍩' },
        TorusKnotComponent: { category: 'meshes', description: 'Torus knot geometry', icon: '🍩' },
        InvertedMeshComponent: { category: 'meshes', description: 'Inverted mesh (inside-out)', icon: '🔄' },
        TextComponent: { category: 'meshes', description: '3D text mesh', icon: '📝' },
        AppleComponent: { category: 'meshes', description: 'Apple parametric surface', icon: '🍎' },
        CatenoidComponent: { category: 'meshes', description: 'Catenoid minimal surface', icon: '🌀' },
        FermetComponent: { category: 'meshes', description: 'Fermat spiral surface', icon: '🌀' },
        HelicoidComponent: { category: 'meshes', description: 'Helicoid minimal surface', icon: '🌀' },
        HornComponent: { category: 'meshes', description: 'Horn/trumpet surface', icon: '📯' },
        KleinComponent: { category: 'meshes', description: 'Klein bottle surface', icon: '🌀' },
        MobiusComponent: { category: 'meshes', description: 'Möbius strip', icon: '♾️' },
        Mobius3dComponent: { category: 'meshes', description: '3D Möbius surface', icon: '♾️' },
        NaticaComponent: { category: 'meshes', description: 'Seashell-like surface', icon: '🐚' },
        PillowComponent: { category: 'meshes', description: 'Pillow-shaped surface', icon: '🛏️' },
        ScherkComponent: { category: 'meshes', description: 'Scherk minimal surface', icon: '🌀' },
        SnailComponent: { category: 'meshes', description: 'Snail shell surface', icon: '🐌' },
        SpiralComponent: { category: 'meshes', description: 'Spiral surface', icon: '🌀' },
        SpringComponent: { category: 'meshes', description: 'Spring/helix surface', icon: '🔩' },

        // Materials
        MaterialComponent: { category: 'materials', description: 'Material properties (color, texture)', icon: '🎨' },
        PhysicMaterialComponent: { category: 'materials', description: 'Physics material (friction, bounce)', icon: '⚙️' },

        // Physics
        RigidbodyComponent: { category: 'physics', description: 'Physics simulation', icon: '💫' },
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
        AudioSourceComponent: { category: 'media', description: 'Audio playback', icon: '🔊' },
        VideoPlayerComponent: { category: 'media', description: 'Video playback', icon: '📹' },
        GLTFComponent: { category: 'media', description: 'GLTF 3D model loader', icon: '🎭' },

        // Behaviors
        GrabHandleComponent: { category: 'behaviors', description: 'Grabbable object', icon: '✋' },
        GrabbableComponent: { category: 'behaviors', description: 'Advanced grab mechanics with VR controller integration', icon: '🤲' },
        SyncedObjectComponent: { category: 'behaviors', description: 'Multi-user synchronization', icon: '🔄' },
        HeldEventsComponent: { category: 'behaviors', description: 'Events when object is held', icon: '🤝' },
        AttachedObjectComponent: { category: 'behaviors', description: 'Attach to player or object', icon: '📌' },
        ColliderEventsComponent: { category: 'behaviors', description: 'Collision/trigger events', icon: '💥' },

        // Misc
        BillboardComponent: { category: 'misc', description: 'Always face camera', icon: '👁️' },
        MirrorComponent: { category: 'misc', description: 'Reflective mirror surface', icon: '🪞' },
        BrowserComponent: { category: 'misc', description: 'Embedded web browser', icon: '🌐' },
        AssetBundleComponent: { category: 'misc', description: 'Load Unity asset bundles', icon: '📦' },
        PortalComponent: { category: 'misc', description: 'Portal to another space', icon: '🚪' },
        KitItemComponent: { category: 'misc', description: 'Kit item reference', icon: '🎁' },
        StreetViewComponent: { category: 'misc', description: 'Google Street View integration', icon: '🗺️' },
        WorldObjectComponent: { category: 'misc', description: 'World object reference', icon: '🌍' },
        UIPanelComponent: { category: 'misc', description: 'UI panel with haptics and sounds', icon: '📱' },
        AvatarPedestalComponent: { category: 'misc', description: 'Ready Player Me avatar display', icon: '🧍' },
        LightComponent: { category: 'misc', description: 'Light source (directional, point, spot)', icon: '💡' }
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
     * @param {string} name - Component name (e.g., 'Box')
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
    GeometryComponent,
    MaterialComponent,
    RigidbodyComponent,
    AudioSourceComponent,
    VideoPlayerComponent,
    TextComponent,
    BoxColliderComponent,
    SphereColliderComponent,
    CapsuleColliderComponent,
    MeshColliderComponent,
    BillboardComponent,
    GrabHandleComponent,
    SyncedObjectComponent,
    PhysicMaterialComponent,
    MirrorComponent,
    BrowserComponent,
    HeldEventsComponent,
    AttachedObjectComponent,
    GLTFComponent,
    AssetBundleComponent,
    PortalComponent,
    ColliderEventsComponent,
    BoxComponent,
    CircleComponent,
    ConeComponent,
    CylinderComponent,
    PlaneComponent,
    RingComponent,
    SphereComponent,
    TorusComponent,
    InvertedMeshComponent,
    KitItemComponent,
    StreetViewComponent,
    WorldObjectComponent,
    ConfigurableJointComponent,
    CharacterJointComponent,
    FixedJointComponent,
    HingeJointComponent,
    SpringJointComponent,
    GrabbableComponent,
    UIPanelComponent,
    AvatarPedestalComponent,
    TorusKnotComponent,
    AppleComponent,
    CatenoidComponent,
    FermetComponent,
    HelicoidComponent,
    HornComponent,
    KleinComponent,
    MobiusComponent,
    Mobius3dComponent,
    NaticaComponent,
    PillowComponent,
    ScherkComponent,
    SnailComponent,
    SpiralComponent,
    SpringComponent,
    LightComponent,
    ScriptRunnerComponent,
    ScriptAssetComponent
};
