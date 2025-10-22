// This is a global script thus we will use ._bs to manipulate the entity properties instead of Set() since we do not need to sync anything.
this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})



this.pop = (position)=>{
    clearInterval(this.upDriftInterval)
    this._entity._bs.active = true
    let startX = position.x
    let startY = position.y
    let startZ = position.z
    this._entity.transform.position = {x: startX, y: startY, z: startZ}
    this._entity.transform.rotation = {x: 0, y: 0, z: 0} // make it trasck player
    let upDrift = 0;
    let accel = 0.08;
    let ticks = 0;
    this.upDriftInterval = setInterval(()=>{
        upDrift += accel;
        accel = accel*.88;
        this._entity.transform.position = {x: startX, y: startY + upDrift, z: startZ}
        this._entity.getComponent("Text")._bs.color.w = 1 - upDrift
        //console.log(ticks, accel, this._entity.getComponent("Text")._bs.w)
        ticks += 1;
        if(ticks > 30){
            this.clear()
        }
    }, 40)
    
}

this.clear = ()=>{
    clearInterval(this.upDriftInterval)
    this._entity._bs.active = false
}

this.onStart = ()=>{
    //this.pop({x: 0, y: 0, z: 0})
}

this.onDestroy = ()=>{
    this.clear()
    clearInterval(this.upDriftInterval)
}
