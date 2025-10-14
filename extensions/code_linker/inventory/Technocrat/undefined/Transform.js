//oewpsddsdf
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
        let lastSelected = SM.selectedEntity;
        gizmo = await LoadItem(gizmoItemName, `People/${user}`)
        SM.selectEntity(lastSelected);
        setTimeout(async ()=>{  
            if(gizmo){
                await gizmo.Set("name", "Gizmo")
            }else{
                log('transform', "Gizmo is null");
            }
        }, 2000)
    }
    entity.components[0]._bs.Q([13])
    setTimeout(()=>{
        gizmo.getTransform().Set("localPosition", entity.components[0]._bs._position);
    }, 100)
}

window.addEventListener('entitySelected', onEntitySelected);