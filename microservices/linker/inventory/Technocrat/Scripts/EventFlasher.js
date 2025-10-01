this.default = {
    eventName: {
        "type": "string",
        "value": "button-clicked"
    },
    tag: { 
        "type": "string",
        "value": "play"
    }
}

Object.entries(this.default).forEach(([key, val])=>{
    if(!this.vars[key]){
        this.vars[key] = val
    }
})    

let material = null;
this.handleEvent = (e) => {
    log("eventFlasher", "handleEvent", e.detail.flag)
    if (e.detail.flag === this.vars.tag.value) {
        if(material){
            material.Set("color", {r:1,g:0,b:0,a:1})
            setTimeout(() => {
                material.Set("color", {r:0,g:0,b:0,a:1})
            }, 500)
        }
    }
}

this.onStart = ()=>{
    log("eventFlasher", "onStart")
    material = this._entity.getComponent("BanterMaterial")
    window.addEventListener(this.vars.eventName.value, this.handleEvent)
}

this.onDestroy = ()=>{
    window.removeEventListener(this.vars.eventName.value, this.handleEvent)
}
