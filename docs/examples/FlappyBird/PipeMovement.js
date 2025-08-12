this.speed = .05;
this.started = false;
this.scored = false;
let deleteSlot = async (slot) =>{ 
    if(typeof(slot) === "object"){
        if(!slot.id){
            console.log("ERROR: no slot id found in ", slot)
            return
        }
        slot = slot.id
    }
    RemoveSlot(slot)
}

let getScriptByName = (scriptName)=>{
    let mono = SM.getAllMonoBehaviors().find(m=>m.properties.name === scriptName)
    return mono.ctx
}


this.setSpeed = (speed)=>{
    this.speed = speed;
}


let score = ()=>{
    if(this.scored) return;
    this.scored = true;
    let bird = getScriptByName("Bird")
    bird.score();
}

this.onStart = async ()=>{
    this.transform = this._slot.getTransform()
    await this.transform.Set("localPosition", {x:0,y:Math.random()*2.5,z:6})
    this.started = true;
}

this.onUpdate = ()=>{
    if(!this.started) return;
    if(this.speed === 0) return;
    
    this.transform.Add("localPosition", {
        x: 0,
        y: 0,
        z: -this.speed
    })
    let zPos = this.transform.properties.localPosition.z;
    if(zPos < 0 && !this.scored){
        score()
    }
    
    if(zPos < -6){
        deleteSlot(this._slot)
    }
    //console.log("[PIPE]", this.transform.properties.localPosition)
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}
