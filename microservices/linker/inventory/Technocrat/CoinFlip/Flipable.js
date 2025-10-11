this._entity.penny = true;
this.flip = (e)=>{
    let rigidBody = this._entity.getComponent("BanterRigidbody")
    if(!rigidBody){
        log("flipable", "NO RIGIDBODY")
        return;
    }
    rigidBody._bs.AddForce({x: 0, y: Math.random()*4+4, z: 0}, BS.ForceMode.Impulse);
    rigidBody._bs.AddTorque({x: Math.random()*2, y:Math.random()*2+1,  z: Math.random()*5+1}, BS.ForceMode.Impulse);
}


this.onStart = ()=>{
    
}

this.onDestroy = ()=>{
    this._entity._bs.listeners.get("click").delete(flip);
}
