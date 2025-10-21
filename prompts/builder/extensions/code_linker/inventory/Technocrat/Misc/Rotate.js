
this.onStart = ()=>{
}

this.onUpdate = ()=>{
    let currentRot = this._entity.Get("localRotation")
    this._entity.Set("localRotation", {
        x: currentRot.x + 1,
        y: currentRot.y,
        z: currentRot.z,
        w: currentRot.w
    })
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}
