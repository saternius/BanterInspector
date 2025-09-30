this.default = {}

let getEntity = (entityPath)=>{
    let rel_path = this._entity.parentId+"/"+entityPath
    return SM.getEntityById(rel_path)
}


let user = SM.myName()
let held = false;
let lastParent = "Scene";
this.onStart = ()=>{
    let user = SM.myName()
    this._entity._bs.On("click", async (e) => {
        if(held){
            await this._entity.SetParent(lastParent)
            let transform = this._entity.getTransform()
            await transform._bs.Q([13])
            await transform.Set("localPosition", transform._bs._position)
            await transform.Set("localRotation", transform._bs._rotation)
        }else{
            console.log("click", e.detail)
            let tippyHolderPath = "People/"+user+"/Trackers/RIGHT_HAND/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
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