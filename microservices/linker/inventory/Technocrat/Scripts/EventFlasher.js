this.default = {
    eventName: {
        "type": "string",
        "value": "button-clicked",
    },
    tag: { 
        "type": "string",
        "value": "play"
    },
    on:{
        "type": "color",
        "value": {r:1,g:1,b:1,a:1}
    },
    off:{
        "type": "color",
        "value": {r:0,g:0,b:0,a:1}
    },
    permanent:{
        "type": "boolean",
        "value": false
    },
    duration:{
        "type": "number",
        "value": 500
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
            material.Set("color", this.vars.on.value)
            if(!this.vars.permanent.value){
                setTimeout(() => {
                    material.Set("color", this.vars.off.value)
                }, this.vars.duration.value)
            }
        }
    }
}

this.onStart = ()=>{
    log("eventFlasher", "onStart")
    material = this._entity.getComponent("Material")
    window.addEventListener(this.vars.eventName.value, this.handleEvent)
}

this.onDestroy = ()=>{
    window.removeEventListener(this.vars.eventName.value, this.handleEvent)
}
