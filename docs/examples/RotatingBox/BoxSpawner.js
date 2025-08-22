this.default = {
    "entityRef": {
        "type": "string",
        "value": ""
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})


let v = (str)=>{
    if(!this.vars[str]){
        console.log(`VARIABLE [${str}] is not defined in $vars`)
    }
    return this.vars[str].value
}

let loadItem = async (itemRef, target) =>{
    if(target === "_self") target = this._entity.id
    if(target === undefined) target = "Scene"
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

let spawner_active = false
function handleKey(e){
    if(e.code === "Numpad9"){
        console.log(e)
        let boxYard = getEntityByName("BoxSpawner")
        boxYard.children.forEach(entity=>{
            deleteEntity(entity)
        })
    }
    if(e.code === "Numpad7"){
        spawner_active = !spawner_active
        let box = getEntityByName("Box")
        let mat_id = box.getComponent("BanterMaterial").id
        let target_color = (spawner_active) ? {r:1,g:0,b:0,a:1}:{r:1,g:1,b:1,a:1}
        SetComponentProp(mat_id, "color", target_color)
    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


this.onStart = ()=>{
    console.log("onStart")
    document.addEventListener("keydown", handleKey)
    this.spawnerTimeout = setInterval(async ()=>{
        if(!spawner_active) return;
        let name = v('entityRef')
        console.log(`Spawning [${name}]`)
        let item = await loadItem(name, "_self")
        if(!item){
            console.log("could not load item => "+name)
            return
        }
        console.log(item)
        let itemTransform = item.getTransform()
        await itemTransform.Add("localPosition", 
                          {
                            x: Math.random()*8 - 4,
                            y: Math.random()*4,
                            z: Math.random()*8 - 4
                          }
                         )
        await itemTransform.Multiply("localScale",
                                    {
                                        x: Math.random()*.5+.25,
                                        y: Math.random()*.5+.25,
                                        z: Math.random()*.5+.25
                                    }
                                   )
        let material = item.getComponent("BanterMaterial")
        console.log('material: ', material)
        let target_color = {r:Math.random(),g:Math.random(),b:Math.random(),a:1}
        SetComponentProp(material.id, "color", target_color)
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


