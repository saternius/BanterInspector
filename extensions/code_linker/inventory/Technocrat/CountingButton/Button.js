//did it update?
let getChildEntity = (slotPath)=>{    
    let rel_path = this._entity.id+"/"+slotPath
    log("countingButton", "getChildEntity", rel_path)
    return SM.getEntityById(rel_path)
}


let countText = null;
let num = 0;
this.onStart = ()=>{
    console.log("onStart")
   
    let count = getChildEntity("Count")
    log("countingButton", "count", count)
    if(count){
        countText = count.getComponent("BanterText")
        log("countingButton", "countText", countText)
        countText.Set("text", "0")
        log("countingButton", "setting default text to 0")
    }

    this._entity._bs.On("click", e => {
        log("countingButton", "click", countText)
        num += 1
        countText.Set("text", `${num}`)
        log("countingButton", "setting text to", `${num}`)
    })
    
    
}

this.onUpdate = ()=>{
    //console.log("onUpdate")
}

this.onDestroy = ()=>{
    log("countingButton", "onDestroy")
    this._entity._bs.listeners.get("click").clear();
}
