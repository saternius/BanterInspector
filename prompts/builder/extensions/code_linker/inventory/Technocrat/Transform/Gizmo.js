this.default = {}
let gizmo = null;
let transformEntity = null;
let scaleEntity = null;
let rotationEntity = null;
this.onLoaded = async ()=>{
    log("gizmo", "onStart: ", this._entity.parentId)
    if(!this._entity.parentId.startsWith(`People/${SM.myName()}`)){
        log("gizmo", "Not my gizmo, ignoring")
        return;
    }
    let gizmoToggle = document.getElementById("gizmoToggle")
    if(!gizmoToggle){
        log("gizmo", "Gizmo toggle not found, creating...")
        let navControls = document.querySelector(".nav-controls")
        let gizmoToggle = document.createElement("button")
        gizmoToggle.classList.add("nav-control-btn")
        gizmoToggle.innerHTML = "<span>✣</span>"
        gizmoToggle.id = "gizmoToggle"
        gizmoToggle.style.background = "#0c4551"
        navControls.appendChild(gizmoToggle)
        gizmoToggle.addEventListener("click", ()=>{
            log("gizmo", "Gizmo toggle clicked")
            let gizmo = SM.getEntityById(`People/${SM.myName()}/Gizmo`)
            if(gizmo){
                gizmo.Set("active", !gizmo.active)
                if(gizmo.active){
                    gizmoToggle.style.background = "#0c4551"
                }else{
                    gizmoToggle.style.background = "rgba(255, 255, 255, 0.12)"
                }
            }
        })
    }
    console.log(this._entity.children)
    transformEntity = this._entity.children[0]
    scaleEntity = this._entity.children[1]
    rotationEntity = this._entity.children[2]
    scaleEntity.Set("active", false)
    rotationEntity.Set("active", false)
    transformEntity.Set("active", true)
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}