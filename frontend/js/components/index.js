const { SlotComponent } = await import(`${window.repoUrl}/components/slot-component.js`);
const { Slot } = await import(`${window.repoUrl}/components/slot.js`);
const { TransformComponent } = await import(`${window.repoUrl}/components/transform.js`);
const { MonoBehaviorComponent } = await import(`${window.repoUrl}/components/monobehavior.js`);
const { BanterGeometryComponent } = await import(`${window.repoUrl}/components/geometry.js`);
const { BanterMaterialComponent } = await import(`${window.repoUrl}/components/material.js`);
const { BanterRigidbodyComponent } = await import(`${window.repoUrl}/components/rigidbody.js`);
const { BanterAudioSourceComponent } = await import(`${window.repoUrl}/components/audio-source.js`);
const { BanterVideoPlayerComponent } = await import(`${window.repoUrl}/components/video-player.js`);
const { BanterTextComponent } = await import(`${window.repoUrl}/components/text.js`);
const { BoxColliderComponent } = await import(`${window.repoUrl}/components/box-collider.js`);
const { SphereColliderComponent } = await import(`${window.repoUrl}/components/sphere-collider.js`);
const { CapsuleColliderComponent } = await import(`${window.repoUrl}/components/capsule-collider.js`);
const { MeshColliderComponent } = await import(`${window.repoUrl}/components/mesh-collider.js`);
const { BanterBillboardComponent } = await import(`${window.repoUrl}/components/billboard.js`);
const { BanterGrabHandleComponent } = await import(`${window.repoUrl}/components/grab-handle.js`);
const { BanterSyncedObjectComponent } = await import(`${window.repoUrl}/components/synced-object.js`);
const { BanterPhysicMaterialComponent } = await import(`${window.repoUrl}/components/physic-material.js`);
const { BanterMirrorComponent } = await import(`${window.repoUrl}/components/mirror.js`);
const { BanterBrowserComponent } = await import(`${window.repoUrl}/components/browser.js`);
const { BanterHeldEventsComponent } = await import(`${window.repoUrl}/components/held-events.js`);
const { BanterAttachedObjectComponent } = await import(`${window.repoUrl}/components/attached-object.js`);
const { BanterGLTFComponent } = await import(`${window.repoUrl}/components/gltf.js`);
const { BanterAssetBundleComponent } = await import(`${window.repoUrl}/components/asset-bundle.js`);
const { BanterPortalComponent } = await import(`${window.repoUrl}/components/portal.js`);
const { BanterColliderEventsComponent } = await import(`${window.repoUrl}/components/collider-events.js`);
const { BanterBoxComponent } = await import(`${window.repoUrl}/components/box.js`);
const { BanterCircleComponent } = await import(`${window.repoUrl}/components/circle.js`);
const { BanterConeComponent } = await import(`${window.repoUrl}/components/cone.js`);
const { BanterCylinderComponent } = await import(`${window.repoUrl}/components/cylinder.js`);
const { BanterPlaneComponent } = await import(`${window.repoUrl}/components/plane.js`);
const { BanterRingComponent } = await import(`${window.repoUrl}/components/ring.js`);
const { BanterSphereComponent } = await import(`${window.repoUrl}/components/sphere.js`);
const { BanterTorusComponent } = await import(`${window.repoUrl}/components/torus.js`);
const { BanterInvertedMeshComponent } = await import(`${window.repoUrl}/components/inverted-mesh.js`);
const { BanterKitItemComponent } = await import(`${window.repoUrl}/components/kit-item.js`);
const { BanterStreetViewComponent } = await import(`${window.repoUrl}/components/street-view.js`);
const { BanterWorldObjectComponent } = await import(`${window.repoUrl}/components/world-object.js`);
const { ConfigurableJointComponent } = await import(`${window.repoUrl}/components/configurable-joint.js`);


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
    "BanterCircle": ['BanterMaterial'],
    "BanterCone": ['BanterMaterial'],
    "BanterCylinder": ['BanterMaterial'],
    "BanterPlane": ['BanterMaterial'],
    "BanterRing": ['BanterMaterial'],
    "BanterSphere": ['BanterMaterial'],
    "BanterTorus": ['BanterMaterial']
}


window.componentBSTypeMap = componentBSTypeMap;

export { 
    Slot, 
    SlotComponent, 
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
