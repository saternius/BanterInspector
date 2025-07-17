let basePath = window.location.hostname === 'localhost'? '..' : 'https://cdn.jsdelivr.net/gh/saternius/BanterInspector/js'; 
const { SlotComponent } = await import(`${basePath}/components/slot-component.js`);
const { TransformComponent } = await import(`${basePath}/components/transform-component.js`);
const { Slot } = await import(`${basePath}/components/slot.js`);




export const SUPPORTED_COMPONENTS = new Set([
    BS.ComponentType.Transform
]);

export const componentTypeMap = {
    "Transform": TransformComponent,
}

export const componentBSTypeMap = {
    [BS.ComponentType.Transform]: TransformComponent,
}
window.componentBSTypeMap = componentBSTypeMap;

export { Slot, SlotComponent, TransformComponent };
