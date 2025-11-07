this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let user = SM.myName()
this.onStart = ()=>{
    this._entity._bs.On("grab", async (e) => {
        log("barhack", "grabbed")
        this._entity.SetParent("People/"+user)
    })
    this._entity._bs.On("drop", async (e) => {
        log("barhack", "dropped")
        this._entity.SetParent("Scene")
    })
    this._entity._bs.On("thumbstick", async (e) => {
        log("barhack", "thumbstick", e.detail.point)
    })
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("grab").clear();
    this._entity._bs.listeners.get("drop").clear();
}