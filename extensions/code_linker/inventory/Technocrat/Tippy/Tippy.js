this.default = {}

let attached = this._entity.components.map(x=>x.type).includes("BanterAttachedObject")
this.onStart = async ()=>{
    if(attached) return;
    console.log("Tippy onStart")
    let user = SM.myName()
    let tippyExists = SM.getEntityById("Scene/Tippy(Open)")
    if(tippyExists){
        console.log("Tippy already in scene, removing")
        showNotification("Tippy already in scene, removing")
        RemoveEntity(this._entity.id)
        return;
    }

    await this._entity.Set("name", "Tippy(Open)")
    this._entity._bs.On("click", async (e) => {
        if(attached) return;

        console.log("attaching..")
        await this._entity.SetParent('People/'+user)
        await this._entity.Set("localPosition", {x: 0, y: 0, z: 0});
        await AddComponent(this._entity.id, "BanterAttachedObject", {
            componentProperties:{
                uid: scene.localUser.uid,
                attachmentPoint: 3, //right hand
            }
        })
        log("tippy", "setsting it")
        this._entity._bs.listeners.get("click").clear();
        await this._entity.Set("name", "Tippy_"+user);
        attached = true;
        // await LoadItem("BarHack", "Scene")
    })
}


this.onUpdate = ()=>{
    //console.log("Updating tippy transform")
    this._entity._bs.transform.Q([13])
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}