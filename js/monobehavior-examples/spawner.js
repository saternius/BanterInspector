this.vars = {
    "slotRef": {
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

this.onStart = ()=>{
    console.log("onStart")
    
    this.spawnerTimeout = setInterval(async ()=>{
        let name = v('slotRef')
        console.log(`Spawning [${name}]`)
        let item = await this.loadItem(name)
        if(!item){
            console.log("could not load item => "+name)
            return
        }
        console.log(item)
        let itemTransform = item.getTransform()
        await itemTransform.Add("localPosition", 
                          {
                            x: Math.random()*4 - 2,
                            y: Math.random()*2,
                            x: Math.random()*4 - 2
                          }
                         )
    }, 2000)
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    clearInterval(this.spawnerTimeout)
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}