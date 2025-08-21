this.default = {}

let attached = false;
this.onStart = async ()=>{
    if(!attached){
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
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}