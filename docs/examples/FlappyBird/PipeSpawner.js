let v = (str)=>{
    if(!this.vars[str]){
        console.log(`VARIABLE [${str}] is not defined in $vars`)
    }
    return this.vars[str].value
}

let loadItem = async (itemRef, target) =>{
    if(target === "_self") target = this._slot.id
    if(target === undefined) target = "Root"
    return await LoadItem(itemRef, target)
}

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

let getSlotByName = (slotName) =>{
    return SM.getAllSlots().find(x=>x.name === slotName)
}


let spawnPipe = async ()=>{
    console.log("SPAWNING PIPE", SM.myName())
    let item = await loadItem('PipeHurdleF', "_self")
    item._isPipe = true;
    let monoBehavior = item.getComponent("MonoBehavior")
    try{
        let mScript = monoBehavior.ctx
        mScript.setSpeed(this.speed/20)
    }catch(e){
        console.log(e)
        console.log("MONOBEHAVIOR => ",monoBehavior)
    }
    
    if(!item){
        console.log("could not load item => "+name)
        return
    }
    return item;
}



this.speed = 1;
this.start = ()=>{
    clearTimeout(this.spawnerTimeout)
    let run = ()=>{
        console.log("RUNNING", (Date.now()+"").slice(8))
        if(this.speed === 0) return;
        this.spawnerTimeout = setTimeout(async ()=>{
            await spawnPipe()
            console.log("FINISHED AWAITING", (Date.now()+"").slice(8))
            run()
        }, (2000/this.speed))
    }
    this.setSpeed(1)
    run();
}


this.setSpeed = (s)=>{
    this.speed = s;
    this._slot.children.forEach(child=>{
        if(child._isPipe){
            let mScript = child.getComponent("MonoBehavior").ctx
            console.log(mScript)
            mScript.setSpeed(s/20)
        }
    })
}

this.stop = ()=>{
    clearTimeout(this.spawnerTimeout)
    this.setSpeed(0)
}

this.clear = ()=>{
    console.log("clearing children", this._slot.children)
    this._slot.children.forEach(child=>{
        if(child._isPipe){
            deleteSlot(child)
        }
    })
}
