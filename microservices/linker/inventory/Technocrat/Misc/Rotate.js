
this.onStart = ()=>{
    this.transform = this._entity.getTransform()
}

this.onUpdate = ()=>{
    this.transform.Add("localRotation", {
        x: 1,
        y: 0,
        z: 0
    })
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}
