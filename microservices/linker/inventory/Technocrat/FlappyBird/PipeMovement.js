this.speed = .005;
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
    RemoveEntity(slot)
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
    await this._entity.Set("localPosition", {x:0,y:Math.random()*2.5,z:6})
    this.started = true;
    let parent = SM.getEntityById(this._entity.parentId)
    let pipeSpawner = parent.getComponent("MonoBehavior").ctx
    this.speed = pipeSpawner.speed/20
}

this.onUpdate = ()=>{
    if(!this.started) return;
    if(this.speed === 0) return;

    let currentPos = this._entity.Get("localPosition")
    this._entity.Set("localPosition", {
        x: currentPos.x,
        y: currentPos.y,
        z: currentPos.z - this.speed
    })
    let zPos = this._entity.Get("localPosition").z;
    if(zPos < 0 && !this.scored){
        score()
    }

    if(zPos < -6){
        deleteSlot(this._entity)
    }
}

this.onDestroy = ()=>{
    console.log("onDestroy")
}
