this.default = {}

let user = SM.myName()
let gizmoItemName = "Glizzmo"
async function onEntitySelected(e){
    if(e.detail.entityId.startsWith(`People/${user}/${gizmoItemName}`)){
        return;
    }

    log('transform', 'Entity selected:', e.detail.entityId);
//    clearBoundingBoxVisual();
    let entity = SM.getEntityById(e.detail.entityId);
    if(!entity){
        log('transform', "Selected entity not found");
    }
    let gizmo = SM.getEntityById(`People/${user}/Gizmo`);
    if(!gizmo){
        log('transform', "Transform entity not found, loading...");
        gizmo = await LoadItem(gizmoItemName, `People/${user}`)
        await gizmo.Set("name", "Gizmo")
    }
    entity.components[0]._bs.Q([13])
    setTimeout(()=>{
        gizmo.Set("localPosition", entity.components[0]._bs._position);
    }, 100)
}

window.addEventListener('entitySelected', onEntitySelected);