this.default = {}

let getEntity = (entityPath)=>{
    let rel_path = this._entity.parentId+"/"+entityPath
    //console.log("rel_path => ", rel_path)
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

this.onStart = ()=>{
    let user = SM.myName()
    this._entity._bs.On("click", async (e) => {
        if(held){
            this._entity.SetParent("Scene")
        }else{
            console.log("click", e.detail)
            let tippyHolderPath = "People/"+user+"/Trackers/RIGHT_HAND/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
                return;
            }
            tippyHolder.Set("position", e.detail.point)
            this._entity.SetParent(tippyHolderPath)
        }
        held = !held;
        // holdingBarHack()
    })
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}