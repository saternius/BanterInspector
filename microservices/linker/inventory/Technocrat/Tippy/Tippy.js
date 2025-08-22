this.default = {}

let GetObjectGlobalTransform = (objectName)=>{
    scene.SendToVisualScripting('globalTransform', objectName);
}

let attached = this._entity.components.map(x=>x.type).includes("BanterAttachedObject")
this.onStart = async ()=>{
    if(attached) return;
    console.log("Tippy onStart")
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
        await this._entity.getTransform().Set("localPosition", {x: 0, y: 0, z: 0});
        await AddComponent(this._entity.id, "BanterAttachedObject", {
            componentProperties:{
                uid: scene.localUser.uid,
                attachmentPoint: 3, //right hand
            }
        })
        console.log("setting it")
        this._entity._bs.listeners.get("click").clear();
        await this._entity.Set("name", "Tippy_"+scene.localUser.name);
        attached = true;
    })
}


this.globalPos = {x: 0, y: 0, z: 0}
this.globalRot = {x: 0, y: 0, z: 0}
this.globalProps = (name, globalPos, globalRot) =>{
    if(name === this._entity.name){
        this.globalPos = globalPos
        this.globalRot = globalRot
    }
}

let tippyTransform = this._entity.getTransform()
this.onUpdate = ()=>{
    //console.log("onUpdate")
    //GetObjectGlobalTransform(this._entity.name)
    tippyTransform._bs.Q([13])
    //console.log(tippyTransform._bs._localRotation)
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}