let getEntity = (entityPath)=>{
    let rel_path = this._entity.parentId+"/"+entityPath
    //console.log("rel_path => ", rel_path)
    return SM.getEntityById(rel_path)
}

let getEntityScript = (entityPath, scriptName) =>{
    let entity = getEntity(entityPath)
    if(!entity){
        console.log("NO SLOT IN PATH: ", entityPath)
        return
    }
    //console.log("PIPE SLOT => ", entity)
    return entity.components.find(x=>x.type === "MonoBehavior" && x.properties.name === scriptName)
}


let getScript = async (entityPath, scriptName)=>{
    const returnWhenEntityLoaded = () => {
            return new Promise(resolve => {
              const check = () => {
                console.log("checking: ", this._running, this)
                if(!this._running){
                    resolve()
                }else{
                    const script = getEntityScript(entityPath, scriptName);
                     //console.log("SCRIPT FOUND => ", script)
                    if (script !== undefined ) {
                      resolve(script.ctx);
                    } else {
                      // try again in 100 ms
                      console.log(`Script in [${entityPath}](${scriptName}) not found from ${this._entity.id} retrying..`)
                      setTimeout(check, 100);
                    }
                }
              };
              check();
            });
          };
    return await returnWhenEntityLoaded();
}


let handleScriptUpdates = async (event)=>{
    console.log("[SCRIPT UPDATED]", event)
    if(event.detail.name === "PipeSpawner"){
        console.log("GETTING NEW PIPESPAWNER")
        pipeSpawner = await getScript("Pipes", "PipeSpawner")
        console.log("NEW PIPESPAWNER: ", pipeSpawner)
    }
}




let step_str = .75
let GROUND_FLOOR = 0
let CIELING = 4.5
let game_state = "menu"
let pipeSpawner = null;
let debugText = null;
let flying = true;
let alive = true;
let started = false;
let vy = 0;
let rotation = 0;
// let material = this._entity.getComponent("BanterMaterial")
// let mat_id = material.id
let points = 0
let speed = 1

this.default = {
    gravity: {
        type: "number",
        value: .05*step_str
    },
    jumpStrength: {
        type: "number",
        value: -.3*step_str
    },
    maxFallSpeed: {
        type: "number",
        value: 2.4*step_str
    },
    maxUpAngle:{
        type: "number",
        value: -30
    },
    maxDownAngle:{
        type: "number",
        value: 90
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let v = (str)=>{
    if(this.vars[str] === undefined){
        if(this.default[str]){
            this.vars[str] = this.default[str]
        }
        console.log(`VARIABLE [${str}] is not defined in $vars`)
    }
    return this.vars[str].value
}


function setStatus(text){
    game_state = text
    console.log("debugText=> ", debugText)
    if(debugText){
        let text_id = debugText.getComponent("BanterText").id
        SetComponentProp(text_id, "text", text)
    }
}

let die = ()=>{
    if(!alive) return;
    alive = false;
//     SetComponentProp(mat_id, "color", {r:1,g:0,b:0,a:1})
    pipeSpawner.stop()
    let ascii = "~(>.<)~\n Press R to restart"   // flustered
    if(points > 32){
        ascii = "!!!\\(>w<)/!!!"   // top tier
    }else if(points > 16){
        ascii = "!(^O^)! \n Press R to test the limit"    // super excited
    }else if(points > 8){
        ascii = "c(owo)c\n Press R to go again"    // grabby hands happy
    }else if(points > 4){
        ascii = "q(uwu)p\n Press R to do better"    // soft emotional
    }else if(points > 1){
        ascii = "(-_-#)\n Press R to keep trying"     // stinky mood
    }

    setStatus(`You made it to ${points} ${ascii}`)
}


this.jump = ()=>{
    if(alive){
        vy = v('jumpStrength')
    }
}

this.score = ()=>{
    points += 1
    setStatus(points)
}

this.reset = ()=>{
    this.transform.Set("localPosition", {x:0, y:3, z:0})
    this.transform.Set("localRotation", {x:0, y:0, z:0})
    setStatus("Press F to start")
//     SetComponentProp(mat_id, "color", {r:1,g:1,b:0,a:1})
    pipeSpawner.clear()
    alive = true
    vy = 0
    rotation = 0;
    started = false;
    points = 0
    speed = 1
}

this.startRun = ()=>{
    started = true
    flying = true
    pipeSpawner.start()
    setStatus("0")
}


let handleKey = (e)=>{
    console.log(e.code)
    if(e.code === "Numpad3"){ //Reset
        console.log("key => pip.clear")
        pipeSpawner.clear()
    }
    if(e.code === "KeyR"){
        this.reset()
    }
    if(e.code === "KeyF"){
        if(!started){
            this.startRun()
        }
        this.jump()
    }
}

this.onStart = async ()=>{
    console.log("onStart");
    pipeSpawner = await getScript("Pipes", "PipeSpawner")
    debugText = getEntity("DebugText")
    window.addEventListener('script-refreshed', handleScriptUpdates)
    window.addEventListener("keydown", handleKey)
    this.transform = this._entity.getTransform();
    this.reset();
    
}

let last_message = ""
this.onUpdate = ()=>{
    
    if(flying){
        vy = Math.min(vy + v('gravity'), v('maxFallSpeed'));
        this.transform.Add("localPosition", {
            x: 0,
            y: -vy,
            z: 0
        })
        
        const factor = 120;
        let rotation = vy * factor;
        rotation = Math.max(v('maxUpAngle'), Math.min(rotation, v('maxDownAngle')));
        this.transform.Set("localRotation", {
            z:rotation
        });
        
        if(alive){
            speed += .001
            pipeSpawner.setSpeed(speed)
            setStatus(`${points}: ${speed.toFixed(3)}`)
        }
    }
    
    
    let yPos = this.transform.properties.localPosition.y;
    message = `flying: ${flying}, vy: ${vy}, rotation: ${rotation}, yPos: ${yPos}`
    if(message !== last_message){
        last_message = message;
    }
    if(yPos < GROUND_FLOOR){
        flying = false;
        die()
    }
}

this.onDestroy = ()=>{
    window.removeEventListener("keydown", handleKey)
    window.removeEventListener('script-refreshed', handleScriptUpdates)
    this._entity._bs.listeners.get("trigger-enter").clear();
}


this._entity._bs.On("trigger-enter", (e)=>{
    console.log("[TRIGGER]", e)
    die()
})