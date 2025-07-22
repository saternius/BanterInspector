let basePath = window.location.hostname === 'localhost'? '..' : `${window.repoUrl}/js`;
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);
const { Slot } = await import(`${basePath}/components/slot.js`);
const { TransformComponent } = await import(`${basePath}/components/transform.js`);
const { MonoBehaviorComponent } = await import(`${basePath}/components/monobehavior.js`);
const { BanterGeometryComponent } = await import(`${basePath}/components/geometry.js`);
const { BanterMaterialComponent } = await import(`${basePath}/components/material.js`);
const { BanterRigidbodyComponent } = await import(`${basePath}/components/rigidbody.js`);
const { BanterAudioSourceComponent } = await import(`${basePath}/components/audio-source.js`);
const { BanterVideoPlayerComponent } = await import(`${basePath}/components/video-player.js`);
const { BanterTextComponent } = await import(`${basePath}/components/text.js`);
const { BoxColliderComponent } = await import(`${basePath}/components/box-collider.js`);
const { SphereColliderComponent } = await import(`${basePath}/components/sphere-collider.js`);
const { CapsuleColliderComponent } = await import(`${basePath}/components/capsule-collider.js`);
const { MeshColliderComponent } = await import(`${basePath}/components/mesh-collider.js`);
const { BanterBillboardComponent } = await import(`${basePath}/components/billboard.js`);
const { BanterGrabHandleComponent } = await import(`${basePath}/components/grab-handle.js`);
const { BanterSyncedObjectComponent } = await import(`${basePath}/components/synced-object.js`);
const { BanterPhysicMaterialComponent } = await import(`${basePath}/components/physic-material.js`);
const { BanterMirrorComponent } = await import(`${basePath}/components/mirror.js`);
const { BanterBrowserComponent } = await import(`${basePath}/components/browser.js`);
const { BanterHeldEventsComponent } = await import(`${basePath}/components/held-events.js`);
const { BanterAttachedObjectComponent } = await import(`${basePath}/components/attached-object.js`);
const { BanterGLTFComponent } = await import(`${basePath}/components/gltf.js`);
const { BanterAssetBundleComponent } = await import(`${basePath}/components/asset-bundle.js`);
const { BanterPortalComponent } = await import(`${basePath}/components/portal.js`);


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
    MonoBehaviorComponent
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
    [MonoBehaviorComponent]: "MonoBehavior"
}


export const componentBundleMap = {
    "BanterGeometry": ['BanterMaterial'],
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
    MonoBehaviorComponent
};
