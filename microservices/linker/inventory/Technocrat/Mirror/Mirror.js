this.default = {}

let getEntity = (entityPath)=>{
    let rel_path = this._entity.parentId+"/"+entityPath
    //console.log("rel_path => ", rel_path)
    return SM.getEntityById(rel_path)
}

let held = false;
this.onStart = ()=>{
    let user = SM.myName()
    this._entity._bs.On("click", async (e) => {
        if(held){
            this._entity.SetParent("Scene")
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
            this._entity.SetParent(tippyHolderPath)
        }
        held = !held;
    })
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}