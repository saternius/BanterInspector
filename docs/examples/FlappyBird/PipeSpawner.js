let v = (str)=>{
    if(!this.vars[str]){
        console.log(`VARIABLE [${str}] is not defined in $vars`)
    }
    return this.vars[str].value
}

let loadItem = async (itemRef, target) =>{
    if(target === "_self") target = this._entity.id
    if(target === undefined) target = "Root"
    return await LoadItem(itemRef, target)
}

let deleteEntity = async (entity) =>{ 
    if(typeof(entity) === "object"){
        if(!entity.id){
            console.log("ERROR: no entity id found in ", entity)
            return
        }
        entity = entity.id
    }
    RemoveEntity(entity)
}

let getEntityByName = (entityName) =>{
    return SM.getAllEntities().find(x=>x.name === entityName)
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
    this._entity.children.forEach(child=>{
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
    console.log("clearing children", this._entity.children)
    this._entity.children.forEach(child=>{
        if(child._isPipe){
            deleteEntity(child)
        }
    })
}
