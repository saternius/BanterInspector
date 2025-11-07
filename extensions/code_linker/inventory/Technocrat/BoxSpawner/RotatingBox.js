this.vars = {
    "rotationSpeed": {
        "type": "number",
        "value": 1
    }
}

this.updateVars = ()=>{
    Object.keys(this.vars).forEach(v=>{
        this[v] = this.vars[v].value
    })
}

this.onStart = ()=>{
    this.log("[Start]")
    this.transform = this._entity.getTransform()
    this.updateVars()
}

this.onUpdate = ()=>{
    //this.log("update")
    this.transform.Add("localRotation", {
        x: this.rotationSpeed,
        y: this.rotationSpeed,
        z: this.rotationSpeed
    })
}

this.onDestroy = ()=>{
    this.log("onDestroy")
}