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
            await this._entity._bs.transform.Q([13])
            await this._entity.Set("localPosition", this._entity._bs.transform._position)
            await this._entity.Set("localRotation", this._entity._bs.transform._rotation)
        }else{
            console.log("click", e.detail)
            let tippyHolderPath = "People/"+user+"/Trackers/RIGHT_HAND/Holder";
            let tippyHolder = SM.getEntityById(tippyHolderPath)
            console.log(`RIGHT_HAND HOLDER => ${tippyHolderPath}`, tippyHolder)
            if(!tippyHolder){
                showNotification("Error: RIGHT_HAND Holder not found")
                return;
            }
            await tippyHolder.Set("position", e.detail.point)
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