let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
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
    [MonoBehaviorComponent]: MonoBehaviorComponent
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
    MonoBehaviorComponent
};
