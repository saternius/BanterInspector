this.vars = {
    "entityRef": {
        "type": "string",
        "value": ""
    }
}

let v = (str)=>{
    if(!this.vars[str]){
        console.log(`VARIABLE [${str}] is not defined in $vars`)
    }
    return this.vars[str].value
}

let loadItem = async (itemRef, target) =>{
    if(target === "_self") target = this._entity.id
    if(target === undefined) target = "Root"
    return await LoadItemChange(itemRef, target).apply()
}

let deleteEntity = async (entity) =>{
    if(typeof(entity) === "object"){
        if(!entity.id){
            console.log("ERROR: no entity id found in ", entity)
            return
        }
        entity = entity.id
    }
    EntityRemoveChange(entity).apply()
}

let getEntityByName = (entityName) =>{
    return SM.getAllEntities().find(x=>x.name === entityName)
}


function handleKey(e){
    if(e.code === "Numpad9"){
        console.log(e)
        let boxYard = SM.getAllEntities().find(x=>x.name === "BoxSpawner")
        boxYard.children.forEach(entity=>{
            deleteEntity(entity.id)
        })
    }
    if(e.code === "Numpad7"){
        let box = getEntityByName("Box")
        console.log(box)
    }
})

this.onStart = ()=>{
    console.log("onStart")
    document.addEventListener("keydown", handleKey)
    this.spawnerTimeout = setInterval(async ()=>{
        let name = v('entityRef')
        console.log(`Spawning [${name}]`)
//         let item = await this.loadItem(name, "BoxYard")
//         if(!item){
//             console.log("could not load item => "+name)
//             return
//         }
//         console.log(item)
//         let itemTransform = item.getTransform()
//         await itemTransform.Add("localPosition", 
//                           {
//                             x: Math.random()*4 - 2,
//                             y: Math.random()*2,
//                             x: Math.random()*4 - 2
//                           }
//                          )
    }, 2000)
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    clearInterval(this.spawnerTimeout)
    document.removeEventListener("keydown", handleKey)
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}


