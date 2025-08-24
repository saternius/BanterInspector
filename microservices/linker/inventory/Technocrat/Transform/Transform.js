this.default = {}


async function onEntitySelected(e){
    log('transform', 'Entity selected:', e.detail.entityId);
    let entity = SM.getEntityById(e.detail.entityId);
    if(!entity){
        log('transform', "Selected entity not found");
    }
    let transform = SM.getEntityById("Scene/Transform");
    if(!transform){
        log('transform', "Transform entity not found, loading...");
        await LoadItem("Transform", "Scene")
    }
    entity.components[0]._bs.Q([13])
    setTimeout(()=>{
        transform.getTransform().Set("localPosition", entity.components[0]._bs._position);
    }, 100)
}

window.addEventListener('entitySelected', onEntitySelected);