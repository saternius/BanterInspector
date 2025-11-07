this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})


this.onStart = ()=>{
    this._entity.getTransform().Set("localPosition", {
        x: 0,
        y: 1,
        z: 0
    })
}

this.onUpdate = ()=>{
    this._entity.getTransform().Add("localRotation", {
        x: 1,
        y: 1,
        z: 1
    })
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}