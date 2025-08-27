this.default = {}

let getEntity = (entityPath)=>{
    let rel_path = this._entity.parentId+"/"+entityPath
    return SM.getEntityById(rel_path)
}


let user = SM.myName()
let held = false;
// let holdingBarHack = ()=>{
//     let barHack = SM.getEntityById("People/"+user+"/BarHack")
//     if(barHack){
//         let heldEvents = barHack.getComponent("BanterHeldEvents")
//         log("mirror", "heldEvents => ", heldEvents)
//         heldEvents.Set("blockRightThumbstick", held)
//     }
// }

let lastParent = "Scene";
this.onStart = ()=>{
    let user = SM.myName()
    this._entity._bs.On("click", async (e) => {
        if(held){
            this._entity.SetParent(lastParent)
        }else{
            console.log("click", e.detail.point)
            let tippyHolderPath = "People/"+user+"/Tippy_"+user+"/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`tippy => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: Tippy not found")
                return;
            }
            tippyHolder.getTransform().Set("position", e.detail.point)
            lastParent = this._entity.parentId;
            this._entity.SetParent(tippyHolderPath)
        }
        held = !held;
        // holdingBarHack()
    })
}

this.onUpdate = ()=>{
}

this.onDestroy = ()=>{
    this._entity._bs.listeners.get("click").clear();
}