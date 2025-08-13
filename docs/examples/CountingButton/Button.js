this.default = {}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]) this.vars[key] = val
})

let getChildEntity = (entityPath)=>{
    let rel_path = this._entity.id+"/"+entityPath
    //console.log("RelPath: ", rel_path)
    return SM.getEntityById(rel_path)
}


let countText = null;
let num = 0;
this.onStart = ()=>{
    console.log("onStart")
    this._entity._bs.On("click", e => {
        console.log("BOOP")
        num += 1
        countText.Set("text", `${num}`)
    })
    
    let count = getChildEntity("Count")
    //console.log(count)
    if(count){
        countText = count.getComponent("BanterText")
        //console.log(countText)
        countText.Set("text", "0")
    }
    
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    console.log("onDestroy")
    this._entity._bs.listeners.get("click").clear();
}

this.keyDown = (key)=>{
    console.log("keyDown", key)
}

this.keyUp = (key)=>{
    console.log("keyUp", key)
}